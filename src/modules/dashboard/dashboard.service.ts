import { db as prisma, db } from '../../database/database';
import { PortfolioService } from '../portfolio/portfolio.service';
import { BlogPostService } from '../blogPost/blogPost.service';
import { NotFoundException } from '../../common/utils/catch-errors';
import { ErrorCode } from '../../common/enums/error-code.enum';
import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
} from '../../common/zod/portofolio.schema';
import {
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
} from '../../common/zod/blog-post.schema';

/**
 * The `dashboard` module aggregates authenticated admin CRUD over portfolio
 * projects and blog posts (Req 10). It delegates the existing domain logic to
 * `PortfolioService` and `BlogPostService` rather than duplicating it, and adds
 * the admin-only publish-toggle operations (Req 10.6).
 */
export class DashboardService {
  private portfolioService: PortfolioService;
  private blogPostService: BlogPostService;

  constructor(
    portfolioService: PortfolioService = new PortfolioService(),
    blogPostService: BlogPostService = new BlogPostService(),
  ) {
    this.portfolioService = portfolioService;
    this.blogPostService = blogPostService;
  }

  // --- Portfolio admin CRUD (Req 10.1, 10.4) --------------------------------

  /**
   * Admin project list: returns BOTH published and unpublished projects with
   * Pagination_Metadata (Req 10.4). Delegates to `PortfolioService.findAll`,
   * which applies no `isPublished` filter.
   */
  public async listProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    return this.portfolioService.findAll(params);
  }

  public async getProject(id: string) {
    const project = await this.portfolioService.findById(id);
    if (!project) {
      throw new NotFoundException(
        `Portfolio with id "${id}" not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }
    return project;
  }

  public async createProject(data: CreatePortfolioDTO) {
    return this.portfolioService.create(data);
  }

  public async updateProject(data: UpdatePortfolioDTO) {
    return this.portfolioService.update(data);
  }

  public async deleteProject(id: string) {
    return this.portfolioService.delete(id);
  }

  /**
   * Toggle (or set) a project's published state, persist it, and return the
   * updated record (Req 10.6). When `isPublished` is omitted, the current
   * state is flipped.
   */
  public async toggleProjectPublished(id: string, isPublished?: boolean) {
    const existing = await db.portfolio.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Portfolio with id "${id}" not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const nextState =
      typeof isPublished === 'boolean' ? isPublished : !existing.isPublished;

    return db.portfolio.update({
      where: { id },
      data: { isPublished: nextState },
    });
  }

  // --- Blog post admin CRUD (Req 10.2, 10.5) --------------------------------

  /**
   * Admin blog list: returns BOTH published and unpublished posts with
   * Pagination_Metadata (Req 10.5). Delegates to `BlogPostService.findAllAdmin`.
   */
  public async listPosts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortDir?: 'asc' | 'desc';
    isPublished?: string | boolean;
  }) {
    return this.blogPostService.findAllAdmin(params);
  }

  public async getPost(id: string) {
    const post = await this.blogPostService.findById(id);
    if (!post) {
      throw new NotFoundException(
        `Blog post with id "${id}" not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }
    return post;
  }

  public async createPost(data: CreateBlogPostDTO) {
    return this.blogPostService.create(data);
  }

  public async updatePost(data: UpdateBlogPostDTO) {
    return this.blogPostService.update(data);
  }

  public async deletePost(id: string) {
    return this.blogPostService.delete(id);
  }

  /**
   * Toggle (or set) a post's published state, persist it, and return the
   * updated record (Req 10.6). When `isPublished` is omitted, the current
   * state is flipped.
   */
  public async togglePostPublished(id: string, isPublished?: boolean) {
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Blog post with id "${id}" not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const nextState =
      typeof isPublished === 'boolean' ? isPublished : !existing.isPublished;

    await db.blogPost.update({
      where: { id },
      data: { isPublished: nextState },
    });

    return this.blogPostService.findById(id);
  }

  public async getAnalytics() {
    // 1. Top Tags
    const topTags = await prisma.portfolioTag.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // 2. Top Tech Stacks
    const topTechStacks = await prisma.techStack.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // 3. Favorite Categories
    const topCategories = await prisma.portfolioCategory.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      topTags: topTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.portfolios,
      })),
      topTechStacks: topTechStacks.map((tech) => ({
        id: tech.id,
        name: tech.name,
        count: tech._count.portfolios,
      })),
      topCategories: topCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.portfolios,
      })),
    };
  }
}
