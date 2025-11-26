"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIST_ROLES = exports.isValidPermission = exports.PERMISSION_MENU = void 0;
exports.PERMISSION_MENU = [
    {
        menu: 'dashboard',
        permissions: [
            {
                name: 'read',
            },
        ],
    },
    {
        menu: 'users',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'roles',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'customers',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'mainCategory',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'category',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'subCategory',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'units',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'products',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'pos',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'company',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'orders',
        permissions: [
            {
                name: 'read',
            },
        ],
    },
    {
        menu: 'sales',
        permissions: [
            {
                name: 'read',
            },
        ],
    },
    {
        menu: 'reports',
        permissions: [
            {
                name: 'read',
            },
        ],
    },
    {
        menu: 'settingsPos',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
    {
        menu: 'master',
        permissions: [
            {
                name: 'read',
            },
            {
                name: 'create',
            },
            {
                name: 'update',
            },
            {
                name: 'delete',
            },
        ],
    },
];
const isValidPermission = (permissions) => {
    const validPermissions = exports.PERMISSION_MENU.flatMap((menu) => menu.permissions.map((p) => `${menu.menu}.${p.name}`));
    return permissions.every((perm) => validPermissions.includes(perm));
};
exports.isValidPermission = isValidPermission;
exports.LIST_ROLES = [
    {
        roleName: 'ADMIN',
        displayName: 'Admin',
        code: 'A001',
    },
    {
        roleName: 'SUPERADMIN',
        displayName: 'Super Admin',
        code: 'A002',
    },
    {
        roleName: 'MANAGER',
        displayName: 'Manager',
        code: 'A003',
    },
    {
        roleName: 'KASIR',
        displayName: 'Kasir',
        code: 'A004',
    },
];
