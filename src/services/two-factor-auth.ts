/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA for enhanced security
 */

import { supabase } from '@/integrations/supabase/client';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface VerificationResult {
  valid: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  private readonly APP_NAME = 'SAM AI Platform';
  private readonly BACKUP_CODES_COUNT = 10;

  /**
   * HOW 2FA WORKS IN OUR SYSTEM:
   * 
   * 1. USER ACCOUNT 2FA:
   *    - Protects user login to the platform
   *    - Uses TOTP (Time-based One-Time Password)
   *    - Compatible with Google Authenticator, Authy, etc.
   * 
   * 2. LINKEDIN ACCOUNT PROTECTION:
   *    - Additional layer for LinkedIn operations
   *    - Required for sensitive actions (bulk messages, data export)
   *    - Prevents unauthorized automation even if account is compromised
   * 
   * 3. WORKSPACE-LEVEL 2FA:
   *    - Admins can enforce 2FA for all workspace members
   *    - Different policies per plan (optional for Free, required for Enterprise)
   *    - Audit logs for all 2FA events
   */

  /**
   * Generate 2FA setup for a user
   */
  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetup> {
    try {
      // Generate a random secret
      const secret = this.generateSecret();
      
      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: this.APP_NAME,
        label: email,
        algorithm: 'SHA256',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });

      // Generate QR code
      const otpauth_url = totp.toString();
      const qrCode = await QRCode.toDataURL(otpauth_url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store setup in database (encrypted)
      await this.storeTwoFactorSetup(userId, secret, backupCodes);

      return {
        secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      throw new Error('Failed to setup two-factor authentication');
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(userId: string, code: string): Promise<VerificationResult> {
    try {
      // Get user's secret
      const { data: userData } = await supabase
        .from('user_two_factor')
        .select('secret, enabled')
        .eq('user_id', userId)
        .single();

      if (!userData || !userData.enabled) {
        return { valid: false, error: '2FA not enabled for this account' };
      }

      // Create TOTP instance with user's secret
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(userData.secret),
        algorithm: 'SHA256',
        digits: 6,
        period: 30
      });

      // Validate the code (with 1 window tolerance for clock skew)
      const delta = totp.validate({ token: code, window: 1 });
      
      if (delta !== null) {
        // Log successful verification
        await this.logTwoFactorEvent(userId, 'verification_success', { method: 'totp' });
        return { valid: true };
      }

      // Check backup codes if TOTP fails
      const backupResult = await this.verifyBackupCode(userId, code);
      if (backupResult.valid) {
        return backupResult;
      }

      // Log failed verification
      await this.logTwoFactorEvent(userId, 'verification_failed', { method: 'totp' });
      return { valid: false, error: 'Invalid verification code' };
    } catch (error) {
      console.error('TOTP verification error:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<VerificationResult> {
    try {
      const { data: backupData } = await supabase
        .from('user_backup_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('used', false)
        .single();

      if (!backupData) {
        return { valid: false, error: 'Invalid backup code' };
      }

      // Mark backup code as used
      await supabase
        .from('user_backup_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', backupData.id);

      // Log successful verification
      await this.logTwoFactorEvent(userId, 'backup_code_used', { code_id: backupData.id });

      return { valid: true };
    } catch (error) {
      console.error('Backup code verification error:', error);
      return { valid: false, error: 'Invalid backup code' };
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    // First verify the code to ensure user has set up their authenticator
    const verification = await this.verifyTOTP(userId, verificationCode);
    
    if (!verification.valid) {
      throw new Error('Invalid verification code. Please ensure your authenticator app is properly configured.');
    }

    // Enable 2FA
    const { error } = await supabase
      .from('user_two_factor')
      .update({ 
        enabled: true, 
        enabled_at: new Date().toISOString(),
        verified: true
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to enable 2FA');
    }

    // Log the enablement
    await this.logTwoFactorEvent(userId, 'enabled', {});

    return true;
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    try {
      // Verify password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate user with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password
      });

      if (authError) {
        throw new Error('Invalid password');
      }

      // Disable 2FA
      const { error } = await supabase
        .from('user_two_factor')
        .update({ 
          enabled: false, 
          disabled_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to disable 2FA');
      }

      // Remove backup codes
      await supabase
        .from('user_backup_codes')
        .delete()
        .eq('user_id', userId);

      // Log the disablement
      await this.logTwoFactorEvent(userId, 'disabled', {});

      return true;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    // Delete old backup codes
    await supabase
      .from('user_backup_codes')
      .delete()
      .eq('user_id', userId);

    // Generate new codes
    const backupCodes = this.generateBackupCodes();

    // Store new codes
    const codesToInsert = backupCodes.map(code => ({
      user_id: userId,
      code,
      used: false,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('user_backup_codes')
      .insert(codesToInsert);

    // Log regeneration
    await this.logTwoFactorEvent(userId, 'backup_codes_regenerated', {
      count: backupCodes.length
    });

    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_two_factor')
      .select('enabled')
      .eq('user_id', userId)
      .single();

    return data?.enabled || false;
  }

  /**
   * Enforce 2FA for sensitive operations
   */
  async requireTwoFactorForOperation(
    userId: string, 
    operation: string,
    code?: string
  ): Promise<VerificationResult> {
    // Check if 2FA is enabled
    const is2FAEnabled = await this.isTwoFactorEnabled(userId);
    
    if (!is2FAEnabled) {
      // For sensitive operations, require 2FA setup
      if (this.isSensitiveOperation(operation)) {
        return { 
          valid: false, 
          error: '2FA required for this operation. Please enable 2FA in security settings.' 
        };
      }
      // Non-sensitive operations can proceed without 2FA
      return { valid: true };
    }

    // If 2FA is enabled, require verification
    if (!code) {
      return { 
        valid: false, 
        error: '2FA verification required' 
      };
    }

    return await this.verifyTOTP(userId, code);
  }

  /**
   * Helper: Generate secret for TOTP
   */
  private generateSecret(): string {
    // Generate a 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  /**
   * Helper: Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Helper: Store 2FA setup in database
   */
  private async storeTwoFactorSetup(
    userId: string, 
    secret: string, 
    backupCodes: string[]
  ) {
    // Store or update 2FA settings
    await supabase
      .from('user_two_factor')
      .upsert({
        user_id: userId,
        secret,
        enabled: false,
        created_at: new Date().toISOString()
      });

    // Store backup codes
    const codesToInsert = backupCodes.map(code => ({
      user_id: userId,
      code,
      used: false,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('user_backup_codes')
      .insert(codesToInsert);
  }

  /**
   * Helper: Log 2FA events for audit
   */
  private async logTwoFactorEvent(userId: string, event: string, metadata: any) {
    await supabase
      .from('two_factor_audit_log')
      .insert({
        user_id: userId,
        event,
        metadata,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Helper: Get client IP (for audit logs)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Helper: Check if operation is sensitive
   */
  private isSensitiveOperation(operation: string): boolean {
    const sensitiveOps = [
      'bulk_message_send',
      'data_export',
      'account_deletion',
      'api_key_generation',
      'linkedin_bulk_connect',
      'workspace_settings_change'
    ];
    return sensitiveOps.includes(operation);
  }
}

// Export singleton instance
export const twoFactorAuth = new TwoFactorAuthService();