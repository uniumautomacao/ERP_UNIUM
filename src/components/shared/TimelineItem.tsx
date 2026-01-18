import { Text, tokens } from '@fluentui/react-components';
import { ReactNode } from 'react';

interface TimelineItemProps {
  icon: ReactNode;
  timestamp: string;
  title: string;
  description?: string;
  user?: string;
  isLast?: boolean;
}

export function TimelineItem({ icon, timestamp, title, description, user, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      {/* Icon with connector line */}
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: tokens.colorBrandBackground2,
            color: tokens.colorBrandForeground1,
          }}
        >
          {icon}
        </div>
        {!isLast && (
          <div
            className="flex-grow my-1"
            style={{
              width: '2px',
              minHeight: '40px',
              backgroundColor: tokens.colorNeutralStroke2,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-grow pb-4">
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {timestamp}
        </Text>
        <Text weight="semibold" block>
          {title}
        </Text>
        {description && (
          <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
            {description}
          </Text>
        )}
        {user && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            By: {user}
          </Text>
        )}
      </div>
    </div>
  );
}
