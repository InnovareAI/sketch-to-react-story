/**
 * KnowledgeIngestionAgent - File upload and link analysis for knowledge base
 * Handles website scraping, PDF processing, YouTube transcripts, and document uploads
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, TaskRequest, TaskResponse, ConversationContext } from '../types/AgentTypes';
import { LLMService } from '../../llm/LLMService';
import { MemoryService } from '../../memory/MemoryService';

export interface ContentSource {
  id: string;
  type: 'website' | 'pdf' | 'youtube' | 'document' | 'text';
  url?: string;
  title: string;
  content: string;
  metadata: {
    fileSize?: number;
    mimeType?: string;
    wordCount?: number;
    extractedAt: Date;
    language?: string;
    author?: string;
    publishedAt?: Date;
  };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  chunks: KnowledgeChunk[];
  extractions: KnowledgeExtraction[];
  source: ContentSource;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  createdAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  chunkIndex: number;
  tokens: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface KnowledgeExtraction {
  type: 'company_info' | 'icp' | 'methodology' | 'pain_points' | 'solutions' | 'tone_voice';
  field: string;
  value: string | Record<string, unknown>;
  confidence: number;
  sourceChunk: string;
}

export class KnowledgeIngestionAgent extends BaseAgent {
  private llmService: LLMService;
  private memoryService: MemoryService;

  constructor(config: AgentConfig) {
    super('knowledge-ingestion', config);
    this.llmService = LLMService.getInstance();
    this.memoryService = MemoryService.getInstance();
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    this.capabilities = [
      {
        name: 'website-analysis',
        description: 'Extract and analyze content from websites',
        supportedComplexity: ['moderate', 'complex'],
        estimatedDuration: 180, // 3 minutes
        requiredParameters: ['url'],
        optionalParameters: ['depth', 'include_subpages']
      },
      {
        name: 'document-processing',
        description: 'Process uploaded documents (PDF, Word, etc.)',
        supportedComplexity: ['simple', 'moderate'],
        estimatedDuration: 120, // 2 minutes
        requiredParameters: ['file_content', 'file_type'],
        optionalParameters: ['extraction_focus']
      },
      {
        name: 'youtube-transcript',
        description: 'Extract and analyze YouTube video transcripts',
        supportedComplexity: ['moderate'],
        estimatedDuration: 150, // 2.5 minutes
        requiredParameters: ['youtube_url'],
        optionalParameters: ['include_timestamps']
      },
      {
        name: 'content-analysis',
        description: 'Analyze content for business insights and knowledge extraction',
        supportedComplexity: ['complex'],
        estimatedDuration: 240, // 4 minutes
        requiredParameters: ['content'],
        optionalParameters: ['analysis_focus', 'extraction_types']
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Initializing Knowledge Ingestion Agent...');
    this.isInitialized = true;
  }

  async processTask(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const startTime = Date.now();
    
    try {
      switch (task.type) {
        case 'analyze_website':
          return await this.analyzeWebsite(task, context);
          
        case 'process_document':
          return await this.processDocument(task, context);
          
        case 'analyze_youtube':
          return await this.analyzeYouTube(task, context);
          
        case 'analyze_content':
          return await this.analyzeContent(task, context);
          
        default:
          return {
            success: false,
            error: `Unsupported task type: ${task.type}`,
            agentId: this.agentId,
            taskId: task.id,
            processingTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Knowledge ingestion failed: ${error.message}`,
        agentId: this.agentId,
        taskId: task.id,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze website content
   */
  private async analyzeWebsite(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const url = task.parameters.url as string;
    const depth = (task.parameters.depth as number) || 1;
    
    // Mock website scraping - in real implementation, would use web scraping service
    const mockContent = `
# TechFlow Solutions - Workflow Automation Platform

## About TechFlow Solutions
TechFlow Solutions is a leading B2B SaaS company specializing in marketing workflow automation. Founded in 2021, we help mid-market companies streamline their marketing operations through AI-powered automation tools.

## Our Mission
To eliminate manual marketing tasks and help teams focus on strategy and creativity rather than repetitive processes.

## Products & Services
- Marketing Workflow Automation
- Lead Scoring & Nurturing
- Campaign Management
- Analytics & Reporting
- Integration Hub (connect with 200+ tools)

## Target Market
We serve mid-market companies (100-500 employees) in:
- Technology
- E-commerce
- Professional Services
- SaaS
- Manufacturing

## Key Benefits
- 40% reduction in manual marketing tasks
- 25% increase in qualified leads
- 60% faster campaign deployment
- ROI improvement of 3.2x on average

## Customer Success Stories
"TechFlow helped us scale from 50 to 500 leads per month without adding headcount" - Sarah Johnson, VP Marketing at GrowthCorp

## Contact Information
- Website: techflow.com
- Email: hello@techflow.com
- Phone: (555) 123-4567
- LinkedIn: /company/techflow-solutions
    `;

    const source: ContentSource = {
      id: `website_${Date.now()}`,
      type: 'website',
      url,
      title: 'TechFlow Solutions - Company Website',
      content: mockContent,
      metadata: {
        wordCount: mockContent.split(' ').length,
        extractedAt: new Date(),
        language: 'en'
      }
    };

    // Process and analyze content
    const document = await this.processContentSource(source, context);

    return {
      success: true,
      result: {
        document,
        source,
        analysis_summary: await this.generateAnalysisSummary(document),
        extracted_insights: document.extractions,
        chunks_created: document.chunks.length
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - performance.now()
    };
  }

  /**
   * Process uploaded document
   */
  private async processDocument(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const fileContent = task.parameters.file_content as string;
    const fileName = task.parameters.file_name as string;
    const fileType = task.parameters.file_type as string;

    const source: ContentSource = {
      id: `document_${Date.now()}`,
      type: 'document',
      title: fileName,
      content: fileContent,
      metadata: {
        mimeType: fileType,
        fileSize: fileContent.length,
        wordCount: fileContent.split(' ').length,
        extractedAt: new Date()
      }
    };

    const document = await this.processContentSource(source, context);

    return {
      success: true,
      result: {
        document,
        source,
        analysis_summary: await this.generateAnalysisSummary(document),
        extracted_insights: document.extractions
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - performance.now()
    };
  }

  /**
   * Analyze YouTube video
   */
  private async analyzeYouTube(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const youtubeUrl = task.parameters.youtube_url as string;
    
    // Mock YouTube transcript - in real implementation, would use YouTube API
    const mockTranscript = `
[00:00] Welcome to this video about B2B sales automation and how AI is transforming the way we approach prospect outreach.

[00:30] In today's competitive market, sales teams need to be more efficient and personalized than ever before. That's where AI-powered sales automation comes in.

[01:00] The key to successful B2B sales automation is understanding your ideal customer profile. You need to know exactly who you're targeting, what their pain points are, and how your solution addresses those challenges.

[02:00] Let me share three strategies that have worked incredibly well for our clients:

[02:15] Strategy 1: Multi-channel sequencing. Instead of just sending emails, combine LinkedIn outreach, phone calls, and email in a coordinated sequence.

[03:00] Strategy 2: Behavioral triggering. Use prospect behavior data to trigger personalized messages at exactly the right moment.

[04:00] Strategy 3: Value-first approach. Always lead with insights, helpful resources, or solutions to their problems rather than pushing your product.

[05:00] The results speak for themselves - companies using these AI-powered approaches see 40% higher response rates and 25% shorter sales cycles.

[06:00] Remember, the goal isn't to replace human connection, but to make those connections more meaningful and timely.
    `;

    const source: ContentSource = {
      id: `youtube_${Date.now()}`,
      type: 'youtube',
      url: youtubeUrl,
      title: 'B2B Sales Automation with AI - YouTube Video',
      content: mockTranscript,
      metadata: {
        wordCount: mockTranscript.split(' ').length,
        extractedAt: new Date(),
        language: 'en'
      }
    };

    const document = await this.processContentSource(source, context);

    return {
      success: true,
      result: {
        document,
        source,
        transcript: mockTranscript,
        key_insights: document.extractions.filter(e => e.type === 'methodology'),
        analysis_summary: await this.generateAnalysisSummary(document)
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - performance.now()
    };
  }

  /**
   * Analyze arbitrary content
   */
  private async analyzeContent(task: TaskRequest, context: ConversationContext): Promise<TaskResponse> {
    const content = task.parameters.content as string;
    const title = task.parameters.title as string || 'User Content';
    const analysisFocus = task.parameters.analysis_focus as string[];

    const source: ContentSource = {
      id: `content_${Date.now()}`,
      type: 'text',
      title,
      content,
      metadata: {
        wordCount: content.split(' ').length,
        extractedAt: new Date()
      }
    };

    const document = await this.processContentSource(source, context, analysisFocus);

    return {
      success: true,
      result: {
        document,
        source,
        analysis_summary: await this.generateAnalysisSummary(document),
        extracted_insights: document.extractions
      },
      agentId: this.agentId,
      taskId: task.id,
      processingTime: Date.now() - performance.now()
    };
  }

  /**
   * Process content source into knowledge document
   */
  private async processContentSource(
    source: ContentSource, 
    context: ConversationContext,
    analysisFocus?: string[]
  ): Promise<KnowledgeDocument> {
    // Step 1: Chunk the content
    const chunks = await this.createContentChunks(source.content);

    // Step 2: Extract structured knowledge
    const extractions = await this.extractKnowledge(source.content, analysisFocus);

    // Step 3: Generate document summary
    const summary = await this.generateDocumentSummary(source);

    const document: KnowledgeDocument = {
      id: `doc_${Date.now()}`,
      title: source.title,
      description: summary,
      content: source.content,
      chunks,
      extractions,
      source,
      processingStatus: 'completed',
      confidence: 0.85,
      createdAt: new Date()
    };

    // Store in memory system
    await this.storeKnowledgeDocument(document, context);

    return document;
  }

  /**
   * Create content chunks for vector storage
   */
  private async createContentChunks(content: string): Promise<KnowledgeChunk[]> {
    const chunks: KnowledgeChunk[] = [];
    const maxChunkSize = 500; // words
    const words = content.split(' ');

    for (let i = 0; i < words.length; i += maxChunkSize) {
      const chunkContent = words.slice(i, i + maxChunkSize).join(' ');
      
      chunks.push({
        id: `chunk_${Date.now()}_${i}`,
        content: chunkContent,
        chunkIndex: Math.floor(i / maxChunkSize),
        tokens: chunkContent.split(' ').length,
        metadata: {
          start_word: i,
          end_word: Math.min(i + maxChunkSize, words.length),
          chunk_type: 'text'
        }
      });
    }

    return chunks;
  }

  /**
   * Extract structured knowledge from content
   */
  private async extractKnowledge(content: string, focus?: string[]): Promise<KnowledgeExtraction[]> {
    const extractionPrompt = `
Analyze this content and extract structured business knowledge:

Content:
${content}

${focus ? `Focus Areas: ${focus.join(', ')}` : ''}

Extract information for these categories:
1. Company Information (name, industry, size, location, etc.)
2. Ideal Customer Profile (target market, customer characteristics)
3. Business Methodology (approaches, strategies, frameworks)
4. Pain Points (customer problems, challenges)
5. Solutions (products, services, value propositions)
6. Tone & Voice (communication style, messaging approach)

For each extraction, provide:
- Type (category)
- Field (specific data point)
- Value (extracted information)
- Confidence (0-1)

Return as JSON array.
    `;

    const extraction = await this.llmService.chat([
      {
        role: 'system',
        content: 'You are a business intelligence analyst extracting structured knowledge from content.'
      },
      {
        role: 'user',
        content: extractionPrompt
      }
    ], {
      model: 'quality',
      temperature: 0.2,
      maxTokens: 1500
    });

    try {
      const parsed = JSON.parse(extraction.content);
      return parsed.map((item: any, index: number) => ({
        type: item.type || 'company_info',
        field: item.field,
        value: item.value,
        confidence: item.confidence || 0.8,
        sourceChunk: `chunk_0` // Simplified for demo
      }));
    } catch (error) {
      console.error('Failed to parse knowledge extractions:', error);
      return [];
    }
  }

  /**
   * Generate document summary
   */
  private async generateDocumentSummary(source: ContentSource): Promise<string> {
    const summaryPrompt = `
Create a concise 2-3 sentence summary of this ${source.type} content:

Title: ${source.title}
Content: ${source.content.substring(0, 1000)}...

Focus on the main business purpose, key insights, and relevance for B2B sales and marketing.
    `;

    const summary = await this.llmService.chat([
      {
        role: 'system',
        content: 'Generate concise summaries of business content.'
      },
      {
        role: 'user',
        content: summaryPrompt
      }
    ], {
      model: 'fast',
      temperature: 0.4,
      maxTokens: 200
    });

    return summary.content;
  }

  /**
   * Generate analysis summary
   */
  private async generateAnalysisSummary(document: KnowledgeDocument): Promise<string> {
    const analysisPrompt = `
Analyze this knowledge document and provide actionable insights:

Document: ${document.title}
Extractions: ${document.extractions.length} insights found
Content Type: ${document.source.type}

Key Extractions:
${document.extractions.slice(0, 5).map(e => `- ${e.field}: ${e.value}`).join('\n')}

Provide 2-3 sentences highlighting the most valuable insights for B2B sales and marketing.
    `;

    const analysis = await this.llmService.chat([
      {
        role: 'system',
        content: 'Analyze business knowledge and provide actionable insights.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ], {
      model: 'quality',
      temperature: 0.5,
      maxTokens: 300
    });

    return analysis.content;
  }

  /**
   * Store knowledge document in memory system
   */
  private async storeKnowledgeDocument(document: KnowledgeDocument, context: ConversationContext): Promise<void> {
    await this.memoryService.storeMemory({
      type: 'company',
      category: 'business',
      title: document.title,
      content: document.description,
      tags: ['knowledge_base', 'ingested_content', document.source.type],
      source: 'analysis',
      confidence: document.confidence,
      metadata: {
        document_id: document.id,
        source_type: document.source.type,
        source_url: document.source.url,
        chunks_count: document.chunks.length,
        extractions_count: document.extractions.length,
        word_count: document.source.metadata.wordCount,
        session_id: context.sessionId,
        ingested_at: document.createdAt.toISOString()
      }
    });

    // Store individual extractions as separate memories
    for (const extraction of document.extractions) {
      await this.memoryService.storeMemory({
        type: this.mapExtractionTypeToMemoryType(extraction.type),
        category: 'business',
        title: `${extraction.field} (from ${document.title})`,
        content: typeof extraction.value === 'string' ? extraction.value : JSON.stringify(extraction.value),
        tags: ['extracted_knowledge', extraction.type, document.source.type],
        source: 'extraction',
        confidence: extraction.confidence,
        metadata: {
          document_id: document.id,
          extraction_type: extraction.type,
          source_chunk: extraction.sourceChunk
        }
      });
    }
  }

  /**
   * Map extraction type to memory type
   */
  private mapExtractionTypeToMemoryType(extractionType: string): 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference' {
    const mapping: Record<string, 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference'> = {
      'company_info': 'company',
      'icp': 'audience',
      'methodology': 'campaign',
      'pain_points': 'audience',
      'solutions': 'product',
      'tone_voice': 'preference'
    };

    return mapping[extractionType] || 'company';
  }

  getCapabilities() {
    return this.capabilities;
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && this.llmService !== null;
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    console.log('Knowledge ingestion agent shut down');
  }
}

export default KnowledgeIngestionAgent;