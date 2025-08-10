import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ktchrfgkbpaixbiwbieg:i0EiFpjnF4DtVyOV@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test query - list tables
    console.log('📊 Fetching tables in public schema...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);

    console.log('\n📋 Tables found:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // Count total tables
    const countResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`\n📈 Total tables in public schema: ${countResult.rows[0].total}`);

    // Check for SAM AI specific tables
    const samTables = ['workspaces', 'profiles', 'accounts', 'campaigns', 'contacts'];
    console.log('\n🔍 Checking for SAM AI tables:');
    
    for (const table of samTables) {
      const exists = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      const status = exists.rows[0].exists ? '✅' : '❌';
      console.log(`  ${status} ${table}`);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nError details:', error);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

testConnection();