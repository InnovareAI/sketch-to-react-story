import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportResult {
  success: boolean;
  contactsImported: number;
  totalProcessed: number;
  source: string;
  errors: string[];
  warnings: string[];
  processingTime: number;
  quality: {
    firstDegree: number;
    secondDegree: number;
    withJobTitles: number;
    withProfiles: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 LinkedIn Import Edge Function started');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Get request parameters from body or query params
    let workspaceId: string | null = null;
    let limit = 500;
    let method = 'both';
    let importId = '';
    let isTest = false;

    // Try to get parameters from JSON body first
    try {
      const body = await req.json();
      console.log('📝 Request body:', body);
      
      if (body.test) {
        isTest = true;
      }
      
      if (body.workspaceId) {
        workspaceId = body.workspaceId;
        limit = body.options?.limit || 500;
        method = body.options?.method || 'both';
        importId = body.options?.importId || '';
      }
    } catch (bodyError) {
      console.log('📋 No JSON body, checking URL params...');
      
      // Fallback to URL parameters
      const { searchParams } = new URL(req.url);
      workspaceId = searchParams.get('workspace_id');
      limit = parseInt(searchParams.get('limit') || '500');
      method = searchParams.get('method') || 'both';
      importId = searchParams.get('import_id') || '';
    }

    console.log('📊 Import Configuration:');
    console.log(`   • User: ${user.email}`);
    console.log(`   • Workspace ID: ${workspaceId}`);
    console.log(`   • Limit: ${limit}`);
    console.log(`   • Method: ${method}`);
    console.log(`   • Import ID: ${importId}`);
    console.log(`   • Is Test: ${isTest}`);

    // Handle test requests
    if (isTest) {
      console.log('🧪 Test request detected - returning success');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Edge function is available',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'workspace_id parameter required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify workspace ownership
    const { data: workspace, error: wsError } = await supabaseClient
      .from('workspaces')
      .select('id, settings')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (wsError || !workspace) {
      console.error('❌ Workspace verification failed:', wsError);
      return new Response(
        JSON.stringify({ error: 'Invalid workspace or access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Workspace verified:', workspace.id);

    // Start the import process
    const startTime = Date.now();
    const result: ImportResult = {
      success: false,
      contactsImported: 0,
      totalProcessed: 0,
      source: 'server-side-import',
      errors: [],
      warnings: [],
      processingTime: 0,
      quality: {
        firstDegree: 0,
        secondDegree: 0,
        withJobTitles: 0,
        withProfiles: 0,
      }
    };

    console.log('🔄 Starting server-side LinkedIn contact import...');

    try {
      // Method 1: Try Unipile API import
      if (method === 'unipile' || method === 'both') {
        console.log('📱 Attempting Unipile API import...');
        
        const unipileResult = await importViaUnipile(supabaseClient, workspaceId, limit);
        if (unipileResult.success && unipileResult.contactsImported > 0) {
          result.contactsImported += unipileResult.contactsImported;
          result.totalProcessed += unipileResult.totalProcessed;
          result.quality.firstDegree += unipileResult.quality.firstDegree;
          result.quality.secondDegree += unipileResult.quality.secondDegree;
          result.quality.withJobTitles += unipileResult.quality.withJobTitles;
          result.quality.withProfiles += unipileResult.quality.withProfiles;
          result.success = true;
          
          console.log(`✅ Unipile import successful: ${unipileResult.contactsImported} contacts`);
        } else {
          result.warnings.push('Unipile import returned no contacts');
          console.log('⚠️ Unipile import found no new contacts');
        }

        if (unipileResult.errors.length > 0) {
          result.errors.push(...unipileResult.errors);
        }
      }

      // Method 2: Try LinkedIn Developer API fallback
      if ((method === 'linkedin_api' || method === 'both') && result.contactsImported < 10) {
        console.log('🔗 Attempting LinkedIn Developer API fallback...');
        
        const linkedinResult = await importViaLinkedInAPI(supabaseClient, workspaceId, Math.min(limit - result.contactsImported, 100));
        if (linkedinResult.success && linkedinResult.contactsImported > 0) {
          result.contactsImported += linkedinResult.contactsImported;
          result.totalProcessed += linkedinResult.totalProcessed;
          result.quality.firstDegree += linkedinResult.contactsImported; // LinkedIn API contacts are typically 1st degree
          result.quality.withProfiles += linkedinResult.contactsImported; // All have profiles
          result.quality.withJobTitles += Math.floor(linkedinResult.contactsImported * 0.9); // High quality
          result.success = true;
          
          console.log(`✅ LinkedIn API import successful: ${linkedinResult.contactsImported} contacts`);
        }

        if (linkedinResult.errors.length > 0) {
          result.warnings.push(...linkedinResult.errors);
        }
      }

      // Final validation
      if (result.contactsImported === 0) {
        result.errors.push('No contacts imported from any source');
        result.success = false;
        console.log('❌ No contacts imported from any source');
      }

    } catch (importError) {
      console.error('❌ Import process error:', importError);
      result.errors.push(importError instanceof Error ? importError.message : 'Unknown import error');
      result.success = false;
    }

    result.processingTime = Date.now() - startTime;

    console.log('📊 Server-side import completed:');
    console.log(`   • Success: ${result.success}`);
    console.log(`   • Contacts imported: ${result.contactsImported}`);
    console.log(`   • Processing time: ${result.processingTime}ms`);
    console.log(`   • Errors: ${result.errors.length}`);
    console.log(`   • Warnings: ${result.warnings.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Import contacts via Unipile API
 */
async function importViaUnipile(supabaseClient: any, workspaceId: string, limit: number) {
  console.log('   🔄 Starting Unipile API import...');
  
  const result = {
    success: false,
    contactsImported: 0,
    totalProcessed: 0,
    errors: [] as string[],
    quality: {
      firstDegree: 0,
      secondDegree: 0,
      withJobTitles: 0,
      withProfiles: 0,
    }
  };

  try {
    // Get Unipile configuration
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    const unipileUrl = Deno.env.get('UNIPILE_URL') || 'https://api3.unipile.com:13456';

    if (!unipileApiKey) {
      result.errors.push('Unipile API key not configured');
      return result;
    }

    console.log(`   🔄 Fetching LinkedIn accounts from Unipile...`);

    // Get LinkedIn accounts
    const accountsResponse = await fetch(`${unipileUrl}/api/v1/accounts`, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': unipileApiKey
      }
    });

    if (!accountsResponse.ok) {
      result.errors.push(`Unipile API error: ${accountsResponse.status} ${accountsResponse.statusText}`);
      return result;
    }

    const accounts = await accountsResponse.json();
    console.log(`   📊 Found ${accounts.length} Unipile accounts`);

    const linkedinAccounts = accounts.filter((acc: any) => 
      acc.provider === 'linkedin' && acc.status === 'CONNECTED'
    );

    if (linkedinAccounts.length === 0) {
      result.errors.push('No connected LinkedIn accounts found in Unipile');
      return result;
    }

    console.log(`   ✅ Found ${linkedinAccounts.length} connected LinkedIn accounts`);

    // Import contacts from each LinkedIn account
    let totalImported = 0;

    for (const account of linkedinAccounts) {
      console.log(`   🔄 Processing LinkedIn account: ${account.email || account.username || 'Unknown'}`);

      try {
        // Get chats/conversations
        const chatsResponse = await fetch(`${unipileUrl}/api/v1/chats?account_id=${account.id}&limit=${limit}`, {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': unipileApiKey
          }
        });

        if (chatsResponse.ok) {
          const chats = await chatsResponse.json();
          console.log(`      📨 Found ${chats.length} chats`);

          for (const chat of chats) {
            if (chat.attendees && chat.attendees.length > 0) {
              for (const attendee of chat.attendees) {
                if (attendee.email && attendee.email !== account.email) {
                  const contactData = {
                    workspace_id: workspaceId,
                    email: attendee.email,
                    first_name: attendee.first_name || attendee.display_name?.split(' ')[0] || '',
                    last_name: attendee.last_name || attendee.display_name?.split(' ').slice(1).join(' ') || '',
                    title: attendee.job_title || '',
                    linkedin_url: attendee.linkedin_url || `https://linkedin.com/in/${attendee.linkedin_id || ''}`,
                    phone: attendee.phone || '',
                    department: '',
                    engagement_score: 75, // Default engagement score
                    tags: ['unipile_import', 'linkedin'],
                    metadata: {
                      provider_id: attendee.id,
                      source: 'unipile_linkedin',
                      account_id: account.id,
                      chat_id: chat.id,
                      imported_at: new Date().toISOString(),
                      connection_degree: attendee.connection_degree || 1
                    }
                  };

                  try {
                    const { error: insertError } = await supabaseClient
                      .from('contacts')
                      .upsert(contactData, { 
                        onConflict: 'workspace_id,email',
                        ignoreDuplicates: false 
                      });

                    if (!insertError) {
                      totalImported++;
                      result.totalProcessed++;
                      
                      // Update quality metrics
                      const degree = attendee.connection_degree || 1;
                      if (degree === 1) result.quality.firstDegree++;
                      else if (degree === 2) result.quality.secondDegree++;
                      
                      if (attendee.job_title) result.quality.withJobTitles++;
                      if (attendee.linkedin_url || attendee.linkedin_id) result.quality.withProfiles++;
                      
                      if (totalImported % 50 === 0) {
                        console.log(`      ✅ Imported ${totalImported} contacts so far...`);
                      }
                    } else {
                      console.error(`      ❌ Failed to insert contact ${attendee.email}:`, insertError);
                    }
                  } catch (dbError) {
                    console.error(`      ❌ Database error for ${attendee.email}:`, dbError);
                  }

                  if (totalImported >= limit) break;
                }
              }
            }
            if (totalImported >= limit) break;
          }
        }

      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.id}:`, accountError);
        result.errors.push(`Account ${account.email || account.id}: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`);
      }

      if (totalImported >= limit) break;
    }

    result.contactsImported = totalImported;
    result.success = totalImported > 0;

    console.log(`   ✅ Unipile import completed: ${totalImported} contacts`);
    return result;

  } catch (error) {
    console.error('   ❌ Unipile import error:', error);
    result.errors.push(`Unipile error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Import contacts via LinkedIn Developer API (fallback)
 */
async function importViaLinkedInAPI(supabaseClient: any, workspaceId: string, limit: number) {
  console.log('   🔗 Starting LinkedIn Developer API import...');
  
  const result = {
    success: false,
    contactsImported: 0,
    totalProcessed: 0,
    errors: [] as string[]
  };

  try {
    // LinkedIn Developer API has very limited access in v2
    // This is mainly for demonstration purposes
    result.errors.push('LinkedIn Developer API v2 has limited connection access due to privacy restrictions');
    console.log('   ⚠️ LinkedIn Developer API v2 has limited access');
    
    return result;

  } catch (error) {
    console.error('   ❌ LinkedIn API error:', error);
    result.errors.push(`LinkedIn API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/* To deploy this function:
 * 1. Make sure you have Supabase CLI installed
 * 2. Run: supabase functions deploy linkedin-import
 * 3. Set environment variables in Supabase dashboard:
 *    - UNIPILE_API_KEY: Your Unipile API key
 *    - UNIPILE_URL: Your Unipile API URL (optional, defaults to https://api3.unipile.com:13456)
 */