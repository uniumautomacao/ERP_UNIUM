import { ReactElement, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRoles } from '../hooks/useUserRoles';
import { LoadingState } from '../components/shared/LoadingState';
import { hasRequiredRoles } from './pageAccess';

interface RequireRolesProps {
  requiredRoles: string[];
  children: ReactElement;
}

export function RequireRoles({ requiredRoles, children }: RequireRolesProps) {
  const location = useLocation();
  const { roles, loading, error } = useUserRoles();

  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);

  if (loading) {
    return <LoadingState label="Carregando permissões..." />;
  }

  if (error) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname, reason: 'Erro ao carregar roles do usuário.' }}
      />
    );
  }

  if (!hasRequiredRoles(roleNames, requiredRoles)) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname, reason: 'Você não possui permissão para esta página.' }}
      />
    );
  }

  return children;
}
