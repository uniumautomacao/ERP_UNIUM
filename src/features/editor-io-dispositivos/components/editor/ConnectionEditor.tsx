import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  Body1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Badge,
} from '@fluentui/react-components';
import { CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { useEditorContext } from '../../context/EditorContext';
import ConnectionList from './ConnectionList';
import DimensionsPanel from './DimensionsPanel';
import RackCategorySelect from './RackCategorySelect';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  statusText: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('48px'),
  },
});

const ConnectionEditor: React.FC = () => {
  const styles = useStyles();
  const { template, isDirty, saving, error } = useEditorContext();

  if (!template) {
    return (
      <div className={styles.loadingState}>
        <Spinner label="Carregando template..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statusBar}>
        {saving ? (
          <div className={styles.statusText}>
            <Spinner size="tiny" />
            <Body1>Salvando...</Body1>
          </div>
        ) : isDirty ? (
          <div className={styles.statusText}>
            <Spinner size="tiny" />
            <Body1>Salvando...</Body1>
          </div>
        ) : (
          <Badge color="success" icon={<CheckmarkCircleRegular />} size="small">
            Salvo
          </Badge>
        )}
      </div>

      {error && (
        <MessageBar intent="error" icon={<ErrorCircleRegular />}>
          <MessageBarBody>
            <MessageBarTitle>Erro ao salvar</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <DimensionsPanel />
      <RackCategorySelect />
      <ConnectionList />
    </div>
  );
};

export default ConnectionEditor;
