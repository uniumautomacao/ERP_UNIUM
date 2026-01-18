import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  Card,
  makeStyles,
  tokens,
  Spinner,
  Button,
  Checkbox,
  Tooltip,
  Input,
} from '@fluentui/react-components';
import { 
  Save24Regular, 
  ArrowSync24Regular,
  Dismiss24Regular,
  Info20Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { navigation } from '../../config/navigation';
import { 
  RolesService, 
  NewCodeAppPageAllowedSecurityRoleService 
} from '../../generated';
import type { Roles } from '../../generated/models/RolesModel';
import type { NewCodeAppPageAllowedSecurityRole } from '../../generated/models/NewCodeAppPageAllowedSecurityRoleModel';
import { useAccessControl } from '../../security/AccessControlContext';
import { sortRoles } from '../../security/roleUtils';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    height: '100%',
  },
  card: {
    padding: '0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tableWrapper: {
    overflow: 'auto',
    flexGrow: 1,
    position: 'relative',
  },
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    width: 'max-content',
    minWidth: '100%',
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '8px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    textAlign: 'center',
    fontSize: '12px',
  },
  thSection: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '10px',
  },
  thRole: {
    position: 'sticky',
    zIndex: 20,
    textAlign: 'left',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: `2px 0 0 ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalM,
  },
  thAll: {
    position: 'sticky',
    zIndex: 20,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    padding: '4px 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
  },
  tdRole: {
    position: 'sticky',
    zIndex: 5,
    backgroundColor: tokens.colorNeutralBackground1,
    textAlign: 'left',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: `2px 0 0 ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalM,
  },
  tdAll: {
    position: 'sticky',
    zIndex: 5,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tdOverride: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  tdCentered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '100px',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    opacity: 0.6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  stickyHeaderRole: {
    zIndex: 30,
  },
  stickyHeaderAll: {
    zIndex: 30,
  },
  searchBar: {
    padding: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  searchInput: {
    flexGrow: 1,
    maxWidth: '400px',
  }
});

