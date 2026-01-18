import { Card, Text, tokens } from '@fluentui/react-components';
import { ArrowTrending24Filled, ArrowDown24Filled, ArrowRight24Filled } from '@fluentui/react-icons';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
}

export function KPICard({ label, value, trend, trendLabel }: KPICardProps) {
  const getTrendColor = () => {
    if (trend === undefined) return tokens.colorNeutralForeground3;
    if (trend > 0) return tokens.colorPaletteGreenForeground1;
    if (trend < 0) return tokens.colorPaletteRedForeground1;
    return tokens.colorNeutralForeground3;
  };

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <ArrowTrending24Filled />;
    if (trend < 0) return <ArrowDown24Filled />;
    return <ArrowRight24Filled />;
  };

  return (
    <Card style={{ minWidth: 200, padding: 16 }}>
      <Text
        size={200}
        weight="medium"
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: tokens.colorNeutralForeground3,
          display: 'block',
        }}
      >
        {label}
      </Text>

      <Text size={800} weight="bold" block style={{ marginTop: 8 }}>
        {value}
      </Text>

      {trend !== undefined && (
        <div className="flex items-center gap-1" style={{ marginTop: 8 }}>
          <div style={{ color: getTrendColor() }}>{getTrendIcon()}</div>
          <Text size={300} style={{ color: getTrendColor() }}>
            {Math.abs(trend)}% {trendLabel || ''}
          </Text>
        </div>
      )}
    </Card>
  );
}
