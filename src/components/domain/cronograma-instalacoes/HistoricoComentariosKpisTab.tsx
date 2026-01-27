import { Spinner, Text, tokens } from '@fluentui/react-components';
import { KPICard } from '../../shared/KPICard';
import type { ComentarioHistorico } from '../../../features/cronograma-instalacoes/types';
import { TIPO_COMENTARIO, TIPO_COMENTARIO_LABELS } from '../../../features/cronograma-instalacoes/constants';
import { formatDateLong } from '../../../features/cronograma-instalacoes/utils';

interface HistoricoComentariosKpisTabProps {
  comentarios: ComentarioHistorico[];
  loading: boolean;
  dias: number;
}

const formatRelativeTime = (dateValue?: string | null) => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} dias`;
};

export function HistoricoComentariosKpisTab({ comentarios, loading, dias }: HistoricoComentariosKpisTabProps) {
  const totalComentarios = comentarios.length;
  const osUnicas = new Set(comentarios.map((item) => item.ordemdeservico)).size;
  const usuariosAtivos = new Set(comentarios.map((item) => item.usuario)).size;
  const mediaPorDia = dias > 0 ? (totalComentarios / dias).toFixed(1) : '0';
  const tentativas = comentarios.filter((item) => item.tipodecomentario === TIPO_COMENTARIO.TentativaContato).length;
  const tentativasPercent = totalComentarios > 0 ? Math.round((tentativas / totalComentarios) * 100) : 0;
  const ultimaAtividade = comentarios[0]?.createdOn ?? comentarios[0]?.datetime;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke2}`,
          }}
        >
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Escopo: comentários dos últimos {dias} dias (todas as OSs).
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Spinner size="small" />
          <Text size={200}>Carregando histórico...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: tokens.colorNeutralBackground1,
          border: `1px solid ${tokens.colorNeutralStroke2}`,
        }}
      >
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Escopo: comentários dos últimos {dias} dias (todas as OSs).
        </Text>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <KPICard label="Comentários (90d)" value={totalComentarios} />
        <KPICard label="OSs únicas" value={osUnicas} />
        <KPICard label="Usuários ativos" value={usuariosAtivos} />
        <KPICard label="Comentários/dia" value={mediaPorDia} />
        <KPICard label="Tentativas (%)" value={`${tentativasPercent}%`} subtitle={`${tentativas} registros`} />
        <KPICard label="Última atividade" value={formatRelativeTime(ultimaAtividade)} />
      </div>

      <div className="flex flex-col gap-2">
        <Text size={300} weight="semibold">
          Histórico de comentários
        </Text>
        {comentarios.length === 0 ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px dashed ${tokens.colorNeutralStroke2}`,
              textAlign: 'center',
            }}
          >
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Nenhum comentário registrado neste período.
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comentarios.map((comentario) => (
              <div
                key={comentario.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: tokens.colorNeutralBackground1,
                }}
              >
                <Text size={200} weight="semibold">
                  {formatDateLong(comentario.datetime)} · {comentario.usuario}
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  OS: {comentario.osLabel ?? comentario.ordemdeservico}
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {TIPO_COMENTARIO_LABELS[comentario.tipodecomentario]}
                </Text>
                <Text size={200} block style={{ marginTop: '8px', color: tokens.colorNeutralForeground2 }}>
                  {comentario.comentario}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
