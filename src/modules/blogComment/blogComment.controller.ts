import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import {
  CreateBlogCommentSchema,
  AdminBlogCommentListQuerySchema,
} from '../../common/zod/blog-comment.schema';
import { BlogCommentService } from './blogComment.service';

export class BlogCommentController {
  private blogCommentService: BlogCommentService;

  constructor(blogCommentService: BlogCommentService) {
    this.blogCommentService = blogCommentService;
  }

  /**
   * Public: submit a comment on a published post identified by slug.
   * Validates name/email/body (invalid email or out-of-range body -> 400 via
   * Zod) and persists the comment, which starts unapproved when moderation is
   * enabled (Req 4.1, 4.3, 4.4, 4.5, 4.7).
   */
  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateBlogCommentSchema.parse(req.body);

      const result = await this.blogCommentService.create(
        req.params.slug,
        parsed,
      );

      if (!result) {
        return response.error(res, 'Blog post not found', HTTPSTATUS.NOT_FOUND);
      }

      return response.success(
        res,
        result,
        'Comment submitted successfully',
        HTTPSTATUS.CREATED,
      );
    },
  );

  /**
   * Public: list approved comments for a post (newest first) (Req 4.2).
   */
  public listApproved = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.blogCommentService.listApprovedBySlug(
        req.params.slug,
      );

      if (!result) {
        return response.error(res, 'Blog post not found', HTTPSTATUS.NOT_FOUND);
      }

      return response.success(
        res,
        result,
        'Get comments successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * Admin: list ALL comments (including pending/unapproved) with pagination and
   * an optional `status` filter (pending | approved | all, default all), newest
   * first. Each comment includes its parent post's id/title/slug.
   */
  public listAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { page, limit, status } = AdminBlogCommentListQuerySchema.parse({
        ...req.query,
      });

      const { data, metadata } = await this.blogCommentService.listAllForAdmin({
        page,
        limit,
        status,
      });

      return response.success(
        res,
        data,
        'Get comments successfully',
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  /**
   * Admin: pending/approved/total comment counts for the moderation dashboard.
   */
  public count = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const result = await this.blogCommentService.countByStatus();

      return response.success(
        res,
        result,
        'Get comment counts successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * Admin: approve a comment by id (Req 4.7).
   */
  public approve = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.blogCommentService.approve(req.params.id);

      return response.success(
        res,
        result,
        'Comment approved successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * Admin: delete a comment by id. Responds with success only after the
   * deletion resolves (Req 4.6).
   */
  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.blogCommentService.delete(req.params.id);

      return response.success(
        res,
        null,
        'Comment deleted successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
