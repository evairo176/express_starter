// Jest setup: provide safe defaults for required environment variables so that
// modules importing `app.config` (which calls getEnv with no default) can load
// during tests. Real values are loaded from .env first when present.
import { config as loadEnv } from 'dotenv';

loadEnv();

const defaults: Record<string, string> = {
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  MAILER_SENDER: 'test@example.com',
  RESEND_API_KEY: 'test-resend-key',
  CONTACT_OWNER_EMAIL: 'owner@example.com',
  // Provide an explicit CORS allowlist so importing the app (which builds the
  // CORS allowlist at module load via security.config) works deterministically
  // in tests. Mirrors the development defaults; production behavior is unchanged.
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
