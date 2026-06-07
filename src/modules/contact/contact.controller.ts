import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import { CreateContactSchema } from '../../common/zod/contact.schema';
import { PaginationQuerySchema } from '../../common/utils/pagination';
import { ContactService } from './contact.service';

export class ContactController {
  private contactService: ContactService;

  constructor(contactService: ContactService) {
    this.contactService = contactService;
  }

  // POST /contact (public). Validation failure -> 400 and nothing persisted
  // (Zod parse throws before the service is called) (Req 7.1, 7.4).
  public create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = CreateContactSchema.parse(req.body);
    const result = await this.contactService.create(parsed);

    return response.success(
      res,
      result,
      'Contact message received successfully',
      HTTPSTATUS.CREATED,
    );
  });

  // GET /contact (admin). Newest-first with pagination metadata (Req 7.5).
  public findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = PaginationQuerySchema.parse(req.query);
    const { data, metadata } = await this.contactService.findAll(query);

    return response.success(
      res,
      data,
      'Find all contact messages successfully',
      HTTPSTATUS.OK,
      metadata,
    );
  });
}
