import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccessControl } from './AccessControlContext';
import { LoadingState } from '../components/shared/LoadingState';

interface RequirePageAccessProps {
  children: ReactElement;
}

export function RequirePageAccess({ children }: RequirePageAccessProps) {
  const location = useLocation();
  const { canAccessPath, loading, error, isSystemAdmin } = useAccessControl();

  if (loading) {
    return <LoadingState label="Verificando permissões de acesso..." />;
  }

  // Permite sempre a página de "Acesso Negado" para evitar loops de redirecionamento
  if (location.pathname === '/forbidden') {
    return children;
  }

  // Se for System Admin acessando área de super admin, permite mesmo com erro na tabela de permissões
  const isSuperAdminPath = location.pathname.startsWith('/super-admin');
  if (isSystemAdmin && isSuperAdminPath) {
    return children;
  }

  if (error) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname, reason: `Erro ao validar acesso: ${error}` }}
      />
    );
  }

  if (!canAccessPath(location.pathname)) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname, reason: 'Seu perfil de acesso não permite visualizar esta página.' }}
      />
    );
  }

  return children;
}
