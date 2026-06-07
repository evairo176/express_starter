import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterSchema } from '../../common/zod/newsletter.schema';

export class NewsletterController {
  private newsletterService: NewsletterService;

  constructor(newsletterService: NewsletterService) {
    this.newsletterService = newsletterService;
  }

  public subscribe = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = SubscribeNewsletterSchema.parse(req.body);

      await this.newsletterService.subscribe(parsed);

      return response.success(
        res,
        null,
        'Subscribed to newsletter successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public unsubscribe = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const token = String(req.query.token ?? '');

      await this.newsletterService.unsubscribe(token);

      return response.success(
        res,
        null,
        'Unsubscribed from newsletter successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
