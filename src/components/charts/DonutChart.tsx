import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { tokens } from '@fluentui/react-components';

interface DonutChartData {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  valueFormatter?: (value: number) => string;
  onSegmentClick?: (data: DonutChartData) => void;
}

const DEFAULT_COLORS = [
  tokens.colorBrandBackground,
  tokens.colorPaletteBlueForeground2,
  tokens.colorPalettePurpleForeground2,
  tokens.colorPaletteTealForeground2,
  tokens.colorPaletteMagentaForeground2,
];

export function DonutChart({ data, height = 300, innerRadius = 60, outerRadius = 100, valueFormatter, onSegmentClick }: DonutChartProps) {
  // Formatação padrão de moeda brasileira se não fornecida
  const formatValue = valueFormatter || ((value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  );
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          onClick={(event: any, index: number) => {
            if (onSegmentClick && data && index >= 0 && index < data.length) {
              onSegmentClick(data[index]);
            }
          }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            borderRadius: '4px',
          }}
          formatter={(value: number) => formatValue(value)}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            fontSize: '12px',
            color: tokens.colorNeutralForeground2,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
