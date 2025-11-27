import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import { PortfolioService } from './portfolio.service';
import response from '../../cummon/utils/response';
import { CreatePortfolioSchema } from '../../cummon/zod/portofolio.validator';

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
        `Retrieved all portfolio successfully`,
        201,
      );
    },
  );
}
