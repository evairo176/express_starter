import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { RoleService } from './role.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';

export class RoleController {
  private roleService: RoleService;

  constructor(roleService: RoleService) {
    this.roleService = roleService;
  }

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.roleService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all roles successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );

  public findOne = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const roleCode = req.params.roleCode;
      const data = await this.roleService.findOne(roleCode);

      return response.success(
        res,
        data,
        `find role with code ${roleCode} successfully`,
        HTTPSTATUS.OK,
      );
    },
  );
}
