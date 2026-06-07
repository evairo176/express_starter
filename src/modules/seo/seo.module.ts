import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

const seoService = new SeoService();
const seoController = new SeoController(seoService);

export { seoService, seoController };
