import { RoleController } from './role.controller';
import { RoleService } from './role.service';

const roleService = new RoleService();
const roleController = new RoleController(roleService);

export { roleService, roleController };
