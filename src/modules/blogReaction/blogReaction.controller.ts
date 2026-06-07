import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import { CreateBlogReactionSchema } from '../../common/zod/blog-reaction.schema';
import { BlogReactionService } from './blogReaction.service';

export class BlogReactionController {
  private blogReactionService: BlogReactionService;

  constructor(blogReactionService: BlogReactionService) {
    this.blogReactionService = blogReactionService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = CreateBlogReactionSchema.parse(req.body);
    const result = await this.blogReactionService.create(
      req.params.slug,
      parsed,
    );

    return response.success(
      res,
      result,
      'Reaction added successfully',
      HTTPSTATUS.CREATED,
    );
  });
}
