import { db as prisma } from '../../database/database';

export class DashboardService {
  public async getAnalytics() {
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

  public async getTicketSummary() {
    const total = await prisma.ticket.count();

    const done = await prisma.ticket.count({
      where: { status: 'DONE' },
    });

    const pending = await prisma.ticket.count({
      where: { status: { not: 'DONE' } },
    });

    const over48 = await prisma.ticket.count({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
        status: { not: 'DONE' },
      },
    });

    return {
      total,
      done,
      pending,
      over48,
    };
  }

  // public async getCategoryStats() {
  //   return prisma.ticket.groupBy({
  //     by: ['category'],
  //     _count: true,
  //   });
  // }

  public async getPicPerformance() {
    return prisma.ticket.groupBy({
      by: ['picId'],
      where: {
        status: 'DONE',
      },
      _sum: {
        durationMin: true,
      },
      _count: true,
    });
  }
}
