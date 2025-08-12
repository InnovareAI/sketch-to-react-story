/**
 * Unipile Webhook Handler
 * Processes real-time message notifications from Unipile
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    console.log('Received Unipile webhook:', payload);

    // Verify webhook signature (if configured)
    const signature = event.headers['x-unipile-signature'];
    if (signature) {
      // Implement signature verification here if needed
      // const expectedSignature = generateSignature(event.body, process.env.UNIPILE_WEBHOOK_SECRET);
      // if (signature !== expectedSignature) {
      //   return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
      // }
    }

    const { event: eventType, data } = payload;

    switch (eventType) {
      case 'message.received':
        await handleMessageReceived(data);
        break;
      
      case 'message.sent':
        await handleMessageSent(data);
        break;
      
      case 'conversation.created':
        await handleConversationCreated(data);
        break;
      
      case 'conversation.updated':
        await handleConversationUpdated(data);
        break;
      
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, processed: eventType })
    };

  } catch (error) {
    console.error('Error processing Unipile webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleMessageReceived(data) {
  try {
    const {
      id: messageId,
      conversation_id,
      account_id,
      from,
      text,
      created_at,
      platform
    } = data;

    // Find the user account that owns this Unipile account
    const { data: teamAccount, error: accountError } = await supabase
      .from('team_accounts')
      .select('user_id, id')
      .eq('unipile_account_id', account_id)
      .single();

    if (accountError || !teamAccount) {
      console.log('Account not found for Unipile account:', account_id);
      return;
    }

    // Find or create conversation
    let conversationId;
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform_conversation_id', conversation_id)
      .eq('user_id', teamAccount.user_id)
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: teamAccount.user_id,
          platform: platform.toLowerCase(),
          platform_conversation_id: conversation_id,
          participant_name: from?.name || 'Unknown',
          participant_email: from?.email,
          participant_profile_url: from?.profile_url,
          participant_avatar_url: from?.picture,
          last_message_at: created_at,
          status: 'active'
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return;
      }
      conversationId = newConversation.id;
    }

    // Insert the message
    await supabase
      .from('conversation_messages')
      .upsert({
        conversation_id: conversationId,
        platform_message_id: messageId,
        sender_name: from?.name || 'Unknown',
        sender_email: from?.email,
        content: text,
        message_type: 'text',
        sent_at: created_at,
        direction: 'inbound',
        platform_data: data
      });

    // Update conversation last message time
    await supabase
      .from('conversations')
      .update({
        last_message_at: created_at,
        status: 'unread'
      })
      .eq('id', conversationId);

    // Check if this is a response to a campaign message
    await checkCampaignResponse(conversationId, teamAccount.user_id, text, created_at);

    console.log('Successfully processed received message:', messageId);

  } catch (error) {
    console.error('Error handling message received:', error);
  }
}

async function handleMessageSent(data) {
  try {
    const {
      id: messageId,
      conversation_id,
      account_id,
      to,
      text,
      created_at,
      platform
    } = data;

    // Find the user account
    const { data: teamAccount } = await supabase
      .from('team_accounts')
      .select('user_id')
      .eq('unipile_account_id', account_id)
      .single();

    if (!teamAccount) return;

    // Find conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform_conversation_id', conversation_id)
      .eq('user_id', teamAccount.user_id)
      .single();

    if (!conversation) return;

    // Insert the sent message
    await supabase
      .from('conversation_messages')
      .upsert({
        conversation_id: conversation.id,
        platform_message_id: messageId,
        sender_name: 'You',
        content: text,
        message_type: 'text',
        sent_at: created_at,
        direction: 'outbound',
        platform_data: data
      });

    // Update conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: created_at })
      .eq('id', conversation.id);

    console.log('Successfully processed sent message:', messageId);

  } catch (error) {
    console.error('Error handling message sent:', error);
  }
}

async function handleConversationCreated(data) {
  try {
    const {
      id: conversationId,
      account_id,
      participants,
      created_at,
      platform
    } = data;

    // Find the user account
    const { data: teamAccount } = await supabase
      .from('team_accounts')
      .select('user_id')
      .eq('unipile_account_id', account_id)
      .single();

    if (!teamAccount) return;

    // Get the other participant (not the account owner)
    const otherParticipant = participants?.find(p => p.account_id !== account_id);

    // Create conversation
    await supabase
      .from('conversations')
      .upsert({
        user_id: teamAccount.user_id,
        platform: platform.toLowerCase(),
        platform_conversation_id: conversationId,
        participant_name: otherParticipant?.name || 'Unknown',
        participant_email: otherParticipant?.email,
        participant_profile_url: otherParticipant?.profile_url,
        participant_avatar_url: otherParticipant?.picture,
        created_at: created_at,
        last_message_at: created_at,
        status: 'active'
      });

    console.log('Successfully processed conversation created:', conversationId);

  } catch (error) {
    console.error('Error handling conversation created:', error);
  }
}

async function handleConversationUpdated(data) {
  try {
    const {
      id: conversationId,
      account_id,
      updated_at,
      status
    } = data;

    // Find the user account
    const { data: teamAccount } = await supabase
      .from('team_accounts')
      .select('user_id')
      .eq('unipile_account_id', account_id)
      .single();

    if (!teamAccount) return;

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        status: status,
        updated_at: updated_at
      })
      .eq('platform_conversation_id', conversationId)
      .eq('user_id', teamAccount.user_id);

    console.log('Successfully processed conversation updated:', conversationId);

  } catch (error) {
    console.error('Error handling conversation updated:', error);
  }
}

async function checkCampaignResponse(conversationId, userId, messageContent, receivedAt) {
  try {
    // Look for recent outbound campaign messages to this conversation
    const { data: campaignMessages } = await supabase
      .from('campaign_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('sent_at', { ascending: false });

    if (!campaignMessages?.length) return;

    // Find matching conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant_profile_url')
      .eq('id', conversationId)
      .single();

    if (!conversation) return;

    // Find campaign message to this recipient
    const matchingCampaignMessage = campaignMessages.find(msg =>
      msg.recipient_profile_url === conversation.participant_profile_url
    );

    if (matchingCampaignMessage) {
      // Mark campaign message as replied
      await supabase
        .from('campaign_messages')
        .update({
          status: 'replied',
          response_received: true,
          response_content: messageContent,
          response_received_at: receivedAt
        })
        .eq('id', matchingCampaignMessage.id);

      console.log('Marked campaign message as replied:', matchingCampaignMessage.id);
    }

  } catch (error) {
    console.error('Error checking campaign response:', error);
  }
}