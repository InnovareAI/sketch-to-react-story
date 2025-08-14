#!/usr/bin/env node

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Configuration
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'TmJkVEMu.JYn0adim1VZVzIjkR0VzTbpthDESA6S61R/RgtH22h8=';
const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api6.unipile.com:13670';
const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMjg2MjUsImV4cCI6MjA0OTcwNDYyNX0.VnFyqL4b_W6Btb-lMT4hMZOHxC7sJQEd5u7ehFYkJXc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔄 Starting LinkedIn contact sync...\n');

async function syncLinkedInContacts() {
  try {
    // Step 1: Get LinkedIn accounts from Unipile
    console.log('1️⃣ Fetching LinkedIn accounts from Unipile...');
    const accountsResponse = await fetch(`https://${UNIPILE_DSN}/api/v1/accounts`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
    }

    const accountsData = await accountsResponse.json();
    console.log('   Response type:', typeof accountsData);
    console.log('   Response:', JSON.stringify(accountsData).substring(0, 200));
    
    // Handle different response formats
    let accounts = [];
    if (Array.isArray(accountsData)) {
      accounts = accountsData;
    } else if (accountsData.items && Array.isArray(accountsData.items)) {
      accounts = accountsData.items;
    } else if (accountsData.accounts && Array.isArray(accountsData.accounts)) {
      accounts = accountsData.accounts;
    } else if (accountsData.object === 'list' && accountsData.items) {
      accounts = accountsData.items;
    }
    
    const linkedInAccounts = accounts.filter(acc => 
      acc.provider === 'LINKEDIN' || 
      acc.provider === 'linkedin' || 
      acc.type === 'LINKEDIN' ||
      acc.type === 'linkedin'
    );
    
    if (linkedInAccounts.length === 0) {
      console.log('❌ No LinkedIn accounts found. Please connect your LinkedIn account first.');
      console.log('\nTo connect LinkedIn:');
      console.log('1. Go to https://sameaisalesassistant.netlify.app/settings');
      console.log('2. Navigate to the Integrations tab');
      console.log('3. Click "Connect LinkedIn"');
      return;
    }

    console.log(`✅ Found ${linkedInAccounts.length} LinkedIn account(s)\n`);

    for (const account of linkedInAccounts) {
      console.log(`2️⃣ Syncing contacts for account: ${account.name || account.id}`);
      
      // Step 2: Fetch contacts from LinkedIn via Unipile
      console.log('   Fetching contacts...');
      const contactsResponse = await fetch(`https://${UNIPILE_DSN}/api/v1/contacts?account_id=${account.id}`, {
        headers: {
          'X-API-KEY': UNIPILE_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!contactsResponse.ok) {
        console.error(`   ❌ Failed to fetch contacts: ${contactsResponse.status}`);
        continue;
      }

      const contactsData = await contactsResponse.json();
      const contacts = Array.isArray(contactsData) ? contactsData : contactsData.items || [];
      
      console.log(`   ✅ Found ${contacts.length} contacts\n`);

      if (contacts.length === 0) {
        console.log('   ⚠️ No contacts found. Your LinkedIn account might not have synced yet.');
        continue;
      }

      // Step 3: Get or create workspace
      console.log('3️⃣ Setting up workspace...');
      let workspaceId = 'default-workspace-' + Date.now();
      
      // Try to get existing workspace
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1);
      
      if (workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
        console.log(`   ✅ Using existing workspace: ${workspaceId}\n`);
      } else {
        // Create new workspace
        const { data: newWorkspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            id: workspaceId,
            name: 'Default Workspace',
            slug: 'default'
          })
          .select()
          .single();
        
        if (!wsError && newWorkspace) {
          workspaceId = newWorkspace.id;
          console.log(`   ✅ Created new workspace: ${workspaceId}\n`);
        }
      }

      // Step 4: Import contacts to Supabase
      console.log('4️⃣ Importing contacts to database...');
      let importedCount = 0;
      let skippedCount = 0;

      for (const contact of contacts) {
        const contactData = {
          workspace_id: workspaceId,
          first_name: contact.first_name || contact.name?.split(' ')[0] || '',
          last_name: contact.last_name || contact.name?.split(' ').slice(1).join(' ') || '',
          email: contact.email || contact.emails?.[0] || '',
          title: contact.headline || contact.title || '',
          department: '',
          linkedin_url: contact.linkedin_url || contact.profile_url || '',
          engagement_score: 50,
          tags: [],
          metadata: {
            company: contact.company || contact.current_company || '',
            location: contact.location || '',
            unipile_id: contact.id,
            synced_at: new Date().toISOString()
          }
        };

        // Skip if no name or identifier
        if (!contactData.first_name && !contactData.last_name && !contactData.email) {
          skippedCount++;
          continue;
        }

        // Generate email if missing
        if (!contactData.email) {
          const fname = contactData.first_name.toLowerCase().replace(/\s+/g, '');
          const lname = contactData.last_name.toLowerCase().replace(/\s+/g, '');
          contactData.email = `${fname}${fname && lname ? '.' : ''}${lname}@linkedin.contact`;
        }

        // Upsert contact
        const { error } = await supabase
          .from('contacts')
          .upsert(contactData, {
            onConflict: 'workspace_id,email'
          });

        if (error) {
          console.error(`   ⚠️ Failed to import ${contactData.first_name} ${contactData.last_name}: ${error.message}`);
        } else {
          importedCount++;
          if (importedCount % 10 === 0) {
            console.log(`   📊 Progress: ${importedCount} contacts imported...`);
          }
        }
      }

      console.log(`\n✅ Sync complete!`);
      console.log(`   • Imported: ${importedCount} contacts`);
      console.log(`   • Skipped: ${skippedCount} contacts`);
      console.log(`\n🎉 Your LinkedIn contacts are now available at:`);
      console.log(`   https://sameaisalesassistant.netlify.app/contacts`);
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure your LinkedIn account is connected');
    console.error('2. Check that Unipile API key is valid');
    console.error('3. Ensure you have internet connection');
  }
}

// Run the sync
syncLinkedInContacts();