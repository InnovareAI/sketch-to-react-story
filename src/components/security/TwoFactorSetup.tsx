/**
 * Two-Factor Authentication Setup Component
 * Guides users through enabling 2FA with QR code and backup codes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Shield,
  Smartphone,
  Key,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  QrCode,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { twoFactorAuth } from '@/services/two-factor-auth';
import { useAuth } from '@/contexts/AuthContext';

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function TwoFactorSetup() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [setupStep, setSetupStep] = useState<'scan' | 'verify' | 'backup'>('scan');
  const [password, setPassword] = useState('');

  // Start 2FA setup
  const initiateTwoFactorSetup = async () => {
    if (!user) return;

    try {
      const setup = await twoFactorAuth.setupTwoFactor(user.id, user.email!);
      setSetupData(setup);
      setShowSetupDialog(true);
      setSetupStep('scan');
    } catch (error) {
      toast.error('Failed to initialize 2FA setup');
    }
  };

  // Verify and enable 2FA
  const verifyAndEnable = async () => {
    if (!user || !verificationCode) return;

    setIsVerifying(true);
    try {
      await twoFactorAuth.enableTwoFactor(user.id, verificationCode);
      setIsEnabled(true);
      setSetupStep('backup');
      toast.success('Two-factor authentication enabled successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  // Disable 2FA
  const disableTwoFactor = async () => {
    if (!user || !password) return;

    try {
      await twoFactorAuth.disableTwoFactor(user.id, password);
      setIsEnabled(false);
      setShowSetupDialog(false);
      setSetupData(null);
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `SAM AI Platform - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

These codes can be used to access your account if you lose access to your authenticator app.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sam-ai-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Main 2FA Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            {isEnabled ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEnabled ? (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication significantly improves your account security by requiring 
                  both your password and a verification code from your phone.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold mb-1">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator, Authy, or similar
                  </p>
                </div>
                <div className="text-center p-4">
                  <Key className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-1">Backup Codes</h4>
                  <p className="text-sm text-muted-foreground">
                    Emergency access if you lose your phone
                  </p>
                </div>
                <div className="text-center p-4">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold mb-1">Enhanced Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Protect against unauthorized access
                  </p>
                </div>
              </div>

              <Button onClick={initiateTwoFactorSetup} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Your account is protected with two-factor authentication.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Authenticator App</p>
                        <p className="text-xs text-muted-foreground">Connected and active</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Backup Codes</p>
                        <p className="text-xs text-muted-foreground">10 codes available</p>
                      </div>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBackupCodes(true)}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {/* Show disable dialog */}}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Follow these steps to secure your account with 2FA
            </DialogDescription>
          </DialogHeader>

          <Tabs value={setupStep} onValueChange={(v) => setSetupStep(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan" disabled={setupStep === 'backup'}>
                1. Scan QR
              </TabsTrigger>
              <TabsTrigger value="verify" disabled={setupStep !== 'verify' && setupStep !== 'backup'}>
                2. Verify
              </TabsTrigger>
              <TabsTrigger value="backup" disabled={setupStep !== 'backup'}>
                3. Backup
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Scan QR Code */}
            <TabsContent value="scan" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app
                </p>
                {setupData && (
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Can't scan? Enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={setupData?.secret || ''} 
                    readOnly 
                    type={showSecret ? 'text' : 'password'}
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(setupData?.secret || '', 'Secret key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Popular authenticator apps: Google Authenticator, Microsoft Authenticator, Authy, 1Password
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                onClick={() => setSetupStep('verify')}
              >
                Next: Verify Code
              </Button>
            </TabsContent>

            {/* Step 2: Verify */}
            <TabsContent value="verify" className="space-y-4">
              <div className="text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-mono"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={verifyAndEnable}
                disabled={verificationCode.length !== 6 || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify and Enable 2FA
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Step 3: Backup Codes */}
            <TabsContent value="backup" className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Success!</strong> Two-factor authentication is now enabled.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Your Backup Codes</Label>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    Save these codes in a secure location. Each code can only be used once.
                  </AlertDescription>
                </Alert>
                
                {setupData && (
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                    {setupData.backupCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm">
                        {i + 1}. {code}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(setupData?.backupCodes.join('\n') || '', 'Backup codes')}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  setShowSetupDialog(false);
                  window.location.reload();
                }}
              >
                Done
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TwoFactorSetup;