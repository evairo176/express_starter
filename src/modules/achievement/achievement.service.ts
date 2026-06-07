import {
  CreateAchievementDTO,
  UpdateAchievementDTO,
} from '../../common/zod/achievement.schema';
import { db } from '../../database/database';

export class AchievementService {
  /**
   * Public: published achievements ordered by position asc then date desc.
   */
  public async getPublic() {
    return db.achievement.findMany({
      where: { isPublished: true },
      orderBy: [{ position: 'asc' }, { date: 'desc' }],
    });
  }

  /**
   * Admin: paginated list of all achievements (published or not), ordered by
   * position asc then date desc.
   */
  public async findAll({
    page = 1,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const total = await db.achievement.count();

    const achievements = await db.achievement.findMany({
      orderBy: [{ position: 'asc' }, { date: 'desc' }],
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: achievements,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  public async findOne(id: string) {
    return db.achievement.findUnique({ where: { id } });
  }

  public async create(data: CreateAchievementDTO) {
    return db.achievement.create({
      data: {
        title: data.title,
        issuer: data.issuer ?? null,
        description: data.description ?? null,
        date: data.date,
        url: data.url ?? null,
        icon: data.icon ?? null,
        category: data.category ?? null,
        position: data.position ?? 0,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  public async update(id: string, data: UpdateAchievementDTO) {
    return db.achievement.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string) {
    return db.achievement.delete({ where: { id } });
  }
}
