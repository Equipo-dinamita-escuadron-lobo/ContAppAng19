export interface Permission {
  name: string;
}

export interface AssignPermissionRequest {
  permissions: string[];
  roleName: string; // agrego esto porque tu backend espera roleName también
}

export interface RolesWithPermissions {
  role: string;
  permissions: Permission[];
}
