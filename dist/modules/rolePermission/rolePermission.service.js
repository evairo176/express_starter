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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionService = void 0;
const database_1 = require("../../database/database");
class RolePermissionService {
    setRolePermission(roleCode, rolePermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * Delete existing permissions
             */
            yield database_1.db.rolePermission.deleteMany({
                where: {
                    roleCode,
                },
            });
            /**
             * Transform payload
             */
            const data = rolePermissions.flatMap((rp) => rp.permissions.map((permissionCode) => ({
                roleCode,
                menuCode: rp.menuCode,
                permissionCode,
            })));
            /**
             * Insert new permissions
             */
            if (data.length > 0) {
                yield database_1.db.rolePermission.createMany({
                    data,
                    skipDuplicates: true,
                });
            }
        });
    }
    getRolePermissions(roleCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.rolePermission.findMany({
                where: {
                    roleCode,
                },
                include: {
                    permission: true,
                },
            });
        });
    }
}
exports.RolePermissionService = RolePermissionService;
