import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Download,
  AlertCircle,
  User,
  Building2,
  Mail,
  ExternalLink,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

interface Prospect {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  phone?: string;
  tags?: string[];
  source: 'csv' | 'contacts' | 'manual' | 'search-url';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ProspectValidation {
  prospect: Prospect;
  index: number;
  validation: ValidationResult;
  severity: 'valid' | 'warning' | 'error';
}

interface ValidationSummary {
  totalProspects: number;
  validProspects: number;
  prospectsWithWarnings: number;
  prospectsWithErrors: number;
  overallScore: number;
  readyForCampaign: boolean;
}

interface ProspectValidatorProps {
  prospects: Prospect[];
  onProspectsChange: (prospects: Prospect[]) => void;
  campaignType: string;
}

export function ProspectValidator({ prospects, onProspectsChange, campaignType }: ProspectValidatorProps) {
  const [validations, setValidations] = useState<ProspectValidation[]>([]);
  const [summary, setSummary] = useState<ValidationSummary>({
    totalProspects: 0,
    validProspects: 0,
    prospectsWithWarnings: 0,
    prospectsWithErrors: 0,
    overallScore: 0,
    readyForCampaign: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'errors' | 'warnings' | 'valid'>('all');

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLinkedInUrl = (url: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!url || url.trim() === '') {
      errors.push('LinkedIn URL is required for LinkedIn campaigns');
      return { isValid: false, errors, warnings };
    }

    // Check if it's a valid URL
    try {
      const urlObj = new URL(url);
      
      // Check if it's a LinkedIn URL
      if (!urlObj.hostname.includes('linkedin.com')) {
        errors.push('URL must be from linkedin.com');
        return { isValid: false, errors, warnings };
      }

      // Check URL format patterns
      const validPatterns = [
        /linkedin\.com\/in\/[\w-]+\/?$/,  // Standard profile URL
        /linkedin\.com\/pub\/[\w-]+\/[\w\/]+\/?$/,  // Public profile URL
        /linkedin\.com\/profile\/view\?id=\d+/,  // Legacy profile URL
      ];

      const isValidPattern = validPatterns.some(pattern => pattern.test(url));
      
      if (!isValidPattern) {
        warnings.push('LinkedIn URL format may not be standard profile URL');
      }

      // Check for common issues
      if (url.includes('linkedin.com/company/')) {
        errors.push('This appears to be a company page, not a personal profile');
        return { isValid: false, errors, warnings };
      }

      if (url.includes('?')) {
        warnings.push('URL contains parameters - consider using clean profile URL');
      }

      return { isValid: true, errors, warnings };

    } catch (e) {
      errors.push('Invalid URL format');
      return { isValid: false, errors, warnings };
    }
  };

  const validateCompanyName = (company: string): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];

    if (!company || company.trim() === '') {
      warnings.push('Company name missing - may reduce personalization effectiveness');
      return { isValid: true, warnings };
    }

    // Check for common company name issues
    if (company.length < 2) {
      warnings.push('Company name seems too short');
    }

    if (company.toLowerCase().includes('freelance') || company.toLowerCase().includes('self-employed')) {
      warnings.push('Freelancer/self-employed - may have different outreach approach');
    }

    const suspiciousPatterns = ['n/a', 'none', 'unknown', '-', 'null'];
    if (suspiciousPatterns.some(pattern => company.toLowerCase().includes(pattern))) {
      warnings.push('Company name appears to be placeholder text');
    }

    return { isValid: true, warnings };
  };

  const validateName = (firstName: string, lastName: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!firstName || firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!lastName || lastName.trim() === '') {
      errors.push('Last name is required');
    }

    // Check for common name issues
    if (firstName && (firstName.length < 2 || /^[a-z]$/.test(firstName))) {
      warnings.push('First name seems too short or may be initial only');
    }

    if (lastName && (lastName.length < 2 || /^[a-z]$/.test(lastName))) {
      warnings.push('Last name seems too short or may be initial only');
    }

