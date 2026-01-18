import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  Card,
  makeStyles,
  tokens,
  Spinner,
  Input,
  Checkbox,
  Tooltip,
} from '@fluentui/react-components';
import { 
  Search24Regular,
  Info20Regular,
  ArrowSync24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  SystemusersService, 
  SystemuserrolescollectionService, 
  RolesService,
  NewCodeAppPageAllowedSecurityRoleService
} from '../../generated';
import type { Systemusers } from '../../generated/models/SystemusersModel';
import type { Roles } from '../../generated/models/RolesModel';
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
  thUser: {
    position: 'sticky',
    zIndex: 20,
    textAlign: 'left',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: `2px 0 0 ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalM,
  },
  td: {
    padding: '4px 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
  },
  tdUser: {
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
  tdCentered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL,
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
  },
  errorBar: {
    padding: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    color: tokens.colorPaletteRedForeground1,
  },
});

export function SuperAdminUserRolesPage() {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Roles[]>([]);
  const [users, setUsers] = useState<Systemusers[]>([]);
  const [linkMap, setLinkMap] = useState<Map<string, Map<string, string>>>(new Map());
  const [pageRulesMap, setPageRulesMap] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inFlightCells, setInFlightCells] = useState<Set<string>>(new Set());
  const userColumnWidth = 280;

  const escapeOData = (value: string) => value.replace(/'/g, "''");

  const fetchRoles = useCallback(async () => {
    const result = await RolesService.getAll({
      select: ['roleid', 'name'],
      orderBy: ['name asc']
    });
    return result.data || [];
  }, []);

  const fetchPageRules = useCallback(async () => {
    const result = await NewCodeAppPageAllowedSecurityRoleService.getAll({
      filter: 'statecode eq 0',
      select: ['_new_securityrole_value', 'new_id']
    });
    
    const map = new Map<string, Set<string>>();
    (result.data || []).forEach(rule => {
      const roleId = rule._new_securityrole_value;
      if (!roleId) return;
      if (!map.has(roleId)) map.set(roleId, new Set());
      map.get(roleId)!.add(rule.new_id || '');
    });
    return map;
  }, []);

  const fetchUsers = useCallback(async (term: string) => {
    const normalized = term.trim();
    const safeTerm = escapeOData(normalized);
    
    // Parte da busca: se não houver termo, fica null
    const searchFilter = normalized
      ? `(contains(fullname, '${safeTerm}') or contains(internalemailaddress, '${safeTerm}'))`
      : null;

    // Função auxiliar para tentar buscar com um filtro de habilitado específico
    const tryFetch = async (enabledBase: string) => {
      const exclusionFilter = "not startswith(fullname, '#') and contains(internalemailaddress, '@unium')";
      const baseWithExclusion = `${enabledBase} and ${exclusionFilter}`;
      const filter = searchFilter ? `${baseWithExclusion} and ${searchFilter}` : baseWithExclusion;
      
      const result = await SystemusersService.getAll({
        filter,
        select: ['fullname', 'internalemailaddress', 'systemuserid'],
        orderBy: ['fullname asc'],
        top: 50
      });
      return result.data || [];
    };

    // Tenta primeiro com 'ne 1'
    const results = await tryFetch('isdisabled ne 1');
    
    // Se encontrou algo, retorna. Se não (e isso inclui o caso de busca vazia), tenta o fallback.
    if (results.length > 0) {
      return results;
    }

    // Fallback com 'eq false' (cobre casos onde o campo é booleano ou o 'ne 1' falhou)
    return await tryFetch('isdisabled eq false');
  }, []);

  const fetchLinksForUsers = useCallback(async (currentUsers: Systemusers[]) => {
    if (currentUsers.length === 0) return new Map<string, Map<string, string>>();
    const filter = currentUsers.map(u => `systemuserid eq '${u.systemuserid}'`).join(' or ');
    const result = await SystemuserrolescollectionService.getAll({
      filter: `(${filter})`,
      select: ['systemuserid', 'roleid', 'systemuserroleid']
    });

    const map = new Map<string, Map<string, string>>();
    (result.data || []).forEach(link => {
      if (!map.has(link.systemuserid)) {
        map.set(link.systemuserid, new Map());
      }
      map.get(link.systemuserid)!.set(link.roleid, link.systemuserroleid);
    });
    return map;
  }, []);

  const fetchMatrix = useCallback(async (term: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [rolesResult, usersResult, pageRulesResult] = await Promise.all([
        fetchRoles(),
        fetchUsers(term),
        fetchPageRules(),
      ]);
      const linksResult = await fetchLinksForUsers(usersResult);
      setRoles(rolesResult);
      setUsers(usersResult);
      setLinkMap(linksResult);
      setPageRulesMap(pageRulesResult);
    } catch (error: any) {
      console.error('Erro ao carregar matriz de usuários:', error);
      setErrorMessage(error?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [fetchRoles, fetchUsers, fetchLinksForUsers, fetchPageRules]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMatrix(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchMatrix]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aHasRole = (linkMap.get(a.systemuserid)?.size ?? 0) > 0;
      const bHasRole = (linkMap.get(b.systemuserid)?.size ?? 0) > 0;
      if (aHasRole !== bHasRole) return aHasRole ? -1 : 1;
      return (a.fullname || '').localeCompare(b.fullname || '');
    });
  }, [users, linkMap]);

  const sortedRoles = useMemo(() => {
    return sortRoles(roles, { pageRulesMap });
  }, [roles, pageRulesMap]);

  const getCellKey = (userId: string, roleId: string) => `${userId}|${roleId}`;

  const isChecked = (userId: string, roleId: string) => {
    return !!linkMap.get(userId)?.has(roleId);
  };

  const updateLinkMap = (userId: string, roleId: string, linkId?: string) => {
    setLinkMap(prev => {
      const next = new Map(prev);
      const row = new Map(next.get(userId) || []);
      if (linkId) {
        row.set(roleId, linkId);
      } else {
        row.delete(roleId);
      }
      if (row.size === 0) {
        next.delete(userId);
      } else {
        next.set(userId, row);
      }
      return next;
    });
  };

  const toggleRole = async (userId: string, roleId: string) => {
    const key = getCellKey(userId, roleId);
    if (inFlightCells.has(key)) return;

    setInFlightCells(prev => new Set(prev).add(key));
    setErrorMessage(null);

    try {
      const existingLinkId = linkMap.get(userId)?.get(roleId);
      if (existingLinkId) {
        await SystemuserrolescollectionService.delete(existingLinkId);
        updateLinkMap(userId, roleId);
      } else {
        const createResult = await SystemuserrolescollectionService.create({
          systemuserid: userId,
          roleid: roleId,
        });
        let newLinkId = createResult.data?.systemuserroleid;
        if (!newLinkId) {
          const lookup = await SystemuserrolescollectionService.getAll({
            filter: `systemuserid eq '${userId}' and roleid eq '${roleId}'`,
            select: ['systemuserroleid'],
            top: 1
          });
          newLinkId = lookup.data?.[0]?.systemuserroleid;
        }
        if (newLinkId) {
          updateLinkMap(userId, roleId, newLinkId);
        } else {
          setErrorMessage('Vínculo criado, mas não foi possível recuperar o ID.');
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar vínculo de role:', error);
      setErrorMessage(error?.message || 'Erro ao atualizar vínculo de role.');
    } finally {
      setInFlightCells(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <>
      <CommandBar 
        primaryActions={[
          {
            id: 'refresh',
            label: 'Atualizar',
            icon: <ArrowSync24Regular />,
            onClick: () => fetchMatrix(searchTerm),
            disabled: loading,
          }
        ]}
      />
      <PageHeader
        title="Roles por Usuário"
        subtitle="Gerencie quais Security Roles estão atribuídas a cada usuário"
      />
      <PageContainer>
        <div className={styles.container}>
          <Card className={styles.card}>
            <div className={styles.searchBar}>
              <Input
                className={styles.searchInput}
                contentBefore={<Search24Regular />}
                placeholder="Pesquisar usuário por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Pesquisar usuário"
              />
              {loading && <Spinner size="tiny" />}
            </div>

            {errorMessage && (
              <div className={styles.errorBar}>
                <Text size={200}>{errorMessage}</Text>
              </div>
            )}

            <div className={styles.tableWrapper}>
              {loading && (
                <div className={styles.loadingOverlay}>
                  <Spinner label="Carregando matriz de usuários..." />
                </div>
              )}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th
                      className={`${styles.th} ${styles.thUser}`}
                      style={{ left: 0, minWidth: userColumnWidth, width: userColumnWidth }}
                    >
                      Usuário
                    </th>
                    {sortedRoles.map(role => (
                      <th key={role.roleid} className={styles.th}>
                        <Tooltip content={role.roleid} relationship="label">
                          <Text size={200}>{role.name}</Text>
                        </Tooltip>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map(user => (
                    <tr key={user.systemuserid} className={styles.tableRow}>
                      <td
                        className={styles.tdUser}
                        style={{ left: 0, minWidth: userColumnWidth, width: userColumnWidth }}
                      >
                        <div className="flex items-center gap-1">
                          <Text size={200} weight="semibold">{user.fullname}</Text>
                          <Tooltip content={user.systemuserid} relationship="description">
                            <Info20Regular fontSize={14} style={{ opacity: 0.5 }} />
                          </Tooltip>
                        </div>
                        <Text size={200} color={tokens.colorNeutralForeground4}>
                          {user.internalemailaddress}
                        </Text>
                      </td>
                      {sortedRoles.map(role => {
                        const key = getCellKey(user.systemuserid, role.roleid);
                        const checked = isChecked(user.systemuserid, role.roleid);
                        const disabled = inFlightCells.has(key);
                        return (
                          <td key={role.roleid} className={styles.td}>
                            <div className={styles.tdCentered}>
                              <Checkbox
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleRole(user.systemuserid, role.roleid)}
                                aria-label={`${role.name} para ${user.fullname}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && sortedUsers.length === 0 && (
                <div className={styles.loadingContainer}>
                  <Text italic color={tokens.colorNeutralForeground4}>
                    Nenhum usuário encontrado para o filtro informado.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
};
