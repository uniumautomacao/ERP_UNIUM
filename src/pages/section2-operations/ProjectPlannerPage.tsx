import { useState } from 'react';
import { Button, tokens } from '@fluentui/react-components';
import {
  Add24Regular,
  Calendar24Regular,
  ArrowDownload24Regular,
  DataBarVertical24Regular,
  CalendarLtr24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { GanttChart } from '../../components/charts/GanttChart';
import { TaskRow } from '../../components/domain/projects/TaskRow';
import { project } from '../../data/mockData';

type ViewMode = 'list' | 'gantt' | 'calendar';

export function ProjectPlannerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');

  const primaryActions = [
    {
      id: 'new-task',
      label: 'New Task',
      icon: <Add24Regular />,
      onClick: () => console.log('New task'),
      appearance: 'primary' as const,
    },
    {
      id: 'new-milestone',
      label: 'Milestone',
      icon: <Calendar24Regular />,
      onClick: () => console.log('New milestone'),
    },
  ];

  const secondaryActions = [
    {
      id: 'import',
      label: 'Import',
      icon: <ArrowDownload24Regular />,
      onClick: () => console.log('Import'),
    },
    {
      id: 'list-view',
      label: 'List',
      icon: <DataBarVertical24Regular />,
      onClick: () => setViewMode('list'),
      appearance: viewMode === 'list' ? ('primary' as const) : ('subtle' as const),
    },
    {
      id: 'gantt-view',
      label: 'Gantt',
      icon: <CalendarLtr24Regular />,
      onClick: () => setViewMode('gantt'),
      appearance: viewMode === 'gantt' ? ('primary' as const) : ('subtle' as const),
    },
    {
      id: 'calendar-view',
      label: 'Calendar',
      icon: <Calendar24Regular />,
      onClick: () => setViewMode('calendar'),
      appearance: viewMode === 'calendar' ? ('primary' as const) : ('subtle' as const),
    },
  ];

  const overflowActions = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings24Regular />,
      onClick: () => console.log('Settings'),
    },
  ];

  return (
    <>
      <CommandBar
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
        overflowActions={overflowActions}
      />
      <PageHeader
        title="Project Planner"
        kpis={[
          { label: 'Progress', value: `${project.progress}%` },
          { label: 'Due', value: new Date(project.endDate).toLocaleDateString('pt-BR') },
        ]}
      />
      <PageContainer>
        {/* Toolbar */}
        {viewMode === 'gantt' && (
          <div className="flex items-center gap-3 mb-4">
            <Button appearance="subtle">Today</Button>
            <Button appearance="subtle" icon={<span>◀</span>}>
              Previous
            </Button>
            <Button appearance="subtle" icon={<span>▶</span>} iconPosition="after">
              Next
            </Button>
            <div className="flex gap-2 ml-4">
              <span style={{ color: tokens.colorNeutralForeground3 }}>Zoom:</span>
              <Button appearance="subtle" size="small">
                Day
              </Button>
              <Button appearance="primary" size="small">
                Week
              </Button>
              <Button appearance="subtle" size="small">
                Month
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {viewMode === 'gantt' && (
          <GanttChart
            phases={project.phases}
            startDate={new Date(project.startDate)}
            endDate={new Date(project.endDate)}
            height={600}
          />
        )}

        {viewMode === 'list' && (
          <div
            style={{
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {project.phases.map((phase) => (
              <div key={phase.id}>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: tokens.colorNeutralBackground3,
                    fontWeight: 600,
                    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                  }}
                >
                  {phase.name} ({phase.progress}%)
                </div>
                {phase.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} level={1} />
                ))}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div
            style={{
              height: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tokens.colorNeutralStroke2}`,
              borderRadius: '4px',
              color: tokens.colorNeutralForeground3,
            }}
          >
            Calendar view would be displayed here
          </div>
        )}

        {/* Legend */}
        {viewMode === 'gantt' && (
          <div
            className="flex items-center gap-6 mt-4"
            style={{
              padding: '12px',
              backgroundColor: tokens.colorNeutralBackground2,
              borderRadius: '4px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Legend:</span>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '20px',
                  height: '12px',
                  backgroundColor: tokens.colorBrandBackground,
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px' }}>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '20px',
                  height: '12px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px' }}>Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '20px',
                  height: '12px',
                  backgroundColor: tokens.colorPaletteGreenBackground2,
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px' }}>Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: tokens.colorBrandForeground1,
                  transform: 'rotate(45deg)',
                }}
              />
              <span style={{ fontSize: '12px' }}>Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '2px',
                  height: '20px',
                  backgroundColor: tokens.colorPaletteRedForeground1,
                }}
              />
              <span style={{ fontSize: '12px' }}>Today</span>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
