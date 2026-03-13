import { db as prisma } from '../../database/database';

export class TicketService {
  public async createTicket(data: any) {
    return prisma.ticket.create({
      data,
    });
  }
  public async getTickets() {
    return prisma.ticket.findMany({
      include: {
        pic: true,
        activities: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
}

export const ticketService = new TicketService();
