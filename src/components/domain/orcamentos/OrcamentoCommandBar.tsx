/**
 * Command Bar para orçamentos
 * Menu organizado conforme guia UI/UX
 */

import {
  Toolbar,
  ToolbarButton,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  ToolbarDivider,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowSync24Regular,
  Edit24Regular,
  Delete24Regular,
  DocumentPdf24Regular,
  MoreHorizontal24Regular,
  Folder24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  toolbar: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalS,
  },
});

interface OrcamentoCommandBarProps {
  hasSelection: boolean;
  onNewItem?: () => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
  onRefresh?: () => void;
  onOpenOrcamento?: () => void;
  onEditOrcamento?: () => void;
  onPaymentOptions?: () => void;
  onGeneratePDF?: () => void;
  disabled?: boolean;
}

export function OrcamentoCommandBar({
  hasSelection,
  onNewItem,
  onEditSelected,
  onDeleteSelected,
  onRefresh,
  onOpenOrcamento,
  onEditOrcamento,
  onPaymentOptions,
  onGeneratePDF,
  disabled = false,
}: OrcamentoCommandBarProps) {
  const styles = useStyles();

  return (
    <Toolbar className={styles.toolbar} size="small">
      {/* Menu Orçamento */}
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <ToolbarButton disabled={disabled}>Orçamento</ToolbarButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem icon={<Add24Regular />} onClick={onOpenOrcamento}>
              Novo Orçamento
            </MenuItem>
            <MenuItem icon={<Folder24Regular />} onClick={onOpenOrcamento}>
              Abrir Orçamento
            </MenuItem>
            <MenuItem icon={<Edit24Regular />} onClick={onEditOrcamento}>
              Editar Informações
            </MenuItem>
            <MenuItem onClick={onPaymentOptions}>
              Formas de Pagamento
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      <ToolbarDivider />

      {/* Ações Primárias */}
      <Tooltip content="Atualizar" relationship="label">
        <ToolbarButton
          icon={<ArrowSync24Regular />}
          onClick={onRefresh}
          disabled={disabled}
        >
          Atualizar
        </ToolbarButton>
      </Tooltip>

      <Tooltip content="Novo Produto" relationship="label">
        <ToolbarButton
          appearance="primary"
          icon={<Add24Regular />}
          onClick={onNewItem}
          disabled={disabled}
        >
          Novo Produto
        </ToolbarButton>
      </Tooltip>

      <Tooltip content="Editar Selecionados" relationship="label">
        <ToolbarButton
          icon={<Edit24Regular />}
          onClick={onEditSelected}
          disabled={disabled || !hasSelection}
        >
          Editar
        </ToolbarButton>
      </Tooltip>

      <Tooltip content="Excluir Selecionados" relationship="label">
        <ToolbarButton
          icon={<Delete24Regular />}
          onClick={onDeleteSelected}
          disabled={disabled || !hasSelection}
        >
          Excluir
        </ToolbarButton>
      </Tooltip>

      <ToolbarDivider />

      {/* Menu Avançado */}
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <ToolbarButton icon={<MoreHorizontal24Regular />} disabled={disabled}>
            Avançado
          </ToolbarButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Utilizar Crédito</MenuItem>
            <MenuItem>Duplicar Orçamento</MenuItem>
            <MenuItem>Duplicar Desmembrado</MenuItem>
            <MenuItem>Publicar Pedido</MenuItem>
            <MenuItem>Relatório Disponibilidade</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      {/* Spacer - empurra o PDF para a direita */}
      <div style={{ flex: 1 }} />

      {/* Far Items */}
      <Tooltip content="Gerar PDF" relationship="label">
        <ToolbarButton
          icon={<DocumentPdf24Regular />}
          onClick={onGeneratePDF}
          disabled={disabled}
        >
          PDF
        </ToolbarButton>
      </Tooltip>
    </Toolbar>
  );
}
