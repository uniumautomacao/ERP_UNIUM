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
import type { Manufacturer } from '../../types';
import { useManufacturers } from '../../hooks/useManufacturers';
import ManufacturerCard from './ManufacturerCard';

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

interface ManufacturerListProps {
  onSelect: (manufacturer: Manufacturer) => void;
}

const ManufacturerList: React.FC<ManufacturerListProps> = ({ onSelect }) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { manufacturers, loading, error, reload } = useManufacturers(debouncedSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

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
          placeholder="Buscar fabricante..."
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
          <Spinner label="Carregando fabricantes..." />
        </div>
      )}

      {!loading && manufacturers.length === 0 && (
        <div className={styles.emptyState}>
          <Body1>
            {search
              ? 'Nenhum fabricante corresponde à busca.'
              : 'Nenhum fabricante encontrado.'}
          </Body1>
        </div>
      )}

      {!loading && manufacturers.length > 0 && (
        <div className={styles.cardGrid}>
          {manufacturers.map((manufacturer) => (
            <ManufacturerCard
              key={manufacturer.cr22f_fabricantesfromsharpointlistid}
              manufacturer={manufacturer}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManufacturerList;
