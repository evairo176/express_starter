"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_config_1 = require("../../config/app.config");
const http_config_1 = require("../../config/http.config");
/**
 * Shared options applied to every limiter so that exceeding the configured
 * limit always results in an HTTP 429 (Too Many Requests) response and the
 * standardized `RateLimit-*` headers are sent.
 */
const baseOptions = {
    statusCode: http_config_1.HTTPSTATUS.TOO_MANY_REQUESTS,
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
exports.authLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, baseOptions), { windowMs: app_config_1.config.RATE_LIMIT.AUTH.WINDOW_MS, limit: app_config_1.config.RATE_LIMIT.AUTH.MAX }));
/**
 * Limiter for public write endpoints (contact, newsletter, comments,
 * reactions). Window and max are configurable via `RATE_LIMIT_WRITE_WINDOW_MS`
 * and `RATE_LIMIT_WRITE_MAX` env vars (defaults: 15 minutes / 30 requests).
 */
exports.writeLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, baseOptions), { windowMs: app_config_1.config.RATE_LIMIT.WRITE.WINDOW_MS, limit: app_config_1.config.RATE_LIMIT.WRITE.MAX }));
