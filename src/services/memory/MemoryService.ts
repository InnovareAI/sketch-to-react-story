/**
 * Memory Service for SAM AI - Full RAG Pipeline
 * Manages persistent context storage and retrieval with vector embeddings
 */

import { supabase } from '@/integrations/supabase/client';
import { LLMService } from '../llm/LLMService';

export interface MemoryItem {
  id: string;
  workspace_id: string;
  type: 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference';
  category: 'business' | 'technical' | 'strategy' | 'performance';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  source: 'user_input' | 'document_upload' | 'conversation' | 'analysis';
  confidence: number; // 0-1 score of how confident SAM is about this info
  embedding?: number[]; // Vector embedding for semantic search
  chunk_index?: number; // For document chunks
  parent_document_id?: string; // Reference to original document
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed: Date;
  expiresAt?: Date; // Optional expiration for temporary context
}

export interface DocumentChunk {
  id: string;
  workspace_id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  tokens: number;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SemanticSearchResult {
  chunk: DocumentChunk;
  similarity: number;
  context: string;
}

export class MemoryService {
  private static instance: MemoryService;
  private llmService: LLMService;
  private currentWorkspaceId: string;

  private constructor() {
    this.llmService = LLMService.getInstance();
    // Get workspace ID from localStorage (demo mode)
    this.currentWorkspaceId = localStorage.getItem('demo_workspace_id') || 'df5d730f-1915-4269-bd5a-9534478b17af';
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Generate embeddings for text content
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small' // Cost-effective embedding model
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Fallback: return zero vector
      return new Array(1536).fill(0);
    }
  }

