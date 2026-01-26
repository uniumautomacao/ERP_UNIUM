import { useEffect, useMemo, useState } from 'react';
import { Button, Text, tokens } from '@fluentui/react-components';
import { CalendarClock24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { CronogramaHeader } from '../../components/domain/cronograma-instalacoes/CronogramaHeader';
import { PendentesTab } from '../../components/domain/cronograma-instalacoes/PendentesTab';
import { SemRespostaTab } from '../../components/domain/cronograma-instalacoes/SemRespostaTab';
import { CalendarioTab } from '../../components/domain/cronograma-instalacoes/CalendarioTab';
import { OSDetailPanel } from '../../components/domain/cronograma-instalacoes/OSDetailPanel';
import { OSCard } from '../../components/domain/cronograma-instalacoes/OSCard';
import { VisaoAnualTab } from '../../components/domain/cronograma-instalacoes/VisaoAnualTab';
import { useCronogramaInstalacoes } from '../../hooks/useCronogramaInstalacoes';
import { SEARCH_PLACEHOLDER } from '../../features/cronograma-instalacoes/constants';
import type { TipoServicoFiltro } from '../../features/cronograma-instalacoes/types';
import { formatMonthYear, parseDate } from '../../features/cronograma-instalacoes/utils';

type TabKey = 'pendentes' | 'sem-resposta' | 'visao-anual' | 'calendario';

export function CronogramaInstalacoesPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('pendentes');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipoServico, setTipoServico] = useState<TipoServicoFiltro>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAnnualMonth, setSelectedAnnualMonth] = useState<number | null>(null);
  const [annualSidebarTab, setAnnualSidebarTab] = useState<'list' | 'details'>('list');

  const {
    itens,
    pendentes,
    semResposta,
    calendarioItens,
    calendarioAnoItens,
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
      { value: 'visao-anual', label: 'Visão Anual' },
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

  const annualMonthItems = useMemo(() => {
    if (selectedAnnualMonth === null) return [];
    return calendarioAnoItens.filter((os) => {
      const osDate = parseDate(os.datadaproximaatividade);
      return osDate && osDate.getFullYear() === ano && osDate.getMonth() === selectedAnnualMonth;
    });
  }, [ano, calendarioAnoItens, selectedAnnualMonth]);

  const selectedAnnualOS = useMemo(
    () => annualMonthItems.find((os) => os.id === selectedOsId) ?? null,
    [annualMonthItems, selectedOsId]
  );
  const selectedAnnualComentarios = useMemo(
    () => (selectedAnnualOS ? comentariosPorOs.get(selectedAnnualOS.id) ?? [] : []),
    [comentariosPorOs, selectedAnnualOS]
  );

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

  useEffect(() => {
    if (selectedTab !== 'visao-anual') return;
    if (selectedAnnualMonth === null) {
      setSelectedAnnualMonth(new Date().getMonth());
    }
  }, [selectedAnnualMonth, selectedTab]);

  useEffect(() => {
    if (selectedTab !== 'visao-anual') return;
    setSelectedOsId(null);
    setAnnualSidebarTab('list');
  }, [selectedAnnualMonth, selectedTab]);

  useEffect(() => {
    if (selectedTab !== 'visao-anual') return;
    if (selectedOsId && annualMonthItems.some((os) => os.id === selectedOsId)) {
      setAnnualSidebarTab('details');
    }
  }, [annualMonthItems, selectedOsId, selectedTab]);

  const handleSelectMonth = (mes: number) => {
    setSelectedAnnualMonth(mes);
  };

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
              {selectedTab === 'visao-anual' && (
                <VisaoAnualTab
                  itens={calendarioAnoItens}
                  ano={ano}
                  onSelectMonth={handleSelectMonth}
                  selectedMonth={selectedAnnualMonth}
                />
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
                      <div className="flex flex-col gap-2">
                        {calendarItems.map((os) => (
                          <OSCard
                            key={os.id}
                            os={os}
                            onClick={() => setSelectedOsId(os.id)}
                            isSelected={selectedOsId === os.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-[35] min-w-[350px] overflow-auto">
              {selectedTab === 'calendario' ? (
                <OSDetailPanel
                  os={selectedOS}
                  comentarios={selectedComentarios}
                  onDefinirData={definirDataPrevista}
                  onConfirmarData={confirmarData}
                  onRegistrarTentativa={registrarTentativa}
                  onMarcarSemResposta={marcarSemResposta}
                  onClienteRetornou={clienteRetornou}
                />
              ) : selectedTab === 'visao-anual' ? (
                <div className="flex flex-col gap-3 h-full min-h-0">
                  <Text size={300} weight="semibold">
                    {selectedAnnualMonth === null
                      ? 'Selecione um mês'
                      : `OSs de ${formatMonthYear(new Date(ano, selectedAnnualMonth, 1))}`}
                  </Text>
                  {selectedAnnualMonth === null ? (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Clique em um mês para visualizar as OSs.
                    </Text>
                  ) : annualMonthItems.length === 0 ? (
                    <Text size={200}>Nenhuma OS neste mês.</Text>
                  ) : (
                    <>
                      {selectedAnnualOS && (
                        <div className="flex gap-2 border-b" style={{ borderColor: tokens.colorNeutralStroke2 }}>
                          <button
                            type="button"
                            onClick={() => setAnnualSidebarTab('list')}
                            style={{
                              padding: '8px 16px',
                              borderBottom:
                                annualSidebarTab === 'list' ? `2px solid ${tokens.colorBrandStroke1}` : 'none',
                              color:
                                annualSidebarTab === 'list'
                                  ? tokens.colorBrandForeground1
                                  : tokens.colorNeutralForeground2,
                              fontWeight: annualSidebarTab === 'list' ? 600 : 400,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Lista ({annualMonthItems.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnnualSidebarTab('details')}
                            style={{
                              padding: '8px 16px',
                              borderBottom:
                                annualSidebarTab === 'details' ? `2px solid ${tokens.colorBrandStroke1}` : 'none',
                              color:
                                annualSidebarTab === 'details'
                                  ? tokens.colorBrandForeground1
                                  : tokens.colorNeutralForeground2,
                              fontWeight: annualSidebarTab === 'details' ? 600 : 400,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Detalhes
                          </button>
                        </div>
                      )}

                      <div className="flex-1 min-h-0 overflow-auto">
                        {annualSidebarTab === 'list' ? (
                          <div className="flex flex-col gap-2">
                            {annualMonthItems.map((os) => (
                              <OSCard
                                key={os.id}
                                os={os}
                                onClick={() => setSelectedOsId(os.id)}
                                isSelected={selectedOsId === os.id}
                              />
                            ))}
                          </div>
                        ) : selectedAnnualOS ? (
                          <OSDetailPanel
                            os={selectedAnnualOS}
                            comentarios={selectedAnnualComentarios}
                            onDefinirData={definirDataPrevista}
                            onConfirmarData={confirmarData}
                            onRegistrarTentativa={registrarTentativa}
                            onMarcarSemResposta={marcarSemResposta}
                            onClienteRetornou={clienteRetornou}
                          />
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
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

