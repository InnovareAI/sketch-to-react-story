// Script to set up demo authentication in localStorage
// This should be run when the app loads to bypass authentication for demo

console.log('🔧 Setting up demo authentication...');

// Set up localStorage auth values
localStorage.setItem('is_authenticated', 'true');
localStorage.setItem('demo_workspace_id', 'df5d730f-1915-4269-bd5a-9534478b17af');
localStorage.setItem('demo_user_id', 'cc000000-0000-0000-0000-000000000001');

// Set up user profile in localStorage
const demoProfile = {
  id: 'cc000000-0000-0000-0000-000000000001',
  email: 'demo@sameaisalesassistant.com',
  full_name: 'Demo User',
  role: 'admin',
  workspace_id: 'df5d730f-1915-4269-bd5a-9534478b17af',
  workspace_name: 'SAM AI Demo',
  workspace_plan: 'premium',
  status: 'active'
};

localStorage.setItem('user_auth_profile', JSON.stringify(demoProfile));

console.log('✅ Demo authentication setup complete');
console.log('User can now access:', window.location.origin + '/follow-ups');

// Reload the page to apply authentication
if (window.location.pathname === '/follow-ups') {
  window.location.reload();
}