import { db as prisma } from '../../database/database';

export class RoleService {
  public async findAll({
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'updatedAt'; // sesuaikan field
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Filter dasar
    const where: any = {
      // userId,
      // expiredAt: {
      //   gt: new Date(),
      // },
    };

    // Opsional: search pada userAgent
    if (search && search.trim() !== '') {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Hitung total (without pagination)
    const total = await prisma.role.count({
      where,
    });

    // Query data
    const roles = await prisma.role.findMany({
      where,
      orderBy: {
        name: sortDir,
      },
      skip: Number(skip),
      take: Number(limit),
      include: {
        rolePermissions: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    const formattedRoles = roles.map((role) => {
      const permissionMap: Record<string, string[]> = {};

      role.rolePermissions.forEach((rp) => {
        if (!permissionMap[rp.menuCode]) {
          permissionMap[rp.menuCode] = [];
        }

        permissionMap[rp.menuCode].push(rp.permissionCode);
      });

      const permissions = Object.entries(permissionMap).map(
        ([menuCode, permissions]) => ({
          menuCode,
          permissions,
        }),
      );

      return {
        ...role,
        rolePermissions: permissions,
      };
    });

    return {
      data: formattedRoles,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        sortBy,
        sortDir,
        search: search ?? null,
      },
    };
  }

  public async findOne(roleCode: string) {
    const role = await prisma.role.findUnique({
      where: {
        code: roleCode,
      },
      include: {
        rolePermissions: true,
      },
    });

    if (!role) {
      return null;
    }

    const permissionMap: Record<string, string[]> = {};

    role.rolePermissions.forEach((rp) => {
      if (!permissionMap[rp.menuCode]) {
        permissionMap[rp.menuCode] = [];
      }

      permissionMap[rp.menuCode].push(rp.permissionCode);
    });

    const rolePermissions = Object.entries(permissionMap).map(
      ([menuCode, permissions]) => ({
        menuCode,
        permissions,
      }),
    );

    return {
      code: role.code,
      name: role.name,
      rolePermissions,
    };
  }
}
