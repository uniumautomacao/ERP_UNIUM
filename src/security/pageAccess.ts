export type PageAccessMap = Record<string, string[]>;

const adminRoles = ['System Administrator', 'Diretoria UNIUM'];

export const pageAccess: PageAccessMap = {
  '/': ['Basic User', ...adminRoles],
  '/dashboard': ['ERP Analytics', ...adminRoles],
  '/analytics': ['ERP Analytics', ...adminRoles],
  '/reports': ['ERP Reports', ...adminRoles],
  '/inventory': ['ERP Inventory', ...adminRoles],
  '/projects': ['ERP Projects', ...adminRoles],
  '/team': ['ERP Team', ...adminRoles],
  '/dev': adminRoles,
};

const normalizeRole = (role: string) => role.trim().toLowerCase();

export function hasRequiredRoles(
  userRoles: string[],
  requiredRoles?: string[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const userRoleSet = new Set(userRoles.map(normalizeRole));
  return requiredRoles.some((role) => userRoleSet.has(normalizeRole(role)));
}

export function getRequiredRoles(path: string): string[] {
  return pageAccess[path] ?? [];
}
