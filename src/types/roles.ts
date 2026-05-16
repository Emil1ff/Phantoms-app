export type Role = {
  name: string;
  description: string;
  permissions?: string[];
};

export type RolePermissionsCatalog = Record<string, string[]>;

export type CreateRoleRequest = {
  name: string;
  description: string;
  permissions: string[];
};
