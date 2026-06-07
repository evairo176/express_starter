import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, ZodTypeAny } from 'zod';
import { BadRequestException } from '../../common/utils/catch-errors';
import { ErrorCode } from '../../common/enums/error-code.enum';

/**
 * Returns `true` when the incoming request body is effectively empty: either
 * missing entirely (`undefined`/`null`) or an object with no own enumerable
 * keys (the shape Express produces for an absent JSON/urlencoded body).
 */
export const isEmptyBody = (body: unknown): boolean => {
  if (body === undefined || body === null) {
    return true;
  }

  if (typeof body === 'object' && !Array.isArray(body)) {
    return Object.keys(body as Record<string, unknown>).length === 0;
  }

  return false;
};

/**
 * Express middleware that rejects write requests (POST/PUT/PATCH) that arrive
 * with no body at all. Responds with a 400 validation error before any
 * processing occurs (Req 12.6).
 */
export const requireBody: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (isEmptyBody(req.body)) {
    return next(
      new BadRequestException(
        'Request body is required',
        ErrorCode.VALIDATION_ERROR,
      ),
    );
  }

  return next();
};

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
export const validate =
  <T extends ZodTypeAny>(schema: T): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (isEmptyBody(req.body)) {
      return next(
        new BadRequestException(
          'Request body is required',
          ErrorCode.VALIDATION_ERROR,
        ),
      );
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(result.error);
    }

    req.body = result.data;
    return next();
  };

export { z };
