"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = exports.allowedOrigins = exports.parseAllowedOrigins = void 0;
const get_env_1 = require("../common/utils/get-env");
/**
 * Default origins allowed during local development when
 * `CORS_ALLOWED_ORIGINS` is not provided.
 */
const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
];
/**
 * Parse the comma-separated `CORS_ALLOWED_ORIGINS` env var into a normalized
 * allowlist. Empty entries and surrounding whitespace are stripped. When the
 * env var is unset/empty, a sensible development default is used so the API
 * keeps working locally without extra configuration.
 */
const parseAllowedOrigins = (raw) => {
    const origins = raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    return origins.length > 0 ? origins : [...DEFAULT_DEV_ORIGINS];
};
exports.parseAllowedOrigins = parseAllowedOrigins;
/**
 * The configured CORS allowlist. Cross-origin requests are restricted to these
 * origins (Req 12.4).
 */
exports.allowedOrigins = (0, exports.parseAllowedOrigins)((0, get_env_1.getEnv)('CORS_ALLOWED_ORIGINS', ''));
/**
 * `cors` package compatible options. The `origin` callback allows requests
 * whose `Origin` header is in the allowlist, as well as requests without an
 * `Origin` header (e.g. same-origin, curl, mobile apps, server-to-server),
 * and rejects everything else.
 */
exports.corsOptions = {
    origin(origin, callback) {
        // No Origin header => not a cross-origin browser request; allow it.
        if (!origin || exports.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
};
