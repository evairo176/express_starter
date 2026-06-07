import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import {
  CreatePortfolioSchema,
  UpdatePortfolioSchema,
} from '../../common/zod/portofolio.schema';
import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
} from '../../common/zod/blog-post.schema';
import { PublishToggleSchema } from '../../common/zod/publish-toggle.schema';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  public getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.dashboardService.getAnalytics();
    res.status(200).json({
      status: 'success',
      data,
    });
  });

  // --- Portfolio project admin CRUD (Req 10.1, 10.4) ------------------------

  /**
   * Admin project list with both published and unpublished items plus
   * Pagination_Metadata (Req 10.4).
   */
  public listProjects = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.dashboardService.listProjects({
        ...req.query,
      });

      return response.success(
        res,
        data,
        'Find all portfolio projects successfully',
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public getProject = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.dashboardService.getProject(req.params.id);

      return response.success(
        res,
        result,
        'Get portfolio project successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public createProject = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreatePortfolioSchema.parse(req.body);
      const result = await this.dashboardService.createProject(parsed);

      return response.success(
        res,
        result,
        `${result?.title} new portfolio created`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public updateProject = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdatePortfolioSchema.parse({
        ...req.body,
        id: req.params.id,
      });
      const result = await this.dashboardService.updateProject(parsed);

      return response.success(
        res,
        result,
        'Portfolio project updated successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public deleteProject = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.dashboardService.deleteProject(req.params.id);

      return response.success(
        res,
        null,
        'Portfolio project deleted successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * Toggle (or set) a project's published state and return the updated record
   * (Req 10.6).
   */
  public toggleProjectPublished = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { isPublished } = PublishToggleSchema.parse(req.body ?? {});
      const result = await this.dashboardService.toggleProjectPublished(
        req.params.id,
        isPublished,
      );

      return response.success(
        res,
        result,
        'Portfolio project published state updated successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  // --- Blog post admin CRUD (Req 10.2, 10.5) --------------------------------

  /**
   * Admin blog list with both published and unpublished items plus
   * Pagination_Metadata (Req 10.5).
   */
  public listPosts = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.dashboardService.listPosts({
        ...req.query,
      });

      return response.success(
        res,
        data,
        'Find all blog posts successfully',
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public getPost = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.dashboardService.getPost(req.params.id);

      return response.success(
        res,
        result,
        'Get blog post successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public createPost = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateBlogPostSchema.parse(req.body);
      const result = await this.dashboardService.createPost(parsed);

      return response.success(
        res,
        result,
        'Blog post created successfully',
        HTTPSTATUS.CREATED,
      );
    },
  );

  public updatePost = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdateBlogPostSchema.parse({
        ...req.body,
        id: req.params.id,
      });
      const result = await this.dashboardService.updatePost(parsed);

      return response.success(
        res,
        result,
        'Blog post updated successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public deletePost = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.dashboardService.deletePost(req.params.id);

      return response.success(
        res,
        null,
        'Blog post deleted successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * Toggle (or set) a post's published state and return the updated record
   * (Req 10.6).
   */
  public togglePostPublished = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { isPublished } = PublishToggleSchema.parse(req.body ?? {});
      const result = await this.dashboardService.togglePostPublished(
        req.params.id,
        isPublished,
      );

      return response.success(
        res,
        result,
        'Blog post published state updated successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
