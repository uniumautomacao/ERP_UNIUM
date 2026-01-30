/**
 * Dialog para mesclar duas seções/abas
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Dropdown,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  warning: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
  },
});

interface TabMergeDialogProps {
  open: boolean;
  sourceName: string;
  availableTargets: string[];
  onClose: () => void;
  onMerge: (targetName: string) => Promise<void>;
  isLoading?: boolean;
}

export function TabMergeDialog({
  open,
  sourceName,
  availableTargets,
  onClose,
  onMerge,
  isLoading = false,
}: TabMergeDialogProps) {
  const styles = useStyles();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasTargets = availableTargets.length > 0;

  const defaultTarget = useMemo(() => {
    return availableTargets[0] || null;
  }, [availableTargets]);

  useEffect(() => {
    if (open) {
      setSelectedTarget(defaultTarget);
      setErrorMessage(null);
    }
  }, [open, defaultTarget]);

  const handleSubmit = async () => {
    if (!selectedTarget) return;
    setErrorMessage(null);
    try {
      await onMerge(selectedTarget);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mesclar seções';
      setErrorMessage(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Mesclar Seções</DialogTitle>
          <DialogContent className={styles.content}>
            <Text>
              Mesclar <strong>{sourceName}</strong> em:
            </Text>
            <Dropdown
              placeholder="Selecionar seção"
              value={selectedTarget || ''}
              selectedOptions={selectedTarget ? [selectedTarget] : []}
              onOptionSelect={(_, data) => setSelectedTarget(data.optionValue || null)}
              disabled={!hasTargets}
            >
              {availableTargets.map((target) => (
                <Option key={target} value={target}>
                  {target}
                </Option>
              ))}
            </Dropdown>
            <div className={styles.warning}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Todos os itens da seção <strong>{sourceName}</strong> serão movidos para a seção selecionada.
              </Text>
            </div>
            {errorMessage && (
              <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {errorMessage}
              </Text>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!selectedTarget || isLoading}
            >
              {isLoading ? 'Mesclando...' : 'Mesclar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
