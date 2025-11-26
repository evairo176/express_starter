import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { HTTPSTATUS } from '../../config/http.config';
import { AppError } from '../../cummon/utils/app-error';
import { z } from 'zod';
import {
  AUTH_PATH,
  clearAuthenticationCookies,
} from '../../cummon/utils/cookies';
import response from '../../cummon/utils/response';

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return response.error(
    res,
    'Validation failed',
    HTTPSTATUS.BAD_REQUEST,
    errors,
  );
};

export const errorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction, // <-- penting!
) => {
  console.error(`Error occurred on PATH: ${req?.path}`, error);

  if (req.path === AUTH_PATH) {
    clearAuthenticationCookies(res);
  }

  if (error instanceof SyntaxError) {
    return response.error(
      res,
      `Invalid JSON format, Please check your request body`,
      HTTPSTATUS.BAD_REQUEST,
    );
  }
  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }
  if (error instanceof AppError) {
    return response.error(res, error?.message, error?.statusCode, {
      errorCode: error?.errorCode,
    });
  }

  return response.error(
    res,
    'Internal Server Error',
    HTTPSTATUS.INTERNAL_SERVER_ERROR,
    {
      error: error?.message || 'Unknown error occurred',
    },
  );
};
