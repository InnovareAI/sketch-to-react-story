/**
 * Team Accounts Service
 * Manages multiple LinkedIn and Email accounts for team collaboration
 */

export interface LinkedInAccount {
  id: string;
  name: string;
  email: string;
  profileUrl: string;
  status: 'active' | 'inactive' | 'rate_limited' | 'error';
  type: 'personal' | 'sales_navigator';
  dailyLimit: number;
  dailyUsed: number;
  weeklyLimit: number;
  weeklyUsed: number;
  lastUsed: Date;
  cookies?: string; // Encrypted LinkedIn session cookies
  assignedTo?: string[]; // User IDs who can use this account
  tags: string[]; // For account categorization
  metrics: {
    connectionsSent: number;
    messagessSent: number;
    profilesViewed: number;
    successRate: number;
  };
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'smtp' | 'imap';
  purpose: 'outbound' | 'inbound' | 'both';
  status: 'active' | 'inactive' | 'error';
  dailyLimit: number;
  dailyUsed: number;
  warmupStatus: 'cold' | 'warming' | 'warm' | 'hot';
  reputation: number; // 0-100
  lastUsed: Date;
  credentials: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string; // Encrypted
      accessToken?: string; // For OAuth
      refreshToken?: string;
    };
  };
  assignedTo?: string[]; // User IDs
  campaigns?: string[]; // Campaign IDs using this account
  metrics: {
    emailsSent: number;
    emailsReceived: number;
    bounceRate: number;
    openRate: number;
    replyRate: number;
    spamScore: number;
  };
}

export interface AccountRotationStrategy {
  type: 'round_robin' | 'least_used' | 'best_performance' | 'manual';
  rules: {
    maxDailyPerAccount: number;
    cooldownMinutes: number;
    prioritizeWarmAccounts: boolean;
    avoidRateLimited: boolean;
  };
}

export class TeamAccountsService {
  private static instance: TeamAccountsService;
  private linkedInAccounts: Map<string, LinkedInAccount> = new Map();
  private emailAccounts: Map<string, EmailAccount> = new Map();
  private rotationStrategy: AccountRotationStrategy = {
    type: 'round_robin',
    rules: {
      maxDailyPerAccount: 50,
      cooldownMinutes: 30,
      prioritizeWarmAccounts: true,
      avoidRateLimited: true
    }
  };

  private constructor() {
    this.loadAccounts();
  }

  public static getInstance(): TeamAccountsService {
    if (!TeamAccountsService.instance) {
      TeamAccountsService.instance = new TeamAccountsService();
    }
    return TeamAccountsService.instance;
  }

  /**
   * LinkedIn Account Management
   */
  
  public async addLinkedInAccount(account: Omit<LinkedInAccount, 'id' | 'lastUsed' | 'metrics'>): Promise<LinkedInAccount> {
    const newAccount: LinkedInAccount = {
      ...account,
      id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUsed: new Date(),
      metrics: {
        connectionsSent: 0,
        messagessSent: 0,
        profilesViewed: 0,
        successRate: 0
      }
    };

    this.linkedInAccounts.set(newAccount.id, newAccount);
    this.saveAccounts();
    
    return newAccount;
  }

  public getLinkedInAccounts(filters?: {
    status?: 'active' | 'inactive';
    assignedTo?: string;
    purpose?: string;
  }): LinkedInAccount[] {
    let accounts = Array.from(this.linkedInAccounts.values());
    
    if (filters?.status) {
      accounts = accounts.filter(a => a.status === filters.status);
    }
    
    if (filters?.assignedTo) {
      accounts = accounts.filter(a => 
        a.assignedTo?.includes(filters.assignedTo)
      );
    }
    
    return accounts;
  }

  public async getNextLinkedInAccount(userId: string): Promise<LinkedInAccount | null> {
    const availableAccounts = this.getLinkedInAccounts({
      status: 'active',
      assignedTo: userId
    }).filter(account => {
      // Check daily limits
      if (account.dailyUsed >= account.dailyLimit) return false;
      
      // Check cooldown
      const lastUsedTime = account.lastUsed.getTime();
      const cooldownTime = this.rotationStrategy.rules.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastUsedTime < cooldownTime) return false;
      
      return true;
    });

    if (availableAccounts.length === 0) return null;

    // Apply rotation strategy
    let selectedAccount: LinkedInAccount;
    
    switch (this.rotationStrategy.type) {
      case 'least_used':
        selectedAccount = availableAccounts.sort((a, b) => a.dailyUsed - b.dailyUsed)[0];
        break;
      
      case 'best_performance':
        selectedAccount = availableAccounts.sort((a, b) => 
          b.metrics.successRate - a.metrics.successRate
        )[0];
        break;
      
      case 'round_robin':
      default:
        selectedAccount = availableAccounts.sort((a, b) => 
          a.lastUsed.getTime() - b.lastUsed.getTime()
        )[0];
        break;
    }

    // Update usage
    selectedAccount.dailyUsed++;
    selectedAccount.lastUsed = new Date();
    this.linkedInAccounts.set(selectedAccount.id, selectedAccount);
    this.saveAccounts();

