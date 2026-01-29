/**
 * ProcurementTimelineRow - Individual product row with timeline bars
 */

import { useMemo } from 'react';
import { Tooltip, Text, tokens } from '@fluentui/react-components';
import { TimelineRowProps } from './types';
import { calculateBarPosition, calculateMarkerPosition, formatDateBR, formatCurrencyBR } from './utils';

const ROW_HEIGHT = 40;
const BAR_HEIGHT = 20;
const BAR_TOP_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

/**
 * Mapping of faixaPrazo values to transit colors
 * Based on urgency level for ordering
 */
const FAIXA_COLORS: Record<number, string> = {
  100000000: tokens.colorPaletteRedBackground2,      // Atrasado (overdue)
  100000001: tokens.colorPaletteYellowBackground2,   // Pedir agora (order now)
  100000007: tokens.colorPaletteBlueBackground2,         // 7 dias
  100000030: tokens.colorPaletteGreenBackground2,    // 30 dias
  100000099: tokens.colorNeutralBackground3,         // Futuro (future)
};

const DEFAULT_TRANSIT_COLOR = tokens.colorNeutralBackground3;

export function ProcurementTimelineRow({
  item,
  timelineStart,
  timelineEnd,
  totalDays,
  onClick,
  isSelected,
}: TimelineRowProps) {
  // Calculate bar positions
  const orderWindowPos = useMemo(
    () => calculateBarPosition(item.orderWindowStart, item.transitStart, timelineStart, totalDays),
    [item.orderWindowStart, item.transitStart, timelineStart, totalDays]
  );

  const transitPos = useMemo(
    () => calculateBarPosition(item.transitStart, item.transitEnd, timelineStart, totalDays),
    [item.transitStart, item.transitEnd, timelineStart, totalDays]
  );

  const deliveryPos = useMemo(
    () => calculateMarkerPosition(item.entrega, timelineStart, totalDays),
    [item.entrega, timelineStart, totalDays]
  );

  // Get transit color based on faixaPrazo
  const transitColor = item.faixaPrazo !== null
    ? FAIXA_COLORS[item.faixaPrazo] || DEFAULT_TRANSIT_COLOR
    : DEFAULT_TRANSIT_COLOR;

  // Tooltip content
  const tooltipContent = useMemo(
    () => (
      <div className="flex flex-col gap-1" style={{ padding: '4px' }}>
        <Text weight="semibold" size={300}>
          {item.referencia || item.descricao || 'Item'}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Fornecedor: {item.fornecedorNome || '-'}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Data limite: {formatDateBR(item.dataLimite)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Entrega: {formatDateBR(item.entrega)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Qtd: {item.quantidade ?? 0} | {formatCurrencyBR(item.valorTotal)}
        </Text>
        {item.contemCotacao && (
          <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
            Com cotacao
          </Text>
        )}
      </div>
    ),
    [item]
  );

  // Check if we have any visible elements
  const hasVisibleElements = orderWindowPos || transitPos || deliveryPos;

  return (
    <Tooltip
      content={tooltipContent}
      relationship="description"
      positioning="above"
      withArrow
    >
      <div
        className="cursor-pointer"
        style={{
          height: `${ROW_HEIGHT}px`,
          position: 'relative',
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: isSelected
            ? tokens.colorNeutralBackground1Selected
            : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1Hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Order Window Segment (gray) */}
        {orderWindowPos && (
          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_OFFSET}px`,
              left: orderWindowPos.left,
              width: orderWindowPos.width,
              height: `${BAR_HEIGHT}px`,
              backgroundColor: tokens.colorNeutralBackground4,
              borderRadius: transitPos ? '4px 0 0 4px' : '4px',
              zIndex: 1,
            }}
          />
        )}

        {/* Transit Segment (colored by urgency) */}
        {transitPos && (
          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_OFFSET}px`,
              left: transitPos.left,
              width: transitPos.width,
              height: `${BAR_HEIGHT}px`,
              backgroundColor: transitColor,
              borderRadius: orderWindowPos ? '0 4px 4px 0' : '4px',
              zIndex: 2,
            }}
          />
        )}

        {/* Delivery Date Marker (vertical line) */}
        {deliveryPos && (
          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_OFFSET - 2}px`,
              left: deliveryPos,
              width: '3px',
              height: `${BAR_HEIGHT + 4}px`,
              backgroundColor: tokens.colorBrandForeground1,
              borderRadius: '1px',
              zIndex: 5,
              transform: 'translateX(-1.5px)', // Center the marker on the date
            }}
          />
        )}

        {/* Fallback indicator when no dates are visible */}
        {!hasVisibleElements && (
          <div
            style={{
              position: 'absolute',
              top: `${BAR_TOP_OFFSET}px`,
              left: '8px',
              height: `${BAR_HEIGHT}px`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              Datas fora do periodo
            </Text>
          </div>
        )}
      </div>
    </Tooltip>
  );
}
