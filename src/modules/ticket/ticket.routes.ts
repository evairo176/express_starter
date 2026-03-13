import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { ticketController } from './ticket.module';

const ticketRoutes = Router();

ticketRoutes.post('/', ticketController.createTicket);

ticketRoutes.get('/', ticketController.findAll);

ticketRoutes.get('/:id', ticketController.getTicketById);

ticketRoutes.post('/:id/assign', ticketController.assignTicket);

ticketRoutes.post('/:id/finish', ticketController.finishTicket);

ticketRoutes.get('/users/pic', ticketController.getPic);

export default ticketRoutes;
