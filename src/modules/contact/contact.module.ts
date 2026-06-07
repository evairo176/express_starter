import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

const contactService = new ContactService();
const contactController = new ContactController(contactService);

export { contactService, contactController };
