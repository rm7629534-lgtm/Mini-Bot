/**
 * Facebook Login API Module
 * Handles Facebook OAuth authentication and login flow
 */

const axios = require('axios');

class FacebookLoginAPI {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.redirectUri = config.redirectUri;
    this.apiVersion = config.apiVersion || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Generate Facebook login dialog URL
   * @param {Array} scopes - Array of permissions to request
   * @param {string} state - CSRF token for security
   * @returns {string} - Facebook login URL
   */
  getLoginUrl(scopes = ['public_profile', 'email'], state) {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      state: state || Math.random().toString(36).substring(7),
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Facebook
   * @returns {Promise<Object>} - Access token and user info
   */
  async getAccessToken(code) {
    try {
      const params = {
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code: code,
      };

      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Get user profile information
   * @param {string} accessToken - Facebook access token
   * @param {Array} fields - Fields to retrieve
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile(accessToken, fields = ['id', 'name', 'email', 'picture']) {
    try {
      const params = {
        access_token: accessToken,
        fields: fields.join(','),
      };

      const response = await axios.get(`${this.baseUrl}/me`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Verify and extend access token
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} - New token info
   */
  async refreshAccessToken(accessToken) {
    try {
      const params = {
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: accessToken,
      };

      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Verify access token validity
   * @param {string} accessToken - Facebook access token
   * @returns {Promise<Object>} - Token info and validity
   */
  async verifyAccessToken(accessToken) {
    try {
      const params = {
        input_token: accessToken,
        access_token: `${this.appId}|${this.appSecret}`,
      };

      const response = await axios.get(`${this.baseUrl}/debug_token`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to verify access token: ${error.message}`);
    }
  }

  /**
   * Logout user and invalidate access token
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} - Logout response
   */
  async logout(accessToken) {
    try {
      const params = {
        access_token: accessToken,
      };

      const response = await axios.delete(`${this.baseUrl}/me/permissions`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  }
}

module.exports = FacebookLoginAPI;
