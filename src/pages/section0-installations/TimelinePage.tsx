import { useMemo } from 'react';
import { Button, Field, Input, Spinner, Text, tokens } from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowSync24Regular,
  CalendarMonth24Regular,
  ChevronDown24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ChevronUp24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { useUsoInstaladorController } from '../../components/UsoInstalador';

function formatDateShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function TimelinePage() {
  const {
    view,
    weekStart,
    weekEnd,
    datePickerValue,
    showSunday,
    setShowSunday,
    isLoading,
    error,
    allExpanded,
    handlePrevWeek,
    handleNextWeek,
    handleDatePick,
    handleRefresh,
    handleOpenUserSelector,
    handleToggleAll,
    handleNewActivity,
    appVersion,
  } = useUsoInstaladorController({}, { showHeader: false });

  const weekRangeLabel = useMemo(
    () => `Semana ${formatDateShort(weekStart)} a ${formatDateShort(weekEnd)}`,
    [weekStart, weekEnd]
  );
  const subtitle = `${weekRangeLabel} • v${appVersion}`;

  const primaryActions = [
    {
      id: 'new-activity',
      label: 'Nova Atividade',
      icon: <Add24Regular />,
      onClick: handleNewActivity,
      appearance: 'primary' as const,
    },
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: <ArrowSync24Regular />,
      onClick: handleRefresh,
    },
  ];

  const secondaryActions = [
    {
      id: 'toggle-sunday',
      label: showSunday ? 'Ocultar Domingo' : 'Mostrar Domingo',
      icon: <CalendarMonth24Regular />,
      onClick: () => setShowSunday(!showSunday),
    },
    {
      id: 'collaborators',
      label: 'Colaboradores',
      icon: <People24Regular />,
      onClick: handleOpenUserSelector,
    },
    {
      id: 'toggle-expand',
      label: allExpanded ? 'Colapsar Todos' : 'Expandir Todos',
      icon: allExpanded ? <ChevronUp24Regular /> : <ChevronDown24Regular />,
      onClick: handleToggleAll,
    },
  ];

  return (
    <>
      <CommandBar primaryActions={primaryActions} secondaryActions={secondaryActions} />
      <PageHeader title="Linha do Tempo" subtitle={subtitle} />
      <PageContainer>
        <div className="flex flex-col gap-4 h-full min-h-0">
          {(isLoading || error) && (
            <div
              className="flex flex-wrap items-center gap-2"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: tokens.colorNeutralBackground2,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
              }}
            >
              {isLoading && (
                <>
                  <Spinner size="tiny" />
                  <Text size={300}>Carregando atividades...</Text>
                </>
              )}
              {error && (
                <Text size={300} style={{ color: tokens.colorPaletteRedForeground2 }}>
                  {error} (usando dados de exemplo)
                </Text>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <Button
                appearance="subtle"
                size="small"
                icon={<ChevronLeft24Regular />}
                onClick={handlePrevWeek}
                title="Semana anterior"
              />
              <Button
                appearance="subtle"
                size="small"
                icon={<ChevronRight24Regular />}
                onClick={handleNextWeek}
                title="Próxima semana"
              />
            </div>

            <Input
              type="date"
              size="small"
              value={datePickerValue}
              onChange={(_, data) => handleDatePick(data.value)}
              aria-label="Selecionar data"
              style={{ maxWidth: '130px' }}
            />
            
            <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3, marginLeft: '8px' }}>
              {weekRangeLabel}
            </Text>
          </div>

          <div className="flex-1 min-h-0">
            {view}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
