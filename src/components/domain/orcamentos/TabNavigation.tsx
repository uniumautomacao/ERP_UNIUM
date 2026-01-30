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
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrcamentoSecao } from '../../../features/orcamentos/types';
import { TabRenameDialog } from './dialogs/TabRenameDialog';
import { TabMergeDialog } from './dialogs/TabMergeDialog';
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
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderTopColor: tokens.colorNeutralStroke1Hover,
      borderRightColor: tokens.colorNeutralStroke1Hover,
      borderBottomColor: tokens.colorNeutralStroke1Hover,
      borderLeftColor: tokens.colorNeutralStroke1Hover,
    },
  },
  tabItemSelected: {
    backgroundColor: tokens.colorBrandBackground,
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    color: tokens.colorNeutralForegroundOnBrand,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      borderTopColor: tokens.colorBrandStroke2Hover,
      borderRightColor: tokens.colorBrandStroke2Hover,
      borderBottomColor: tokens.colorBrandStroke2Hover,
      borderLeftColor: tokens.colorBrandStroke2Hover,
    },
  },
  tabItemDragging: {
    opacity: 0.5,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalXS,
  },
  tabName: {
    fontSize: '13px',
    fontWeight: 600,
  },
  tabInfo: {
    fontSize: '11px',
    opacity: 0.7,
  },
  menuButton: {
    minWidth: '28px',
  },
});

interface SortableTabItemProps {
  tab: OrcamentoSecao;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onMerge: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canMerge: boolean;
}

function SortableTabItem({
  tab,
  isSelected,
  onSelect,
  onRename,
  onMerge,
  onDelete,
  canDelete,
  canMerge,
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
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="Ações" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<MoreHorizontal24Regular />}
                className={styles.menuButton}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={<Edit24Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
              >
                Renomear
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMerge();
                }}
                disabled={!canMerge}
              >
                Mesclar
              </MenuItem>
              <MenuItem
                icon={<Delete24Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={!canDelete}
              >
                Excluir
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
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
  onRenameTab: (oldName: string, newName: string) => Promise<void>;
  onMergeTab: (sourceName: string, targetName: string) => Promise<void>;
  onReorderTabs: (startIndex: number, endIndex: number) => void;
  canRemoveTab: (name: string) => boolean;
  onRenameError?: (error: string) => void;
  onMergeError?: (error: string) => void;
}

export function TabNavigation({
  tabs,
  selectedTab,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onRenameTab,
  onMergeTab,
  onReorderTabs,
  canRemoveTab,
  onRenameError,
  onMergeError,
}: TabNavigationProps) {
  const styles = useStyles();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [tabToRename, setTabToRename] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [tabToMerge, setTabToMerge] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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

  const handleMergeClick = (tabName: string) => {
    setTabToMerge(tabName);
    setMergeDialogOpen(true);
  };

  const handleRename = async (newName: string) => {
    if (!tabToRename) return;

    setIsRenaming(true);
    try {
      await onRenameTab(tabToRename, newName);
      setRenameDialogOpen(false);
      setTabToRename(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao renomear seção';
      onRenameError?.(errorMessage);
      throw err;
    } finally {
      setIsRenaming(false);
    }
  };

  const handleMerge = async (targetName: string) => {
    if (!tabToMerge) return;

    setIsMerging(true);
    try {
      await onMergeTab(tabToMerge, targetName);
      setMergeDialogOpen(false);
      setTabToMerge(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao mesclar seções';
      onMergeError?.(errorMessage);
      throw err;
    } finally {
      setIsMerging(false);
    }
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
                onMerge={() => handleMergeClick(tab.name)}
                onDelete={() => onRemoveTab(tab.name)}
                canDelete={canRemoveTab(tab.name)}
                canMerge={tabs.length > 1}
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
          isLoading={isRenaming}
        />
      )}

      {tabToMerge && (
        <TabMergeDialog
          open={mergeDialogOpen}
          sourceName={tabToMerge}
          availableTargets={tabs.map((tab) => tab.name).filter((name) => name !== tabToMerge)}
          onClose={() => {
            setMergeDialogOpen(false);
            setTabToMerge(null);
          }}
          onMerge={handleMerge}
          isLoading={isMerging}
        />
      )}
    </div>
  );
}
