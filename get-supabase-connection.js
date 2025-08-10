// SAM AI Staging Supabase Instance Details
// Project URL: https://latxadqrvrrrcvkktrog.supabase.co

console.log('SAM AI Staging Supabase Connection Info:');
console.log('=========================================\n');

console.log('📍 Project Details:');
console.log('  Project URL: https://latxadqrvrrrcvkktrog.supabase.co');
console.log('  Project Ref: latxadqrvrrrcvkktrog');
console.log('  Dashboard: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog\n');

console.log('🔗 Connection Strings:');
console.log('  To get the PostgreSQL connection string:');
console.log('  1. Go to: https://supabase.com/dashboard/project/latxadqrvrrrcvkktrog/settings/database');
console.log('  2. Look for "Connection string" section');
console.log('  3. Choose "URI" tab for the connection string\n');

console.log('📝 Expected format:');
console.log('  postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres');
console.log('  OR');
console.log('  postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres\n');

console.log('🔐 For MCP Configuration:');
console.log('  The connection string should be added to ~/.claude-code/mcp_config.json');
console.log('  Under the "postgres" server configuration\n');

// Based on the project ref, the connection string pattern would be:
const projectRef = 'latxadqrvrrrcvkktrog';
console.log('💡 Likely connection patterns for your project:');
console.log(`  Pooler: postgresql://postgres.${projectRef}:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`);
console.log(`  Direct: postgresql://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres\n`);

console.log('⚠️  Note: You need to get the actual password from your Supabase dashboard');
console.log('    The password is different from the anon key!');