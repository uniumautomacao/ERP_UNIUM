import { useMemo, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { formatDateLong } from '../../../features/cronograma-instalacoes/utils';

interface ActionFormProps {
  os: CronogramaOS;
  onSalvarPrevisao?: (data: string, comentario: string) => void;
  onConfirmarData?: (comentario: string, manterData: boolean, novaData?: string) => void;
  onRegistrarTentativa?: (comentario: string) => void;
  onClienteRetornou?: () => void;
}

const MIN_COMMENT = 10;

export function ActionForm({
  os,
  onSalvarPrevisao,
  onConfirmarData,
  onRegistrarTentativa,
  onClienteRetornou,
}: ActionFormProps) {
  const [comentario, setComentario] = useState('');
  const [novaData, setNovaData] = useState('');
  const [confirmacaoResposta, setConfirmacaoResposta] = useState<'manter' | 'alterar'>('manter');

  const comentarioValido = comentario.trim().length >= MIN_COMMENT;
  const novaDataObrigatoria = confirmacaoResposta === 'alterar';
  const dataValida = !novaDataObrigatoria || Boolean(novaData);

  const textoComentario = useMemo(() => {
    if (comentario.length === 0) return `Mínimo de ${MIN_COMMENT} caracteres.`;
    if (comentarioValido) return 'Comentário válido.';
    return `Faltam ${MIN_COMMENT - comentario.trim().length} caracteres.`;
  }, [comentario, comentarioValido]);

  if (os.statusdaprogramacao === 10) {
    return (
      <div className="flex flex-col gap-3">
        <Text size={300} weight="semibold">
          Cliente Sem Resposta
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Tentativas realizadas: {os.contagemtentativascontato ?? 0}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Última tentativa: {formatDateLong(os.datadaultimatentativadecontato)}
        </Text>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onRegistrarTentativa?.('')} icon={undefined}>
            Registrar nova tentativa
          </Button>
          <Button appearance="primary" onClick={onClienteRetornou}>
            Cliente retornou
          </Button>
        </div>
      </div>
    );
  }

  if (os.statusdaprogramacao === 1) {
    return (
      <div className="flex flex-col gap-3">
        <Text size={300} weight="semibold">
          Definir data prevista
        </Text>
        <Field label="Data prevista" required>
          <Input type="date" value={novaData} onChange={(_, data) => setNovaData(data.value)} />
        </Field>
        <Field
          label="Comentário (obrigatório)"
          validationMessage={textoComentario}
          validationState={comentarioValido ? 'none' : 'warning'}
          required
        >
          <Textarea
            value={comentario}
            onChange={(_, data) => setComentario(data.value)}
            resize="vertical"
            placeholder="Informe como obteve esta previsão"
          />
        </Field>
        <Button
          appearance="primary"
          disabled={!comentarioValido || !dataValida}
          onClick={() => onSalvarPrevisao?.(novaData, comentario)}
        >
          Salvar previsão
        </Button>
        <Button onClick={() => onRegistrarTentativa?.(comentario)}>
          Registrar tentativa (sem sucesso)
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size={300} weight="semibold">
        Data atual: {formatDateLong(os.datadaproximaatividade)}
      </Text>
      <Field label="O cliente confirma esta data?">
        <RadioGroup value={confirmacaoResposta} onChange={(_, data) => setConfirmacaoResposta(data.value)}>
          <Radio value="manter" label="Sim, manter data" />
          <Radio value="alterar" label="Não, precisa alterar" />
        </RadioGroup>
      </Field>
      {confirmacaoResposta === 'alterar' && (
        <Field label="Nova data prevista" required>
          <Input type="date" value={novaData} onChange={(_, data) => setNovaData(data.value)} />
        </Field>
      )}
      <Field
        label="Comentário (obrigatório)"
        validationMessage={textoComentario}
        validationState={comentarioValido ? 'none' : 'warning'}
        required
      >
        <Textarea
          value={comentario}
          onChange={(_, data) => setComentario(data.value)}
          resize="vertical"
          placeholder="Com quem você confirmou?"
        />
      </Field>
      <Button
        appearance="primary"
        disabled={!comentarioValido || !dataValida}
        onClick={() =>
          onConfirmarData?.(comentario, confirmacaoResposta === 'manter', novaDataObrigatoria ? novaData : undefined)
        }
      >
        Salvar confirmação
      </Button>
      <Button onClick={() => onRegistrarTentativa?.(comentario)}>
        Registrar tentativa
      </Button>
    </div>
  );
}

