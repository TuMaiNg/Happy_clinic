import { Router, Request, Response } from 'express';
import { gmailOAuthService } from '../services/gmail-oauth.service';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

/**
 * GET /api/auth/google/url
 * Get OAuth2 authorization URL (for first-time setup)
 */
router.get('/google/url', asyncHandler(async (req: Request, res: Response) => {
  try {
    const authUrl = gmailOAuthService.getAuthUrl();
    res.json({
      success: true,
      authUrl,
      message: 'Visit this URL to authorize Gmail access',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate auth URL',
    });
  }
}));

/**
 * GET /api/auth/google/callback
 * OAuth2 callback - exchange code for token
 */
router.get('/google/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      error: `Authorization failed: ${error}`,
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required',
    });
  }

  try {
    await gmailOAuthService.getToken(code as string);
    return res.send(`
      <html>
        <head><title>Authorization Successful</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #00A86B;">✅ Authorization Successful!</h1>
          <p>Gmail OAuth2 has been configured successfully.</p>
          <p>You can now close this window.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send(`
      <html>
        <head><title>Authorization Failed</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #F44336;">❌ Authorization Failed</h1>
          <p>${error.message || 'Unknown error occurred'}</p>
        </body>
      </html>
    `);
  }
}));

/**
 * GET /api/auth/google/status
 * Check OAuth2 configuration status
 */
router.get('/google/status', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    configured: gmailOAuthService.isConfigured(),
    hasToken: gmailOAuthService.hasToken(),
    ready: gmailOAuthService.isConfigured() && gmailOAuthService.hasToken(),
  });
}));

export default router;



















