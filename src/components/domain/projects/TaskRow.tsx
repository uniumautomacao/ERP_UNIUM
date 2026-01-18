import { Text, ProgressBar, Badge, tokens } from '@fluentui/react-components';
import { Task } from '../../../types';

interface TaskRowProps {
  task: Task;
  level?: number;
}

const statusConfig: Record<Task['status'], { color: 'success' | 'warning' | 'danger' | 'informative'; label: string }> = {
  complete: { color: 'success', label: 'Complete' },
  in_progress: { color: 'warning', label: 'In Progress' },
  not_started: { color: 'informative', label: 'Not Started' },
  blocked: { color: 'danger', label: 'Blocked' },
};

export function TaskRow({ task, level = 0 }: TaskRowProps) {
  const statusInfo = statusConfig[task.status];
  const paddingLeft = level * 20;

  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '12px',
        paddingLeft: `${12 + paddingLeft}px`,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      }}
    >
      {/* Task name */}
      <div style={{ flex: '2', minWidth: 0 }}>
        <Text size={300}>
          {task.isMilestone && '◆ '}
          {task.name}
        </Text>
        {task.assignee && (
          <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
            {task.assignee}
          </Text>
        )}
      </div>

      {/* Progress */}
      <div style={{ flex: '1', minWidth: '100px' }}>
        <div className="flex items-center gap-2">
          <ProgressBar value={task.progress / 100} style={{ flexGrow: 1 }} />
          <Text size={200}>{task.progress}%</Text>
        </div>
      </div>

      {/* Dates */}
      <div style={{ flex: '1', minWidth: '150px' }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {new Date(task.startDate).toLocaleDateString('pt-BR')} -{' '}
          {new Date(task.endDate).toLocaleDateString('pt-BR')}
        </Text>
      </div>

      {/* Status */}
      <div style={{ width: '120px' }}>
        <Badge appearance="filled" color={statusInfo.color}>
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  );
}
