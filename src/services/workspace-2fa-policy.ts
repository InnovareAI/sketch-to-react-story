/**
 * Workspace 2FA Policy Management Service
 * Allows workspace managers to enforce 2FA policies for their team
 */

import { supabase } from '@/integrations/supabase/client';

export interface TwoFactorPolicy {
  workspaceId: string;
  enforced: boolean;
  enforcementLevel: 'optional' | 'required' | 'role_based';
  requiredRoles: string[];
  gracePerodDays: number;
  exemptUsers: string[];
  settings: {
    allowBackupCodes: boolean;
    allowSMS: boolean;
    allowAuthenticatorApp: boolean;
    sessionTimeout: number; // minutes
    requireReauthForSensitive: boolean;
  };
}

export interface UserComplianceStatus {
  userId: string;
  email: string;
  name: string;
  role: string;
  has2FAEnabled: boolean;
  isCompliant: boolean;
  graceEndDate?: Date;
  exemptReason?: string;
}

export class Workspace2FAPolicy {
  /**
   * HOW WORKSPACE 2FA MANAGEMENT WORKS:
   * 
   * 1. WORKSPACE MANAGER CONTROLS:
   *    - Enable/disable 2FA requirement for entire workspace
   *    - Set different policies per user role
   *    - Grant exemptions for specific users
   *    - Set grace periods for adoption
   * 
   * 2. ENFORCEMENT LEVELS:
   *    - Optional: 2FA recommended but not required
   *    - Required: All users must enable 2FA
   *    - Role-based: Only specific roles require 2FA
   * 
   * 3. PLAN-BASED FEATURES:
   *    - Free: 2FA optional, basic features
   *    - Starter: Can require 2FA, 7-day grace period
   *    - Premium: Role-based policies, custom grace periods
   *    - Enterprise: Advanced policies, compliance reporting
   * 
   * 4. COMPLIANCE MONITORING:
   *    - Real-time dashboard showing user compliance
   *    - Automated reminders for non-compliant users
   *    - Audit logs for all policy changes
   */

  /**
   * Get current workspace 2FA policy
   */
  async getWorkspacePolicy(workspaceId: string): Promise<TwoFactorPolicy | null> {
    const { data, error } = await supabase
      .from('workspace_2fa_policies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      // Return default policy if none exists
      return {
        workspaceId,
        enforced: false,
        enforcementLevel: 'optional',
        requiredRoles: [],
        gracePerodDays: 7,
        exemptUsers: [],
        settings: {
          allowBackupCodes: true,
          allowSMS: false,
          allowAuthenticatorApp: true,
          sessionTimeout: 1440, // 24 hours
          requireReauthForSensitive: true
        }
      };
    }

    return data as TwoFactorPolicy;
  }

