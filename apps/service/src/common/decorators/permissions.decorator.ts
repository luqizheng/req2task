import { SetMetadata } from '@nestjs/common';
import { Permission } from '@req2task/dto';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata('permissionMode', 'any') &&
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAllPermissions = (...permissions: Permission[]) =>
  SetMetadata('permissionMode', 'all') &&
  SetMetadata(PERMISSIONS_KEY, permissions);
