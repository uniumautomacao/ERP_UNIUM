import { Button, Dialog, DialogBody, DialogContent, DialogActions, DialogTitle, Field, Input } from '@fluentui/react-components';
import { useEffect, useState } from 'react';

interface DividirRemessaDialogProps {
  open: boolean;
  selectedCount: number;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { codigoRastreio?: string; previsaoEnvio?: string; previsaoChegada?: string }) => void;
}

export function DividirRemessaDialog({
  open,
  selectedCount,
  loading,
  onOpenChange,
  onConfirm,
}: DividirRemessaDialogProps) {
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [previsaoEnvio, setPrevisaoEnvio] = useState('');
  const [previsaoChegada, setPrevisaoChegada] = useState('');

  useEffect(() => {
    if (!open) {
      setCodigoRastreio('');
      setPrevisaoEnvio('');
      setPrevisaoChegada('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogBody>
        <DialogTitle>Dividir remessa</DialogTitle>
        <DialogContent className="flex flex-col gap-3">
          <div>
            Itens selecionados: <strong>{selectedCount}</strong>
          </div>
          <Field label="Código de rastreio (opcional)">
            <Input value={codigoRastreio} onChange={(_, data) => setCodigoRastreio(data.value)} />
          </Field>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Field label="Previsão de envio">
              <Input type="date" value={previsaoEnvio} onChange={(_, data) => setPrevisaoEnvio(data.value)} />
            </Field>
            <Field label="Previsão de chegada">
              <Input type="date" value={previsaoChegada} onChange={(_, data) => setPrevisaoChegada(data.value)} />
            </Field>
          </div>
        </DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            onClick={() => onConfirm({ codigoRastreio, previsaoEnvio, previsaoChegada })}
            disabled={selectedCount === 0 || loading}
          >
            Criar nova remessa
          </Button>
        </DialogActions>
      </DialogBody>
    </Dialog>
  );
}
