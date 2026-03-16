import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { RolePermissionService } from './rolePermission.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import { BadRequestException } from '../../cummon/utils/catch-errors';
import { SetRolePermissionSchema } from '../../cummon/zod/rolePermission.schema';

export class RolePermissionController {
  private rolePermissionService: RolePermissionService;

  constructor(rolePermissionService: RolePermissionService) {
    this.rolePermissionService = rolePermissionService;
  }

  public setRolePermission = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const parsed = SetRolePermissionSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: parsed.error.format(),
        });
      }

      const { roleCode, rolePermissions } = parsed.data;

      await this.rolePermissionService.setRolePermission(
        roleCode,
        rolePermissions,
      );

      return response.success(
        res,
        null,
        'Set role permission successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  public getRolePermissions = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { roleCode } = req.params;

      const permissions =
        await this.rolePermissionService.getRolePermissions(roleCode);

      return response.success(
        res,
        permissions,
        'Get role permissions successfully',
        HTTPSTATUS.OK,
      );
    },
  );
}
