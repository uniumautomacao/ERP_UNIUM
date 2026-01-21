import { Badge, Button, Card, Text, tokens } from '@fluentui/react-components';
import type { MercadoriaLida } from '../../../types';

interface MercadoriaCardProps {
  item: MercadoriaLida;
  isActive: boolean;
  onActivate: (id: string) => void;
  onUpdateInfo: (id: string) => void;
}

const buildLabel = (label: string, value?: string | number | null) =>
  `${label}: ${value ?? '-'}`;

export function MercadoriaCard({ item, isActive, onActivate, onUpdateInfo }: MercadoriaCardProps) {
  return (
    <Card
      style={{
        padding: '16px',
        borderRadius: 8,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <Text size={300} weight="semibold">
          {item.etiqueta ? `Código ${item.etiqueta}` : item.numeroSerie ?? 'Mercadoria'}
        </Text>
        <Badge appearance="tint" color={isActive ? 'success' : 'warning'}>
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="flex flex-col gap-1" style={{ marginTop: tokens.spacingVerticalS }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('Código', item.etiqueta)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('SN', item.numeroSerie)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('REF', item.referencia)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('Quantidade', item.quantidade)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('Situação', item.situacao)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('Endereço', item.endereco)}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {buildLabel('Cliente', item.cliente)}
        </Text>
      </div>

      <div className="flex flex-wrap gap-2" style={{ marginTop: tokens.spacingVerticalM }}>
        <Button appearance="primary" onClick={() => onActivate(item.id)} disabled={isActive}>
          Ativar mercadoria
        </Button>
        <Button appearance="secondary" onClick={() => onUpdateInfo(item.id)}>
          Atualizar informações
        </Button>
      </div>
    </Card>
  );
}
