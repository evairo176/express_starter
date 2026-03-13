import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { TicketService } from './ticket.service';

export class TicketController {
  private ticketService: TicketService;

  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }
  public createTicket = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ticket = await this.ticketService.createTicket(req.body);
      return res.json(ticket);
    },
  );
  public getTickets = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ticket = await this.ticketService.createTicket(req.body);
      return res.json(ticket);
    },
  );
  public getTicketById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ticket = await this.ticketService.getTicketById(req.params.id);
      return res.json(ticket);
    },
  );
  public assignTicket = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { ticketId, picId } = req.body;

      const ticket = await this.ticketService.assignTicket(ticketId, picId);

      return res.json(ticket);
    },
  );
  public finishTicket = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ticket = await this.ticketService.finishTicket(req.params.id);
      return res.json(ticket);
    },
  );
}
