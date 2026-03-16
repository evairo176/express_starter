"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.role = void 0;
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const role = (...allowedRoles) => (req, res, next) => {
    var _a, _b;
    if (!req.user) {
        throw new catch_errors_1.BadRequestException('Unauthorized');
    }
    if (!allowedRoles.includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
        throw new catch_errors_1.BadRequestException('Role not authorized to access this resource, your role is ' +
            ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role));
    }
    next();
};
exports.role = role;
