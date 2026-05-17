export interface Permission {
  name: string;
}

export interface AssignPermissionRequest {
  permissionNames: string[];
  roleName: string;
}

export interface RolesWithPermissions {
  role: string;
  permissions: Permission[];
}
