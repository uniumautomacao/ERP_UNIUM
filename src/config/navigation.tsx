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
  Board24Regular,
  QrCode24Regular,
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
    description: 'Gerencie o cronograma e linha do tempo das instalações',
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
    id: 'vistorias',
    label: 'Vistorias',
    description: 'Contagem cíclica e auditorias de estoque',
    items: [
      {
        id: 'contagem-estoque',
        label: 'Contagem de Estoque',
        icon: <QrCode24Regular />,
        path: '/vistorias/contagem',
      },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    description: 'Gerencie logística e transporte',
    items: [
      {
        id: 'rmas',
        label: 'Quadro de RMAs',
        icon: <Board24Regular />,
        path: '/rmas',
      }
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    description: 'Gerencie cadastros e configurações básicas',
    items: [
      {
        id: 'dispositivos-io',
        label: 'Dispositivos IO',
        icon: <DeveloperBoard24Regular />,
        path: '/dispositivos-io',
      },
    ],
  },
  {
    id: 'super-admin',
    label: 'Super Admin',
    description: 'Configurações avançadas de acesso e administração',
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
    description: 'Ferramentas e páginas de desenvolvimento',
    items: [
      {
        id: 'dev-page',
        label: 'Dev Page',
        icon: <DeveloperBoard24Regular />,
        path: '/dev',
      },
      {
        id: 'dev-qrcode',
        label: 'Leitor QR Code',
        icon: <QrCode24Regular />,
        path: '/dev/qrcode',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Template - Analytics',
    description: 'Visualize dados e métricas do seu negócio',
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
      }
    ]
  },
  {
    id: 'operations',
    label: 'Template - Operations',
    description: 'Gerencie operações e recursos',
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
      }
    ]
  }
];
