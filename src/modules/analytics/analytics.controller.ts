import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';
import { RecordVisitSchema } from '../../common/zod/analytics.schema';

import { HTTPSTATUS } from '../../config/http.config';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  public recordVisit = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = RecordVisitSchema.parse(req.body);
      const result = await this.analyticsService.recordVisit(parsed);

      return response.success(
        res,
        result,
        'Visit recorded successfully',
        HTTPSTATUS.CREATED,
      );
    },
  );

  public summary = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const result = await this.analyticsService.getSummary();

      return response.success(
        res,
        result,
        'Analytics summary retrieved successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public aggregations = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const result = await this.analyticsService.getAggregations();

      return response.success(
        res,
        result,
        'Analytics aggregations retrieved successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
