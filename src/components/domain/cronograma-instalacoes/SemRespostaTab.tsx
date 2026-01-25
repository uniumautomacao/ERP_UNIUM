import { Text, tokens } from '@fluentui/react-components';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { SERVICE_COLORS } from '../../../features/cronograma-instalacoes/constants';
import { formatDateLong, getDiasDesdeData } from '../../../features/cronograma-instalacoes/utils';

interface SemRespostaTabProps {
  itens: CronogramaOS[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SemRespostaTab({ itens, selectedId, onSelect }: SemRespostaTabProps) {
  if (itens.length === 0) {
    return (
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Nenhuma OS sem resposta no período selecionado.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {itens.map((os) => {
        const diasSemContato = getDiasDesdeData(os.datadaultimatentativadecontato);
        const serviceColor = SERVICE_COLORS[os.tipodeservico];

        return (
          <button
            type="button"
            key={os.id}
            onClick={() => onSelect(os.id)}
            className="flex flex-col gap-2 text-left"
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: `1px solid ${selectedId === os.id ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke2}`,
              backgroundColor: selectedId === os.id ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
            }}
          >
            <Text size={300} weight="semibold">
              {os.projetoapelido}
            </Text>
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
                Última tentativa: {formatDateLong(os.datadaultimatentativadecontato)}{' '}
                {diasSemContato !== null ? `(há ${diasSemContato} dias)` : ''}
              </Text>
            </div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Tentativas: {os.contagemtentativascontato ?? 0} · Última previsão conhecida:{' '}
              {formatDateLong(os.ultimaPrevisaoConhecida)}
            </Text>
          </button>
        );
      })}
    </div>
  );
}

