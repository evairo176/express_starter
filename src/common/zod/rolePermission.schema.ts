import { z } from 'zod';

export const SetRolePermissionSchema = z.object({
  roleCode: z.string(),
  rolePermissions: z.array(
    z.object({
      menuCode: z.string(),
      permissions: z.array(z.string()),
    }),
  ),
});

export type SetRolePermissionDTO = z.infer<typeof SetRolePermissionSchema>;
