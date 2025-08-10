import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://latxadqrvrrrcvkktrog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'
);

console.log('🔍 SAM AI SPECIFIC DATABASE ANALYSIS\n');

async function analyzeSamAiDatabase() {
  try {
    console.log('=== CHECKING SAM AI REQUIRED TABLES ===');
    
    // Tables that Sam AI needs for the 8-stage workflow
    const samAiTables = [
      'workspaces',           // Multi-tenant workspaces
      'profiles',             // User profiles
      'accounts',             // Target companies  
      'contacts',             // Lead/prospect data
      'campaigns',            // Campaign management
      'messages',             // Outreach messages
      'ai_assistants',        // Sam AI configurations
      'conversations',        // Conversation tracking
      'conversation_messages',// Chat history
      'integrations',         // MCP integrations (Apify, Unipile, etc)
      'workflows',            // n8n workflow data
      'analytics_events'      // Performance tracking
    ];

    const missingTables = [];
    const existingTables = [];

    for (const table of samAiTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log('❌', table, '- MISSING:', error.message);
          missingTables.push(table);
        } else {
          console.log('✅', table, '- EXISTS (', count || 0, 'records)');
          existingTables.push(table);
        }
      } catch (err) {
        console.log('❌', table, '- ERROR:', err.message);
        missingTables.push(table);
      }
    }

    console.log('\n=== CURRENT TABLE STRUCTURE ANALYSIS ===');
    
    // Check existing tables for structure
    const currentTables = ['tenants', 'organizations', 'users', 'platform_accounts', 'submissions'];
    
    for (const table of currentTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log('📊', table, '- Sample fields:', Object.keys(data[0]).slice(0, 8).join(', '));
        } else if (!error) {
          console.log('📊', table, '- EXISTS but empty');
        }
      } catch (err) {
        console.log('❌', table, '- Not accessible');
      }
    }

    console.log('\n=== MULTI-TENANT ANALYSIS ===');
    
    // Check current tenant setup
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .limit(3);
      
    if (tenantData && tenantData.length > 0) {
      console.log('🏢 Current tenant:', tenantData[0].name);
      console.log('📋 Tenant fields:', Object.keys(tenantData[0]).join(', '));
    }

    const { data: orgData } = await supabase
      .from('organizations') 
      .select('*')
      .limit(3);
      
    console.log('🏢 Organizations found:', orgData ? orgData.length : 0);

    console.log('\n=== SAM AI DATABASE STATUS SUMMARY ===');
    console.log('✅ Existing Sam AI tables:', existingTables.length, '/', samAiTables.length);
    console.log('❌ Missing Sam AI tables:', missingTables.length);
    
    if (missingTables.length > 0) {
      console.log('\n🚨 MISSING TABLES FOR SAM AI:');
      missingTables.forEach(table => console.log('   • ' + table));
    }

    console.log('\n=== SAM AI 8-STAGE WORKFLOW REQUIREMENTS ===');
    console.log('🎯 Required data structures for Sam AI workflow:');
    console.log('   Stage 1 - Lead Scraping: contacts, integrations (Apify MCP)');
    console.log('   Stage 2 - Data Enrichment: contacts.metadata, accounts');  
    console.log('   Stage 3 - Knowledge Base RAG: ai_assistants, conversations');
    console.log('   Stage 4 - Lead Qualification: contacts.engagement_score, analytics_events');
    console.log('   Stage 5 - Personalization: messages, ai_assistants');
    console.log('   Stage 6 - Multi-channel Outreach: campaigns, messages, integrations');
    console.log('   Stage 7 - Response Handling: conversations, conversation_messages');
    console.log('   Stage 8 - Follow-up Automation: workflows, analytics_events');
    
    console.log('\n=== INTEGRATION REQUIREMENTS ===');
    console.log('🔌 Required MCP integrations:');
    console.log('   • Apify MCP - LinkedIn scraping, data collection');
    console.log('   • Unipile MCP - LinkedIn API integration');  
    console.log('   • n8n MCP - Workflow automation');
    console.log('   • Bright Data - Proxy network for scraping');

    console.log('\n=== RECOMMENDATION ===');
    if (missingTables.length > 0) {
      console.log('⚠️  Database needs Sam AI schema setup before proceeding');
      console.log('📝 Run staging-schema.sql or multi-tenant-setup.sql to create missing tables');
    } else {
      console.log('✅ Database schema is ready for Sam AI implementation');
    }

  } catch (err) {
    console.error('❌ Analysis failed:', err.message);
  }
}

analyzeSamAiDatabase();