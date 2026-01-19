import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LAST_ROUTE_KEY = 'last_visited_path';

const shouldPersistPath = (pathname: string) => {
  return pathname !== '/' && pathname !== '/forbidden';
};

export function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();
  const didRestoreRef = useRef(false);

  useEffect(() => {
    if (!shouldPersistPath(location.pathname)) return;
    try {
      const value = `${location.pathname}${location.search}`;
      window.localStorage.setItem(LAST_ROUTE_KEY, value);
    } catch (error) {
      console.warn('[RoutePersistence] Falha ao salvar rota:', error);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;

    if (location.pathname !== '/') return;

    try {
      const lastPath = window.localStorage.getItem(LAST_ROUTE_KEY);
      if (lastPath && lastPath !== '/') {
        navigate(lastPath, { replace: true });
      }
    } catch (error) {
      console.warn('[RoutePersistence] Falha ao restaurar rota:', error);
    }
  }, [location.pathname, navigate]);

  return null;
}
