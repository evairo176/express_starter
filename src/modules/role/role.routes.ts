import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { roleController } from './role.module';

const roleRoutes = Router();

roleRoutes.get('/', authenticateJWT, roleController.findAll);
roleRoutes.get('/:roleCode', authenticateJWT, roleController.findOne);

export default roleRoutes;