    return selectedAccount;
  }

  public updateLinkedInAccountMetrics(
    accountId: string, 
    action: 'connection' | 'message' | 'view',
    success: boolean = true
  ): void {
    const account = this.linkedInAccounts.get(accountId);
    if (!account) return;

    switch (action) {
      case 'connection':
        account.metrics.connectionsSent++;
        break;
      case 'message':
        account.metrics.messagessSent++;
        break;
      case 'view':
        account.metrics.profilesViewed++;
        break;
    }

    // Update success rate
    const totalActions = account.metrics.connectionsSent + 
                        account.metrics.messagessSent;
    if (totalActions > 0 && success) {
      account.metrics.successRate = 
        ((account.metrics.successRate * (totalActions - 1)) + (success ? 1 : 0)) / totalActions;
    }

    this.linkedInAccounts.set(accountId, account);
    this.saveAccounts();
  }

  /**
   * Email Account Management
   */
  
  public async addEmailAccount(account: Omit<EmailAccount, 'id' | 'lastUsed' | 'metrics'>): Promise<EmailAccount> {
    const newAccount: EmailAccount = {
      ...account,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUsed: new Date(),
      metrics: {
        emailsSent: 0,
        emailsReceived: 0,
        bounceRate: 0,
        openRate: 0,
        replyRate: 0,
        spamScore: 0
      }
    };

    this.emailAccounts.set(newAccount.id, newAccount);
    this.saveAccounts();
    
    return newAccount;
  }

  public getEmailAccounts(filters?: {
    status?: 'active' | 'inactive';
    purpose?: 'outbound' | 'inbound' | 'both';
    warmupStatus?: 'cold' | 'warming' | 'warm' | 'hot';
    assignedTo?: string;
  }): EmailAccount[] {
    let accounts = Array.from(this.emailAccounts.values());
    
    if (filters?.status) {
      accounts = accounts.filter(a => a.status === filters.status);
    }
    
    if (filters?.purpose) {
      accounts = accounts.filter(a => 
        a.purpose === filters.purpose || a.purpose === 'both'
      );
    }
    
    if (filters?.warmupStatus) {
      accounts = accounts.filter(a => a.warmupStatus === filters.warmupStatus);
    }
    
    if (filters?.assignedTo) {
      accounts = accounts.filter(a => 
        a.assignedTo?.includes(filters.assignedTo)
      );
    }
    
    return accounts;
  }

  public async getNextEmailAccount(
    userId: string, 
    purpose: 'outbound' | 'inbound'
  ): Promise<EmailAccount | null> {
    const availableAccounts = this.getEmailAccounts({
      status: 'active',
      purpose: purpose,
      assignedTo: userId
    }).filter(account => {
      // Check daily limits
      if (account.dailyUsed >= account.dailyLimit) return false;
      
      // Prioritize warm accounts for outbound
      if (purpose === 'outbound' && this.rotationStrategy.rules.prioritizeWarmAccounts) {
        if (account.warmupStatus === 'cold') return false;
      }
      
      // Check reputation
      if (account.reputation < 50) return false;
      
      return true;
    });

    if (availableAccounts.length === 0) return null;

    // Apply rotation strategy
    let selectedAccount: EmailAccount;
    
    switch (this.rotationStrategy.type) {
      case 'least_used':
        selectedAccount = availableAccounts.sort((a, b) => a.dailyUsed - b.dailyUsed)[0];
        break;
      
      case 'best_performance':
        selectedAccount = availableAccounts.sort((a, b) => {
          const scoreA = a.reputation * (1 - a.metrics.bounceRate) * a.metrics.replyRate;
          const scoreB = b.reputation * (1 - b.metrics.bounceRate) * b.metrics.replyRate;
          return scoreB - scoreA;
        })[0];
        break;
      
      case 'round_robin':
      default:
        selectedAccount = availableAccounts.sort((a, b) => 
          a.lastUsed.getTime() - b.lastUsed.getTime()
        )[0];
        break;
    }

    // Update usage
    selectedAccount.dailyUsed++;
    selectedAccount.lastUsed = new Date();
    this.emailAccounts.set(selectedAccount.id, selectedAccount);
    this.saveAccounts();

    return selectedAccount;
  }

  public updateEmailAccountMetrics(
    accountId: string,
    metric: 'sent' | 'received' | 'bounced' | 'opened' | 'replied',
    value: number = 1
  ): void {
    const account = this.emailAccounts.get(accountId);
    if (!account) return;

    switch (metric) {
      case 'sent':
        account.metrics.emailsSent += value;
        break;
      case 'received':
        account.metrics.emailsReceived += value;
        break;
      case 'bounced':
        const totalSent = account.metrics.emailsSent;
        account.metrics.bounceRate = 
          totalSent > 0 ? (account.metrics.bounceRate * totalSent + value) / (totalSent + value) : 0;
        break;
      case 'opened':
        account.metrics.openRate = 
          account.metrics.emailsSent > 0 
            ? (account.metrics.openRate * account.metrics.emailsSent + value) / account.metrics.emailsSent 
            : 0;
        break;
      case 'replied':
        account.metrics.replyRate = 
          account.metrics.emailsSent > 0 
            ? (account.metrics.replyRate * account.metrics.emailsSent + value) / account.metrics.emailsSent 
            : 0;
        break;
    }

    // Update reputation based on metrics
    this.updateEmailReputation(account);
    
    this.emailAccounts.set(accountId, account);
    this.saveAccounts();
  }

  private updateEmailReputation(account: EmailAccount): void {
    // Calculate reputation score based on metrics
    let reputation = 100;
    
    // Deduct for high bounce rate
    reputation -= account.metrics.bounceRate * 50;
    
    // Deduct for high spam score
    reputation -= account.metrics.spamScore * 30;
    
    // Add for good open rate
    reputation += account.metrics.openRate * 20;
    
    // Add for good reply rate
    reputation += account.metrics.replyRate * 30;
    
    // Ensure reputation is between 0 and 100
    account.reputation = Math.max(0, Math.min(100, reputation));
    
    // Update warmup status based on usage and reputation
    if (account.metrics.emailsSent < 50) {
      account.warmupStatus = 'cold';
    } else if (account.metrics.emailsSent < 200 && account.reputation > 60) {
      account.warmupStatus = 'warming';
    } else if (account.metrics.emailsSent < 500 && account.reputation > 70) {
      account.warmupStatus = 'warm';
    } else if (account.metrics.emailsSent >= 500 && account.reputation > 80) {
      account.warmupStatus = 'hot';
    }
  }

  /**
   * Rotation Strategy Management
   */
  
  public setRotationStrategy(strategy: AccountRotationStrategy): void {
    this.rotationStrategy = strategy;
    this.saveAccounts();
  }

  public getRotationStrategy(): AccountRotationStrategy {
    return this.rotationStrategy;
  }

  /**
   * Account Health & Monitoring
   */
  
  public getAccountHealth(): {
    linkedIn: { total: number; active: number; rateLimited: number; };
    email: { total: number; active: number; warm: number; cold: number; };
    warnings: string[];
  } {
    const linkedInAccounts = Array.from(this.linkedInAccounts.values());
    const emailAccounts = Array.from(this.emailAccounts.values());
    
    const warnings: string[] = [];
    
    // Check LinkedIn account health
    const rateLimitedLinkedIn = linkedInAccounts.filter(a => a.status === 'rate_limited').length;
    if (rateLimitedLinkedIn > 0) {
      warnings.push(`${rateLimitedLinkedIn} LinkedIn account(s) are rate limited`);
    }
    
    // Check email account health
    const coldEmails = emailAccounts.filter(a => a.warmupStatus === 'cold').length;
    if (coldEmails > emailAccounts.length * 0.5) {
      warnings.push(`${coldEmails} email account(s) need warming up`);
    }
    
    const lowReputation = emailAccounts.filter(a => a.reputation < 50).length;
    if (lowReputation > 0) {
      warnings.push(`${lowReputation} email account(s) have low reputation`);
    }
    
    return {
      linkedIn: {
        total: linkedInAccounts.length,
        active: linkedInAccounts.filter(a => a.status === 'active').length,
        rateLimited: rateLimitedLinkedIn
      },
      email: {
        total: emailAccounts.length,
        active: emailAccounts.filter(a => a.status === 'active').length,
        warm: emailAccounts.filter(a => ['warm', 'hot'].includes(a.warmupStatus)).length,
        cold: coldEmails
      },
      warnings
    };
  }

  /**
   * Reset daily limits (call this via cron job)
   */
  public resetDailyLimits(): void {
    // Reset LinkedIn accounts
    this.linkedInAccounts.forEach(account => {
      account.dailyUsed = 0;
    });
    
    // Reset email accounts
    this.emailAccounts.forEach(account => {
      account.dailyUsed = 0;
    });
    
    this.saveAccounts();
  }

  /**
   * Persistence
   */
  
  private saveAccounts(): void {
    const data = {
      linkedInAccounts: Array.from(this.linkedInAccounts.entries()),
      emailAccounts: Array.from(this.emailAccounts.entries()),
      rotationStrategy: this.rotationStrategy
    };
    
    localStorage.setItem('team_accounts', JSON.stringify(data));
  }

  private loadAccounts(): void {
    const stored = localStorage.getItem('team_accounts');
    if (stored) {
      const data = JSON.parse(stored);
      
      // Load LinkedIn accounts
      if (data.linkedInAccounts) {
        this.linkedInAccounts = new Map(data.linkedInAccounts.map((entry: any) => [
          entry[0],
          {
            ...entry[1],
            lastUsed: new Date(entry[1].lastUsed)
          }
        ]));
      }
      
      // Load email accounts
      if (data.emailAccounts) {
        this.emailAccounts = new Map(data.emailAccounts.map((entry: any) => [
          entry[0],
          {
            ...entry[1],
            lastUsed: new Date(entry[1].lastUsed)
          }
        ]));
      }
      
      // Load rotation strategy
      if (data.rotationStrategy) {
        this.rotationStrategy = data.rotationStrategy;
      }
    }
  }
}

export default TeamAccountsService;