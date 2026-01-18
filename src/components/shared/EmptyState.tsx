import { Text, Button, tokens } from '@fluentui/react-components';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: tokens.colorNeutralForeground3,
          }}
        >
          {icon}
        </div>
      )}
      
      <Text size={600} weight="semibold" block style={{ marginBottom: '8px' }}>
        {title}
      </Text>
      
      {description && (
        <Text
          size={400}
          style={{
            color: tokens.colorNeutralForeground3,
            marginBottom: '24px',
            maxWidth: '400px',
          }}
        >
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button appearance="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
