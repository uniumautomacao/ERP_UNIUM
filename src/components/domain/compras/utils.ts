/**
 * Utility functions for the Procurement Timeline component
 */

import {
  ProcurementTimelineItem,
  ClientGroup,
  TimelineConfig,
  ProdutoCompraItemInput,
  BarPosition,
  MonthHeader,
  WeekHeader,
  DateRange,
  MonthCell,
  FornecedorTimelineGroup,
  MonthlyPurchase,
  GroupingPeriod,
  PeriodCell,
  PeriodPurchase,
} from './types';

/**
 * Parse a date string to Date object
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate difference in days between two dates
 */
export function diffDays(date: Date, referenceDate: Date): number {
  return Math.ceil((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Subtract days from a date
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Transform ProdutoCompraItem[] from GestaoComprasPage to timeline format
 */
export function transformToTimelineItems(
  items: ProdutoCompraItemInput[],
  config: TimelineConfig
): ProcurementTimelineItem[] {
  return items
    .filter((item) => item.cliente) // Must have cliente for grouping
    .map((item) => {
      const dataLimite = parseDate(item.dataLimite);
      const entrega = parseDate(item.entrega);

      // Calculate order window start (dataLimite - buffer days)
      const orderWindowStart = dataLimite
        ? subDays(dataLimite, config.orderWindowBuffer)
        : null;

      // Transit starts when order should be placed (at dataLimite)
      const transitStart = dataLimite;

      // Transit ends at delivery
      const transitEnd = entrega;

      return {
        id: item.id,
        referencia: item.referencia ?? null,
        descricao: item.descricao ?? null,
        cliente: item.cliente!,
        fornecedorNome: item.fornecedorNome ?? null,
        quantidade: item.quantidade ?? null,
        valorTotal: item.valorTotal ?? null,
        dataLimite,
        entrega,
        orderWindowStart,
        transitStart,
        transitEnd,
        faixaPrazo: item.faixaPrazo ?? null,
        cotacaoId: item.cotacaoId ?? null,
        contemCotacao: item.contemCotacao ?? null,
      };
    });
}

/**
 * Group timeline items by cliente
 */
export function groupByClient(items: ProcurementTimelineItem[]): ClientGroup[] {
  const groups = new Map<string, ProcurementTimelineItem[]>();

  items.forEach((item) => {
    const existing = groups.get(item.cliente) || [];
    existing.push(item);
    groups.set(item.cliente, existing);
  });

  return Array.from(groups.entries())
    .map(([cliente, produtos]) => ({
      cliente,
      produtos: produtos.sort((a, b) => {
        // Sort by delivery date (earliest first)
        const dateA = a.entrega?.getTime() ?? Infinity;
        const dateB = b.entrega?.getTime() ?? Infinity;
        return dateA - dateB;
      }),
      totalProdutos: produtos.length,
      totalValor: produtos.reduce((sum, p) => sum + (p.valorTotal ?? 0), 0),
    }))
    .sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'));
}

/**
 * Calculate bar position as percentages for timeline rendering
 */
export function calculateBarPosition(
  segmentStart: Date | null,
  segmentEnd: Date | null,
  timelineStart: Date,
  totalDays: number
): BarPosition | null {
  if (!segmentStart || !segmentEnd) return null;

  const startOffset = Math.max(
    0,
    diffDays(segmentStart, timelineStart)
  );
  const endOffset = Math.min(
    totalDays,
    diffDays(segmentEnd, timelineStart)
  );

  const duration = endOffset - startOffset;
  if (duration <= 0) return null;

  return {
    left: `${(startOffset / totalDays) * 100}%`,
    width: `${(duration / totalDays) * 100}%`,
  };
}

/**
 * Calculate marker position for a single date (delivery marker)
 */
export function calculateMarkerPosition(
  date: Date | null,
  timelineStart: Date,
  totalDays: number
): string | null {
  if (!date) return null;

  const offset = diffDays(date, timelineStart);
  if (offset < 0 || offset > totalDays) return null;

  return `${(offset / totalDays) * 100}%`;
}

/**
 * Generate month and week headers for the timeline
 */
export function generateTimelineHeaders(
  startDate: Date,
  totalDays: number
): { months: MonthHeader[]; weeks: WeekHeader[] } {
  const months: MonthHeader[] = [];
  const weeks: WeekHeader[] = [];

  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();
  let monthStartDay = 0;
  let monthDays = 0;
  let weekNum = 1;

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    // Check for month change
    if (currentDate.getMonth() !== currentMonth || currentDate.getFullYear() !== currentYear) {
      // Push completed month
      months.push({
        label: new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        }),
        width: monthDays,
        startDay: monthStartDay,
      });

      // Start new month
      currentMonth = currentDate.getMonth();
      currentYear = currentDate.getFullYear();
      monthStartDay = day;
      monthDays = 1;
    } else {
      monthDays++;
    }

    // Generate weeks (every 7 days)
    if ((day + 1) % 7 === 0 || day === totalDays - 1) {
      const weekDays = day === totalDays - 1 ? ((day + 1) % 7) || 7 : 7;
      weeks.push({
        label: `S${weekNum}`,
        width: weekDays,
        startDay: day - weekDays + 1,
      });
      weekNum++;
    }
  }

  // Push final month if there are remaining days
  if (monthDays > 0) {
    months.push({
      label: new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      }),
      width: monthDays,
      startDay: monthStartDay,
    });
  }

  return { months, weeks };
}