export function SuperAdminPageAccessPage() {
  const styles = useStyles();
  const { refresh: refreshAccess } = useAccessControl();
  
  const [allRoles, setAllRoles] = useState<Roles[]>([]);
  const [rules, setRules] = useState<NewCodeAppPageAllowedSecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const roleColumnWidth = 260;

  // Estrutura das colunas: Seções -> Páginas
  const columns = useMemo(() => {
    const pages: Array<{ key: string, label: string, section: string }> = [];
    navigation.forEach(section => {
      section.items.forEach(item => {
        pages.push({
          key: item.path,
          label: item.label,
          section: section.label || 'Principal'
        });
      });
    });

    const grouped = new Map<string, typeof pages>();
    pages.forEach(p => {
      if (!grouped.has(p.section)) grouped.set(p.section, []);
      grouped.get(p.section)!.push(p);
    });

    return {
      allPages: pages,
      bySection: Array.from(grouped.entries())
    };
  }, []);

  // Mapeamento O(1) para regras existentes: roleId -> pageKey -> ruleId
  const rulesMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    rules.forEach(rule => {
      const roleId = rule._new_securityrole_value;
      if (!roleId) return;
      if (!map.has(roleId)) map.set(roleId, new Map());
      map.get(roleId)!.set(rule.new_id || '', rule.new_codeapppageallowedsecurityroleid);
    });
    return map;
  }, [rules]);

  const fetchData = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const rolesFilter = search ? `contains(name, '${search}')` : undefined;
      
      const [rolesResult, rulesResult] = await Promise.all([
        RolesService.getAll({
          select: ['roleid', 'name'],
          orderBy: ['name asc'],
          filter: rolesFilter
        }),
        NewCodeAppPageAllowedSecurityRoleService.getAll({
          filter: 'statecode eq 0',
          select: ['new_codeapppageallowedsecurityroleid', 'new_id', '_new_securityrole_value']
        })
      ]);
      
      setAllRoles(rolesResult.data || []);
      setRules(rulesResult.data || []);
      setPendingChanges(new Map());
    } catch (error) {
      console.error('Erro ao buscar dados da matriz:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchData]);

  // Ordenação das roles conforme especificação centralizada
  const sortedRoles = useMemo(() => {
    // Converter rulesMap (Map<string, Map<string, string>>) para Map<string, Set<string>> para o utilitário
    const pageRulesMap = new Map<string, Set<string>>();
    rulesMap.forEach((innerMap, roleId) => {
      pageRulesMap.set(roleId, new Set(innerMap.keys()));
    });

    return sortRoles(allRoles, { pageRulesMap });
  }, [allRoles, rulesMap]);

  const getCellKey = (roleId: string, pageKey: string) => `${roleId}|${pageKey}`;

  const getAccessStatus = (roleId: string, pageKey: string) => {
    const key = getCellKey(roleId, pageKey);
    if (pendingChanges.has(key)) return pendingChanges.get(key)!;
    
    const userRules = rulesMap.get(roleId);
    return !!(userRules && userRules.has(pageKey));
  };

  const toggleAccess = (roleId: string, pageKey: string) => {
    const current = getAccessStatus(roleId, pageKey);
    const original = !!rulesMap.get(roleId)?.has(pageKey);
    const next = !current;
    
    const newChanges = new Map(pendingChanges);
    const key = getCellKey(roleId, pageKey);
    
    if (next === original) {
      newChanges.delete(key);
    } else {
      newChanges.set(key, next);
    }
    setPendingChanges(newChanges);
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      for (const [key, desiredValue] of pendingChanges.entries()) {
        const [roleId, pageKey] = key.split('|');
        const existingRuleId = rulesMap.get(roleId)?.get(pageKey);

        if (desiredValue && !existingRuleId) {
          // Criar
          await NewCodeAppPageAllowedSecurityRoleService.create({
            new_id: pageKey,
            'new_SecurityRole@odata.bind': `/roles(${roleId})`
          });
        } else if (!desiredValue && existingRuleId) {
          // Deletar
          await NewCodeAppPageAllowedSecurityRoleService.delete(existingRuleId);
        }
      }
      
      await fetchData();
      await refreshAccess();
      alert('Matriz de permissões atualizada!');
    } catch (error) {
      console.error('Erro ao salvar matriz:', error);
      alert('Erro ao salvar. Verifique o console.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <CommandBar 
        primaryActions={[
          {
            id: 'save',
            label: 'Salvar',
            icon: <Save24Regular />,
            onClick: handleSave,
            disabled: saving || pendingChanges.size === 0,
          },
          {
            id: 'discard',
            label: 'Descartar',
            icon: <Dismiss24Regular />,
            onClick: () => setPendingChanges(new Map()),
            disabled: saving || pendingChanges.size === 0,
          },
          {
            id: 'refresh',
            label: 'Atualizar',
            icon: <ArrowSync24Regular />,
            onClick: () => fetchData(searchTerm),
            disabled: loading || saving,
          }
        ]} 
      />
      <PageHeader
        title="Matriz de Acesso"
        subtitle="Controle centralizado de permissões por Security Role"
      />
      
      <PageContainer>
        <Card className={styles.card}>
          <div className={styles.searchBar}>
            <Input
              className={styles.searchInput}
              contentBefore={<Search24Regular />}
              placeholder="Pesquisar security role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Pesquisar security role"
            />
            {loading && <Spinner size="tiny" />}
          </div>

          <div className={styles.tableWrapper}>
            {loading && (
              <div className={styles.loadingOverlay}>
                <Spinner label="Carregando matriz de permissões..." />
              </div>
            )}
            <table className={styles.table}>
              <thead>
                {/* Linha 1: Seções */}
                <tr>
                  <th
                    className={`${styles.th} ${styles.thRole} ${styles.stickyHeaderRole}`}
                    rowSpan={2}
                    style={{ left: 0, minWidth: roleColumnWidth, width: roleColumnWidth }}
                  >
                    Security Role
                  </th>
                  <th
                    className={`${styles.th} ${styles.thAll} ${styles.stickyHeaderAll}`}
                    rowSpan={2}
                    style={{ left: roleColumnWidth }}
                  >
                    All (*)
                  </th>
                  {columns.bySection.map(([section, pages]) => (
                    <th key={section} className={`${styles.th} ${styles.thSection}`} colSpan={pages.length}>
                      {section}
                    </th>
                  ))}
                </tr>
                {/* Linha 2: Páginas */}
                <tr>
                  {columns.allPages.map(page => (
                    <th key={page.key} className={styles.th}>
                      <Tooltip content={page.key} relationship="label">
                        <Text size={200}>{page.label}</Text>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRoles.map(role => {
                  const isAllChecked = getAccessStatus(role.roleid, '*');
                  
                  return (
                    <tr key={role.roleid} className={styles.tableRow}>
                      <td
                        className={styles.tdRole}
                        style={{ left: 0, minWidth: roleColumnWidth, width: roleColumnWidth }}
                      >
                        <div className="flex items-center gap-1">
                          <Text size={200} weight="semibold">{role.name}</Text>
                          <Tooltip content={role.roleid} relationship="description">
                            <Info20Regular fontSize={14} style={{ opacity: 0.5 }} />
                          </Tooltip>
                        </div>
                      </td>
                      <td className={styles.tdAll} style={{ left: roleColumnWidth }}>
                        <div className={styles.tdCentered}>
                          <Checkbox 
                            checked={isAllChecked} 
                            onChange={() => toggleAccess(role.roleid, '*')} 
                            aria-label={`Wildcard * para ${role.name}`}
                          />
                        </div>
                      </td>
                      {columns.allPages.map(page => {
                        const isChecked = isAllChecked || getAccessStatus(role.roleid, page.key);
                        const isDisabled = isAllChecked;
                        
                        return (
                          <td 
                            key={page.key} 
                            className={`${styles.td} ${isDisabled ? styles.tdOverride : ''}`}
                          >
                            <div className={styles.tdCentered}>
                              <Checkbox 
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => toggleAccess(role.roleid, page.key)}
                                aria-label={`${page.label} para ${role.name}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && sortedRoles.length === 0 && (
              <div className={styles.loadingContainer}>
                <Text italic color={tokens.colorNeutralForeground4}>
                  Nenhuma security role encontrada para o filtro informado.
                </Text>
              </div>
            )}
          </div>

          {pendingChanges.size > 0 && (
            <div className={styles.actions}>
              <Text size={200} italic color={tokens.colorPaletteDarkOrangeForeground1}>
                {pendingChanges.size} alterações pendentes
              </Text>
              <Button appearance="subtle" onClick={() => setPendingChanges(new Map())} disabled={saving}>Descartar</Button>
              <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Matriz'}
              </Button>
            </div>
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
