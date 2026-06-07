import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';

const achievementService = new AchievementService();
const achievementController = new AchievementController(achievementService);

export { achievementService, achievementController };
