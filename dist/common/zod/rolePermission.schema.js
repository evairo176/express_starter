"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetRolePermissionSchema = void 0;
const zod_1 = require("zod");
exports.SetRolePermissionSchema = zod_1.z.object({
    roleCode: zod_1.z.string(),
    rolePermissions: zod_1.z.array(zod_1.z.object({
        menuCode: zod_1.z.string(),
        permissions: zod_1.z.array(zod_1.z.string()),
    })),
});
