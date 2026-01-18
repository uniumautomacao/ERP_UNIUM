// Types for "Uso do Instalador (Semana)" component
// Inspired by MS Project Resource Usage view

/**
 * Cores disponíveis para identificação de instaladores/duplas
 */
export type InstallerColor =
  | 'white'
  | 'lightBlue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'lightGreen'
  | 'darkGreen'
  | 'violet'
  | 'purple'
  | 'red'
  | 'blue'
  | 'brown'
  | 'pink'
  | 'cyan'
  | 'gray';

/**
 * Mapeamento de cores para valores CSS
 * primary: cor sólida para indicadores
 * background: cor pastel suave para fundo das linhas (estilo planilha Excel)
 */
export const InstallerColorMap: Record<InstallerColor, { primary: string; background: string; emoji: string }> = {
  white: { primary: '#B0B0B0', background: '#F5F5F5', emoji: '⚪' },
  lightBlue: { primary: '#4FC3F7', background: '#E1F5FE', emoji: '🔵' },
  green: { primary: '#4CAF50', background: '#C8E6C9', emoji: '✅' },
  yellow: { primary: '#FBC02D', background: '#FFF9C4', emoji: '🟡' },
  orange: { primary: '#FF9800', background: '#FFE0B2', emoji: '🟠' },
  lightGreen: { primary: '#8BC34A', background: '#DCEDC8', emoji: '🟢' },
  darkGreen: { primary: '#2E7D32', background: '#A5D6A7', emoji: '🟤' },
  violet: { primary: '#7C4DFF', background: '#E8E0FF', emoji: '🟣' },
  purple: { primary: '#9C27B0', background: '#F3E5F5', emoji: '🟪' },
  red: { primary: '#F44336', background: '#FFCDD2', emoji: '🔴' },
  blue: { primary: '#2196F3', background: '#BBDEFB', emoji: '🔵' },
  brown: { primary: '#795548', background: '#D7CCC8', emoji: '🟤' },
  pink: { primary: '#E91E63', background: '#F8BBD9', emoji: '🩷' },
  cyan: { primary: '#00BCD4', background: '#B2EBF2', emoji: '🩵' },
  gray: { primary: '#607D8B', background: '#CFD8DC', emoji: '⚫' },
};

/**
 * Tipo de atividade
 */
export type ActivityType = 
  | 'installation'    // Instalação
  | 'travel'          // Deslocamento
  | 'technicalVisit'  // Visita técnica
  | 'materialPickup'  // Retirada de material
  | 'maintenance'     // Manutenção
  | 'lunch'           // Almoço estendido
  | 'other';          // Outros

/**
 * Passos do modal para nova atividade
 */
export const ModalSteps = {
    INITIAL: 'INITIAL',
    PROJECT_SELECTION: 'PROJECT_SELECTION',
    ORDER_SELECTION: 'ORDER_SELECTION',
    EMPLOYEE_SELECTION: 'EMPLOYEE_SELECTION',
    FORM: 'FORM'
} as const;

export type ModalStep = typeof ModalSteps[keyof typeof ModalSteps];

/**
 * Status da atividade
 */
export type ActivityStatus = 
  | 'scheduled'   // Agendado
  | 'inProgress'  // Em andamento
  | 'completed'   // Concluído
  | 'cancelled';  // Cancelado

/**
 * Ícones para tipos de atividade
 */
export const ActivityTypeIcons: Record<ActivityType, string> = {
  installation: '📋',
  travel: '🚗',
  technicalVisit: '🏗️',
  materialPickup: '📦',
  maintenance: '🔧',
  lunch: '🍽️',
  other: '📌',
};

/**
 * Atividade/alocação de um instalador em um projeto
 */
export interface Activity {
  id: string;
  projectId: string;
  projectName: string;
  installerId: string;
  installerName?: string;         // Nome do colaborador
  date: Date;
  startTime: string;              // "08:00"
  endTime: string;                // "12:00"
  hours: number;                  // Duração em horas
  type: ActivityType;
  status: ActivityStatus;
  raw_status?: string;            // Status raw do Dataverse (para validação)
  address?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  materials?: string[];
  isFullDay?: boolean;            // Ocupa o dia inteiro
  // Campos adicionais do Dataverse
  ordemDeServico?: string;        // Identificador da OS
  descricao?: string;             // Descrição da atividade
  descricaoColaborador?: string;  // Descrição do colaborador
  situacao?: string;              // Situação (texto formatado)
  iniciadaEm?: Date;              // Data/hora de início real
  completadaEm?: Date;            // Data/hora de conclusão
}

