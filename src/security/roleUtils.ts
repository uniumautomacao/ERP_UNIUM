import type { Roles } from '../generated/models/RolesModel';

export interface RoleRankingData {
  /**
   * Map of roleId -> Set of pageKeys enabled for that role.
   * Used to determine if a role has at least one relevant page enabled.
   */
  pageRulesMap?: Map<string, Set<string>>;
}

/**
 * Calculates the rank of a security role based on predefined rules.
 * Lower rank means higher priority in sorting.
 */
export const getRoleRank = (role: Roles, data: RoleRankingData) => {
  const name = (role.name || '').toLowerCase();
  
  // 1. System Administrator
  if (name === 'system administrator') return 0;
  
  // 2. Basic User
  if (name === 'basic user') return 1;
  
  // 3. Contains "UNIUM"
  if (name.includes('unium')) return 2;
  
  // 4. Has at least one relevant page enabled (ignoring Home '/')
  if (data.pageRulesMap) {
    const rolePages = data.pageRulesMap.get(role.roleid);
    if (rolePages && rolePages.size > 0) {
      const hasRelevantAccess = Array.from(rolePages).some(key => key !== '/');
      if (hasRelevantAccess) return 3;
    }
  }
  
  // 5. Others
  return 4;
};

/**
 * Sorts a list of roles using the centralized ranking logic.
 */
export const sortRoles = (roles: Roles[], data: RoleRankingData) => {
  return [...roles].sort((a, b) => {
    const rankA = getRoleRank(a, data);
    const rankB = getRoleRank(b, data);
    
    if (rankA !== rankB) return rankA - rankB;
    
    // Fallback: alphabetical order by name
    return (a.name || '').localeCompare(b.name || '');
  });
};
