/**
 * ProcurementTimeline - Timeline de compras agrupada por fornecedor
 * Mostra valores mensais a serem gastos com cada fornecedor
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { Card, Text, Button, Input, tokens, Tooltip } from '@fluentui/react-components';
import {
  ChevronDown24Filled,
  ChevronRight24Filled,
  Search24Regular,
  Calendar24Regular,
} from '@fluentui/react-icons';
import {
  SupplierTimelineProps,
  DateRange,
  FornecedorTimelineGroup,
  MonthCell,
  SupplierMonthModalData,
} from './types';
import {
  transformToSupplierTimelineItems,
  groupBySupplierAndMonth,
  getDefaultSupplierDateRange,
  getMonthsInRange,
  formatCurrencyBR,
  formatCurrencyCompact,
  getValueIntensity,
} from './utils';
import { SupplierMonthModal } from './SupplierMonthModal';

// Layout constants
const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 80;
const LEFT_PANEL_WIDTH = 280;
const TIMELINE_MIN_HEIGHT = 500;
const MONTH_CELL_MIN_WIDTH = 80;

export function ProcurementTimeline({
  items,
  onMonthClick,
  initialDateRange,
}: SupplierTimelineProps) {
  // State
  const [dateRange, setDateRange] = useState<DateRange>(() => 
    initialDateRange ?? getDefaultSupplierDateRange()
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [modalData, setModalData] = useState<SupplierMonthModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Date range inputs
  const [startDateInput, setStartDateInput] = useState(() => 
    dateRange.start.toISOString().split('T')[0]
  );
  const [endDateInput, setEndDateInput] = useState(() => 
    dateRange.end.toISOString().split('T')[0]
  );

  // Refs for scroll synchronization
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Get months in range
  const monthsInRange = useMemo(
    () => getMonthsInRange(dateRange.start, dateRange.end),
    [dateRange]
  );

  // Transform and group data
  const timelineItems = useMemo(
    () => transformToSupplierTimelineItems(items),
    [items]
  );

  const supplierGroups = useMemo(() => {
    let groups = groupBySupplierAndMonth(timelineItems, dateRange);

    // Apply search filter
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase();
      groups = groups.filter((g) =>
        g.fornecedorNome.toLowerCase().includes(search)
      );
    }

    return groups;
  }, [timelineItems, dateRange, searchFilter]);

  // Calculate max value for color intensity
  const maxMonthValue = useMemo(() => {
    let max = 0;
    supplierGroups.forEach((group) => {
      group.meses.forEach((mes) => {
        if (mes.valor > max) max = mes.valor;
      });
    });
    return max;
  }, [supplierGroups]);

  // Handlers
  const toggleGroup = useCallback((fornecedorId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(fornecedorId)) {
        next.delete(fornecedorId);
      } else {
        next.add(fornecedorId);
      }
      return next;
    });
  }, []);

  const handleMonthClick = useCallback(
    (group: FornecedorTimelineGroup, monthCell: MonthCell) => {
      const monthData = group.meses.find(
        (m) => m.mes === monthCell.mes && m.ano === monthCell.ano
      );
      if (!monthData || monthData.produtos.length === 0) return;

      const data: SupplierMonthModalData = {
        fornecedorId: group.fornecedorId,
        fornecedorNome: group.fornecedorNome,
        mes: monthCell.mes,
        ano: monthCell.ano,
        valor: monthData.valor,
        produtos: monthData.produtos,
      };

      setModalData(data);
      setModalOpen(true);
      onMonthClick?.(data);
    },
    [onMonthClick]
  );

  const handleApplyDateRange = useCallback(() => {
    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
      setDateRange({ start, end });
    }
  }, [startDateInput, endDateInput]);

  // Scroll synchronization
  const handleLeftScroll = useCallback(() => {
    if (leftPanelRef.current && rightPanelRef.current) {
      rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  }, []);

  const handleRightScroll = useCallback(() => {
    if (leftPanelRef.current && rightPanelRef.current) {
      leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  }, []);

  // Get bar color based on value intensity
  const getBarColor = (value: number) => {
    const intensity = getValueIntensity(value, maxMonthValue);
    if (intensity === 0) return 'transparent';
    if (intensity > 0.7) return tokens.colorPaletteGreenBackground3;
    if (intensity > 0.4) return tokens.colorPaletteGreenBackground2;
    return tokens.colorPaletteGreenBackground1;
  };

  // Calculate content height
  const contentHeight = useMemo(() => {
    return Math.max(supplierGroups.length * ROW_HEIGHT, TIMELINE_MIN_HEIGHT - HEADER_HEIGHT);
  }, [supplierGroups]);

  // Total geral
  const totalGeral = useMemo(() => 
    supplierGroups.reduce((sum, g) => sum + g.totalGeral, 0),
    [supplierGroups]
  );

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Controls Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
        style={{
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground2,
        }}
      >
        <Input
          value={searchFilter}
          onChange={(_, data) => setSearchFilter(data.value)}
          placeholder="Filtrar fornecedor..."
          contentBefore={<Search24Regular />}
          style={{ width: '240px' }}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Calendar24Regular style={{ color: tokens.colorNeutralForeground3 }} />
          <Input
            type="date"
            value={startDateInput}
            onChange={(_, data) => setStartDateInput(data.value)}
            style={{ width: '140px' }}
          />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>até</Text>
          <Input
            type="date"
            value={endDateInput}
            onChange={(_, data) => setEndDateInput(data.value)}
            style={{ width: '140px' }}
          />
          <Button appearance="secondary" size="small" onClick={handleApplyDateRange}>
            Aplicar
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {supplierGroups.length} fornecedores
          </Text>
          <Text weight="semibold" size={300}>
            Total: {formatCurrencyBR(totalGeral)}
          </Text>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        className="flex"
        style={{ height: `${TIMELINE_MIN_HEIGHT}px`, overflow: 'hidden' }}
      >
        {/* Left Panel - Supplier Labels */}
        <div
          ref={leftPanelRef}
          onScroll={handleLeftScroll}
          style={{
            width: `${LEFT_PANEL_WIDTH}px`,
            minWidth: `${LEFT_PANEL_WIDTH}px`,
            borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: tokens.colorNeutralBackground2,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              height: `${HEADER_HEIGHT}px`,
              borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
              padding: '16px 12px',
              backgroundColor: tokens.colorNeutralBackground3,
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <Text weight="semibold">Fornecedor</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Valor no período
            </Text>
          </div>

          {/* Supplier Rows */}
          <div style={{ minHeight: contentHeight }}>
            {supplierGroups.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ height: '100px', padding: '16px' }}
              >
                <Text
                  size={200}
                  style={{ color: tokens.colorNeutralForeground3 }}
                >
                  {searchFilter
                    ? 'Nenhum fornecedor encontrado'
                    : 'Nenhum produto com fornecedor definido'}
                </Text>
              </div>
            ) : (
              supplierGroups.map((group) => (
                <div
                  key={group.fornecedorId}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    padding: '0 12px',
                    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                    backgroundColor: expandedGroups.has(group.fornecedorId)
                      ? tokens.colorNeutralBackground1Selected
                      : tokens.colorNeutralBackground1,
                  }}
                  onClick={() => toggleGroup(group.fornecedorId)}
                >
                  {expandedGroups.has(group.fornecedorId) ? (
                    <ChevronDown24Filled style={{ fontSize: '16px', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight24Filled style={{ fontSize: '16px', flexShrink: 0 }} />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <Text
                      weight="semibold"
                      size={300}
                      truncate
                      block
                      style={{ overflow: 'hidden' }}
                    >
                      {group.fornecedorNome}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      {formatCurrencyBR(group.totalGeral)}
                    </Text>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Monthly Bars */}
        <div
          ref={rightPanelRef}
          onScroll={handleRightScroll}
          className="flex-grow"
          style={{ overflow: 'auto', position: 'relative' }}
        >
          {/* Month Headers */}
          <div
            style={{
              display: 'flex',
              height: `${HEADER_HEIGHT}px`,
              borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
              backgroundColor: tokens.colorNeutralBackground3,
              position: 'sticky',
              top: 0,
              zIndex: 10,
              minWidth: `${monthsInRange.length * MONTH_CELL_MIN_WIDTH}px`,
            }}
          >
            {monthsInRange.map((monthCell) => (
              <div
                key={monthCell.key}
                style={{
                  flex: 1,
                  minWidth: `${MONTH_CELL_MIN_WIDTH}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '8px 4px',
                  borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
                }}
              >
                <Text size={300} weight="semibold" style={{ textTransform: 'capitalize' }}>
                  {monthCell.label}
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {monthCell.ano}
                </Text>
              </div>
            ))}
          </div>

          {/* Supplier Month Bars */}
          <div style={{ position: 'relative', minHeight: contentHeight, minWidth: `${monthsInRange.length * MONTH_CELL_MIN_WIDTH}px` }}>
            {supplierGroups.map((group) => (
              <div
                key={group.fornecedorId}
                style={{
                  display: 'flex',
                  height: `${ROW_HEIGHT}px`,
                  borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: expandedGroups.has(group.fornecedorId)
                    ? tokens.colorNeutralBackground1Selected
                    : tokens.colorNeutralBackground1,
                }}
              >
                {monthsInRange.map((monthCell) => {
                  const monthData = group.meses.find(
                    (m) => m.mes === monthCell.mes && m.ano === monthCell.ano
                  );
                  const valor = monthData?.valor ?? 0;
                  const hasValue = valor > 0;
                  const barColor = getBarColor(valor);

                  return (
                    <div
                      key={monthCell.key}
                      style={{
                        flex: 1,
                        minWidth: `${MONTH_CELL_MIN_WIDTH}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
                        cursor: hasValue ? 'pointer' : 'default',
                      }}
                      onClick={() => hasValue && handleMonthClick(group, monthCell)}
                    >
                      {hasValue && (
                        <Tooltip
                          content={
                            <div>
                              <Text weight="semibold" block>{group.fornecedorNome}</Text>
                              <Text block>{monthCell.label} {monthCell.ano}</Text>
                              <Text block>{formatCurrencyBR(valor)}</Text>
                              <Text size={200}>{monthData?.produtos.length ?? 0} produtos</Text>
                            </div>
                          }
                          relationship="label"
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '36px',
                              backgroundColor: barColor,
                              borderRadius: tokens.borderRadiusMedium,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
                              transition: 'transform 0.1s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                            }}
                          >
                            <Text
                              size={200}
                              weight="semibold"
                              style={{ color: tokens.colorNeutralForeground1 }}
                            >
                              {formatCurrencyCompact(valor)}
                            </Text>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-2"
        style={{
          borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground2,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: tokens.colorPaletteGreenBackground1,
                borderRadius: '4px',
                border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
              }}
            />
            <Text size={200}>Valor baixo</Text>
          </div>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: tokens.colorPaletteGreenBackground2,
                borderRadius: '4px',
                border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
              }}
            />
            <Text size={200}>Valor médio</Text>
          </div>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: tokens.colorPaletteGreenBackground3,
                borderRadius: '4px',
                border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
              }}
            />
            <Text size={200}>Valor alto</Text>
          </div>
        </div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Clique em uma célula para ver os produtos
        </Text>
      </div>

      {/* Modal */}
      <SupplierMonthModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalData(null);
        }}
        data={modalData}
      />
    </Card>
  );
}
