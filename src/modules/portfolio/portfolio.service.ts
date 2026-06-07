import { ErrorCode } from '../../common/enums/error-code.enum';
import {
  BadRequestException,
  NotFoundException,
} from '../../common/utils/catch-errors';
import { buildPaginationMetadata } from '../../common/utils/pagination';
import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
} from '../../common/zod/portofolio.schema';
import { PortfolioPublicListQueryDTO } from '../../common/zod/portfolio-public-list.schema';
import { db } from '../../database/database';
import { cacheStore } from '../../common/cache/cache';

/** Cache tag for all public portfolio responses (Req 14.3). */
const PORTFOLIO_CACHE_TAG = 'portfolio';

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
        problem: data.problem,
        solution: data.solution,
        results: data.results,
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

    // Invalidate cached public portfolio responses (Req 14.3).
    cacheStore.delByTag(PORTFOLIO_CACHE_TAG);

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
        problem: data.problem,
        solution: data.solution,
        results: data.results,
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

    // Invalidate cached public portfolio responses (Req 14.3).
    cacheStore.delByTag(PORTFOLIO_CACHE_TAG);

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

  /**
   * Public project detail by slug (Req 1.2, 1.3, 1.4, 1.5, 1.6).
   *
   * Returns problem/solution/results, the image gallery ordered by `position`
   * ascending, liveUrl, repoUrl, category, tags, and tech stack (name + icon).
   * Throws `NotFoundException` (404) when the slug does not exist or the
   * project is not published.
   */
  public async findPublishedBySlug(slug: string) {
    const portfolio = await db.portfolio.findUnique({
      where: { slug },
      include: {
        category: true,
        // Gallery ordered by ascending position (Req 1.6).
        images: { orderBy: { position: 'asc' } },
        tags: { include: { tag: true } },
        // Tech stack entries include name + icon (Req 1.3).
        techStacks: { include: { tech: true } },
      },
    });

    // 404 when slug missing OR the project is not published (Req 1.4, 1.5).
    if (!portfolio || !portfolio.isPublished) {
      throw new NotFoundException(
        `Portfolio with slug "${slug}" not found`,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    return portfolio;
  }

  /**
   * Public project list with filters, search, featured, and pagination
   * (Req 2.1–2.8).
   *
   * - Always constrains `isPublished = true` (Req 2.5).
   * - Category filter matches `category.slug` (Req 2.1).
   * - Tag and tech filters use AND semantics: every requested slug must be
   *   present (Req 2.2, 2.3).
   * - Search matches `title` OR `shortDesc`, case-insensitively (Req 2.4).
   * - `featured=true` constrains `featured = true` (Req 2.6).
   * - Returns `Pagination_Metadata` in every response (Req 2.7).
   */
  public async findPublic(params: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    tech?: string[];
    search?: string;
    featured?: boolean;
    sort?: 'newest' | 'oldest' | 'recently-updated' | 'featured';
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    // Only published projects are ever returned (Req 2.5).
    const where: any = {
      isPublished: true,
    };

    // Category filter by slug (Req 2.1).
    if (params.category) {
      where.category = { slug: params.category };
    }

    // Featured filter (Req 2.6).
    if (params.featured === true) {
      where.featured = true;
    }

    // Case-insensitive title/shortDesc search (Req 2.4).
    if (params.search && params.search.trim() !== '') {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { shortDesc: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // AND-semantics tag filter: every requested tag slug must be present (Req 2.2).
    if (params.tags && params.tags.length) {
      where.AND = [
        ...(where.AND ?? []),
        ...params.tags.map((slug) => ({
          tags: { some: { tag: { slug } } },
        })),
      ];
    }

    // AND-semantics tech filter: every requested tech must be present (Req 2.3).
    // NOTE: TechStack has no `slug` field in the schema; its unique identifier
    // is `name`, so tech filters match by `name`.
    if (params.tech && params.tech.length) {
      where.AND = [
        ...(where.AND ?? []),
        ...params.tech.map((name) => ({
          techStacks: { some: { tech: { name } } },
        })),
      ];
    }

    const total = await db.portfolio.count({ where });

    // Map the requested sort to a Prisma orderBy. Defaults to newest-first.
    // `featured` lists featured projects first, then newest within each group.
    const orderBy = ((): any => {
      switch (params.sort) {
        case 'oldest':
          return { createdAt: 'asc' };
        case 'recently-updated':
          return { updatedAt: 'desc' };
        case 'featured':
          return [{ featured: 'desc' }, { createdAt: 'desc' }];
        case 'newest':
        default:
          return { createdAt: 'desc' };
      }
    })();

    const data = await db.portfolio.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        tags: { include: { tag: true } },
        techStacks: { include: { tech: true } },
      },
    });

    return {
      data,
      metadata: buildPaginationMetadata(total, page, limit),
    };
  }

  public async delete(id: string) {
    const deleted = await db.portfolio.delete({
      where: { id },
    });

    // Invalidate cached public portfolio responses (Req 14.3).
    cacheStore.delByTag(PORTFOLIO_CACHE_TAG);

    return deleted;
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
      tags.map(async (value) => {
        // The admin form submits existing tag IDs; only fall back to
        // create-by-name when the value is not an existing tag id.
        const byId = await db.portfolioTag.findUnique({ where: { id: value } });
        if (byId) return byId;

        const name = value;
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
      skipDuplicates: true,
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
      techs.map(async (value) => {
        // The admin form submits existing tech-stack IDs; only fall back to
        // create-by-name when the value is not an existing tech id.
        const byId = await db.techStack.findUnique({ where: { id: value } });
        if (byId) return byId;

        return db.techStack.upsert({
          where: { name: value },
          update: {},
          create: { name: value },
        });
      }),
    );

    await db.techStackOnPortfolio.createMany({
      data: records.map((tech) => ({
        portfolioId,
        techId: tech.id,
      })),
      skipDuplicates: true,
    });
  }

  private async resetTechs(portfolioId: string, techs: string[]) {
    await db.techStackOnPortfolio.deleteMany({
      where: { portfolioId },
    });
    await this.syncTechs(portfolioId, techs);
  }
}
