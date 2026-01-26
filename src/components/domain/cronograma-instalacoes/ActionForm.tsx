/**
 * Componente ActionForm - Formulário de Ações para Cronograma de Instalações
 * 
 * Propósito: Gerencia a captura de ações relacionadas ao cronograma de instalações e contato com clientes,
 * incluindo registro de tentativas de contato, confirmação/alteração de datas de instalação e marcação
 * de clientes sem resposta.
 * 
 * Integração: Conecta com o sistema de Cronograma de Instalações via callbacks, integrando com Dataverse
 * através dos handlers passados como props.
 * 
 * Estados diferentes: O componente renderiza interfaces diferentes baseadas no status de programação (OS).
 * - STATUS_PROGRAMACAO.SemResposta: Interface para registrar novas tentativas de contato
 * - STATUS_PROGRAMACAO.AguardandoPrimeiroContato: Interface para definir data prevista inicial
 * - Demais estados: Interface para confirmar/alterar data já existente
 */

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

/**
 * Props do componente ActionForm
 * @interface ActionFormProps
 * @property {CronogramaOS} os - Dados da Ordem de Serviço com informações de cronograma
 * @property {Function} onSalvarPrevisao - Callback para salvar data prevista inicial (apenas para AguardandoPrimeiroContato)
 * @property {Function} onConfirmarData - Callback para confirmar ou alterar data já existente
 * @property {Function} onRegistrarTentativa - Callback para registrar tentativa de contato com cliente
 * @property {Function} onMarcarSemResposta - Callback para marcar cliente como permanentemente sem resposta
 * @property {Function} onClienteRetornou - Callback para indicar que cliente retornou após período de inatividade
 */
interface ActionFormProps {
  os: CronogramaOS;
  onSalvarPrevisao?: (data: string, comentario: string) => Promise<void> | void;
  onConfirmarData?: (comentario: string, manterData: boolean, novaData?: string) => Promise<void> | void;
  onRegistrarTentativa?: (comentario: string) => Promise<void> | void;
  onMarcarSemResposta?: () => Promise<void> | void;
  onClienteRetornou?: () => Promise<void> | void;
}

/**
 * Comprimento mínimo requerido para comentários de ações.
 * Garante que registros contenham informações suficientes para auditoria e histórico.
 */
const MIN_COMMENT = 10;

/**
 * Componente principal ActionForm
 * 
 * Responsabilidades:
 * 1. Capturar entrada do usuário (comentários e datas)
 * 2. Validar dados antes de enviar (comprimento mínimo de comentário, datas obrigatórias)
 * 3. Renderizar interface diferente conforme status da OS
 * 4. Gerenciar feedback ao usuário via toasts de sucesso/erro
 * 
 * Fluxo de ação: O usuário preenche o formulário → valida os dados → clica em ação
 *                → runAction executa o callback → exibe toast de resultado → limpa formulário
 */
