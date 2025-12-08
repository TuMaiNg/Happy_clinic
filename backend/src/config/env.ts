import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'clinic_booking',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set in environment variables'); })(),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (() => { throw new Error('JWT_REFRESH_SECRET must be set in environment variables'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'Happy Care Clinic <noreply@happycareclinic.com>',
    // OAuth2 (optional - for Gmail API)
    useOAuth2: process.env.EMAIL_USE_OAUTH2 === 'true',
    oauth2CredentialsPath: process.env.GOOGLE_OAUTH2_CREDENTIALS_PATH || 'credentials/google-oauth.json',
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  },
  
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'mock', // twilio | viettel | vnpt | mock
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    // Viettel (if using)
    viettelApiKey: process.env.VIETTEL_API_KEY || '',
    viettelApiSecret: process.env.VIETTEL_API_SECRET || '',
    viettelBrandname: process.env.VIETTEL_BRANDNAME || '',
    viettelEndpoint: process.env.VIETTEL_ENDPOINT || '',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
  
  businessRules: {
    minLeadTimeHours: parseInt(process.env.MIN_LEAD_TIME_HOURS || '2'),
    cancellationFeePercent: parseInt(process.env.CANCELLATION_FEE_PERCENT || '20'),
    noShowFeePercent: parseInt(process.env.NO_SHOW_FEE_PERCENT || '100'),
    maxBookingDaysAhead: parseInt(process.env.MAX_BOOKING_DAYS_AHEAD || '30'),
    slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES || '30'),
  },
};

