import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Dropdown,
  Option,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import type { Connection } from '../../types';
import { useEditorContext } from '../../context/EditorContext';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '12px',
    marginTop: '4px',
  },
});

interface ConnectionFormProps {
  initialConnection?: Connection;
  index?: number;
  onClose: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  initialConnection,
  index,
  onClose,
}) => {
  const styles = useStyles();
  const { connectionTypes, connectionDirections, addConnection, updateConnection } =
    useEditorContext();
  const [name, setName] = useState(initialConnection?.Name ?? '');
  const [type, setType] = useState(initialConnection?.Type ?? '');
  const [direction, setDirection] = useState(initialConnection?.Direction ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome da conexão.');
      return;
    }
    if (!type) {
      setError('Selecione o tipo de conexão.');
      return;
    }
    if (!direction) {
      setError('Selecione a direção da conexão.');
      return;
    }

    const next: Connection = {
      Name: name.trim(),
      Type: type,
      Direction: direction,
    };

    if (typeof index === 'number') {
      updateConnection(index, next);
    } else {
      addConnection(next);
    }

    onClose();
  };

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>
              {typeof index === 'number' ? 'Editar Conexão' : 'Nova Conexão'}
            </DialogTitle>
            <DialogContent className={styles.content}>
              {error && <div className={styles.error}>{error}</div>}
              
              <Field label="Nome" required>
                <Input
                  value={name}
                  onChange={(_, data) => setName(data.value)}
                  placeholder="Ex: PWR1, ETH0, USB1..."
                />
              </Field>

              <Field label="Tipo" required>
                <Dropdown
                  placeholder="Selecione o tipo"
                  value={connectionTypes.find((t) => t.value.toString() === type)?.label ?? ''}
                  selectedOptions={type ? [type] : []}
                  onOptionSelect={(_, data) => setType(data.optionValue ?? '')}
                >
                  {connectionTypes.map((option) => (
                    <Option key={option.value} value={option.value.toString()}>
                      {option.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Direção" required>
                <Dropdown
                  placeholder="Selecione a direção"
                  value={
                    connectionDirections.find((d) => d.value.toString() === direction)?.label ?? ''
                  }
                  selectedOptions={direction ? [direction] : []}
                  onOptionSelect={(_, data) => setDirection(data.optionValue ?? '')}
                >
                  {connectionDirections.map((option) => (
                    <Option key={option.value} value={option.value.toString()}>
                      {option.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" appearance="primary">
                Salvar
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};

export default ConnectionForm;
