import { db } from '../../database/database';
import {
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
} from '../../cummon/zod/blog-post.schema';

export class BlogPostService {
  public async create(data: CreateBlogPostDTO) {
    return db.blogPost.create({
      data: {
        ...data,
        isPublished: data.isPublished ?? false,
      },
    });
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

  public async findAllPublic({
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
    search,
  }: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

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

  public async findById(id: string) {
    return db.blogPost.findUnique({
      where: { id },
    });
  }

  public async findBySlug(slug: string) {
    return db.blogPost.findUnique({
      where: { slug },
    });
  }

  public async update(data: UpdateBlogPostDTO) {
    return db.blogPost.update({
      where: { id: data.id },
      data: {
        ...data,
      },
    });
  }

  public async delete(id: string) {
    return db.blogPost.delete({
      where: { id },
    });
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
