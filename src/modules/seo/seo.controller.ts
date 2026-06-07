import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import { SeoService } from './seo.service';

export class SeoController {
  private seoService: SeoService;

  constructor(seoService: SeoService) {
    this.seoService = seoService;
  }

  public sitemap = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const xml = await this.seoService.generateSitemap();

      res.header('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    },
  );
}
