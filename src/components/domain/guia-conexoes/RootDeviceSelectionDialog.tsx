import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  makeStyles,
  tokens,
  Label,
} from '@fluentui/react-components';
import { SearchableCombobox } from '../../shared/SearchableCombobox';
import type { GuiaDeviceIO } from '../../../types/guiaConexoes';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
  },
});

interface RootDeviceSelectionDialogProps {
  open: boolean;
  devices: GuiaDeviceIO[];
  onClose: () => void;
  onSelect: (deviceId: string) => void;
}

export const RootDeviceSelectionDialog: React.FC<RootDeviceSelectionDialogProps> = ({
  open,
  devices,
  onClose,
  onSelect,
}) => {
  const styles = useStyles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  const handleSearch = async (term: string) => {
    const normalized = term.toLowerCase();
    return devices
      .filter((d) => (d.new_name || '').toLowerCase().includes(normalized))
      .map((d) => ({
        id: d.new_deviceioid,
        label: d.new_name || 'Sem nome',
      }));
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle>Gerar Diagrama Mermaid</DialogTitle>
        <DialogBody>
          <DialogContent className={styles.content}>
            <p>
              Selecione o dispositivo raiz para gerar o diagrama. O diagrama será organizado a partir deste dispositivo.
            </p>
            <div className="flex flex-col gap-2">
              <Label required>Dispositivo Raiz</Label>
              <SearchableCombobox
                placeholder="Selecione um dispositivo..."
                value={selectedLabel}
                selectedId={selectedId}
                onSelect={(id, label) => {
                  setSelectedId(id);
                  setSelectedLabel(label);
                }}
                onSearch={handleSearch}
                showAllOnFocus={true}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleConfirm}
              disabled={!selectedId}
            >
              Gerar Diagrama
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
