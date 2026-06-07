import { TestimonialController } from './testimonial.controller';
import { TestimonialService } from './testimonial.service';

const testimonialService = new TestimonialService();
const testimonialController = new TestimonialController(testimonialService);

export { testimonialService, testimonialController };
