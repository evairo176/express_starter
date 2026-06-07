import { CreateTestimonialDTO } from '../../common/zod/testimonial.schema';
import { db } from '../../database/database';

export class TestimonialService {
  public async create(data: CreateTestimonialDTO) {
    return db.testimonial.create({
      data: {
        authorName: data.authorName,
        authorRole: data.authorRole,
        quote: data.quote,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  public async findPublished() {
    return db.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findById(id: string) {
    return db.testimonial.findUnique({ where: { id } });
  }

  public async setPublished(id: string, isPublished: boolean) {
    return db.testimonial.update({
      where: { id },
      data: { isPublished },
    });
  }
}
