"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthenticationCookies = exports.setAuthenticationCookies = exports.getAccessTokenCookieOptions = exports.getRefreshTokenCookieOptions = exports.AUTH_PATH = void 0;
const app_config_1 = require("../../config/app.config");
const date_time_1 = require("./date-time");
exports.AUTH_PATH = `/`;
// Environment-aware defaults
const isProd = process.env.NODE_ENV === 'production';
const defaults = {
    httpOnly: true,
    secure: isProd, // secure only in production (requires https)
    // For cross-site cookies on production, sameSite should be 'none' and secure true.
    // In dev (http) use 'lax' to allow sending cookies on same-site requests.
    sameSite: isProd ? 'none' : 'lax',
    // domain: undefined, // set if you need a specific domain (e.g. '.example.com')
};
const getRefreshTokenCookieOptions = (opt) => {
    var _a;
    const expiresIn = app_config_1.config.JWT.REFRESH_EXPIRES_IN;
    const expires = (_a = opt === null || opt === void 0 ? void 0 : opt.expires) !== null && _a !== void 0 ? _a : (0, date_time_1.calculateExpirationDate)(expiresIn);
    return Object.assign(Object.assign({}, defaults), { expires, path: exports.AUTH_PATH });
};
exports.getRefreshTokenCookieOptions = getRefreshTokenCookieOptions;
const getAccessTokenCookieOptions = () => {
    const expiresIn = app_config_1.config.JWT.EXPIRES_IN;
    const expires = (0, date_time_1.calculateExpirationDate)(expiresIn);
    return Object.assign(Object.assign({}, defaults), { expires, path: exports.AUTH_PATH });
};
exports.getAccessTokenCookieOptions = getAccessTokenCookieOptions;
const setAuthenticationCookies = ({ res, accessToken, refreshToken, }) => {
    return res
        .cookie('accessToken', accessToken, (0, exports.getAccessTokenCookieOptions)())
        .cookie('refreshToken', refreshToken, (0, exports.getRefreshTokenCookieOptions)());
};
exports.setAuthenticationCookies = setAuthenticationCookies;
const clearAuthenticationCookies = (res) => res
    .clearCookie('accessToken', {
    path: exports.AUTH_PATH,
})
    .clearCookie('refreshToken', {
    path: exports.AUTH_PATH,
});
exports.clearAuthenticationCookies = clearAuthenticationCookies;
