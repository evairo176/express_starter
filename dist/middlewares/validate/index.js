"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.validate = exports.requireBody = exports.isEmptyBody = void 0;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
const catch_errors_1 = require("../../common/utils/catch-errors");
/**
 * Returns `true` when the incoming request body is effectively empty: either
 * missing entirely (`undefined`/`null`) or an object with no own enumerable
 * keys (the shape Express produces for an absent JSON/urlencoded body).
 */
const isEmptyBody = (body) => {
    if (body === undefined || body === null) {
        return true;
    }
    if (typeof body === 'object' && !Array.isArray(body)) {
        return Object.keys(body).length === 0;
    }
    return false;
};
exports.isEmptyBody = isEmptyBody;
/**
 * Express middleware that rejects write requests (POST/PUT/PATCH) that arrive
 * with no body at all. Responds with a 400 validation error before any
 * processing occurs (Req 12.6).
 */
const requireBody = (req, _res, next) => {
    if ((0, exports.isEmptyBody)(req.body)) {
        return next(new catch_errors_1.BadRequestException('Request body is required', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */));
    }
    return next();
};
exports.requireBody = requireBody;
/**
 * Builds an Express middleware that validates `req.body` against the provided
 * Zod schema before the request reaches its controller (Req 12.5, 12.6).
 *
 * On success the parsed (and coerced) value replaces `req.body` so downstream
 * handlers receive sanitized input. On failure the underlying `ZodError` is
 * forwarded to the central error handler, which formats it as a 400 response
 * with field-level details. An entirely absent body is treated as invalid and
 * also yields a 400 (Req 12.6).
 */
const validate = (schema) => (req, _res, next) => {
    if ((0, exports.isEmptyBody)(req.body)) {
        return next(new catch_errors_1.BadRequestException('Request body is required', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */));
    }
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(result.error);
    }
    req.body = result.data;
    return next();
};
exports.validate = validate;
