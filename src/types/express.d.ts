// src/types/express.d.ts or src/@types/express/index.d.ts

import { User as UserInterface, UserPreferences } from '@prisma/client';
import { Role } from '../cummon/enums/role.enum';

declare global {
  namespace Express {
    interface User extends UserInterface {
      userPreferences: UserPreferences;
    }
    interface Request {
      sessionId?: string;
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};
