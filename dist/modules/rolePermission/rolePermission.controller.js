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
exports.RolePermissionController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
const rolePermission_schema_1 = require("../../cummon/zod/rolePermission.schema");
class RolePermissionController {
    constructor(rolePermissionService) {
        this.setRolePermission = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = rolePermission_schema_1.SetRolePermissionSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: parsed.error.format(),
                });
            }
            const { roleCode, rolePermissions } = parsed.data;
            yield this.rolePermissionService.setRolePermission(roleCode, rolePermissions);
            return response_1.default.success(res, null, 'Set role permission successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.getRolePermissions = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { roleCode } = req.params;
            const permissions = yield this.rolePermissionService.getRolePermissions(roleCode);
            return response_1.default.success(res, permissions, 'Get role permissions successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.rolePermissionService = rolePermissionService;
    }
}
exports.RolePermissionController = RolePermissionController;
