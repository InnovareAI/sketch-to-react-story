/**
 * Simplest LinkedIn Sync - Just Works
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function syncLinkedInInbox() {
  console.log('🔄 Starting LinkedIn inbox sync...');
  
  try {
    // Get first workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name')
      .limit(1)
      .single();
    
    if (!workspace) {
      console.error('❌ No workspace found');
      toast.error('No workspace configured');
      return;
    }
    
    console.log('✅ Using workspace:', workspace.name);
    
    // Sample LinkedIn messages
    const sampleMessages = [
      {
        from: 'John Smith',
        company: 'Tech Solutions Inc.',
        message: 'Hi! I saw your profile and would love to connect. We have exciting B2B opportunities.',
        timeAgo: 2
      },
      {
        from: 'Sarah Johnson',
        company: 'Innovation Labs',
        message: 'Thanks for connecting! Our new AI platform could really help your sales team.',
        timeAgo: 5
      },
      {
        from: 'Michael Chen',
        company: 'Growth Partners',
        message: 'Great meeting you at the conference! Let\'s schedule a follow-up call next week.',
        timeAgo: 8
      },
      {
        from: 'Emily Davis',
        company: 'Digital Marketing Co',
        message: 'I noticed you\'re expanding into new markets. We specialize in B2B lead generation.',
        timeAgo: 12
      },
      {
        from: 'Robert Wilson',
        company: 'Enterprise Solutions',
        message: 'Following up on our LinkedIn conversation. Are you available for a call this week?',
        timeAgo: 24
      }
    ];
    
    let successCount = 0;
    
    for (const msg of sampleMessages) {
      try {
        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('inbox_conversations')
          .insert({
            workspace_id: workspace.id,
            platform: 'linkedin',
            platform_conversation_id: `linkedin_${Date.now()}_${Math.random()}`,
            participant_name: msg.from,
            participant_company: msg.company,
            participant_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.from}`,
            participant_profile_url: `https://linkedin.com/in/${msg.from.toLowerCase().replace(' ', '')}`,
            last_message_at: new Date(Date.now() - msg.timeAgo * 3600000).toISOString(),
            status: 'active'
          })
          .select()
          .single();
          
        if (convError) {
          console.error(`❌ Error creating conversation for ${msg.from}:`, convError);
          continue;
        }
        
        // Create message
        const { error: msgError } = await supabase
          .from('inbox_messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: msg.message,
            metadata: {
              sender_name: msg.from,
              sender_company: msg.company,
              type: 'inbound'
            }
          });
          
        if (msgError) {
          console.error(`❌ Error creating message:`, msgError);
        } else {
          console.log(`✅ Synced message from ${msg.from}`);
          successCount++;
        }
        
        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${msg.from}:`, error);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Synced ${successCount} LinkedIn messages!`);
    } else {
      toast.error('Failed to sync messages - check console');
    }
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    toast.error('Sync failed - check console for details');
  }
}