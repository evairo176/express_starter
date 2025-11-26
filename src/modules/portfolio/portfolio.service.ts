import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
} from '../../cummon/interface/auth.interface';
import { db } from '../../database/database';

export class PortfolioService {
  public async create(data: CreatePortfolioDTO) {
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

  public async findAll() {
    return db.portfolio.findMany({
      include: {
        category: true,
        images: true,
        tags: { include: { tag: true } },
        techStacks: { include: { tech: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
