import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { BookingService } from './booking.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';

export class BookingController {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
  }
  public getSlots = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { date } = req.query;

      const slots = await this.bookingService.getAvailableSlots(date as string);

      return res.json(slots);
    },
  );
  public createBooking = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const booking = await this.bookingService.createBooking(req.body);

      return res.json(booking);
    },
  );
  public createBookingWithTicket = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { booking, ticket } =
        await this.bookingService.createBookingWithTicket(req.body);

      return response.success(
        res,
        {
          booking,
          ticket,
        },
        'Booking and ticket created successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
