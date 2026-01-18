import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useUserRoles } from '../hooks/useUserRoles';
import { NewCodeAppPageAllowedSecurityRoleService } from '../generated/services/NewCodeAppPageAllowedSecurityRoleService';

interface AccessControlContextType {
  canAccessPath: (path: string) => boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const AccessControlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { roles, loading: rolesLoading, error: rolesError, refresh: refreshRoles } = useUserRoles();
  const [allowedPaths, setAllowedPaths] = useState<Set<string>>(new Set());
  const [hasWildcard, setHasWildcard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = React.useCallback(async () => {
    if (rolesLoading) return;
    if (rolesError) {
      setError(rolesError);
      setLoading(false);
      return;
    }

    if (roles.length === 0) {
      setAllowedPaths(new Set());
      setHasWildcard(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create filter for the user's roles
      // Format: ( _new_securityrole_value eq 'GUID1' or _new_securityrole_value eq 'GUID2' ... )
      const rolesFilter = roles.map(r => `_new_securityrole_value eq '${r.roleId}'`).join(' or ');
      const filter = `statecode eq 0 and (${rolesFilter})`;

      const result = await NewCodeAppPageAllowedSecurityRoleService.getAll({
        filter,
        select: ['new_id', '_new_securityrole_value']
      });

      const paths = new Set<string>();
      let wildcard = false;

      if (result.data) {
        result.data.forEach(item => {
          if (item.new_id === '*') {
            wildcard = true;
          } else if (item.new_id) {
            // Normalize path: trim and ensure it starts with / (if it's not the wildcard)
            let path = item.new_id.trim();
            if (!path.startsWith('/') && path !== '*') {
              path = '/' + path;
            }
            paths.add(path);
          }
        });
      }

      setAllowedPaths(paths);
      setHasWildcard(wildcard);
    } catch (err: any) {
      console.error('Erro ao carregar permissões de página:', err);
      setError(err.message || 'Erro ao carregar permissões.');
    } finally {
      setLoading(false);
    }
  }, [roles, rolesLoading, rolesError]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const canAccessPath = useMemo(() => (path: string): boolean => {
    if (hasWildcard) return true;
    
    // Normalize requested path
    const normalizedPath = path.trim() === '' ? '/' : path.trim();
    
    // Check direct match
    if (allowedPaths.has(normalizedPath)) return true;

    // Optional: handle trailing slashes for flexibility
    if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
      if (allowedPaths.has(normalizedPath.slice(0, -1))) return true;
    } else if (normalizedPath !== '/' && !normalizedPath.endsWith('/')) {
      if (allowedPaths.has(normalizedPath + '/')) return true;
    }

    return false;
  }, [allowedPaths, hasWildcard]);

  const refresh = async () => {
    await refreshRoles();
    await fetchPermissions();
  };

  const value = useMemo(() => ({
    canAccessPath,
    loading: loading || rolesLoading,
    error: error || rolesError,
    refresh
  }), [canAccessPath, loading, rolesLoading, error, rolesError]);

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};