/**
 * Format date for display in tooltips
 */
export function formatDateBR(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('pt-BR');
}

/**
 * Format currency for display
 */
export function formatCurrencyBR(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calculate total days between two dates
 */
export function calculateTotalDays(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get default timeline config based on current date
 */
export function getDefaultTimelineConfig(): TimelineConfig {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First of current month
  const endDate = new Date(today.getFullYear(), today.getMonth() + 4, 0); // End of 4 months from now

  return {
    startDate,
    endDate,
    orderWindowBuffer: 7,
  };
}

// ============================================
// Funções para Timeline por Fornecedor
// ============================================

/**
 * Get default date range for supplier timeline (full year)
 */
export function getDefaultSupplierDateRange(): DateRange {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), 0, 1),   // 1 de janeiro
    end: new Date(today.getFullYear(), 11, 31),  // 31 de dezembro
  };
}

/**
 * Generate array of months within a date range
 */
export function getMonthsInRange(start: Date, end: Date): MonthCell[] {
  const months: MonthCell[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    const mes = current.getMonth();
    const ano = current.getFullYear();
    const periodEnd = new Date(ano, mes + 1, 0); // Último dia do mês
    months.push({
      periodo: mes,
      ano,
      startDate: new Date(ano, mes, 1),
      endDate: periodEnd,
      label: current.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      key: `${ano}-${String(mes).padStart(2, '0')}`,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Get week number of the year (1-53)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get start of week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Sunday)
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Generate array of weeks within a date range
 */
export function getWeeksInRange(start: Date, end: Date): PeriodCell[] {
  const weeks: PeriodCell[] = [];
  const current = getWeekStart(new Date(start));
  
  while (current <= end) {
    const weekNum = getWeekNumber(current);
    const ano = current.getFullYear();
    const weekEnd = getWeekEnd(current);
    
    weeks.push({
      periodo: weekNum,
      ano,
      startDate: new Date(current),
      endDate: weekEnd,
      label: `S${weekNum}`,
      key: `${ano}-W${String(weekNum).padStart(2, '0')}`,
    });
    
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/**
 * Get quarter number (0-3) from month
 */
function getQuarter(month: number): number {
  return Math.floor(month / 3);
}

/**
 * Generate array of quarters within a date range
 */
export function getQuartersInRange(start: Date, end: Date): PeriodCell[] {
  const quarters: PeriodCell[] = [];
  const startQuarter = getQuarter(start.getMonth());
  const endQuarter = getQuarter(end.getMonth());
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const firstQ = year === startYear ? startQuarter : 0;
    const lastQ = year === endYear ? endQuarter : 3;

    for (let q = firstQ; q <= lastQ; q++) {
      const startMonth = q * 3;
      const endMonth = startMonth + 2;
      quarters.push({
        periodo: q,
        ano: year,
        startDate: new Date(year, startMonth, 1),
        endDate: new Date(year, endMonth + 1, 0), // Último dia do terceiro mês
        label: `T${q + 1}`,
        key: `${year}-Q${q}`,
      });
    }
  }

  return quarters;
}

/**
 * Get periods in range based on grouping period
 */
export function getPeriodsInRange(
  start: Date,
  end: Date,
  grouping: GroupingPeriod
): PeriodCell[] {
  switch (grouping) {
    case 'weekly':
      return getWeeksInRange(start, end);
    case 'quarterly':
      return getQuartersInRange(start, end);
    case 'monthly':
    default:
      return getMonthsInRange(start, end);
  }
}

/**
 * Transform items to timeline format for supplier view
 */
export function transformToSupplierTimelineItems(
  items: ProdutoCompraItemInput[]
): ProcurementTimelineItem[] {
  return items
    .filter((item) => item.fornecedorId || item.fornecedorNome) // Must have fornecedor
    .map((item) => {
      const dataLimite = parseDate(item.dataLimite);
      const entrega = parseDate(item.entrega);

      return {
        id: item.id,
        referencia: item.referencia ?? null,
        descricao: item.descricao ?? null,
        cliente: item.cliente ?? 'Sem cliente',
        fornecedorId: item.fornecedorId ?? null,
        fornecedorNome: item.fornecedorNome ?? null,
        quantidade: item.quantidade ?? null,
        valorTotal: item.valorTotal ?? null,
        precoUnitario: item.precoUnitario ?? null,
        dataLimite,
        entrega,
        orderWindowStart: null,
        transitStart: dataLimite,
        transitEnd: entrega,
        faixaPrazo: item.faixaPrazo ?? null,
        cotacaoId: item.cotacaoId ?? null,
        contemCotacao: item.contemCotacao ?? null,
      };
    });
}

/**
 * Get month key from a date
 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
}

/**
 * Get week key from a date
 */
function getWeekKey(date: Date): string {
  const weekNum = getWeekNumber(date);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get quarter key from a date
 */
function getQuarterKey(date: Date): string {
  const quarter = getQuarter(date.getMonth());
  return `${date.getFullYear()}-Q${quarter}`;
}

/**
 * Get period key from a date based on grouping
 */
function getPeriodKey(date: Date, grouping: GroupingPeriod): string {
  switch (grouping) {
    case 'weekly':
      return getWeekKey(date);
    case 'quarterly':
      return getQuarterKey(date);
    case 'monthly':
    default:
      return getMonthKey(date);
  }
}

/**
 * Group timeline items by supplier and period (week/month/quarter)
 * Uses dataLimite (data para fazer pedido) as reference date
 */
export function groupBySupplierAndPeriod(
  items: ProcurementTimelineItem[],
  dateRange: DateRange,
  grouping: GroupingPeriod = 'monthly'
): FornecedorTimelineGroup[] {
  const supplierMap = new Map<string, {
    fornecedorId: string;
    fornecedorNome: string;
    periodMap: Map<string, ProcurementTimelineItem[]>;
  }>();

  // Filter items within date range and group by supplier
  items.forEach((item) => {
    // Use dataLimite as the reference date for grouping
    const refDate = item.dataLimite ?? item.entrega;
    if (!refDate) return;

    // Check if date is within range
    if (refDate < dateRange.start || refDate > dateRange.end) return;

    // Get supplier key (prefer ID, fallback to name)
    const supplierId = (item as any).fornecedorId || item.fornecedorNome || 'Sem fornecedor';
    const supplierName = item.fornecedorNome || 'Sem fornecedor';

    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        fornecedorId: supplierId,
        fornecedorNome: supplierName,
        periodMap: new Map(),
      });
    }

    const supplier = supplierMap.get(supplierId)!;
    const periodKey = getPeriodKey(refDate, grouping);

    if (!supplier.periodMap.has(periodKey)) {
      supplier.periodMap.set(periodKey, []);
    }
    supplier.periodMap.get(periodKey)!.push(item);
  });

  // Get all periods in range for consistent structure
  const allPeriods = getPeriodsInRange(dateRange.start, dateRange.end, grouping);

  // Convert to array format
  const groups: FornecedorTimelineGroup[] = Array.from(supplierMap.values())
    .map((supplier) => {
      const periodos: PeriodPurchase[] = allPeriods.map((periodCell) => {
        const periodKey = periodCell.key;
        const produtos = supplier.periodMap.get(periodKey) || [];
        const valor = produtos.reduce((sum, p) => sum + (p.valorTotal ?? 0), 0);
        const quantidade = produtos.reduce((sum, p) => sum + (p.quantidade ?? 0), 0);

        return {
          periodo: periodCell.periodo,
          ano: periodCell.ano,
          startDate: periodCell.startDate,
          endDate: periodCell.endDate,
          valor,
          quantidade,
          produtos,
        };
      });

      const totalGeral = periodos.reduce((sum, m) => sum + m.valor, 0);
      const totalQuantidade = periodos.reduce((sum, m) => sum + m.quantidade, 0);

      return {
        fornecedorId: supplier.fornecedorId,
        fornecedorNome: supplier.fornecedorNome,
        periodos,
        totalGeral,
        totalQuantidade,
      };
    })
    // Sort by total value (highest first)
    .sort((a, b) => b.totalGeral - a.totalGeral);

  return groups;
}

/**
 * Group timeline items by supplier and month
 * Uses dataLimite (data para fazer pedido) as reference date
 * @deprecated Use groupBySupplierAndPeriod instead
 */
export function groupBySupplierAndMonth(
  items: ProcurementTimelineItem[],
  dateRange: DateRange
): FornecedorTimelineGroup[] {
  return groupBySupplierAndPeriod(items, dateRange, 'monthly');
}

/**
 * Format currency in compact form (e.g., "R$ 45k", "R$ 1.2M")
 */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

/**
 * Calculate color intensity based on value relative to max
 */
export function getValueIntensity(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.min(1, value / maxValue);
}
