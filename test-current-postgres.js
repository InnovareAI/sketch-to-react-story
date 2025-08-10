import pg from 'pg';
const { Client } = pg;

// Current PostgreSQL MCP configuration
const connectionString = 'postgresql://postgres.ktchrfgkbpaixbiwbieg:i0EiFpjnF4DtVyOV@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function testConnection() {
  const client = new Client({ connectionString });

  try {
    console.log('🔄 Testing current PostgreSQL MCP connection...\n');
    await client.connect();
    
    // Get database info
    const dbInfo = await client.query(`
      SELECT current_database() as database,
             current_user as user,
             version() as version
    `);
    
    console.log('📊 Database Info:');
    console.log('  Database:', dbInfo.rows[0].database);
    console.log('  User:', dbInfo.rows[0].user);
    console.log('  Project: ktchrfgkbpaixbiwbieg (3Cubed SEO)\n');
    
    // Check for SAM AI tables
    const samTables = ['workspaces', 'profiles', 'campaigns', 'contacts'];
    console.log('🔍 Checking for SAM AI multi-tenant tables:');
    
    for (const table of samTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      const status = result.rows[0].exists ? '✅' : '❌';
      console.log(`  ${status} ${table}`);
    }
    
    console.log('\n⚠️  This is the WRONG database for SAM AI!');
    console.log('   Need to update to: latxadqrvrrrcvkktrog\n');
    
    console.log('📝 To fix, update DATABASE_URI in claude_desktop_config.json:');
    console.log('   FROM: postgresql://postgres.ktchrfgkbpaixbiwbieg:...');
    console.log('   TO:   postgresql://postgres.latxadqrvrrrcvkktrog:[password]@...\n');
    console.log('   Get the password from:');
    console.log('   https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();