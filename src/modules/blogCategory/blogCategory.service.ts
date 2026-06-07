import slugify from 'slugify';
import {
  CreateBlogCategoryDTO,
  UpdateBlogCategoryDTO,
} from '../../common/zod/blog-category.schema';
import { db } from '../../database/database';

export class BlogCategoryService {
  public async create(data: CreateBlogCategoryDTO) {
    const slug =
      data.slug && data.slug.trim() !== ''
        ? data.slug
        : slugify(data.name, { lower: true, strict: true });

    return db.blogCategory.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  public async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortDir = 'desc',
    search,
  }: {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt';
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

    const total = await db.blogCategory.count({ where });

    const blogCategories = await db.blogCategory.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: blogCategories,
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
    return db.blogCategory.findUnique({
      where: { id },
    });
  }

  public async update(data: UpdateBlogCategoryDTO) {
    const slug =
      data.slug && data.slug.trim() !== ''
        ? data.slug
        : slugify(data.name, { lower: true, strict: true });

    return db.blogCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
      },
    });
  }

  public async delete(id: string) {
    return db.blogCategory.delete({ where: { id } });
  }
}
