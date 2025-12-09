import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../cummon/utils/response';
import {
  CreatePortfolioCategorySchema,
  UpdatePortfolioCategorySchema,
} from '../../cummon/zod/portfolio-category.schema';

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

  public getOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.portfolioCategoryService.findById(
        req.params.id,
      );

      if (!result) {
        return response.error(res, 'Category not found', HTTPSTATUS.NOT_FOUND);
      }

      return response.success(
        res,
        result,
        `Get category successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public update = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdatePortfolioCategorySchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.portfolioCategoryService.update(parsed);

      return response.success(
        res,
        result,
        `Category updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.portfolioCategoryService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Category deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