/**
 * Item do checklist
 */
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Projeto
 */
export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
}

/**
 * Instalador
 */
export interface Installer {
  id: string;
  name: string;
  color: InstallerColor;
  weeklyCapacity: number;   // Capacidade em horas (padrão 48)
  teamId?: string;          // ID da dupla/equipe
  isActive: boolean;
}

/**
 * Dupla/Equipe de instaladores
 */
export interface Team {
  id: string;
  name: string;
  installerIds: string[];
  color: InstallerColor;
}

/**
 * Dados agregados por dia para um instalador (linha PAI)
 */
export interface DailyHours {
  date: Date;
  dayOfWeek: number;        // 0 = Domingo, 1 = Segunda...
  totalHours: number;
  hasOverload: boolean;     // > 8h
  hasCriticalOverload: boolean; // > 12h
  hasConflict: boolean;     // Múltiplas atividades full-day
  activities: Activity[];
}

/**
 * Dados de um projeto agrupado para exibição (linha FILHA)
 */
export interface ProjectRow {
  projectId: string;
  projectName: string;
  type: ActivityType;
  hoursByDay: Map<string, number>; // key = "YYYY-MM-DD", value = hours
  activities: Activity[];
}

/**
 * Linha de resumo "Outros" quando há mais de 4 projetos
 */
export interface OthersRow {
  projectCount: number;
  hoursByDay: Map<string, number>;
  activities: Activity[];
}

/**
 * Dados completos de um instalador para exibição na grid
 */
export interface InstallerGridData {
  installer: Installer;
  isExpanded: boolean;
  totalAllocatedHours: number;
  dailyHours: DailyHours[];     // 6 dias (Seg-Sáb)
  projectRows: ProjectRow[];     // Projetos individuais (max 4)
  othersRow?: OthersRow;         // Agrupamento de projetos extras
  travelRow?: ProjectRow;        // Linha de deslocamento/reserva
  hasAnyActivity: boolean;
  capacityPercentage: number;    // 0-100+
}

/**
 * Configuração da semana atual
 */
export interface WeekConfig {
  startDate: Date;           // Segunda-feira
  endDate: Date;             // Sábado
  days: WeekDay[];
}

/**
 * Dia da semana para exibição no cabeçalho
 */
export interface WeekDay {
  date: Date;
  dayOfWeek: number;
  label: string;             // "SEG", "TER", etc.
  fullLabel: string;         // "Segunda-feira"
  formattedDate: string;     // "06/01"
  isToday: boolean;
}

/**
 * Estado do painel de detalhes
 */
export interface DetailPanelState {
  isOpen: boolean;
  activity?: Activity;
  project?: Project;
  installer?: Installer;
  mode: 'view' | 'edit' | 'create';
}

/**
 * Props do componente principal
 */
export interface UsoInstaladorProps {
  // Dados
  installers?: Installer[];
  activities?: Activity[];
  projects?: Project[];
  teams?: Team[];
  
  // Configuração
  initialWeekStart?: Date;
  defaultExpanded?: boolean;
  maxProjectsPerInstaller?: number;
  
  // Callbacks
  onActivityClick?: (activity: Activity) => void;
  onActivityCreate?: (data: Partial<Activity>) => void;
  onActivityUpdate?: (activity: Activity) => void;
  onActivityDelete?: (activityId: string) => void;
  onWeekChange?: (startDate: Date) => void;
}

/**
 * Dias da semana em português
 */
export const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
export const WEEKDAY_FULL_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/**
 * Interface para exibição de cartão de Ordem de Serviço
 * Contém informações detalhadas para seleção de OS
 */
export interface OrdemServicoCardProps {
  id: string;
  identificador: string;
  clienteNome: string;
  tipoOrdemServico?: string;
  produtos: {
    quantidade: number;
    referenciaProduto?: string;
    descricao?: string;
  }[];
  onSelect?: (id: string) => void;
}
