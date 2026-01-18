import React from 'react';
import {
  Card,
  CardHeader,
  makeStyles,
  shorthands,
  tokens,
  Body1Strong,
} from '@fluentui/react-components';
import type { Manufacturer } from '../../types';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    height: '100%',
    ...shorthands.transition('all', '0.2s', 'ease-in-out'),
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
      ...shorthands.borderColor(tokens.colorBrandBackground),
    },
    ':active': {
      transform: 'translateY(0px)',
      boxShadow: tokens.shadow4,
    },
  },
  header: {
    ...shorthands.padding('16px'),
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
});

interface ManufacturerCardProps {
  manufacturer: Manufacturer;
  onSelect: (manufacturer: Manufacturer) => void;
}

const ManufacturerCard: React.FC<ManufacturerCardProps> = ({ manufacturer, onSelect }) => {
  const styles = useStyles();

  return (
    <Card
      className={styles.card}
      onClick={() => onSelect(manufacturer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(manufacturer);
        }
      }}
    >
      <CardHeader
        className={styles.header}
        header={<Body1Strong className={styles.title}>{manufacturer.cr22f_title}</Body1Strong>}
      />
    </Card>
  );
};

export default ManufacturerCard;
