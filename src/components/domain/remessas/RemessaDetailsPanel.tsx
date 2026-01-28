import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Divider,
  Dropdown,
  Field,
  Input,
  Option,
  Text,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { RemessaCardData, RemessaHistoricoItem, RemessaProdutoItem, TransportadoraOption } from '../../../features/remessas/types';
import { REMESSA_PRIORITIES, REMESSA_STAGES } from '../../../features/remessas/constants';
import { ProdutosDaRemessaList } from './ProdutosDaRemessaList';
import { HistoricoRemessaTimeline } from './HistoricoRemessaTimeline';
import { EmptyState } from '../../shared/EmptyState';

interface RemessaDetails extends RemessaCardData {
  transportadoraId?: string | null;
  fornecedorId?: string | null;
  remessaOrigemId?: string | null;
}

interface RemessaDetailsPanelProps {
  remessa: RemessaDetails | null;
  saving?: boolean;
  transportadoras: TransportadoraOption[];
  produtos: RemessaProdutoItem[];
  produtosLoading?: boolean;
  historico: RemessaHistoricoItem[];
  historicoLoading?: boolean;
  onSalvar: (changes: {
    new_estagiodamovimentacao?: number | null;
    new_transportadoraId?: string | null;
    new_prioridade?: number | null;
    new_codigoderastreio?: string | null;
    new_previsaodeenvio?: string | null;
    new_previsaodechegada?: string | null;
    new_datadeenvio?: string | null;
    new_dataderecebimento?: string | null;
    new_notas?: string | null;
  }) => void;
  onSelecionarProdutos?: (items: RemessaProdutoItem[]) => void;
  onOpenDividir: () => void;
  onOpenJuntar: () => void;
  onOpenMover: () => void;
}

const toInputDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export function RemessaDetailsPanel({
  remessa,
  saving,
  transportadoras,
  produtos,
  produtosLoading,
  historico,
  historicoLoading,
  onSalvar,
  onSelecionarProdutos,
  onOpenDividir,
  onOpenJuntar,
  onOpenMover,
}: RemessaDetailsPanelProps) {
  const [stageValue, setStageValue] = useState<string>('');
  const [transportadoraId, setTransportadoraId] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [previsaoEnvio, setPrevisaoEnvio] = useState('');
  const [previsaoChegada, setPrevisaoChegada] = useState('');
  const [dataEnvio, setDataEnvio] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!remessa) return;
    setStageValue(remessa.stageValue ? String(remessa.stageValue) : '');
    setTransportadoraId(remessa.transportadoraId ?? '');
    setPrioridade(remessa.prioridade !== null && remessa.prioridade !== undefined ? String(remessa.prioridade) : '');
    setCodigoRastreio(remessa.codigoRastreio ?? '');
    setPrevisaoEnvio(toInputDate(remessa.previsaoEnvio));
    setPrevisaoChegada(toInputDate(remessa.previsaoChegada));
    setDataEnvio(toInputDate(remessa.dataEnvio));
    setDataRecebimento(toInputDate(remessa.dataRecebimento));
    setNotas(remessa.notas ?? '');
  }, [remessa]);

  const transportadoraLabel = useMemo(() => {
    if (!transportadoraId) return '';
    return transportadoras.find((item) => item.id === transportadoraId)?.label ?? '';
  }, [transportadoraId, transportadoras]);

  const stageLabel = useMemo(() => {
    if (!stageValue) return '';
    return REMESSA_STAGES.find((stage) => stage.value === Number(stageValue))?.label ?? '';
  }, [stageValue]);

  const prioridadeLabel = useMemo(() => {
    if (!prioridade) return '';
    return REMESSA_PRIORITIES.find((item) => item.value === Number(prioridade))?.label ?? '';
  }, [prioridade]);

  if (!remessa) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState title="Selecione uma remessa" description="Para ver detalhes, produtos e histórico." />
      </div>
    );
  }

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
        <Text size={300} weight="semibold" block>
          {remessa.codigo || remessa.id}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }} block>
          Fornecedor: {remessa.fornecedor || '-'}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }} block>
          Transportadora: {remessa.transportadora || '-'}
        </Text>
      </div>

      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground1,
        }}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Estágio">
            <Dropdown
              value={stageLabel}
              placeholder="Selecione"
              onOptionSelect={(_, data) => setStageValue(data.optionValue as string)}
            >
              {REMESSA_STAGES.map((stage) => (
                <Option key={stage.value} value={String(stage.value)}>
                  {stage.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Prioridade">
            <Dropdown
              value={prioridadeLabel}
              placeholder="Selecione"
              onOptionSelect={(_, data) => setPrioridade(data.optionValue as string)}
            >
              {REMESSA_PRIORITIES.map((item) => (
                <Option key={item.value} value={String(item.value)}>
                  {item.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Transportadora">
            <Dropdown
              value={transportadoraLabel}
              placeholder="Selecione"
              onOptionSelect={(_, data) => setTransportadoraId(data.optionValue as string)}
            >
              {transportadoras.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Código de rastreio">
            <Input value={codigoRastreio} onChange={(_, data) => setCodigoRastreio(data.value)} />
          </Field>
          <Field label="Previsão de envio">
            <Input type="date" value={previsaoEnvio} onChange={(_, data) => setPrevisaoEnvio(data.value)} />
          </Field>
          <Field label="Previsão de chegada">
            <Input type="date" value={previsaoChegada} onChange={(_, data) => setPrevisaoChegada(data.value)} />
          </Field>
          <Field label="Data de envio">
            <Input type="date" value={dataEnvio} onChange={(_, data) => setDataEnvio(data.value)} />
          </Field>
          <Field label="Data de recebimento">
            <Input type="date" value={dataRecebimento} onChange={(_, data) => setDataRecebimento(data.value)} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Notas">
            <Textarea value={notas} onChange={(_, data) => setNotas(data.value)} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            appearance="primary"
            onClick={() =>
              onSalvar({
                new_estagiodamovimentacao: stageValue ? Number(stageValue) : null,
                new_transportadoraId: transportadoraId || null,
                new_prioridade: prioridade ? Number(prioridade) : null,
                new_codigoderastreio: codigoRastreio || null,
                new_previsaodeenvio: previsaoEnvio || null,
                new_previsaodechegada: previsaoChegada || null,
                new_datadeenvio: dataEnvio || null,
                new_dataderecebimento: dataRecebimento || null,
                new_notas: notas || null,
              })
            }
            disabled={saving}
          >
            Salvar alterações
          </Button>
          <Button appearance="secondary" onClick={onOpenDividir}>
            Dividir remessa
          </Button>
          <Button appearance="secondary" onClick={onOpenJuntar}>
            Juntar remessas
          </Button>
          <Button appearance="secondary" onClick={onOpenMover}>
            Mover itens
          </Button>
        </div>
      </div>

      <Divider />

      <div>
        <Text size={300} weight="semibold" block style={{ marginBottom: '8px' }}>
          Produtos da remessa
        </Text>
        <ProdutosDaRemessaList
          items={produtos}
          loading={produtosLoading}
          onSelectionChange={onSelecionarProdutos}
        />
      </div>

      <div>
        <Text size={300} weight="semibold" block style={{ marginBottom: '8px' }}>
          Histórico
        </Text>
        <HistoricoRemessaTimeline items={historico} loading={historicoLoading} />
      </div>
    </div>
  );
}
