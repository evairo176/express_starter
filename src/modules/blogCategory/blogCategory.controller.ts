import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';
import {
  CreateBlogCategorySchema,
  UpdateBlogCategorySchema,
} from '../../common/zod/blog-category.schema';

import { HTTPSTATUS } from '../../config/http.config';
import { BlogCategoryService } from './blogCategory.service';

export class BlogCategoryController {
  private blogCategoryService: BlogCategoryService;

  constructor(blogCategoryService: BlogCategoryService) {
    this.blogCategoryService = blogCategoryService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateBlogCategorySchema.parse(req.body);
      const result = await this.blogCategoryService.create(parsed);

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
      const { data, metadata } = await this.blogCategoryService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all blog category successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public getOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.blogCategoryService.findById(req.params.id);

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
      const parsed = UpdateBlogCategorySchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.blogCategoryService.update(parsed);

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
      await this.blogCategoryService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Category deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
