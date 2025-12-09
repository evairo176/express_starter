import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import { PortfolioService } from './portfolio.service';
import response from '../../cummon/utils/response';
import {
  CreatePortfolioSchema,
  UpdatePortfolioSchema,
} from '../../cummon/zod/portofolio.schema';
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

  public getOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.portfolioService.findById(req.params.id);

      if (!result) {
        return response.error(res, 'Portfolio not found', HTTPSTATUS.NOT_FOUND);
      }

      return response.success(
        res,
        result,
        `Get portfolio successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public update = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdatePortfolioSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.portfolioService.update(parsed);

      return response.success(
        res,
        result,
        `Portfolio updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.portfolioService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Portfolio deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
