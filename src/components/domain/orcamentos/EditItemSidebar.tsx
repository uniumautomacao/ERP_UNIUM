/**
 * Sidebar para edição de item de orçamento
 * Permite editar campos básicos e opções de fornecimento
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Field,
  Dropdown,
  Option,
  Input,
  makeStyles,
  tokens,
  Divider,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Save24Regular,
  DismissCircle24Regular,
  ArrowUndo24Regular,
  Delete24Regular,
  CalendarClock24Regular,
} from '@fluentui/react-icons';
import type { ItemOrcamento, OrcamentoSecao } from '../../../features/orcamentos/types';
import { ProdutoCombobox } from './ProdutoCombobox';
import { ItemOrcamentoService } from '../../../services/orcamentos/ItemOrcamentoService';

const useStyles = makeStyles({
  drawer: {
    width: '480px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  actionsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  saveActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground1,
  },
});

interface EditItemSidebarProps {
  open: boolean;
  item: ItemOrcamento | null;
  sections: OrcamentoSecao[];
  onClose: () => void;
  onSave: (itemId: string, updates: Partial<ItemOrcamento>) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export function EditItemSidebar({
  open,
  item,
  sections,
  onClose,
  onSave,
  onRemove,
}: EditItemSidebarProps) {
  const styles = useStyles();

  // Estado local dos campos editáveis
  const [produtoId, setProdutoId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');
  const [ambiente, setAmbiente] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [opcaoFornecimento, setOpcaoFornecimento] = useState<number>(100000000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar campos quando o item mudar
  useEffect(() => {
    if (item) {
      const produtoValue = item._new_produto_value || item.new_produto || '';
      setProdutoId(produtoValue);
      setQuantidade(String(item.new_quantidade || 1));
      setAmbiente(item.new_ambiente || '');
      setSection(item.new_section || '');
      setOpcaoFornecimento(item.new_opcaodefornecimento || 100000000);
      setHasChanges(false);
    }
  }, [item]);

  // Buscar produto atual se não veio no payload
  useEffect(() => {
    if (!item) return;
    if (item._new_produto_value || item.new_produto) return;

    let isActive = true;
    ItemOrcamentoService.fetchItemById(item.new_itemdeorcamentoid, {
      select: ['_new_produto_value', 'new_produto'],
    })
      .then((fullItem) => {
        if (!isActive || !fullItem) return;
        const prodId = fullItem._new_produto_value || fullItem.new_produto;
        if (!prodId) return;
        setProdutoId(prodId);
      })
      .catch((err) => console.error('Erro ao carregar produto do item:', err));

    return () => {
      isActive = false;
    };
  }, [item]);

  // Detectar mudanças
  useEffect(() => {
    if (!item) return;

    const changed =
      produtoId !== (item._new_produto_value || item.new_produto || '') ||
      quantidade !== String(item.new_quantidade || 1) ||
      ambiente !== (item.new_ambiente || '') ||
      section !== (item.new_section || '') ||
      opcaoFornecimento !== (item.new_opcaodefornecimento || 100000000);

    setHasChanges(changed);
  }, [item, produtoId, quantidade, ambiente, section, opcaoFornecimento]);

  // Pode definir como compra futura?
  const canSetCompraFutura = useMemo(() => {
    return opcaoFornecimento === 100000000;
  }, [opcaoFornecimento]);

  // Pode restaurar?
  const canRestore = useMemo(() => {
    return opcaoFornecimento === 100000001;
  }, [opcaoFornecimento]);

  const handleSave = async () => {
    if (!item || !hasChanges) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<ItemOrcamento> = {};

      if (produtoId !== (item._new_produto_value || item.new_produto || '')) {
        updates.new_produto = produtoId || undefined;
      }
      if (quantidade !== String(item.new_quantidade || 1)) {
        const parsedQuantidade = Number(quantidade);
        if (!Number.isFinite(parsedQuantidade) || parsedQuantidade <= 0) {
          alert('Informe uma quantidade válida maior que zero.');
          return;
        }
        updates.new_quantidade = parsedQuantidade;
      }
      if (ambiente !== (item.new_ambiente || '')) {
        updates.new_ambiente = ambiente || undefined;
      }
      if (section !== (item.new_section || '')) {
        updates.new_section = section || undefined;
      }
      if (opcaoFornecimento !== (item.new_opcaodefornecimento || 100000000)) {
        updates.new_opcaodefornecimento = opcaoFornecimento;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      await onSave(item.new_itemdeorcamentoid, updates);
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (!item) return;
    setProdutoId(item._new_produto_value || item.new_produto || '');
    setQuantidade(String(item.new_quantidade || 1));
    setAmbiente(item.new_ambiente || '');
    setSection(item.new_section || '');
    setOpcaoFornecimento(item.new_opcaodefornecimento || 100000000);
    setHasChanges(false);
  };

  const handleProdutoChange = (value: string | null) => {
    setProdutoId(value || '');
  };

  const handleSetCompraFutura = async () => {
    if (!item || !canSetCompraFutura) return;

    setIsSubmitting(true);
    try {
      await onSave(item.new_itemdeorcamentoid, {
        new_opcaodefornecimento: 100000001,
      });
      setOpcaoFornecimento(100000001);
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao definir como compra futura:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!item || !canRestore) return;

    setIsSubmitting(true);
    try {
      await onSave(item.new_itemdeorcamentoid, {
        new_opcaodefornecimento: 100000000,
      });
      setOpcaoFornecimento(100000000);
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao restaurar item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!item) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja remover este item? Esta ação marcará o item como removido.'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onRemove(item.new_itemdeorcamentoid);
      onClose();
    } catch (err) {
      console.error('Erro ao remover item:', err);
      alert('Erro ao remover item. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={(_, { open }) => !open && onClose()}
      position="end"
      size="medium"
      className={styles.drawer}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Fechar"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              autoFocus
            />
          }
        >
          Editar Item
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {/* Informações do item */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Informações</div>
          <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
            <div><strong>REF:</strong> {item.new_ref || '-'}</div>
            <div style={{ marginTop: tokens.spacingVerticalXS }}>
              <strong>Descrição:</strong> {item.new_descricaocalculada || item.new_descricao || '-'}
            </div>
          </div>
        </div>

        <Divider />

        {/* Campos editáveis */}
        <div className={styles.fieldGroup}>
          <Field label="Produto" hint="Busque por nome, referência ou descrição">
            <ProdutoCombobox
              value={produtoId}
              onChange={handleProdutoChange}
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Quantidade" required>
            <Input
              type="number"
              value={quantidade}
              onChange={(_, data) => setQuantidade(data.value)}
              min="1"
              step="1"
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Ambiente">
            <Input
              value={ambiente}
              onChange={(_, data) => setAmbiente(data.value)}
              placeholder="Ex: Sala de Estar"
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Seção">
            <Dropdown
              value={section}
              selectedOptions={section ? [section] : []}
              onOptionSelect={(_, data) => setSection(data.optionValue || '')}
              placeholder="Selecione uma seção"
              disabled={isSubmitting}
            >
              {sections.map((sec) => (
                <Option key={sec.name} value={sec.name}>
                  {sec.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </div>

        <Divider />

        {/* Ações */}
        <div className={styles.actionsGroup}>
          <div className={styles.sectionTitle}>Ações</div>

          {/* Compra Futura */}
          {canSetCompraFutura && (
            <Button
              appearance="outline"
              icon={<CalendarClock24Regular />}
              onClick={handleSetCompraFutura}
              disabled={isSubmitting}
            >
              Definir como Compra Futura
            </Button>
          )}

          {/* Restaurar */}
          {canRestore && (
            <Button
              appearance="outline"
              icon={<ArrowUndo24Regular />}
              onClick={handleRestore}
              disabled={isSubmitting}
            >
              Restaurar
            </Button>
          )}

          {/* Remover */}
          <Button
            appearance="outline"
            icon={<Delete24Regular />}
            onClick={handleRemove}
            disabled={isSubmitting}
          >
            Remover Item
          </Button>

          <Divider style={{ marginTop: tokens.spacingVerticalM }} />

          {/* Salvar / Descartar */}
          <div className={styles.saveActions}>
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              onClick={handleSave}
              disabled={!hasChanges || isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              appearance="secondary"
              icon={<DismissCircle24Regular />}
              onClick={handleDiscard}
              disabled={!hasChanges || isSubmitting}
            >
              Descartar
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
}
