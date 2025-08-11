/**
 * LinkedIn Direct OAuth Integration
 * Implements LinkedIn OAuth 2.0 flow without third-party services
 */

export class LinkedInOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scope: string[];

  constructor() {
    // These need to be configured in LinkedIn Developer Portal
    this.clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '';
    // Use Netlify function for secure OAuth handling
    this.redirectUri = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth/linkedin/callback`
      : `${window.location.origin}/.netlify/functions/linkedin-callback`;
    this.scope = [
      'openid',
      'profile', 
      'email'
    ];
  }

  /**
   * Generate LinkedIn OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state || crypto.randomUUID(),
      scope: this.scope.join(' ')
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<any> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Send a message/post on LinkedIn
   */
  async createPost(accessToken: string, content: string): Promise<any> {
    const authorUrn = await this.getUserUrn(accessToken);
    
    const postData = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    try {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get user URN for API calls
   */
  private async getUserUrn(accessToken: string): Promise<string> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user URN');
      }

      const data = await response.json();
      return `urn:li:person:${data.sub}`;
    } catch (error) {
      console.error('Error fetching user URN:', error);
      throw error;
    }
  }
}

export const linkedInOAuth = new LinkedInOAuth();