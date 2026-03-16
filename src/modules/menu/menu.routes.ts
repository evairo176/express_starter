import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { menuController } from './menu.module';

const menuRoutes = Router();

menuRoutes.get('/', authenticateJWT, menuController.findAll);
menuRoutes.get('/', authenticateJWT, menuController.findAll);

export default menuRoutes;
