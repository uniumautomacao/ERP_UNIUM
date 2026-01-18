import {
  Home24Regular,
  DataBarVertical24Regular,
  ChartMultiple24Regular,
  DocumentBulletList24Regular,
  Box24Regular,
  CalendarLtr24Regular,
  People24Regular,
  DeveloperBoard24Regular,
} from '@fluentui/react-icons';
import { NavSection } from '../types';
import { getRequiredRoles } from '../security/pageAccess';

export const navigation: NavSection[] = [
  {
    id: 'home',
    label: '',
    items: [
      {
        id: 'home',
        label: 'Home',
        icon: <Home24Regular />,
        path: '/',
        requiredRoles: getRequiredRoles('/'),
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <DataBarVertical24Regular />,
        path: '/dashboard',
        requiredRoles: getRequiredRoles('/dashboard'),
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <ChartMultiple24Regular />,
        path: '/analytics',
        requiredRoles: getRequiredRoles('/analytics'),
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <DocumentBulletList24Regular />,
        path: '/reports',
        requiredRoles: getRequiredRoles('/reports'),
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'inventory',
        label: 'Inventory',
        icon: <Box24Regular />,
        path: '/inventory',
        requiredRoles: getRequiredRoles('/inventory'),
      },
      {
        id: 'projects',
        label: 'Project Planner',
        icon: <CalendarLtr24Regular />,
        path: '/projects',
        requiredRoles: getRequiredRoles('/projects'),
      },
      {
        id: 'team',
        label: 'Team Management',
        icon: <People24Regular />,
        path: '/team',
        requiredRoles: getRequiredRoles('/team'),
      },
    ],
  },
  {
    id: 'dev',
    label: 'DEV',
    items: [
      {
        id: 'dev-page',
        label: 'Dev Page',
        icon: <DeveloperBoard24Regular />,
        path: '/dev',
        requiredRoles: getRequiredRoles('/dev'),
      },
    ],
  },
];
