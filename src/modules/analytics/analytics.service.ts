import { RecordVisitDTO } from '../../common/zod/analytics.schema';
import { db } from '../../database/database';

export class AnalyticsService {
  /**
   * Record a visit event with the given path and a timestamp (Req 11.1).
   */
  public async recordVisit(data: RecordVisitDTO) {
    return db.visitEvent.create({
      data: {
        path: data.path,
      },
    });
  }

  /**
   * Return the analytics summary (Req 11.2):
   * - total visit count
   * - visit count for the last 30 days
   * - top 5 most-viewed blog posts (by totalViews)
   * - top 5 most-viewed projects (by PortfolioView counts)
   */
  public async getSummary() {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalVisits, last30DaysVisits, topPosts, topProjectGroups] =
      await Promise.all([
        db.visitEvent.count(),
        db.visitEvent.count({
          where: {
            createdAt: {
              gte: last30Days,
            },
          },
        }),
        db.blogPost.findMany({
          orderBy: {
            totalViews: 'desc',
          },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            totalViews: true,
          },
        }),
        db.portfolioView.groupBy({
          by: ['portfolioId'],
          _count: {
            portfolioId: true,
          },
          orderBy: {
            _count: {
              portfolioId: 'desc',
            },
          },
          take: 5,
        }),
      ]);

    // Resolve portfolio details for the top project ids while preserving order.
    const topProjectIds = topProjectGroups.map((group) => group.portfolioId);
    const projects = await db.portfolio.findMany({
      where: {
        id: {
          in: topProjectIds,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });
    const projectById = new Map(projects.map((p) => [p.id, p]));

    const topProjects = topProjectGroups.map((group) => {
      const project = projectById.get(group.portfolioId);
      return {
        id: group.portfolioId,
        title: project?.title ?? null,
        slug: project?.slug ?? null,
        views: group._count.portfolioId,
      };
    });

    return {
      totalVisits,
      last30DaysVisits,
      topPosts,
      topProjects,
    };
  }

  /**
   * Return aggregated counts of projects grouped by category, tag, and tech
   * stack (Req 11.3), computed via Prisma groupBy/count over the relation
   * tables.
   */
  public async getAggregations() {
    const [categoryGroups, tagGroups, techGroups] = await Promise.all([
      db.portfolio.groupBy({
        by: ['categoryId'],
        _count: {
          _all: true,
        },
      }),
      db.portfolioTagOnPortfolio.groupBy({
        by: ['tagId'],
        _count: {
          tagId: true,
        },
      }),
      db.techStackOnPortfolio.groupBy({
        by: ['techId'],
        _count: {
          techId: true,
        },
      }),
    ]);

    // Resolve human-readable names for each grouping.
    const categoryIds = categoryGroups
      .map((group) => group.categoryId)
      .filter((id): id is string => Boolean(id));
    const tagIds = tagGroups.map((group) => group.tagId);
    const techIds = techGroups.map((group) => group.techId);

    const [categories, tags, techs] = await Promise.all([
      db.portfolioCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true },
      }),
      db.portfolioTag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true, name: true, slug: true },
      }),
      db.techStack.findMany({
        where: { id: { in: techIds } },
        select: { id: true, name: true },
      }),
    ]);

    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const tagById = new Map(tags.map((t) => [t.id, t]));
    const techById = new Map(techs.map((t) => [t.id, t]));

    const byCategory = categoryGroups.map((group) => {
      const category = group.categoryId
        ? categoryById.get(group.categoryId)
        : undefined;
      return {
        categoryId: group.categoryId,
        name: category?.name ?? null,
        slug: category?.slug ?? null,
        count: group._count._all,
      };
    });

    const byTag = tagGroups.map((group) => {
      const tag = tagById.get(group.tagId);
      return {
        tagId: group.tagId,
        name: tag?.name ?? null,
        slug: tag?.slug ?? null,
        count: group._count.tagId,
      };
    });

    const byTech = techGroups.map((group) => {
      const tech = techById.get(group.techId);
      return {
        techId: group.techId,
        name: tech?.name ?? null,
        count: group._count.techId,
      };
    });

    return {
      byCategory,
      byTag,
      byTech,
    };
  }
}
