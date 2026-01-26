import { useEffect, useMemo, useState } from 'react';
import { Text } from '@fluentui/react-components';
import { CalendarClock24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { CronogramaHeader } from '../../components/domain/cronograma-instalacoes/CronogramaHeader';
import { PendentesTab } from '../../components/domain/cronograma-instalacoes/PendentesTab';
import { SemRespostaTab } from '../../components/domain/cronograma-instalacoes/SemRespostaTab';
import { CalendarioTab } from '../../components/domain/cronograma-instalacoes/CalendarioTab';
import { OSDetailPanel } from '../../components/domain/cronograma-instalacoes/OSDetailPanel';
import { useCronogramaInstalacoes } from '../../hooks/useCronogramaInstalacoes';
import { SEARCH_PLACEHOLDER } from '../../features/cronograma-instalacoes/constants';
import type { TipoServicoFiltro } from '../../features/cronograma-instalacoes/types';
import { parseDate } from '../../features/cronograma-instalacoes/utils';

type TabKey = 'pendentes' | 'sem-resposta' | 'calendario';

export function CronogramaInstalacoesPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('pendentes');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipoServico, setTipoServico] = useState<TipoServicoFiltro>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const {
    itens,
    pendentes,
    semResposta,
    calendarioItens,
    comentariosPorOs,
    anosDisponiveis,
    loading,
    error,
    carregarComentarios,
    definirDataPrevista,
    confirmarData,
    registrarTentativa,
    marcarSemResposta,
    clienteRetornou,
  } = useCronogramaInstalacoes({
    ano,
    mes: calendarMonth,
    tipoServico,
    searchTerm,
  });

  const totalPendentes = Object.values(pendentes).reduce((acc, list) => acc + list.length, 0);
  const tabs = useMemo(
    () => [
      { value: 'pendentes', label: `Pendentes (${totalPendentes})` },
      { value: 'sem-resposta', label: `Sem Resposta (${semResposta.length})` },
      { value: 'calendario', label: 'Calendário' },
    ],
    [semResposta.length, totalPendentes]
  );

  const selectedOS = useMemo(() => itens.find((os) => os.id === selectedOsId) ?? null, [itens, selectedOsId]);
  const selectedComentarios = useMemo(
    () => (selectedOS ? comentariosPorOs.get(selectedOS.id) ?? [] : []),
    [comentariosPorOs, selectedOS]
  );

  const calendarItems = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toISOString().slice(0, 10);
    return calendarioItens.filter((os) => os.datadaproximaatividade?.startsWith(key));
  }, [calendarioItens, selectedDate]);

  useEffect(() => {
    if (!selectedOS && itens.length > 0) {
      setSelectedOsId(itens[0].id);
    }
  }, [itens, selectedOS]);

  useEffect(() => {
    if (selectedOS) {
      carregarComentarios(selectedOS.id);
    }
  }, [carregarComentarios, selectedOS]);

  useEffect(() => {
    if (selectedTab !== 'calendario') return;
    calendarItems.forEach((os) => {
      if (!comentariosPorOs.has(os.id)) {
        carregarComentarios(os.id);
      }
    });
  }, [calendarItems, carregarComentarios, comentariosPorOs, selectedTab]);

  useEffect(() => {
    if (selectedTab !== 'calendario') return;
    if (!selectedDate) {
      setSelectedDate(new Date(ano, calendarMonth, 1));
    }
  }, [selectedTab, selectedDate, ano, calendarMonth]);

  const primaryActions = [
    {
      id: 'novo-contato',
      label: 'Nova OS',
      icon: <CalendarClock24Regular />,
      onClick: () => undefined,
      appearance: 'primary' as const,
    },
  ];

  return (
    <>
      <CommandBar primaryActions={primaryActions} />
      <PageHeader title="Cronograma de Instalações" subtitle={`Ano ${ano}`} tabs={tabs} selectedTab={selectedTab} onTabSelect={(value) => setSelectedTab(value as TabKey)} />
      <PageContainer>
        <div className="flex flex-col gap-4 h-full min-h-0">
          <CronogramaHeader
            anos={anosDisponiveis}
            anoSelecionado={ano}
            onAnoChange={(value) => setAno(value)}
            tipoServico={tipoServico}
            onTipoServicoChange={setTipoServico}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={SEARCH_PLACEHOLDER}
          />

          <div className="flex flex-1 min-h-0 gap-4">
            <div className="flex-[65] min-w-[500px] overflow-auto">
              {loading && (
                <Text size={200}>Carregando dados...</Text>
              )}
              {error && (
                <Text size={200} style={{ color: '#b91c1c' }}>
                  {error}
                </Text>
              )}
              {selectedTab === 'pendentes' && (
                <PendentesTab grupos={pendentes} selectedId={selectedOsId} onSelect={setSelectedOsId} />
              )}
              {selectedTab === 'sem-resposta' && (
                <SemRespostaTab itens={semResposta} selectedId={selectedOsId} onSelect={setSelectedOsId} />
              )}
              {selectedTab === 'calendario' && (
                <div className="flex flex-col gap-4">
                  <CalendarioTab
                    itens={calendarioItens}
                    ano={ano}
                    mes={calendarMonth}
                    onMesChange={setCalendarMonth}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      const itemForDay = calendarioItens.find((os) => {
                        const osDate = parseDate(os.datadaproximaatividade);
                        return (
                          osDate &&
                          osDate.getFullYear() === date.getFullYear() &&
                          osDate.getMonth() === date.getMonth() &&
                          osDate.getDate() === date.getDate()
                        );
                      });
                      if (itemForDay) setSelectedOsId(itemForDay.id);
                    }}
                  />

                  <div className="flex flex-col gap-2">
                    <Text size={300} weight="semibold">
                      OSs do dia selecionado
                    </Text>
                    {calendarItems.length === 0 ? (
                      <Text size={200}>Nenhuma OS neste dia.</Text>
                    ) : (
                      calendarItems.map((os) => (
                        <Text key={os.id} size={200}>
                          {os.projetoapelido} · {os.tipodeservico}
                        </Text>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-[35] min-w-[350px] overflow-auto">
              {selectedTab === 'calendario' ? (
                calendarItems.length === 0 ? (
                  <Text size={200}>Nenhuma OS neste dia.</Text>
                ) : (
                  <div className="flex flex-col gap-4">
                    {calendarItems.map((os) => (
                      <OSDetailPanel
                        key={os.id}
                        os={os}
                        comentarios={comentariosPorOs.get(os.id) ?? []}
                        onDefinirData={definirDataPrevista}
                        onConfirmarData={confirmarData}
                        onRegistrarTentativa={registrarTentativa}
                        onMarcarSemResposta={marcarSemResposta}
                        onClienteRetornou={clienteRetornou}
                      />
                    ))}
                  </div>
                )
              ) : (
                <OSDetailPanel
                  os={selectedOS}
                  comentarios={selectedComentarios}
                  onDefinirData={definirDataPrevista}
                  onConfirmarData={confirmarData}
                  onRegistrarTentativa={registrarTentativa}
                  onMarcarSemResposta={marcarSemResposta}
                  onClienteRetornou={clienteRetornou}
                />
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

