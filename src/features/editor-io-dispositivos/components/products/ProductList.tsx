import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  SearchBox,
  Button,
  Spinner,
  Body1,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import type { Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from './ProductCard';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  searchBox: {
    flexGrow: 1,
    maxWidth: '400px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    ...shorthands.gap('16px'),
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding('48px', '24px'),
    color: tokens.colorNeutralForeground3,
  },
  errorState: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorPaletteRedBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
    color: tokens.colorPaletteRedForeground1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('48px'),
  },
});

interface ProductListProps {
  manufacturerId: string | null;
  onSelect: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ manufacturerId, onSelect }) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { products, loading, error, reload } = useProducts(manufacturerId, debouncedSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  if (!manufacturerId) {
    return (
      <div className={styles.emptyState}>
        <Body1>Selecione um fabricante.</Body1>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <Body1>{error}</Body1>
          <Button appearance="primary" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchRow}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Buscar produto..."
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          size="medium"
        />
        {search && (
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setSearch('')}
          >
            Limpar
          </Button>
        )}
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <Spinner label="Carregando produtos..." />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className={styles.emptyState}>
          <Body1>
            {search
              ? 'Nenhum produto corresponde à busca.'
              : 'Nenhum produto encontrado para este fabricante.'}
          </Body1>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className={styles.cardGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.cr22f_modelosdeprodutofromsharepointlistid}
              product={product}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
