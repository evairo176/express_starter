import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

const bookingService = new BookingService();
const bookingController = new BookingController(bookingService);

export { bookingService, bookingController };
