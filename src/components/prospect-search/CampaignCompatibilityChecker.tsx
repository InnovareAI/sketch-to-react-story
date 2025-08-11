// Campaign Compatibility Checker Component
// Shows campaign compatibility analysis and validation results for leads

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  TrendingUp,
  Shield,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useCampaignCompatibility, useValidationFeedback } from '@/hooks/useCampaignValidation';
import { LeadProfile } from '@/services/campaign-rules-engine';

interface CampaignCompatibilityCheckerProps {
  leads: LeadProfile[];
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string) => void;
  onAssignToCampaign: (campaignId: string, validLeadsCount: number) => void;
  className?: string;
}

export function CampaignCompatibilityChecker({
  leads,
  selectedCampaignId,
  onCampaignSelect,
  onAssignToCampaign,
  className
}: CampaignCompatibilityCheckerProps) {
  const { 
    compatibility, 
    bestCampaign, 
    averageCompatibility 
  } = useCampaignCompatibility(leads);

  const {
    feedback,
    canAssign,
    warnings,
    suggestions,
    blockedReasons,
    validLeadsCount,
    totalLeadsCount,
    estimatedSuccessRate,
    selectedCampaign
  } = useValidationFeedback(leads, selectedCampaignId);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAssignToCampaign = () => {
    if (selectedCampaign && canAssign) {
      onAssignToCampaign(selectedCampaign.id, validLeadsCount);
    }
  };

  if (leads.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select leads to see campaign compatibility</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Campaign Compatibility Analysis
          </CardTitle>
          <CardDescription>
            Analyzing {leads.length} leads against {compatibility.length} available campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageCompatibility}%</div>
              <div className="text-sm text-gray-600">Avg Compatibility</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {bestCampaign?.compatibilityScore.toFixed(0) || '0'}%
              </div>
              <div className="text-sm text-gray-600">Best Match</div>
            </div>
          </div>

          {/* Best Campaign Recommendation */}
          {bestCampaign && (
            <Alert className="border-blue-200 bg-blue-50">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Recommended:</strong> "{bestCampaign.campaign.name}" has {bestCampaign.compatibilityScore.toFixed(0)}% compatibility 
                with {bestCampaign.compatibleLeads}/{bestCampaign.totalLeads} leads eligible.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaign Compatibility List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Options</CardTitle>
          <CardDescription>Click a campaign to see detailed validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compatibility.map((comp) => (
              <div
                key={comp.campaign.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCampaignId === comp.campaign.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onCampaignSelect(comp.campaign.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{comp.campaign.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{comp.campaign.type.replace('_', ' ')}</p>
                  </div>
                  <Badge className={getCompatibilityColor(comp.compatibilityScore)}>
                    {comp.compatibilityScore.toFixed(0)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {comp.compatibleLeads}/{comp.totalLeads} leads compatible
                  </span>
                  <Progress value={comp.compatibilityScore} className="w-32" />
                </div>

                {comp.topIssues.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Common issues:</span>
                    {comp.topIssues.map((issue, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Campaign Details */}
      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(feedback.status)}
              {selectedCampaign.name} - Validation Details
            </CardTitle>
            <CardDescription>
              {feedback.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{validLeadsCount}</div>
                <div className="text-xs text-gray-600">Valid Leads</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{totalLeadsCount - validLeadsCount}</div>
                <div className="text-xs text-gray-600">Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{estimatedSuccessRate || 0}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedCampaign.max_leads_per_day}</div>
                <div className="text-xs text-gray-600">Daily Limit</div>
              </div>
            </div>

            <Separator />

            {/* Campaign Requirements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Campaign Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedCampaign.connection_required && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Connection Required
                  </Badge>
                )}
                {selectedCampaign.premium_required && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Premium Required
                  </Badge>
                )}
                {selectedCampaign.email_required && (
                  <Badge variant="outline" className="text-xs">
                    Email Required
                  </Badge>
                )}
                {selectedCampaign.phone_required && (
                  <Badge variant="outline" className="text-xs">
                    Phone Required
                  </Badge>
                )}
                {selectedCampaign.max_connection_degree && (
                  <Badge variant="outline" className="text-xs">
                    Max {selectedCampaign.max_connection_degree} connection
                  </Badge>
                )}
                {selectedCampaign.min_mutual_connections && (
                  <Badge variant="outline" className="text-xs">
                    Min {selectedCampaign.min_mutual_connections} mutual
                  </Badge>
                )}
              </div>
            </div>

            {/* Blocked Reasons */}
            {blockedReasons.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Blocking Issues:</strong>
                    {blockedReasons.slice(0, 3).map((reason, index) => (
                      <div key={index} className="text-sm">• {reason}</div>
                    ))}
                    {blockedReasons.length > 3 && (
                      <div className="text-sm text-red-500">
                        +{blockedReasons.length - 3} more issues
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Warnings:</strong>
                    {warnings.slice(0, 2).map((warning, index) => (
                      <div key={index} className="text-sm">• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Suggestions:</strong>
                    {suggestions.slice(0, 2).map((suggestion, index) => (
                      <div key={index} className="text-sm">• {suggestion}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleAssignToCampaign}
                disabled={!canAssign}
                className={canAssign ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Target className="h-4 w-4 mr-2" />
                {canAssign 
                  ? `Assign ${validLeadsCount} lead${validLeadsCount !== 1 ? 's' : ''} to campaign`
                  : 'Cannot assign to campaign'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}