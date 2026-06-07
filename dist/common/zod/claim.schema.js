"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClaimSchema = exports.rejectClaimSchema = void 0;
const zod_1 = require("zod");
exports.rejectClaimSchema = zod_1.z.object({
    note: zod_1.z.string(),
});
exports.createClaimSchema = zod_1.z.object({
    name: zod_1.z.string(),
    desc: zod_1.z.string(),
});
