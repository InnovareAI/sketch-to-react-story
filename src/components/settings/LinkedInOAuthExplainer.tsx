/**
 * LinkedIn OAuth Flow Explainer Component
 * Visual explanation of how LinkedIn OAuth works with automated provisioning
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Linkedin,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Globe,
  Key,
  Users,
  MessageSquare,
  Lock,
  Cloud,
  Sparkles
} from 'lucide-react';

export function LinkedInOAuthExplainer() {
  const flowSteps = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automatic Provisioning",
      description: "When you create a workspace, we automatically create your Unipile account and generate API keys",
      automated: true,
      details: [
        "Unipile sub-account created instantly",
        "Unique API keys generated",
        "Bright Data proxies configured",
        "No manual setup needed"
      ]
    },
    {
      icon: <Linkedin className="h-5 w-5" />,
      title: "LinkedIn Authorization",
      description: "Click 'Connect LinkedIn' to start the secure OAuth flow",
      automated: false,
      details: [
        "Opens LinkedIn login page",
        "You log in with your LinkedIn credentials",
        "Grant permissions for profile access",
        "LinkedIn never shares your password"
      ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Token Exchange",
      description: "LinkedIn provides secure access tokens to Unipile",
      automated: true,
      details: [
        "Authorization code exchanged for tokens",
        "Tokens encrypted and stored in Unipile vault",
        "Your LinkedIn password is never stored",
        "Automatic token refresh when needed"
      ]
    },
    {
      icon: <Cloud className="h-5 w-5" />,
      title: "Integration Activated",
      description: "Your LinkedIn account is now connected and ready for automation",
      automated: true,
      details: [
        "Send connection requests",
        "Send messages and InMails",
        "View profile visits",
        "Export connections data"
      ]
    }
  ];

  const permissions = [
    {
      name: "Basic Profile",
      scope: "r_liteprofile",
      description: "View your LinkedIn profile information"
    },
    {
      name: "Email Address",
      scope: "r_emailaddress",
      description: "Access your primary email address"
    },
    {
      name: "Share Content",
      scope: "w_member_social",
      description: "Post updates and share content"
    },
    {
      name: "Company Pages",
      scope: "r_organization_social",
      description: "Manage your company pages"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Explainer Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Linkedin className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">How LinkedIn OAuth Works</CardTitle>
              <CardDescription className="text-base">
                Secure, automated integration with zero manual configuration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Fully Automated!</strong> Unlike traditional systems that require manual API setup, 
              our platform automatically provisions everything when you create your workspace. 
              Just click "Connect" and you're ready to go!
            </AlertDescription>
          </Alert>

          {/* OAuth Flow Steps */}
          <div className="space-y-4">
            {flowSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-3 rounded-lg ${
                      step.automated 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {step.icon}
                    </div>
                    {index < flowSteps.length - 1 && (
                      <div className="w-0.5 h-20 bg-gray-300 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {step.title}
                          {step.automated && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              Automated
                            </Badge>
                          )}
                        </h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <ul className="space-y-1">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            LinkedIn Permissions Explained
          </CardTitle>
          <CardDescription>
            What access you're granting when you connect LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((permission, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{permission.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {permission.scope}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {permission.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            Security & Privacy Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">OAuth 2.0</h4>
              <p className="text-sm text-muted-foreground">
                Industry-standard secure authentication
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1">Encrypted Storage</h4>
              <p className="text-sm text-muted-foreground">
                Tokens encrypted in Unipile's secure vault
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">IP Rotation</h4>
              <p className="text-sm text-muted-foreground">
                Bright Data proxies for safe automation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <div className="space-y-2">
              <div>
                <span className="text-gray-500">// Step 1: Workspace provisioning (automatic)</span>
              </div>
              <div>
                <span className="text-blue-400">POST</span> /api/provision-workspace
              </div>
              <div className="pl-4">
                <div>→ Creates Unipile account</div>
                <div>→ Generates API keys</div>
                <div>→ Configures Bright Data proxies</div>
              </div>
              
              <div className="mt-4">
                <span className="text-gray-500">// Step 2: User initiates OAuth</span>
              </div>
              <div>
                <span className="text-blue-400">GET</span> /api/linkedin/authorize
              </div>
              <div className="pl-4">
                <div>→ Redirects to LinkedIn login</div>
                <div>→ User grants permissions</div>
              </div>
              
              <div className="mt-4">
                <span className="text-gray-500">// Step 3: Handle callback</span>
              </div>
              <div>
                <span className="text-blue-400">POST</span> /api/linkedin/callback
              </div>
              <div className="pl-4">
                <div>→ Exchange code for tokens</div>
                <div>→ Store encrypted tokens</div>
                <div>→ Activate automation features</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LinkedInOAuthExplainer;