  /**
   * Update workspace 2FA policy (Manager only)
   */
  async updateWorkspacePolicy(
    workspaceId: string,
    managerId: string,
    policy: Partial<TwoFactorPolicy>
  ): Promise<boolean> {
    try {
      // Verify user is workspace manager
      const isManager = await this.verifyWorkspaceManager(workspaceId, managerId);
      if (!isManager) {
        throw new Error('Only workspace managers can update 2FA policies');
      }

      // Check plan limitations
      const planLimitations = await this.checkPlanLimitations(workspaceId, policy);
      if (!planLimitations.allowed) {
        throw new Error(planLimitations.message);
      }

      // Update or insert policy
      const { error } = await supabase
        .from('workspace_2fa_policies')
        .upsert({
          workspace_id: workspaceId,
          ...policy,
          updated_by: managerId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log policy change
      await this.logPolicyChange(workspaceId, managerId, policy);

      // Send notifications to affected users
      if (policy.enforced) {
        await this.notifyUsersOfPolicyChange(workspaceId, policy);
      }

      return true;
    } catch (error) {
      console.error('Failed to update 2FA policy:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA requirement for workspace
   */
  async enableWorkspace2FA(
    workspaceId: string,
    managerId: string,
    options: {
      enforcementLevel: 'required' | 'role_based';
      gracePerodDays?: number;
      requiredRoles?: string[];
    }
  ): Promise<boolean> {
    return await this.updateWorkspacePolicy(workspaceId, managerId, {
      enforced: true,
      enforcementLevel: options.enforcementLevel,
      gracePerodDays: options.gracePerodDays || 7,
      requiredRoles: options.requiredRoles || []
    });
  }

  /**
   * Disable 2FA requirement for workspace
   */
  async disableWorkspace2FA(
    workspaceId: string,
    managerId: string
  ): Promise<boolean> {
    return await this.updateWorkspacePolicy(workspaceId, managerId, {
      enforced: false,
      enforcementLevel: 'optional'
    });
  }

  /**
   * Get compliance status for all workspace users
   */
  async getComplianceStatus(workspaceId: string): Promise<UserComplianceStatus[]> {
    try {
      // Get workspace policy
      const policy = await this.getWorkspacePolicy(workspaceId);
      
      // Get all workspace users
      const { data: users } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          role,
          users (
            email,
            full_name
          )
        `)
        .eq('workspace_id', workspaceId);

      if (!users) return [];

      // Check 2FA status for each user
      const complianceStatuses: UserComplianceStatus[] = [];
      
      for (const user of users) {
        const { data: twoFactorData } = await supabase
          .from('user_two_factor')
          .select('enabled')
          .eq('user_id', user.user_id)
          .single();

        const has2FA = twoFactorData?.enabled || false;
        const isRequired = this.isUserRequired2FA(user.role, policy);
        const isExempt = policy?.exemptUsers.includes(user.user_id) || false;

        complianceStatuses.push({
          userId: user.user_id,
          email: user.users.email,
          name: user.users.full_name,
          role: user.role,
          has2FAEnabled: has2FA,
          isCompliant: !isRequired || has2FA || isExempt,
          graceEndDate: isRequired && !has2FA && !isExempt 
            ? new Date(Date.now() + (policy?.gracePerodDays || 7) * 24 * 60 * 60 * 1000)
            : undefined,
          exemptReason: isExempt ? 'Manager exemption' : undefined
        });
      }

      return complianceStatuses;
    } catch (error) {
      console.error('Failed to get compliance status:', error);
      return [];
    }
  }

  /**
   * Grant exemption to specific user
   */
  async grantExemption(
    workspaceId: string,
    managerId: string,
    userId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Verify manager permissions
      const isManager = await this.verifyWorkspaceManager(workspaceId, managerId);
      if (!isManager) {
        throw new Error('Only workspace managers can grant exemptions');
      }

      // Get current policy
      const policy = await this.getWorkspacePolicy(workspaceId);
      if (!policy) throw new Error('No policy found');

      // Add user to exempt list
      const exemptUsers = [...(policy.exemptUsers || []), userId];
      
      await this.updateWorkspacePolicy(workspaceId, managerId, {
        exemptUsers
      });

      // Log exemption
      await supabase
        .from('two_factor_exemptions')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          granted_by: managerId,
          reason,
          granted_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Failed to grant exemption:', error);
      throw error;
    }
  }

  /**
   * Revoke exemption for user
   */
  async revokeExemption(
    workspaceId: string,
    managerId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Verify manager permissions
      const isManager = await this.verifyWorkspaceManager(workspaceId, managerId);
      if (!isManager) {
        throw new Error('Only workspace managers can revoke exemptions');
      }

      // Get current policy
      const policy = await this.getWorkspacePolicy(workspaceId);
      if (!policy) throw new Error('No policy found');

      // Remove user from exempt list
      const exemptUsers = (policy.exemptUsers || []).filter(id => id !== userId);
      
      await this.updateWorkspacePolicy(workspaceId, managerId, {
        exemptUsers
      });

      // Update exemption record
      await supabase
        .from('two_factor_exemptions')
        .update({ 
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_by: managerId
        })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('revoked', false);

      return true;
    } catch (error) {
      console.error('Failed to revoke exemption:', error);
      throw error;
    }
  }

  /**
   * Check if user needs 2FA based on policy
   */
  async checkUserRequires2FA(workspaceId: string, userId: string): Promise<{
    required: boolean;
    reason?: string;
    graceEndDate?: Date;
  }> {
    const policy = await this.getWorkspacePolicy(workspaceId);
    
    if (!policy || !policy.enforced) {
      return { required: false };
    }

    // Check if user is exempt
    if (policy.exemptUsers.includes(userId)) {
      return { required: false, reason: 'User has exemption' };
    }

    // Get user role
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role, created_at')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return { required: false };
    }

    // Check enforcement level
    if (policy.enforcementLevel === 'required') {
      const graceEnd = new Date(member.created_at);
      graceEnd.setDate(graceEnd.getDate() + policy.gracePerodDays);
      
      return {
        required: true,
        reason: 'Workspace requires 2FA for all users',
        graceEndDate: graceEnd
      };
    }

    if (policy.enforcementLevel === 'role_based') {
      if (policy.requiredRoles.includes(member.role)) {
        const graceEnd = new Date(member.created_at);
        graceEnd.setDate(graceEnd.getDate() + policy.gracePerodDays);
        
        return {
          required: true,
          reason: `2FA required for ${member.role} role`,
          graceEndDate: graceEnd
        };
      }
    }

    return { required: false };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(workspaceId: string): Promise<{
    totalUsers: number;
    compliantUsers: number;
    nonCompliantUsers: number;
    exemptUsers: number;
    complianceRate: number;
    details: UserComplianceStatus[];
  }> {
    const statuses = await this.getComplianceStatus(workspaceId);
    
    const compliant = statuses.filter(s => s.isCompliant).length;
    const nonCompliant = statuses.filter(s => !s.isCompliant).length;
    const exempt = statuses.filter(s => s.exemptReason).length;
    
    return {
      totalUsers: statuses.length,
      compliantUsers: compliant,
      nonCompliantUsers: nonCompliant,
      exemptUsers: exempt,
      complianceRate: statuses.length > 0 ? (compliant / statuses.length) * 100 : 0,
      details: statuses
    };
  }

  /**
   * Helper: Verify user is workspace manager
   */
  private async verifyWorkspaceManager(workspaceId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    return data?.role === 'workspace_manager' || data?.role === 'admin';
  }

  /**
   * Helper: Check plan limitations
   */
  private async checkPlanLimitations(
    workspaceId: string, 
    policy: Partial<TwoFactorPolicy>
  ): Promise<{ allowed: boolean; message?: string }> {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single();

    const plan = workspace?.plan || 'free';

    // Free plan limitations
    if (plan === 'free' && policy.enforced) {
      return { 
        allowed: false, 
        message: 'Free plan does not support mandatory 2FA. Please upgrade to enable this feature.' 
      };
    }

    // Starter plan limitations
    if (plan === 'starter' && policy.enforcementLevel === 'role_based') {
      return { 
        allowed: false, 
        message: 'Role-based 2FA policies require Premium plan or higher.' 
      };
    }

    return { allowed: true };
  }

  /**
   * Helper: Check if user role requires 2FA
   */
  private isUserRequired2FA(role: string, policy: TwoFactorPolicy | null): boolean {
    if (!policy || !policy.enforced) return false;
    
    if (policy.enforcementLevel === 'required') return true;
    
    if (policy.enforcementLevel === 'role_based') {
      return policy.requiredRoles.includes(role);
    }
    
    return false;
  }

  /**
   * Helper: Log policy changes
   */
  private async logPolicyChange(
    workspaceId: string,
    managerId: string,
    changes: Partial<TwoFactorPolicy>
  ) {
    await supabase
      .from('workspace_audit_log')
      .insert({
        workspace_id: workspaceId,
        user_id: managerId,
        action: 'update_2fa_policy',
        details: changes,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Helper: Notify users of policy changes
   */
  private async notifyUsersOfPolicyChange(
    workspaceId: string,
    policy: Partial<TwoFactorPolicy>
  ) {
    // Get all workspace users
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    if (!members) return;

    // Create notifications for each user
    const notifications = members.map(member => ({
      user_id: member.user_id,
      type: '2fa_policy_change',
      title: '2FA Policy Updated',
      message: policy.enforced 
        ? `Your workspace now requires two-factor authentication. You have ${policy.gracePerodDays || 7} days to enable it.`
        : 'Two-factor authentication is now optional for your workspace.',
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('notifications')
      .insert(notifications);
  }
}

// Export singleton instance
export const workspace2FAPolicy = new Workspace2FAPolicy();