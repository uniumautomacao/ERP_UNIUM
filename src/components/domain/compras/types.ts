/**
 * Types for the Procurement Timeline component
 * Timeline de Compras - Visualização Gantt Simplificada
 */

/**
 * Item individual na timeline de compras
 */
export interface ProcurementTimelineItem {
  id: string;
  referencia: string | null;
  descricao: string | null;
  cliente: string;
  fornecedorId?: string | null;
  fornecedorNome: string | null;
  quantidade: number | null;
  valorTotal: number | null;
  precoUnitario?: number | null;

  // Datas para posicionamento na timeline
  dataLimite: Date | null;        // Prazo para fazer pedido (fim da janela de pedido)
  entrega: Date | null;           // Data de entrega ao cliente

  // Campos calculados para renderização das barras
  orderWindowStart: Date | null;  // dataLimite - buffer (início da janela de pedido)
  transitStart: Date | null;      // = dataLimite (início do trânsito)
  transitEnd: Date | null;        // = entrega (fim do trânsito)

  // Classificação visual
  faixaPrazo: number | null;      // Para determinar cor da barra de trânsito
  cotacaoId: string | null;
  contemCotacao: boolean | null;
}

/**
 * Grupo de produtos agrupados por cliente/projeto
 */
export interface ClientGroup {
  cliente: string;
  produtos: ProcurementTimelineItem[];
  totalProdutos: number;
  totalValor: number;
}

/**
 * Configuração da timeline
 */
export interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  orderWindowBuffer: number;  // Dias antes de dataLimite para mostrar janela de pedido
}

/**
 * Props do componente principal ProcurementTimeline
 */
export interface ProcurementTimelineProps {
  items: ProdutoCompraItemInput[];
  onItemClick?: (item: ProcurementTimelineItem) => void;
  initialConfig?: Partial<TimelineConfig>;
}

/**
 * Input esperado do GestaoComprasPage (ProdutoCompraItem)
 * Interface mínima para não depender da definição interna da página
 */
export interface ProdutoCompraItemInput {
  id: string;
  referencia?: string | null;
  descricao?: string | null;
  cliente?: string | null;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  quantidade?: number | null;
  valorTotal?: number;
  precoUnitario?: number;
  dataLimite?: string | null;
  entrega?: string | null;
  faixaPrazo?: number | null;
  cotacaoId?: string | null;
  contemCotacao?: boolean | null;
}

/**
 * Props do componente de linha individual
 */
export interface TimelineRowProps {
  item: ProcurementTimelineItem;
  timelineStart: Date;
  timelineEnd: Date;
  totalDays: number;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Props do componente de header
 */
export interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

/**
 * Estrutura para header de mês
 */
export interface MonthHeader {
  label: string;
  width: number;  // em dias
  startDay: number;
}

/**
 * Estrutura para header de semana
 */
export interface WeekHeader {
  label: string;
  width: number;  // em dias
  startDay: number;
}

/**
 * Posição calculada para barra na timeline
 */
export interface BarPosition {
  left: string;   // porcentagem
  width: string;  // porcentagem
}

// ============================================
// Tipos para Timeline por Fornecedor
// ============================================

/**
 * Período de agrupamento para timeline
 */
export type GroupingPeriod = 'weekly' | 'monthly' | 'quarterly';

/**
 * Compra agregada por período (semanal, mensal ou trimestral)
 */
export interface PeriodPurchase {
  periodo: number;    // Número do período (semana: 1-53, mês: 0-11, trimestre: 0-3)
  ano: number;
  startDate: Date;    // Data de início do período
  endDate: Date;      // Data de fim do período
  valor: number;
  quantidade: number;
  produtos: ProcurementTimelineItem[];
}

/**
 * Compra mensal agregada por fornecedor (alias para compatibilidade)
 */
export type MonthlyPurchase = PeriodPurchase;

/**
 * Grupo de compras agrupadas por fornecedor
 */
export interface FornecedorTimelineGroup {
  fornecedorId: string;
  fornecedorNome: string;
  periodos: PeriodPurchase[];
  totalGeral: number;
  totalQuantidade: number;
}

/**
 * Dados para o modal de detalhes do período/fornecedor
 */
export interface SupplierMonthModalData {
  fornecedorId: string;
  fornecedorNome: string;
  periodo: number;
  ano: number;
  startDate: Date;
  endDate: Date;
  valor: number;
  produtos: ProcurementTimelineItem[];
}

/**
 * Range de datas para filtro da timeline
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Estrutura de período para renderização
 */
export interface PeriodCell {
  periodo: number;
  ano: number;
  startDate: Date;
  endDate: Date;
  label: string;
  key: string;
}

/**
 * Estrutura de mês para renderização (alias para compatibilidade)
 */
export type MonthCell = PeriodCell;

/**
 * Props do componente principal ProcurementTimeline (modo fornecedor)
 */
export interface SupplierTimelineProps {
  items: ProdutoCompraItemInput[];
  onMonthClick?: (data: SupplierMonthModalData) => void;
  initialDateRange?: DateRange;
}
