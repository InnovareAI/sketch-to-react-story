#!/usr/bin/env node

// Sample contact generator for testing
// Creates a CSV file with realistic contact data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa',
  'James', 'Mary', 'William', 'Jennifer', 'Richard', 'Linda', 'Thomas',
  'Patricia', 'Christopher', 'Elizabeth', 'Daniel', 'Nancy', 'Paul',
  'Karen', 'Mark', 'Betty', 'Donald', 'Helen', 'George', 'Sandra',
  'Kenneth', 'Donna', 'Steven', 'Carol', 'Edward', 'Ruth', 'Brian',
  'Michelle', 'Ronald', 'Laura', 'Anthony', 'Sarah', 'Kevin', 'Kimberly'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'
];

const companies = [
  'TechCorp Solutions', 'Global Innovations Inc', 'Digital Dynamics',
  'Future Systems', 'CloudBase Technologies', 'DataDrive Analytics',
  'CyberSecure Solutions', 'AI Innovations Lab', 'Quantum Computing Co',
  'BioTech Enterprises', 'Green Energy Systems', 'FinTech Solutions',
  'HealthTech Innovations', 'EduTech Systems', 'Marketing Dynamics',
  'Sales Force Pro', 'Customer Success Inc', 'Product Development Co',
  'Engineering Excellence', 'Research & Development Lab'
];

const titles = [
  'CEO', 'CTO', 'CFO', 'COO', 'VP Sales', 'VP Marketing', 'VP Engineering',
  'Director of Sales', 'Director of Marketing', 'Director of Engineering',
  'Senior Manager', 'Product Manager', 'Project Manager', 'Account Manager',
  'Sales Manager', 'Marketing Manager', 'Engineering Manager', 'HR Manager',
  'Senior Developer', 'Software Engineer', 'Data Scientist', 'Data Analyst',
  'Business Analyst', 'Sales Representative', 'Marketing Specialist',
  'Customer Success Manager', 'Technical Lead', 'Team Lead', 'Consultant'
];

const departments = [
  'Executive', 'Sales', 'Marketing', 'Engineering', 'Product', 'Operations',
  'Finance', 'Human Resources', 'Customer Success', 'Support', 'IT',
  'Research & Development', 'Business Development', 'Legal', 'Administration'
];

function generateContact(index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const department = departments[Math.floor(Math.random() * departments.length)];
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`;
  const linkedinUrl = `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index}`;
  const engagementScore = Math.floor(Math.random() * 100);
  
  return {
    firstName,
    lastName,
    email,
    title,
    company,
    department,
    linkedinUrl,
    engagementScore,
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
  };
}

function generateCSV(count = 100) {
  const contacts = [];
  const headers = ['First Name', 'Last Name', 'Email', 'Title', 'Company', 'Department', 'LinkedIn URL', 'Engagement Score', 'Phone'];
  
  for (let i = 0; i < count; i++) {
    contacts.push(generateContact(i));
  }
  
  const csvContent = [
    headers.join(','),
    ...contacts.map(c => [
      c.firstName,
      c.lastName,
      c.email,
      c.title,
      c.company,
      c.department,
      c.linkedinUrl,
      c.engagementScore,
      c.phone
    ].join(','))
  ].join('\n');
  
  const filename = `sample_contacts_${Date.now()}.csv`;
  const filepath = path.join(process.cwd(), filename);
  
  fs.writeFileSync(filepath, csvContent);
  
  console.log(`✅ Generated ${count} sample contacts`);
  console.log(`📁 File saved as: ${filename}`);
  console.log(`📍 Location: ${filepath}`);
  console.log('\n📋 Sample data:');
  console.log(contacts.slice(0, 3).map(c => `   • ${c.firstName} ${c.lastName} - ${c.title} at ${c.company}`).join('\n'));
  console.log('\n🚀 You can now import this CSV file into the SAM AI platform!');
}

// Get count from command line or use default
const count = parseInt(process.argv[2]) || 100;

if (count > 10000) {
  console.error('❌ Maximum 10,000 contacts allowed');
  process.exit(1);
}

console.log(`🔄 Generating ${count} sample contacts...`);
generateCSV(count);