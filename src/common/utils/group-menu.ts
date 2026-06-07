const groupRolePermissions = (data: any[]) => {
  const result: Record<string, string[]> = {};

  data.forEach((item) => {
    if (!result[item.menuCode]) {
      result[item.menuCode] = [];
    }

    result[item.menuCode].push(item.permissionCode);
  });

  return Object.entries(result).map(([menuCode, permissions]) => ({
    menuCode,
    permissions,
  }));
};
