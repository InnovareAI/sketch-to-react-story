// Test LinkedIn OAuth URL generation
const clientId = '78094ft3hvizqs';
const redirectUri = 'https://sameaisalesassistant.netlify.app/auth/linkedin/callback';
const scope = ['openid', 'profile', 'email'];
const state = 'test-state-' + Math.random().toString(36).substr(2, 9);

const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  state: state,
  scope: scope.join(' ')
});

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

console.log('LinkedIn OAuth URL:');
console.log(authUrl);
console.log('\nRedirect URI:', redirectUri);
console.log('State:', state);