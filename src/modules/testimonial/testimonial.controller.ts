import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialSchema } from '../../common/zod/testimonial.schema';

export class TestimonialController {
  private testimonialService: TestimonialService;

  constructor(testimonialService: TestimonialService) {
    this.testimonialService = testimonialService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateTestimonialSchema.parse(req.body);
      const result = await this.testimonialService.create(parsed);

      return response.success(
        res,
        result,
        `Testimonial created successfully`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public findPublished = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const result = await this.testimonialService.findPublished();

      return response.success(
        res,
        result,
        `Get published testimonials successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public publish = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const existing = await this.testimonialService.findById(req.params.id);

      if (!existing) {
        return response.error(
          res,
          'Testimonial not found',
          HTTPSTATUS.NOT_FOUND,
        );
      }

      const isPublished =
        typeof req.body?.isPublished === 'boolean'
          ? req.body.isPublished
          : !existing.isPublished;

      const result = await this.testimonialService.setPublished(
        req.params.id,
        isPublished,
      );

      return response.success(
        res,
        result,
        `Testimonial published state updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
