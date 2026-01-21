import { createElement, ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { NavSection } from '../types';
import { RequirePageAccess } from '../security/RequirePageAccess';

interface FilterNavigationOptions {
  excludeSectionIds?: string[];
  excludePaths?: string[];
}

const normalizePath = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  if (trimmed === '/') return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
};

export const filterNavigationByAccess = (
  sections: NavSection[],
  canAccessPath: (path: string) => boolean,
  options: FilterNavigationOptions = {}
) => {
  const excludeSectionIds = new Set(options.excludeSectionIds ?? []);
  const excludePaths = new Set((options.excludePaths ?? []).map(normalizePath));

  return sections
    .map((section) => {
      if (excludeSectionIds.has(section.id)) return null;
      const items = section.items.filter((item) => {
        const normalizedPath = normalizePath(item.path);
        if (excludePaths.has(normalizedPath)) return false;
        return canAccessPath(item.path);
      });
      return items.length > 0 ? { ...section, items } : null;
    })
    .filter((section): section is NavSection => section !== null);
};

export const generateRoutesFromNavigation = (sections: NavSection[]): ReactElement[] => {
  const routes: ReactElement[] = [];

  sections.forEach((section) => {
    section.items.forEach((item) => {
      const Component = item.component;
      routes.push(
        createElement(Route, {
          key: item.path,
          path: item.path,
          element: createElement(
            RequirePageAccess,
            null,
            createElement(Component)
          ),
        })
      );
    });
  });

  return routes;
};
