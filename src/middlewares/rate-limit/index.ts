import rateLimit, {
  Options,
  RateLimitRequestHandler,
} from 'express-rate-limit';
import { config } from '../../config/app.config';
import { HTTPSTATUS } from '../../config/http.config';

/**
 * Shared options applied to every limiter so that exceeding the configured
 * limit always results in an HTTP 429 (Too Many Requests) response and the
 * standardized `RateLimit-*` headers are sent.
 */
const baseOptions: Partial<Options> = {
  statusCode: HTTPSTATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
};

/**
 * Stricter limiter intended for authentication endpoints (`/auth/*`).
 * Window and max are configurable via `RATE_LIMIT_AUTH_WINDOW_MS` and
 * `RATE_LIMIT_AUTH_MAX` env vars (defaults: 15 minutes / 10 requests).
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: config.RATE_LIMIT.AUTH.WINDOW_MS,
  limit: config.RATE_LIMIT.AUTH.MAX,
});

/**
 * Limiter for public write endpoints (contact, newsletter, comments,
 * reactions). Window and max are configurable via `RATE_LIMIT_WRITE_WINDOW_MS`
 * and `RATE_LIMIT_WRITE_MAX` env vars (defaults: 15 minutes / 30 requests).
 */
export const writeLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: config.RATE_LIMIT.WRITE.WINDOW_MS,
  limit: config.RATE_LIMIT.WRITE.MAX,
});