  /**
   * Chunk large content into smaller pieces for better retrieval
   */
  private chunkContent(content: string, maxChunkSize: number = 1000): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
      } else {
        currentChunk += (currentChunk.length > 0 ? '. ' : '') + sentence.trim();
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [content];
  }

  /**
   * Store a document with chunking and embeddings
   */
  public async storeDocument(
    title: string,
    content: string,
    metadata: Record<string, unknown> = {},
    source: 'user_input' | 'document_upload' | 'conversation' | 'analysis' = 'document_upload'
  ): Promise<string> {
    try {
      // Create document record
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          id: documentId,
          workspace_id: this.currentWorkspaceId,
          title,
          content,
          metadata,
          source,
          status: 'processing',
          created_at: new Date().toISOString()
        });

      if (docError) {
        console.error('Error storing document:', docError);
        throw new Error(`Failed to store document: ${docError.message}`);
      }

      // Chunk the content
      const chunks = this.chunkContent(content);
      console.log(`Generated ${chunks.length} chunks for document: ${title}`);

      // Process chunks with embeddings
      const chunkPromises = chunks.map(async (chunkContent, index) => {
        const embedding = await this.generateEmbedding(chunkContent);
        
        return {
          id: `${documentId}_chunk_${index}`,
          workspace_id: this.currentWorkspaceId,
          document_id: documentId,
          content: chunkContent,
          chunk_index: index,
          tokens: chunkContent.split(' ').length,
          embedding,
          metadata: { ...metadata, chunk_type: 'text' },
          created_at: new Date().toISOString()
        };
      });

      const processedChunks = await Promise.all(chunkPromises);

      // Store chunks in database
      const { error: chunksError } = await supabase
        .from('knowledge_chunks')
        .insert(processedChunks);

      if (chunksError) {
        console.error('Error storing chunks:', chunksError);
        throw new Error(`Failed to store chunks: ${chunksError.message}`);
      }

      // Update document status
      await supabase
        .from('knowledge_documents')
        .update({ 
          status: 'completed',
          chunk_count: chunks.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      console.log(`✅ Successfully stored document with ${chunks.length} chunks and embeddings`);
      return documentId;

    } catch (error) {
      console.error('Document storage failed:', error);
      throw error;
    }
  }

  /**
   * Store a new memory item (legacy interface for compatibility)
   */
  public async storeMemory(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed' | 'workspace_id'>): Promise<MemoryItem> {
    // For simple memory items, store as a single document
    const documentId = await this.storeDocument(
      item.title,
      item.content,
      { 
        type: item.type,
        category: item.category,
        tags: item.tags,
        confidence: item.confidence,
        ...item.metadata 
      },
      item.source
    );

    const memory: MemoryItem = {
      ...item,
      id: documentId,
      workspace_id: this.currentWorkspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date()
    };

    return memory;
  }

  /**
   * Semantic search across knowledge base
   */
  public async semanticSearch(
    query: string, 
    limit: number = 5,
    minSimilarity: number = 0.7
  ): Promise<SemanticSearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Use Supabase's vector similarity search
      const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit,
        filter_workspace_id: this.currentWorkspaceId
      });

      if (error) {
        console.error('Semantic search error:', error);
        return [];
      }

      return chunks.map((chunk: any) => ({
        chunk: {
          id: chunk.id,
          workspace_id: chunk.workspace_id,
          document_id: chunk.document_id,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          tokens: chunk.tokens,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
          created_at: chunk.created_at
        },
        similarity: chunk.similarity,
        context: this.buildContext(chunk.content, query)
      }));

    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Build contextual information around a chunk
   */
  private buildContext(chunkContent: string, query: string): string {
    // Simple context building - highlight relevant parts
    const queryWords = query.toLowerCase().split(' ');
    let context = chunkContent;
    
    queryWords.forEach(word => {
      if (word.length > 3) {
        const regex = new RegExp(`(${word})`, 'gi');
        context = context.replace(regex, '**$1**');
      }
    });

    return context;
  }

  /**
   * Get relevant context for a user query
   */
  public async getRelevantContext(
    query: string,
    maxTokens: number = 2000
  ): Promise<{ context: string; sources: string[] }> {
    const results = await this.semanticSearch(query, 10, 0.6);
    
    if (results.length === 0) {
      return { context: 'No relevant context found.', sources: [] };
    }

    let context = '';
    let currentTokens = 0;
    const sources: string[] = [];

    for (const result of results) {
      const chunkTokens = result.chunk.tokens;
      
      if (currentTokens + chunkTokens > maxTokens) {
        break;
      }

      context += `\n\n--- Source: ${result.chunk.document_id} (Similarity: ${(result.similarity * 100).toFixed(1)}%) ---\n`;
      context += result.context;
      
      currentTokens += chunkTokens;
      sources.push(result.chunk.document_id);
    }

    return { context: context.trim(), sources: [...new Set(sources)] };
  }

  /**
   * Get memory items by type and category (for compatibility)
   */
  public async getMemoriesByType(
    type: MemoryItem['type'],
    category?: MemoryItem['category']
  ): Promise<MemoryItem[]> {
    try {
      let query = supabase
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', this.currentWorkspaceId)
        .contains('metadata', { type });

      if (category) {
        query = query.contains('metadata', { category });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching memories:', error);
        return [];
      }

      return data.map(doc => ({
        id: doc.id,
        workspace_id: doc.workspace_id,
        type: doc.metadata.type,
        category: doc.metadata.category,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        tags: doc.metadata.tags || [],
        source: doc.source,
        confidence: doc.metadata.confidence || 0.8,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at || doc.created_at),
        accessCount: 0,
        lastAccessed: new Date()
      }));

    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Get all documents for the workspace
   */
  public async getAllDocuments(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('workspace_id', this.currentWorkspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  /**
   * Delete a document and its chunks
   */
  public async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Delete chunks first
      const { error: chunksError } = await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', documentId);

      if (chunksError) {
        console.error('Error deleting chunks:', chunksError);
        return false;
      }

      // Delete document
      const { error: docError } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId);

      if (docError) {
        console.error('Error deleting document:', docError);
        return false;
      }

      console.log(`✅ Successfully deleted document: ${documentId}`);
      return true;

    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Legacy methods for compatibility
  public clearAllMemories(): void {
    console.log('clearAllMemories called - implement if needed for development');
  }

  public getMemoryByType(type: string): MemoryItem[] {
    console.log(`getMemoryByType called with ${type} - use getMemoriesByType instead`);
    return [];
  }
}

export default MemoryService;