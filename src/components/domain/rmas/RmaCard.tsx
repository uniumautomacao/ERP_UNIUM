import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Checkbox, Text, tokens } from '@fluentui/react-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Open24Regular } from '@fluentui/react-icons';
import { RmaCardData } from '../../../features/rmas/types';
import { RMA_TYPE_LABELS } from '../../../features/rmas/constants';
import { New_estoquermasService } from '../../../generated/services/New_estoquermasService';

interface RmaCardProps {
  item: RmaCardData;
  title: string;
  onOpenRma: (id: string) => void;
  onOpenCadastro: (id: string) => void;
  onClienteInformadoChange: (id: string, checked: boolean) => void;
}

export function RmaCard({ item, title, onOpenRma, onOpenCadastro, onClienteInformadoChange }: RmaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [expanded, setExpanded] = useState(false);
  const [referencias, setReferencias] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const cardStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: 6,
    boxShadow: isDragging ? `0 8px 18px ${tokens.colorNeutralShadowAmbient}` : undefined,
  }), [transform, transition, isDragging]);

  const detalhesText = useMemo(() => {
    const descricao = item.descricao?.trim() ?? '';
    const observacoes = item.observacoes?.trim() ?? '';
    const joined = observacoes ? `${descricao}\n\n${observacoes}` : descricao;
    if (joined.length <= 120 || expanded) {
      return joined;
    }
    return `${joined.slice(0, 120)}...`;
  }, [expanded, item.descricao, item.observacoes]);

  const precisaExpandir = (item.descricao?.length ?? 0) + (item.observacoes?.length ?? 0) > 120;
  const lembreteOverdue = item.dataLembrete ? new Date(item.dataLembrete) < new Date() : false;
  const alertHighlight = item.sinalizar || item.lembreteExpirado || lembreteOverdue;

  useEffect(() => {
    let isMounted = true;
    const loadRefs = async () => {
      setLoadingRefs(true);
      try {
        const result = await New_estoquermasService.getAll({
          filter: `_new_rma_value eq '${item.id}'`,
          select: ['new_referenciadoproduto'],
        });
        if (!isMounted) return;
        const values = (result.data || [])
          .map((row) => row.new_referenciadoproduto)
          .filter((value): value is string => Boolean(value));
        setReferencias(values);
      } catch (error) {
        console.error('[RmaCard] erro ao carregar referencias', error);
      } finally {
        if (isMounted) {
          setLoadingRefs(false);
        }
      }
    };

    loadRefs();
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...cardStyle,
        padding: '12px',
        borderStyle: alertHighlight ? 'dashed' : 'solid',
        borderColor: alertHighlight ? tokens.colorPaletteRedBorder2 : tokens.colorNeutralStroke2,
        backgroundColor: tokens.colorNeutralBackground1,
      }}
    >
      <div className="flex items-start justify-between gap-2" {...attributes} {...listeners}>
        <Text size={300} weight="semibold" block>
          {title}
        </Text>
        {item.lembreteExpirado && (
          <Badge appearance="filled" color="danger">
            Lembrete expirado
          </Badge>
        )}
      </div>

      {detalhesText && (
        <Text
          size={200}
          block
          style={{
            color: tokens.colorNeutralForeground2,
            whiteSpace: 'pre-wrap',
            marginTop: '6px',
          }}
        >
          {detalhesText}
        </Text>
      )}

      {precisaExpandir && (
        <Button
          appearance="subtle"
          size="small"
          onClick={() => setExpanded((prev) => !prev)}
          style={{ alignSelf: 'flex-start', marginTop: '4px' }}
        >
          {expanded ? 'Recolher' : 'Ver mais'}
        </Button>
      )}

      <div className="flex flex-col gap-1" style={{ marginTop: '8px' }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Tipo de RMA: {item.tipoRma ? RMA_TYPE_LABELS[item.tipoRma] ?? item.tipoRma : '-'}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Produtos: {loadingRefs ? 'Carregando...' : (referencias.length ? referencias.join(', ') : '-')}
        </Text>
        {item.dataLembrete && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Data Lembrete: {new Date(item.dataLembrete).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: '10px' }}>
        <Checkbox
          label="Cliente Informado"
          checked={item.clienteInformado ?? false}
          onChange={(_, data) => onClienteInformadoChange(item.id, Boolean(data.checked))}
        />
        <div className="flex items-center gap-2">
          <Button
            size="small"
            appearance="subtle"
            icon={<Open24Regular />}
            onClick={() => onOpenRma(item.id)}
          >
            Abrir
          </Button>
          <Button size="small" appearance="subtle" onClick={() => onOpenCadastro(item.id)}>
            Cadastro
          </Button>
        </div>
      </div>
    </Card>
  );
}
