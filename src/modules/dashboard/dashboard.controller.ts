import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../middlewares';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }
  public getAnalytics = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.getAnalytics();
      res.status(200).json({
        status: 'success',
        data,
      });
    },
  );
}
