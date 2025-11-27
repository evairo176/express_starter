import { TechStackController } from './techStack.controller';
import { TechStackService } from './techStack.service';

const techStackService = new TechStackService();
const techStackController = new TechStackController(techStackService);

export { techStackService, techStackController };
