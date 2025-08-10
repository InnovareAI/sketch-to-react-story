import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = 'https://latxadqrvrrrcvkktrog.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Get it from: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  console.log('🚀 Applying database schema to staging Supabase...\n');
  
  try {
    // Read the complete schema file
    const schemaPath = '/Users/tvonlinz/Dev_Master/InnovareAI/sam-ai/COMPLETE_DATABASE_SCHEMA.sql';
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📄 Read schema file successfully');
    console.log('📏 Schema size:', (schema.length / 1024).toFixed(2), 'KB\n');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🔢 Found ${statements.length} SQL statements to execute\n`);
    
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip certain statements that might cause issues
      if (statement.includes('\\echo') || statement.includes('\\i')) {
        console.log(`⏭️  Skipping psql command: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement
        });
        
        if (error) {
          // Check if it's a "already exists" error
          if (error.message.includes('already exists')) {
            console.log(`✅ [${i + 1}/${statements.length}] Already exists - skipping`);
            successful++;
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Failed:`, error.message);
            failed++;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Success`);
          successful++;
        }
      } catch (err) {
        console.error(`❌ [${i + 1}/${statements.length}] Error:`, err.message);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${statements.length - successful - failed}`);
    console.log('='.repeat(60));
    
    if (failed === 0) {
      console.log('\n🎉 Schema applied successfully to staging!');
    } else {
      console.log('\n⚠️  Schema applied with some errors. Review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution via Supabase Management API
async function applySchemaViaAPI() {
  console.log('🚀 Applying schema using Supabase Management API...\n');
  
  const projectRef = 'latxadqrvrrrcvkktrog';
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ SUPABASE_ACCESS_TOKEN required for Management API');
    console.log('Get it from: https://supabase.com/dashboard/account/tokens');
    return;
  }
  
  try {
    const schemaPath = '/Users/tvonlinz/Dev_Master/InnovareAI/sam-ai/COMPLETE_DATABASE_SCHEMA.sql';
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: schema
      })
    });
    
    if (response.ok) {
      console.log('✅ Schema applied successfully!');
    } else {
      const error = await response.text();
      console.error('❌ Failed to apply schema:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check which method to use
if (process.argv.includes('--api')) {
  applySchemaViaAPI();
} else {
  console.log('📝 Note: This script needs a service role key to execute SQL directly.');
  console.log('   Get it from your Supabase dashboard:\n');
  console.log('   https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/api\n');
  console.log('   Then run: SUPABASE_SERVICE_ROLE_KEY="your-key" node apply-staging-schema.js\n');
  console.log('   Or use --api flag with SUPABASE_ACCESS_TOKEN for Management API method.\n');
}