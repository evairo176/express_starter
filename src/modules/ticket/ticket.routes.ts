import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { ticketController } from './ticket.module';

const ticketRoutes = Router();

ticketRoutes.post('/', ticketController.createTicket);

ticketRoutes.get('/', ticketController.getTickets);

ticketRoutes.get('/:id', ticketController.getTicketById);

ticketRoutes.post('/assign', ticketController.assignTicket);

ticketRoutes.post('/:id/finish', ticketController.finishTicket);

export default ticketRoutes;
