/**
 * Tab Navigation - Painel esquerdo com lista de seções
 * Suporta drag-and-drop, seleção, renomear e reordenar
 */

import { useState } from 'react';
import {
  Button,
  makeStyles,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Edit24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrcamentoSecao } from '../../../features/orcamentos/types';
import { TabRenameDialog } from './dialogs/TabRenameDialog';
import { formatarMoeda } from '../../../features/orcamentos/utils';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  tabsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flex: 1,
    overflow: 'auto',
  },
  tabItem: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderColor: tokens.colorNeutralStroke1Hover,
    },
  },
  tabItemSelected: {
    backgroundColor: tokens.colorBrandBackground,
    borderColor: tokens.colorBrandStroke1,
    color: tokens.colorNeutralForegroundOnBrand,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      borderColor: tokens.colorBrandStroke1Hover,
    },
  },
  tabItemDragging: {
    opacity: 0.5,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  tabName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: tokens.spacingVerticalXXS,
  },
  tabInfo: {
    fontSize: '12px',
    opacity: 0.8,
  },
  tabActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  moveButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    marginTop: tokens.spacingVerticalS,
  },
});

interface SortableTabItemProps {
  tab: OrcamentoSecao;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
}

function SortableTabItem({
  tab,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  canDelete,
}: SortableTabItemProps) {
  const styles = useStyles();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.tabItem} ${
        isSelected ? styles.tabItemSelected : ''
      } ${isDragging ? styles.tabItemDragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <div onClick={onSelect}>
        <div className={styles.tabContent}>
          <div className={styles.tabName}>{tab.name}</div>
          <div className={styles.tabInfo}>
            {tab.itemCount} {tab.itemCount === 1 ? 'item' : 'itens'} •{' '}
            {formatarMoeda(tab.valorTotal)}
          </div>
        </div>
      </div>

      {isSelected && (
        <>
          <div className={styles.tabActions}>
            <Tooltip content="Renomear" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<Edit24Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
              />
            </Tooltip>
            <Tooltip content="Excluir" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete24Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={!canDelete}
              />
            </Tooltip>
          </div>

          <div className={styles.moveButtons}>
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowUp24Regular />}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
            >
              Mover para cima
            </Button>
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowDown24Regular />}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
            >
              Mover para baixo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface TabNavigationProps {
  tabs: OrcamentoSecao[];
  selectedTab: string | null;
  onSelectTab: (tabName: string) => void;
  onAddTab: (name: string) => void;
  onRemoveTab: (name: string) => void;
  onRenameTab: (oldName: string, newName: string) => void;
  onReorderTabs: (startIndex: number, endIndex: number) => void;
  onMoveTabUp: (name: string) => void;
  onMoveTabDown: (name: string) => void;
  canRemoveTab: (name: string) => boolean;
  canMoveUp: (name: string) => boolean;
  canMoveDown: (name: string) => boolean;
}

export function TabNavigation({
  tabs,
  selectedTab,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onRenameTab,
  onReorderTabs,
  onMoveTabUp,
  onMoveTabDown,
  canRemoveTab,
  canMoveUp,
  canMoveDown,
}: TabNavigationProps) {
  const styles = useStyles();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [tabToRename, setTabToRename] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((tab) => tab.name === active.id);
      const newIndex = tabs.findIndex((tab) => tab.name === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderTabs(oldIndex, newIndex);
      }
    }
  };

  const handleAddTab = () => {
    const newTabName = prompt('Nome da nova seção:');
    if (newTabName && newTabName.trim()) {
      onAddTab(newTabName.trim());
    }
  };

  const handleRenameClick = (tabName: string) => {
    setTabToRename(tabName);
    setRenameDialogOpen(true);
  };

  const handleRename = (newName: string) => {
    if (tabToRename) {
      onRenameTab(tabToRename, newName);
    }
    setRenameDialogOpen(false);
    setTabToRename(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Seções</h3>
        <Tooltip content="Adicionar seção" relationship="label">
          <Button
            size="small"
            appearance="subtle"
            icon={<Add24Regular />}
            onClick={handleAddTab}
          />
        </Tooltip>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((tab) => tab.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.tabsList}>
            {tabs.map((tab) => (
              <SortableTabItem
                key={tab.name}
                tab={tab}
                isSelected={selectedTab === tab.name}
                onSelect={() => onSelectTab(tab.name)}
                onRename={() => handleRenameClick(tab.name)}
                onDelete={() => onRemoveTab(tab.name)}
                onMoveUp={() => onMoveTabUp(tab.name)}
                onMoveDown={() => onMoveTabDown(tab.name)}
                canMoveUp={canMoveUp(tab.name)}
                canMoveDown={canMoveDown(tab.name)}
                canDelete={canRemoveTab(tab.name)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tabToRename && (
        <TabRenameDialog
          open={renameDialogOpen}
          currentName={tabToRename}
          onClose={() => {
            setRenameDialogOpen(false);
            setTabToRename(null);
          }}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
