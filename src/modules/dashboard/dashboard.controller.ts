import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../middlewares';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';

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

  public getTicketSummary = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const [ticketSummary, categoryStats, picPerformance] = await Promise.all([
        this.dashboardService.getTicketSummary(),
        this.dashboardService.getCategoryStats(),
        this.dashboardService.getPicPerformance(),
      ]);
      return response.success(
        res,
        { ticketSummary, categoryStats, picPerformance },
        `Get ticket summary successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
