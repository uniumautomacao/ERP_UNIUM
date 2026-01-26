import { Text, tokens } from '@fluentui/react-components';
import type { ComentarioOS, CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { STATUS_LABELS, STATUS_COLORS } from '../../../features/cronograma-instalacoes/constants';
import { formatDateLong } from '../../../features/cronograma-instalacoes/utils';
import { EmptyState } from '../../shared/EmptyState';
import { ActionForm } from './ActionForm';
import { HistoricoComentarios } from './HistoricoComentarios';

interface OSDetailPanelProps {
  os: CronogramaOS | null;
  comentarios: ComentarioOS[];
  onDefinirData?: (os: CronogramaOS, data: string, comentario: string) => Promise<void>;
  onConfirmarData?: (os: CronogramaOS, comentario: string, manterData: boolean, novaData?: string) => Promise<void>;
  onRegistrarTentativa?: (os: CronogramaOS, comentario: string) => Promise<void>;
  onMarcarSemResposta?: (os: CronogramaOS) => Promise<void>;
  onClienteRetornou?: (os: CronogramaOS) => Promise<void>;
}

export function OSDetailPanel({
  os,
  comentarios,
  onDefinirData,
  onConfirmarData,
  onRegistrarTentativa,
  onMarcarSemResposta,
  onClienteRetornou,
}: OSDetailPanelProps) {
  if (!os) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState title="Selecione uma OS na lista" description="Para ver os detalhes e ações disponíveis." />
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[os.statusdaprogramacao];
  const statusColors = STATUS_COLORS[os.statusdaprogramacao];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground1,
        }}
      >
        <Text size={300} weight="semibold">
          {os.name}
        </Text>
        <div className="mt-2 flex flex-col gap-1">
          <Text size={200}>Projeto: {os.projetoapelido || os.cliente}</Text>
          <Text size={200}>Cliente: {os.cliente}</Text>
          <Text size={200}>Serviço: {os.tipodeservico}</Text>
          <Text size={200}>Sistemas: {os.tiposdesistematexto ?? '-'}</Text>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <Text size={200} weight="semibold">
            Status
          </Text>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: statusColors.background,
              color: statusColors.text,
            }}
          >
            {statusLabel}
          </span>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Previsão atual: {formatDateLong(os.datadaproximaatividade)}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Última confirmação: {formatDateLong(os.datadaultimaconfirmacao)}
          </Text>
        </div>
      </div>

      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground1,
        }}
      >
        <ActionForm
          os={os}
          onSalvarPrevisao={(data, comentario) => onDefinirData?.(os, data, comentario)}
          onConfirmarData={(comentario, manterData, novaData) =>
            onConfirmarData?.(os, comentario, manterData, novaData)
          }
          onRegistrarTentativa={(comentario) => onRegistrarTentativa?.(os, comentario)}
          onClienteRetornou={() => onClienteRetornou?.(os)}
          onMarcarSemResposta={() => onMarcarSemResposta?.(os)}
        />
      </div>

      <div>
        <Text size={300} weight="semibold" block style={{ marginBottom: '8px' }}>
          Histórico
        </Text>
        <HistoricoComentarios comentarios={comentarios} />
      </div>
    </div>
  );
}

