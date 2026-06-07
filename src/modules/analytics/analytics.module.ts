import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

const analyticsService = new AnalyticsService();
const analyticsController = new AnalyticsController(analyticsService);

export { analyticsService, analyticsController };
