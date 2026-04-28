import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
} from '../../cummon/zod/blog-post.schema';
import { BlogPostService } from './blogPost.service';

export class BlogPostController {
  private blogPostService: BlogPostService;

  constructor(blogPostService: BlogPostService) {
    this.blogPostService = blogPostService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = CreateBlogPostSchema.parse(req.body);
    const result = await this.blogPostService.create(parsed);

    return response.success(
      res,
      result,
      'Blog post created successfully',
      HTTPSTATUS.CREATED,
    );
  });

  public findAllAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { data, metadata } = await this.blogPostService.findAllAdmin({
      ...req.query,
    });

    return response.success(
      res,
      data,
      'Find all blog posts successfully',
      HTTPSTATUS.OK,
      metadata,
    );
  });

  public findAllPublic = asyncHandler(async (req: Request, res: Response) => {
    const { data, metadata } = await this.blogPostService.findAllPublic({
      ...req.query,
    });

    return response.success(
      res,
      data,
      'Find all blog posts successfully',
      HTTPSTATUS.OK,
      metadata,
    );
  });

  public getOne = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.blogPostService.findById(req.params.id);

    if (!result) {
      return response.error(res, 'Blog post not found', HTTPSTATUS.NOT_FOUND);
    }

    return response.success(
      res,
      result,
      'Get blog post successfully',
      HTTPSTATUS.OK,
    );
  });

  public getPublicBySlug = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.blogPostService.findBySlug(req.params.slug);

    if (!result || !result.isPublished) {
      return response.error(res, 'Blog post not found', HTTPSTATUS.NOT_FOUND);
    }

    return response.success(
      res,
      result,
      'Get blog post successfully',
      HTTPSTATUS.OK,
    );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = UpdateBlogPostSchema.parse({
      ...req.body,
      id: req.params.id,
    });

    const result = await this.blogPostService.update(parsed);

    return response.success(
      res,
      result,
      'Blog post updated successfully',
      HTTPSTATUS.OK,
    );
  });

  public destroy = asyncHandler(async (req: Request, res: Response) => {
    await this.blogPostService.delete(req.params.id);

    return response.success(
      res,
      null,
      'Blog post deleted successfully',
      HTTPSTATUS.OK,
    );
  });

  public incrementView = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.blogPostService.incrementView(req.params.id);

    return response.success(
      res,
      result,
      'Increment view successfully',
      HTTPSTATUS.OK,
    );
  });

  public incrementLike = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.blogPostService.incrementLike(req.params.id);

    return response.success(
      res,
      result,
      'Increment like successfully',
      HTTPSTATUS.OK,
    );
  });
}
