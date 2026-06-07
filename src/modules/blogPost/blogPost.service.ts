import { db } from '../../database/database';
import {
  AssignBlogTaxonomyDTO,
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
} from '../../common/zod/blog-post.schema';
import { BadRequestException } from '../../common/utils/catch-errors';
import { buildPaginationMetadata } from '../../common/utils/pagination';
import { calculateReadingTime } from '../../common/utils/reading-time';
import { cacheStore } from '../../common/cache/cache';

// 24h window for accurate session-based view counting (Req 5b.1, 5b.2).
const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Cache tag for all public blog responses (Req 14.3). */
const BLOG_CACHE_TAG = 'blog';

export class BlogPostService {
  /**
   * Create a blog post. Folds optional category/tag assignment into the create
   * flow (Req 3.1, 3.2, 3.3). A non-existent category throws a 400 (Req 3.7).
   */
  public async create(data: CreateBlogPostDTO) {
    const { categoryId, tagIds, ...rest } = data;

    if (categoryId) {
      await this.assertCategoryExists(categoryId);
    }

    const post = await db.blogPost.create({
      data: {
        ...rest,
        isPublished: data.isPublished ?? false,
        categoryId: categoryId ?? null,
      },
    });

    if (tagIds && tagIds.length) {
      await this.syncTags(post.id, tagIds);
    }

    // Invalidate cached public blog responses (Req 14.3).
    cacheStore.delByTag(BLOG_CACHE_TAG);

    return this.findById(post.id);
  }

