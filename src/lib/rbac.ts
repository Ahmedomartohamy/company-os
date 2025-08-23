export type Role = 'admin' | 'sales' | 'pm' | 'viewer';

type Permission =
  | 'clients.read'
  | 'clients.write'
  | 'projects.read'
  | 'projects.write'
  | 'tasks.read'
  | 'tasks.write'
  | 'deals.read'
  | 'deals.write'
  | 'settings.write';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'clients.read',
    'clients.write',
    'projects.read',
    'projects.write',
    'tasks.read',
    'tasks.write',
    'deals.read',
    'deals.write',
    'settings.write',
  ],
  sales: ['clients.read', 'clients.write', 'deals.read', 'deals.write'],
  pm: ['projects.read', 'projects.write', 'tasks.read', 'tasks.write', 'clients.read'],
  viewer: ['clients.read', 'projects.read', 'tasks.read', 'deals.read'],
};

export function can(role: Role, perm: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(perm);
}
