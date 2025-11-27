import {
  CreatePortfolioTagDTO,
  UpdatePortfolioTagDTO,
} from '../../cummon/zod/portfolio-tag.schema';
import { db } from '../../database/database';

export class PortfolioTagService {
  public async create(data: CreatePortfolioTagDTO) {
    return db.portfolioTag.create({ data });
  }

  public async findAll({
    userId,
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortDir = 'asc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name'; // sesuaikan field
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
    const total = await db.portfolioTag.count({
      where,
    });

    // Query data
    const PortfolioTags = await db.portfolioTag.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: PortfolioTags,
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
    return db.portfolioTag.findUnique({ where: { id } });
  }

  public async update(data: UpdatePortfolioTagDTO) {
    return db.portfolioTag.update({
      where: { id: data.id },
      data,
    });
  }
  public async delete(id: string) {
    return db.portfolioTag.delete({ where: { id } });
  }
}
