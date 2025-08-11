/**
 * LinkedIn Account Connection Modal
 * Multi-step modal for adding LinkedIn accounts with credentials, proxy, and 2FA setup
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Linkedin, 
  Shield, 
  Lock, 
  Globe, 
  AlertCircle, 
  ChevronRight,
  ChevronLeft,
  Building2,
  Mail,
  Eye,
  EyeOff,
  MapPin,
  Smartphone,
  Key,
  Check,
  Copy,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInAccountModalProps {
  open: boolean;
  onClose: () => void;
  workspaces?: Array<{ id: string; name: string }>;
  onComplete: (accountData: any) => void;
}

export function LinkedInAccountModal({ 
  open, 
  onClose, 
  workspaces = [],
  onComplete 
}: LinkedInAccountModalProps) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [has2FA, setHas2FA] = useState<'yes' | 'no' | ''>('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    workspaceId: '',
    email: '',
    password: '',
    stayLoggedIn: true,
    invitationCode: '',
    country: '',
    twoFactorSecret: '',
    twoFactorCode: ''
  });

  // Country list for proxy selection
  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' }
  ];

  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.workspaceId || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else if (step === 2) {
      if (!formData.country) {
        toast.error('Please select a country for your proxy');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Here you would call your API to save the LinkedIn account
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('LinkedIn account connected successfully!');
      onComplete({
        ...formData,
        status: 'active'
      });
      onClose();
    } catch (error) {
      toast.error('Failed to connect LinkedIn account');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateVerificationCode = () => {
    // This would normally use a TOTP library with the secret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    return code;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`w-24 h-1 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div className={`w-24 h-1 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {step > 3 ? <Check className="h-4 w-4" /> : '3'}
            </div>
          </div>
        </div>

        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                Connect your LinkedIn account
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-4">
                <p>
                  Innovareai can safely automate tasks such as sending connection requests and messages 
                  on your behalf by connecting to your LinkedIn account. To integrate smoothly with LinkedIn, 
                  we require your profile credentials. Choosing an alternative method would necessitate extra 
                  coding on your page, potentially noticeable by LinkedIn.
                </p>
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Rest assured, we prioritize the security of your information. All data is safely stored, 
                    and should you choose to stop using our app, we will promptly erase your credentials.
                  </AlertDescription>
                </Alert>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workspace">Select company you want to add this account to</Label>
                <Select value={formData.workspaceId} onValueChange={(value) => setFormData({...formData, workspaceId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company/workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(workspace => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {workspace.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">LinkedIn email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">LinkedIn password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter LinkedIn password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  If you forgot the password, you may reset it in the settings of your LinkedIn
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="stayLoggedIn"
                  checked={formData.stayLoggedIn}
                  onCheckedChange={(checked) => setFormData({...formData, stayLoggedIn: checked as boolean})}
                />
                <div className="space-y-1">
                  <label htmlFor="stayLoggedIn" className="text-sm font-medium cursor-pointer">
                    Stay logged in (recommended)
                  </label>
                  <p className="text-xs text-gray-500">
                    You'll go through a quick setup now, but it helps you stay connected and avoid unexpected disconnections later.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitationCode">Invitation code (optional)</Label>
                <Input
                  id="invitationCode"
                  placeholder="Enter invitation code if you have one"
                  value={formData.invitationCode}
                  onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 2: Country/Proxy Selection */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Select country
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-4">
                <p>
                  Your country proxy must be the same as the location from where you access the LinkedIn account. 
                  We will provide you with a free proxy to protect your IP address and reduce the chance of LinkedIn restrictions.
                </p>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Select the country for proxy you want to run your LinkedIn
                  </AlertDescription>
                </Alert>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>LinkedIn country</Label>
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {countries.map(country => (
                    <button
                      key={country.code}
                      onClick={() => setFormData({...formData, country: country.code})}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        formData.country === country.code 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                      {formData.country === country.code && (
                        <Check className="h-4 w-4 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {formData.country && (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    You selected {countries.find(c => c.code === formData.country)?.name}. 
                    A dedicated IP address from this location will be assigned to your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Step 3: 2FA Setup */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                Activate LinkedIn two-step verification
              </DialogTitle>
              <DialogDescription className="text-left pt-4">
                Set up two-step verification to keep your LinkedIn account safe, connected, 
                and running smoothly while using the automation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <RadioGroup value={has2FA} onValueChange={(value) => setHas2FA(value as 'yes' | 'no')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has2fa" />
                  <label htmlFor="has2fa" className="cursor-pointer">Yes, I have 2FA enabled</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no2fa" />
                  <label htmlFor="no2fa" className="cursor-pointer">I don't have any 2FA</label>
                </div>
              </RadioGroup>

              {has2FA === 'yes' && (
                <div className="space-y-6">
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
                      Confirm you use an Authenticator app
                    </h4>
                    <ol className="space-y-2 text-sm ml-8">
                      <li>1. Disable your existing LinkedIn 2FA settings</li>
                      <li>2. Re-enable LinkedIn 2FA by selecting Authenticator app.</li>
                      <li>3. In LinkedIn, scan the QR code from the authenticator app.</li>
                      <li>4. On LinkedIn, copy and save the secret key under the QR code</li>
                      <li>5. Click "Continue" on LinkedIn after scanning the QR code.</li>
                    </ol>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
                      Paste the secret key from LinkedIn here
                    </h4>
                    <div className="space-y-2 ml-8">
                      <Input
                        placeholder="e.g. XDXNLZPE74LHNRCMZIGMIPZM5CLXH6EC"
                        value={formData.twoFactorSecret}
                        onChange={(e) => setFormData({...formData, twoFactorSecret: e.target.value.toUpperCase()})}
                        className="font-mono"
                        maxLength={32}
                      />
                      <p className="text-xs text-gray-500">32 characters</p>
                      <Button 
                        onClick={() => {
                          if (formData.twoFactorSecret.length === 32) {
                            const code = generateVerificationCode();
                            toast.success(`Verification code: ${code}`);
                          } else {
                            toast.error('Please enter a valid 32-character secret key');
                          }
                        }}
                        disabled={formData.twoFactorSecret.length !== 32}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Verify Secret Key
                      </Button>
                    </div>
                  </div>

                  {verificationCode && (
                    <>
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
                          Confirm Your LinkedIn Setup
                        </h4>
                        <Alert className="ml-8">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Return to LinkedIn to finish the setup. You will need to enter the 6-digit code 
                            and click on verify to save the settings. Setup will fail if you skip the LinkedIn step!
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">4</span>
                          Confirm your 6-digit pin
                        </h4>
                        <div className="ml-8 p-4 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Your verification code:</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-mono font-bold">{verificationCode}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(verificationCode)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Make sure this matches the pin shown in your authentication app.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {has2FA === 'no' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <p className="font-semibold mb-2">2FA is highly recommended</p>
                    <p className="text-sm mb-3">
                      Two-factor authentication adds an extra layer of security to your LinkedIn account 
                      and helps prevent unexpected disconnections during automation.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('https://www.linkedin.com/psettings/two-step-verification', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Set up 2FA on LinkedIn
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={loading || (has2FA === 'yes' && !verificationCode)}
              >
                {loading ? 'Connecting...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}