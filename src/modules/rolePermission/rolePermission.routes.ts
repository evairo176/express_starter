import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { rolePermissionController } from './rolePermission.module';
import { role } from '../../middlewares/role/role';
import { Role } from '../../cummon/enums/role.enum';

const rolePermissionRoutes = Router();

rolePermissionRoutes.post(
  '/',
  authenticateJWT,
  role(Role.ADMIN),
  rolePermissionController.setRolePermission,
);
rolePermissionRoutes.get(
  '/:roleCode',
  authenticateJWT,
  rolePermissionController.getRolePermissions,
);

export default rolePermissionRoutes;
