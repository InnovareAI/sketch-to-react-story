// Premium Validation Alert Component
// Shows premium requirements and validation status for campaigns

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  Zap,
  Crown,
  Key,
  Verified
} from 'lucide-react';
import { premiumValidationService, LinkedInAccountStatus } from '@/services/premium-validation';
import { toast } from 'sonner';

interface PremiumValidationAlertProps {
  campaignType: string;
  selectedAccountId?: string;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
}

export function PremiumValidationAlert({
  campaignType,
  selectedAccountId,
  onValidationChange,
  className
}: PremiumValidationAlertProps) {
  const [accounts, setAccounts] = useState<LinkedInAccountStatus[]>([]);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAccountsAndValidate();
  }, [campaignType, selectedAccountId]);

  const loadAccountsAndValidate = async () => {
    try {
      setLoading(true);
      const linkedinAccounts = await premiumValidationService.getUserLinkedInAccounts();
      setAccounts(linkedinAccounts);

      if (linkedinAccounts.length === 0) {
        setValidation({
          valid: false,
          errors: ['No LinkedIn account connected'],
          warnings: [],
          suggestions: ['Connect a LinkedIn account to create campaigns']
        });
      } else {
        const validationResult = await premiumValidationService.validateCampaignType(
          campaignType,
          selectedAccountId
        );
        setValidation(validationResult);
        onValidationChange?.(validationResult.valid);
      }
    } catch (error) {
      console.error('Error validating campaign:', error);
      setValidation({
        valid: false,
        errors: ['Failed to validate campaign requirements'],
        warnings: [],
        suggestions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAccount = async (accountId: string) => {
    try {
      setRefreshing(true);
      await premiumValidationService.refreshAccountStatus(accountId);
      await loadAccountsAndValidate();
      toast.success('Account status refreshed');
    } catch (error) {
      toast.error('Failed to refresh account status');
    } finally {
      setRefreshing(false);
    }
  };

  const getPremiumStatusBadge = (status: LinkedInAccountStatus['premium_status']) => {
    const variants = {
      basic: { color: 'bg-gray-100 text-gray-800', icon: Shield },
      premium: { color: 'bg-blue-100 text-blue-800', icon: Crown },
      sales_navigator: { color: 'bg-purple-100 text-purple-800', icon: Zap },
      recruiter: { color: 'bg-gold-100 text-gold-800', icon: Crown }
    };

    const config = variants[status] || variants.basic;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const requirements = premiumValidationService.getCampaignRequirements(campaignType);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Validating account requirements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Account Status */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              LinkedIn Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{account.name}</span>
                      {getPremiumStatusBadge(account.premium_status)}
                      {account.two_factor_enabled && (
                        <Badge variant="outline" className="text-xs">
                          <Key className="h-3 w-3 mr-1" />
                          2FA
                        </Badge>
                      )}
                      {account.account_verified && (
                        <Badge variant="outline" className="text-xs">
                          <Verified className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      Daily limits: {account.daily_limits.connections} connections, {account.daily_limits.messages} messages
                      {account.daily_limits.inmails > 0 && `, ${account.daily_limits.inmails} InMails`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshAccount(account.id)}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Requirements */}
      {requirements && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Campaign Requirements
            </CardTitle>
            <CardDescription className="text-xs">
              Requirements for {campaignType.replace('_', ' ').toUpperCase()} campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Premium Account</span>
                <span className={requirements.premium_required ? 'text-orange-600' : 'text-green-600'}>
                  {requirements.premium_required ? 'Required' : 'Not Required'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Sales Navigator</span>
                <span className={requirements.sales_navigator_required ? 'text-orange-600' : 'text-green-600'}>
                  {requirements.sales_navigator_required ? 'Required' : 'Not Required'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Two-Factor Auth</span>
                <span className={requirements.two_factor_required ? 'text-orange-600' : 'text-green-600'}>
                  {requirements.two_factor_required ? 'Required' : 'Not Required'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Account Verification</span>
                <span className={requirements.verified_account_required ? 'text-orange-600' : 'text-green-600'}>
                  {requirements.verified_account_required ? 'Recommended' : 'Not Required'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Cannot create this campaign type:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
            
            {(validation.errors.some(e => e.includes('Premium')) || 
              validation.errors.some(e => e.includes('Sales Navigator'))) && (
              <div className="mt-4">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  Upgrade LinkedIn Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {validation.valid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium text-green-800">
              ✅ All requirements met! You can create this campaign type.
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default PremiumValidationAlert;