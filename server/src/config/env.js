import 'dotenv/config';

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(
    `[config] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      '         Copy server/.env.example to server/.env and fill in the values.'
  );
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI.trim(),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,
  otpDevResponse: process.env.OTP_DEV_RESPONSE === 'true',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'StockSense <no-reply@stocksense.local>',
  },
};

env.isProduction = env.nodeEnv === 'production';

export default env;
