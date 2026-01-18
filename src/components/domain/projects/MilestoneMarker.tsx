import { Tooltip, tokens } from '@fluentui/react-components';

interface MilestoneMarkerProps {
  label: string;
  date: string;
  completed?: boolean;
}

export function MilestoneMarker({ label, date, completed = false }: MilestoneMarkerProps) {
  return (
    <Tooltip content={`${label} - ${date}`} relationship="description">
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: completed
            ? tokens.colorPaletteGreenForeground1
            : tokens.colorBrandForeground1,
          transform: 'rotate(45deg)',
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
}
