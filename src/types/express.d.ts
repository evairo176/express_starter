// src/types/express.d.ts or src/@types/express/index.d.ts

import { User as UserInterface, UserPreferences } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends UserInterface {
      userPreferences: UserPreferences;
    }
    interface Request {
      sessionId?: string;
    }
  }
}

export {};
