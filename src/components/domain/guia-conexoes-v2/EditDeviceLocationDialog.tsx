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
  Input,
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
  const [newLocationValue, setNewLocationValue] = useState('');
  const [useNewLocation, setUseNewLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocationValue(currentLocation?.trim() || '');
      setNewLocationValue('');
      setUseNewLocation(false);
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
      const finalLocation = useNewLocation ? newLocationValue.trim() : locationValue.trim();
      await onSave(finalLocation);
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Selecionar existente">
                <Combobox
                  placeholder="Selecione uma localização"
                  value={locationValue}
                  disabled={useNewLocation || saving}
                  onChange={(event) => setLocationValue(event.currentTarget.value)}
                  onOptionSelect={(_, data) => {
                    if (data.optionText) {
                      setLocationValue(data.optionText);
                    }
                  }}
                  listbox={{
                    style: { maxHeight: '200px', overflowY: 'auto' },
                  }}
                >
                  {options.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Combobox>
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: tokens.colorNeutralStroke2 }} />
                <Text size={100} className={styles.helper}>OU</Text>
                <div style={{ flex: 1, height: '1px', backgroundColor: tokens.colorNeutralStroke2 }} />
              </div>

              <Field label="Digitar novo nome">
                <Input
                  placeholder="Ex: Sala de Reunião, CPD, etc."
                  value={newLocationValue}
                  disabled={saving}
                  onChange={(_, data) => {
                    setNewLocationValue(data.value);
                    if (data.value.trim().length > 0) {
                      setUseNewLocation(true);
                    } else {
                      setUseNewLocation(false);
                    }
                  }}
                />
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button 
              appearance="primary" 
              onClick={handleSave} 
              disabled={saving || (!useNewLocation && !locationValue.trim() && !!newLocationValue.trim())}
            >
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
