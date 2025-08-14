/**
 * Enhanced LinkedIn Sync Service
 * Combines Unipile chat mining + Direct LinkedIn API for maximum contact extraction
 */

import { supabase } from '@/integrations/supabase/client';
import { workspaceUnipile } from './WorkspaceUnipileService';
import { linkedInDirectAPI } from './linkedin/LinkedInDirectAPI';
import { toast } from 'sonner';

interface EnhancedSyncResult {
  totalContacts: number;
  unipileContacts: number;
  linkedinAPIContacts: number;
  firstDegree: number;
  secondDegree: number;
  thirdDegree: number;
  withJobTitles: number;
  withProfiles: number;
  errors: string[];
}

export class EnhancedLinkedInSync {
  private static instance: EnhancedLinkedInSync;
  private workspaceId: string | null = null;

  private constructor() {}

  static getInstance(): EnhancedLinkedInSync {
    if (!EnhancedLinkedInSync.instance) {
      EnhancedLinkedInSync.instance = new EnhancedLinkedInSync();
    }
    return EnhancedLinkedInSync.instance;
  }

  /**
   * Initialize with workspace ID
   */
  initialize(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Comprehensive sync combining all available data sources
   */
  async syncAllContacts(): Promise<EnhancedSyncResult> {
    if (!this.workspaceId) {
      throw new Error('Workspace ID not set. Call initialize() first.');
    }

    console.log('🚀 Starting comprehensive LinkedIn contact sync...');
    toast.info('Starting comprehensive LinkedIn sync...');

    const result: EnhancedSyncResult = {
      totalContacts: 0,
      unipileContacts: 0,
      linkedinAPIContacts: 0,
      firstDegree: 0,
      secondDegree: 0,
      thirdDegree: 0,
      withJobTitles: 0,
      withProfiles: 0,
      errors: []
    };

    const allContacts = new Map(); // Deduplicate by LinkedIn profile ID or email

    // Step 1: Enhanced Unipile extraction with archived chats
    try {
      console.log('📱 Step 1: Enhanced Unipile chat/message mining...');
      toast.info('Mining LinkedIn chats and messages...');
      
      const unipileResult = await this.enhancedUnipileExtraction();
      result.unipileContacts = unipileResult.contacts.length;
      
      // Add to master list
      unipileResult.contacts.forEach(contact => {
        const key = contact.linkedin_url || contact.email || contact.provider_id;
        allContacts.set(key, {
          ...contact,
          source: 'unipile',
          data_quality: this.calculateQuality(contact)
        });
      });

      console.log(`✅ Unipile extraction: ${unipileResult.contacts.length} contacts`);
      
    } catch (error) {
      console.error('Unipile extraction failed:', error);
      result.errors.push(`Unipile extraction: ${error.message}`);
    }

    // Step 2: Direct LinkedIn API extraction
    try {
      console.log('🔗 Step 2: Direct LinkedIn API extraction...');
      toast.info('Accessing LinkedIn API for connections...');
      
      const linkedinResult = await this.directLinkedInExtraction();
      result.linkedinAPIContacts = linkedinResult.contacts.length;
      
      // Merge with existing contacts (LinkedIn API data takes precedence)
      linkedinResult.contacts.forEach(contact => {
        const key = contact.linkedin_url || contact.email || `linkedin_${contact.id}`;
        const existing = allContacts.get(key);
        
        allContacts.set(key, {
          ...existing,
          ...contact, // LinkedIn API data overwrites
          source: existing ? 'both' : 'linkedin_api',
          data_quality: this.calculateQuality(contact)
        });
      });

      console.log(`✅ LinkedIn API extraction: ${linkedinResult.contacts.length} contacts`);
      
    } catch (error) {
      console.error('LinkedIn API extraction failed:', error);
      result.errors.push(`LinkedIn API extraction: ${error.message}`);
    }

    // Step 3: Store all contacts in database
    const contactsArray = Array.from(allContacts.values());
    result.totalContacts = contactsArray.length;

    console.log(`💾 Step 3: Storing ${contactsArray.length} unique contacts...`);
    toast.info(`Storing ${contactsArray.length} unique contacts...`);

    let storedCount = 0;
    for (const contact of contactsArray) {
      try {
        await this.storeContact(contact);
        storedCount++;
      } catch (error) {
        console.error(`Error storing contact ${contact.name}:`, error);
        result.errors.push(`Storage error for ${contact.name}: ${error.message}`);
      }
    }

    // Calculate statistics
    result.firstDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_1' || c.connection_degree === 1).length;
    result.secondDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_2' || c.connection_degree === 2).length;
    result.thirdDegree = contactsArray.filter(c => c.network_distance === 'DISTANCE_3' || c.connection_degree === 3).length;
    result.withJobTitles = contactsArray.filter(c => c.title || c.occupation).length;
    result.withProfiles = contactsArray.filter(c => c.linkedin_url).length;

    console.log('✅ Comprehensive sync completed!');
    console.log(`📊 Results: ${result.totalContacts} total, ${storedCount} stored`);
    console.log(`📈 Breakdown: ${result.unipileContacts} from Unipile, ${result.linkedinAPIContacts} from LinkedIn API`);
    
    toast.success(`🎉 Synced ${result.totalContacts} contacts! (${result.firstDegree} 1st degree, ${result.secondDegree} 2nd degree)`);

    return result;
  }

  /**
   * Enhanced Unipile extraction with archived chats
   */
  private async enhancedUnipileExtraction(): Promise<{ contacts: any[] }> {
    const config = await workspaceUnipile.getConfig();
    const allContacts = new Map();

    // Get ALL chats including archived
    const chatsResponse = await workspaceUnipile.request(`/chats?account_id=${config.account_id}&limit=200&include_archived=true`);
    
    if (!chatsResponse.ok) {
      throw new Error('Failed to fetch LinkedIn chats');
    }

    const chatsData = await chatsResponse.json();
    const chats = chatsData.items || [];

    console.log(`📋 Processing ${chats.length} chats (including archived)...`);

    // Process all chats for attendees
    for (let i = 0; i < chats.length; i++) {
      try {
        const attendeesResponse = await workspaceUnipile.request(`/chats/${chats[i].id}/attendees`);
        
        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json();
          const attendees = attendeesData.items || [];
          
          for (const attendee of attendees) {
            if (!attendee.is_self && attendee.provider_id && attendee.name) {
              allContacts.set(attendee.provider_id, {
                provider_id: attendee.provider_id,
                name: attendee.name,
                first_name: attendee.name.split(' ')[0] || '',
                last_name: attendee.name.split(' ').slice(1).join(' ') || '',
                email: `${attendee.provider_id}@linkedin.com`,
                title: attendee.specifics?.occupation || '',
                linkedin_url: attendee.profile_url || '',
                network_distance: attendee.specifics?.network_distance || '',
                picture_url: attendee.picture_url || '',
                is_company: attendee.specifics?.is_company || false,
                occupation: attendee.specifics?.occupation || '',
                member_urn: attendee.specifics?.member_urn || ''
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error processing chat ${chats[i].id}:`, err);
      }

      // Progress update
      if (i % 50 === 0) {
        console.log(`   Processed ${i + 1}/${chats.length} chats...`);
      }
    }

    // Also get contacts from messages
    try {
      const messagesResponse = await workspaceUnipile.request(`/messages?account_id=${config.account_id}&limit=1000`);
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.items || [];
        
        for (const message of messages) {
          if (message.from && message.from.provider_id && message.from.name && !message.from.is_self) {
            const senderId = message.from.provider_id;
            if (!allContacts.has(senderId)) {
              allContacts.set(senderId, {
                provider_id: senderId,
                name: message.from.name,
                first_name: message.from.name.split(' ')[0] || '',
                last_name: message.from.name.split(' ').slice(1).join(' ') || '',
                email: `${senderId}@linkedin.com`,
                title: message.from.specifics?.occupation || '',
                linkedin_url: message.from.profile_url || '',
                network_distance: message.from.specifics?.network_distance || '',
                picture_url: message.from.picture_url || '',
                occupation: message.from.specifics?.occupation || ''
              });
            }
          }
        }
      }
    } catch (err) {
      console.log('Warning: Could not fetch messages:', err.message);
    }

    return { contacts: Array.from(allContacts.values()) };
  }

  /**
   * Direct LinkedIn API extraction
   */
  private async directLinkedInExtraction(): Promise<{ contacts: any[] }> {
    if (!linkedInDirectAPI.isAuthenticated()) {
      console.log('LinkedIn API not authenticated, initiating OAuth...');
      toast.info('LinkedIn API authentication required...');
      
      // Try to authenticate
      try {
        await linkedInDirectAPI.initiateOAuth();
        return { contacts: [] }; // Return empty for now, user needs to complete OAuth
      } catch (error) {
        throw new Error('LinkedIn OAuth initiation failed');
      }
    }

    // Fetch connections via LinkedIn API
    const connections = await linkedInDirectAPI.fetchConnections();
    
    // Transform LinkedIn API format to our format
    const contacts = connections.map((conn: any, index: number) => ({
      id: conn.id || `linkedin_api_${index}`,
      name: `${conn.firstName || ''} ${conn.lastName || ''}`.trim(),
      first_name: conn.firstName || '',
      last_name: conn.lastName || '',
      email: conn.emailAddress || `${conn.id}@linkedin.com`,
      title: conn.headline || '',
      linkedin_url: conn.publicProfileUrl || '',
      connection_degree: 1, // Direct connections are 1st degree
      picture_url: conn.pictureUrl || '',
      industry: conn.industry || '',
      location: conn.location?.name || ''
    }));

    return { contacts };
  }

  /**
   * Store contact in database with comprehensive metadata
   */
  private async storeContact(contact: any): Promise<void> {
    await supabase.from('contacts').upsert({
      workspace_id: this.workspaceId,
      email: contact.email,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      title: contact.title || contact.occupation || '',
      linkedin_url: contact.linkedin_url || '',
      phone: contact.phone || '',
      department: contact.industry || (contact.is_company ? 'Company' : ''),
      engagement_score: this.calculateEngagementScore(contact),
      tags: this.generateTags(contact),
      metadata: {
        provider_id: contact.provider_id,
        member_urn: contact.member_urn,
        network_distance: contact.network_distance,
        connection_degree: contact.connection_degree,
        picture_url: contact.picture_url,
        source: contact.source,
        data_quality: contact.data_quality,
        is_company: contact.is_company,
        industry: contact.industry,
        location: contact.location,
        synced_at: new Date().toISOString(),
        last_enriched: new Date().toISOString()
      }
    }, { 
      onConflict: 'workspace_id,email'
    });
  }

  /**
   * Calculate engagement score based on available data
   */
  private calculateEngagementScore(contact: any): number {
    let score = 30; // Base score

    // Network distance scoring
    if (contact.network_distance === 'DISTANCE_1' || contact.connection_degree === 1) score += 40;
    else if (contact.network_distance === 'DISTANCE_2' || contact.connection_degree === 2) score += 25;
    else if (contact.network_distance === 'DISTANCE_3' || contact.connection_degree === 3) score += 10;

    // Data completeness scoring
    if (contact.title || contact.occupation) score += 10;
    if (contact.linkedin_url) score += 10;
    if (contact.picture_url) score += 5;
    if (contact.industry) score += 5;
    if (contact.location) score += 5;

    // Source reliability scoring
    if (contact.source === 'both') score += 10;
    else if (contact.source === 'linkedin_api') score += 5;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Generate tags for contact categorization
   */
  private generateTags(contact: any): string[] {
    const tags = [];

    // Network distance tags
    if (contact.network_distance) tags.push(contact.network_distance.toLowerCase());
    if (contact.connection_degree) tags.push(`${contact.connection_degree}st-degree`);

    // Source tags
    if (contact.source) tags.push(contact.source);

    // Type tags
    if (contact.is_company) tags.push('company');
    else tags.push('person');

    // Industry tags
    if (contact.industry) tags.push(contact.industry.toLowerCase().replace(/\s+/g, '-'));

    // Quality tags
    if (contact.data_quality === 'high') tags.push('high-quality');
    else if (contact.data_quality === 'medium') tags.push('medium-quality');
    else tags.push('basic-quality');

    return tags;
  }

  /**
   * Calculate data quality score
   */
  private calculateQuality(contact: any): 'high' | 'medium' | 'low' {
    let qualityScore = 0;

    if (contact.title || contact.occupation) qualityScore++;
    if (contact.linkedin_url) qualityScore++;
    if (contact.picture_url) qualityScore++;
    if (contact.industry) qualityScore++;
    if (contact.location) qualityScore++;

    if (qualityScore >= 4) return 'high';
    if (qualityScore >= 2) return 'medium';
    return 'low';
  }
}

export const enhancedLinkedInSync = EnhancedLinkedInSync.getInstance();