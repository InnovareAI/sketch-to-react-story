/**
 * Team Accounts Settings Component
 * Manage multiple LinkedIn and Email accounts for the team
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Mail, 
  Linkedin, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { TeamAccountsService, LinkedInAccount, EmailAccount } from "@/services/accounts/TeamAccountsService";

export function TeamAccountsSettings() {
  const [teamAccounts] = useState(() => TeamAccountsService.getInstance());
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [accountHealth, setAccountHealth] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  
  // Form states
  const [newLinkedInAccount, setNewLinkedInAccount] = useState({
    name: '',
    email: '',
    profileUrl: '',
    type: 'personal' as const,
    dailyLimit: 50,
    weeklyLimit: 250
  });
  
  const [newEmailAccount, setNewEmailAccount] = useState({
    name: '',
    email: '',
    provider: 'gmail' as const,
    purpose: 'both' as const,
    dailyLimit: 200,
    host: '',
    port: 587,
    user: '',
    pass: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setLinkedInAccounts(teamAccounts.getLinkedInAccounts());
    setEmailAccounts(teamAccounts.getEmailAccounts());
    setAccountHealth(teamAccounts.getAccountHealth());
  };

  const addLinkedIn = async () => {
    if (!newLinkedInAccount.name || !newLinkedInAccount.email) return;
    
    await teamAccounts.addLinkedInAccount({
      ...newLinkedInAccount,
      status: 'active',
      dailyUsed: 0,
      weeklyUsed: 0,
      tags: [],
      assignedTo: []
    });
    
    setNewLinkedInAccount({
      name: '',
      email: '',
      profileUrl: '',
      type: 'personal',
      dailyLimit: 50,
      weeklyLimit: 250
    });
    
    loadAccounts();
  };

  const addEmail = async () => {
    if (!newEmailAccount.name || !newEmailAccount.email) return;
    
    await teamAccounts.addEmailAccount({
      name: newEmailAccount.name,
      email: newEmailAccount.email,
      provider: newEmailAccount.provider,
      purpose: newEmailAccount.purpose,
      status: 'active',
      dailyLimit: newEmailAccount.dailyLimit,
      dailyUsed: 0,
      warmupStatus: 'cold',
      reputation: 100,
      credentials: {
        host: newEmailAccount.host,
        port: newEmailAccount.port,
        secure: newEmailAccount.port === 465,
        auth: {
          user: newEmailAccount.user || newEmailAccount.email,
          pass: newEmailAccount.pass
        }
      }
    });
    
    setNewEmailAccount({
      name: '',
      email: '',
      provider: 'gmail',
      purpose: 'both',
      dailyLimit: 200,
      host: '',
      port: 587,
      user: '',
      pass: ''
    });
    
    loadAccounts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'rate_limited': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getWarmupColor = (status: string) => {
    switch (status) {
      case 'hot': return 'text-red-500';
      case 'warm': return 'text-orange-500';
      case 'warming': return 'text-yellow-500';
      case 'cold': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Health Overview */}
      {accountHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Linkedin className="h-4 w-4" />
                  <span className="font-medium">LinkedIn Accounts</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{accountHealth.linkedIn.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <Badge variant="default">{accountHealth.linkedIn.active}</Badge>
                  </div>
                  {accountHealth.linkedIn.rateLimited > 0 && (
                    <div className="flex justify-between">
                      <span>Rate Limited:</span>
                      <Badge variant="destructive">{accountHealth.linkedIn.rateLimited}</Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email Accounts</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{accountHealth.email.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <Badge variant="default">{accountHealth.email.active}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Warm:</span>
                    <Badge variant="secondary">{accountHealth.email.warm}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {accountHealth.warnings.length > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {accountHealth.warnings.map((warning: string, i: number) => (
                    <div key={i}>{warning}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="linkedin">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="linkedin">LinkedIn Accounts</TabsTrigger>
          <TabsTrigger value="email">Email Accounts</TabsTrigger>
          <TabsTrigger value="rotation">Rotation Strategy</TabsTrigger>
        </TabsList>

        {/* LinkedIn Accounts Tab */}
        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add LinkedIn Account</CardTitle>
              <CardDescription>Connect team member LinkedIn accounts for outreach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={newLinkedInAccount.name}
                    onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John's LinkedIn"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newLinkedInAccount.email}
                    onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label>Profile URL</Label>
                  <Input
                    value={newLinkedInAccount.profileUrl}
                    onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, profileUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select 
                    value={newLinkedInAccount.type}
                    onValueChange={(value: 'personal' | 'sales_navigator') => 
                      setNewLinkedInAccount(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="sales_navigator">Sales Navigator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Daily Limit</Label>
                  <Input
                    type="number"
                    value={newLinkedInAccount.dailyLimit}
                    onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Weekly Limit</Label>
                  <Input
                    type="number"
                    value={newLinkedInAccount.weeklyLimit}
                    onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, weeklyLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={addLinkedIn} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add LinkedIn Account
              </Button>
            </CardContent>
          </Card>

          {/* LinkedIn Accounts List */}
          <div className="space-y-2">
            {linkedInAccounts.map(account => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`} />
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                      </div>
                      <Badge variant="outline">{account.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Daily: </span>
                        <span>{account.dailyUsed}/{account.dailyLimit}</span>
                      </div>
                      <Progress 
                        value={(account.dailyUsed / account.dailyLimit) * 100} 
                        className="w-20"
                      />
                      <Button size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Email Accounts Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Email Account</CardTitle>
              <CardDescription>Configure email accounts for inbound and outbound messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={newEmailAccount.name}
                    onChange={(e) => setNewEmailAccount(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sales Team Email"
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={newEmailAccount.email}
                    onChange={(e) => setNewEmailAccount(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sales@company.com"
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select 
                    value={newEmailAccount.provider}
                    onValueChange={(value: 'gmail' | 'outlook' | 'smtp') => 
                      setNewEmailAccount(prev => ({ ...prev, provider: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Select 
                    value={newEmailAccount.purpose}
                    onValueChange={(value: 'outbound' | 'inbound' | 'both') => 
                      setNewEmailAccount(prev => ({ ...prev, purpose: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound Only</SelectItem>
                      <SelectItem value="inbound">Inbound Only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEmailAccount.provider === 'smtp' && (
                  <>
                    <div>
                      <Label>SMTP Host</Label>
                      <Input
                        value={newEmailAccount.host}
                        onChange={(e) => setNewEmailAccount(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input
                        type="number"
                        value={newEmailAccount.port}
                        onChange={(e) => setNewEmailAccount(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label>Password / App Password</Label>
                  <Input
                    type="password"
                    value={newEmailAccount.pass}
                    onChange={(e) => setNewEmailAccount(prev => ({ ...prev, pass: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label>Daily Send Limit</Label>
                  <Input
                    type="number"
                    value={newEmailAccount.dailyLimit}
                    onChange={(e) => setNewEmailAccount(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={addEmail} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Email Account
              </Button>
            </CardContent>
          </Card>

          {/* Email Accounts List */}
          <div className="space-y-2">
            {emailAccounts.map(account => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`} />
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                      </div>
                      <Badge variant="outline">{account.purpose}</Badge>
                      <span className={`text-sm font-medium ${getWarmupColor(account.warmupStatus)}`}>
                        {account.warmupStatus === 'hot' ? '🔥' : 
                         account.warmupStatus === 'warm' ? '♨️' : 
                         account.warmupStatus === 'warming' ? '🌡️' : '❄️'} {account.warmupStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reputation: </span>
                        <span>{account.reputation}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Daily: </span>
                        <span>{account.dailyUsed}/{account.dailyLimit}</span>
                      </div>
                      <Progress 
                        value={(account.dailyUsed / account.dailyLimit) * 100} 
                        className="w-20"
                      />
                      <Button size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rotation Strategy Tab */}
        <TabsContent value="rotation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Rotation Strategy</CardTitle>
              <CardDescription>Configure how accounts are selected and rotated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rotation Type</Label>
                <Select defaultValue="round_robin">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="least_used">Least Used First</SelectItem>
                    <SelectItem value="best_performance">Best Performance First</SelectItem>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Daily Per Account</Label>
                  <Input type="number" defaultValue="50" className="w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Cooldown Minutes</Label>
                  <Input type="number" defaultValue="30" className="w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Prioritize Warm Accounts</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Avoid Rate Limited</Label>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Rotation Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TeamAccountsSettings;