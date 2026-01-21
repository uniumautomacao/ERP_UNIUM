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
import { HomePage } from '../pages/HomePage';
import { TimelinePage } from '../pages/section0-installations/TimelinePage';
import { DispositivosIOPage } from '../pages/section-cadastros/DispositivosIOPage';
import { DashboardPage } from '../pages/section1-analytics/DashboardPage';
import { AnalyticsPage } from '../pages/section1-analytics/AnalyticsPage';
import { ReportsPage } from '../pages/section1-analytics/ReportsPage';
import { InventoryPage } from '../pages/section2-operations/InventoryPage';
import { ProjectPlannerPage } from '../pages/section2-operations/ProjectPlannerPage';
import { TeamManagementPage } from '../pages/section2-operations/TeamManagementPage';
import { RMAsKanbanPage } from '../pages/section2-operations/RMAsKanbanPage';
import { ContagemEstoqueMobilePage } from '../pages/section4-vistorias/ContagemEstoqueMobilePage';
import { ContagemEstoqueGestaoPage } from '../pages/section4-vistorias/ContagemEstoqueGestaoPage';
import { LeitorMercadoriasPage } from '../pages/section4-vistorias/LeitorMercadoriasPage';
import { SuperAdminPageAccessPage } from '../pages/section3-super-admin/SuperAdminPageAccessPage';
import { SuperAdminUserRolesPage } from '../pages/section3-super-admin/SuperAdminUserRolesPage';
import { DevPage } from '../pages/section3-dev/DevPage';
import { QrCodeScannerPage } from '../pages/section3-dev/QrCodeScannerPage';

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
        component: HomePage,
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
        component: TimelinePage,
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
        exact: true,
        component: ContagemEstoqueMobilePage,
      },
      {
        id: 'contagem-gestao',
        label: 'Gestão de Contagem',
        icon: <DataBarVertical24Regular />,
        path: '/vistorias/contagem/gestao',
        component: ContagemEstoqueGestaoPage,
      },
      {
        id: 'leitor-mercadorias',
        label: 'Leitor de Mercadorias',
        icon: <QrCode24Regular />,
        path: '/vistorias/leitor-mercadorias',
        component: LeitorMercadoriasPage,
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
        component: RMAsKanbanPage,
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
        component: DispositivosIOPage,
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
        component: SuperAdminPageAccessPage,
      },
      {
        id: 'user-roles',
        label: 'Roles por Usuário',
        icon: <PeopleCheckmark24Regular />,
        path: '/super-admin/user-roles',
        component: SuperAdminUserRolesPage,
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
        component: DevPage,
      },
      {
        id: 'dev-qrcode',
        label: 'Leitor QR Code',
        icon: <QrCode24Regular />,
        path: '/dev/qrcode',
        component: QrCodeScannerPage,
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
        component: DashboardPage,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <ChartMultiple24Regular />,
        path: '/analytics',
        component: AnalyticsPage,
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <DocumentBulletList24Regular />,
        path: '/reports',
        component: ReportsPage,
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
        component: InventoryPage,
      },
      {
        id: 'projects',
        label: 'Project Planner',
        icon: <CalendarLtr24Regular />,
        path: '/projects',
        component: ProjectPlannerPage,
      },
      {
        id: 'team',
        label: 'Team Management',
        icon: <People24Regular />,
        path: '/team',
        component: TeamManagementPage,
      }
    ]
  }
];
