import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';

import response from '../../common/utils/response';

import { HTTPSTATUS } from '../../config/http.config';
import { AchievementService } from './achievement.service';
import {
  CreateAchievementSchema,
  UpdateAchievementSchema,
} from '../../common/zod/achievement.schema';

export class AchievementController {
  private achievementService: AchievementService;

  constructor(achievementService: AchievementService) {
    this.achievementService = achievementService;
  }

  public publicList = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const result = await this.achievementService.getPublic();

      return response.success(
        res,
        result,
        `Get published achievements successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public list = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const { data, metadata } = await this.achievementService.findAll({
        page,
        limit,
      });

      return response.success(
        res,
        data,
        `Find all achievements successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = CreateAchievementSchema.parse(req.body);
      const result = await this.achievementService.create(parsed);

      return response.success(
        res,
        result,
        `Achievement created successfully`,
        HTTPSTATUS.CREATED,
      );
    },
  );

  public update = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const existing = await this.achievementService.findOne(req.params.id);

      if (!existing) {
        return response.error(
          res,
          'Achievement not found',
          HTTPSTATUS.NOT_FOUND,
        );
      }

      const parsed = UpdateAchievementSchema.parse(req.body);
      const result = await this.achievementService.update(
        req.params.id,
        parsed,
      );

      return response.success(
        res,
        result,
        `Achievement updated successfully`,
        HTTPSTATUS.OK,
      );
    },
  );

  public destroy = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const existing = await this.achievementService.findOne(req.params.id);

      if (!existing) {
        return response.error(
          res,
          'Achievement not found',
          HTTPSTATUS.NOT_FOUND,
        );
      }

      await this.achievementService.delete(req.params.id);

      return response.success(
        res,
        null,
        `Achievement deleted successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
