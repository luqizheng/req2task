import { Injectable } from '@nestjs/common';
import { Permission, UserRole } from '@req2task/dto';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.PROJECT_MANAGER]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_MANAGE_MEMBERS,
    Permission.MODULE_CREATE,
    Permission.MODULE_EDIT,
    Permission.MODULE_DELETE,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_EDIT,
    Permission.REQUIREMENT_DELETE,
    Permission.REQUIREMENT_REVIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.BASELINE_CREATE,
    Permission.BASELINE_RESTORE,
    Permission.AI_USE,
  ],
  [UserRole.DEVELOPER]: [
    Permission.PROJECT_VIEW,
    Permission.MODULE_CREATE,
    Permission.MODULE_EDIT,
    Permission.REQUIREMENT_VIEW,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_EDIT,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.AI_USE,
  ],
  [UserRole.VIEWER]: [Permission.PROJECT_VIEW],
  [UserRole.USER]: [
    Permission.PROJECT_VIEW,
    Permission.REQUIREMENT_VIEW,
    Permission.TASK_VIEW,
  ],
};

@Injectable()
export class PermissionService {
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission) || permissions.includes(Permission.ADMIN);
  }

  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(role, p));
  }

  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(role, p));
  }

  getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}
