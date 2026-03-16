import { RolePermissionController } from './rolePermission.controller';
import { RolePermissionService } from './rolePermission.service';

const rolePermissionService = new RolePermissionService();
const rolePermissionController = new RolePermissionController(
  rolePermissionService,
);

export { rolePermissionService, rolePermissionController };
