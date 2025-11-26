import { NotFoundException } from '../../cummon/utils/catch-errors';
import { db } from '../../database/database';

export class SessionService {
  public async getSessionByUser({
    userId,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortDir = 'desc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'expiredAt' | 'userAgent'; // sesuaikan field
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Filter dasar
    const where: any = {
      userId,
      expiredAt: {
        gt: new Date(),
      },
    };

    // Opsional: search pada userAgent
    if (search && search.trim() !== '') {
      where.userAgent = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Hitung total (without pagination)
    const total = await db.session.count({
      where,
    });

    // Query data
    const sessions = await db.session.findMany({
      where,
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
      select: {
        id: true,
        userId: true,
        userAgent: true,
        isRevoke: true,
        createdAt: true,
        expiredAt: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: sessions,
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

  public async getSessionById(sessionId: string) {
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        createdAt: true,
        expiredAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
            userPreferences: {
              select: {
                enable2FA: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      user: session.user,
    };
  }

  public async revokeSession(sessionId: string, userId: string) {
    const revokeSession = await db.session.delete({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!revokeSession) {
      throw new NotFoundException('Session not found');
    }
    return revokeSession;
  }
}
