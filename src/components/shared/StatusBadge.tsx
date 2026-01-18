import { Badge, BadgeProps } from '@fluentui/react-components';
import { StatusType } from '../../types';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { color: BadgeProps['color'] }> = {
  active: { color: 'success' },
  inactive: { color: 'informative' },
  pending: { color: 'warning' },
  error: { color: 'danger' },
  warning: { color: 'warning' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge appearance="filled" color={statusConfig[status].color}>
      {displayLabel}
    </Badge>
  );
}
