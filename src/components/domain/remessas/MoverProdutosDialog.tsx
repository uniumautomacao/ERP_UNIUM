import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogTitle, Dropdown, Option } from '@fluentui/react-components';
import { RemessaLookupOption } from '../../../features/remessas/types';

interface MoverProdutosDialogProps {
  open: boolean;
  loading?: boolean;
  selectedCount: number;
  options: RemessaLookupOption[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (destinoId: string) => void;
}

export function MoverProdutosDialog({
  open,
  loading,
  selectedCount,
  options,
  onOpenChange,
  onConfirm,
}: MoverProdutosDialogProps) {
  const [destinoId, setDestinoId] = useState('');

  useEffect(() => {
    if (!open) {
      setDestinoId('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogBody>
        <DialogTitle>Mover itens da remessa</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <div>Itens selecionados: <strong>{selectedCount}</strong></div>
          <Dropdown
            placeholder="Selecione a remessa destino"
            value={options.find((opt) => opt.id === destinoId)?.label ?? ''}
            onOptionSelect={(_, data) => setDestinoId(data.optionValue as string)}
          >
            {options.map((opt) => (
              <Option key={opt.id} value={opt.id}>
                {opt.label}
              </Option>
            ))}
          </Dropdown>
        </DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            onClick={() => onConfirm(destinoId)}
            disabled={!destinoId || selectedCount === 0 || loading}
          >
            Mover itens
          </Button>
        </DialogActions>
      </DialogBody>
    </Dialog>
  );
}
