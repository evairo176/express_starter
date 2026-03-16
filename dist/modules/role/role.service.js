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
exports.RoleService = void 0;
const database_1 = require("../../database/database");
class RoleService {
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            // Filter dasar
            const where = {
            // userId,
            // expiredAt: {
            //   gt: new Date(),
            // },
            };
            // Opsional: search pada userAgent
            if (search && search.trim() !== '') {
                where.name = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            // Hitung total (without pagination)
            const total = yield database_1.db.role.count({
                where,
            });
            // Query data
            const roles = yield database_1.db.role.findMany({
                where,
                orderBy: {
                    name: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
                include: {
                    rolePermissions: true,
                },
            });
            const totalPages = Math.ceil(total / limit);
            const formattedRoles = roles.map((role) => {
                const permissionMap = {};
                role.rolePermissions.forEach((rp) => {
                    if (!permissionMap[rp.menuCode]) {
                        permissionMap[rp.menuCode] = [];
                    }
                    permissionMap[rp.menuCode].push(rp.permissionCode);
                });
                const permissions = Object.entries(permissionMap).map(([menuCode, permissions]) => ({
                    menuCode,
                    permissions,
                }));
                return Object.assign(Object.assign({}, role), { rolePermissions: permissions });
            });
            return {
                data: formattedRoles,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    sortBy,
                    sortDir,
                    search: search !== null && search !== void 0 ? search : null,
                },
            };
        });
    }
    findOne(roleCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const role = yield database_1.db.role.findUnique({
                where: {
                    code: roleCode,
                },
                include: {
                    rolePermissions: true,
                },
            });
            if (!role) {
                return null;
            }
            const permissionMap = {};
            role.rolePermissions.forEach((rp) => {
                if (!permissionMap[rp.menuCode]) {
                    permissionMap[rp.menuCode] = [];
                }
                permissionMap[rp.menuCode].push(rp.permissionCode);
            });
            const rolePermissions = Object.entries(permissionMap).map(([menuCode, permissions]) => ({
                menuCode,
                permissions,
            }));
            return {
                code: role.code,
                name: role.name,
                rolePermissions,
            };
        });
    }
}
exports.RoleService = RoleService;
