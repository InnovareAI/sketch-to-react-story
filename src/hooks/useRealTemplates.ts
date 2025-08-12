import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Template {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  subject: string | null;
  content: string | null;
  status: string;
  metadata: any;
  personalization_data: any;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithPerformance extends Template {
  name: string;
  type: string;
  channel: string;
  category: string;
  tags: string[];
  performance: {
    sent: number;
    opened: number;
    replied: number;
    responseRate: number;
  };
  lastUsed?: string;
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  averageResponseRate: number;
}

export function useRealTemplates() {
  const [templates, setTemplates] = useState<TemplateWithPerformance[]>([]);
  const [stats, setStats] = useState<TemplateStats>({
    totalTemplates: 0,
    activeTemplates: 0,
    averageResponseRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentWorkspaceId = (): string | null => {
    try {
      const userAuthProfile = localStorage.getItem('user_auth_profile');
      if (userAuthProfile) {
        const profile = JSON.parse(userAuthProfile);
        return profile.workspace_id;
      }
      return null;
    } catch (err) {
      console.error('Error getting workspace ID:', err);
      return null;
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      // Get message templates (reusable messages)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          campaigns (
            name,
            type
          )
        `)
        .eq('workspace_id', workspaceId)
        .not('subject', 'is', null) // Only messages with subjects (templates)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Transform messages into template format
      const transformedTemplates: TemplateWithPerformance[] = messages?.map(message => {
        // Extract template info from metadata or generate defaults
        const metadata = message.metadata || {};
        const campaignType = message.campaigns?.type || 'email';
        
        // Calculate performance metrics
        const sent = 1; // Each message represents one sent
        const opened = message.opened_at ? 1 : 0;
        const replied = message.replied_at ? 1 : 0;
        const responseRate = replied > 0 ? (replied / sent) * 100 : 0;

        return {
          ...message,
          name: metadata.template_name || `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Template`,
          type: campaignType,
          channel: campaignType === 'linkedin' ? 'LinkedIn' : campaignType === 'email' ? 'Email' : 'Other',
          category: metadata.category || 'General',
          tags: metadata.tags || [campaignType],
          performance: {
            sent,
            opened,
            replied,
            responseRate: Math.round(responseRate * 10) / 10,
          },
          lastUsed: message.sent_at || message.updated_at,
        };
      }) || [];

      // Add some default templates if none exist
      if (transformedTemplates.length === 0) {
        const defaultTemplates: TemplateWithPerformance[] = [
          {
            id: 'default-1',
            workspace_id: workspaceId,
            campaign_id: null,
            contact_id: null,
            subject: 'Quick question about {{companyName}}\'s growth strategy',
            content: 'Hi {{firstName}},\n\nI\'ve been following {{companyName}}\'s journey and I\'m impressed with your recent expansion.\n\nMany companies at your stage struggle with scaling their lead generation while maintaining quality. I\'ve helped similar companies increase qualified leads by 40%.\n\nWould you be open to a brief 15-minute conversation?\n\nBest regards,\nSAM AI',
            status: 'template',
            metadata: { template_name: 'Growth Strategy Outreach', category: 'Cold Outreach', tags: ['growth', 'outreach'] },
            personalization_data: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: 'Growth Strategy Outreach',
            type: 'email',
            channel: 'Email',
            category: 'Cold Outreach',
            tags: ['growth', 'outreach'],
            performance: { sent: 0, opened: 0, replied: 0, responseRate: 0 },
            lastUsed: undefined,
          },
          {
            id: 'default-2',
            workspace_id: workspaceId,
            campaign_id: null,
            contact_id: null,
            subject: 'Connection Request',
            content: 'Hi {{firstName}},\n\nI see we\'re both in the {{industry}} space. I\'d love to connect and share insights about {{specificTopic}}.\n\nLooking forward to connecting!',
            status: 'template',
            metadata: { template_name: 'LinkedIn Connection', category: 'LinkedIn Outreach', tags: ['linkedin', 'connection'] },
            personalization_data: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: 'LinkedIn Connection Request',
            type: 'linkedin',
            channel: 'LinkedIn',
            category: 'LinkedIn Outreach',
            tags: ['linkedin', 'connection'],
            performance: { sent: 0, opened: 0, replied: 0, responseRate: 0 },
            lastUsed: undefined,
          },
        ];
        transformedTemplates.push(...defaultTemplates);
      }

      // Calculate stats
      const totalTemplates = transformedTemplates.length;
      const activeTemplates = transformedTemplates.filter(t => t.status === 'template' || t.status === 'sent').length;
      const totalResponseRate = transformedTemplates.reduce((sum, t) => sum + t.performance.responseRate, 0);
      const averageResponseRate = totalTemplates > 0 ? totalResponseRate / totalTemplates : 0;

      setTemplates(transformedTemplates);
      setStats({
        totalTemplates,
        activeTemplates,
        averageResponseRate: Math.round(averageResponseRate * 10) / 10,
      });

    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: {
    name: string;
    type: string;
    subject?: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => {
    try {
      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          workspace_id: workspaceId,
          subject: templateData.subject,
          content: templateData.content,
          status: 'template',
          metadata: {
            template_name: templateData.name,
            category: templateData.category || 'General',
            tags: templateData.tags || [templateData.type],
            type: templateData.type,
          },
          personalization_data: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh templates
      await fetchTemplates();
      return data;
    } catch (err: any) {
      console.error('Error creating template:', err);
      throw err;
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<Template>) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', templateId);

      if (error) throw error;

      // Refresh templates
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Refresh templates
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    await fetchTemplates();
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    stats,
    loading,
    error,
    refreshData,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}