import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../cummon/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { PortfolioTagService } from './portfolioTag.service';
import {
  CreatePortfolioTagSchema,
  UpdatePortfolioTagSchema,
} from '../../cummon/zod/portfolio-tag.schema';

export class PortfolioTagController {
  private PortfolioTagService: PortfolioTagService;

  constructor(PortfolioTagService: PortfolioTagService) {
    this.PortfolioTagService = PortfolioTagService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreatePortfolioTagSchema.parse(req.body);
      const result = await this.PortfolioTagService.create(parsed);

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
      const { data, metadata } = await this.PortfolioTagService.findAll({
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
      const result = await this.PortfolioTagService.findById(req.params.id);

      if (!result) {
        return response.error(res, 'Tag not found', HTTPSTATUS.NOT_FOUND);
      }

      return response.success(
        res,
        result,
        `Get tag successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public update = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdatePortfolioTagSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.PortfolioTagService.update(parsed);

      return response.success(
        res,
        result,
        `Tag updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.PortfolioTagService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Tag deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
