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

  public async getCategoryStats() {
    return prisma.ticket.groupBy({
      by: ['requestType'],
      _count: true,
    });
  }

  public async getPicPerformance() {
    const users = await prisma.user.findMany({
      where: {
        role: 'PIC_IT',
      },
      select: {
        id: true,
        name: true,

        assignedTickets: {
          select: {
            status: true,
            durationMin: true,
            createdAt: true,
            finishedAt: true,
          },
        },
      },
    });

    const result = users.map((user) => {
      const tickets = user.assignedTickets;

      const doneTickets = tickets.filter((t) => t.status === 'DONE');

      const unfinishedTickets = tickets.filter((t) => t.status !== 'DONE');

      const totalMinutes = doneTickets.reduce(
        (acc, t) => acc + (t.durationMin || 0),
        0,
      );

      const totalJobs = doneTickets.length;

      const avgMinutesPerJob =
        totalJobs > 0 ? Math.round(totalMinutes / totalJobs) : 0;

      const over48Hours = tickets.filter((t) => {
        if (!t.createdAt) return false;

        const end = t.finishedAt ?? new Date();

        const diffHours =
          (end.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);

        return diffHours > 48;
      }).length;

      return {
        pic: user.name,
        totalJobs,
        totalMinutes,
        avgMinutesPerJob,
        over48Hours,
        unfinishedJobs: unfinishedTickets.length,
      };
    });

    return result;
  }
}
