import { CookieOptions, Response } from 'express';
import { config } from '../../config/app.config';
import { calculateExpirationDate } from './date-time';

type CookiePayloadType = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const AUTH_PATH = `/`;

// Environment-aware defaults
const isProd = process.env.NODE_ENV === 'production';

const defaults: CookieOptions = {
  httpOnly: true,
  secure: isProd, // secure only in production (requires https)
  // For cross-site cookies on production, sameSite should be 'none' and secure true.
  // In dev (http) use 'lax' to allow sending cookies on same-site requests.
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  // domain: undefined, // set if you need a specific domain (e.g. '.example.com')
};
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.REFRESH_EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: AUTH_PATH,
  };
};

export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: AUTH_PATH,
  };
};

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
}: CookiePayloadType): Response => {
  return res
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};

export const clearAuthenticationCookies = (res: Response): Response =>
  res
    .clearCookie('accessToken', {
      path: AUTH_PATH,
    })
    .clearCookie('refreshToken', {
      path: AUTH_PATH,
    });
