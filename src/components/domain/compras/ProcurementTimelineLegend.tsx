/**
 * ProcurementTimelineLegend - Legend component explaining timeline bar meanings
 */

import { Text, tokens } from '@fluentui/react-components';

export function ProcurementTimelineLegend() {
  return (
    <div
      className="flex items-center gap-6 px-4 py-2"
      style={{
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground2,
        flexWrap: 'wrap',
      }}
    >
      {/* Order Window Legend */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: '20px',
            height: '12px',
            backgroundColor: tokens.colorNeutralBackground4,
            borderRadius: '2px',
          }}
        />
        <Text size={200}>Janela para pedido</Text>
      </div>

      {/* Transit Legend */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: '20px',
            height: '12px',
            backgroundColor: tokens.colorPaletteBlueBackground2,
            borderRadius: '2px',
          }}
        />
        <Text size={200}>Periodo de transito</Text>
      </div>

      {/* Delivery Marker Legend */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: '3px',
            height: '16px',
            backgroundColor: tokens.colorBrandForeground1,
            borderRadius: '1px',
          }}
        />
        <Text size={200}>Data de entrega</Text>
      </div>

      {/* Today Marker Legend */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: '3px',
            height: '16px',
            backgroundColor: tokens.colorPaletteRedForeground1,
            borderRadius: '1px',
          }}
        />
        <Text size={200}>Hoje</Text>
      </div>
    </div>
  );
}
