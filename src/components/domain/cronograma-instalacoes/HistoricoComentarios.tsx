import { Text, tokens } from '@fluentui/react-components';
import type { ComentarioOS } from '../../../features/cronograma-instalacoes/types';
import { TIPO_COMENTARIO_LABELS } from '../../../features/cronograma-instalacoes/constants';
import { formatDateLong } from '../../../features/cronograma-instalacoes/utils';

interface HistoricoComentariosProps {
  comentarios: ComentarioOS[];
}

export function HistoricoComentarios({ comentarios }: HistoricoComentariosProps) {
  if (comentarios.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px dashed ${tokens.colorNeutralStroke2}`,
          textAlign: 'center',
        }}
      >
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Nenhum comentário registrado.
        </Text>
      </div>
    );
  }

  return (
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
            {TIPO_COMENTARIO_LABELS[comentario.tipodecomentario]}
          </Text>
          <Text size={200} block style={{ marginTop: '8px', color: tokens.colorNeutralForeground2 }}>
            {comentario.comentario}
          </Text>
        </div>
      ))}
    </div>
  );
}

