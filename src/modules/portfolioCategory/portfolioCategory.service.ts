import {
  CreatePortfolioCategoryDTO,
  UpdatePortfolioCategoryDTO,
} from '../../cummon/zod/portfolio-category.schema';
import { db } from '../../database/database';

export class PortfolioCategoryService {
  public async create(data: CreatePortfolioCategoryDTO) {
    return db.portfolioCategory.create({ data });
  }

  public async findAll({
    userId,
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt'; // sesuaikan field
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Filter dasar
    const where: any = {
      // userId,
      // expiredAt: {
      //   gt: new Date(),
      // },
    };

    // Opsional: search pada userAgent
    if (search && search.trim() !== '') {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Hitung total (without pagination)
    const total = await db.portfolioCategory.count({
      where,
    });

    // Query data
    const portfolioCategorys = await db.portfolioCategory.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: portfolioCategorys,
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
    return db.portfolioCategory.findUnique({
      where: { id },
    });
  }

  public async update(data: UpdatePortfolioCategoryDTO) {
    return db.portfolioCategory.update({
      where: { id: data.id },
      data,
    });
  }
  public async delete(id: string) {
    return db.portfolioCategory.delete({ where: { id } });
  }
}
