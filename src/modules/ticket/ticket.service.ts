import { db as prisma } from '../../database/database';

export class TicketService {
  public async createTicket(data: any) {
    return prisma.ticket.create({
      data,
    });
  }
  public async findAll({
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
    const total = await prisma.ticket.count({
      where,
    });

    // Query data
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
      include: {
        pic: true,
        activities: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
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
  public async getTicketById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        pic: true,
        activities: true,
      },
    });
  }
  public async assignTicket(ticketId: string, picId: string) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        picId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }
  public async finishTicket(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket?.startedAt) {
      throw new Error('Ticket belum dimulai');
    }

    const finishedAt = new Date();

    const duration =
      (finishedAt.getTime() - ticket.startedAt.getTime()) / 60000;

    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'DONE',
        finishedAt,
        durationMin: Math.round(duration),
      },
    });
  }
  public async getPic() {
    return prisma.user.findMany({
      where: {
        role: 'pic_it',
      },
      select: {
        name: true,
        id: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const ticketService = new TicketService();
