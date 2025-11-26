import { Request } from 'express';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../../cummon/utils/catch-errors';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { db } from '../../database/database';
import { thirtyDaysFromNow } from '../../cummon/utils/date-time';
import { refreshTokenSignOptions, signJwtToken } from '../../cummon/utils/jwt';

export class MfaService {
  public async generateMFASetup(req: Request) {
    const user = req?.user;

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    if (user.userPreferences.enable2FA) {
      return {
        message: 'MFA already enabled',
      };
    }

    let secretKey = user.userPreferences.twoFactorSecret;

    if (!secretKey) {
      const secret = speakeasy.generateSecret({ name: 'Squeezy' });
      secretKey = secret.base32;
      user.userPreferences.twoFactorSecret = secretKey;

      await db.userPreferences.update({
        where: {
          id: user.userPreferences.id,
          userId: user.id,
        },
        data: {
          twoFactorSecret: secretKey,
        },
      });
    }

    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: `${user.name}`,
      issuer: 'squeezy.com',
      encoding: 'base32',
    });

    const qrImageUrl = await qrcode.toDataURL(url);

    return {
      message: 'Scan the QR code or use the setup key.',
      secret: secretKey,
      qrImageUrl,
    };
  }
  public async verifyMFASetup(req: Request, code: string, secretKey: string) {
    const user = req?.user;

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    if (user.userPreferences.enable2FA) {
      return {
        message: 'MFA is already enabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code, Please try again.');
    }

    user.userPreferences.enable2FA = true;

    await db.userPreferences.update({
      where: {
        id: user.userPreferences.id,
        userId: user.id,
      },
      data: {
        enable2FA: user.userPreferences.enable2FA,
      },
    });

    return {
      message: 'MFA setup completed successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async revokeMFASetup(req: Request) {
    const user = req?.user;

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    if (!user.userPreferences.enable2FA) {
      return {
        message: 'MFA is not enable',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    user.userPreferences.twoFactorSecret = null;
    user.userPreferences.enable2FA = false;

    await db.userPreferences.update({
      where: {
        id: user.userPreferences.id,
        userId: user.id,
      },
      data: {
        twoFactorSecret: user.userPreferences.twoFactorSecret,
        enable2FA: user.userPreferences.enable2FA,
      },
    });

    return {
      message: 'MFA revoke successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }
  public async verifyMFAForLogin(
    code: string,
    email: string,
    userAgent?: string,
  ) {
    const user = await db.user.findFirst({
      where: {
        email,
      },
      include: {
        userPreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !user?.userPreferences?.enable2FA &&
      !user?.userPreferences?.enable2FA
    ) {
      throw new UnauthorizedException('MFA not enable for this user');
    }
    const twoFactorSecret: string = user.userPreferences?.twoFactorSecret || '';
    const isValid = speakeasy.totp.verify({
      secret: twoFactorSecret,
      encoding: 'base32', // default encoding jika secret disimpan dalam base32
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code, Please try again');
    }

    const session = await db.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent ?? null,
        expiredAt: thirtyDaysFromNow(),
      },
    });

    const accessToken = signJwtToken({
      userId: user.id,
      sessionId: session.id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session.id,
      },
      refreshTokenSignOptions,
    );

    const showUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        userPreferences: true,
      },
    });

    return {
      user: showUser,
      accessToken,
      refreshToken,
    };
  }
}
