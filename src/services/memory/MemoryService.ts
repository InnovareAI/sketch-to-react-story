/**
 * Memory Service for SAM AI
 * Manages persistent context storage and retrieval
 */

export interface MemoryItem {
  id: string;
  type: 'product' | 'audience' | 'company' | 'campaign' | 'conversation' | 'preference';
  category: 'business' | 'technical' | 'strategy' | 'performance';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  source: 'user_input' | 'document_upload' | 'conversation' | 'analysis';
  confidence: number; // 0-1 score of how confident SAM is about this info
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed: Date;
  expiresAt?: Date; // Optional expiration for temporary context
}

export class MemoryService {
  private static instance: MemoryService;
  private memories: Map<string, MemoryItem> = new Map();
  private readonly MAX_MEMORIES = 100;
  private readonly STORAGE_KEY = 'sam_ai_memory';

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Store a new memory item
   */
  public async storeMemory(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): Promise<MemoryItem> {
    const memory: MemoryItem = {
      ...item,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date()
    };

    // Check if similar memory exists and update instead
    const existingMemory = this.findSimilarMemory(memory);
    if (existingMemory) {
      return this.updateMemory(existingMemory.id, {
        content: memory.content,
        confidence: Math.max(existingMemory.confidence, memory.confidence),
        metadata: { ...existingMemory.metadata, ...memory.metadata }
      });
    }

    this.memories.set(memory.id, memory);
    this.enforceMemoryLimit();
    this.saveToStorage();
    
    return memory;
  }

