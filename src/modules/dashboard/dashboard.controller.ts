import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../middlewares';

export class DashboardController {
  static getAnalytics = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await DashboardService.getAnalytics();
      res.status(200).json({
        status: 'success',
        data,
      });
    },
  );
}

export const dashboardController = new DashboardController();
