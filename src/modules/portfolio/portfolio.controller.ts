import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import { PortfolioService } from './portfolio.service';
import response from '../../common/utils/response';
import {
  CreatePortfolioSchema,
  UpdatePortfolioSchema,
} from '../../common/zod/portofolio.schema';
import { PortfolioPublicListQuerySchema } from '../../common/zod/portfolio-public-list.schema';
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

  // Public endpoints (no auth) ------------------------------------------------

  /**
   * Public project list with filters, search, featured, and pagination
   * (Req 2.1–2.8). Query is validated by `PortfolioPublicListQuerySchema`;
   * `tags`/`tech` arrive as CSV strings and are split on comma.
   */
  public findPublic = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = PortfolioPublicListQuerySchema.parse({ ...req.query });

      const splitCsv = (value?: string): string[] | undefined =>
        value
          ? value
              .split(',')
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
          : undefined;

      const { data, metadata } = await this.portfolioService.findPublic({
        page: parsed.page,
        limit: parsed.limit,
        category: parsed.category,
        tags: splitCsv(parsed.tags),
        tech: splitCsv(parsed.tech),
        search: parsed.search,
        featured: parsed.featured,
      });

      return response.success(
        res,
        data,
        `Find public portfolios successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  /**
   * Public project detail by slug (Req 1.2–1.6). The service throws a 404 when
   * the slug is missing or the project is not published.
   */
  public findPublicBySlug = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.portfolioService.findPublishedBySlug(
        req.params.slug,
      );

      return response.success(
        res,
        result,
        `Get public portfolio successfully`,
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
