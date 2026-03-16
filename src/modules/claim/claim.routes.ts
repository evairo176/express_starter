import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { claimController } from './claim.module';
import { role } from '../../middlewares/role/role';
import { Role } from '../../cummon/enums/role.enum';

const claimRoutes = Router();

claimRoutes.get('/', authenticateJWT, claimController.findAll);

claimRoutes.post(
  '/',
  authenticateJWT,
  role(Role.USER),
  claimController.createClaim,
);

claimRoutes.get('/:id', authenticateJWT, claimController.findOne);

claimRoutes.patch(
  '/:id/submit',
  authenticateJWT,
  role(Role.USER),
  claimController.submitClaim,
);

claimRoutes.patch(
  '/:id/review',
  authenticateJWT,
  role(Role.VERIFIER),
  claimController.reviewClaim,
);
claimRoutes.patch(
  '/:id/approve',
  authenticateJWT,
  role(Role.APPROVER),
  claimController.approveClaim,
);
claimRoutes.patch(
  '/:id/reject',
  authenticateJWT,
  role(Role.APPROVER),
  claimController.rejectClaim,
);

export default claimRoutes;
