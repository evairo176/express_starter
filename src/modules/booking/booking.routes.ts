import { Router } from 'express';
import { bookingController } from './booking.module';

const bookingRoutes = Router();

bookingRoutes.get('/slots', bookingController.getSlots);

bookingRoutes.post('/', bookingController.createBookingWithTicket);

export default bookingRoutes;
