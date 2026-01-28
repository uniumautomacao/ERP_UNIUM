import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle,
  Dropdown,
  Option,
  Text,
} from '@fluentui/react-components';
import { RemessaLookupOption } from '../../../features/remessas/types';

interface JuntarRemessasDialogProps {
  open: boolean;
  loading?: boolean;
  options: RemessaLookupOption[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { principalId: string; mergeIds: string[] }) => void;
}

export function JuntarRemessasDialog({
  open,
  loading,
  options,
  onOpenChange,
  onConfirm,
}: JuntarRemessasDialogProps) {
  const [principalId, setPrincipalId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setPrincipalId('');
      setSelectedIds([]);
    }
  }, [open]);

  const selectableOptions = useMemo(() => options.filter((opt) => opt.id !== principalId), [options, principalId]);

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((item) => item !== id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogBody>
        <DialogTitle>Juntar remessas</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <Dropdown
            placeholder="Remessa principal"
            value={options.find((opt) => opt.id === principalId)?.label ?? ''}
            onOptionSelect={(_, data) => setPrincipalId(data.optionValue as string)}
          >
            {options.map((opt) => (
              <Option key={opt.id} value={opt.id}>
                {opt.label}
              </Option>
            ))}
          </Dropdown>
          <Text size={200}>Selecione remessas para juntar na principal:</Text>
          <div className="flex flex-col gap-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {selectableOptions.map((opt) => (
              <Checkbox
                key={opt.id}
                label={opt.label}
                checked={selectedIds.includes(opt.id)}
                onChange={(_, data) => toggleSelection(opt.id, Boolean(data.checked))}
              />
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            onClick={() => onConfirm({ principalId, mergeIds: selectedIds })}
            disabled={!principalId || selectedIds.length === 0 || loading}
          >
            Juntar
          </Button>
        </DialogActions>
      </DialogBody>
    </Dialog>
  );
}
