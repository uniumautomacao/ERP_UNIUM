import React, { useMemo, useState } from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Title3,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Body1,
  Badge,
} from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import { useEditorContext } from '../../context/EditorContext';
import ConnectionForm from './ConnectionForm';
import ConnectionItem from './ConnectionItem';

const useStyles = makeStyles({
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  accordionItem: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  connectionList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding('24px'),
    color: tokens.colorNeutralForeground3,
  },
});

const ConnectionList: React.FC = () => {
  const styles = useStyles();
  const { template, connectionTypes, connectionDirections, removeConnection } =
    useEditorContext();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const typeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    connectionTypes.forEach((item) => map.set(item.value.toString(), item.label));
    return map;
  }, [connectionTypes]);

  const directionLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    connectionDirections.forEach((item) => map.set(item.value.toString(), item.label));
    return map;
  }, [connectionDirections]);

  if (!template) {
    return null;
  }

  const handleAdd = () => {
    setEditingIndex(null);
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const handleRemove = (index: number) => {
    const confirmed = window.confirm('Deseja remover esta conexão?');
    if (!confirmed) {
      return;
    }
    removeConnection(index);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  const groupedConnections = template.Connections.map((connection, index) => ({
    connection,
    index,
  })).reduce(
    (acc, item) => {
      const direction = item.connection.Direction;
      if (direction === '100000000') {
        acc.inputs.push(item);
      } else if (direction === '100000001') {
        acc.outputs.push(item);
      } else if (direction === '100000002' || direction === '100000003') {
        acc.other.push(item);
      } else {
        acc.other.push(item);
      }
      return acc;
    },
    {
      inputs: [] as Array<{ connection: typeof template.Connections[number]; index: number }>,
      outputs: [] as Array<{ connection: typeof template.Connections[number]; index: number }>,
      other: [] as Array<{ connection: typeof template.Connections[number]; index: number }>,
    }
  );

  const renderConnections = (
    items: Array<{ connection: typeof template.Connections[number]; index: number }>
  ) =>
    items.length === 0 ? (
      <div className={styles.emptyState}>
        <Body1>Nenhuma conexão nesta seção.</Body1>
      </div>
    ) : (
      <div className={styles.connectionList}>
        {items.map(({ connection, index }) => (
          <ConnectionItem
            key={`${connection.Name}-${index}`}
            connection={connection}
            typeLabel={typeLabelMap.get(connection.Type) ?? 'Tipo desconhecido'}
            directionLabel={directionLabelMap.get(connection.Direction) ?? 'Direção desconhecida'}
            onEdit={() => handleEdit(index)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>
    );

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <Title3>Conexões</Title3>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={handleAdd}
        >
          Adicionar Conexão
        </Button>
      </div>

      <Accordion multiple collapsible defaultOpenItems={['inputs', 'outputs', 'other']}>
        <AccordionItem value="inputs" className={styles.accordionItem}>
          <AccordionHeader expandIconPosition="end">
            <div className={styles.accordionHeader}>
              <span>Entradas</span>
              <Badge size="small" color="informative">
                {groupedConnections.inputs.length}
              </Badge>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            {renderConnections(groupedConnections.inputs)}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="outputs" className={styles.accordionItem}>
          <AccordionHeader expandIconPosition="end">
            <div className={styles.accordionHeader}>
              <span>Saídas</span>
              <Badge size="small" color="success">
                {groupedConnections.outputs.length}
              </Badge>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            {renderConnections(groupedConnections.outputs)}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="other" className={styles.accordionItem}>
          <AccordionHeader expandIconPosition="end">
            <div className={styles.accordionHeader}>
              <span>Bidirecionais e Bus</span>
              <Badge size="small" color="warning">
                {groupedConnections.other.length}
              </Badge>
            </div>
          </AccordionHeader>
          <AccordionPanel>
            {renderConnections(groupedConnections.other)}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {isFormOpen && (
        <ConnectionForm
          initialConnection={
            typeof editingIndex === 'number' ? template.Connections[editingIndex] : undefined
          }
          index={typeof editingIndex === 'number' ? editingIndex : undefined}
          onClose={closeForm}
        />
      )}
    </section>
  );
};

export default ConnectionList;
