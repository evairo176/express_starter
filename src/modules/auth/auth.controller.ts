import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import { AuthService } from './auth.service';
import { HTTPSTATUS } from '../../config/http.config';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationEmailSchema,
} from '../../cummon/zod/auth.schema';
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from '../../cummon/utils/cookies';
import {
  NotFoundException,
  UnauthorizedException,
} from '../../cummon/utils/catch-errors';
import { MfaService } from '../mfa/mfa.service';
import response from '../../cummon/utils/response';

export class AuthController {
  private authService: AuthService;
  private mfaService: MfaService;

  constructor(authService: AuthService, mfaService: MfaService) {
    this.authService = authService;
    this.mfaService = mfaService;
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req?.body,
      });

      const result = await this.authService.register(body);
      return res.status(HTTPSTATUS.CREATED).json({
        message: 'User registered successfully',
        data: result.user,
      });
    },
  );

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // header otomatis:
      const ua = req.headers['user-agent'];
      // header custom jika frontend mengirim:
      const xUa = req.headers['x-user-agent'];
      // atau fallback ke body:
      const bodyUa = req.body?.userAgent;
      const userAgent = xUa || ua || bodyUa || 'unknown';

      const body = loginSchema.parse({
        ...req?.body,
        userAgent,
      });

      const code = req?.body?.code;
      const existingUser = await this.authService.getProfile(body?.email);

      if (existingUser.mfaRequired && !code) {
        return response.success(
          res,
          {
            mfaRequired: existingUser.mfaRequired,
            user: null,
          },
          'Verify MFA authentication',
          HTTPSTATUS.OK,
        );
      }

      if (existingUser.mfaRequired && code) {
        const { user, accessToken, refreshToken } =
          await this.mfaService.verifyMFAForLogin(
            code,
            existingUser.user.email,
            userAgent,
          );

        setAuthenticationCookies({
          res,
          accessToken,
          refreshToken,
        });

        return response.success(
          res,
          {
            user,
            accessToken,
            mfaRequired: existingUser.mfaRequired,
          },
          'User login with 2fa successfully',
          HTTPSTATUS.OK,
        );
      }
      const result = await this.authService.login(body);

      setAuthenticationCookies({
        res,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      return response.success(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          mfaRequired: result.mfaRequired,
        },
        'User login successfully auooo',
        HTTPSTATUS.OK,
      );
    },
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;

      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token');
      }

      const { accessToken, newRefreshToken, user, refreshTokenExpiresAt } =
        await this.authService.refreshToken(refreshToken);

      if (newRefreshToken) {
        if (refreshTokenExpiresAt) {
          res.cookie(
            'refreshToken',
            newRefreshToken,
            getRefreshTokenCookieOptions({ expires: refreshTokenExpiresAt }),
          );
        } else {
          res.cookie(
            'refreshToken',
            newRefreshToken,
            getRefreshTokenCookieOptions(),
          );
        }
      }
      res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());

      return response.success(
        res,
        {
          user,
          accessToken,
        },
        'Refresh access token successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code } = verificationEmailSchema.parse({
        ...req?.body,
      });

      await this.authService.verifyEmail(code);

      return response.success(
        res,
        null,
        'Email verified successfully',
        HTTPSTATUS.OK,
      );
    },
  );
  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req?.body.email);

      await this.authService.forgotPassword(email);

      return response.success(
        res,
        null,
        'Password reset email sent',
        HTTPSTATUS.OK,
      );
    },
  );
  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = resetPasswordSchema.parse(req?.body);

      await this.authService.resetPassword(body);

      clearAuthenticationCookies(res);

      return response.success(
        res,
        null,
        'Reset password successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.sessionId;

      if (!sessionId) {
        throw new NotFoundException('Session is invalid');
      }

      await this.authService.logout(sessionId);
      clearAuthenticationCookies(res);

      return response.success(
        res,
        null,
        'User logout successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
