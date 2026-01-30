/**
 * Dialog para renomear uma seção/aba
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
  Label,
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
});

interface TabRenameDialogProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  isLoading?: boolean;
}

export function TabRenameDialog({
  open,
  currentName,
  onClose,
  onRename,
  isLoading = false,
}: TabRenameDialogProps) {
  const styles = useStyles();
  const [newName, setNewName] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resetar quando abrir
  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setErrorMessage(null);
    }
  }, [open, currentName]);

  const handleSubmit = async () => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== currentName) {
      setErrorMessage(null);
      try {
        await onRename(trimmedName);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao renomear seção';
        setErrorMessage(message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Renomear Seção</DialogTitle>
          <DialogContent className={styles.content}>
            <div>
              <Label htmlFor="tab-name-input">Nome da seção</Label>
              <Input
                id="tab-name-input"
                value={newName}
                onChange={(_, data) => setNewName(data.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite o nome da seção"
                autoFocus
              />
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
              disabled={!newName.trim() || newName.trim() === currentName || isLoading}
            >
              {isLoading ? 'Renomeando...' : 'Renomear'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
