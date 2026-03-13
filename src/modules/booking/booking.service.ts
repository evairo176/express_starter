import { ErrorCode } from '../../cummon/enums/error-code.enum';
import { BadRequestException } from '../../cummon/utils/catch-errors';
import { db as prisma } from '../../database/database';
const START_HOUR = 9;
const END_HOUR = 17;
const SLOT = 15;
export class BookingService {
  public async generateSlots() {
    const slots: string[] = [];

    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');

        slots.push(`${hour}:${minute}`);
      }
    }

    return slots;
  }

  public async getAvailableSlots(date: string) {
    const slots = await this.generateSlots();

    const start = new Date(date);
    const end = new Date(date);

    end.setHours(23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const booked = bookings.map((b) =>
      b.startTime.toISOString().substring(11, 16),
    );

    return slots.filter((s) => !booked.includes(s));
  }

  public createBooking(data: any) {
    return prisma.booking.create({
      data,
    });
  }

  public async createBookingWithTicket(data: any) {
    return prisma.$transaction(async (tx) => {
      const dateOnly = new Date(data.date).toISOString().split('T')[0];

      const startTime = new Date(`${dateOnly}T${data.startTime}:00`);
      const endTime = new Date(`${dateOnly}T${data.endTime}:00`);

      // =============================
      // CHECK SLOT SUDAH DIBOOKING
      // =============================

      const existingBooking = await tx.booking.findFirst({
        where: {
          date: new Date(dateOnly),
          startTime: startTime,
        },
      });

      if (existingBooking) {
        throw new BadRequestException(
          'Slot waktu sudah dibooking, silakan pilih jam lain',
          ErrorCode.SCHEDULE_ALREADY_EXISTS,
        );
      }

      // =============================
      // CREATE BOOKING
      // =============================

      const booking = await tx.booking.create({
        data: {
          date: new Date(dateOnly),
          startTime,
          endTime,
        },
      });

      // =============================
      // CREATE TICKET
      // =============================

      const ticket = await tx.ticket.create({
        data: {
          title: data.title,
          description: data.description,
          requestType: data.requestType,
          doxaReason: data.doxaReason,
          bookingId: booking.id,
        },
      });

      return { booking, ticket };
    });
  }
}
