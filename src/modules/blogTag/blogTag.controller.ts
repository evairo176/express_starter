import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';
import {
  CreateBlogTagSchema,
  UpdateBlogTagSchema,
} from '../../common/zod/blog-tag.schema';

import { HTTPSTATUS } from '../../config/http.config';
import { BlogTagService } from './blogTag.service';

export class BlogTagController {
  private blogTagService: BlogTagService;

  constructor(blogTagService: BlogTagService) {
    this.blogTagService = blogTagService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateBlogTagSchema.parse(req.body);
      const result = await this.blogTagService.create(parsed);

      return response.success(
        res,
        result,
        `${result?.name} created`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.blogTagService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all blog tag successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public getOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.blogTagService.findById(req.params.id);

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
      const parsed = UpdateBlogTagSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.blogTagService.update(parsed);

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
      await this.blogTagService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Tag deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
