import { useState, useMemo } from 'react';
import { Text, tokens } from '@fluentui/react-components';
import { ChevronDown24Filled, ChevronRight24Filled } from '@fluentui/react-icons';
import { Task, Phase } from '../../types';

interface GanttChartProps {
  phases: Phase[];
  startDate: Date;
  endDate: Date;
  height?: number;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;

export function GanttChart({ phases, startDate, endDate, height = 400 }: GanttChartProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.map(p => p.id)));

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const today = new Date();
  const todayOffset = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Gerar cabeçalho de meses e semanas
  const timelineHeaders = useMemo(() => {
    const months: { label: string; width: number }[] = [];
    const weeks: { label: string; width: number }[] = [];
    
    let currentDate = new Date(startDate);
    let currentMonth = currentDate.getMonth();
    let monthDays = 0;
    let weekCount = 1;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (date.getMonth() !== currentMonth) {
        months.push({
          label: new Date(startDate.getFullYear(), currentMonth).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          width: monthDays,
        });
        currentMonth = date.getMonth();
        monthDays = 1;
      } else {
        monthDays++;
      }
      
      if (i % 7 === 0 && i > 0) {
        weekCount++;
      }
    }
    
    months.push({
      label: new Date(startDate.getFullYear(), currentMonth).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      width: monthDays,
    });
    
    for (let i = 1; i <= Math.ceil(totalDays / 7); i++) {
      weeks.push({ label: `W${i}`, width: 7 });
    }
    
    return { months, weeks };
  }, [startDate, totalDays]);

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getTaskBar = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const startOffset = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const getStatusColor = () => {
      switch (task.status) {
        case 'complete':
          return tokens.colorPaletteGreenBackground2;
        case 'in_progress':
          return tokens.colorBrandBackground;
        case 'blocked':
          return tokens.colorPaletteRedBackground2;
        default:
          return tokens.colorNeutralBackground3;
      }
    };

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      backgroundColor: getStatusColor(),
    };
  };

  return (
    <div className="flex" style={{ height, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '4px', overflow: 'hidden' }}>
      {/* Task List */}
      <div
        style={{
          width: '280px',
          borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground2,
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: `${HEADER_HEIGHT}px`,
            padding: '16px 12px',
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: tokens.colorNeutralBackground3,
          }}
        >
          <Text weight="semibold">Tasks</Text>
        </div>

        {/* Task rows */}
        <div>
          {phases.map((phase) => (
            <div key={phase.id}>
              {/* Phase row */}
              <div
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  padding: '0 12px',
                  borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: tokens.colorNeutralBackground1Hover,
                }}
                onClick={() => togglePhase(phase.id)}
              >
                {expandedPhases.has(phase.id) ? (
                  <ChevronDown24Filled style={{ fontSize: '16px' }} />
                ) : (
                  <ChevronRight24Filled style={{ fontSize: '16px' }} />
                )}
                <Text weight="semibold" size={300}>
                  {phase.name}
                </Text>
                <Text size={200} style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
                  {phase.progress}%
                </Text>
              </div>

              {/* Task rows (if expanded) */}
              {expandedPhases.has(phase.id) &&
                phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      padding: '0 12px 0 40px',
                      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    {task.isMilestone ? '◆' : ''}
                    <Text size={300}>{task.name}</Text>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-grow" style={{ overflow: 'auto', position: 'relative' }}>
        {/* Timeline header */}
        <div
          style={{
            height: `${HEADER_HEIGHT}px`,
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: tokens.colorNeutralBackground3,
          }}
        >
          {/* Months */}
          <div className="flex" style={{ height: '30px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
            {timelineHeaders.months.map((month, index) => (
              <div
                key={index}
                style={{
                  width: `${(month.width / totalDays) * 100}%`,
                  borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={200}>{month.label}</Text>
              </div>
            ))}
          </div>
          
          {/* Weeks */}
          <div className="flex" style={{ height: '30px' }}>
            {timelineHeaders.weeks.map((week, index) => (
              <div
                key={index}
                style={{
                  width: `${(week.width / totalDays) * 100}%`,
                  borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={100}>{week.label}</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Task bars */}
        <div style={{ position: 'relative', minHeight: '300px' }}>
          {/* Grid lines */}
          {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${((index * 7) / totalDays) * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: tokens.colorNeutralStroke2,
              }}
            />
          ))}

          {/* Today marker */}
          {todayOffset > 0 && todayOffset < totalDays && (
            <div
              style={{
                position: 'absolute',
                left: `${(todayOffset / totalDays) * 100}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: tokens.colorPaletteRedForeground1,
                zIndex: 10,
              }}
            />
          )}

          {/* Task bars */}
          {phases.map((phase, phaseIndex) => {
            let rowIndex = phaseIndex;
            return (
              <div key={phase.id}>
                {expandedPhases.has(phase.id) &&
                  phase.tasks.map((task, taskIndex) => {
                    const currentRow = rowIndex + taskIndex + 1;
                    if (task.isMilestone) {
                      const taskStart = new Date(task.startDate);
                      const startOffset = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div
                          key={task.id}
                          style={{
                            position: 'absolute',
                            left: `${(startOffset / totalDays) * 100}%`,
                            top: `${currentRow * ROW_HEIGHT + 12}px`,
                            width: '12px',
                            height: '12px',
                            backgroundColor: tokens.colorBrandForeground1,
                            transform: 'rotate(45deg)',
                          }}
                        />
                      );
                    }

                    const barStyle = getTaskBar(task);
                    return (
                      <div
                        key={task.id}
                        style={{
                          position: 'absolute',
                          ...barStyle,
                          top: `${currentRow * ROW_HEIGHT + 8}px`,
                          height: '20px',
                          borderRadius: '4px',
                        }}
                      />
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
