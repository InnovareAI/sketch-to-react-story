/**
 * Team Accounts Service - Supabase Production Version
 * Manages team LinkedIn and Email accounts in Supabase database
 */

import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  workspace_id: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  avatar_url?: string;
  status: string;
  permissions?: any;
  created_at?: string;
  updated_at?: string;
}

export interface LinkedInAccount {
  id: string;
  workspace_id: string;
  team_member_id?: string;
  account_name: string;
  email: string;
  profile_url?: string;
  linkedin_id?: string;
  account_type: 'personal' | 'sales_navigator';
  status: 'active' | 'inactive' | 'rate_limited' | 'suspended';
  daily_limit: number;
  weekly_limit: number;
  daily_used: number;
  weekly_used: number;
  last_used_at?: string;
  proxy_location?: string;
  credentials?: any;
  metadata?: any;
  tags?: string[];
  assigned_campaigns?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EmailAccount {
  id: string;
  workspace_id: string;
  team_member_id?: string;
  account_name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'smtp' | 'other';
  purpose: 'outbound' | 'inbound' | 'both';
  status: 'active' | 'inactive' | 'error';
  daily_limit: number;
  daily_used: number;
  warmup_status: 'cold' | 'warming' | 'warm' | 'hot';
  reputation: number;
  credentials?: any;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountRotationRules {
  id: string;
  workspace_id: string;
  rotation_type: 'round_robin' | 'least_used' | 'best_performance' | 'manual';
  max_daily_per_account: number;
  cooldown_minutes: number;
  prioritize_warm_accounts: boolean;
  avoid_rate_limited: boolean;
  settings?: any;
}

export class TeamAccountsSupabaseService {
  private static instance: TeamAccountsSupabaseService;
  private workspaceId: string;

  private constructor() {
    // Get workspace ID dynamically from auth context
    this.workspaceId = this.getCurrentWorkspaceId();
  }

  /**
   * Get current workspace ID from various sources
   */
  private getCurrentWorkspaceId(): string {
    // Check auth profile
    const authProfile = JSON.parse(localStorage.getItem('user_auth_profile') || '{}');
    if (authProfile.workspace_id) return authProfile.workspace_id;
    
    // Check bypass user data
    const bypassUser = JSON.parse(localStorage.getItem('bypass_user') || '{}');
    if (bypassUser.workspace_id) return bypassUser.workspace_id;
    
    // Check direct storage
    const workspaceId = localStorage.getItem('workspace_id');
    if (workspaceId) return workspaceId;
    
    // Generate dynamic fallback workspace ID
    const userEmail = localStorage.getItem('user_email') || 'default';
    const emailHash = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `workspace-${emailHash}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Update workspace ID (useful when workspace changes)
   */
  public updateWorkspaceId(workspaceId?: string): void {
    this.workspaceId = workspaceId || this.getCurrentWorkspaceId();
  }

  public static getInstance(): TeamAccountsSupabaseService {
    if (!TeamAccountsSupabaseService.instance) {
      TeamAccountsSupabaseService.instance = new TeamAccountsSupabaseService();
    }
    return TeamAccountsSupabaseService.instance;
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  async addTeamMember(member: Partial<TeamMember>): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...member,
          workspace_id: this.workspaceId,
          status: member.status || 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding team member:', error);
      return null;
    }
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating team member:', error);
      return false;
    }
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      return false;
    }
  }

  // LinkedIn Accounts
  async getLinkedInAccounts(): Promise<LinkedInAccount[]> {
    try {
      const { data, error } = await supabase
        .from('linkedin_accounts')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching LinkedIn accounts:', error);
      return [];
    }
  }

  async addLinkedInAccount(account: Partial<LinkedInAccount>): Promise<LinkedInAccount | null> {
    try {
      const { data, error } = await supabase
        .from('linkedin_accounts')
        .insert({
          ...account,
          workspace_id: this.workspaceId,
          status: account.status || 'active',
          daily_used: 0,
          weekly_used: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding LinkedIn account:', error);
      return null;
    }
  }

  async updateLinkedInAccount(id: string, updates: Partial<LinkedInAccount>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating LinkedIn account:', error);
      return false;
    }
  }

  async deleteLinkedInAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('linkedin_accounts')
        .delete()
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting LinkedIn account:', error);
      return false;
    }
  }

  async incrementLinkedInUsage(id: string): Promise<boolean> {
    try {
      // Get current usage
      const { data: account, error: fetchError } = await supabase
        .from('linkedin_accounts')
        .select('daily_used, weekly_used')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Increment usage
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({
          daily_used: (account.daily_used || 0) + 1,
          weekly_used: (account.weekly_used || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error incrementing LinkedIn usage:', error);
      return false;
    }
  }

  // Email Accounts
  async getEmailAccounts(): Promise<EmailAccount[]> {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      return [];
    }
  }

  async addEmailAccount(account: Partial<EmailAccount>): Promise<EmailAccount | null> {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .insert({
          ...account,
          workspace_id: this.workspaceId,
          status: account.status || 'active',
          daily_used: 0,
          warmup_status: account.warmup_status || 'cold',
          reputation: account.reputation || 100
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding email account:', error);
      return null;
    }
  }

  async updateEmailAccount(id: string, updates: Partial<EmailAccount>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating email account:', error);
      return false;
    }
  }

  async deleteEmailAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', id)
        .eq('workspace_id', this.workspaceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting email account:', error);
      return false;
    }
  }

  // Rotation Rules
  async getRotationRules(): Promise<AccountRotationRules | null> {
    try {
      const { data, error } = await supabase
        .from('account_rotation_rules')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching rotation rules:', error);
      return null;
    }
  }

  async updateRotationRules(rules: Partial<AccountRotationRules>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('account_rotation_rules')
        .upsert({
          ...rules,
          workspace_id: this.workspaceId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating rotation rules:', error);
      return false;
    }
  }

  // Account Health
  async getAccountHealth() {
    try {
      const [linkedInAccounts, emailAccounts] = await Promise.all([
        this.getLinkedInAccounts(),
        this.getEmailAccounts()
      ]);

      const linkedInActive = linkedInAccounts.filter(a => a.status === 'active').length;
      const linkedInRateLimited = linkedInAccounts.filter(a => a.status === 'rate_limited').length;
      
      const emailActive = emailAccounts.filter(a => a.status === 'active').length;
      const emailWarm = emailAccounts.filter(a => 
        a.warmup_status === 'warm' || a.warmup_status === 'hot'
      ).length;

      const warnings = [];
      if (linkedInRateLimited > 0) {
        warnings.push(`${linkedInRateLimited} LinkedIn account(s) are rate limited`);
      }
      if (emailActive === 0) {
        warnings.push('No active email accounts configured');
      }
      if (linkedInActive === 0) {
        warnings.push('No active LinkedIn accounts configured');
      }

      return {
        linkedIn: {
          total: linkedInAccounts.length,
          active: linkedInActive,
          rateLimited: linkedInRateLimited
        },
        email: {
          total: emailAccounts.length,
          active: emailActive,
          warm: emailWarm
        },
        warnings
      };
    } catch (error) {
      console.error('Error getting account health:', error);
      return {
        linkedIn: { total: 0, active: 0, rateLimited: 0 },
        email: { total: 0, active: 0, warm: 0 },
        warnings: ['Failed to fetch account health']
      };
    }
  }

  // Get next available account for rotation
  async getNextAvailableLinkedInAccount(): Promise<LinkedInAccount | null> {
    try {
      const rules = await this.getRotationRules();
      const accounts = await this.getLinkedInAccounts();
      
      // Filter active accounts
      let availableAccounts = accounts.filter(a => a.status === 'active');
      
      // Apply rate limit filter if enabled
      if (rules?.avoid_rate_limited) {
        availableAccounts = availableAccounts.filter(a => 
          a.daily_used < a.daily_limit && a.weekly_used < a.weekly_limit
        );
      }

      if (availableAccounts.length === 0) return null;

      // Apply rotation strategy
      switch (rules?.rotation_type) {
        case 'least_used':
          availableAccounts.sort((a, b) => a.daily_used - b.daily_used);
          break;
        case 'round_robin':
          // Sort by last used time
          availableAccounts.sort((a, b) => {
            const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
            const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
            return aTime - bTime;
          });
          break;
        default:
          // Random selection for manual or undefined
          break;
      }

      return availableAccounts[0];
    } catch (error) {
      console.error('Error getting next available account:', error);
      return null;
    }
  }
}

export default TeamAccountsSupabaseService;