import {
  Home24Regular,
  DataBarVertical24Regular,
  ChartMultiple24Regular,
  DocumentBulletList24Regular,
  Box24Regular,
  CalendarLtr24Regular,
  People24Regular,
  ShieldLock24Regular,
  PeopleCheckmark24Regular,
  DeveloperBoard24Regular,
} from '@fluentui/react-icons';
import { NavSection } from '../types';

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
      },
    ],
  },
  {
    id: 'installations',
    label: 'Instalações',
    items: [
      {
        id: 'timeline',
        label: 'Linha do Tempo',
        icon: <CalendarLtr24Regular />,
        path: '/timeline',
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
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <ChartMultiple24Regular />,
        path: '/analytics',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <DocumentBulletList24Regular />,
        path: '/reports',
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
      },
      {
        id: 'projects',
        label: 'Project Planner',
        icon: <CalendarLtr24Regular />,
        path: '/projects',
      },
      {
        id: 'team',
        label: 'Team Management',
        icon: <People24Regular />,
        path: '/team',
      },
    ],
  },
  {
    id: 'super-admin',
    label: 'Super Admin',
    items: [
      {
        id: 'page-access',
        label: 'Acesso por Role',
        icon: <ShieldLock24Regular />,
        path: '/super-admin/page-access',
      },
      {
        id: 'user-roles',
        label: 'Roles por Usuário',
        icon: <PeopleCheckmark24Regular />,
        path: '/super-admin/user-roles',
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
      },
    ],
  },
];
