import {
  Button,
  Card,
  Field,
  Input,
  Spinner,
  SpinButton,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ArrowSync24Regular } from '@fluentui/react-icons';
import type { DeviceIOProduct, DeviceIODimensions } from '../../../types';
import { StatusBadge } from '../../shared/StatusBadge';
import { DeviceIOConnectionsSection } from './DeviceIOConnectionsSection';

interface DeviceIOEditorState {
  template: {
    Dimensions: DeviceIODimensions;
    RackCategory: string;
    Connections: Array<{
      Name: string;
      Type: string;
      Direction: string;
    }>;
  } | null;
  isDirty: boolean;
  saving: boolean;
  error: string;
  connectionTypes: Array<{ value: number; label: string }>;
  connectionDirections: Array<{ value: number; label: string }>;
  setDimensions: (dims: DeviceIODimensions) => void;
  setRackCategory: (category: string) => void;
  addConnection: (connection: { Name: string; Type: string; Direction: string }) => void;
  updateConnection: (index: number, connection: { Name: string; Type: string; Direction: string }) => void;
  removeConnection: (index: number) => void;
  save: () => Promise<void>;
}

interface DeviceIOEditorViewProps {
  product: DeviceIOProduct;
  manufacturerName: string;
  editor: DeviceIOEditorState;
  onRefresh: () => void;
}

export function DeviceIOEditorView({
  product,
  manufacturerName,
  editor,
  onRefresh,
}: DeviceIOEditorViewProps) {
  const { template } = editor;

  if (!template) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <Spinner size="large" />
      </div>
    );
  }

  const statusLabel = editor.error
    ? 'Erro ao salvar'
    : editor.saving || editor.isDirty
      ? 'Salvando...'
      : 'Salvo';
  const statusType = editor.error
    ? 'error'
    : editor.saving || editor.isDirty
      ? 'warning'
      : 'active';

  const handleDimensionChange = (field: keyof DeviceIODimensions, value: number | null) => {
    editor.setDimensions({
      ...template.Dimensions,
      [field]: value ?? 0,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card style={{ padding: '16px' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text size={500} weight="semibold" block>
              {product.cr22f_title}
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              {manufacturerName}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {(editor.saving || editor.isDirty) && <Spinner size="tiny" />}
            <StatusBadge status={statusType} label={statusLabel} />
            <Button appearance="subtle" icon={<ArrowSync24Regular />} onClick={onRefresh}>
              Atualizar
            </Button>
          </div>
        </div>
        {editor.error && (
          <Text
            size={300}
            style={{ color: tokens.colorPaletteRedForeground1, marginTop: '8px' }}
          >
            {editor.error}
          </Text>
        )}
      </Card>

      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
        <Card style={{ padding: '20px' }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
            Dimensões
          </Text>
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <Field label="Largura (mm)" required>
              <SpinButton
                value={template.Dimensions.Width}
                onChange={(_, data) => handleDimensionChange('Width', data.value ?? 0)}
                min={0}
                step={1}
              />
            </Field>
            <Field label="Altura (U)" required>
              <SpinButton
                value={template.Dimensions.H}
                onChange={(_, data) => handleDimensionChange('H', data.value ?? 0)}
                min={0}
                step={1}
              />
            </Field>
            <Field label="Profundidade (mm)" required>
              <SpinButton
                value={template.Dimensions.Depth}
                onChange={(_, data) => handleDimensionChange('Depth', data.value ?? 0)}
                min={0}
                step={1}
              />
            </Field>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: '12px' }}>
            Categoria do Rack
          </Text>
          <Field label="Categoria">
            <Input
              value={template.RackCategory}
              onChange={(_, data) => editor.setRackCategory(data.value)}
              placeholder="Ex: Server, Network, Storage..."
            />
          </Field>
        </Card>
      </div>

      <DeviceIOConnectionsSection
        connections={template.Connections}
        connectionTypes={editor.connectionTypes}
        connectionDirections={editor.connectionDirections}
        onAdd={editor.addConnection}
        onUpdate={editor.updateConnection}
        onRemove={editor.removeConnection}
      />
    </div>
  );
}
