"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordVisitSchema = void 0;
const zod_1 = require("zod");
exports.RecordVisitSchema = zod_1.z.object({
    path: zod_1.z.string().min(1),
});
