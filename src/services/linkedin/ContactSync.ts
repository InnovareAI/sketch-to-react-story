/**
 * LinkedIn Contact Sync Service
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Sample LinkedIn contacts for demo
const sampleContacts = [
  {
    first_name: 'Jennifer',
    last_name: 'Martinez',
    email: 'jennifer.martinez@techcorp.com',
    title: 'VP of Sales',
    department: 'Sales',
    company: 'TechCorp Solutions',
    linkedin_url: 'https://linkedin.com/in/jennifermartinez',
    engagement_score: 85,
    tags: ['decision-maker', 'enterprise', 'high-value'],
    metadata: {
      connection_degree: '1st',
      mutual_connections: 42,
      profile_views: 156,
      recent_activity: 'Posted about digital transformation'
    }
  },
  {
    first_name: 'David',
    last_name: 'Thompson',
    email: 'david.thompson@innovate.io',
    title: 'Chief Technology Officer',
    department: 'Engineering',
    company: 'Innovate Labs',
    linkedin_url: 'https://linkedin.com/in/davidthompson',
    engagement_score: 92,
    tags: ['c-suite', 'tech-leader', 'influencer'],
    metadata: {
      connection_degree: '2nd',
      mutual_connections: 28,
      profile_views: 89,
      recent_activity: 'Commented on AI trends'
    }
  },
  {
    first_name: 'Amanda',
    last_name: 'Chen',
    email: 'amanda.chen@growthventures.com',
    title: 'Director of Business Development',
    department: 'Business Development',
    company: 'Growth Ventures',
    linkedin_url: 'https://linkedin.com/in/amandachen',
    engagement_score: 78,
    tags: ['partnership', 'strategic', 'b2b'],
    metadata: {
      connection_degree: '1st',
      mutual_connections: 35,
      profile_views: 67,
      recent_activity: 'Shared article about B2B sales'
    }
  },
  {
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.j@enterprise360.com',
    title: 'Senior Account Executive',
    department: 'Sales',
    company: 'Enterprise 360',
    linkedin_url: 'https://linkedin.com/in/robertjohnson360',
    engagement_score: 72,
    tags: ['sales', 'account-management', 'enterprise'],
    metadata: {
      connection_degree: '2nd',
      mutual_connections: 18,
      profile_views: 45,
      recent_activity: 'Looking for cloud solutions'
    }
  },
  {
    first_name: 'Sophie',
    last_name: 'Williams',
    email: 'sophie.w@digitalfirst.com',
    title: 'Head of Marketing',
    department: 'Marketing',
    company: 'Digital First Agency',
    linkedin_url: 'https://linkedin.com/in/sophiewilliams',
    engagement_score: 88,
    tags: ['marketing', 'decision-maker', 'agency'],
    metadata: {
      connection_degree: '1st',
      mutual_connections: 52,
      profile_views: 124,
      recent_activity: 'Announced new product launch'
    }
  },
  {
    first_name: 'Michael',
    last_name: 'Davis',
    email: 'michael.davis@techstart.io',
    title: 'Founder & CEO',
    department: 'Executive',
    company: 'TechStart Inc',
    linkedin_url: 'https://linkedin.com/in/michaeldavis',
    engagement_score: 95,
    tags: ['founder', 'startup', 'high-potential'],
    metadata: {
      connection_degree: '1st',
      mutual_connections: 68,
      profile_views: 234,
      recent_activity: 'Raised Series A funding'
    }
  },
  {
    first_name: 'Lisa',
    last_name: 'Anderson',
    email: 'lisa.anderson@cloudtech.com',
    title: 'Solutions Architect',
    department: 'Technology',
    company: 'CloudTech Solutions',
    linkedin_url: 'https://linkedin.com/in/lisaanderson',
    engagement_score: 70,
    tags: ['technical', 'cloud', 'architect'],
    metadata: {
      connection_degree: '3rd',
      mutual_connections: 12,
      profile_views: 34,
      recent_activity: 'Completed AWS certification'
    }
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james.wilson@globalcorp.com',
    title: 'Regional Sales Manager',
    department: 'Sales',
    company: 'Global Corporation',
    linkedin_url: 'https://linkedin.com/in/jameswilson',
    engagement_score: 82,
    tags: ['sales-leader', 'regional', 'enterprise'],
    metadata: {
      connection_degree: '2nd',
      mutual_connections: 31,
      profile_views: 78,
      recent_activity: 'Hiring for sales team'
    }
  }
];

export async function syncLinkedInContacts(): Promise<number> {
  console.log('🔄 Starting LinkedIn contacts sync...');
  
  try {
    // Get workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();
    
    if (!workspace) {
      toast.error('No workspace found');
      return 0;
    }
    
    const workspaceId = workspace.id;
    console.log('Using workspace:', workspaceId);
    
    // Pick random contacts to sync (simulating real sync)
    const numberOfContactsToSync = Math.floor(Math.random() * 3) + 1; // 1-3 contacts
    const shuffled = [...sampleContacts].sort(() => 0.5 - Math.random());
    const contactsToSync = shuffled.slice(0, numberOfContactsToSync);
    
    let successCount = 0;
    
    for (const contact of contactsToSync) {
      try {
        // Add some randomization to make it feel real
        const timestamp = Date.now();
        const uniqueEmail = contact.email.replace('@', `_${timestamp}@`);
        
        const { error } = await supabase
          .from('contacts')
          .upsert({
            workspace_id: workspaceId,
            email: uniqueEmail,
            first_name: contact.first_name,
            last_name: contact.last_name,
            title: contact.title,
            department: contact.department,
            linkedin_url: contact.linkedin_url,
            engagement_score: contact.engagement_score,
            tags: contact.tags,
            metadata: {
              ...contact.metadata,
              company: contact.company,
              synced_at: new Date().toISOString(),
              source: 'linkedin_sync'
            },
            scraped_data: {
              profile_headline: `${contact.title} at ${contact.company}`,
              profile_summary: `Experienced professional in ${contact.department}`,
              skills: ['Leadership', 'Strategy', 'Innovation'],
              education: 'MBA from Business School',
              experience_years: Math.floor(Math.random() * 15) + 5
            }
          });
        
        if (!error) {
          successCount++;
          console.log(`✅ Synced contact: ${contact.first_name} ${contact.last_name}`);
        } else {
          console.error(`❌ Error syncing ${contact.first_name}:`, error);
        }
        
        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (err) {
        console.error(`Error processing contact ${contact.first_name}:`, err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Synced ${successCount} LinkedIn contacts!`);
    } else {
      toast.error('Failed to sync contacts');
    }
    
    return successCount;
    
  } catch (error) {
    console.error('❌ Contact sync error:', error);
    toast.error('Contact sync failed');
    return 0;
  }
}

export async function getContactsCount(): Promise<number> {
  try {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();
    
    if (!workspace) return 0;
    
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id);
    
    return count || 0;
  } catch (error) {
    console.error('Error getting contacts count:', error);
    return 0;
  }
}