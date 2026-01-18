import {
  KPIData,
  ChartDataPoint,
  InventoryItem,
  Project,
  TeamMember,
  Activity,
  ReportTemplate,
  RecentExport,
} from '../types';

// KPIs principais
export const kpis: KPIData[] = [
  { label: 'Revenue', value: '$1,234,567', trend: 12.5, trendLabel: 'vs last month' },
  { label: 'Orders', value: '3,847', trend: 5.2, trendLabel: 'vs last month' },
  { label: 'Customers', value: '892', trend: 8.1, trendLabel: 'vs last month' },
  { label: 'Conversion', value: '4.2%', trend: -2.3, trendLabel: 'vs last month' },
];

// Revenue over time (30 dias)
export const revenueData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    value: Math.floor(30000 + Math.random() * 20000 + i * 500),
  };
});

// Sales by region
export const salesByRegion = [
  { name: 'North', value: 35 },
  { name: 'South', value: 28 },
  { name: 'East', value: 22 },
  { name: 'West', value: 15 },
];

// Top 5 products
export const topProducts = [
  { name: 'Widget Pro Max', value: 245000 },
  { name: 'Gadget Basic', value: 198000 },
  { name: 'Component Alpha', value: 156000 },
  { name: 'Assembly Kit Standard', value: 134000 },
  { name: 'Cable USB-C 2m', value: 112000 },
];

// Recent activities
export const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'email',
    title: 'Email sent to customer',
    description: 'Subject: Order confirmation #4521',
    timestamp: '10:30 AM',
    user: 'Maria Garcia',
  },
  {
    id: '2',
    type: 'call',
    title: 'Phone call completed',
    description: 'Duration: 5 min • Outcome: Scheduled follow-up',
    timestamp: '09:15 AM',
    user: 'John Smith',
  },
  {
    id: '3',
    type: 'task',
    title: 'Task completed: Review contract',
    description: 'Contract #2024-045 reviewed and approved',
    timestamp: 'Yesterday, 4:45 PM',
    user: 'Bruno Santos',
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Team standup meeting',
    description: 'Daily sync - 15 participants',
    timestamp: 'Yesterday, 9:00 AM',
    user: 'Ana Costa',
  },
  {
    id: '5',
    type: 'note',
    title: 'Note added to opportunity',
    description: 'Customer interested in enterprise plan',
    timestamp: 'Jan 15, 2:30 PM',
    user: 'Pedro Lima',
  },
];

// Inventory items (50+ items)
export const inventoryItems: InventoryItem[] = Array.from({ length: 60 }, (_, i) => {
  const categories = ['Electronics', 'Parts', 'Accessories', 'Kits', 'Tools'];
  const locations = ['Warehouse A', 'Warehouse B', 'Store 1', 'Store 2'];
  const quantity = Math.floor(Math.random() * 3000);
  const reorderPoint = 50;

  let status: InventoryItem['status'];
  if (quantity === 0) status = 'out_of_stock';
  else if (quantity <= reorderPoint) status = 'low_stock';
  else status = 'in_stock';

  return {
    id: `inv-${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    name: `Product ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
    category: categories[i % categories.length],
    quantity,
    reorderPoint,
    status,
    location: locations[i % locations.length],
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    unitPrice: Math.floor(Math.random() * 500) + 50,
  };
});

