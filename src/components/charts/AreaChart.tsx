import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '@fluentui/react-components';
import { ChartDataPoint } from '../../types';

interface AreaChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export function AreaChart({ data, dataKey, xAxisKey = 'date', height = 300, color, valueFormatter }: AreaChartProps) {
  const chartColor = color || tokens.colorBrandBackground;
  
  // Formatação padrão de moeda brasileira se não fornecida
  const formatValue = valueFormatter || ((value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.colorNeutralStroke2} />
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
        <Tooltip
          contentStyle={{
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            borderRadius: '4px',
          }}
          formatter={(value: number) => formatValue(value)}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={chartColor}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
