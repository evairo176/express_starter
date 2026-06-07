import { db } from '../../database/database';
import { NotFoundException } from '../../common/utils/catch-errors';
import { CreateBlogReactionDTO } from '../../common/zod/blog-reaction.schema';

export class BlogReactionService {
  /**
   * Add a reaction to a published post resolved by slug.
   * - 404 if the post does not exist (Req 5.3).
   * - Inserts a BlogReaction row then returns the updated reaction count (Req 5.1, 5.2).
   */
  public async create(slug: string, data: CreateBlogReactionDTO) {
    const post = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await db.blogReaction.create({
      data: {
        blogPostId: post.id,
        type: data.type,
      },
    });

    const count = await db.blogReaction.count({
      where: { blogPostId: post.id },
    });

    return { count };
  }
}