  /**
   * Update an existing memory
   */
  public async updateMemory(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem> {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory ${id} not found`);
    }

    const updatedMemory = {
      ...memory,
      ...updates,
      id: memory.id, // Preserve ID
      createdAt: memory.createdAt, // Preserve creation date
      updatedAt: new Date(),
      accessCount: memory.accessCount + 1,
      lastAccessed: new Date()
    };

    this.memories.set(id, updatedMemory);
    this.saveToStorage();
    
    return updatedMemory;
  }

  /**
   * Retrieve memories by type
   */
  public getMemoriesByType(type: MemoryItem['type']): MemoryItem[] {
    return Array.from(this.memories.values())
      .filter(m => m.type === type)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Search memories by query
   */
  public searchMemories(query: string): MemoryItem[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.memories.values())
      .filter(m => 
        m.title.toLowerCase().includes(queryLower) ||
        m.content.toLowerCase().includes(queryLower) ||
        m.tags.some(tag => tag.toLowerCase().includes(queryLower))
      )
      .sort((a, b) => {
        // Sort by relevance (confidence * recency)
        const recencyA = 1 / (Date.now() - a.lastAccessed.getTime() + 1);
        const recencyB = 1 / (Date.now() - b.lastAccessed.getTime() + 1);
        return (b.confidence * recencyB) - (a.confidence * recencyA);
      });
  }

  /**
   * Get most relevant memories for current context
   */
  public getRelevantMemories(context?: { type?: string; tags?: string[] }): MemoryItem[] {
    let memories = Array.from(this.memories.values());

    // Filter by type if specified
    if (context?.type) {
      memories = memories.filter(m => m.type === context.type);
    }

    // Filter by tags if specified
    if (context?.tags && context.tags.length > 0) {
      memories = memories.filter(m => 
        context.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Remove expired memories
    const now = new Date();
    memories = memories.filter(m => !m.expiresAt || m.expiresAt > now);

    // Sort by relevance score
    return memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreB - scoreA;
    }).slice(0, 10); // Return top 10
  }

  /**
   * Extract and store context from a conversation
   */
  public async extractFromConversation(message: string, response: string): Promise<void> {
    // Extract key information patterns
    const patterns = [
      {
        regex: /(?:my|our|the)\s+company\s+(?:is|does|provides|offers)\s+([^.!?]+)/gi,
        type: 'company' as const,
        category: 'business' as const
      },
      {
        regex: /(?:target|ideal|focus on|sell to)\s+(?:audience|customers?|market)\s+(?:is|are)\s+([^.!?]+)/gi,
        type: 'audience' as const,
        category: 'business' as const
      },
      {
        regex: /(?:product|service|solution|platform)\s+(?:is|does|helps)\s+([^.!?]+)/gi,
        type: 'product' as const,
        category: 'business' as const
      },
      {
        regex: /(?:campaign|outreach|sequence)\s+(?:for|targeting|to)\s+([^.!?]+)/gi,
        type: 'campaign' as const,
        category: 'strategy' as const
      }
    ];

    for (const pattern of patterns) {
      const matches = message.matchAll(pattern.regex);
      for (const match of matches) {
        await this.storeMemory({
          type: pattern.type,
          category: pattern.category,
          title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Information`,
          content: match[1].trim(),
          tags: [pattern.type, 'extracted', 'conversation'],
          source: 'conversation',
          confidence: 0.7,
          metadata: {
            originalMessage: message,
            extractedAt: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Clear all memories
   */
  public clearMemories(): void {
    this.memories.clear();
    this.saveToStorage();
  }

  /**
   * Get memory statistics
   */
  public getStats(): {
    total: number;
    byType: Record<string, number>;
    averageConfidence: number;
    oldestMemory?: Date;
    newestMemory?: Date;
  } {
    const memories = Array.from(this.memories.values());
    const byType: Record<string, number> = {};
    
    memories.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });

    const totalConfidence = memories.reduce((sum, m) => sum + m.confidence, 0);
    const dates = memories.map(m => m.createdAt);

    return {
      total: memories.length,
      byType,
      averageConfidence: memories.length > 0 ? totalConfidence / memories.length : 0,
      oldestMemory: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
      newestMemory: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined
    };
  }

  /**
   * Private helper methods
   */
  
  private findSimilarMemory(memory: MemoryItem): MemoryItem | undefined {
    // Find memories with similar content (using simple similarity check)
    return Array.from(this.memories.values()).find(m => 
      m.type === memory.type &&
      m.category === memory.category &&
      this.calculateSimilarity(m.content, memory.content) > 0.8
    );
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculateRelevanceScore(memory: MemoryItem): number {
    const now = Date.now();
    const age = now - memory.lastAccessed.getTime();
    const recency = 1 / (1 + age / (1000 * 60 * 60 * 24)); // Decay over days
    
    // Combine confidence, recency, and access frequency
    const accessScore = Math.min(memory.accessCount / 10, 1); // Cap at 10 accesses
    
    return (memory.confidence * 0.5) + (recency * 0.3) + (accessScore * 0.2);
  }

  private enforceMemoryLimit(): void {
    if (this.memories.size > this.MAX_MEMORIES) {
      // Remove least relevant memories
      const sorted = Array.from(this.memories.entries())
        .sort((a, b) => this.calculateRelevanceScore(b[1]) - this.calculateRelevanceScore(a[1]));
      
      // Keep top memories
      const toKeep = sorted.slice(0, this.MAX_MEMORIES);
      this.memories = new Map(toKeep);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.memories.entries()).map(([id, memory]) => ({
        ...memory,
        createdAt: memory.createdAt.toISOString(),
        updatedAt: memory.updatedAt.toISOString(),
        lastAccessed: memory.lastAccessed.toISOString(),
        expiresAt: memory.expiresAt?.toISOString()
      }));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save memories to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((item: MemoryItem & { createdAt: string; updatedAt: string; lastAccessed: string; expiresAt?: string }) => {
          const memory: MemoryItem = {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            lastAccessed: new Date(item.lastAccessed),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
          };
          this.memories.set(memory.id, memory);
        });
      }
    } catch (error) {
      console.error('Failed to load memories from storage:', error);
    }
  }
}

export default MemoryService;