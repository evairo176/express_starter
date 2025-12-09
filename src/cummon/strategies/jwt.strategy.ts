import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptionsWithRequest,
} from 'passport-jwt';
import passport, { PassportStatic } from 'passport';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../utils/catch-errors';
import { config } from '../../config/app.config';
import { userService } from '../../modules/user/user.module';
import { db } from '../../database/database';

interface JwtPayload {
  userId: string;
  sessionId: string;
}

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) return auth.substring(7);

      return req.cookies?.accessToken ?? null;
    },
  ]),
  secretOrKey: config.JWT.SECRET,
  audience: ['user'],
  algorithms: ['HS256'],
  passReqToCallback: true,
};

export const setupJwtStrategy = (passport: PassportStatic) => {
  passport.use(
    new JwtStrategy(options, async (req, payload: JwtPayload, done) => {
      try {
        // 1. Cek user masih ada
        const user = await userService.findUserById(payload.userId);
        if (!user) {
          return done(null, false);
        }

        // 2. Cek session di database
        const session = await db.session.findFirst({
          where: {
            id: payload.sessionId,
          },
        });

        // ⚠️ === DISINI kamu tempatkan kode validasi session ===
        if (!session) {
          return done(
            new UnauthorizedException('Session expired or invalid'),
            false,
          );
        }

        // 2b. Kalau kamu mau tambahkan expired check:
        if (session.expiredAt < new Date()) {
          return done(new UnauthorizedException('Session expired'), false);
        }

        if (session.isRevoke === true) {
          return done(
            new UnauthorizedException('Session has been revoked'),
            false,
          );
        }

        // Kalau session valid → inject sessionId ke req
        req.sessionId = payload.sessionId;

        // 3. Return user untuk melanjutkan
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }),
  );
};
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(
          new UnauthorizedException(info?.message || 'Unauthorized access'),
        );
      }
      req.user = user;
      return next();
    },
  )(req, res, next);
};
