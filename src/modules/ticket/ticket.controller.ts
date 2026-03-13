import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { TicketService } from './ticket.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';

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
      const { picId } = req.body;
      const ticketId = req.params.id;

      const ticket = await this.ticketService.assignTicket(ticketId, picId);

      return response.success(
        res,
        ticket,
        `Assign ticket successfully to pic with id ${picId} ${ticket.title} `,
        HTTPSTATUS.OK,
      );
    },
  );
  public finishTicket = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ticket = await this.ticketService.finishTicket(req.params.id);
      return res.json(ticket);
    },
  );

  public getPic = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const pic = await this.ticketService.getPic();
      return response.success(res, pic, 'get pic successfully', HTTPSTATUS.OK);
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.ticketService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all tickets successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