// Project with phases and tasks
export const project: Project = {
  id: 'proj-1',
  name: 'Project Alpha',
  progress: 45,
  startDate: '2025-01-01',
  endDate: '2025-04-30',
  status: 'on_track',
  phases: [
    {
      id: 'phase-1',
      name: 'Phase 1: Planning',
      progress: 90,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      tasks: [
        {
          id: 'task-1-1',
          name: 'Requirements Gathering',
          progress: 100,
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          status: 'complete',
          assignee: 'Bruno Santos',
        },
        {
          id: 'task-1-2',
          name: 'System Design',
          progress: 100,
          startDate: '2025-01-11',
          endDate: '2025-01-20',
          status: 'complete',
          assignee: 'Maria Garcia',
        },
        {
          id: 'task-1-3',
          name: 'Design Review',
          progress: 100,
          startDate: '2025-01-21',
          endDate: '2025-01-21',
          status: 'complete',
          isMilestone: true,
        },
      ],
    },
    {
      id: 'phase-2',
      name: 'Phase 2: Development',
      progress: 40,
      startDate: '2025-01-22',
      endDate: '2025-03-31',
      tasks: [
        {
          id: 'task-2-1',
          name: 'Backend Development',
          progress: 60,
          startDate: '2025-01-22',
          endDate: '2025-02-28',
          status: 'in_progress',
          assignee: 'João Silva',
        },
        {
          id: 'task-2-2',
          name: 'Frontend Development',
          progress: 40,
          startDate: '2025-02-01',
          endDate: '2025-03-15',
          status: 'in_progress',
          assignee: 'Ana Costa',
        },
        {
          id: 'task-2-3',
          name: 'Integration Testing',
          progress: 0,
          startDate: '2025-03-16',
          endDate: '2025-03-31',
          status: 'not_started',
          assignee: 'Rafael Souza',
        },
      ],
    },
    {
      id: 'phase-3',
      name: 'Phase 3: Deployment',
      progress: 0,
      startDate: '2025-04-01',
      endDate: '2025-04-30',
      tasks: [
        {
          id: 'task-3-1',
          name: 'User Acceptance Testing',
          progress: 0,
          startDate: '2025-04-01',
          endDate: '2025-04-15',
          status: 'not_started',
        },
        {
          id: 'task-3-2',
          name: 'Production Deployment',
          progress: 0,
          startDate: '2025-04-20',
          endDate: '2025-04-20',
          status: 'not_started',
          isMilestone: true,
        },
      ],
    },
  ],
};

// Team members (12 members)
export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Bruno Santos',
    email: 'bruno.santos@unium.com.br',
    role: 'Technical Manager',
    department: 'Engineering',
    status: 'available',
    capacity: 65,
    activeTasks: 5,
    completedThisWeek: 12,
  },
  {
    id: 'tm-2',
    name: 'Maria Garcia',
    email: 'maria.garcia@unium.com.br',
    role: 'UX Designer',
    department: 'Design',
    status: 'busy',
    capacity: 95,
    activeTasks: 8,
    completedThisWeek: 10,
  },
  {
    id: 'tm-3',
    name: 'João Silva',
    email: 'joao.silva@unium.com.br',
    role: 'Sr. Developer',
    department: 'Engineering',
    status: 'available',
    capacity: 55,
    activeTasks: 4,
    completedThisWeek: 15,
  },
  {
    id: 'tm-4',
    name: 'Ana Costa',
    email: 'ana.costa@unium.com.br',
    role: 'Developer',
    department: 'Engineering',
    status: 'on_leave',
    capacity: 0,
    activeTasks: 0,
    completedThisWeek: 0,
  },
  {
    id: 'tm-5',
    name: 'Pedro Lima',
    email: 'pedro.lima@unium.com.br',
    role: 'Backend Developer',
    department: 'Engineering',
    status: 'available',
    capacity: 70,
    activeTasks: 6,
    completedThisWeek: 8,
  },
  {
    id: 'tm-6',
    name: 'Carla Mendes',
    email: 'carla.mendes@unium.com.br',
    role: 'Frontend Developer',
    department: 'Engineering',
    status: 'available',
    capacity: 60,
    activeTasks: 5,
    completedThisWeek: 11,
  },
  {
    id: 'tm-7',
    name: 'Rafael Souza',
    email: 'rafael.souza@unium.com.br',
    role: 'QA Engineer',
    department: 'Engineering',
    status: 'busy',
    capacity: 85,
    activeTasks: 7,
    completedThisWeek: 9,
  },
  {
    id: 'tm-8',
    name: 'Julia Reis',
    email: 'julia.reis@unium.com.br',
    role: 'Project Manager',
    department: 'Management',
    status: 'available',
    capacity: 75,
    activeTasks: 6,
    completedThisWeek: 14,
  },
  {
    id: 'tm-9',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@unium.com.br',
    role: 'DevOps Engineer',
    department: 'Engineering',
    status: 'available',
    capacity: 50,
    activeTasks: 3,
    completedThisWeek: 7,
  },
  {
    id: 'tm-10',
    name: 'Fernanda Alves',
    email: 'fernanda.alves@unium.com.br',
    role: 'UI Designer',
    department: 'Design',
    status: 'away',
    capacity: 30,
    activeTasks: 2,
    completedThisWeek: 5,
  },
  {
    id: 'tm-11',
    name: 'Roberto Martins',
    email: 'roberto.martins@unium.com.br',
    role: 'Data Analyst',
    department: 'Management',
    status: 'available',
    capacity: 65,
    activeTasks: 4,
    completedThisWeek: 10,
  },
  {
    id: 'tm-12',
    name: 'Patricia Rocha',
    email: 'patricia.rocha@unium.com.br',
    role: 'Product Owner',
    department: 'Management',
    status: 'available',
    capacity: 80,
    activeTasks: 7,
    completedThisWeek: 13,
  },
];

