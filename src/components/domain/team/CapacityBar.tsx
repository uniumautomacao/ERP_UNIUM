import { ProgressBar, Text, tokens } from '@fluentui/react-components';

interface CapacityBarProps {
  total: number;
  utilized: number;
  available: number;
  onLeave: number;
}

export function CapacityBar({ total, utilized, available, onLeave }: CapacityBarProps) {
  const utilizationPercent = (utilized / total) * 100;

  return (
    <div style={{ padding: '16px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: '4px' }}>
      <div className="flex items-center justify-between mb-2">
        <Text weight="semibold">Team Capacity</Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {utilizationPercent.toFixed(0)}% utilized
        </Text>
      </div>

      <ProgressBar value={utilizationPercent / 100} color={utilizationPercent > 90 ? 'error' : 'brand'} />

      <div className="flex gap-4 mt-2">
        <Text size={200}>
          <span style={{ color: tokens.colorPaletteGreenForeground1 }}>●</span> {available} available
        </Text>
        <Text size={200}>
          <span style={{ color: tokens.colorPaletteRedForeground1 }}>●</span> {onLeave} on leave
        </Text>
      </div>
    </div>
  );
}
