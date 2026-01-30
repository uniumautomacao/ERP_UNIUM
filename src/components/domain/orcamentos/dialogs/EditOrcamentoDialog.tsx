/**
 * Dialog para editar informações do orçamento
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
  Checkbox,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { OrcamentoService } from '../../../../services/orcamentos/OrcamentoService';
import type { Orcamento } from '../../../../features/orcamentos/types';

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

interface EditOrcamentoDialogProps {
  open: boolean;
  orcamento: Orcamento | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditOrcamentoDialog({
  open,
  orcamento,
  onClose,
  onSaved,
}: EditOrcamentoDialogProps) {
  const styles = useStyles();
  const [name, setName] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState('');
  const [semInstalacao, setSemInstalacao] = useState(false);
  const [anotacoes, setAnotacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados do orçamento quando abrir
  useEffect(() => {
    if (open && orcamento) {
      setName(orcamento.new_name || '');
      setConsultorId(orcamento.new_consultor || '');
      setProjetoId(orcamento.new_projeto || '');
      setDescontoPercentual(
        orcamento.new_descontopercentual ? String(orcamento.new_descontopercentual) : ''
      );
      setSemInstalacao(orcamento.new_seminstalacao || false);
      setAnotacoes(orcamento.new_anotacao || '');
    }
  }, [open, orcamento]);

  const handleSubmit = async () => {
    if (!orcamento) return;

    setIsSubmitting(true);
    try {
      await OrcamentoService.updateOrcamento(orcamento.new_orcamentoid, {
        new_name: name.trim() || undefined,
        new_consultor: consultorId.trim() || undefined,
        new_projeto: projetoId.trim() || undefined,
        new_descontopercentual: descontoPercentual
          ? parseFloat(descontoPercentual)
          : undefined,
        new_seminstalacao: semInstalacao,
        new_anotacao: anotacoes.trim() || undefined,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar orçamento:', err);
      alert('Erro ao atualizar orçamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Editar Orçamento</DialogTitle>
          <DialogContent className={styles.content} onKeyDown={handleKeyDown}>
            <Field label="Nome do Orçamento">
              <Input
                value={name}
                onChange={(_, data) => setName(data.value)}
                placeholder="Nome do orçamento"
                autoFocus
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

            <Field label="Desconto Percentual" hint="Ex: 10 para 10%">
              <Input
                type="number"
                value={descontoPercentual}
                onChange={(_, data) => setDescontoPercentual(data.value)}
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            </Field>

            <Checkbox
              checked={semInstalacao}
              onChange={(_, data) => setSemInstalacao(data.checked as boolean)}
              label="Sem instalação"
            />

            <Field label="Anotações">
              <Textarea
                value={anotacoes}
                onChange={(_, data) => setAnotacoes(data.value)}
                placeholder="Observações sobre o orçamento..."
                rows={4}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
