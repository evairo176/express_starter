import slugify from 'slugify';
import {
  CreateBlogTagDTO,
  UpdateBlogTagDTO,
} from '../../common/zod/blog-tag.schema';
import { db } from '../../database/database';

export class BlogTagService {
  public async create(data: CreateBlogTagDTO) {
    const slug =
      data.slug && data.slug.trim() !== ''
        ? data.slug
        : slugify(data.name, { lower: true, strict: true });

    return db.blogTag.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  public async findAll({
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortDir = 'asc',
    search,
  }: {
    page?: number;
    limit?: number;
    sortBy?: 'name';
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const total = await db.blogTag.count({ where });

    const blogTags = await db.blogTag.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: blogTags,
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
    return db.blogTag.findUnique({
      where: { id },
    });
  }

  public async update(data: UpdateBlogTagDTO) {
    const slug =
      data.slug && data.slug.trim() !== ''
        ? data.slug
        : slugify(data.name, { lower: true, strict: true });

    return db.blogTag.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
      },
    });
  }

  public async delete(id: string) {
    return db.blogTag.delete({ where: { id } });
  }
}
