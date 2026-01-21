import { makeStyles, tokens } from '@fluentui/react-components';
import type { MercadoriaLida } from '../../../types';
import { MercadoriaCard } from './MercadoriaCard';
import { isMercadoriaAtiva } from '../../../utils/inventory/statusUtils';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
});

interface MercadoriasListProps {
  items: MercadoriaLida[];
  onActivate: (id: string) => void;
  onUpdateInfo: (id: string) => void;
}

export function MercadoriasList({ items, onActivate, onUpdateInfo }: MercadoriasListProps) {
  const styles = useStyles();

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <MercadoriaCard
          key={item.id}
          item={item}
          isActive={isMercadoriaAtiva(item)}
          onActivate={onActivate}
          onUpdateInfo={onUpdateInfo}
        />
      ))}
    </div>
  );
}
