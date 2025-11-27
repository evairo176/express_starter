import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import { PortfolioService } from './portfolio.service';
import response from '../../cummon/utils/response';
import { CreatePortfolioSchema } from '../../cummon/zod/portofolio.schema';
import { HTTPSTATUS } from '../../config/http.config';

export class PortfolioController {
  private portfolioService: PortfolioService;

  constructor(portfolioService: PortfolioService) {
    this.portfolioService = portfolioService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreatePortfolioSchema.parse(req.body);
      const result = await this.portfolioService.create(parsed);

      return response.success(
        res,
        result,
        `${result?.title} new portfolio created`,
        201,
      );
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.portfolioService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all portolio successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
