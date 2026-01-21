import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { tokens } from '@fluentui/react-components';
import { ChartDataPoint } from '../../types';

// Componente customizado para dot com suporte a onClick
const CustomDot = (props: any) => {
  const { cx, cy, stroke, fill, r, payload, onClick, dataKey } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r || 4}
      stroke={stroke}
      fill={fill}
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick && payload) {
          onClick(payload, { dataKey });
        }
      }}
    />
  );
};

interface LineChartProps {
  data: ChartDataPoint[];
  lines: {
    dataKey: string;
    name?: string;
    color?: string;
  }[];
  xAxisKey?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  onPointClick?: (data: ChartDataPoint, meta: { dataKey: string }) => void;
}

export function LineChart({ data, lines, xAxisKey = 'date', height = 300, valueFormatter, onPointClick }: LineChartProps) {
  const defaultColors = [
    tokens.colorBrandBackground,
    tokens.colorPaletteBlueForeground2,
    tokens.colorPalettePurpleForeground2,
    tokens.colorPaletteTealForeground2,
  ];
  
  // Formatação padrão de moeda brasileira se não fornecida
  const formatValue = valueFormatter || ((value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart 
        data={data} 
        margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
      >
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
        <Legend
          wrapperStyle={{
            fontSize: '12px',
            color: tokens.colorNeutralForeground2,
          }}
        />
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || defaultColors[index % defaultColors.length]}
            strokeWidth={2}
            dot={(props: any) => (
              <CustomDot
                {...props}
                dataKey={line.dataKey}
                onClick={onPointClick}
              />
            )}
            activeDot={(props: any) => (
              <CustomDot
                {...props}
                r={6}
                dataKey={line.dataKey}
                onClick={onPointClick}
              />
            )}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
