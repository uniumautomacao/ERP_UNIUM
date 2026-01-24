import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens,
  Text,
  Checkbox,
} from '@fluentui/react-components';
import { useCallback, useState, useMemo } from 'react';
import { NewDeviceIOConnectionService } from '../../../generated';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

export interface Inconsistency {
  id: string;
  name: string;
  targetId: string;
  targetName: string;
  deviceName: string;
  targetDeviceName: string;
}

interface InconsistencyManagerDialogProps {
  open: boolean;
  inconsistencies: Inconsistency[];
  onClose: () => void;
  onFixed: () => void;
}

export function InconsistencyManagerDialog({
  open,
  inconsistencies,
  onClose,
  onFixed,
}: InconsistencyManagerDialogProps) {
  const styles = useStyles();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allIds = useMemo(() => new Set(inconsistencies.map((inc) => inc.id)), [inconsistencies]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [selectedIds, allIds]);

  const toggleSelect = useCallback((id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }, [selectedIds]);

  const handleFixSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setFixing(true);
    setError(null);
    try {
      const toFix = inconsistencies.filter((inc) => selectedIds.has(inc.id));
      const promises = toFix.map((inc) =>
        NewDeviceIOConnectionService.update(inc.id, {
          'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${inc.targetId})`,
          new_connectedtomanual: null,
        } as any)
      );
      await Promise.all(promises);
      onFixed();
    } catch (err) {
      setError('Falha ao corrigir inconsistências selecionadas.');
    } finally {
      setFixing(false);
    }
  }, [selectedIds, inconsistencies, onFixed]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Inconsistências de Conexão</DialogTitle>
          <DialogContent className={styles.content}>
            <Text>
              Foram detectadas conexões unidirecionais. Deseja corrigi-las para que fiquem bidirecionais?
            </Text>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                label="Selecionar todas"
                checked={selectedIds.size === allIds.size && allIds.size > 0}
                onChange={toggleSelectAll}
              />
            </div>

            <div className={styles.list}>
              {inconsistencies.map((inc) => (
                <div key={inc.id} className={styles.item}>
                  <Checkbox
                    checked={selectedIds.has(inc.id)}
                    onChange={() => toggleSelect(inc.id)}
                  />
                  <div className={styles.itemText}>
                    <Text weight="semibold">
                      {inc.deviceName} ({inc.name})
                    </Text>
                    <Text size={200} weight="regular">
                      deve conectar a: {inc.targetDeviceName} ({inc.targetName})
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            {error && <Text className={styles.errorText}>{error}</Text>}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={fixing}>
              Ignorar
            </Button>
            <Button
              appearance="primary"
              onClick={handleFixSelected}
              disabled={fixing || selectedIds.size === 0}
            >
              {fixing ? 'Corrigindo...' : `Corrigir Selecionadas (${selectedIds.size})`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
