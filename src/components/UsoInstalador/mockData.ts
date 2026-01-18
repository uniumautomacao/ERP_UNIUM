// Mock data for "Uso do Instalador (Semana)" component
// 15 instaladores organizados em duplas por cor

import type {
  Installer,
  Activity,
  Project,
  Team,
} from './types';

/**
 * Gera a data de uma segunda-feira da semana atual ou especificada
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gera array de datas da semana (Seg-Sáb)
 */
export function getWeekDates(monday: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Formata data para string YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// PROJETOS (baseados no print da semana 05/01 a 10/01/2026)
// ============================================

export const mockProjects: Project[] = [
  { id: 'proj-001', name: 'Luciana Pelotto', client: 'Luciana', address: '', status: 'active' },
  { id: 'proj-002', name: 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', client: 'Marco Antonio', address: '', status: 'active' },
  { id: 'proj-003', name: 'EDF GIOR - COLL CONSTRUCOES', client: 'Edf Gior', address: '', status: 'active' },
  { id: 'proj-004', name: 'UNIUM', client: 'UNIUM', address: '', status: 'active' },
  { id: 'proj-005', name: 'ANDRÉ E ANA - EDF GIOR, APTO 1103 - ARQ ANDREA MENDONÇA', client: 'André e Ana', address: '', status: 'active' },
  { id: 'proj-006', name: 'RICARDO LEÃO - RESERVA AYUMANÁ, CASA 09 - ANGELI LEÃO', client: 'Ricardo Leão', address: '', status: 'active' },
  { id: 'proj-007', name: 'EDF NEW TIME - COLL', client: 'New Time', address: '', status: 'active' },
  { id: 'proj-008', name: 'STEFANO ROBERTO - EDF LIVORNO 802 - CIM ARQ', client: 'Stefano', address: '', status: 'active' },
  { id: 'proj-009', name: 'Cristiano e Olga - Edf Gior - Apto 803', client: 'Cristiano', address: '', status: 'active' },
  { id: 'proj-010', name: 'PERELANDIA BEZERRA - EDF MARC CHAGALL - ARQ PEDRO ALVES', client: 'Perelandia', address: '', status: 'active' },
  { id: 'proj-011', name: 'EDF RESIDENCIAL', client: 'Residencial', address: '', status: 'active' },
  { id: 'proj-012', name: 'PAULO E JULIA - EDF MANSÃO GALBA ACCOLOY APTO 901 - M2 ARQUITETURA', client: 'Paulo e Julia', address: '', status: 'active' },
  { id: 'proj-013', name: 'Antonio e Ana - Cond Atlantis - Andre Gobbo', client: 'Antonio', address: '', status: 'active' },
  { id: 'proj-014', name: 'José Mauricio - New Time', client: 'José Mauricio', address: '', status: 'active' },
  { id: 'proj-015', name: 'ALEXANDRE E ANDRELINE - EDF GIOR', client: 'Alexandre', address: '', status: 'active' },
  { id: 'proj-016', name: 'GUSTAVO HENRIQUE - JARDIM DO HOITO - ARQ JULIANE MORAES', client: 'Gustavo', address: '', status: 'active' },
  { id: 'proj-017', name: 'CHARLINE RIBEIRO', client: 'Charline', address: '', status: 'active' },
  { id: 'proj-018', name: 'DELMAN SAMPAIO - LAGUNA', client: 'Delman', address: '', status: 'active' },
  { id: 'proj-019', name: 'Edf Residencial Da Vince', client: 'Residencial Vince', address: '', status: 'active' },
  { id: 'proj-020', name: 'ANA E ROSS - EDF DA VINCE 902 - ARQ ANA', client: 'Ana e Ross', address: '', status: 'active' },
  { id: 'proj-021', name: 'CARLOS HENRIQUE - EDF VITREO, APTO 1002 - ARQ', client: 'Carlos Henrique', address: '', status: 'active' },
  { id: 'proj-022', name: 'INOVE - CASA 01 - BARRA DE SÃO MIGUEL', client: 'Inove', address: '', status: 'active' },
  { id: 'proj-023', name: 'INOVE - CASA 02 - BARRA DE SÃO MIGUEL', client: 'Inove', address: '', status: 'active' },
  { id: 'proj-024', name: 'INOVE - CASA 03 - BARRA DE SÃO MIGUEL', client: 'Inove', address: '', status: 'active' },
  { id: 'proj-025', name: 'CLINICA LOGOS SAUDE - EDF', client: 'Clinica Logos', address: '', status: 'active' },
  { id: 'proj-026', name: 'LAIS CHAGAS E ARTUR', client: 'Lais e Artur', address: '', status: 'active' },
  { id: 'proj-027', name: 'VAUNA GARROTE', client: 'Vauna', address: '', status: 'active' },
];

// ============================================
// INSTALADORES (15 pessoas conforme print)
// ============================================

export const mockInstallers: Installer[] = [
  { id: 'inst-01', name: 'Hugo Barros', color: 'lightGreen', weeklyCapacity: 48, teamId: 'team-01', isActive: true },
  { id: 'inst-02', name: 'Lucas França', color: 'lightBlue', weeklyCapacity: 48, teamId: 'team-02', isActive: true },
  { id: 'inst-03', name: 'Edmilson Santos', color: 'lightBlue', weeklyCapacity: 48, teamId: 'team-02', isActive: true },
  { id: 'inst-04', name: 'José Rubens da Silva', color: 'green', weeklyCapacity: 48, teamId: 'team-03', isActive: true },
  { id: 'inst-05', name: 'Leandro Nascimento', color: 'green', weeklyCapacity: 48, teamId: 'team-03', isActive: true },
  { id: 'inst-06', name: 'Eduardo Paz', color: 'orange', weeklyCapacity: 48, teamId: 'team-04', isActive: true },
  { id: 'inst-07', name: 'Alisson Silva', color: 'orange', weeklyCapacity: 48, teamId: 'team-04', isActive: true },
  { id: 'inst-08', name: 'Wesley Lima', color: 'orange', weeklyCapacity: 48, teamId: 'team-04', isActive: true },
  { id: 'inst-09', name: 'Claudio Pimentel', color: 'white', weeklyCapacity: 48, teamId: 'team-05', isActive: true },
  { id: 'inst-10', name: 'Jamerson Nascimento', color: 'white', weeklyCapacity: 48, teamId: 'team-05', isActive: true },
  { id: 'inst-11', name: 'Aldir Fonseca', color: 'white', weeklyCapacity: 48, teamId: 'team-05', isActive: true },
  { id: 'inst-12', name: 'Wellington Nascimento', color: 'yellow', weeklyCapacity: 48, teamId: 'team-06', isActive: true },
  { id: 'inst-13', name: 'Luiz Lima', color: 'yellow', weeklyCapacity: 48, teamId: 'team-06', isActive: true },
  { id: 'inst-14', name: 'Cleutheus Duarte', color: 'yellow', weeklyCapacity: 48, teamId: 'team-06', isActive: true },
  { id: 'inst-15', name: 'Carlos Silva', color: 'yellow', weeklyCapacity: 48, teamId: 'team-06', isActive: true },
];

// ============================================
// EQUIPES/DUPLAS
// ============================================

export const mockTeams: Team[] = [
  { id: 'team-01', name: 'Dupla Branca', installerIds: ['inst-01', 'inst-02'], color: 'white' },
  { id: 'team-02', name: 'Dupla Azul Clara', installerIds: ['inst-03', 'inst-04'], color: 'lightBlue' },
  { id: 'team-03', name: 'Dupla Verde', installerIds: ['inst-05', 'inst-06'], color: 'green' },
  { id: 'team-04', name: 'Dupla Amarela', installerIds: ['inst-07', 'inst-08'], color: 'yellow' },
  { id: 'team-05', name: 'Dupla Laranja', installerIds: ['inst-09', 'inst-10'], color: 'orange' },
  { id: 'team-06', name: 'Dupla Violeta', installerIds: ['inst-11', 'inst-12'], color: 'violet' },
  { id: 'team-07', name: 'Dupla Rosa', installerIds: ['inst-13', 'inst-14'], color: 'pink' },
];

// ============================================
// ATIVIDADES (semana 05/01 a 10/01/2026)
// ============================================

/**
 * Gera atividades mock para a semana especificada (baseado no print)
 */
export function generateMockActivities(weekStart: Date): Activity[] {
  const dates = getWeekDates(weekStart);
  const activities: Activity[] = [];

  let activityId = 1;
  const createActivity = (
    installerId: string,
    projectId: string,
    projectName: string,
    dateIndex: number,
    startTime: string,
    hours: number,
    type: Activity['type'] = 'installation'
  ): Activity => {
    const [h, m] = startTime.split(':').map(Number);
    const endHour = h + Math.floor(hours);
    const endMin = m + ((hours % 1) * 60);
    return {
      id: `act-${String(activityId++).padStart(3, '0')}`,
      installerId,
      projectId,
      projectName,
      date: dates[dateIndex],
      startTime,
      endTime: `${String(endHour).padStart(2, '0')}:${String(Math.floor(endMin)).padStart(2, '0')}`,
      hours,
      type,
      status: 'scheduled',
      address: mockProjects.find(p => p.id === projectId)?.address,
    };
  };

  // ========== INSTALADOR 1: Hugo Barros ==========
  activities.push(createActivity('inst-01', 'proj-001', 'Luciana Pelotto', 0, '14:00', 1));

  // ========== INSTALADOR 2: Lucas França ==========
  activities.push(createActivity('inst-02', 'proj-002', 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', 0, '14:00', 1));
  activities.push(createActivity('inst-02', 'proj-002', 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', 1, '08:00', 1.5));
  activities.push(createActivity('inst-02', 'proj-007', 'EDF NEW TIME - COLL', 2, '08:30', 1));
  activities.push(createActivity('inst-02', 'proj-008', 'STEFANO ROBERTO - EDF LIVORNO 802 - CIM ARQ', 5, '09:00', 1));

  // ========== INSTALADOR 3: Edmilson Santos ==========
  activities.push(createActivity('inst-03', 'proj-002', 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', 0, '14:00', 1));
  activities.push(createActivity('inst-03', 'proj-002', 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', 1, '08:00', 1.5));
  activities.push(createActivity('inst-03', 'proj-005', 'ANDRÉ E ANA - EDF GIOR, APTO 1103 - ARQ ANDREA MENDONÇA', 2, '08:30', 1));
  activities.push(createActivity('inst-03', 'proj-003', 'EDF GIOR - COLL CONSTRUCOES', 3, '08:30', 1));
  activities.push(createActivity('inst-03', 'proj-005', 'ANDRÉ E ANA - EDF GIOR, APTO 1103 - ARQ ANDREA MENDONÇA', 3, '08:30', 1));
  activities.push(createActivity('inst-03', 'proj-005', 'ANDRÉ E ANA - EDF GIOR, APTO 1103 - ARQ ANDREA MENDONÇA', 4, '08:30', 1));
  activities.push(createActivity('inst-03', 'proj-009', 'Cristiano e Olga - Edf Gior - Apto 803', 5, '09:00', 1));

  // ========== INSTALADOR 4: José Rubens da Silva ==========
  activities.push(createActivity('inst-04', 'proj-010', 'PERELANDIA BEZERRA - EDF MARC CHAGALL - ARQ PEDRO ALVES', 0, '14:00', 1));
  activities.push(createActivity('inst-04', 'proj-011', 'EDF RESIDENCIAL', 1, '08:30', 1.5));
  activities.push(createActivity('inst-04', 'proj-007', 'EDF NEW TIME - COLL', 1, '10:00', 1));
  activities.push(createActivity('inst-04', 'proj-004', 'UNIUM', 2, '14:00', 1));
  activities.push(createActivity('inst-04', 'proj-012', 'PAULO E JULIA - EDF MANSÃO GALBA ACCOLOY APTO 901 - M2 ARQUITETURA', 3, '08:30', 1));
  activities.push(createActivity('inst-04', 'proj-012', 'PAULO E JULIA - EDF MANSÃO GALBA ACCOLOY APTO 901 - M2 ARQUITETURA', 4, '09:00', 1));
  activities.push(createActivity('inst-04', 'proj-013', 'Antonio e Ana - Cond Atlantis - Andre Gobbo', 5, '09:00', 1));

  // ========== INSTALADOR 5: Leandro Nascimento ==========
  activities.push(createActivity('inst-05', 'proj-010', 'PERELANDIA BEZERRA - EDF MARC CHAGALL - ARQ PEDRO ALVES', 0, '14:00', 1));
  activities.push(createActivity('inst-05', 'proj-011', 'EDF RESIDENCIAL', 1, '08:30', 1.5));
  activities.push(createActivity('inst-05', 'proj-007', 'EDF NEW TIME - COLL', 1, '10:00', 1));
  activities.push(createActivity('inst-05', 'proj-004', 'UNIUM', 2, '14:00', 1));
  activities.push(createActivity('inst-05', 'proj-012', 'PAULO E JULIA - EDF MANSÃO GALBA ACCOLOY APTO 901 - M2 ARQUITETURA', 3, '09:30', 1));
  activities.push(createActivity('inst-05', 'proj-014', 'José Mauricio - New Time', 3, '09:00', 0.5));
  activities.push(createActivity('inst-05', 'proj-015', 'ALEXANDRE E ANDRELINE - EDF GIOR', 4, '14:30', 1.5));
  activities.push(createActivity('inst-05', 'proj-006', 'RICARDO LEÃO - RESERVA AYUMANÁ, CASA 09 - ANGELI LEÃO', 4, '16:00', 1));
  activities.push(createActivity('inst-05', 'proj-006', 'RICARDO LEÃO - RESERVA AYUMANÁ, CASA 09 - ANGELI LEÃO', 5, '08:30', 1));

  // ========== INSTALADOR 6: Eduardo Paz ==========
  activities.push(createActivity('inst-06', 'proj-004', 'UNIUM', 0, '13:30', 1));
  activities.push(createActivity('inst-06', 'proj-004', 'UNIUM', 1, '07:30', 1));
  activities.push(createActivity('inst-06', 'proj-016', 'GUSTAVO HENRIQUE - JARDIM DO HOITO - ARQ JULIANE MORAES', 2, '08:30', 1));
  activities.push(createActivity('inst-06', 'proj-004', 'UNIUM', 2, '13:30', 1));
  activities.push(createActivity('inst-06', 'proj-012', 'PAULO E JULIA - EDF MANSÃO GALBA ACCOLOY APTO 901 - M2 ARQUITETURA', 3, '08:30', 1));
  activities.push(createActivity('inst-06', 'proj-005', 'ANDRÉ E ANA - EDF GIOR, APTO 1103 - ARQ ANDREA MENDONÇA', 4, '08:30', 1));

  // ========== INSTALADOR 7: Alisson Silva ==========
  activities.push(createActivity('inst-07', 'proj-004', 'UNIUM', 0, '13:30', 1));
  activities.push(createActivity('inst-07', 'proj-004', 'UNIUM', 1, '07:30', 1));
  activities.push(createActivity('inst-07', 'proj-004', 'UNIUM', 2, '07:30', 1));
  activities.push(createActivity('inst-07', 'proj-014', 'José Mauricio - New Time', 3, '09:00', 1));
  activities.push(createActivity('inst-07', 'proj-002', 'MARCO ANTONIO-EDIFRITZ 601 - ARQ. PAULA', 3, '14:30', 1));
  activities.push(createActivity('inst-07', 'proj-017', 'CHARLINE RIBEIRO', 4, '08:30', 1));
  activities.push(createActivity('inst-07', 'proj-018', 'DELMAN SAMPAIO - LAGUNA', 4, '15:00', 1));

  // ========== INSTALADOR 8: Wesley Lima ==========
  activities.push(createActivity('inst-08', 'proj-019', 'Edf Residencial Da Vince', 0, '14:00', 1));
  activities.push(createActivity('inst-08', 'proj-019', 'Edf Residencial Da Vince', 1, '07:30', 1));
  activities.push(createActivity('inst-08', 'proj-019', 'Edf Residencial Da Vince', 2, '07:30', 1));

  // ========== INSTALADOR 9-11: Claudio, Jamerson, Aldir (sem atividades) ==========
  // Sem atividades nesta semana

  // ========== INSTALADOR 12: Wellington Nascimento ==========
  activities.push(createActivity('inst-12', 'proj-020', 'ANA E ROSS - EDF DA VINCE 902 - ARQ ANA', 0, '08:00', 1));
  activities.push(createActivity('inst-12', 'proj-021', 'CARLOS HENRIQUE - EDF VITREO, APTO 1002 - ARQ', 0, '09:00', 1));

  // ========== INSTALADOR 13: Luiz Lima ==========
  activities.push(createActivity('inst-13', 'proj-022', 'INOVE - CASA 01 - BARRA DE SÃO MIGUEL', 2, '10:00', 0.5));
  activities.push(createActivity('inst-13', 'proj-023', 'INOVE - CASA 02 - BARRA DE SÃO MIGUEL', 2, '10:30', 0.5));
  activities.push(createActivity('inst-13', 'proj-024', 'INOVE - CASA 03 - BARRA DE SÃO MIGUEL', 2, '11:00', 1));
  activities.push(createActivity('inst-13', 'proj-025', 'CLINICA LOGOS SAUDE - EDF', 4, '08:30', 2));
  activities.push(createActivity('inst-13', 'proj-026', 'LAIS CHAGAS E ARTUR', 4, '10:30', 5.5));
  activities.push(createActivity('inst-13', 'proj-027', 'VAUNA GARROTE', 4, '16:00', 1));

  // ========== INSTALADOR 14-15: Cleutheus Duarte, Carlos Silva ==========
  // Sem atividades programadas para esta semana

  return activities;
}

/**
 * Retorna todos os dados mock para a semana especificada
 */
export function getMockData(weekStart?: Date) {
  const monday = weekStart || getMondayOfWeek();
  return {
    installers: mockInstallers,
    projects: mockProjects,
    teams: mockTeams,
    activities: generateMockActivities(monday),
    weekStart: monday,
  };
}