export function ActionForm({
  os,
  onSalvarPrevisao,
  onConfirmarData,
  onRegistrarTentativa,
  onMarcarSemResposta,
  onClienteRetornou,
}: ActionFormProps) {
  // Estado de entrada do usuário
  const [comentario, setComentario] = useState('');
  const [novaData, setNovaData] = useState('');
  const [confirmacaoResposta, setConfirmacaoResposta] = useState<'manter' | 'alterar'>('manter');
  
  // Estado de controle de operação
  const [isSaving, setIsSaving] = useState(false);
  
  // Configuração do sistema de notificações Fluent UI
  const toasterId = useId('cronograma-toast');
  const { dispatchToast } = useToastController(toasterId);

  // Lógica de validação: comentário deve ter no mínimo MIN_COMMENT caracteres
  const comentarioValido = comentario.trim().length >= MIN_COMMENT;
  
  // Determina se nova data é obrigatória (apenas quando usuário escolhe alterar)
  const novaDataObrigatoria = confirmacaoResposta === 'alterar';
  
  // Data é válida quando: não é obrigatória OU está preenchida
  const dataValida = !novaDataObrigatoria || Boolean(novaData);

  /**
   * Texto de feedback dinâmico sobre validação do comentário
   * 
   * Usa useMemo para evitar recálculos desnecessários durante renders
   * Retorna mensagens progressivas conforme o usuário digita
   * 
   * Exemplos:
   * - Campo vazio: "Mínimo de 10 caracteres."
   * - Válido: "Comentário válido."
   * - Incompleto: "Faltam 5 caracteres."
   */
  const textoComentario = useMemo(() => {
    if (comentario.length === 0) return `Mínimo de ${MIN_COMMENT} caracteres.`;
    if (comentarioValido) return 'Comentário válido.';
    return `Faltam ${MIN_COMMENT - comentario.trim().length} caracteres.`;
  }, [comentario, comentarioValido]);

  /**
   * Função genérica para executar ações com tratamento de erros e feedback
   * 
   * Propósito: Centralizar lógica de:
   * - Execução de callbacks de negócio (salvamento, registro, etc)
   * - Gerenciamento de estado de carregamento (isSaving)
   * - Tratamento de erros com mensagens customizadas
   * - Feedback visual via toasts
   * - Limpeza de formulário após sucesso
   * 
   * Fluxo de execução:
   * 1. Valida se ação foi fornecida
   * 2. Ativa loading (isSaving = true)
   * 3. Executa callback do negócio (onSalvarPrevisao, onRegistrarTentativa, etc)
   * 4. Exibe toast de sucesso com mensagem customizada (label)
   * 5. Limpa formulário (comentário e data)
   * 6. Em caso de erro: exibe toast com mensagem de erro
   * 7. Finalmente: desativa loading (isSaving = false)
   * 
   * @param {string} label - Mensagem de sucesso exibida no toast
   * @param {Function} action - Callback de negócio a executar (assíncrono ou síncrono)
   * 
   * Exemplo de uso:
   * await runAction('Previsão salva.', () => onSalvarPrevisao?.(novaData, comentario))
   */
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
      // Limpa campos após ação bem-sucedida
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

  /**
   * INTERFACE PARA STATUS: "SEM RESPOSTA"
   * 
   * Contexto: OS está marcada como cliente sem resposta. Mostra histórico de tentativas
   * e oferece opções para registrar nova tentativa ou indicar que cliente retornou.
   * 
   * Campos exibidos:
   * - Contagem de tentativas anteriores (auditoria)
   * - Data da última tentativa (controle de frequência)
   * - Textarea para comentário da nova tentativa (obrigatório)
   * 
   * Ações disponíveis:
   * 1. Registrar nova tentativa: incrementa contagem, registra comentário
   * 2. Cliente retornou: reativa OS, permite novo fluxo de confirmação de data
   */
  if (os.statusdaprogramacao === STATUS_PROGRAMACAO.SemResposta) {
    return (
      <div className="flex flex-col gap-3">
        <Toaster toasterId={toasterId} />
        <Text size={300} weight="semibold">
          Cliente Sem Resposta
        </Text>
        
        {/* Informações de auditoria: mostra histórico de tentativas anteriores */}
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Tentativas realizadas: {os.contagemtentativascontato ?? 0}
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Última tentativa: {formatDateLong(os.datadaultimatentativadecontato)}
        </Text>
        
        {/* Textarea para capturar detalhes da nova tentativa de contato */}
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
        
        {/* Ações para esta interface */}
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

  /**
   * INTERFACE PARA STATUS: "AGUARDANDO PRIMEIRO CONTATO"
   * 
   * Contexto: OS necessita de uma data prevista inicial, pois ainda não foi agendada nenhuma data.
   * Usuário precisa coletar informação do cliente e registrá-la no sistema.
   * 
   * Campos requeridos:
   * - Data prevista para instalação (picker de data)
   * - Comentário explicando como obteve a informação (auditoria de fonte)
   * 
   * Fluxo de ações:
   * 1. Salvar previsão: registra data e comentário como confirmação inicial
   * 2. Registrar tentativa (sem sucesso): indica que cliente ainda não respondeu,
   *    oferecendo opção de marcar como "permanentemente sem resposta"
   */
  if (os.statusdaprogramacao === STATUS_PROGRAMACAO.AguardandoPrimeiroContato) {
    return (
      <div className="flex flex-col gap-3">
        <Toaster toasterId={toasterId} />
        <Text size={300} weight="semibold">
          Definir data prevista
        </Text>
        
        {/* Input de data para capturar a previsão inicial */}
        <Field label="Data prevista" required>
          <Input type="date" value={novaData} onChange={(_, data) => setNovaData(data.value)} />
        </Field>
        
        {/* Comentário para documentar origem da informação (com quem falou, etc) */}
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
        
        {/* Ação principal: salvar previsão com data e comentário */}
        <Button
          appearance="primary"
          disabled={!comentarioValido || !dataValida || isSaving}
          onClick={() => runAction('Previsão salva.', () => onSalvarPrevisao?.(novaData, comentario))}
        >
          Salvar previsão
        </Button>
        
        {/* Ação alternativa: registrar tentativa falhada, com opção de marcar como sem resposta */}
        <Button
          onClick={async () => {
            if (!comentarioValido) return;
            // Primeira ação: registra a tentativa de contato
            await runAction('Tentativa registrada.', () => onRegistrarTentativa?.(comentario));
            // Segunda ação: após registrar, oferece opção de marcar cliente como sem resposta permanente
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

  /**
   * INTERFACE PADRÃO: PARA OUTROS ESTADOS DE PROGRAMAÇÃO
   * 
   * Contexto: OS já possui uma data prevista definida. Usuário pode confirmar (manter)
   * ou solicitar alteração, com registro de quem confirmou e quando.
   * 
   * Fluxo normal:
   * 1. Usuário radio confirma se data está ok
   * 2. Se "não", novo input de data é exibido (confirmacaoResposta === 'alterar')
   * 3. Usuário preenche comentário com detalhes (com quem falou, contexto, etc)
   * 4. Clica em "Salvar confirmação" para registrar decisão
   * 
   * Alternativa: usuário pode registrar tentativa de contato falhada e opcionalmente
   * marcar cliente como sem resposta.
   */
  return (
    <div className="flex flex-col gap-3">
      <Toaster toasterId={toasterId} />
      
      {/* Exibe a data prevista atual para contexto do usuário */}
      <Text size={300} weight="semibold">
        Data atual: {formatDateLong(os.datadaproximaatividade)}
      </Text>
      
      {/* RadioGroup para capturar decisão do cliente sobre manutenção/alteração de data */}
      <Field label="O cliente confirma esta data?">
        <RadioGroup value={confirmacaoResposta} onChange={(_, data) => setConfirmacaoResposta(data.value as 'manter' | 'alterar')}>
          <Radio value="manter" label="Sim, manter data" />
          <Radio value="alterar" label="Não, precisa alterar" />
        </RadioGroup>
      </Field>
      
      {/* Input de nova data aparece SOMENTE se usuário selecionou "alterar" */}
      {confirmacaoResposta === 'alterar' && (
        <Field label="Nova data prevista" required>
          <Input type="date" value={novaData} onChange={(_, data) => setNovaData(data.value)} />
        </Field>
      )}
      
      {/* Comentário para auditoria: registra com quem foi falado, contexto da conversa, etc */}
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
      
      {/* Ação principal: salva a confirmação/alteração de data */}
      <Button
        appearance="primary"
        disabled={!comentarioValido || !dataValida || isSaving}
        onClick={() =>
          runAction('Confirmação salva.', () =>
            // Passa: comentário, se deve manter data (true/false), e nova data (se houver alteração)
            onConfirmarData?.(comentario, confirmacaoResposta === 'manter', novaDataObrigatoria ? novaData : undefined)
          )
        }
      >
        Salvar confirmação
      </Button>
      
      {/* Ação alternativa: registrar tentativa falhada com opção de marcar como sem resposta */}
      <Button
        onClick={async () => {
          if (!comentarioValido) return;
          // Primeira ação: registra tentativa de contato
          await runAction('Tentativa registrada.', () => onRegistrarTentativa?.(comentario));
          // Segunda ação: após registrar, oferece opção de marcar cliente como sem resposta
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

