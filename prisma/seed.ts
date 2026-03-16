import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  /*
  ========================
  SEED MENU
  ========================
  */

  await prisma.menu.createMany({
    data: [
      { code: 'CLAIM', name: 'Claim' },
      { code: 'VERIFIER', name: 'Verifier Menu' },
      { code: 'APPROVAL', name: 'Approval Menu' },
      { code: 'USER_MANAGEMENT', name: 'User Management' },
    ],
    skipDuplicates: true,
  });

  /*
  ========================
  SEED PERMISSION
  ========================
  */

  await prisma.permission.createMany({
    data: [
      { code: 'CREATE', name: 'Create' },
      { code: 'READ', name: 'Read' },
      { code: 'UPDATE', name: 'Update' },
      { code: 'DELETE', name: 'Delete' },
    ],
    skipDuplicates: true,
  });

  /*
  ========================
  SEED ROLE PERMISSION
  ========================
  */

  const rolePermissions = [
    // ADMIN → semua akses
    { roleCode: 'ADMIN', menuCode: 'CLAIM', permissionCode: 'CREATE' },
    { roleCode: 'ADMIN', menuCode: 'CLAIM', permissionCode: 'READ' },
    { roleCode: 'ADMIN', menuCode: 'CLAIM', permissionCode: 'UPDATE' },
    { roleCode: 'ADMIN', menuCode: 'CLAIM', permissionCode: 'DELETE' },

    {
      roleCode: 'ADMIN',
      menuCode: 'USER_MANAGEMENT',
      permissionCode: 'CREATE',
    },
    { roleCode: 'ADMIN', menuCode: 'USER_MANAGEMENT', permissionCode: 'READ' },
    {
      roleCode: 'ADMIN',
      menuCode: 'USER_MANAGEMENT',
      permissionCode: 'UPDATE',
    },
    {
      roleCode: 'ADMIN',
      menuCode: 'USER_MANAGEMENT',
      permissionCode: 'DELETE',
    },

    // USER
    { roleCode: 'USER', menuCode: 'CLAIM', permissionCode: 'CREATE' },
    { roleCode: 'USER', menuCode: 'CLAIM', permissionCode: 'READ' },

    // VERIFIER
    { roleCode: 'VERIFIER', menuCode: 'VERIFIER', permissionCode: 'CREATE' },
    { roleCode: 'VERIFIER', menuCode: 'VERIFIER', permissionCode: 'READ' },
    { roleCode: 'VERIFIER', menuCode: 'VERIFIER', permissionCode: 'UPDATE' },
    { roleCode: 'VERIFIER', menuCode: 'VERIFIER', permissionCode: 'DELETE' },

    // APPROVER
    { roleCode: 'APPROVER', menuCode: 'APPROVAL', permissionCode: 'READ' },
    { roleCode: 'APPROVER', menuCode: 'APPROVAL', permissionCode: 'UPDATE' },
  ];

  for (const data of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleCode_menuCode_permissionCode: {
          roleCode: data.roleCode,
          menuCode: data.menuCode,
          permissionCode: data.permissionCode,
        },
      },
      update: {},
      create: data,
    });
  }

  console.log('RBAC seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
