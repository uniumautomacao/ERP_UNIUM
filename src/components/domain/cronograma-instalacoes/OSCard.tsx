import { Text, tokens } from '@fluentui/react-components';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { SERVICE_COLORS, STATUS_PROGRAMACAO } from '../../../features/cronograma-instalacoes/constants';
import { formatDateShort, getDiasDesdeCriacao, getDiasRestantes } from '../../../features/cronograma-instalacoes/utils';

interface OSCardProps {
  os: CronogramaOS;
  onClick: () => void;
  isSelected?: boolean;
}

const buildRestanteLabel = (os: CronogramaOS) => {
  const diasRestantes = getDiasRestantes(os.datadaproximaatividade);
  if (diasRestantes !== null) {
    return diasRestantes >= 0 ? `Faltam ${diasRestantes} dias` : `Atrasado ${Math.abs(diasRestantes)} dias`;
  }
  const diasCriacao = getDiasDesdeCriacao(os.dataCriacao);
  if (diasCriacao !== null) {
    return `Criado há ${diasCriacao} dias`;
  }
  return '';
};

const getConfirmacaoLabels = (os: CronogramaOS) => {
  const labels: Array<{ key: '60d' | '30d' | '15d'; label: string; done: boolean }> = [];
  const status = os.statusdaprogramacao;
  if (status === STATUS_PROGRAMACAO.AguardandoPrimeiroContato) return labels;

  labels.push({ key: '60d', label: 'Conf. 60d', done: Boolean(os.confirmacao60d) });

  if (
    status === STATUS_PROGRAMACAO.PendenteReconfirmacao30d ||
    status === STATUS_PROGRAMACAO.Confirmado30d ||
    status === STATUS_PROGRAMACAO.PendenteReconfirmacao15d ||
    status === STATUS_PROGRAMACAO.Confirmado15d ||
    status === STATUS_PROGRAMACAO.ProntoParaAgendar
  ) {
    labels.push({ key: '30d', label: 'Conf. 30d', done: Boolean(os.confirmacao30d) });
  }

  if (
    status === STATUS_PROGRAMACAO.PendenteReconfirmacao15d ||
    status === STATUS_PROGRAMACAO.Confirmado15d ||
    status === STATUS_PROGRAMACAO.ProntoParaAgendar
  ) {
    labels.push({ key: '15d', label: 'Conf. 15d', done: Boolean(os.confirmacao15d) });
  }

  return labels;
};

export function OSCard({ os, onClick, isSelected }: OSCardProps) {
  const confirmacoes = getConfirmacaoLabels(os);
  const restanteLabel = buildRestanteLabel(os);
  const serviceColor = SERVICE_COLORS[os.tipodeservico];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 text-left"
      style={{
        padding: '12px 14px',
        borderRadius: '8px',
        border: `1px solid ${isSelected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke2}`,
        backgroundColor: isSelected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
        transition: 'border-color 0.2s ease',
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <Text size={300} weight="semibold">
          {os.projetoapelido || os.cliente}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {os.name}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: `${serviceColor}1A`,
            color: serviceColor,
          }}
        >
          {os.tipodeservico}
        </span>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Prev: {formatDateShort(os.datadaproximaatividade)}
        </Text>
        {restanteLabel && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {restanteLabel}
          </Text>
        )}
      </div>

      {confirmacoes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {confirmacoes.map((confirmacao) => (
            <Text key={confirmacao.key} size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {confirmacao.done ? '✓' : '○'} {confirmacao.label}
            </Text>
          ))}
        </div>
      )}
    </button>
  );
}

