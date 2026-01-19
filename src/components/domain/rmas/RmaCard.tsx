import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  tokens,
} from '@fluentui/react-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal24Regular, Open24Regular } from '@fluentui/react-icons';
import { RmaCardData } from '../../../features/rmas/types';
import { RMA_TYPE_LABELS } from '../../../features/rmas/constants';

interface RmaCardProps {
  item: RmaCardData;
  title: string;
  references?: string[];
  referencesLoading?: boolean;
  onOpenRma: (id: string) => void;
  onOpenCadastro: (id: string) => void;
  onClienteInformadoChange: (id: string, checked: boolean) => void;
}

export function RmaCard({
  item,
  title,
  references,
  referencesLoading,
  onOpenRma,
  onOpenCadastro,
  onClienteInformadoChange,
}: RmaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [expanded, setExpanded] = useState(false);

  const cardStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: 6,
    boxShadow: isDragging ? `0 8px 18px ${tokens.colorNeutralShadowAmbient}` : undefined,
  }), [transform, transition, isDragging]);

  const detalhesText = useMemo(() => {
    const descricao = item.descricao?.trim() || '';
    const observacoes = item.observacoes?.trim() || '';
    if (descricao && observacoes) {
      return `${descricao}\n\n${observacoes}`;
    }
    return descricao || observacoes;
  }, [item.descricao, item.observacoes]);

  const lembreteOverdue = item.dataLembrete ? new Date(item.dataLembrete) < new Date() : false;
  const lembreteVencido = item.lembreteExpirado || lembreteOverdue;
  const alertHighlight = item.sinalizar || lembreteVencido;

  const tipoLabel = item.tipoRma ? RMA_TYPE_LABELS[item.tipoRma] ?? String(item.tipoRma) : null;
  const referenciasValidas = useMemo(() => {
    if (!references || references.length === 0) {
      return [];
    }
    return Array.from(new Set(references)).filter(Boolean);
  }, [references]);
  const referenciasPreview = referenciasValidas.slice(0, 2);
  const referenciasExtra = referenciasValidas.length - referenciasPreview.length;
  const referenciasLabel = referencesLoading && referenciasValidas.length === 0
    ? 'Carregando...'
    : referenciasValidas.length > 0
      ? `${referenciasPreview.join(', ')}${referenciasExtra > 0 ? ` +${referenciasExtra}` : ''}`
      : '-';

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...cardStyle,
        padding: '12px',
        borderStyle: alertHighlight ? 'dashed' : 'solid',
        borderColor: alertHighlight ? tokens.colorPaletteRedBorder2 : tokens.colorNeutralStroke2,
        backgroundColor: tokens.colorNeutralBackground1,
        minHeight: 140,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="flex flex-wrap items-center gap-2"
            {...attributes}
            {...listeners}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <Text
              size={300}
              weight="semibold"
              block
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Text>
            {lembreteVencido && (
              <Badge appearance="filled" color="danger">
                Lembrete vencido
              </Badge>
            )}
            {item.sinalizar && (
              <Badge appearance="filled" color="warning">
                Sinalizado
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="small"
            appearance="subtle"
            icon={<Open24Regular />}
            aria-label="Abrir RMA"
            onClick={() => onOpenRma(item.id)}
          />
          <Menu>
            <MenuTrigger>
              <Button
                size="small"
                appearance="subtle"
                icon={<MoreHorizontal24Regular />}
                aria-label="Mais ações"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => onOpenCadastro(item.id)}>
                  Cadastro de mercadoria
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <div className="flex flex-col gap-1" style={{ marginTop: '8px' }}>
        <div className="flex flex-wrap items-center gap-2">
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Tipo de RMA
          </Text>
          {tipoLabel ? (
            <Badge appearance="tint" color="informative" size="small">
              {tipoLabel}
            </Badge>
          ) : (
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              -
            </Text>
          )}
        </div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Produtos: {referenciasLabel}
        </Text>
      </div>

      <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
        <Button
          appearance="subtle"
          size="small"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          style={{ alignSelf: 'flex-start' }}
        >
          {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
        </Button>

        {expanded && (
          <div
            className="flex flex-col gap-2"
            style={{
              paddingTop: '8px',
              borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            }}
          >
            {detalhesText && (
              <Text
                size={200}
                block
                style={{
                  color: tokens.colorNeutralForeground2,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {detalhesText}
              </Text>
            )}
            {item.assistenciaTecnica && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Assistência técnica: {item.assistenciaTecnica}
              </Text>
            )}
            {item.codigoRastreio && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Código de rastreio: {item.codigoRastreio}
              </Text>
            )}
            {item.dataLembrete && (
              <Text
                size={200}
                style={{
                  color: lembreteVencido
                    ? tokens.colorPaletteRedForeground1
                    : tokens.colorNeutralForeground2,
                }}
              >
                Lembrete: {new Date(item.dataLembrete).toLocaleDateString('pt-BR')}
              </Text>
            )}
            <Checkbox
              label="Cliente informado"
              checked={item.clienteInformado ?? false}
              onChange={(_, data) => onClienteInformadoChange(item.id, Boolean(data.checked))}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
