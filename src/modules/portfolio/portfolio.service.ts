import { ErrorCode } from '../../cummon/enums/error-code.enum';
import { BadRequestException } from '../../cummon/utils/catch-errors';
import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
} from '../../cummon/zod/portofolio.schema';
import { db } from '../../database/database';

export class PortfolioService {
  public async create(data: CreatePortfolioDTO) {
    const portfolio = await db.portfolio.findFirst({
      where: {
        slug: data?.slug,
      },
    });

    if (portfolio) {
      throw new BadRequestException(
        `${portfolio?.slug} - ${portfolio.title} slug already`,
        ErrorCode.SLUG_ALREADY_EXISTS,
      );
    }

    return db.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          shortDesc: data.shortDesc,
          categoryId: data.categoryId,
          liveUrl: data.liveUrl,
          repoUrl: data.repoUrl,
          featured: data.featured,
          isPublished: data.isPublished,
        },
      });

      if (data.images?.length) {
        await tx.portfolioImage.createMany({
          data: data.images.map((i) => ({
            portfolioId: portfolio.id,
            url: i.url,
            alt: i.alt,
            position: i.position ?? 0,
          })),
        });
      }

      if (data.tagIds?.length) {
        await tx.portfolioTagOnPortfolio.createMany({
          data: data.tagIds.map((tagId) => ({
            portfolioId: portfolio.id,
            tagId,
          })),
        });
      }

      if (data.techIds?.length) {
        await tx.techStackOnPortfolio.createMany({
          data: data.techIds.map((techId) => ({
            portfolioId: portfolio.id,
            techId,
          })),
        });
      }

      return portfolio;
    });
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
    sortBy?: 'updatedAt'; // sesuaikan field
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
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Hitung total (without pagination)
    const total = await db.portfolio.count({
      where,
    });

    // Query data
    const Portfolios = await db.portfolio.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
      include: {
        category: true,
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
        techStacks: {
          include: {
            tech: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: Portfolios,
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
    return db.portfolio.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        tags: { include: { tag: true } },
        techStacks: { include: { tech: true } },
      },
    });
  }

  public async update(data: UpdatePortfolioDTO) {
    return db.$transaction(async (tx) => {
      const updated = await tx.portfolio.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          shortDesc: data.shortDesc,
          categoryId: data.categoryId,
          isPublished: data.isPublished,
          featured: data.featured,
          liveUrl: data.liveUrl,
          repoUrl: data.repoUrl,
        },
      });

      // Reset images
      if (data.images) {
        await tx.portfolioImage.deleteMany({
          where: { portfolioId: data.id },
        });

        await tx.portfolioImage.createMany({
          data: data.images.map((i) => ({
            portfolioId: data.id,
            url: i.url,
            alt: i.alt,
            position: i.position ?? 0,
          })),
        });
      }

      // Reset tags
      if (data.tagIds) {
        await tx.portfolioTagOnPortfolio.deleteMany({
          where: { portfolioId: data.id },
        });

        await tx.portfolioTagOnPortfolio.createMany({
          data: data.tagIds.map((tagId) => ({
            portfolioId: data.id,
            tagId,
          })),
        });
      }

      // Reset tech stacks
      if (data.techIds) {
        await tx.techStackOnPortfolio.deleteMany({
          where: { portfolioId: data.id },
        });

        await tx.techStackOnPortfolio.createMany({
          data: data.techIds.map((techId) => ({
            portfolioId: data.id,
            techId,
          })),
        });
      }

      return updated;
    });
  }
  public async delete(id: string) {
    return db.portfolio.delete({
      where: { id },
    });
  }
}
