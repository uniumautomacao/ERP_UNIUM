import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useUserRoles } from '../hooks/useUserRoles';
import { NewCodeAppPageAllowedSecurityRoleService } from '../generated/services/NewCodeAppPageAllowedSecurityRoleService';
import { navigation } from '../config/navigation';

interface AccessControlContextType {
  canAccessPath: (path: string) => boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isSystemAdmin: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const AccessControlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { roles, loading: rolesLoading, error: rolesError, refresh: refreshRoles } = useUserRoles();
  const [allowedPaths, setAllowedPaths] = useState<Set<string>>(new Set());
  const [hasWildcard, setHasWildcard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  const isSystemAdmin = useMemo(() => {
    return roles.some(r => r.name.toLowerCase() === 'system administrator');
  }, [roles]);

  const normalizePath = (path: string) => {
    const trimmed = path.trim();
    if (!trimmed) return '/';
    if (trimmed === '/') return '/';
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
  };

  const normalizeRule = (value?: string) => (value ? value.trim() : '');
  const validPaths = useMemo(() => {
    const paths = new Set<string>();
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        paths.add(normalizePath(item.path));
      });
    });
    paths.add('/forbidden');
    return paths;
  }, []);

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
          const rule = normalizeRule(item.new_id);
          if (rule === '*') {
            wildcard = true;
          } else if (rule) {
            const normalized = normalizePath(rule);
            if (validPaths.has(normalized)) {
              paths.add(normalized);
            } else if (isDev) {
              console.warn('[AccessControl] new_id inválido ignorado:', rule);
            }
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
    const normalizedPath = normalizePath(path);

    // Bypass for Super Admin paths if user is System Administrator
    if (isSystemAdmin && normalizedPath.startsWith('/super-admin')) {
      return true;
    }

    if (!validPaths.has(normalizedPath)) return false;
    if (hasWildcard) return true;
    
    // Normalize requested path
    // Check direct match
    if (allowedPaths.has(normalizedPath)) return true;

    // Optional: handle trailing slashes for flexibility
    return false;
  }, [allowedPaths, hasWildcard, validPaths, isSystemAdmin]);

  const refresh = async () => {
    await refreshRoles();
    await fetchPermissions();
  };

  const value = useMemo(() => ({
    canAccessPath,
    loading: loading || rolesLoading,
    error: error || rolesError,
    refresh,
    isSystemAdmin
  }), [canAccessPath, loading, rolesLoading, error, rolesError, isSystemAdmin]);

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
