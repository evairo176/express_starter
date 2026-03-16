import { db as prisma } from '../../database/database';
interface Payload {
  roleCode: string;
  rolePermissions: {
    menuCode: string;
    permissions: string[];
  }[];
}

export class RolePermissionService {
  public async setRolePermission(roleCode: any, rolePermissions: any) {
    /**
     * Delete existing permissions
     */

    await prisma.rolePermission.deleteMany({
      where: {
        roleCode,
      },
    });

    /**
     * Transform payload
     */

    const data = rolePermissions.flatMap((rp: any) =>
      rp.permissions.map((permissionCode: any) => ({
        roleCode,
        menuCode: rp.menuCode,
        permissionCode,
      })),
    );

    /**
     * Insert new permissions
     */

    if (data.length > 0) {
      await prisma.rolePermission.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }

  public async getRolePermissions(roleCode: string) {
    return prisma.rolePermission.findMany({
      where: {
        roleCode,
      },
      include: {
        permission: true,
      },
    });
  }
}
