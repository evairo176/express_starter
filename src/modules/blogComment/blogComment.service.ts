import { CreateBlogCommentDTO } from '../../common/zod/blog-comment.schema';
import { config } from '../../config/app.config';
import { db } from '../../database/database';

export class BlogCommentService {
  /**
   * Resolve a published-or-not post by slug and return its id, or null when
   * no post matches the slug.
   */
  private async resolvePostIdBySlug(slug: string): Promise<string | null> {
    const post = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    return post?.id ?? null;
  }

  /**
   * Create a comment for the post identified by `slug`.
   *
   * Comments begin in an unapproved state (`isApproved = false`) when comment
   * moderation is enabled (configurable via the `COMMENT_MODERATION` env var,
   * defaulting to enabled). The created comment is persisted and returned
   * (Req 4.1, 4.7).
   *
   * Returns `null` when no post matches the slug so the controller can respond
   * with a 404.
   */
  public async create(slug: string, data: CreateBlogCommentDTO) {
    const blogPostId = await this.resolvePostIdBySlug(slug);

    if (!blogPostId) {
      return null;
    }

    // When moderation is enabled, comments start unapproved and are hidden
    // from public reads until an admin approves them. When disabled, comments
    // are immediately approved/visible.
    const isApproved = !config.COMMENT_MODERATION;

    return db.blogComment.create({
      data: {
        blogPostId,
        name: data.name,
        email: data.email,
        body: data.body,
        isApproved,
      },
    });
  }

  /**
   * Return the APPROVED comments for the post identified by `slug`, ordered by
   * creation time descending (newest first) (Req 4.2, 4.7).
   *
   * Returns `null` when no post matches the slug so the controller can respond
   * with a 404.
   */
  public async listApprovedBySlug(slug: string) {
    const blogPostId = await this.resolvePostIdBySlug(slug);

    if (!blogPostId) {
      return null;
    }

    return db.blogComment.findMany({
      where: {
        blogPostId,
        isApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Admin: list ALL comments (including pending/unapproved) with pagination and
   * an optional status filter, newest first. Includes the parent post's
   * id/title/slug so the admin UI can show which post each comment belongs to.
   *
   * - status `pending`  -> isApproved: false
   * - status `approved` -> isApproved: true
   * - status `all`      -> no isApproved filter (default)
   */
  public async listAllForAdmin({
    page = 1,
    limit = 10,
    status = 'all',
  }: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'all';
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'pending') {
      where.isApproved = false;
    } else if (status === 'approved') {
      where.isApproved = true;
    }

    const total = await db.blogComment.count({ where });

    const comments = await db.blogComment.findMany({
      where,
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: comments,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        status,
      },
    };
  }

  /**
   * Admin: pending/approved/total comment counts for the moderation dashboard.
   */
  public async countByStatus() {
    const [pending, approved, total] = await Promise.all([
      db.blogComment.count({ where: { isApproved: false } }),
      db.blogComment.count({ where: { isApproved: true } }),
      db.blogComment.count(),
    ]);

    return { pending, approved, total };
  }

  /**
   * Approve an existing comment by id (Req 4.7).
   */
  public async approve(id: string) {
    return db.blogComment.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  /**
   * Delete an existing comment by id. The promise resolves only after the
   * deletion succeeds, so the controller awaits this before responding with
   * success (Req 4.6).
   */
  public async delete(id: string) {
    return db.blogComment.delete({
      where: { id },
    });
  }
}
