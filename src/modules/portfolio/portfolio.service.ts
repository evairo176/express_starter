import { ErrorCode } from '../../cummon/enums/error-code.enum';
import { BadRequestException } from '../../cummon/utils/catch-errors';
import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
} from '../../cummon/zod/portofolio.schema';
import { db } from '../../database/database';

export class PortfolioService {
  public async create(data: CreatePortfolioDTO) {
    // 1️⃣ Fail fast: cek slug
    const existing = await db.portfolio.findFirst({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `${existing.slug} - ${existing.title} slug already`,
        ErrorCode.SLUG_ALREADY_EXISTS,
      );
    }

    // 2️⃣ TRANSACTION RINGAN (inti saja)
    const portfolio = await db.portfolio.create({
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

    // 3️⃣ RELASI BERAT (DI LUAR TRANSACTION)
    await Promise.all([
      data.images?.length
        ? this.syncImages(portfolio.id, data.images)
        : Promise.resolve(),

      data.tagIds?.length
        ? this.syncTags(portfolio.id, data.tagIds)
        : Promise.resolve(),

      data.techIds?.length
        ? this.syncTechs(portfolio.id, data.techIds)
        : Promise.resolve(),
    ]);

    return portfolio;
  }
  public async update(data: UpdatePortfolioDTO) {
    // 1️⃣ TRANSACTION RINGAN (update inti)
    const updated = await db.portfolio.update({
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

    // 2️⃣ RELASI BERAT (DI LUAR TRANSACTION)
    await Promise.all([
      data.images?.length
        ? this.resetImages(updated.id, data.images)
        : Promise.resolve(),

      data.tagIds?.length
        ? this.resetTags(updated.id, data.tagIds)
        : Promise.resolve(),

      data.techIds?.length
        ? this.resetTechs(updated.id, data.techIds)
        : Promise.resolve(),
    ]);

    return updated;
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

  public async delete(id: string) {
    return db.portfolio.delete({
      where: { id },
    });
  }

  private async syncImages(
    portfolioId: string,
    images: { url: string; alt?: string; position?: number }[],
  ) {
    await db.portfolioImage.createMany({
      data: images.map((img) => ({
        portfolioId,
        url: img.url,
        alt: img.alt,
        position: img.position ?? 0,
      })),
    });
  }

  private async resetImages(
    portfolioId: string,
    images: { url: string; alt: string; position?: number }[],
  ) {
    await db.portfolioImage.deleteMany({ where: { portfolioId } });
    await this.syncImages(portfolioId, images);
  }

  private async syncTags(portfolioId: string, tags: string[]) {
    const records = await Promise.all(
      tags.map((name) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        return db.portfolioTag.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
        });
      }),
    );

    await db.portfolioTagOnPortfolio.createMany({
      data: records.map((tag) => ({
        portfolioId,
        tagId: tag.id,
      })),
    });
  }

  private async resetTags(portfolioId: string, tags: string[]) {
    await db.portfolioTagOnPortfolio.deleteMany({
      where: { portfolioId },
    });
    await this.syncTags(portfolioId, tags);
  }

  private async syncTechs(portfolioId: string, techs: string[]) {
    const records = await Promise.all(
      techs.map((name) =>
        db.techStack.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    await db.techStackOnPortfolio.createMany({
      data: records.map((tech) => ({
        portfolioId,
        techId: tech.id,
      })),
    });
  }

  private async resetTechs(portfolioId: string, techs: string[]) {
    await db.techStackOnPortfolio.deleteMany({
      where: { portfolioId },
    });
    await this.syncTechs(portfolioId, techs);
  }
}
