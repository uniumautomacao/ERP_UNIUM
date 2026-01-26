import { Text, tokens } from '@fluentui/react-components';
import { SERVICE_COLORS } from '../../../features/cronograma-instalacoes/constants';
import type { MonthStats } from '../../../features/cronograma-instalacoes/types';

interface MonthCardProps {
  mes: number;
  ano: number;
  stats: MonthStats;
  onClick: () => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function MonthCard({ mes, ano, stats, onClick }: MonthCardProps) {
  const hasSemResposta = stats.porStatus.semResposta > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 text-left transition-shadow hover:shadow-sm"
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Text size={400} weight="semibold">
          {MONTH_NAMES[mes]}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {ano}
        </Text>
      </div>

      <div className="flex items-baseline gap-2">
        <Text size={600} weight="bold">
          {stats.total}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          OSs
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: `${SERVICE_COLORS['Instalação']}1A`,
            color: SERVICE_COLORS['Instalação'],
          }}
        >
          Instalação: {stats.porTipo.instalacao}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: `${SERVICE_COLORS['Cabeamento']}1A`,
            color: SERVICE_COLORS['Cabeamento'],
          }}
        >
          Cabeamento: {stats.porTipo.cabeamento}
        </span>
      </div>

      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Pendentes: {stats.porStatus.pendentes} · Confirmadas: {stats.porStatus.confirmadas}
        {hasSemResposta ? ` · Sem Resposta: ${stats.porStatus.semResposta}` : ''}
      </Text>
    </button>
  );
}
