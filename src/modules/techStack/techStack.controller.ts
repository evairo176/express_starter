import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../cummon/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { TechStackService } from './techStack.service';
import {
  CreateTechStackSchema,
  UpdateTechStackSchema,
} from '../../cummon/zod/tech-stack.schema';

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

  public getOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const result = await this.TechStackService.findById(req.params.id);

      if (!result) {
        return response.error(
          res,
          'Tech stack not found',
          HTTPSTATUS.NOT_FOUND,
        );
      }

      return response.success(
        res,
        result,
        `Get tech stack successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public update = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = UpdateTechStackSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const result = await this.TechStackService.update(parsed);

      return response.success(
        res,
        result,
        `Tech stack updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      await this.TechStackService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Tech stack deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
