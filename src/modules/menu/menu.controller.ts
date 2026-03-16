import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares';
import { MenuService } from './menu.service';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';

export class MenuController {
  private menuService: MenuService;

  constructor(menuService: MenuService) {
    this.menuService = menuService;
  }

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { data, metadata } = await this.menuService.findAll({
        ...req?.query,
      });

      return response.success(
        res,
        data,
        `Find all tickets successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
