import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

export { dashboardService, dashboardController };
