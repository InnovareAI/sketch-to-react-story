/**
 * Workspace Two-Factor Management Component
 * Allows workspace managers to control 2FA policies for their team
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  UserX,
  Clock,
  BarChart3,
  Settings,
  Info,
  Loader2,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { workspace2FAPolicy, type UserComplianceStatus } from '@/services/workspace-2fa-policy';
import { twoFactorAuth } from '@/services/two-factor-auth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/contexts/AuthContext';
import { TwoFactorSetup } from './TwoFactorSetup';

export function WorkspaceTwoFactorManagement() {
  const { workspace, workspaceId } = useWorkspace();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personalEnabled, setPersonalEnabled] = useState(false);
  const [workspaceEnforced, setWorkspaceEnforced] = useState(false);
  const [enforcementLevel, setEnforcementLevel] = useState<'optional' | 'required' | 'role_based'>('optional');
  const [gracePeriod, setGracePeriod] = useState(7);
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<UserComplianceStatus[]>([]);
  const [showExemptDialog, setShowExemptDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserComplianceStatus | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    loadPolicyAndStatus();
  }, [workspaceId, user]);

  const loadPolicyAndStatus = async () => {
    if (!workspaceId || !user) return;

    setLoading(true);
    try {
      // Check if user is manager
      const userRole = workspace?.members?.find(m => m.user_id === user.id)?.role;
      setIsManager(userRole === 'workspace_manager' || userRole === 'admin');

      // Check personal 2FA status
      const is2FAEnabled = await twoFactorAuth.isTwoFactorEnabled(user.id);
      setPersonalEnabled(is2FAEnabled);

      // Load workspace policy
      const policy = await workspace2FAPolicy.getWorkspacePolicy(workspaceId);
      if (policy) {
        setWorkspaceEnforced(policy.enforced);
        setEnforcementLevel(policy.enforcementLevel);
        setGracePeriod(policy.gracePerodDays);
        setRequiredRoles(policy.requiredRoles);
      }

      // Load compliance status if manager
      if (isManager) {
        const status = await workspace2FAPolicy.getComplianceStatus(workspaceId);
        setComplianceStatus(status);
      }
    } catch (error) {
      console.error('Failed to load 2FA policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyToggle = async (enabled: boolean) => {
    if (!workspaceId || !user || !isManager) return;

    try {
      if (enabled) {
        await workspace2FAPolicy.enableWorkspace2FA(workspaceId, user.id, {
          enforcementLevel: enforcementLevel === 'optional' ? 'required' : enforcementLevel,
          gracePerodDays: gracePeriod,
          requiredRoles
        });
        toast.success('2FA requirement enabled for workspace');
      } else {
        await workspace2FAPolicy.disableWorkspace2FA(workspaceId, user.id);
        toast.success('2FA requirement disabled for workspace');
      }
      setWorkspaceEnforced(enabled);
      loadPolicyAndStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update 2FA policy');
    }
  };

  const handleEnforcementLevelChange = async (level: string) => {
    if (!workspaceId || !user || !isManager) return;

    try {
      await workspace2FAPolicy.updateWorkspacePolicy(workspaceId, user.id, {
        enforcementLevel: level as any,
        requiredRoles: level === 'role_based' ? requiredRoles : []
      });
      setEnforcementLevel(level as any);
      toast.success('Enforcement level updated');
      loadPolicyAndStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update enforcement level');
    }
  };

  const handleRoleToggle = async (role: string) => {
    const newRoles = requiredRoles.includes(role)
      ? requiredRoles.filter(r => r !== role)
      : [...requiredRoles, role];
    
    setRequiredRoles(newRoles);
    
    if (workspaceId && user && isManager && enforcementLevel === 'role_based') {
      try {
        await workspace2FAPolicy.updateWorkspacePolicy(workspaceId, user.id, {
          requiredRoles: newRoles
        });
        toast.success('Required roles updated');
      } catch (error) {
        toast.error('Failed to update required roles');
      }
    }
  };

  const handleGrantExemption = async (userId: string, reason: string) => {
    if (!workspaceId || !user || !isManager) return;

    try {
      await workspace2FAPolicy.grantExemption(workspaceId, user.id, userId, reason);
      toast.success('Exemption granted');
      setShowExemptDialog(false);
      loadPolicyAndStatus();
    } catch (error) {
      toast.error('Failed to grant exemption');
    }
  };

  const handleRevokeExemption = async (userId: string) => {
    if (!workspaceId || !user || !isManager) return;

    try {
      await workspace2FAPolicy.revokeExemption(workspaceId, user.id, userId);
      toast.success('Exemption revoked');
      loadPolicyAndStatus();
    } catch (error) {
      toast.error('Failed to revoke exemption');
    }
  };

  const getComplianceRate = () => {
    if (complianceStatus.length === 0) return 0;
    const compliant = complianceStatus.filter(s => s.isCompliant).length;
    return Math.round((compliant / complianceStatus.length) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading security settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal 2FA Setup */}
      <TwoFactorSetup />

      {/* Workspace 2FA Management (Manager Only) */}
      {isManager && (
        <>
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Workspace 2FA Policy</CardTitle>
                    <CardDescription>
                      Manage two-factor authentication requirements for your team
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  Manager Controls
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Require 2FA for Workspace</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce two-factor authentication for all workspace members
                  </p>
                </div>
                <Switch
                  checked={workspaceEnforced}
                  onCheckedChange={handlePolicyToggle}
                />
              </div>

              {workspaceEnforced && (
                <>
                  <Separator />
                  
                  {/* Enforcement Level */}
                  <div className="space-y-3">
                    <Label>Enforcement Level</Label>
                    <Select value={enforcementLevel} onValueChange={handleEnforcementLevelChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span>Required for All Users</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="role_based">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Role-Based Requirements</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role Selection (if role-based) */}
                  {enforcementLevel === 'role_based' && (
                    <div className="space-y-3">
                      <Label>Roles Requiring 2FA</Label>
                      <div className="space-y-2">
                        {['workspace_manager', 'admin', 'user', 'co_worker'].map(role => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              checked={requiredRoles.includes(role)}
                              onCheckedChange={() => handleRoleToggle(role)}
                            />
                            <Label className="text-sm capitalize">
                              {role.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grace Period */}
                  <div className="space-y-3">
                    <Label>Grace Period</Label>
                    <Select value={gracePeriod.toString()} onValueChange={(v) => setGracePeriod(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Immediate</SelectItem>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Time given to users to enable 2FA before access restrictions
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Compliance Dashboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Team 2FA Compliance
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{getComplianceRate()}%</div>
                    <div className="text-xs text-muted-foreground">Compliance Rate</div>
                  </div>
                  <Progress value={getComplianceRate()} className="w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold">
                    {complianceStatus.filter(s => s.has2FAEnabled).length}
                  </div>
                  <div className="text-xs text-muted-foreground">2FA Enabled</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold">
                    {complianceStatus.filter(s => !s.has2FAEnabled && !s.exemptReason).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending Setup</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <UserX className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold">
                    {complianceStatus.filter(s => s.exemptReason).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Exempted</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold">{complianceStatus.length}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
              </div>

              {/* User List */}
              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="border rounded-lg">
                  {complianceStatus.map((status, index) => (
                    <div 
                      key={status.userId}
                      className={`flex items-center justify-between p-3 ${
                        index !== complianceStatus.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          status.has2FAEnabled ? 'bg-green-500' : 
                          status.exemptReason ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <div className="font-medium">{status.name || status.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {status.role.replace('_', ' ')} • {status.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.has2FAEnabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            2FA Active
                          </Badge>
                        ) : status.exemptReason ? (
                          <>
                            <Badge className="bg-blue-100 text-blue-800">
                              Exempted
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevokeExemption(status.userId)}
                            >
                              Revoke
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary">
                              No 2FA
                            </Badge>
                            {workspaceEnforced && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(status);
                                  setShowExemptDialog(true);
                                }}
                              >
                                Grant Exemption
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Plan Upgrade Notice */}
      {workspace?.plan === 'free' && isManager && (
        <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <strong>Upgrade to enforce 2FA:</strong> Free plans support optional 2FA only. 
            Upgrade to Starter or higher to require 2FA for your team.
          </AlertDescription>
        </Alert>
      )}

      {/* Exemption Dialog */}
      <Dialog open={showExemptDialog} onOpenChange={setShowExemptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant 2FA Exemption</DialogTitle>
            <DialogDescription>
              Grant temporary exemption from 2FA requirement for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Exemptions should only be granted in special circumstances. 
                The user will have unrestricted access without 2FA verification.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Reason for Exemption</Label>
              <select 
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  if (selectedUser) {
                    handleGrantExemption(selectedUser.userId, e.target.value);
                  }
                }}
              >
                <option value="">Select a reason...</option>
                <option value="device_incompatible">Device incompatible with authenticator apps</option>
                <option value="temporary_access">Temporary/contractor access</option>
                <option value="accessibility">Accessibility requirements</option>
                <option value="technical_issues">Technical issues with 2FA setup</option>
                <option value="other">Other (documented separately)</option>
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkspaceTwoFactorManagement;