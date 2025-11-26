import { Request, Response } from 'express';
import { HTTPSTATUS } from '../../config/http.config';
import { asyncHandler } from '../../middlewares';
import { MfaService } from './mfa.service';
import {
  verifyMFAForLoginSchema,
  verifyMfaSchema,
} from '../../cummon/validators/mfa.validator';
import { setAuthenticationCookies } from '../../cummon/utils/cookies';
import response from '../../cummon/utils/response';

export class MfaController {
  private mfaService: MfaService;

  constructor(mfaService: MfaService) {
    this.mfaService = mfaService;
  }

  public generateMFASetup = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { secret, qrImageUrl, message } =
        await this.mfaService.generateMFASetup(req);

      return response.success(
        res,
        {
          secret,
          qrImageUrl,
        },
        message,
        HTTPSTATUS.OK,
      );
    },
  );

  public verifyMFASetup = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code, secretKey } = verifyMfaSchema.parse({
        ...req?.body,
      });

      const { message, userPreferences } = await this.mfaService.verifyMFASetup(
        req,
        code,
        secretKey,
      );

      return response.success(res, userPreferences, message, HTTPSTATUS.OK);
    },
  );

  public revokeMFASetup = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { message, userPreferences } =
        await this.mfaService.revokeMFASetup(req);

      return response.success(res, userPreferences, message, HTTPSTATUS.OK);
    },
  );
  public verifyMFAForLogin = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code, email, userAgent } = verifyMFAForLoginSchema.parse({
        ...req?.body,
        userAgent: req.headers['user-agent'],
      });
      const { user, accessToken, refreshToken } =
        await this.mfaService.verifyMFAForLogin(code, email, userAgent);

      return setAuthenticationCookies({ res, accessToken, refreshToken })
        .status(HTTPSTATUS.OK)
        .json({
          message: 'Verified & login successfully',
          user,
        });
    },
  );
}
