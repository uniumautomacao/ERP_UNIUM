import { Card, Text, Button } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { TimelineItem } from './TimelineItem';
import { Activity } from '../../types';

interface TimelineProps {
  activities: Activity[];
  title?: string;
  onAddClick?: () => void;
}

const activityIcons: Record<Activity['type'], React.ReactNode> = {
  email: '📧',
  call: '📞',
  task: '✓',
  note: '📝',
  meeting: '📅',
};

export function Timeline({ activities, title = 'Timeline', onAddClick }: TimelineProps) {
  return (
    <Card style={{ padding: 16 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Text size={500} weight="semibold">
          {title}
        </Text>
        {onAddClick && (
          <Button
            appearance="subtle"
            icon={<Add24Regular />}
            onClick={onAddClick}
          >
            Add Note
          </Button>
        )}
      </div>

      {/* Timeline items */}
      <div>
        {activities.map((activity, index) => (
          <TimelineItem
            key={activity.id}
            icon={activityIcons[activity.type]}
            timestamp={activity.timestamp}
            title={activity.title}
            description={activity.description}
            user={activity.user}
            isLast={index === activities.length - 1}
          />
        ))}
      </div>
    </Card>
  );
}
