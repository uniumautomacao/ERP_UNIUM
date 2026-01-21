import { makeStyles, tokens } from '@fluentui/react-components';
import type { MercadoriaLida } from '../../../types';
import { MercadoriaCard } from './MercadoriaCard';

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
          isActive={item.status === 0}
          onActivate={onActivate}
          onUpdateInfo={onUpdateInfo}
        />
      ))}
    </div>
  );
}
