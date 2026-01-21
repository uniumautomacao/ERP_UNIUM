import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { tokens } from '@fluentui/react-components';
import { ChartDataPoint } from '../../types';

interface BarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  horizontal?: boolean;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  onBarClick?: (data: ChartDataPoint) => void;
}

export function BarChart({ data, dataKey, xAxisKey = 'date', height = 300, horizontal = false, colors, valueFormatter, onBarClick }: BarChartProps) {
  const defaultColors = [
    tokens.colorBrandBackground,
    tokens.colorPaletteBlueForeground2,
    tokens.colorPalettePurpleForeground2,
    tokens.colorPaletteTealForeground2,
    tokens.colorPaletteMagentaForeground2,
  ];

  const chartColors = colors || defaultColors;
  
  // Formatação padrão de moeda brasileira se não fornecida
  const formatValue = valueFormatter || ((value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 30, left: horizontal ? 100 : 80, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
        {horizontal ? (
          <>
            <XAxis 
              type="number"
              stroke={tokens.colorNeutralForeground3}
              style={{ fontSize: '12px' }}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke={tokens.colorNeutralForeground3}
              style={{ fontSize: '12px' }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke={tokens.colorNeutralForeground3}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={tokens.colorNeutralForeground3}
              style={{ fontSize: '12px' }}
              tickFormatter={formatValue}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            borderRadius: '4px',
          }}
          formatter={(value: number) => formatValue(value)}
        />
        <Bar 
          dataKey={dataKey} 
          radius={[4, 4, 0, 0]}
          style={{ cursor: onBarClick ? 'pointer' : 'default' }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={chartColors[index % chartColors.length]}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              onClick={() => {
                if (onBarClick) {
                  onBarClick(entry);
                }
              }}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
