"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTechStackSchema = exports.CreateTechStackSchema = void 0;
const zod_1 = require("zod");
exports.CreateTechStackSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    icon: zod_1.z.string().optional().nullable(),
});
exports.UpdateTechStackSchema = exports.CreateTechStackSchema.extend({
    id: zod_1.z.string().uuid(),
});
