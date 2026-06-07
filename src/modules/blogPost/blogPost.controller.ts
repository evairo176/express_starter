import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import {
  AssignBlogTaxonomySchema,
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
} from '../../common/zod/blog-post.schema';
import { BlogPublicListQuerySchema } from '../../common/zod/blog-public-list.schema';
import { BlogPostService } from './blogPost.service';

// Cookie/header used to derive a stable visitor session id (Req 9.1).
const SESSION_COOKIE = 'sid';
const SESSION_HEADER = 'x-session-id';

export class BlogPostController {
  private blogPostService: BlogPostService;

  constructor(blogPostService: BlogPostService) {
    this.blogPostService = blogPostService;
  }

  /**
   * Derive the visitor session id from the `sid` cookie or `X-Session-Id`
   * header. Generates a new id (and sets the `sid` cookie) when absent so that
   * accurate, per-session view counting can work (Req 5b.1, 9.1).
   */
  private resolveSessionId(req: Request, res: Response): string {
    const fromCookie = (req as any).cookies?.[SESSION_COOKIE];
    const fromHeader = req.headers[SESSION_HEADER];

    let sessionId =
      (typeof fromCookie === 'string' && fromCookie) ||
      (typeof fromHeader === 'string' && fromHeader) ||
      (Array.isArray(fromHeader) ? fromHeader[0] : '');

    if (!sessionId) {
      sessionId = randomUUID();
      res.cookie(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }

    return sessionId;
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
    const parsed = BlogPublicListQuerySchema.parse({ ...req.query });

    const { data, metadata } = await this.blogPostService.findAllPublic({
      page: parsed.page,
      limit: parsed.limit,
      category: parsed.category,
      tag: parsed.tag,
      search: parsed.search,
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

  /**
   * Public blog detail by slug (Req 5.2, 5b.3, 6.1, 6.2, 6.3). Returns the post
   * with category, tags, reaction/view counts, reading time, and related posts.
   * Triggers accurate session-based view counting (Req 9.1).
   */
  public getPublicBySlug = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = this.resolveSessionId(req, res);

    const result = await this.blogPostService.findPublicDetailBySlug(
      req.params.slug,
      sessionId,
    );

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

  /**
   * Admin category/tag assignment (Req 3.2, 3.3, 3.7). Persists associations
   * and returns the updated post including category and tags.
   */
  public assignTaxonomy = asyncHandler(async (req: Request, res: Response) => {
    const parsed = AssignBlogTaxonomySchema.parse(req.body);
    const result = await this.blogPostService.assignTaxonomy(
      req.params.id,
      parsed,
    );

    return response.success(
      res,
      result,
      'Blog post taxonomy updated successfully',
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
