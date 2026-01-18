import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Body1Strong,
  Caption1,
} from '@fluentui/react-components';
import { EditRegular, DeleteRegular } from '@fluentui/react-icons';
import type { Connection } from '../../types';

const useStyles = makeStyles({
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.transition('all', '0.2s', 'ease-in-out'),
    ':hover': {
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow4,
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    flex: 1,
  },
  name: {
    color: tokens.colorNeutralForeground1,
  },
  meta: {
    display: 'flex',
    ...shorthands.gap('12px'),
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
});

interface ConnectionItemProps {
  connection: Connection;
  typeLabel: string;
  directionLabel: string;
  onEdit: () => void;
  onRemove: () => void;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({
  connection,
  typeLabel,
  directionLabel,
  onEdit,
  onRemove,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.item}>
      <div className={styles.details}>
        <Body1Strong className={styles.name}>{connection.Name}</Body1Strong>
        <div className={styles.meta}>
          <Caption1>{typeLabel}</Caption1>
          <Caption1>•</Caption1>
          <Caption1>{directionLabel}</Caption1>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          appearance="subtle"
          icon={<EditRegular />}
          onClick={onEdit}
          size="small"
        >
          Editar
        </Button>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          onClick={onRemove}
          size="small"
        >
          Remover
        </Button>
      </div>
    </div>
  );
};

export default ConnectionItem;
