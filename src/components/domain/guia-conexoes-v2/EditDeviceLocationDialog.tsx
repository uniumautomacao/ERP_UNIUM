import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

interface EditDeviceLocationDialogProps {
  open: boolean;
  deviceName?: string | null;
  currentLocation?: string | null;
  locationOptions: string[];
  onClose: () => void;
  onSave: (nextLocation: string) => Promise<void> | void;
}

export function EditDeviceLocationDialog({
  open,
  deviceName,
  currentLocation,
  locationOptions,
  onClose,
  onSave,
}: EditDeviceLocationDialogProps) {
  const styles = useStyles();
  const [locationValue, setLocationValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocationValue(currentLocation?.trim() || '');
      setSaving(false);
      setError(null);
    }
  }, [currentLocation, open]);

  const options = useMemo(
    () => locationOptions.filter((option) => option.trim().length > 0),
    [locationOptions]
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(locationValue.trim());
      onClose();
    } catch (err) {
      setError('Falha ao salvar localização.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Editar localização</DialogTitle>
          <DialogContent className={styles.content}>
            {error && <Text className={styles.errorText}>{error}</Text>}
            <Text className={styles.helper}>
              {deviceName ? `Equipamento: ${deviceName}` : 'Atualize a localização do equipamento.'}
            </Text>
            <Field label="Localização">
              <Combobox
                placeholder="Digite ou selecione uma localização"
                value={locationValue}
                onChange={(_, data) => setLocationValue(data.value)}
                onOptionSelect={(_, data) => {
                  if (data.optionText) {
                    setLocationValue(data.optionText);
                  }
                }}
                listbox={{
                  style: { maxHeight: '240px', overflowY: 'auto' },
                }}
              >
                {options.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Combobox>
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleSave} disabled={saving}>
              Salvar
            </Button>
            <Button appearance="subtle" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
