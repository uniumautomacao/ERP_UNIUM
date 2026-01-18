import { ReactNode } from 'react';

// KPI Data
export interface KPIData {
  label: string;
  value: string | number;
  trend?: number; // percentual, positivo ou negativo
  trendLabel?: string;
}

// Chart Data
export interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
  [key: string]: any;
}

// Inventory
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  location: string;
  lastUpdated: string;
  unitPrice: number;
}

// Projects
export interface Project {
  id: string;
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  status: 'on_track' | 'at_risk' | 'blocked' | 'complete';
  phases: Phase[];
}

export interface Phase {
  id: string;
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  name: string;
  progress: number;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
  assignee?: string;
  isMilestone?: boolean;
  dependencies?: string[];
}

// Team
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away' | 'on_leave';
  capacity: number; // 0-100
  activeTasks: number;
  completedThisWeek: number;
}

// Activity
export interface Activity {
  id: string;
  type: 'email' | 'call' | 'task' | 'note' | 'meeting';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

// Reports
export interface ReportTemplate {
  id: string;
  name: string;
  icon: string;
  lastGenerated: string;
  description: string;
}

export interface RecentExport {
  id: string;
  filename: string;
  format: 'pdf' | 'xlsx' | 'csv';
  size: string;
  generatedAt: string;
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  requiredRoles?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

// Status Types
export type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'warning';
