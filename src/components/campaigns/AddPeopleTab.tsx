import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Users, 
  UserPlus, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Download,
  Search,
  Filter,
  Mail,
  Building2,
  User,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { ProspectValidator } from './ProspectValidator';
import { linkedInExtractor, type ExtractedProspect } from '@/services/linkedinExtractor';

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

interface AddPeopleTabProps {
  selectedPeople: Prospect[];
  onPeopleChange: (people: Prospect[]) => void;
  campaignType: string;
}

export function AddPeopleTab({ selectedPeople, onPeopleChange, campaignType }: AddPeopleTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'search-url' | 'manual'>('upload');
  
  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Prospect[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  
  // Search URL state
  const [searchUrl, setSearchUrl] = useState('');
  const [isExtractingFromUrl, setIsExtractingFromUrl] = useState(false);
  const [urlExtractionError, setUrlExtractionError] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [lastExtractionResult, setLastExtractionResult] = useState<{ prospects: number; errors: string[] } | null>(null);
  
  // Manual entry state
  const [manualProspect, setManualProspect] = useState<Partial<Prospect>>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    company: '',
    linkedin_url: '',
    phone: ''
  });

  // CSV Upload Functions
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setCsvFile(file);
    processCsvFile(file);
  }, []);

  const processCsvFile = useCallback((file: File) => {
    setIsProcessingCsv(true);
    setCsvErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV must contain at least a header row and one data row');
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
        
        // Validate required fields
        const requiredFields = ['first_name', 'last_name', 'email'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
        }

        // Convert to prospects
        const prospects: Prospect[] = [];
        const errors: string[] = [];
        
        rows.forEach((row, index) => {
          if (row.length !== headers.length) {
            errors.push(`Row ${index + 2}: Column count mismatch`);
            return;
          }

          const prospect: Prospect = {
            first_name: '',
            last_name: '',
            email: '',
            source: 'csv'
          };

          headers.forEach((header, colIndex) => {
            const value = row[colIndex] || '';
            switch (header) {
              case 'first_name':
                prospect.first_name = value;
                break;
              case 'last_name':
                prospect.last_name = value;
                break;
              case 'email':
                prospect.email = value;
                break;
              case 'title':
              case 'job_title':
                prospect.title = value;
                break;
              case 'company':
              case 'company_name':
                prospect.company = value;
                break;
              case 'linkedin_url':
              case 'linkedin':
                prospect.linkedin_url = value;
                break;
              case 'phone':
              case 'phone_number':
                prospect.phone = value;
                break;
            }
          });

          // Validate email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(prospect.email)) {
            errors.push(`Row ${index + 2}: Invalid email format`);
            return;
          }

          // Validate required fields
          if (!prospect.first_name || !prospect.last_name) {
            errors.push(`Row ${index + 2}: Missing first name or last name`);
            return;
          }

          prospects.push(prospect);
        });

        setCsvData(prospects);
        setCsvPreview([headers, ...rows.slice(0, 5)]); // Show first 5 rows for preview
        setCsvErrors(errors);
        
        if (errors.length === 0) {
          toast.success(`Successfully parsed ${prospects.length} prospects from CSV`);
        } else {
          toast.warning(`Parsed ${prospects.length} valid prospects with ${errors.length} errors`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
        setCsvErrors([errorMessage]);
        toast.error(errorMessage);
      } finally {
        setIsProcessingCsv(false);
      }
    };

    reader.readAsText(file);
  }, []);

  const addCsvProspects = useCallback(() => {
    if (csvData.length === 0) {
      toast.error('No valid prospects to add');
      return;
    }

    // Deduplicate with existing prospects
    const existingEmails = new Set(selectedPeople.map(p => p.email.toLowerCase()));
    const newProspects = csvData.filter(p => !existingEmails.has(p.email.toLowerCase()));
    
    if (newProspects.length === 0) {
      toast.warning('All prospects from CSV are already added');
      return;
    }

    const updatedPeople = [...selectedPeople, ...newProspects];
    onPeopleChange(updatedPeople);
    
    toast.success(`Added ${newProspects.length} new prospects from CSV`);
    
    // Reset CSV state
    setCsvFile(null);
    setCsvData([]);
    setCsvPreview([]);
    setCsvErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [csvData, selectedPeople, onPeopleChange]);

  // Search URL Functions
  const extractFromSearchUrl = useCallback(async () => {
    if (!searchUrl.trim()) {
      toast.error('Please enter a LinkedIn or Sales Navigator search URL');
      return;
    }

    setIsExtractingFromUrl(true);
    setUrlExtractionError(null);
    setExtractionProgress('Validating URL...');
    setLastExtractionResult(null);

    try {
      // Step 1: Extract prospects from LinkedIn URL
      setExtractionProgress('Extracting profiles from LinkedIn...');
      const extractionResult = await linkedInExtractor.extractFromSearchUrl(searchUrl);

      if (!extractionResult.success) {
        setUrlExtractionError(extractionResult.errors.join(', '));
        toast.error(`Extraction failed: ${extractionResult.errors[0]}`);
        return;
      }

      setExtractionProgress('Processing extracted data...');

      // Step 2: Convert extracted prospects to our format
      const convertedProspects: Prospect[] = extractionResult.prospects.map((extracted: ExtractedProspect) => ({
        first_name: extracted.first_name,
        last_name: extracted.last_name,
        email: extracted.email,
        title: extracted.title,
        company: extracted.company,
        linkedin_url: extracted.linkedin_url,
        phone: extracted.phone,
        source: 'search-url' as const
      }));

      setExtractionProgress('Checking for duplicates...');

      // Step 3: Filter out duplicates
      const existingEmails = new Set(selectedPeople.map(p => p.email.toLowerCase()));
      const newProspects = convertedProspects.filter(p => !existingEmails.has(p.email.toLowerCase()));
      
      const duplicateCount = convertedProspects.length - newProspects.length;

      // Step 4: Add new prospects
      if (newProspects.length > 0) {
        const updatedPeople = [...selectedPeople, ...newProspects];
        onPeopleChange(updatedPeople);
        
        toast.success(
          `Successfully extracted ${newProspects.length} new prospects!` +
          (duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : '')
        );
      } else if (duplicateCount > 0) {
        toast.warning('All extracted prospects are already in your list');
      } else {
        toast.warning('No prospects were extracted from the URL');
      }

      // Step 5: Store extraction results for display
      setLastExtractionResult({
        prospects: newProspects.length,
        errors: extractionResult.errors
      });

      // Clear the URL after successful extraction
      setSearchUrl('');
      setExtractionProgress('Extraction completed!');

    } catch (error) {
      console.error('URL extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      setUrlExtractionError(`Failed to extract prospects: ${errorMessage}`);
      toast.error('Failed to extract prospects from URL');
    } finally {
      setIsExtractingFromUrl(false);
      setTimeout(() => setExtractionProgress(''), 3000);
    }
  }, [searchUrl, selectedPeople, onPeopleChange]);

  // Manual Entry Functions
  const addManualProspect = useCallback(() => {
    const { first_name, last_name, email } = manualProspect;
    
    if (!first_name || !last_name || !email) {
      toast.error('First name, last name, and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    const existingEmails = new Set(selectedPeople.map(p => p.email.toLowerCase()));
    if (existingEmails.has(email.toLowerCase())) {
      toast.warning('This prospect is already added');
      return;
    }

    const prospect: Prospect = {
      first_name,
      last_name,
      email,
      title: manualProspect.title || undefined,
      company: manualProspect.company || undefined,
      linkedin_url: manualProspect.linkedin_url || undefined,
      phone: manualProspect.phone || undefined,
      source: 'manual'
    };

    const updatedPeople = [...selectedPeople, prospect];
    onPeopleChange(updatedPeople);
    
    toast.success('Prospect added successfully');
    
    // Reset form
    setManualProspect({
      first_name: '',
      last_name: '',
      email: '',
      title: '',
      company: '',
      linkedin_url: '',
      phone: ''
    });
  }, [manualProspect, selectedPeople, onPeopleChange]);

  // Remove prospect
  const removeProspect = useCallback((index: number) => {
    const updatedPeople = selectedPeople.filter((_, i) => i !== index);
    onPeopleChange(updatedPeople);
    toast.success('Prospect removed');
  }, [selectedPeople, onPeopleChange]);

  return (
    <div className="space-y-6">
      {/* Selected Prospects Summary */}
      {selectedPeople.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Added Prospects ({selectedPeople.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {selectedPeople.map((prospect, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {prospect.first_name} {prospect.last_name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{prospect.email}</div>
                    {prospect.title && (
                      <div className="text-xs text-gray-400 truncate">{prospect.title}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge variant="outline" className="text-xs">
                      {prospect.source}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProspect(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add People Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Add People to Campaign</CardTitle>
          <CardDescription>
            Choose how you want to add prospects to your {campaignType} campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="search-url" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search URL
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            {/* CSV Upload Tab */}
            <TabsContent value="upload" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label>Upload CSV File</Label>
                  <div className="mt-2">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {csvFile ? csvFile.name : 'Click to select CSV file or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Required columns: first_name, last_name, email
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* CSV Preview */}
                {csvPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 5 rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvPreview[0]?.map((header, index) => (
                                <th key={index} className="px-3 py-2 text-left font-medium text-gray-900">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.slice(1).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-gray-700">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* CSV Errors */}
                {csvErrors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Found {csvErrors.length} errors:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {csvErrors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {csvErrors.length > 5 && (
                            <li>... and {csvErrors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* CSV Actions */}
                {csvData.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        Ready to add {csvData.length} prospects
                      </p>
                      <p className="text-blue-700">
                        {csvErrors.length > 0 && `${csvErrors.length} rows had errors and will be skipped`}
                      </p>
                    </div>
                    <Button onClick={addCsvProspects} disabled={isProcessingCsv}>
                      {isProcessingCsv ? 'Processing...' : 'Add Prospects'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Search URL Tab */}
            <TabsContent value="search-url" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-url">LinkedIn or Sales Navigator Search URL</Label>
                  <div className="mt-2 space-y-2">
                    <Textarea
                      id="search-url"
                      value={searchUrl}
                      onChange={(e) => setSearchUrl(e.target.value)}
                      placeholder="Paste your LinkedIn or Sales Navigator search URL here...
Example: https://www.linkedin.com/search/results/people/?keywords=marketing%20manager
Example: https://www.linkedin.com/sales/search/people?..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Copy the URL from your LinkedIn search results or Sales Navigator search
                    </p>
                  </div>
                </div>

                {/* Extraction Progress */}
                {isExtractingFromUrl && extractionProgress && (
                  <Alert>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {extractionProgress}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Extraction Error */}
                {urlExtractionError && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{urlExtractionError}</AlertDescription>
                  </Alert>
                )}

                {/* Last Extraction Results */}
                {lastExtractionResult && !isExtractingFromUrl && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-1">
                        <p className="font-medium">
                          ✅ Extracted {lastExtractionResult.prospects} prospects successfully
                        </p>
                        {lastExtractionResult.errors.length > 0 && (
                          <div className="text-sm">
                            <p className="text-yellow-700">Warnings:</p>
                            <ul className="list-disc list-inside">
                              {lastExtractionResult.errors.map((error, idx) => (
                                <li key={idx} className="text-yellow-600">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to get the search URL:</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Go to LinkedIn or Sales Navigator</li>
                    <li>Perform your search (job title, company, location, etc.)</li>
                    <li>Copy the URL from your browser's address bar</li>
                    <li>Paste it here and click "Extract Prospects"</li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={extractFromSearchUrl}
                    disabled={isExtractingFromUrl || !searchUrl.trim()}
                  >
                    {isExtractingFromUrl ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Extract Prospects
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> This feature requires backend integration with LinkedIn's API or web scraping capabilities. 
                    Currently showing as a placeholder. For immediate use, please upload a CSV file with your prospect data.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-first-name">First Name *</Label>
                  <Input
                    id="manual-first-name"
                    value={manualProspect.first_name}
                    onChange={(e) => setManualProspect({...manualProspect, first_name: e.target.value})}
                    placeholder="Enter first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-last-name">Last Name *</Label>
                  <Input
                    id="manual-last-name"
                    value={manualProspect.last_name}
                    onChange={(e) => setManualProspect({...manualProspect, last_name: e.target.value})}
                    placeholder="Enter last name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-email">Email *</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    value={manualProspect.email}
                    onChange={(e) => setManualProspect({...manualProspect, email: e.target.value})}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-title">Job Title</Label>
                  <Input
                    id="manual-title"
                    value={manualProspect.title}
                    onChange={(e) => setManualProspect({...manualProspect, title: e.target.value})}
                    placeholder="Enter job title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-company">Company</Label>
                  <Input
                    id="manual-company"
                    value={manualProspect.company}
                    onChange={(e) => setManualProspect({...manualProspect, company: e.target.value})}
                    placeholder="Enter company name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-phone">Phone</Label>
                  <Input
                    id="manual-phone"
                    value={manualProspect.phone}
                    onChange={(e) => setManualProspect({...manualProspect, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="manual-linkedin">LinkedIn URL</Label>
                  <Input
                    id="manual-linkedin"
                    value={manualProspect.linkedin_url}
                    onChange={(e) => setManualProspect({...manualProspect, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={addManualProspect}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Prospect
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* CSV Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Need a CSV template?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Download our CSV template with the correct column headers
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const csvContent = "first_name,last_name,email,title,company,linkedin_url,phone\nJohn,Doe,john.doe@example.com,Marketing Manager,Example Corp,https://linkedin.com/in/johndoe,+1-555-0123";
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'prospect_template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('CSV template downloaded');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prospect Validation */}
      {selectedPeople.length > 0 && (
        <ProspectValidator 
          prospects={selectedPeople}
          onProspectsChange={onPeopleChange}
          campaignType={campaignType}
        />
      )}
    </div>
  );
}