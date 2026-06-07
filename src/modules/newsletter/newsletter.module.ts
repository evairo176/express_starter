import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';

const newsletterService = new NewsletterService();
const newsletterController = new NewsletterController(newsletterService);

export { newsletterService, newsletterController };
