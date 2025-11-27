import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../cummon/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { TechStackService } from './techStack.service';
import { CreateTechStackSchema } from '../../cummon/zod/tech-stack.schema';

export class TechStackController {
  private TechStackService: TechStackService;

  constructor(TechStackService: TechStackService) {
    this.TechStackService = TechStackService;
  }

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateTechStackSchema.parse(req.body);
      const result = await this.TechStackService.create(parsed);

      return response.success(
        res,
        result,
        `${result?.name} (${result?.name} created)`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.TechStackService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all Tech Stack successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
