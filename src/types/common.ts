// Common TypeScript interfaces and types

export interface TaskContext {
  id: string;
  type: string;
  data: Record<string, unknown>;
  metadata?: TaskMetadata;
}

export interface TaskMetadata {
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  retryCount?: number;
  maxRetries?: number;
  tags?: string[];
  assignedTo?: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  provider: string;
  apiKey?: string;
  endpoint?: string;
  systemPrompt?: string;
}

export interface MemoryConfig {
  maxEntries: number;
  ttl?: number;
  persistToDisk?: boolean;
  compressionEnabled?: boolean;
  categories?: string[];
}

export interface AgentResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata?: {
    processingTime?: number;
    tokenUsage?: number;
    modelUsed?: string;
    retryCount?: number;
  };
}

export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface EventHandler<T = Event> {
  (event: T): void;
}

export type FormEventHandler = EventHandler<React.FormEvent>;
export type ClickEventHandler = EventHandler<React.MouseEvent>;
export type ChangeEventHandler = EventHandler<React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>;

export interface VoiceConfig {
  enabled: boolean;
  language: string;
  pitch: number;
  rate: number;
  volume: number;
  voice?: string;
}

export interface AudioProcessingResult {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

export interface CampaignData {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience?: string;
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
  };
}

export interface LeadData {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  score?: number;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface ProxyRequestParams {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface ProxyResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  period?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };