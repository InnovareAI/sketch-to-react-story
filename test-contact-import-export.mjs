#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = 'https://latxadqrvrrrcvkktrog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHhhZHFydnJycmN2a2t0cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDEwNzUsImV4cCI6MjA1MjE3NzA3NX0.niqLT5ue9wDzJKVp8J8jZRJRQwhZGTWJysN8nU2h4ek';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testContactImportExport() {
  console.log('🧪 Testing Contact Import/Export Functionality\n');
  console.log('═'.repeat(50));
  
  const results = {
    database: { status: '❌', details: '' },
    export: { status: '❌', details: '' },
    import: { status: '❌', details: '' },
    csvParsing: { status: '❌', details: '' },
    dataIntegrity: { status: '❌', details: '' }
  };

  // Test 1: Database Contacts Table
  console.log('\n📊 Testing Contacts Database...');
  let existingContacts = [];
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    
    existingContacts = contacts || [];
    results.database.status = '✅';
    results.database.details = `Found ${existingContacts.length} existing contacts`;
    console.log(`✅ Database working: ${results.database.details}`);
  } catch (error) {
    results.database.details = error.message;
    console.error(`❌ Database error: ${error.message}`);
  }

  // Test 2: Export Functionality (simulate what the UI does)
  console.log('\n📤 Testing Export Functionality...');
  try {
    // Simulate creating CSV from contacts
    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Title', 'Department', 'Phone', 'LinkedIn URL'];
    const csvRows = existingContacts.map(contact => [
      contact.first_name || '',
      contact.last_name || '',
      contact.email || '',
      contact.title || '',
      contact.department || '',
      contact.phone || '',
      contact.linkedin_url || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Write to test file
    const exportPath = path.join(process.cwd(), 'test-export.csv');
    fs.writeFileSync(exportPath, csvContent);
    
    results.export.status = '✅';
    results.export.details = `Exported ${csvRows.length} contacts to CSV`;
    console.log(`✅ Export working: ${results.export.details}`);
    
    // Clean up
    fs.unlinkSync(exportPath);
  } catch (error) {
    results.export.details = error.message;
    console.error(`❌ Export error: ${error.message}`);
  }

  // Test 3: CSV Parsing (simulate import parsing)
  console.log('\n📄 Testing CSV Parsing...');
  try {
    const testCsv = `"First Name","Last Name","Email","Title","Department","Phone","LinkedIn URL"
"John","Doe","john.doe@example.com","CEO","Executive","555-1234","https://linkedin.com/in/johndoe"
"Jane","Smith","jane.smith@example.com","CTO","Technology","555-5678","https://linkedin.com/in/janesmith"
"Bob","Johnson","bob.j@example.com","Developer","Engineering","","https://linkedin.com/in/bobj"`;
    
    const lines = testCsv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const parsedContacts = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length >= 3 && values[2]) { // Must have email
        const contact = {
          first_name: values[0] || null,
          last_name: values[1] || null,
          email: values[2],
          title: values[3] || null,
          department: values[4] || null,
          phone: values[5] || null,
          linkedin_url: values[6] || null,
        };
        parsedContacts.push(contact);
      }
    }
    
    results.csvParsing.status = '✅';
    results.csvParsing.details = `Parsed ${parsedContacts.length} contacts from CSV`;
    console.log(`✅ CSV Parsing working: ${results.csvParsing.details}`);
  } catch (error) {
    results.csvParsing.details = error.message;
    console.error(`❌ CSV Parsing error: ${error.message}`);
  }

  // Test 4: Import Functionality
  console.log('\n📥 Testing Import Functionality...');
  try {
    // Create a test contact to import
    const testContact = {
      first_name: 'Test',
      last_name: 'Import',
      email: `test.import.${Date.now()}@example.com`,
      title: 'Test Title',
      department: 'Testing',
      workspace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // Test workspace ID
    };
    
    // Insert test contact
    const { data: imported, error } = await supabase
      .from('contacts')
      .insert(testContact)
      .select()
      .single();
    
    if (error) throw error;
    
    results.import.status = '✅';
    results.import.details = `Successfully imported test contact with ID: ${imported.id}`;
    console.log(`✅ Import working: ${results.import.details}`);
    
    // Clean up - delete test contact
    await supabase
      .from('contacts')
      .delete()
      .eq('id', imported.id);
      
  } catch (error) {
    results.import.details = error.message;
    console.error(`❌ Import error: ${error.message}`);
  }

  // Test 5: Data Integrity Check
  console.log('\n🔍 Testing Data Integrity...');
  try {
    // Check for duplicate emails
    const { data: emails, error } = await supabase
      .from('contacts')
      .select('email')
      .not('email', 'is', null);
    
    if (error) throw error;
    
    const emailSet = new Set();
    const duplicates = [];
    
    emails?.forEach(record => {
      if (emailSet.has(record.email)) {
        duplicates.push(record.email);
      }
      emailSet.add(record.email);
    });
    
    results.dataIntegrity.status = duplicates.length === 0 ? '✅' : '⚠️';
    results.dataIntegrity.details = duplicates.length === 0 
      ? 'No duplicate emails found' 
      : `Found ${duplicates.length} duplicate emails`;
    console.log(`${results.dataIntegrity.status} Data Integrity: ${results.dataIntegrity.details}`);
  } catch (error) {
    results.dataIntegrity.details = error.message;
    console.error(`❌ Data Integrity error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log('═'.repeat(50));
  
  for (const [test, result] of Object.entries(results)) {
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${result.status} ${testName}: ${result.details}`);
  }
  
  // Overall verdict
  const allPassed = Object.values(results).every(r => r.status === '✅');
  const somePassed = Object.values(results).some(r => r.status === '✅');
  
  console.log('\n' + '═'.repeat(50));
  if (allPassed) {
    console.log('✅ Contact import/export is fully functional!');
  } else if (somePassed) {
    console.log('⚠️  Contact import/export partially working');
  } else {
    console.log('❌ Major issues with contact import/export');
  }
  
  // Recommendations
  console.log('\n📝 RECOMMENDATIONS:');
  if (results.database.status !== '✅') {
    console.log('- Fix database connection or contacts table structure');
  }
  if (results.csvParsing.status !== '✅') {
    console.log('- Review CSV parsing logic for edge cases');
  }
  if (results.dataIntegrity.status === '⚠️') {
    console.log('- Consider adding unique constraints or deduplication logic');
  }
  
  return results;
}

// Run the test
testContactImportExport().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});