/**
 * Dialog para criar novo orçamento
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Field,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { OrcamentoService } from '../../../../services/orcamentos/OrcamentoService';

const useStyles = makeStyles({
  surface: {
    maxWidth: '600px',
    width: '90vw',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

interface NewOrcamentoDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (orcamentoId: string) => void;
}

export function NewOrcamentoDialog({
  open,
  onClose,
  onCreated,
}: NewOrcamentoDialogProps) {
  const styles = useStyles();
  const [name, setName] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setName('');
      setClienteId('');
      setConsultorId('');
      setProjetoId('');
      setAnotacoes('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!clienteId.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const orcamentoId = await OrcamentoService.createOrcamento({
        new_name: name.trim() || undefined,
        new_cliente: clienteId.trim(),
        new_consultor: consultorId.trim() || undefined,
        new_projeto: projetoId.trim() || undefined,
        new_anotacao: anotacoes.trim() || undefined,
      });

      onCreated(orcamentoId);
      onClose();
    } catch (err) {
      console.error('Erro ao criar orçamento:', err);
      alert('Erro ao criar orçamento. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogContent className={styles.content} onKeyDown={handleKeyDown}>
            <Field label="Cliente" required hint="ID do cliente no Dataverse">
              <Input
                value={clienteId}
                onChange={(_, data) => setClienteId(data.value)}
                placeholder="GUID do cliente"
                autoFocus
              />
            </Field>

            <Field label="Nome do Orçamento" hint="Opcional - será auto-gerado se vazio">
              <Input
                value={name}
                onChange={(_, data) => setName(data.value)}
                placeholder="Ex: Projeto Residencial - Cliente X"
              />
            </Field>

            <Field label="Consultor" hint="ID do usuário consultor">
              <Input
                value={consultorId}
                onChange={(_, data) => setConsultorId(data.value)}
                placeholder="GUID do consultor"
              />
            </Field>

            <Field label="Projeto" hint="ID do projeto relacionado">
              <Input
                value={projetoId}
                onChange={(_, data) => setProjetoId(data.value)}
                placeholder="GUID do projeto"
              />
            </Field>

            <Field label="Anotações">
              <Textarea
                value={anotacoes}
                onChange={(_, data) => setAnotacoes(data.value)}
                placeholder="Observações sobre o orçamento..."
                rows={3}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!clienteId.trim() || isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
