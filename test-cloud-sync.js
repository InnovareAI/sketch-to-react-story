// Test Cloud Sync Functionality
// This tests the edge function sync directly

const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co'
// Your provided JWT key
const YOUR_JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTk5ODYsImV4cCI6MjA2ODI3NTk4Nn0.3WkAgXpk_MyQioVf_SED9O_ArjcT9nH0uy9we2okftE'

// Existing keys for comparison
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NjMyNjIsImV4cCI6MjA1MTMzOTI2Mn0.BOJJjzPzHWx6Y4qwZiU6mEW0Xsz2kGJjwPe2Ga8v_Js'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc2MzI2MiwiZXhwIjoyMDUxMzM5MjYyfQ.6KZU5aSTRqEYCq1B2J9BSluvvhgJV8ub7HlFNJm9w5A'

async function testCloudSync() {
  console.log('🧪 Testing Cloud Sync Edge Function...')
  
  try {
    // First try with anon key (edge functions should allow anon access)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/linkedin-background-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_JWT_KEY}`,
        'apikey': YOUR_JWT_KEY
      },
      body: JSON.stringify({
        workspace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        account_id: '4jyMc-EDT1-hE5pOoT7EaQ',
        sync_type: 'both',
        limit: 10 // Small limit for testing
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Cloud sync successful!')
      console.log('📊 Sync results:', result)
      return result
    } else {
      const errorText = await response.text()
      console.error('❌ Cloud sync failed:', response.status, errorText)
      return { error: errorText, status: response.status }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return { error: error.message }
  }
}

// Run the test
testCloudSync()
  .then(result => {
    console.log('\n🏁 Test completed')
    console.log('📋 Final result:', result)
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error)
  })