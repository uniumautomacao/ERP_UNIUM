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
  makeStyles,
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
  onRename: (newName: string) => void;
}

export function TabRenameDialog({
  open,
  currentName,
  onClose,
  onRename,
}: TabRenameDialogProps) {
  const styles = useStyles();
  const [newName, setNewName] = useState(currentName);

  // Resetar quando abrir
  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = () => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== currentName) {
      onRename(trimmedName);
      onClose();
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
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!newName.trim() || newName.trim() === currentName}
            >
              Renomear
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
