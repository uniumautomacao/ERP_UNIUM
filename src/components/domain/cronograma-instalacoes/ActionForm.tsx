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
  Toaster,
  Toast,
  ToastBody,
  ToastTitle,
  useId,
  useToastController,
} from '@fluentui/react-components';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { STATUS_PROGRAMACAO } from '../../../features/cronograma-instalacoes/constants';
import { formatDateLong } from '../../../features/cronograma-instalacoes/utils';

interface ActionFormProps {
  os: CronogramaOS;
  onSalvarPrevisao?: (data: string, comentario: string) => Promise<void> | void;
  onConfirmarData?: (comentario: string, manterData: boolean, novaData?: string) => Promise<void> | void;
  onRegistrarTentativa?: (comentario: string) => Promise<void> | void;
  onMarcarSemResposta?: () => Promise<void> | void;
  onClienteRetornou?: () => Promise<void> | void;
}

const MIN_COMMENT = 10;

export function ActionForm({
  os,
  onSalvarPrevisao,
  onConfirmarData,
  onRegistrarTentativa,
  onMarcarSemResposta,
  onClienteRetornou,
}: ActionFormProps) {
  const [comentario, setComentario] = useState('');
  const [novaData, setNovaData] = useState('');
  const [confirmacaoResposta, setConfirmacaoResposta] = useState<'manter' | 'alterar'>('manter');
  const [isSaving, setIsSaving] = useState(false);
  const toasterId = useId('cronograma-toast');
  const { dispatchToast } = useToastController(toasterId);

  const comentarioValido = comentario.trim().length >= MIN_COMMENT;
  const novaDataObrigatoria = confirmacaoResposta === 'alterar';
  const dataValida = !novaDataObrigatoria || Boolean(novaData);

  const textoComentario = useMemo(() => {
    if (comentario.length === 0) return `Mínimo de ${MIN_COMMENT} caracteres.`;
    if (comentarioValido) return 'Comentário válido.';
    return `Faltam ${MIN_COMMENT - comentario.trim().length} caracteres.`;
  }, [comentario, comentarioValido]);

  const runAction = async (label: string, action?: () => Promise<void> | void) => {
    if (!action) return;
    try {
      setIsSaving(true);
      await action();
      dispatchToast(
        <Toast>
          <ToastTitle>Sucesso</ToastTitle>
          <ToastBody>{label}</ToastBody>
        </Toast>,
        { intent: 'success' }
      );
      setComentario('');
      setNovaData('');
    } catch (err: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>Erro</ToastTitle>
          <ToastBody>{err?.message || 'Falha ao salvar.'}</ToastBody>
        </Toast>,
        { intent: 'error' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (os.statusdaprogramacao === STATUS_PROGRAMACAO.SemResposta) {
    return (
      <div className="flex flex-col gap-3">
        <Toaster toasterId={toasterId} />
        <Text size={300} weight="semibold">
          Cliente Sem Resposta
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Tentativas realizadas: {os.contagemtentativascontato ?? 0}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Última tentativa: {formatDateLong(os.datadaultimatentativadecontato)}
        </Text>
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
            placeholder="Informe a tentativa mais recente"
          />
        </Field>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => runAction('Tentativa registrada.', () => onRegistrarTentativa?.(comentario))}
            icon={undefined}
            disabled={!comentarioValido || isSaving}
          >
            Registrar nova tentativa
          </Button>
          <Button appearance="primary" onClick={() => runAction('Cliente retornou.', onClienteRetornou)} disabled={isSaving}>
            Cliente retornou
          </Button>
        </div>
      </div>
    );
  }

  if (os.statusdaprogramacao === STATUS_PROGRAMACAO.AguardandoPrimeiroContato) {
    return (
      <div className="flex flex-col gap-3">
        <Toaster toasterId={toasterId} />
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
          disabled={!comentarioValido || !dataValida || isSaving}
          onClick={() => runAction('Previsão salva.', () => onSalvarPrevisao?.(novaData, comentario))}
        >
          Salvar previsão
        </Button>
        <Button
          onClick={async () => {
            if (!comentarioValido) return;
            await runAction('Tentativa registrada.', () => onRegistrarTentativa?.(comentario));
            if (window.confirm('Cliente continua sem resposta?')) {
              await runAction('Cliente marcado como sem resposta.', onMarcarSemResposta);
            }
          }}
          disabled={!comentarioValido || isSaving}
        >
          Registrar tentativa (sem sucesso)
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Toaster toasterId={toasterId} />
      <Text size={300} weight="semibold">
        Data atual: {formatDateLong(os.datadaproximaatividade)}
      </Text>
      <Field label="O cliente confirma esta data?">
        <RadioGroup value={confirmacaoResposta} onChange={(_, data) => setConfirmacaoResposta(data.value as 'manter' | 'alterar')}>
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
        disabled={!comentarioValido || !dataValida || isSaving}
        onClick={() =>
          runAction('Confirmação salva.', () =>
            onConfirmarData?.(comentario, confirmacaoResposta === 'manter', novaDataObrigatoria ? novaData : undefined)
          )
        }
      >
        Salvar confirmação
      </Button>
      <Button
        onClick={async () => {
          if (!comentarioValido) return;
          await runAction('Tentativa registrada.', () => onRegistrarTentativa?.(comentario));
          if (window.confirm('Cliente continua sem resposta?')) {
            await runAction('Cliente marcado como sem resposta.', onMarcarSemResposta);
          }
        }}
        disabled={!comentarioValido || isSaving}
      >
        Registrar tentativa
      </Button>
    </div>
  );
}

