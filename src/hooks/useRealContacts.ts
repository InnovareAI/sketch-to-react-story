import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  workspace_id: string;
  account_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
  linkedin_url: string | null;
  engagement_score: number;
  tags: string[];
  metadata: any;
  scraped_data: any;
  qualification_data: any;
  created_at: string;
  updated_at: string;
}

export interface ContactsStats {
  totalContacts: number;
  hotLeads: number;
  responseRate: number;
  pipelineValue: string;
}

export function useRealContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactsStats>({
    totalContacts: 0,
    hotLeads: 0,
    responseRate: 0,
    pipelineValue: '$0'
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

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      // Get contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          accounts (
            name,
            domain,
            industry
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Get messages for calculating response rates
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (messagesError) throw messagesError;

      // Calculate stats
      const totalContacts = contacts?.length || 0;
      const hotLeads = contacts?.filter(c => c.engagement_score >= 70).length || 0;
      
      const totalMessages = messages?.length || 0;
      const totalReplies = messages?.filter(m => m.replied_at !== null).length || 0;
      const responseRate = totalMessages > 0 ? (totalReplies / totalMessages) * 100 : 0;

      // Estimate pipeline value based on contact scores
      const estimatedValue = contacts?.reduce((acc, contact) => {
        const baseValue = 5000; // Base deal value
        const scoreMultiplier = contact.engagement_score / 100;
        return acc + (baseValue * scoreMultiplier);
      }, 0) || 0;

      setContacts(contacts || []);
      setStats({
        totalContacts,
        hotLeads,
        responseRate: Math.round(responseRate * 10) / 10,
        pipelineValue: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(estimatedValue)
      });

    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: Partial<Contact>) => {
    try {
      const workspaceId = getCurrentWorkspaceId();
      if (!workspaceId) {
        throw new Error('No workspace found. Please ensure you are logged in.');
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          workspace_id: workspaceId,
          engagement_score: contactData.engagement_score || 0,
          tags: contactData.tags || [],
          metadata: contactData.metadata || {},
          scraped_data: contactData.scraped_data || {},
          qualification_data: contactData.qualification_data || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh contacts list
      await fetchContacts();
      return data;
    } catch (err: any) {
      console.error('Error creating contact:', err);
      throw err;
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;

      // Refresh contacts list
      await fetchContacts();
    } catch (err: any) {
      console.error('Error updating contact:', err);
      throw err;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      // Refresh contacts list
      await fetchContacts();
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    await fetchContacts();
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    stats,
    loading,
    error,
    refreshData,
    createContact,
    updateContact,
    deleteContact,
  };
}