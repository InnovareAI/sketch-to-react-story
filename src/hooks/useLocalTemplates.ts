import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface TemplateMessage {
  id: string;
  type: 'initial' | 'follow-up';
  subject?: string;
  content: string;
  delay?: number; // Days to wait before sending
  delayUnit?: 'hours' | 'days' | 'weeks';
}

export interface LocalTemplate {
  id: string;
  workspace_id: string;
  name: string;
  type: 'email' | 'linkedin' | 'whatsapp';
  channel: string;
  category: string;
  tags: string[];
  messages: TemplateMessage[]; // Support multiple messages
  performance: {
    sent: number;
    opened: number;
    replied: number;
    responseRate: number;
  };
  lastUsed?: string;
  created_at: string;
  updated_at: string;
  isDraft?: boolean;
}

const STORAGE_KEY = 'sam_ai_templates';
const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

export function useLocalTemplates() {
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    averageResponseRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load templates from localStorage
  const loadTemplates = useCallback(() => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsedTemplates = JSON.parse(stored) as LocalTemplate[];
        setTemplates(parsedTemplates);
        
        // Calculate stats
        const total = parsedTemplates.length;
        const active = parsedTemplates.filter(t => !t.isDraft).length;
        const avgResponse = parsedTemplates.reduce((sum, t) => sum + t.performance.responseRate, 0) / (total || 1);
        
        setStats({
          totalTemplates: total,
          activeTemplates: active,
          averageResponseRate: Math.round(avgResponse * 10) / 10,
        });
      } else {
        // Initialize with default templates
        const defaultTemplates: LocalTemplate[] = [
          {
            id: 'default-1',
            workspace_id: localStorage.getItem('workspace_id') || 'default',
            name: 'LinkedIn Connection Request',
            type: 'linkedin',
            channel: 'LinkedIn',
            category: 'Connection',
            tags: ['linkedin', 'connection', 'outreach'],
            messages: [
              {
                id: 'msg-1',
                type: 'initial',
                content: 'Hi {{firstName}},\n\nI noticed we\'re both in the {{industry}} space. Would love to connect and share insights about {{specificTopic}}.\n\nLooking forward to connecting!',
              }
            ],
            performance: { sent: 145, opened: 89, replied: 34, responseRate: 23.4 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'default-2',
            workspace_id: localStorage.getItem('workspace_id') || 'default',
            name: 'Email Outreach Sequence',
            type: 'email',
            channel: 'Email',
            category: 'Cold Outreach',
            tags: ['email', 'sequence', 'follow-up'],
            messages: [
              {
                id: 'msg-1',
                type: 'initial',
                subject: 'Quick question about {{companyName}}\'s growth strategy',
                content: 'Hi {{firstName}},\n\nI\'ve been following {{companyName}}\'s journey and I\'m impressed with your recent expansion.\n\nMany companies at your stage struggle with scaling their lead generation while maintaining quality. I\'ve helped similar companies increase qualified leads by 40%.\n\nWould you be open to a brief 15-minute conversation?\n\nBest regards,\nSAM AI',
              },
              {
                id: 'msg-2',
                type: 'follow-up',
                subject: 'Re: Quick question about {{companyName}}\'s growth strategy',
                content: 'Hi {{firstName}},\n\nI wanted to follow up on my previous email about helping {{companyName}} scale its lead generation.\n\nI recently helped [Similar Company] achieve a 3x increase in qualified leads within 60 days.\n\nWould you have 15 minutes this week to discuss how we could achieve similar results for {{companyName}}?\n\nBest,\nSAM AI',
                delay: 3,
                delayUnit: 'days',
              },
              {
                id: 'msg-3',
                type: 'follow-up',
                subject: 'Final follow-up: {{companyName}}',
                content: 'Hi {{firstName}},\n\nI understand you\'re busy, so I\'ll keep this brief.\n\nIf scaling lead generation isn\'t a priority right now, no worries at all. \n\nIf it becomes a focus in the future, feel free to reach out - I\'d be happy to share how we\'ve helped companies like yours.\n\nWishing you continued success!\n\nBest,\nSAM AI',
                delay: 7,
                delayUnit: 'days',
              }
            ],
            performance: { sent: 523, opened: 312, replied: 87, responseRate: 16.6 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTemplates));
        setTemplates(defaultTemplates);
        
        setStats({
          totalTemplates: defaultTemplates.length,
          activeTemplates: defaultTemplates.length,
          averageResponseRate: 20.0,
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates from local storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((templatesToSave: LocalTemplate[]) => {
    try {
      const dataString = JSON.stringify(templatesToSave);
      
      // Only save if data has changed
      if (dataString !== lastSavedRef.current) {
        localStorage.setItem(STORAGE_KEY, dataString);
        lastSavedRef.current = dataString;
        
        // Update stats
        const total = templatesToSave.length;
        const active = templatesToSave.filter(t => !t.isDraft).length;
        const avgResponse = templatesToSave.reduce((sum, t) => sum + t.performance.responseRate, 0) / (total || 1);
        
        setStats({
          totalTemplates: total,
          activeTemplates: active,
          averageResponseRate: Math.round(avgResponse * 10) / 10,
        });
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving templates:', err);
      toast.error('Failed to save templates');
      return false;
    }
  }, []);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((templatesToSave: LocalTemplate[]) => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Schedule new save
    autoSaveTimerRef.current = setTimeout(() => {
      const saved = saveTemplates(templatesToSave);
      if (saved) {
        toast.success('Templates auto-saved', {
          duration: 2000,
          position: 'bottom-right',
        });
      }
    }, AUTO_SAVE_INTERVAL);
  }, [saveTemplates]);

  // Create a new template
  const createTemplate = useCallback(async (templateData: {
    name: string;
    type: 'email' | 'linkedin' | 'whatsapp';
    messages: TemplateMessage[];
    category?: string;
    tags?: string[];
  }) => {
    try {
      const workspaceId = localStorage.getItem('workspace_id') || 'default';
      
      const newTemplate: LocalTemplate = {
        id: `template-${Date.now()}`,
        workspace_id: workspaceId,
        name: templateData.name,
        type: templateData.type,
        channel: templateData.type === 'linkedin' ? 'LinkedIn' : 
                 templateData.type === 'email' ? 'Email' : 'WhatsApp',
        category: templateData.category || 'General',
        tags: templateData.tags || [templateData.type],
        messages: templateData.messages,
        performance: { sent: 0, opened: 0, replied: 0, responseRate: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isDraft: false,
      };
      
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
      
      toast.success('Template created successfully!');
      return newTemplate;
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error('Failed to create template');
      throw err;
    }
  }, [templates, saveTemplates]);

  // Update an existing template
  const updateTemplate = useCallback(async (
    templateId: string, 
    updates: Partial<LocalTemplate>,
    autoSave: boolean = false
  ) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, ...updates, updated_at: new Date().toISOString() }
          : t
      );
      
      setTemplates(updatedTemplates);
      
      if (autoSave) {
        // Schedule auto-save instead of immediate save
        scheduleAutoSave(updatedTemplates);
      } else {
        // Immediate save for explicit updates
        saveTemplates(updatedTemplates);
        toast.success('Template updated successfully!');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error('Failed to update template');
      throw err;
    }
  }, [templates, saveTemplates, scheduleAutoSave]);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
      
      toast.success('Template deleted successfully!');
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
      throw err;
    }
  }, [templates, saveTemplates]);

  // Duplicate a template
  const duplicateTemplate = useCallback(async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      const duplicated: LocalTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copy)`,
        performance: { sent: 0, opened: 0, replied: 0, responseRate: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedTemplates = [...templates, duplicated];
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
      
      toast.success('Template duplicated successfully!');
      return duplicated;
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Failed to duplicate template');
      throw err;
    }
  }, [templates, saveTemplates]);

  // Add a follow-up message to a template
  const addFollowUpMessage = useCallback(async (
    templateId: string,
    message: Omit<TemplateMessage, 'id'>
  ) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      const newMessage: TemplateMessage = {
        ...message,
        id: `msg-${Date.now()}`,
      };
      
      const updatedTemplate = {
        ...template,
        messages: [...template.messages, newMessage],
        updated_at: new Date().toISOString(),
      };
      
      const updatedTemplates = templates.map(t => 
        t.id === templateId ? updatedTemplate : t
      );
      
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
      
      toast.success('Follow-up message added!');
      return newMessage;
    } catch (err) {
      console.error('Error adding follow-up message:', err);
      toast.error('Failed to add follow-up message');
      throw err;
    }
  }, [templates, saveTemplates]);

  // Remove a message from a template
  const removeMessage = useCallback(async (
    templateId: string,
    messageId: string
  ) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      const updatedTemplate = {
        ...template,
        messages: template.messages.filter(m => m.id !== messageId),
        updated_at: new Date().toISOString(),
      };
      
      const updatedTemplates = templates.map(t => 
        t.id === templateId ? updatedTemplate : t
      );
      
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
      
      toast.success('Message removed!');
    } catch (err) {
      console.error('Error removing message:', err);
      toast.error('Failed to remove message');
      throw err;
    }
  }, [templates, saveTemplates]);

  // Initialize
  useEffect(() => {
    loadTemplates();
    
    // Cleanup auto-save timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [loadTemplates]);

  return {
    templates,
    stats,
    loading,
    error,
    refreshData: loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    addFollowUpMessage,
    removeMessage,
    AUTO_SAVE_INTERVAL,
  };
}