"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = exports.setupJwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = __importDefault(require("passport"));
const catch_errors_1 = require("../utils/catch-errors");
const app_config_1 = require("../../config/app.config");
const user_module_1 = require("../../modules/user/user.module");
const database_1 = require("../../database/database");
const options = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
        (req) => {
            var _a, _b;
            const auth = req.headers.authorization;
            if (auth && auth.startsWith('Bearer '))
                return auth.substring(7);
            return (_b = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) !== null && _b !== void 0 ? _b : null;
        },
    ]),
    secretOrKey: app_config_1.config.JWT.SECRET,
    audience: ['user'],
    algorithms: ['HS256'],
    passReqToCallback: true,
};
const setupJwtStrategy = (passport) => {
    passport.use(new passport_jwt_1.Strategy(options, (req, payload, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // 1. Cek user masih ada
            const user = yield user_module_1.userService.findUserById(payload.userId);
            if (!user) {
                return done(null, false);
            }
            // 2. Cek session di database
            const session = yield database_1.db.session.findFirst({
                where: {
                    id: payload.sessionId,
                },
            });
            // ⚠️ === DISINI kamu tempatkan kode validasi session ===
            if (!session) {
                return done(new catch_errors_1.UnauthorizedException('Session expired or invalid'), false);
            }
            // 2b. Kalau kamu mau tambahkan expired check:
            if (session.expiredAt < new Date()) {
                return done(new catch_errors_1.UnauthorizedException('Session expired'), false);
            }
            if (session.isRevoke === true) {
                return done(new catch_errors_1.UnauthorizedException('Session has been revoked'), false);
            }
            // Kalau session valid → inject sessionId ke req
            req.sessionId = payload.sessionId;
            // 3. Return user untuk melanjutkan
            return done(null, user);
        }
        catch (error) {
            return done(error, false);
        }
    })));
};
exports.setupJwtStrategy = setupJwtStrategy;
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new catch_errors_1.UnauthorizedException((info === null || info === void 0 ? void 0 : info.message) || 'Unauthorized access'));
        }
        req.user = user;
        return next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
