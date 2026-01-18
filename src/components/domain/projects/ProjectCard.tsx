import { Card, Text, ProgressBar, Badge, tokens } from '@fluentui/react-components';
import { Project } from '../../../types';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

const statusConfig: Record<Project['status'], { color: 'success' | 'warning' | 'danger' | 'informative'; label: string }> = {
  on_track: { color: 'success', label: 'On Track' },
  at_risk: { color: 'warning', label: 'At Risk' },
  blocked: { color: 'danger', label: 'Blocked' },
  complete: { color: 'informative', label: 'Complete' },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusInfo = statusConfig[project.status];

  return (
    <Card
      className="card-interactive"
      style={{ padding: '16px', cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(project)}
    >
      <div className="flex items-start justify-between mb-3">
        <Text weight="semibold" size={400}>
          {project.name}
        </Text>
        <Badge appearance="filled" color={statusInfo.color}>
          {statusInfo.label}
        </Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <Text size={200}>Progress</Text>
          <Text size={200} weight="semibold">
            {project.progress}%
          </Text>
        </div>
        <ProgressBar value={project.progress / 100} />
      </div>

      <div className="flex gap-4">
        <div>
          <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
            START
          </Text>
          <Text size={200} block>
            {new Date(project.startDate).toLocaleDateString('pt-BR')}
          </Text>
        </div>
        <div>
          <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
            END
          </Text>
          <Text size={200} block>
            {new Date(project.endDate).toLocaleDateString('pt-BR')}
          </Text>
        </div>
        <div>
          <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
            PHASES
          </Text>
          <Text size={200} block>
            {project.phases.length}
          </Text>
        </div>
      </div>
    </Card>
  );
}
