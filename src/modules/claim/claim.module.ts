import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';

const claimService = new ClaimService();
const claimController = new ClaimController(claimService);

export { claimService, claimController };
