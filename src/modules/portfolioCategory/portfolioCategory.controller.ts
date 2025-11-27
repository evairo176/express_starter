import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../cummon/utils/response';
import { CreatePortfolioCategorySchema } from '../../cummon/zod/portfolio-category.schema';

import { HTTPSTATUS } from '../../config/http.config';
import { PortfolioCategoryService } from './portfolioCategory.service';

export class PortfolioCategoryController {
  private portfolioCategoryService: PortfolioCategoryService;

  constructor(portfolioCategoryService: PortfolioCategoryService) {
    this.portfolioCategoryService = portfolioCategoryService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreatePortfolioCategorySchema.parse(req.body);
      const result = await this.portfolioCategoryService.create(parsed);

      return response.success(
        res,
        result,
        `${result?.name} (${result?.name} created)`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.portfolioCategoryService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all category successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
