import { Card, Avatar, Text, Badge, ProgressBar, Button, Divider, tokens } from '@fluentui/react-components';
import { TeamMember } from '../../../types';

interface TeamMemberCardProps {
  member: TeamMember;
  onViewProfile?: (member: TeamMember) => void;
}

const statusConfig: Record<TeamMember['status'], { color: 'success' | 'warning' | 'danger' | 'informative'; label: string }> = {
  available: { color: 'success', label: 'Available' },
  busy: { color: 'warning', label: 'Busy' },
  away: { color: 'informative', label: 'Away' },
  on_leave: { color: 'danger', label: 'On Leave' },
};

export function TeamMemberCard({ member, onViewProfile }: TeamMemberCardProps) {
  const statusInfo = statusConfig[member.status];
  const capacityColor = member.capacity > 90 ? 'error' : 'brand';

  return (
    <Card style={{ width: '240px', padding: '16px' }}>
      <div className="flex flex-col items-center text-center">
        <Avatar name={member.name} size={64} color="colorful" />
        <Text weight="semibold" size={400} style={{ marginTop: '12px' }}>
          {member.name}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {member.role}
        </Text>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <Badge appearance="filled" color={statusInfo.color} style={{ width: '100%', justifyContent: 'center' }}>
        {statusInfo.label}
      </Badge>

      <div style={{ marginTop: '16px' }}>
        <Text size={200} block style={{ marginBottom: '4px' }}>
          Capacity
        </Text>
        <div className="flex items-center gap-2">
          <ProgressBar
            value={member.capacity / 100}
            style={{ flexGrow: 1 }}
            color={capacityColor}
          />
          <Text size={200}>{member.capacity}%</Text>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Text size={200} block>
          📋 {member.activeTasks} Active Tasks
        </Text>
        <Text size={200} block>
          ✓ {member.completedThisWeek} Completed This Week
        </Text>
      </div>

      {onViewProfile && (
        <Button
          appearance="outline"
          style={{ marginTop: '16px', width: '100%' }}
          onClick={() => onViewProfile(member)}
        >
          View Profile
        </Button>
      )}
    </Card>
  );
}
