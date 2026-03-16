import { Request, Response, NextFunction } from 'express';
import { Role } from '../../cummon/enums/role.enum';
import { BadRequestException } from '../../cummon/utils/catch-errors';

export const role =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new BadRequestException('Unauthorized');
    }

    if (!allowedRoles.includes(req.user?.role as Role)) {
      throw new BadRequestException(
        'Role not authorized to access this resource, your role is ' +
          req.user?.role,
      );
    }

    next();
  };
