import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

class GmailOAuthService {
  private oauth2Client: any;
  private gmail: any;
  private tokenPath: string;

  constructor() {
    this.tokenPath = path.join(__dirname, '../../credentials/gmail-token.json');
    
    // Load credentials
    const credentialsPath = path.join(__dirname, '../../credentials/google-oauth.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.warn('⚠️ Gmail OAuth credentials not found. Using SMTP fallback.');
      return;
    }

    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      this.oauth2Client = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.redirect_uris[0] || config.google.redirectUri
      );

      // Load token if exists
      if (fs.existsSync(this.tokenPath)) {
        const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
        this.oauth2Client.setCredentials(token);
        
        // Refresh token if expired
        this.refreshTokenIfNeeded();
      }

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    } catch (error) {
      console.error('❌ Error initializing Gmail OAuth:', error);
    }
  }

  /**
   * Get authorization URL for first-time setup
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getToken(code: string): Promise<TokenData> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    // Save token
    fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));
    console.log('✅ OAuth2 token saved');
    
    return tokens as TokenData;
  }

  /**
   * Refresh access token if expired
   */
  private async refreshTokenIfNeeded() {
    if (!this.oauth2Client) return;

    const credentials = this.oauth2Client.credentials;
    if (!credentials || !credentials.expiry_date) return;

    const now = Date.now();
    const expiryTime = credentials.expiry_date;

    // Refresh if expires in less than 5 minutes
    if (expiryTime - now < 5 * 60 * 1000) {
      try {
        const { credentials: newCredentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(newCredentials);
        
        // Save updated token
        fs.writeFileSync(this.tokenPath, JSON.stringify(newCredentials, null, 2));
        console.log('✅ OAuth2 token refreshed');
      } catch (error) {
        console.error('❌ Error refreshing token:', error);
      }
    }
  }

  /**
   * Check if OAuth2 is configured and ready
   */
  isConfigured(): boolean {
    return !!this.oauth2Client && !!this.gmail;
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return fs.existsSync(this.tokenPath);
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(to: string, subject: string, html: string, fromEmail?: string): Promise<void> {
    if (!this.gmail) {
      throw new Error('Gmail API not initialized');
    }

    // Refresh token if needed
    await this.refreshTokenIfNeeded();

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      html,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      console.log(`✅ Email sent via Gmail API to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email via Gmail API:', error);
      throw error;
    }
  }
}

export const gmailOAuthService = new GmailOAuthService();