    // Check for placeholder names
    const placeholderPatterns = ['test', 'example', 'sample', 'demo', 'n/a', 'none'];
    if (placeholderPatterns.some(pattern => 
      firstName?.toLowerCase().includes(pattern) || lastName?.toLowerCase().includes(pattern)
    )) {
      warnings.push('Name appears to be placeholder text');
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const validateCampaignCompatibility = (prospect: Prospect): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (campaignType) {
      case 'connector':
        if (!prospect.linkedin_url) {
          errors.push('LinkedIn URL required for connection campaigns');
        }
        break;
      
      case 'messenger':
        if (!prospect.linkedin_url) {
          warnings.push('LinkedIn URL recommended for messaging campaigns');
        }
        break;
      
      case 'open-inmail':
        if (!prospect.linkedin_url) {
          errors.push('LinkedIn URL required for InMail campaigns');
        }
        if (!prospect.title) {
          warnings.push('Job title helps with InMail targeting');
        }
        break;
      
      case 'event-invite':
        if (!prospect.email) {
          errors.push('Email address required for event invitations');
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const validateSingleProspect = useCallback((prospect: Prospect, index: number): ProspectValidation => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allSuggestions: string[] = [];

    // Validate names
    const nameValidation = validateName(prospect.first_name, prospect.last_name);
    allErrors.push(...nameValidation.errors);
    allWarnings.push(...nameValidation.warnings);

    // Validate email
    if (!prospect.email || prospect.email.trim() === '') {
      allErrors.push('Email address is required');
    } else if (!validateEmail(prospect.email)) {
      allErrors.push('Invalid email format');
    }

    // Validate LinkedIn URL
    if (prospect.linkedin_url) {
      const linkedInValidation = validateLinkedInUrl(prospect.linkedin_url);
      allErrors.push(...linkedInValidation.errors);
      allWarnings.push(...linkedInValidation.warnings);
    }

    // Validate company
    const companyValidation = validateCompanyName(prospect.company || '');
    allWarnings.push(...companyValidation.warnings);

    // Validate campaign compatibility
    const campaignValidation = validateCampaignCompatibility(prospect);
    allErrors.push(...campaignValidation.errors);
    allWarnings.push(...campaignValidation.warnings);

    // Generate suggestions
    if (!prospect.title && prospect.linkedin_url) {
      allSuggestions.push('Consider adding job title for better personalization');
    }

    if (!prospect.company && prospect.linkedin_url) {
      allSuggestions.push('Company name would improve message targeting');
    }

    if (prospect.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(prospect.phone)) {
      allWarnings.push('Phone number format may be invalid');
    }

    const validation: ValidationResult = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions
    };

    const severity: 'valid' | 'warning' | 'error' = 
      allErrors.length > 0 ? 'error' : 
      allWarnings.length > 0 ? 'warning' : 'valid';

    return {
      prospect,
      index,
      validation,
      severity
    };
  }, [campaignType]);

  const validateAllProspects = useCallback(async () => {
    setIsValidating(true);
    
    try {
      // Simulate validation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const validationResults = prospects.map((prospect, index) => 
        validateSingleProspect(prospect, index)
      );

      setValidations(validationResults);

      // Calculate summary
      const totalProspects = validationResults.length;
      const validProspects = validationResults.filter(v => v.severity === 'valid').length;
      const prospectsWithWarnings = validationResults.filter(v => v.severity === 'warning').length;
      const prospectsWithErrors = validationResults.filter(v => v.severity === 'error').length;
      
      const overallScore = totalProspects > 0 ? Math.round(((validProspects + prospectsWithWarnings * 0.5) / totalProspects) * 100) : 0;
      const readyForCampaign = prospectsWithErrors === 0 && totalProspects > 0;

      setSummary({
        totalProspects,
        validProspects,
        prospectsWithWarnings,
        prospectsWithErrors,
        overallScore,
        readyForCampaign
      });

      if (readyForCampaign) {
        toast.success('All prospects validated successfully!');
      } else if (prospectsWithErrors > 0) {
        toast.warning(`${prospectsWithErrors} prospects have errors that need fixing`);
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate prospects');
    } finally {
      setIsValidating(false);
    }
  }, [prospects, validateSingleProspect]);

  // Auto-validate when prospects change
  useEffect(() => {
    if (prospects.length > 0) {
      validateAllProspects();
    } else {
      setValidations([]);
      setSummary({
        totalProspects: 0,
        validProspects: 0,
        prospectsWithWarnings: 0,
        prospectsWithErrors: 0,
        overallScore: 0,
        readyForCampaign: false
      });
    }
  }, [prospects, validateAllProspects]);

  const removeProspect = (index: number) => {
    const updatedProspects = prospects.filter((_, i) => i !== index);
    onProspectsChange(updatedProspects);
    toast.success('Prospect removed');
  };

  const exportValidationReport = () => {
    const report = validations.map(v => ({
      name: `${v.prospect.first_name} ${v.prospect.last_name}`,
      email: v.prospect.email,
      company: v.prospect.company || '',
      linkedin_url: v.prospect.linkedin_url || '',
      status: v.severity,
      errors: v.validation.errors.join('; '),
      warnings: v.validation.warnings.join('; '),
      suggestions: v.validation.suggestions.join('; ')
    }));

    const csvContent = [
      'Name,Email,Company,LinkedIn URL,Status,Errors,Warnings,Suggestions',
      ...report.map(r => `"${r.name}","${r.email}","${r.company}","${r.linkedin_url}","${r.status}","${r.errors}","${r.warnings}","${r.suggestions}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospect_validation_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Validation report downloaded');
  };

  const filteredValidations = validations.filter(v => {
    switch (filterLevel) {
      case 'errors': return v.severity === 'error';
      case 'warnings': return v.severity === 'warning';
      case 'valid': return v.severity === 'valid';
      default: return true;
    }
  });

  if (prospects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gray-400" />
            Prospect Validation
          </CardTitle>
          <CardDescription>
            Add prospects to see validation results and campaign readiness
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {summary.readyForCampaign ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : summary.prospectsWithErrors > 0 ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            Prospect Validation Summary
          </CardTitle>
          <CardDescription>
            Data quality check for {campaignType} campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Quality Score</span>
              <span className="text-2xl font-bold">{summary.overallScore}%</span>
            </div>
            <Progress value={summary.overallScore} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalProspects}</div>
              <div className="text-sm text-gray-600">Total Prospects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.validProspects}</div>
              <div className="text-sm text-gray-600">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.prospectsWithWarnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.prospectsWithErrors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>

          {/* Campaign Readiness */}
          <Alert className={summary.readyForCampaign ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {summary.readyForCampaign ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={summary.readyForCampaign ? 'text-green-800' : 'text-red-800'}>
              {summary.readyForCampaign ? (
                <span className="font-medium">✅ Ready for Campaign Launch</span>
              ) : (
                <span>
                  <span className="font-medium">⚠️ Campaign Not Ready:</span> {summary.prospectsWithErrors} prospect(s) have errors that must be fixed before launching.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={validateAllProspects}
                disabled={isValidating}
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-validate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportValidationReport}
                disabled={validations.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Details</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filterLevel === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('all')}
              >
                All ({validations.length})
              </Button>
              <Button
                variant={filterLevel === 'errors' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('errors')}
                disabled={summary.prospectsWithErrors === 0}
              >
                Errors ({summary.prospectsWithErrors})
              </Button>
              <Button
                variant={filterLevel === 'warnings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('warnings')}
                disabled={summary.prospectsWithWarnings === 0}
              >
                Warnings ({summary.prospectsWithWarnings})
              </Button>
              <Button
                variant={filterLevel === 'valid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('valid')}
                disabled={summary.validProspects === 0}
              >
                Valid ({summary.validProspects})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredValidations.map((validation, index) => (
                <div key={validation.index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {validation.severity === 'valid' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : validation.severity === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">
                            {validation.prospect.first_name} {validation.prospect.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{validation.prospect.email}</div>
                        </div>
                        <Badge
                          variant={validation.severity === 'valid' ? 'default' : 
                                  validation.severity === 'warning' ? 'secondary' : 'destructive'}
                        >
                          {validation.severity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <Building2 className="h-3 w-3" />
                            Company
                          </div>
                          <div>{validation.prospect.company || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn
                          </div>
                          <div className="truncate">
                            {validation.prospect.linkedin_url ? (
                              <a 
                                href={validation.prospect.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Profile
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <User className="h-3 w-3" />
                            Source
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {validation.prospect.source}
                          </Badge>
                        </div>
                      </div>

                      {/* Errors */}
                      {validation.validation.errors.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-red-600 mb-1">Errors:</div>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {validation.validation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings */}
                      {validation.validation.warnings.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-yellow-600 mb-1">Warnings:</div>
                          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                            {validation.validation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {validation.validation.suggestions.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-blue-600 mb-1">Suggestions:</div>
                          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                            {validation.validation.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProspect(validation.index)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredValidations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No prospects match the current filter
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}