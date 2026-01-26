import { useMemo } from 'react';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { calcularEstatisticasMensais } from '../../../features/cronograma-instalacoes/utils';
import { MonthCard } from './MonthCard';

interface VisaoAnualTabProps {
  itens: CronogramaOS[];
  ano: number;
  onSelectMonth: (mes: number) => void;
  selectedMonth: number | null;
}

export function VisaoAnualTab({ itens, ano, onSelectMonth, selectedMonth }: VisaoAnualTabProps) {
  const stats = useMemo(() => calcularEstatisticasMensais(itens, ano), [itens, ano]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((mesStats, mes) => (
        <MonthCard
          key={`${ano}-${mes}`}
          mes={mes}
          ano={ano}
          stats={mesStats}
          onClick={() => onSelectMonth(mes)}
          isSelected={selectedMonth === mes}
        />
      ))}
    </div>
  );
}