  public async findAllAdmin({
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
    search,
    isPublished,
  }: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortDir?: 'asc' | 'desc';
    search?: string;
    isPublished?: string | boolean;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (typeof isPublished === 'boolean') {
      where.isPublished = isPublished;
    }

    if (typeof isPublished === 'string' && isPublished.trim() !== '') {
      if (isPublished === 'true') where.isPublished = true;
      if (isPublished === 'false') where.isPublished = false;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await db.blogPost.count({ where });

    const posts = await db.blogPost.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        sortBy,
        sortDir,
        search: search ?? null,
      },
    };
  }

  /**
   * Public blog list (Req 3.4, 3.5, 3.6). Returns only published posts and
   * supports filtering by category slug and tag slug, plus search and
   * pagination. An empty filter result returns an empty list with metadata.
   */
  public async findAllPublic({
    page = 1,
    limit = 10,
    category,
    tag,
    search,
  }: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Only published posts are ever returned (Req 3.4, 3.5).
    const where: any = {
      isPublished: true,
    };

    // Category filter by slug (Req 3.4).
    if (category && category.trim() !== '') {
      where.category = { slug: category };
    }

    // Tag filter by slug (Req 3.5).
    if (tag && tag.trim() !== '') {
      where.tags = { some: { tag: { slug: tag } } };
    }

    // Case-insensitive title/excerpt/slug search (Req 3.6).
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.blogPost.count({ where });

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: Number(skip),
      take: Number(limit),
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return {
      data: posts,
      metadata: buildPaginationMetadata(total, page, limit),
    };
  }

  public async findById(id: string) {
    return db.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  }

  public async findBySlug(slug: string) {
    return db.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  }

  /**
   * Public blog detail by slug (Req 5.2, 5b.3, 6.1, 6.2, 6.3).
   *
   * Returns the published post with its category, tags, reaction count, view
   * count, reading time, and up to 3 related published posts. When a
   * `sessionId` is supplied, the accurate view counter is triggered (Req 9.1)
   * so the returned view count reflects the recorded visit.
   */
  public async findPublicDetailBySlug(slug: string, sessionId?: string) {
    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!post || !post.isPublished) {
      return null;
    }

    // Trigger accurate, idempotent view counting for this session (Req 5b.1).
    if (sessionId) {
      await this.recordView(post.id, sessionId);
    }

    const [reactionCount, fresh, relatedPosts] = await Promise.all([
      // Reaction count queried directly against BlogReaction (Req 5.2).
      db.blogReaction.count({ where: { blogPostId: post.id } }),
      // Re-read totalViews so the response reflects the just-recorded view.
      db.blogPost.findUnique({
        where: { id: post.id },
        select: { totalViews: true },
      }),
      this.findRelatedPosts(post),
    ]);

    return {
      ...post,
      totalViews: fresh?.totalViews ?? post.totalViews,
      reactionCount,
      readingTime: calculateReadingTime(post.content),
      relatedPosts,
    };
  }

  public async update(data: UpdateBlogPostDTO) {
    const { id, categoryId, tagIds, ...rest } = data;

    if (categoryId) {
      await this.assertCategoryExists(categoryId);
    }

    await db.blogPost.update({
      where: { id },
      data: {
        ...rest,
        // Allow clearing the category by passing null explicitly.
        ...(categoryId !== undefined ? { categoryId } : {}),
      },
    });

    // Replace tag associations when tagIds is provided (Req 3.3).
    if (tagIds !== undefined) {
      await this.resetTags(id, tagIds);
    }

    // Invalidate cached public blog responses (Req 14.3).
    cacheStore.delByTag(BLOG_CACHE_TAG);

    return this.findById(id);
  }

  public async delete(id: string) {
    const deleted = await db.blogPost.delete({
      where: { id },
    });

    // Invalidate cached public blog responses (Req 14.3).
    cacheStore.delByTag(BLOG_CACHE_TAG);

    return deleted;
  }

  /**
   * Assign at most one category and zero or more tags to a post, persisting the
   * associations and returning the updated post including its category and tags
   * (Req 3.1, 3.2, 3.3). A non-existent category throws a 400 (Req 3.7).
   */
  public async assignTaxonomy(id: string, data: AssignBlogTaxonomyDTO) {
    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) {
      throw new BadRequestException('Blog post not found');
    }

    if (data.categoryId) {
      await this.assertCategoryExists(data.categoryId);
    }

    if (data.categoryId !== undefined) {
      await db.blogPost.update({
        where: { id },
        data: { categoryId: data.categoryId },
      });
    }

    if (data.tagIds !== undefined) {
      await this.resetTags(id, data.tagIds);
    }

    return this.findById(id);
  }

  /**
   * Accurate session-based view counting (Req 5b.1, 5b.2, 5b.3).
   *
   * Increments `totalViews` at most once per `(postId, sessionId)` within a 24h
   * window using the `BlogPostView` unique constraint. When an existing view
   * row is older than 24h, its timestamp is refreshed and the count increments;
   * within 24h nothing changes.
   */
  public async recordView(postId: string, sessionId: string) {
    const existing = await db.blogPostView.findUnique({
      where: { blogPostId_sessionId: { blogPostId: postId, sessionId } },
    });

    const now = Date.now();

    if (!existing) {
      // First view for this session: create the row and increment.
      try {
        await db.blogPostView.create({
          data: { blogPostId: postId, sessionId },
        });
      } catch {
        // Concurrent create for the same (postId, sessionId) lost the race;
        // the other request already counted this view, so do nothing.
        return this.getViewCount(postId);
      }
      await db.blogPost.update({
        where: { id: postId },
        data: { totalViews: { increment: 1 } },
      });
      return this.getViewCount(postId);
    }

    const age = now - new Date(existing.createdAt).getTime();
    if (age > VIEW_WINDOW_MS) {
      // The 24h window has elapsed: refresh the row and count again.
      await db.blogPostView.update({
        where: { blogPostId_sessionId: { blogPostId: postId, sessionId } },
        data: { createdAt: new Date() },
      });
      await db.blogPost.update({
        where: { id: postId },
        data: { totalViews: { increment: 1 } },
      });
    }

    // Within the window: leave the count unchanged (Req 5b.2).
    return this.getViewCount(postId);
  }

  /**
   * Up to 3 related published posts (Req 6.2, 6.3). Selected by shared category
   * or shared tags, excluding the requested post. Falls back to the most recent
   * published posts when the post has no category and no tags.
   */
  private async findRelatedPosts(post: {
    id: string;
    categoryId: string | null;
    tags?: { tagId: string }[];
  }) {
    const tagIds = (post.tags ?? []).map((t) => t.tagId);
    const hasCategory = Boolean(post.categoryId);
    const hasTags = tagIds.length > 0;

    if (!hasCategory && !hasTags) {
      // Fallback: most recent published posts, excluding the requested post.
      return db.blogPost.findMany({
        where: { isPublished: true, id: { not: post.id } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });
    }

    const or: any[] = [];
    if (hasCategory) {
      or.push({ categoryId: post.categoryId });
    }
    if (hasTags) {
      or.push({ tags: { some: { tagId: { in: tagIds } } } });
    }

    return db.blogPost.findMany({
      where: {
        isPublished: true,
        id: { not: post.id },
        OR: or,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  }

  private async getViewCount(postId: string) {
    const fresh = await db.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, totalViews: true },
    });
    return { id: postId, totalViews: fresh?.totalViews ?? 0 };
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await db.blogCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Blog category "${categoryId}" does not exist`,
      );
    }
  }

  private async syncTags(blogPostId: string, tagIds: string[]) {
    if (!tagIds.length) return;
    await db.blogTagOnBlogPost.createMany({
      data: tagIds.map((tagId) => ({ blogPostId, tagId })),
      skipDuplicates: true,
    });
  }

  private async resetTags(blogPostId: string, tagIds: string[]) {
    await db.blogTagOnBlogPost.deleteMany({ where: { blogPostId } });
    await this.syncTags(blogPostId, tagIds);
  }

  public async incrementView(id: string) {
    return db.blogPost.update({
      where: { id },
      data: {
        totalViews: {
          increment: 1,
        },
      },
      select: {
        id: true,
        totalViews: true,
      },
    });
  }

  public async incrementLike(id: string) {
    return db.blogPost.update({
      where: { id },
      data: {
        totalLikes: {
          increment: 1,
        },
      },
      select: {
        id: true,
        totalLikes: true,
      },
    });
  }
}
