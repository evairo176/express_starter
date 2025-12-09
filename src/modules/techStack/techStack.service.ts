import {
  CreateTechStackDTO,
  UpdateTechStackDTO,
} from '../../cummon/zod/tech-stack.schema';
import { db } from '../../database/database';

export class TechStackService {
  public async create(data: CreateTechStackDTO) {
    return db.techStack.create({ data });
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
    const total = await db.techStack.count({
      where,
    });

    // Query data
    const TechStacks = await db.techStack.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: TechStacks,
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
    return db.techStack.findUnique({
      where: { id },
    });
  }

  public async update(data: UpdateTechStackDTO) {
    return db.techStack.update({
      where: { id: data.id },
      data,
    });
  }
  public async delete(id: string) {
    return db.techStack.delete({ where: { id } });
  }
}