// Report templates
export const reportTemplates: ReportTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Monthly Sales Report',
    icon: '📊',
    lastGenerated: 'Jan 15, 2025',
    description: 'Comprehensive sales analysis with trends and forecasts',
  },
  {
    id: 'tpl-2',
    name: 'Performance Dashboard',
    icon: '📈',
    lastGenerated: 'Jan 10, 2025',
    description: 'Team performance metrics and KPIs',
  },
  {
    id: 'tpl-3',
    name: 'Inventory Status',
    icon: '📋',
    lastGenerated: 'Jan 14, 2025',
    description: 'Current inventory levels and reorder alerts',
  },
  {
    id: 'tpl-4',
    name: 'Team Productivity',
    icon: '👥',
    lastGenerated: 'Jan 12, 2025',
    description: 'Task completion rates and capacity utilization',
  },
  {
    id: 'tpl-5',
    name: 'Financial Summary',
    icon: '💰',
    lastGenerated: 'Jan 08, 2025',
    description: 'Revenue, expenses, and profit margins',
  },
  {
    id: 'tpl-6',
    name: 'Customer Analytics',
    icon: '👤',
    lastGenerated: 'Jan 11, 2025',
    description: 'Customer acquisition, retention, and lifetime value',
  },
];

// Recent exports
export const recentExports: RecentExport[] = [
  {
    id: 'exp-1',
    filename: 'report_jan_2025.pdf',
    format: 'pdf',
    size: '2.3 MB',
    generatedAt: '2025-01-15 10:30',
  },
  {
    id: 'exp-2',
    filename: 'sales_q4_2024.xlsx',
    format: 'xlsx',
    size: '1.1 MB',
    generatedAt: '2025-01-10 14:20',
  },
  {
    id: 'exp-3',
    filename: 'inventory_dec.csv',
    format: 'csv',
    size: '456 KB',
    generatedAt: '2025-01-08 09:15',
  },
  {
    id: 'exp-4',
    filename: 'team_weekly.pdf',
    format: 'pdf',
    size: '890 KB',
    generatedAt: '2025-01-07 16:45',
  },
  {
    id: 'exp-5',
    filename: 'financial_summary.xlsx',
    format: 'xlsx',
    size: '1.8 MB',
    generatedAt: '2025-01-05 11:30',
  },
  {
    id: 'exp-6',
    filename: 'customer_data.csv',
    format: 'csv',
    size: '3.2 MB',
    generatedAt: '2025-01-03 13:00',
  },
  {
    id: 'exp-7',
    filename: 'project_status.pdf',
    format: 'pdf',
    size: '1.5 MB',
    generatedAt: '2024-12-28 15:20',
  },
  {
    id: 'exp-8',
    filename: 'monthly_report_dec.pdf',
    format: 'pdf',
    size: '2.7 MB',
    generatedAt: '2024-12-20 10:00',
  },
  {
    id: 'exp-9',
    filename: 'inventory_full.xlsx',
    format: 'xlsx',
    size: '4.1 MB',
    generatedAt: '2024-12-15 14:30',
  },
  {
    id: 'exp-10',
    filename: 'q4_analytics.csv',
    format: 'csv',
    size: '2.9 MB',
    generatedAt: '2024-12-10 09:45',
  },
];
