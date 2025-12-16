import { db as prisma } from '../../database/database';

export class DashboardService {
  static async getAnalytics() {
    // 1. Top Tags
    const topTags = await prisma.portfolioTag.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // 2. Top Tech Stacks
    const topTechStacks = await prisma.techStack.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // 3. Favorite Categories
    const topCategories = await prisma.portfolioCategory.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: {
        portfolios: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      topTags: topTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.portfolios,
      })),
      topTechStacks: topTechStacks.map((tech) => ({
        id: tech.id,
        name: tech.name,
        count: tech._count.portfolios,
      })),
      topCategories: topCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.portfolios,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
