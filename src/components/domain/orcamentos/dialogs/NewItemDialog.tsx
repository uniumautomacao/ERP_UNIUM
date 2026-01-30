/**
 * Dialog para adicionar novo item ao orçamento
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
  Dropdown,
  Option,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ItemOrcamentoService } from '../../../../services/orcamentos/ItemOrcamentoService';
import type { OrcamentoSecao } from '../../../../features/orcamentos/types';

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

interface NewItemDialogProps {
  open: boolean;
  orcamentoId: string;
  sections: OrcamentoSecao[];
  currentSection?: string;
  onClose: () => void;
  onCreated: () => void;
}

export function NewItemDialog({
  open,
  orcamentoId,
  sections,
  currentSection,
  onClose,
  onCreated,
}: NewItemDialogProps) {
  const styles = useStyles();
  const [produtoId, setProdutoId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valorUnitario, setValorUnitario] = useState('');
  const [section, setSection] = useState(currentSection || '');
  const [ambiente, setAmbiente] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setProdutoId('');
      setReferencia('');
      setDescricao('');
      setQuantidade('1');
      setValorUnitario('');
      setSection(currentSection || (sections.length > 0 ? sections[0].name : ''));
      setAmbiente('');
    }
  }, [open, currentSection, sections]);

  const handleSubmit = async () => {
    if (!referencia.trim() || !descricao.trim() || !quantidade) {
      return;
    }

    setIsSubmitting(true);
    try {
      const qtd = parseInt(quantidade);
      const valor = parseFloat(valorUnitario) || 0;

      await ItemOrcamentoService.createItem({
        new_orcamento: orcamentoId,
        new_produto: produtoId.trim() || undefined,
        new_ref: referencia.trim(),
        new_descricao: descricao.trim(),
        new_quantidade: qtd,
        new_valordeproduto: valor,
        new_valortotal: qtd * valor,
        new_section: section || undefined,
        new_ambiente: ambiente.trim() || undefined,
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error('Erro ao criar item:', err);
      alert('Erro ao criar item. Verifique os dados e tente novamente.');
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
          <DialogTitle>Novo Item</DialogTitle>
          <DialogContent className={styles.content} onKeyDown={handleKeyDown}>
            <Field label="Produto ID" hint="GUID do produto (opcional)">
              <Input
                value={produtoId}
                onChange={(_, data) => setProdutoId(data.value)}
                placeholder="GUID do produto"
              />
            </Field>

            <Field label="Referência" required>
              <Input
                value={referencia}
                onChange={(_, data) => setReferencia(data.value)}
                placeholder="Ex: LED-001"
                autoFocus
              />
            </Field>

            <Field label="Descrição" required>
              <Textarea
                value={descricao}
                onChange={(_, data) => setDescricao(data.value)}
                placeholder="Descrição do produto..."
                rows={2}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM }}>
              <Field label="Quantidade" required>
                <Input
                  type="number"
                  value={quantidade}
                  onChange={(_, data) => setQuantidade(data.value)}
                  min="1"
                  step="1"
                />
              </Field>

              <Field label="Valor Unitário">
                <Input
                  type="number"
                  value={valorUnitario}
                  onChange={(_, data) => setValorUnitario(data.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </Field>
            </div>

            <Field label="Seção">
              <Dropdown
                value={section}
                onOptionSelect={(_, data) => setSection(data.optionValue || '')}
                placeholder="Selecione uma seção"
              >
                {sections.map((sec) => (
                  <Option key={sec.name} value={sec.name}>
                    {sec.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Ambiente">
              <Input
                value={ambiente}
                onChange={(_, data) => setAmbiente(data.value)}
                placeholder="Ex: Sala de Estar"
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
              disabled={
                !referencia.trim() || !descricao.trim() || !quantidade || isSubmitting
              }
            >
              {isSubmitting ? 'Criando...' : 'Criar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
