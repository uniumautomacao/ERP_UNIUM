/**
 * SupplierMonthModal - Modal showing products for a specific supplier/month
 */

import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  tokens,
  Badge,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { SupplierMonthModalData, ProcurementTimelineItem } from './types';
import { formatCurrencyBR, formatDateBR } from './utils';

interface SupplierMonthModalProps {
  open: boolean;
  onClose: () => void;
  data: SupplierMonthModalData | null;
}

const FAIXAS_PRAZO: Record<number, { label: string; color: 'danger' | 'warning' | 'informative' | 'subtle' }> = {
  100000000: { label: 'Atrasado', color: 'danger' },
  100000001: { label: 'Pedir agora', color: 'warning' },
  100000007: { label: '7 dias', color: 'informative' },
  100000030: { label: '30 dias', color: 'subtle' },
  100000099: { label: 'Futuro', color: 'subtle' },
};

function getFaixaBadge(faixaPrazo: number | null) {
  if (!faixaPrazo) return null;
  const faixa = FAIXAS_PRAZO[faixaPrazo];
  if (!faixa) return null;
  return <Badge color={faixa.color}>{faixa.label}</Badge>;
}

function formatPeriodLabel(startDate: Date, endDate: Date): string {
  const start = formatDateBR(startDate);
  const end = formatDateBR(endDate);
  
  // Se for o mesmo dia, mostrar apenas uma data
  if (start === end) {
    return start;
  }
  
  // Se for o mesmo mês, mostrar de forma compacta
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()} a ${end}`;
  }
  
  return `${start} a ${end}`;
}

export function SupplierMonthModal({ open, onClose, data }: SupplierMonthModalProps) {
  if (!data) return null;

  const periodLabel = formatPeriodLabel(data.startDate, data.endDate);
  const totalQuantidade = data.produtos.reduce((sum, p) => sum + (p.quantidade ?? 0), 0);

  // Group products by reference to aggregate quantities
  const groupedProducts = data.produtos.reduce((acc, produto) => {
    const key = produto.referencia || produto.descricao || produto.id;
    if (!acc.has(key)) {
      acc.set(key, {
        referencia: produto.referencia,
        descricao: produto.descricao,
        cliente: produto.cliente,
        quantidade: 0,
        valorTotal: 0,
        entrega: produto.entrega,
        faixaPrazo: produto.faixaPrazo,
        items: [] as ProcurementTimelineItem[],
      });
    }
    const group = acc.get(key)!;
    group.quantidade += produto.quantidade ?? 0;
    group.valorTotal += produto.valorTotal ?? 0;
    group.items.push(produto);
    return acc;
  }, new Map<string, {
    referencia: string | null;
    descricao: string | null;
    cliente: string;
    quantidade: number;
    valorTotal: number;
    entrega: Date | null;
    faixaPrazo: number | null;
    items: ProcurementTimelineItem[];
  }>());

  const productList = Array.from(groupedProducts.values())
    .sort((a, b) => b.valorTotal - a.valorTotal);

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface style={{ maxWidth: '700px', maxHeight: '80vh' }}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            {data.fornecedorNome}
          </DialogTitle>
          <DialogContent>
            <div className="flex flex-col gap-4">
              {/* Header Summary */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusMedium,
                }}
              >
                <Text size={400} weight="semibold" block>
                  {periodLabel}
                </Text>
                <div className="flex items-center gap-4 mt-2">
                  <Text size={300}>
                    <strong>{formatCurrencyBR(data.valor)}</strong> em compras
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {totalQuantidade} {totalQuantidade === 1 ? 'unidade' : 'unidades'}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {data.produtos.length} {data.produtos.length === 1 ? 'item' : 'itens'}
                  </Text>
                </div>
              </div>

              {/* Products List */}
              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  borderRadius: tokens.borderRadiusMedium,
                }}
              >
                {productList.length === 0 ? (
                  <div className="p-4 text-center">
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>
                      Nenhum produto neste período
                    </Text>
                  </div>
                ) : (
                  productList.map((produto, index) => (
                    <div
                      key={`${produto.referencia}-${index}`}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < productList.length - 1
                          ? `1px solid ${tokens.colorNeutralStroke2}`
                          : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Text weight="semibold" block>
                            {produto.referencia || produto.descricao || 'Item sem referência'}
                          </Text>
                          {produto.descricao && produto.referencia && (
                            <Text
                              size={200}
                              style={{ color: tokens.colorNeutralForeground3 }}
                              block
                            >
                              {produto.descricao}
                            </Text>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              Cliente: {produto.cliente || '-'}
                            </Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                              Entrega: {formatDateBR(produto.entrega)}
                            </Text>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Text weight="semibold">
                            {formatCurrencyBR(produto.valorTotal)}
                          </Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {produto.quantidade} {produto.quantidade === 1 ? 'un' : 'un'}
                          </Text>
                          {getFaixaBadge(produto.faixaPrazo)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={onClose}>
              Fechar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
