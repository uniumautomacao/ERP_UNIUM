import React from 'react';
import {
  Card,
  CardHeader,
  makeStyles,
  shorthands,
  tokens,
  Body1Strong,
  Caption1,
} from '@fluentui/react-components';
import { BoxMultipleRegular } from '@fluentui/react-icons';
import type { Product } from '../../types';

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
  icon: {
    color: tokens.colorBrandBackground,
    fontSize: '24px',
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
});

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const styles = useStyles();

  return (
    <Card
      className={styles.card}
      onClick={() => onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
    >
      <CardHeader
        className={styles.header}
        image={<BoxMultipleRegular className={styles.icon} />}
        header={<Body1Strong className={styles.title}>{product.cr22f_title}</Body1Strong>}
        description={
          product.new_nomedofabricante ? (
            <Caption1 className={styles.subtitle}>{product.new_nomedofabricante}</Caption1>
          ) : null
        }
      />
    </Card>
  );
};

export default ProductCard;
