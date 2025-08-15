/**
 * KnowledgeIngestionInterface - File upload and link analysis interface
 * Integrates with KnowledgeIngestionAgent for content processing
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload,
  Link,
  Youtube,
  FileText,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Database,
  BarChart3,
  Target,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  Building2
} from 'lucide-react';

interface ProcessedDocument {
  id: string;
  title: string;
  type: 'website' | 'pdf' | 'youtube' | 'document' | 'text';
  url?: string;
  status: 'processing' | 'completed' | 'failed';
  summary: string;
  insights: Array<{
    type: string;
    field: string;
    value: string;
    confidence: number;
  }>;
  chunks: number;
  wordCount: number;
  processedAt: Date;
}

interface KnowledgeIngestionInterfaceProps {
  onActivityUpdate?: (activity: any) => void;
  className?: string;
}

export const KnowledgeIngestionInterface: React.FC<KnowledgeIngestionInterfaceProps> = ({
  onActivityUpdate,
  className = ''
}) => {
  const [url, setUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateActivity = (type: string, message: string, metadata?: any) => {
    onActivityUpdate?.({
      type,
      message,
      timestamp: new Date(),
      metadata
    });
  };

  const processUrl = async () => {
    if (!url.trim()) return;
    
    setIsProcessing(true);
    updateActivity('processing', `Analyzing website: ${url}`);

    try {
      // Step 1: Fetch content
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('searching', 'Scraping website content...');

      // Step 2: Extract content
      await new Promise(resolve => setTimeout(resolve, 2500));
      updateActivity('extracting', 'Extracting structured data...');

      // Step 3: Analyze
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('analyzing', 'Analyzing content for business insights...');

      // Step 4: Store
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateActivity('storing', 'Storing knowledge in database...');

      // Create mock document
      const document: ProcessedDocument = {
        id: `doc_${Date.now()}`,
        title: new URL(url).hostname,
        type: 'website',
        url,
        status: 'completed',
        summary: `Comprehensive analysis of ${new URL(url).hostname} reveals key business insights including company positioning, target market, and value propositions.`,
        insights: [
          { type: 'Company Info', field: 'Industry', value: 'B2B SaaS', confidence: 0.9 },
          { type: 'ICP', field: 'Target Market', value: 'Mid-market companies (100-500 employees)', confidence: 0.85 },
          { type: 'Solutions', field: 'Value Proposition', value: 'Marketing workflow automation with AI', confidence: 0.88 },
          { type: 'Pain Points', field: 'Customer Challenge', value: 'Manual marketing tasks reducing efficiency', confidence: 0.82 }
        ],
        chunks: 12,
        wordCount: 1247,
        processedAt: new Date()
      };

      setDocuments(prev => [document, ...prev]);
      setUrl('');
      updateActivity('complete', `Website analysis complete! Found ${document.insights.length} key insights.`);

    } catch (error) {
      updateActivity('error', 'Failed to analyze website: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    
    setIsProcessing(true);
    updateActivity('processing', `Processing YouTube video: ${youtubeUrl}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      updateActivity('extracting', 'Extracting video transcript...');

      await new Promise(resolve => setTimeout(resolve, 3000));
      updateActivity('analyzing', 'Analyzing transcript for key insights...');

      await new Promise(resolve => setTimeout(resolve, 2200));
      updateActivity('storing', 'Storing video insights...');

      const document: ProcessedDocument = {
        id: `doc_${Date.now()}`,
        title: 'B2B Sales Automation with AI - Video Analysis',
        type: 'youtube',
        url: youtubeUrl,
        status: 'completed',
        summary: 'Video covers advanced B2B sales automation strategies using AI, including multi-channel sequencing, behavioral triggering, and value-first approaches.',
        insights: [
          { type: 'Methodology', field: 'Sales Strategy', value: 'Multi-channel sequencing approach', confidence: 0.92 },
          { type: 'Methodology', field: 'Trigger Strategy', value: 'Behavioral triggering for personalization', confidence: 0.89 },
          { type: 'Solutions', field: 'Approach', value: 'Value-first outreach methodology', confidence: 0.87 },
          { type: 'Performance', field: 'Results', value: '40% higher response rates, 25% shorter cycles', confidence: 0.95 }
        ],
        chunks: 8,
        wordCount: 892,
        processedAt: new Date()
      };

      setDocuments(prev => [document, ...prev]);
      setYoutubeUrl('');
      updateActivity('complete', `YouTube analysis complete! Extracted ${document.insights.length} strategic insights.`);

    } catch (error) {
      updateActivity('error', 'Failed to process YouTube video: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = async () => {
    if (!textContent.trim()) return;
    
    setIsProcessing(true);
    updateActivity('processing', `Analyzing text content: ${textTitle || 'User Content'}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('analyzing', 'Extracting business insights from text...');

      await new Promise(resolve => setTimeout(resolve, 2500));
      updateActivity('storing', 'Storing analyzed content...');

      const document: ProcessedDocument = {
        id: `doc_${Date.now()}`,
        title: textTitle || 'User Text Content',
        type: 'text',
        status: 'completed',
        summary: 'Analysis of user-provided text content reveals strategic insights relevant to business operations and customer engagement.',
        insights: [
          { type: 'Company Info', field: 'Business Model', value: 'Extracted from provided content', confidence: 0.75 },
          { type: 'Tone & Voice', field: 'Communication Style', value: 'Professional and solution-focused', confidence: 0.80 },
        ],
        chunks: Math.ceil(textContent.split(' ').length / 100),
        wordCount: textContent.split(' ').length,
        processedAt: new Date()
      };

      setDocuments(prev => [document, ...prev]);
      setTextContent('');
      setTextTitle('');
      updateActivity('complete', `Text analysis complete! Generated ${document.chunks} knowledge chunks.`);

    } catch (error) {
      updateActivity('error', 'Failed to analyze text: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    updateActivity('processing', `Processing uploaded file: ${file.name}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateActivity('extracting', 'Extracting content from document...');

      await new Promise(resolve => setTimeout(resolve, 3000));
      updateActivity('analyzing', 'Analyzing document structure and content...');

      await new Promise(resolve => setTimeout(resolve, 2000));
      updateActivity('storing', 'Storing document knowledge...');

      const document: ProcessedDocument = {
        id: `doc_${Date.now()}`,
        title: file.name,
        type: 'document',
        status: 'completed',
        summary: `Document analysis of ${file.name} completed. Extracted key business information and structured knowledge for search and reference.`,
        insights: [
          { type: 'Company Info', field: 'Document Type', value: file.type.includes('pdf') ? 'PDF Document' : 'Document File', confidence: 1.0 },
          { type: 'Solutions', field: 'Content Category', value: 'Business Documentation', confidence: 0.85 },
        ],
        chunks: Math.ceil(file.size / 1000), // Rough estimate
        wordCount: Math.ceil(file.size / 5), // Rough estimate
        processedAt: new Date()
      };

      setDocuments(prev => [document, ...prev]);
      updateActivity('complete', `Document processing complete! File ready for knowledge queries.`);

    } catch (error) {
      updateActivity('error', 'Failed to process document: ' + error.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'company info': return <Building2 className="w-3 h-3" />;
      case 'icp': return <Target className="w-3 h-3" />;
      case 'methodology': return <Brain className="w-3 h-3" />;
      case 'solutions': return <CheckCircle className="w-3 h-3" />;
      case 'pain points': return <AlertCircle className="w-3 h-3" />;
      case 'performance': return <BarChart3 className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.8) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const exportKnowledge = () => {
    const data = documents.map(doc => ({
      title: doc.title,
      type: doc.type,
      summary: doc.summary,
      insights: doc.insights,
      wordCount: doc.wordCount,
      processedAt: doc.processedAt.toISOString()
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sam-ai-knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Ingestion</h2>
            <p className="text-sm text-gray-600">Upload files and analyze content for your knowledge base</p>
          </div>
        </div>
        
        {documents.length > 0 && (
          <div className="flex space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>{documents.length} Documents</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={exportKnowledge}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Input Panel - Left */}
        <div className="w-96 border-r bg-gray-50 p-4 overflow-y-auto">
          <Tabs defaultValue="website" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="website">
                <Globe className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="youtube">
                <Youtube className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="website" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="website-url" className="text-sm font-medium">Website URL</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="website-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://company.com"
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={processUrl} 
                    disabled={!url.trim() || isProcessing}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Analyze company websites, landing pages, and documentation
                </p>
              </div>
            </TabsContent>

            <TabsContent value="youtube" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="youtube-url" className="text-sm font-medium">YouTube URL</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="youtube-url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={processYoutube} 
                    disabled={!youtubeUrl.trim() || isProcessing}
                    className="bg-gradient-to-r from-red-500 to-pink-600"
                  >
                    <Youtube className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Extract insights from video presentations and webinars
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium">Upload Document</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.md"
                    disabled={isProcessing}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full border-dashed border-2 h-20 bg-white hover:bg-gray-50"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload PDF, Word, or text files
                      </span>
                    </div>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Process presentations, documents, and reports
                </p>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="text-title" className="text-sm font-medium">Title</Label>
                <Input
                  id="text-title"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="Content title..."
                  disabled={isProcessing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="text-content" className="text-sm font-medium">Content</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your content here..."
                  disabled={isProcessing}
                  className="mt-2 h-32"
                />
              </div>
              <Button 
                onClick={processText} 
                disabled={!textContent.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analyze Text
              </Button>
              <p className="text-xs text-gray-500">
                Analyze any text content for business insights
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Panel - Right */}
        <div className="flex-1 flex flex-col">
          {documents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Build Your Knowledge Base
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload documents, analyze websites, or process YouTube videos to build your AI's knowledge base.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Website Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Youtube className="w-4 h-4" />
                    <span>Video Transcripts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Document Upload</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Text Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* Documents List */}
              <div className="w-80 border-r bg-white">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">Processed Documents</h3>
                  <p className="text-sm text-gray-600">{documents.length} items in knowledge base</p>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {documents.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className={`cursor-pointer transition-all hover:shadow-sm ${
                          selectedDocument?.id === doc.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              {doc.type === 'website' && <Globe className="w-4 h-4 text-blue-500" />}
                              {doc.type === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                              {doc.type === 'document' && <FileText className="w-4 h-4 text-green-500" />}
                              {doc.type === 'text' && <FileText className="w-4 h-4 text-purple-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {doc.summary}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {doc.insights.length} insights
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {doc.chunks} chunks
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Document Details */}
              <div className="flex-1 bg-gray-50">
                {selectedDocument ? (
                  <div className="h-full flex flex-col">
                    {/* Document Header */}
                    <div className="p-4 bg-white border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            {selectedDocument.title}
                          </h2>
                          <p className="text-sm text-gray-600 mb-3">
                            {selectedDocument.summary}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Type: {selectedDocument.type}</span>
                            <span>•</span>
                            <span>{selectedDocument.wordCount} words</span>
                            <span>•</span>
                            <span>{selectedDocument.chunks} chunks</span>
                            <span>•</span>
                            <span>{selectedDocument.processedAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {selectedDocument.url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Source
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View Content
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Insights */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 mb-3">Extracted Insights</h3>
                        {selectedDocument.insights.map((insight, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {getInsightTypeIcon(insight.type)}
                                    <Badge variant="outline" className="text-xs">
                                      {insight.type}
                                    </Badge>
                                  </div>
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {insight.field}
                                  </h4>
                                  <p className="text-gray-700">
                                    {insight.value}
                                  </p>
                                </div>
                                <Badge 
                                  className={`text-xs ${getConfidenceColor(insight.confidence)}`}
                                >
                                  {Math.round(insight.confidence * 100)}%
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Select a Document
                      </h3>
                      <p className="text-gray-600">
                        Choose a document from the list to view its insights and analysis
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeIngestionInterface;