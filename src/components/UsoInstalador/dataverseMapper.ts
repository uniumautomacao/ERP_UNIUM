/**
 * Mapeia dados do Dataverse para as interfaces do componente UsoInstalador
 */

import type { Activity, Installer, Project, ActivityType, ActivityStatus, InstallerColor } from './types';
import type { Atividadefieldcontrol } from '../../generated/models/AtividadefieldcontrolModel';
import { CorcolaboradorlinhadotempoService } from '../../generated/services/CorcolaboradorlinhadotempoService';
import { SystemusersService } from '../../generated/services/SystemusersService';
import { ApppreferencesService } from '../../generated/services/ApppreferencesService';
import { OrdemdeservicofieldcontrolService } from '../../generated/services/OrdemdeservicofieldcontrolService';
import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { ProjetosService } from '../../generated/services/ProjetosService';

// Constante para chave de preferências de usuários fixos
const FIXED_USERS_KEY = 'TimeLineFixedUser';

/**
 * Interface para usuário disponível para seleção
 */
export interface AvailableUser {
  id: string;
  fullname: string;
  email?: string;
  isFixed: boolean; // Se está marcado para aparecer sempre
}

/**
 * Interface para Ordem de Serviço disponível para seleção
 */
export interface AvailableOrdemDeServico {
  id: string;
  identificador: string;  // new_id or new_name
  clienteNome?: string;   // contact name via lookup
  projetoId?: string;     // _new_projeto_value
  projetoNome?: string;   // formatted value do projeto
  tipoOrdemServico?: string; // new_tipodeordemdeservico
  produtos?: OrdemServicoproduto[];
  produtosLoading?: boolean; // UI-only flag to show loading state when reloading produtos
}

/**
 * Interface para produtos de uma Ordem de Serviço
 */
export interface OrdemServicoproduto {
  id: string;
  quantidade: number;
  referenciaProduto?: string;
  descricao?: string;
  statecode?: number; // 0=Active, 1=Inactive
  situacao?: string; // Human readable situacao (Ativo/Inativo) — legacy: derived from statecode
  situacaoReserva?: string; // valor do campo new_situacaoreserva (preferencial)
}

// Map dos valores de OptionSet `new_estadodoestoque` para labels legíveis
const SITUACAO_RESERVA_MAP: Record<number, string> = {
  100000000: 'Disponível',
  100000001: 'Reservado',
  100000002: 'Em showroom',
  100000003: 'Em conserto',
  100000004: 'Perda',
  100000005: 'Entregue',
  100000006: 'Não reservado',
  100000007: 'Parcialmente reservado',
  100000008: 'Separado',
  100000009: 'Granular',
  100000010: 'Faturamento direto',
  100000011: 'Empréstimo devolvido',
};

// Helper: busca produtos vinculados a uma Ordem de Serviço
export async function getProdutosByOrdem(ordemId: string, options?: { orderBy?: string }): Promise<OrdemServicoproduto[]> {
  try {
    const client = getClient(dataSourcesInfo as any);
    
    // Campo de lookup: _new_ordemdeservico_value (conforme metadados)
    const filter = `_new_ordemdeservico_value eq '${ordemId}' and statecode eq 0`;

    const requestOptions: any = {
      filter,
      select: ['new_produtoservicoid', 'new_quantidade', 'new_referenciadoproduto', 'new_descricao', 'statecode', 'new_situacaoreserva', 'new_situacaoreservatextofx']
    };

    if (options?.orderBy) {
      // orderBy should be an array as in other getAll usages
      requestOptions.orderBy = [options.orderBy];
    }

    const result = await client.retrieveMultipleRecordsAsync('new_produtoservicos', requestOptions);

    if (!result) return [];

    // Support both client response shapes: { data: [...] } (IOperationResult) or { value: [...] }
    const rows = (result as any).data || (result as any).value || [];

    const produtos: OrdemServicoproduto[] = (rows || []).map((p: any) => {
      // Resolve textual label for situacaoReserva with fallbacks:
      // 1) explicit text field `new_situacaoreservatextofx`
      // 2) formatted value returned by OData: `new_situacaoreserva@OData.Community.Display.V1.FormattedValue`
      // 3) map numeric option value using SITUACAO_RESERVA_MAP
      const explicitText = p.new_situacaoreservatextofx || p['new_situacaoreservatextofx'];
      const formatted = p['new_situacaoreserva@OData.Community.Display.V1.FormattedValue'];
      const numeric = typeof p.new_situacaoreserva !== 'undefined' ? Number(p.new_situacaoreserva) : (typeof p['new_situacaoreserva'] !== 'undefined' ? Number(p['new_situacaoreserva']) : undefined);
      const situacaoReservaLabel = explicitText || formatted || (typeof numeric !== 'undefined' ? SITUACAO_RESERVA_MAP[numeric] : undefined);

      return {
        id: p.new_produtoservicoid || p['new_produtoservicoid'] || '',
        quantidade: Number(p.new_quantidade || p['new_quantidade'] || 0),
        referenciaProduto: p.new_referenciadoproduto || p['new_referenciadoproduto'] || '',
        descricao: p.new_descricao || p['new_descricao'] || '',
        statecode: typeof p.statecode !== 'undefined' ? Number(p.statecode) : undefined,
        situacaoReserva: situacaoReservaLabel,
        situacao: typeof p.statecode !== 'undefined' ? (Number(p.statecode) === 0 ? 'Ativo' : 'Inativo') : undefined,
      };
    });

    return produtos;
  } catch (error) {
    console.error('[getProdutosByOrdem] Erro ao buscar produtos:', error);
    return [];
  }
}

/**
 * Busca todos os usuários disponíveis para seleção
 * Filtra: isdisabled = false e fullname não começa com '#'
 */
export async function getAvailableUsers(): Promise<{ success: boolean; data?: AvailableUser[]; error?: string }> {
  try {
    console.log('[getAvailableUsers] Buscando usuários disponíveis...');
    
    const result = await SystemusersService.getAll({
      select: ['systemuserid', 'fullname', 'internalemailaddress'],
      filter: "isdisabled eq false",
      orderBy: ['fullname asc'],
    });
    
    if (!result.success || !result.data) {
      console.error('[getAvailableUsers] Erro ao buscar usuários:', result.error);
      return { success: false, error: 'Falha ao buscar usuários' };
    }
    
    // Filtrar usuários cujo fullname não começa com '#' e email termina com @unium.com.br
    const filteredUsers = result.data.filter((user: any) => {
      const fullname = user.fullname || '';
      const email = user.internalemailaddress || '';
      return !fullname.startsWith('#') && email.endsWith('@unium.com.br');
    });
    
    console.log('[getAvailableUsers] Usuários encontrados:', filteredUsers.length);
    
    // Buscar preferências de usuários fixos para o usuário atual
    const fixedUserIds = await getFixedUserIds();
    
    const users: AvailableUser[] = filteredUsers.map((user: any) => ({
      id: user.systemuserid,
      fullname: user.fullname || 'Usuário sem nome',
      email: user.internalemailaddress,
      isFixed: fixedUserIds.has(user.systemuserid),
    }));
    
    return { success: true, data: users };
  } catch (error) {
    console.error('[getAvailableUsers] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Busca IDs dos usuários fixos para o usuário atual
 */
async function getFixedUserIds(): Promise<Set<string>> {
  try {
    console.log('[getFixedUserIds] Buscando preferências de usuários fixos...');
    
    // Buscar preferências que começam com FIXED_USERS_KEY e têm BoolValue = true
    const result = await ApppreferencesService.getAll({
      filter: `startswith(new_preferencekey, '${FIXED_USERS_KEY}') and new_boolvalue eq true`,
    });
    
    if (!result.success || !result.data) {
      console.log('[getFixedUserIds] Nenhuma preferência encontrada');
      return new Set();
    }
    
    console.log('[getFixedUserIds] Preferências encontradas:', result.data.length);
    
    const userIds = new Set<string>();
    result.data.forEach((pref: any) => {
      if (pref.new_stringvalue) {
        userIds.add(pref.new_stringvalue);
      }
    });
    
    console.log('[getFixedUserIds] IDs de usuários fixos:', Array.from(userIds));
    return userIds;
  } catch (error) {
    console.error('[getFixedUserIds] Erro:', error);
    return new Set();
  }
}

/**
 * Busca usuários fixos (para incluir na linha do tempo mesmo sem atividades)
 */
export async function getFixedUsers(): Promise<{ success: boolean; data?: Installer[]; error?: string }> {
  try {
    const fixedUserIds = await getFixedUserIds();
    
    if (fixedUserIds.size === 0) {
      return { success: true, data: [] };
    }
    
    console.log('[getFixedUsers] Buscando dados dos usuários fixos...');
    
    const installers: Installer[] = [];
    
    for (const userId of fixedUserIds) {
      try {
        const result = await SystemusersService.get(userId, {
          select: ['systemuserid', 'fullname', 'isdisabled'],
        });
        
        if (result.success && result.data) {
          const user = result.data as any;
          // Verificar se o usuário ainda está ativo
          if (user.isdisabled === false || user.isdisabled === 0) {
            installers.push({
              id: user.systemuserid,
              name: user.fullname || 'Usuário sem nome',
              color: 'gray', // Será atualizado depois
              weeklyCapacity: 48,
              teamId: 'team-default',
              isActive: true,
            });
          }
        }
      } catch (err) {
        console.error('[getFixedUsers] Erro ao buscar usuário:', userId, err);
      }
    }
    
    return { success: true, data: installers };
  } catch (error) {
    console.error('[getFixedUsers] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Alterna o status de usuário fixo (adiciona ou remove)
 * Implementa a mesma lógica do Power Apps Patch/Coalesce
 */
export async function toggleFixedUser(userId: string): Promise<{ success: boolean; isNowFixed: boolean; error?: string }> {
  try {
    const preferenceKey = `${FIXED_USERS_KEY}_${userId}`;
    
    console.log('[toggleFixedUser] Alternando usuário fixo:', userId, 'chave:', preferenceKey);
    
    // Buscar preferência existente
    const result = await ApppreferencesService.getAll({
      filter: `new_preferencekey eq '${preferenceKey}'`,
      top: 1,
    });
    
    if (result.success && result.data && result.data.length > 0) {
      // Atualizar preferência existente - inverter BoolValue
      const existing = result.data[0] as any;
      const currentValue = existing.new_boolvalue === true;
      const newValue = !currentValue;
      
      console.log('[toggleFixedUser] Atualizando preferência existente de', currentValue, 'para', newValue);
      
      const updateResult = await ApppreferencesService.update(existing.new_apppreferenceid, {
        new_boolvalue: newValue,
      });
      
      if (updateResult.success) {
        return { success: true, isNowFixed: newValue };
      } else {
        return { success: false, isNowFixed: currentValue, error: 'Falha ao atualizar preferência' };
      }
    } else {
      // Criar nova preferência
      console.log('[toggleFixedUser] Criando nova preferência');
      
      const createResult = await ApppreferencesService.create({
        new_preferencekey: preferenceKey,
        new_stringvalue: userId,
        new_boolvalue: true,
      });
      
      if (createResult.success) {
        return { success: true, isNowFixed: true };
      } else {
        return { success: false, isNowFixed: false, error: 'Falha ao criar preferência' };
      }
    }
  } catch (error) {
    console.error('[toggleFixedUser] Erro:', error);
    return { success: false, isNowFixed: false, error: String(error) };
  }
}

/**
 * Mapeia uma atividade do Dataverse para o tipo Activity do componente
 */
export function mapDataverseActivity(record: Atividadefieldcontrol): Activity | null {
  try {
    // Extrair dados básicos
    const id = record.new_atividadefieldcontrolid || record.activityid || '';
    const agendamento = record.new_agendamento ? new Date(record.new_agendamento) : null;
    
    if (!agendamento || !id) {
      return null;
    }

    // Dados do colaborador/employee (lookup)
    const colaboradorId = record._new_employee_value || '';

    // Dados do projeto (lookup)
    const projetoId = record._new_projeto_value || '';
    let projetoNome = record['_new_projeto_value@OData.Community.Display.V1.FormattedValue'] ||
               record.new_projeto?.cr22f_apelido ||
               record.new_projeto?.cr22f_name ||
               '';

    // Se não há projeto, usar o cliente ou identificador da OS como nome
    if (!projetoNome) {
      projetoNome = record.new_cliente || 
                    record.new_identificadorordemdeservico || 
                    'Atividade sem projeto';
    }

    // Status da atividade
    const statusAtividade = record.new_status || '';
    
    // Tipo de atividade - usar o texto formatado do OData ou o valor numérico
    const tipoTexto = record['new_tipodeservico@OData.Community.Display.V1.FormattedValue'] ||
                      record.new_tipodeservicotexto ||
                      '';
    const tipoNumero = record.new_tipodeservico;
    const tipo = mapActivityType(tipoTexto, tipoNumero);
    const status = mapActivityStatus(statusAtividade);

    // Calcular horários
    // Prioridade: usar new_duracao (em minutos) se disponível
    // Senão, calcular de new_horainicio/new_horafim
    // Senão, usar default de 4 horas
    let hours = 4; // Default
    if (record.new_duracao && typeof record.new_duracao === 'number') {
      hours = record.new_duracao / 60; // Converter minutos para horas
    } else if (record.new_horainicio && record.new_horafim) {
      hours = calculateHours(record.new_horainicio, record.new_horafim);
    }
    
    // IMPORTANTE: Extrair o horário do new_agendamento (que é a fonte da verdade)
    // O new_horainicio pode estar desatualizado ou não existir
    const agendamentoHours = agendamento.getHours().toString().padStart(2, '0');
    const agendamentoMinutes = agendamento.getMinutes().toString().padStart(2, '0');
    const startTime = `${agendamentoHours}:${agendamentoMinutes}`;
    const endTime = record.new_horafim || calculateEndTime(startTime, hours);

    // Se não há projetoId, usar o ID da atividade para evitar agrupamento incorreto
    const finalProjectId = projetoId || `activity-${id}`;

    // Campos adicionais para o painel de detalhes
    const colaboradorNome = record['_new_employee_value@OData.Community.Display.V1.FormattedValue'] || 
                            record.new_nomedocolaborador || '';
    const ordemDeServico = record.new_identificadorordemdeservico || '';
    const descricao = record.new_description || record.new_descricao || '';
    const descricaoColaborador = record.new_statusdescription || record.new_descricaocolaborador || '';
    const situacao = record.new_situacao || 
                     record['new_situacao@OData.Community.Display.V1.FormattedValue'] || '';
    const iniciadaEm = record.new_startedat ? new Date(record.new_startedat) : undefined;
    const completadaEm = record.new_completedat ? new Date(record.new_completedat) : undefined;

    console.log('[mapDataverseActivity] Atividade mapeada:', {
      id,
      projetoNome,
      colaboradorNome,
      agendamento: agendamento.toISOString(),
      startTime, // Agora extraído do agendamento
      hours,
      status: statusAtividade,
      descricao,
    });

    return {
      id,
      projectId: finalProjectId,
      projectName: projetoNome,
      installerId: colaboradorId,
      installerName: colaboradorNome,
      date: agendamento,
      startTime,
      endTime,
      hours,
      type: tipo,
      status,
      raw_status: statusAtividade,
      address: record.new_endereco || '',
      notes: record.new_observacoes || '',
      ordemDeServico,
      descricao,
      descricaoColaborador,
      situacao,
      iniciadaEm,
      completadaEm,
    };
  } catch (error) {
    console.error('Erro ao mapear atividade do Dataverse:', error, record);
    return null;
  }
}

/**
 * Mapeia tipo de atividade do Dataverse para o enum do componente
 * @param tipoTexto - texto formatado do tipo de serviço
 * @param tipoNumero - valor numérico do option set (opcional)
 */
function mapActivityType(tipoTexto: string | number | null | undefined, tipoNumero?: number | null): ActivityType {
  // Se recebeu um número diretamente, mapear pelo valor do option set
  if (typeof tipoTexto === 'number' || (tipoNumero !== undefined && tipoNumero !== null)) {
    const valor = typeof tipoTexto === 'number' ? tipoTexto : tipoNumero;
    switch (valor) {
      case 100000000: return 'installation'; // Cabeamento
      case 100000001: return 'installation'; // Instalação
      case 100000002: return 'maintenance';  // Manutenção
      case 100000003: return 'technicalVisit'; // Visita Técnica
      case 100000004: return 'travel'; // Deslocamento
      case 100000005: return 'installation'; // Desenho de PTI (não deveria aparecer com filtro)
      case 100000006: return 'installation'; // Ajuste de PTI (não deveria aparecer com filtro)
      default: return 'installation';
    }
  }
  
  // Se não tem texto, retornar default
  if (!tipoTexto || typeof tipoTexto !== 'string') {
    return 'installation';
  }
  
  const tipoLower = tipoTexto.toLowerCase();
  
  if (tipoLower.includes('instalação') || tipoLower.includes('instalacao')) {
    return 'installation';
  }
  if (tipoLower.includes('deslocamento') || tipoLower.includes('viagem')) {
    return 'travel';
  }
  if (tipoLower.includes('visita') || tipoLower.includes('técnica') || tipoLower.includes('tecnica')) {
    return 'technicalVisit';
  }
  if (tipoLower.includes('material') || tipoLower.includes('retirada')) {
    return 'materialPickup';
  }
  if (tipoLower.includes('manutenção') || tipoLower.includes('manutencao')) {
    return 'maintenance';
  }
  if (tipoLower.includes('almoço') || tipoLower.includes('almoco')) {
    return 'lunch';
  }
  
  return 'installation'; // Default
}

/**
 * Mapeia status da atividade do Dataverse para o enum do componente
 */
function mapActivityStatus(status: string | number | null | undefined): ActivityStatus {
  // Se não tem status ou é número, retornar default
  if (!status || typeof status !== 'string') {
    return 'scheduled';
  }
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('conclu') || statusLower === 'done' || statusLower === 'completed') {
    return 'completed';
  }
  if (statusLower.includes('andamento') || statusLower === 'in progress' || statusLower === 'inprogress') {
    return 'inProgress';
  }
  if (statusLower.includes('cancel') || statusLower === 'cancelled') {
    return 'cancelled';
  }
  
  return 'scheduled'; // Default
}

/**
 * Calcula duração em horas entre dois horários
 */
function calculateHours(startTime: string, endTime: string): number {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60;
  } catch {
    return 8; // Default 8 horas
  }
}

/**
 * Calcula horário de fim a partir do início e duração
 */
function calculateEndTime(startTime: string, hours: number): string {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMin + (hours * 60);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = Math.floor(totalMinutes % 60);
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  } catch {
    return '17:00';
  }
}

/**
 * Mapeia instaladores/colaboradores do Dataverse
 */
export function mapDataverseInstallers(_records: any[]): Installer[] {
  // TODO: Implementar quando tivermos a estrutura de instaladores no Dataverse
  // Por enquanto retorna array vazio e usaremos o mock
  return [];
}

/**
 * Extrai instaladores únicos a partir dos registros de atividade do Dataverse
 * Isso permite exibir os instaladores mesmo sem uma tabela separada de instaladores
 */
export function extractInstallersFromActivities(records: any[]): Installer[] {
  const installerMap = new Map<string, Installer>();
  
  for (const record of records) {
    const id = record._new_employee_value;
    const name = record['_new_employee_value@OData.Community.Display.V1.FormattedValue'] || 
                 record.new_nomedocolaborador ||
                 'Colaborador Desconhecido';
    
    if (id && !installerMap.has(id)) {
      installerMap.set(id, {
        id,
        name,
        color: 'gray', // Default color - será atualizado por updateInstallerColors
        weeklyCapacity: 48,
        teamId: 'team-default',
        isActive: true,
      });
    }
  }
  
  return Array.from(installerMap.values());
}

/**
 * Atualiza as cores dos instaladores buscando do Dataverse
 * @param installers - Lista de instaladores a serem atualizados
 * @param weekStart - Data de início da semana
 * @returns Lista de instaladores com cores atualizadas
 */
export async function updateInstallerColors(installers: Installer[], weekStart: Date): Promise<Installer[]> {
  console.log('[updateInstallerColors] Atualizando cores para', installers.length, 'instaladores');
  
  const updatedInstallers = await Promise.all(
    installers.map(async (installer) => {
      const color = await getInstallerColorForWeek(installer.id, weekStart);
      return {
        ...installer,
        color: color || installer.color, // Manter cor atual se não encontrar
      };
    })
  );
  
  console.log('[updateInstallerColors] Cores atualizadas');
  return updatedInstallers;
}

/**
 * Extrai projetos únicos a partir dos registros de atividade do Dataverse (raw records)
 */
export function extractProjectsFromActivities(records: any[]): Project[] {
  const projectMap = new Map<string, Project>();
  
  for (const record of records) {
    const id = record._new_projeto_value;
    const name = record['_new_projeto_value@OData.Community.Display.V1.FormattedValue'] || 
                 'Projeto Desconhecido';
    
    if (id && !projectMap.has(id)) {
      projectMap.set(id, {
        id,
        name,
        client: name.split(' - ')[0] || name,
        address: '',
        status: 'active',
      });
    }
  }
  
  return Array.from(projectMap.values());
}

/**
 * Extrai projetos únicos a partir de atividades já mapeadas (tipo Activity)
 * Isso garante que só projetos com atividades válidas apareçam
 */
export function extractProjectsFromMappedActivities(activities: Activity[]): Project[] {
  const projectMap = new Map<string, Project>();
  
  for (const activity of activities) {
    const id = activity.projectId;
    const name = activity.projectName || 'Projeto Desconhecido';
    
    if (id && !projectMap.has(id)) {
      projectMap.set(id, {
        id,
        name,
        client: name.split(' - ')[0] || name,
        address: '',
        status: 'active',
      });
    }
  }
  
  return Array.from(projectMap.values());
}

/**
 * Mapeia projetos do Dataverse
 */
export function mapDataverseProjects(_records: any[]): Project[] {
  // TODO: Implementar quando tivermos a estrutura de projetos no Dataverse
  // Por enquanto retorna array vazio e usaremos o mock
  return [];
}

/**
 * Busca a cor do colaborador para a data especificada
 * Implementa a mesma lógica do Power Apps:
 * First(SortByColumns(Filter(..., C.'Local Date' >= CurrentSelectedDate, ...), "new_localdate", Ascending)).Valor
 * 
 * @param userId - ID do usuário (systemuser)
 * @param currentDate - Data de referência (normalmente o início da semana)
 * @returns Cor do colaborador como string ou null se não encontrado
 */
export async function getInstallerColorForWeek(userId: string, currentDate: Date): Promise<InstallerColor | null> {
  try {
    // Formatar data para filtro OData (ISO format)
    const formattedDate = currentDate.toISOString();
    
    console.log('[getInstallerColorForWeek] Buscando cor para usuário:', userId, 'data:', formattedDate);
    
    // Buscar a cor mais recente com data <= currentDate
    // Filter: new_localdate <= currentDate AND _new_usuario_value = userId
    // OrderBy: new_localdate descending (pegar o mais recente)
    const filter = `new_localdate le ${formattedDate} and _new_usuario_value eq '${userId}'`;
    console.log('[getInstallerColorForWeek] Filtro OData:', filter);
    
    const result = await CorcolaboradorlinhadotempoService.getAll({
      filter,
      orderBy: ['new_localdate desc'],
      top: 1,
    });
    
    console.log('[getInstallerColorForWeek] Resultado:', result);
    
    if (result.success && result.data && result.data.length > 0) {
      const colorRecord = result.data[0];
      const colorValue = colorRecord.new_valor || colorRecord.Valor;
      console.log('[getInstallerColorForWeek] Cor encontrada:', colorValue, 'data:', colorRecord.new_localdate);
      return mapStringToInstallerColor(colorValue);
    }
    
    console.log('[getInstallerColorForWeek] Nenhuma cor encontrada para o usuário, usando default');
    return null;
  } catch (error) {
    console.error('[getInstallerColorForWeek] Erro ao buscar cor:', error);
    return null;
  }
}

/**
 * Mapeia string de cor para o tipo InstallerColor
 */
function mapStringToInstallerColor(colorString: string | null | undefined): InstallerColor {
  if (!colorString) return 'gray';
  
  const colorLower = colorString.toLowerCase().trim();
  
  // Mapear cores conhecidas
  const colorMap: Record<string, InstallerColor> = {
    'azul claro': 'lightBlue',
    'light blue': 'lightBlue',
    'lightblue': 'lightBlue',
    'azul': 'blue',
    'blue': 'blue',
    'verde': 'green',
    'green': 'green',
    'vermelho': 'red',
    'red': 'red',
    'amarelo': 'yellow',
    'yellow': 'yellow',
    'roxo': 'purple',
    'purple': 'purple',
    'laranja': 'orange',
    'orange': 'orange',
    'rosa': 'pink',
    'pink': 'pink',
    'cinza': 'gray',
    'gray': 'gray',
    'grey': 'gray',
  };
  
  return colorMap[colorLower] || 'gray';
}

/**
 * Calcula a data do domingo da semana para uma data fornecida
 * Equivalente ao Power Apps: DateAdd(SelectedDate.Value, -(Weekday(SelectedDate.Value) - 1))
 * @param date - Data de referência
 * @returns Data do domingo da semana
 */
export function getSundayOfWeek(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, etc.
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

/**
 * Atualiza ou cria um registro de cor para o colaborador na semana especificada
 * Implementa a mesma lógica do Power Apps Patch/Coalesce
 * 
 * @param userId - ID do usuário (systemuser GUID)
 * @param weekStart - Data de referência (será convertida para domingo da semana)
 * @param color - Nova cor a ser atribuída
 * @returns Resultado da operação
 */
export async function updateInstallerColor(
  userId: string,
  weekStart: Date,
  color: InstallerColor
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calcular a data do domingo da semana
    const sundayDate = getSundayOfWeek(weekStart);
    const formattedDate = sundayDate.toISOString();
    
    console.log('[updateInstallerColor] Atualizando cor para usuário:', userId, 'data:', formattedDate, 'cor:', color);
    
    // Buscar registro existente para este usuário e data exata
    const filter = `new_localdate eq ${formattedDate} and _new_usuario_value eq '${userId}'`;
    console.log('[updateInstallerColor] Buscando registro existente com filtro:', filter);
    
    const existingResult = await CorcolaboradorlinhadotempoService.getAll({
      filter,
      top: 1,
    });
    
    console.log('[updateInstallerColor] Resultado da busca:', existingResult);
    
    if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
      // Atualizar registro existente
      const existingRecord = existingResult.data[0];
      const recordId = existingRecord.new_corcolaboradorlinhadotempoid;
      
      console.log('[updateInstallerColor] Atualizando registro existente:', recordId);
      
      const updateResult = await CorcolaboradorlinhadotempoService.update(recordId, {
        new_valor: color,
      });
      
      console.log('[updateInstallerColor] Resultado da atualização:', updateResult);
      
      if (updateResult.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Falha ao atualizar registro' };
      }
    } else {
      // Criar novo registro
      console.log('[updateInstaladorColor] Criando novo registro');
      
      const createResult = await CorcolaboradorlinhadotempoService.create({
        new_localdate: formattedDate,
        'new_Usuario@odata.bind': `/systemusers(${userId})`, // Lookup usando navigation property
        new_valor: color,
      });
      
      console.log('[updateInstaladorColor] Resultado da criação:', createResult);
      
      if (createResult.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Falha ao criar registro' };
      }
    }
  } catch (error) {
    console.error('[updateInstallerColor] Erro ao atualizar cor:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Atualiza uma atividade no Dataverse
 * @param activityId ID da atividade
 * @param updates Campos a atualizar
 */
export async function updateActivity(
  activityId: string,
  updates: {
    agendamento?: Date;
    descricao?: string;
    duracao?: number; // em minutos
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateActivity] Atualizando atividade:', activityId, updates);

    const changedFields: any = {};

    // Agendamento (data/hora)
    if (updates.agendamento) {
      const originalDate = updates.agendamento;
      const isoString = originalDate.toISOString();
      changedFields.new_agendamento = isoString;
      
      console.log('[updateActivity] ===== AGENDAMENTO DEBUG =====');
      console.log('[updateActivity] Data original:', originalDate);
      console.log('[updateActivity] ISO String:', isoString);
      console.log('[updateActivity] Timestamp:', originalDate.getTime());
      console.log('[updateActivity] UTC String:', originalDate.toUTCString());
      console.log('[updateActivity] Local String:', originalDate.toLocaleString());
    }

    // Descrição
    if (updates.descricao !== undefined) {
      changedFields.new_description = updates.descricao;
      console.log('[updateActivity] Descrição:', changedFields.new_description);
    }

    // Duração (já em minutos)
    if (updates.duracao !== undefined) {
      changedFields.new_duracao = updates.duracao;
      console.log('[updateActivity] Duração (minutos):', changedFields.new_duracao);
    }

    console.log('[updateActivity] changedFields completo:', JSON.stringify(changedFields, null, 2));

    // Buscar dados ANTES da atualização para comparar
    const { AtividadefieldcontrolService } = await import('../../generated/services/AtividadefieldcontrolService');
    const beforeUpdate = await AtividadefieldcontrolService.getAll({
      filter: `new_atividadefieldcontrolid eq '${activityId}'`
    });
    
    if (beforeUpdate.success && beforeUpdate.data && beforeUpdate.data.length > 0) {
      console.log('[updateActivity] ===== ANTES DA ATUALIZAÇÃO =====');
      console.log('[updateActivity] new_agendamento ANTES:', beforeUpdate.data[0].new_agendamento);
      console.log('[updateActivity] new_description ANTES:', beforeUpdate.data[0].new_description);
      console.log('[updateActivity] new_duracao ANTES:', beforeUpdate.data[0].new_duracao);
    }

    const result = await AtividadefieldcontrolService.update(activityId, changedFields);

    console.log('[updateActivity] Resultado completo:', JSON.stringify(result, null, 2));

    // Verificar se os dados retornados refletem a mudança
    if (result.success && result.data) {
      console.log('[updateActivity] ===== APÓS A ATUALIZAÇÃO (RESPONSE) =====');
      console.log('[updateActivity] new_agendamento DEPOIS:', result.data.new_agendamento);
      console.log('[updateActivity] new_description DEPOIS:', result.data.new_description);
      console.log('[updateActivity] new_duracao DEPOIS:', result.data.new_duracao);
      
      // Comparar para ver se realmente mudou
      if (beforeUpdate.success && beforeUpdate.data && beforeUpdate.data.length > 0) {
        console.log('[updateActivity] ===== COMPARAÇÃO =====');
        console.log('[updateActivity] Agendamento mudou?', 
          beforeUpdate.data[0].new_agendamento !== result.data.new_agendamento);
        console.log('[updateActivity] Descrição mudou?', 
          beforeUpdate.data[0].new_description !== result.data.new_description);
        console.log('[updateActivity] Duração mudou?', 
          beforeUpdate.data[0].new_duracao !== result.data.new_duracao);
      }
    }

    if (result.success) {
      return { success: true };
    } else {
      const errorMsg = result.error instanceof Error ? result.error.message : String(result.error || 'Falha ao atualizar atividade');
      console.error('[updateActivity] Erro:', errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('[updateActivity] Erro ao atualizar atividade:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cria uma cópia de uma atividade já existente, preservando as propriedades
 * e alterando apenas colaborador (lookup) e agendamento.
 */
export async function copyActivity(
  sourceActivityId: string,
  targetEmployeeId: string,
  targetAgendamento: Date
): Promise<{ success: boolean; id?: string; error?: string }> {
  const safeStringify = (value: unknown) => {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const errorToMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') return safeStringify(err);
    return String(err);
  };

  try {
    console.log('[copyActivity] Copiando atividade:', {
      sourceActivityId,
      targetEmployeeId,
      targetAgendamento: targetAgendamento.toISOString(),
    });

    const { AtividadefieldcontrolService } = await import('../../generated/services/AtividadefieldcontrolService');

    const sourceResult = await AtividadefieldcontrolService.get(sourceActivityId);
    if (!sourceResult.success || !sourceResult.data) {
      const errorMsg = sourceResult.error instanceof Error
        ? sourceResult.error.message
        : String(sourceResult.error || 'Falha ao buscar atividade origem');
      return { success: false, error: errorMsg };
    }

    const source: any = sourceResult.data;

    // DEBUG: logar todas as chaves do registro para identificar navigation properties
    const allKeys = Object.keys(source);
    const navKeys = allKeys.filter(k => k.includes('@Microsoft.Dynamics.CRM.associatednavigationproperty'));
    console.log('[copyActivity] Navigation keys no source:', navKeys);
    navKeys.forEach(k => {
      console.log(`  ${k} = ${source[k]}`);
    });

    // Para evitar falhas no create por campos read-only/sistema,
    // montamos um payload mínimo e seguro baseado em uma lista permitida.
    // IMPORTANTE: para lookups, Dataverse exige Navigation Properties (@odata.bind).
    const payload: any = {};

    const pickIfPresent = (key: string) => {
      if (source[key] !== undefined && source[key] !== null) {
        payload[key] = source[key];
      }
    };

    const sourceOrdemDeServicoId: string | undefined = source._new_ordemdeservico_value;
    const sourceProjetoId: string | undefined = source._new_projeto_value;

    // Metadados úteis (somente se existirem no schema)
    pickIfPresent('new_identificadorordemdeservico');
    pickIfPresent('new_cliente');
    pickIfPresent('new_description');
    pickIfPresent('new_duracao');
    pickIfPresent('new_tipodeservico');
    pickIfPresent('new_tipodeservicotexto');

    // Manter status como scheduled, quando aplicável
    if (typeof source.new_status === 'string' && source.new_status) {
      payload.new_status = source.new_status;
    }

    // Aplicar alterações exigidas pela cópia
    payload.new_agendamento = targetAgendamento.toISOString();

    // Lookups via navigation properties (apenas OS e Projeto têm nav property)
    const navOrdemDeServico =
      source['_new_ordemdeservico_value@Microsoft.Dynamics.CRM.associatednavigationproperty'] ||
      'new_OrdemdeServico';
    const navProjeto =
      source['_new_projeto_value@Microsoft.Dynamics.CRM.associatednavigationproperty'] ||
      'new_Projeto';

    if (!sourceOrdemDeServicoId) {
      return { success: false, error: 'Atividade origem sem Ordem de Serviço (lookup) para copiar' };
    }
    payload[`${navOrdemDeServico}@odata.bind`] = `/new_ordemdeservicofieldcontrols(${sourceOrdemDeServicoId})`;

    if (sourceProjetoId) {
      payload[`${navProjeto}@odata.bind`] = `/cr22f_projetos(${sourceProjetoId})`;
    }

    // Employee: incluir no create usando navigation property (schema name confirmado via PAC modelbuilder)
    // O schema name é 'new_employee' (minúsculo, diferente de new_OrdemdeServico e new_Projeto que são CamelCase)
    payload['new_employee@odata.bind'] = `/systemusers(${targetEmployeeId})`;
    
    // DEBUG: logar todos os campos lookup para análise
    console.log('[copyActivity] DEBUG - source._new_employee_value:', source._new_employee_value);
    console.log('[copyActivity] DEBUG - targetEmployeeId:', targetEmployeeId);
    console.log('[copyActivity] DEBUG - Payload completo:', JSON.stringify(payload, null, 2));

    // Se o schema tiver campos de hora, manter coerência com o novo agendamento
    const hh = String(targetAgendamento.getHours()).padStart(2, '0');
    const mm = String(targetAgendamento.getMinutes()).padStart(2, '0');
    if (Object.prototype.hasOwnProperty.call(source, 'new_horainicio')) {
      payload.new_horainicio = `${hh}:${mm}`;
    }

    console.log('[copyActivity] Navigation properties:', { navOrdemDeServico, navProjeto });
    console.log('[copyActivity] Payload (keys):', Object.keys(payload).sort());

    const createResult = await AtividadefieldcontrolService.create(payload);
    if (!createResult.success) {
      console.error('[copyActivity] Falha no createResult:', createResult);
      const errorMsg = createResult.error
        ? errorToMessage(createResult.error)
        : 'Falha ao criar cópia da atividade';
      return { success: false, error: errorMsg };
    }

    const created: any = createResult.data;
    const createdId = created?.new_atividadefieldcontrolid || created?.activityid;
    console.log('[copyActivity] Cópia criada com sucesso (ID):', createdId);

    return { success: true, id: createdId };
  } catch (error) {
    console.error('[copyActivity] Erro durante cópia:', error);
    return { success: false, error: errorToMessage(error) };
  }
}

/**
 * Busca Ordens de Serviço disponíveis para seleção ao criar nova atividade
 * Filtra: statecode = 0 (Active)
 * Usa apenas operações delegáveis (startswith) para busca
 * @param searchTerm Termo de busca opcional (filtra por identificador, cliente ou projeto)
 */
export async function searchOrdemDeServico(
  searchTerm?: string
): Promise<{ success: boolean; data?: AvailableOrdemDeServico[]; error?: string }> {
  try {
    const termNormalized = searchTerm?.trim() || '';
    console.log('[searchOrdemDeServico] Buscando OS disponíveis, termo:', termNormalized || '(sem termo)');

    const mapOSResult = (data: any[]): AvailableOrdemDeServico[] => {
      return data.map((os: any) => ({
        id: os.new_ordemdeservicofieldcontrolid,
        identificador: os.new_name || 'OS sem identificador',
        clienteNome: os.new_clientenome || '',
        projetoId: os._new_projeto_value,
        projetoNome: os.new_projetoapelido || os['_new_projeto_value@OData.Community.Display.V1.FormattedValue'] || '',
      }));
    };

    // Se não há termo de busca ou termo muito curto, retornar últimas 50 OS ativas
    if (termNormalized.length < 2) {
      console.log('[searchOrdemDeServico] Buscando sem filtro de texto (termo < 2 chars)');
      const result = await OrdemdeservicofieldcontrolService.getAll({
        filter: 'statecode eq 0',
        top: 50,
      });

      if (!result.success || !result.data) {
        console.error('[searchOrdemDeServico] Erro ao buscar OS:', result.error);
        return { success: false, error: 'Falha ao buscar Ordens de Serviço' };
      }

      console.log('[searchOrdemDeServico] OS encontradas:', result.data.length);
      return { success: true, data: mapOSResult(result.data) };
    }

    // Com termo de busca: 3 consultas delegáveis com startswith
    const termEscaped = termNormalized.replace(/'/g, "''"); // Escape aspas simples
    console.log('[searchOrdemDeServico] Buscando com startswith (delegável), termo:', termEscaped);

    const [resultIdentificador, resultCliente, resultProjeto] = await Promise.all([
      // Busca por identificador (delegável - startswith)
      OrdemdeservicofieldcontrolService.getAll({
        filter: `statecode eq 0 and startswith(new_name, '${termEscaped}')`,
        top: 30,
      }),
      // Busca por nome do cliente (delegável - startswith)
      OrdemdeservicofieldcontrolService.getAll({
        filter: `statecode eq 0 and startswith(new_clientenome, '${termEscaped}')`,
        top: 30,
      }),
      // Busca por apelido do projeto (delegável - startswith)
      OrdemdeservicofieldcontrolService.getAll({
        filter: `statecode eq 0 and startswith(new_projetoapelido, '${termEscaped}')`,
        top: 30,
      }),
    ]);

    // Combinar resultados únicos
    const osMap = new Map<string, AvailableOrdemDeServico>();

    // Adicionar resultados de identificador
    if (resultIdentificador.success && resultIdentificador.data) {
      console.log('[searchOrdemDeServico] Encontrados por identificador:', resultIdentificador.data.length);
      mapOSResult(resultIdentificador.data).forEach(os => osMap.set(os.id, os));
    }

    // Adicionar resultados de cliente
    if (resultCliente.success && resultCliente.data) {
      console.log('[searchOrdemDeServico] Encontrados por cliente:', resultCliente.data.length);
      mapOSResult(resultCliente.data).forEach(os => osMap.set(os.id, os));
    }

    // Adicionar resultados de projeto
    if (resultProjeto.success && resultProjeto.data) {
      console.log('[searchOrdemDeServico] Encontrados por projeto:', resultProjeto.data.length);
      mapOSResult(resultProjeto.data).forEach(os => osMap.set(os.id, os));
    }

    const ordens = Array.from(osMap.values());
    console.log('[searchOrdemDeServico] Total único encontrado:', ordens.length);

    // Ordenar por identificador (desc) e limitar a 50
    ordens.sort((a, b) => (b.identificador || '').localeCompare(a.identificador || ''));
    
    return { success: true, data: ordens.slice(0, 50) };
  } catch (error) {
    console.error('[searchOrdemDeServico] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cria uma nova atividade no Dataverse
 * @param params Parâmetros para criação
 * - ordemDeServicoId: ID da Ordem de Serviço (obrigatório)
 * - employeeId: ID do colaborador (obrigatório)
 * - agendamento: Data e hora do agendamento (obrigatório, deve ser futuro)
 * - duracao: Duração em minutos (opcional, default 240)
 * - descricao: Descrição da atividade (opcional)
 * - projetoId: ID do projeto (opcional, se a OS já tiver projeto vinculado)
 */
export async function createActivity(params: {
  ordemDeServicoId: string;
  employeeId: string;
  agendamento: Date;
  duracao?: number;
  descricao?: string;
  projetoId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const safeStringify = (value: unknown) => {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const errorToMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') return safeStringify(err);
    return String(err);
  };

  try {
    // Validar que agendamento é no futuro
    const now = new Date();
    if (params.agendamento <= now) {
      return { success: false, error: 'O agendamento deve ser para uma data/hora futura' };
    }

    console.log('[createActivity] Criando nova atividade:', {
      ordemDeServicoId: params.ordemDeServicoId,
      employeeId: params.employeeId,
      agendamento: params.agendamento.toISOString(),
      duracao: params.duracao,
    });

    const { AtividadefieldcontrolService } = await import('../../generated/services/AtividadefieldcontrolService');

    // Montar payload
    const payload: any = {
      new_agendamento: params.agendamento.toISOString(),
      new_duracao: params.duracao || 240, // Default 4 horas
      new_status: 'scheduled', // Novo = agendado
    };

    // Descrição (opcional)
    if (params.descricao) {
      payload.new_description = params.descricao;
    }

    // Lookups via navigation properties (conforme DATAVERSE_METADATA.md)
    // new_employee é minúsculo!
    payload['new_employee@odata.bind'] = `/systemusers(${params.employeeId})`;
    
    // new_OrdemdeServico é CamelCase
    payload['new_OrdemdeServico@odata.bind'] = `/new_ordemdeservicofieldcontrols(${params.ordemDeServicoId})`;

    // Projeto (opcional) - new_Projeto é CamelCase
    if (params.projetoId) {
      payload['new_Projeto@odata.bind'] = `/cr22f_projetos(${params.projetoId})`;
    }

    console.log('[createActivity] Payload:', JSON.stringify(payload, null, 2));

    const createResult = await AtividadefieldcontrolService.create(payload);
    
    if (!createResult.success) {
      console.error('[createActivity] Falha no create:', createResult);
      const errorMsg = createResult.error
        ? errorToMessage(createResult.error)
        : 'Falha ao criar atividade';
      return { success: false, error: errorMsg };
    }

    const created: any = createResult.data;
    const createdId = created?.new_atividadefieldcontrolid || created?.activityid;
    console.log('[createActivity] Atividade criada com sucesso (ID):', createdId);

    return { success: true, id: createdId };
  } catch (error) {
    console.error('[createActivity] Erro durante criação:', error);
    return { success: false, error: errorToMessage(error) };
  }
}

/**
 * Busca projetos disponíveis para seleção
 * Retorna projetos ativos com suas informações básicas
 */
export async function getAvailableProjects(search?: string): Promise<{ success: boolean; data?: Project[]; error?: string }> {
  try {
    console.log('[getAvailableProjects] Buscando projetos disponíveis...', { search });
    
    // Monta filtro básico (apenas projetos ativos)
    let filtro = "statecode eq 0";
    if (search && search.trim().length > 0) {
      // Usar contains para pesquisa por apelido (campo configurado como `cr22f_apelido`)
      const escaped = search.replace(/'/g, "''");
      filtro += ` and contains(cr22f_apelido, '${escaped}')`;
    }

    const result = await ProjetosService.getAll({
      select: ['cr22f_projetoid', 'cr22f_apelido'],
      filter: filtro,
      orderBy: ['cr22f_apelido asc'],
    });
    
    if (!result.success || !result.data) {
      console.error('[getAvailableProjects] Erro ao buscar projetos:', result.error);
      return { success: false, error: 'Falha ao buscar projetos' };
    }
    
    console.log('[getAvailableProjects] Projetos encontrados:', result.data.length);
    
    const projects: Project[] = result.data.map((projeto: any) => ({
      id: projeto.cr22f_projetoid,
      name: projeto.cr22f_apelido || projeto.cr22f_name || 'Projeto sem nome',
      client: '',
      address: '',
      status: 'active' as const,
    }));
    
    return { success: true, data: projects };
  } catch (error) {
    console.error('[getAvailableProjects] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Busca ordens de serviço vinculadas a um projeto específico
 * Retorna apenas OS ativas e delegáveis
 */
export async function getOrdensByProjeto(projetoId: string): Promise<{ success: boolean; data?: AvailableOrdemDeServico[]; error?: string }> {
  try {
    console.log('[getOrdensByProjeto] Buscando OS do projeto:', projetoId);
    
    const result = await OrdemdeservicofieldcontrolService.getAll({
      select: ['new_ordemdeservicofieldcontrolid', 'new_name', '_new_cliente_value', '_new_projeto_value', 'new_tipodeservico'],
      filter: `_new_projeto_value eq '${projetoId}' and statecode eq 0`,
      orderBy: ['new_name asc'],
    });
    
    if (!result.success || !result.data) {
      console.error('[getOrdensByProjeto] Erro ao buscar OS:', result.error);
      return { success: false, error: 'Falha ao buscar ordens de serviço' };
    }
    
    console.log('[getOrdensByProjeto] OS encontradas:', result.data.length);
    
    const ordens: AvailableOrdemDeServico[] = result.data.map((os: any) => ({
      id: os.new_ordemdeservicofieldcontrolid,
      identificador: os.new_name || os.new_id || 'OS sem identificador',
      clienteNome: os['_new_cliente_value@OData.Community.Display.V1.FormattedValue'],
      projetoId: os._new_projeto_value,
      projetoNome: os['_new_projeto_value@OData.Community.Display.V1.FormattedValue'],
      tipoOrdemServico: os.new_tipodeordemservico || os.new_tipodeordemservico || os.new_tipodeordemServico || os.new_tipodeordemservico,
      produtos: [],
    }));
    
    // Buscar produtos para cada ordem em paralelo
    await Promise.all(ordens.map(async (o) => {
      try {
        const produtos = await getProdutosByOrdem(o.id);
        o.produtos = produtos;
      } catch (err) {
        console.error('[getOrdensByProjeto] Erro ao buscar produtos para OS', o.id, err);
        o.produtos = [];
      }
    }));

    return { success: true, data: ordens };
  } catch (error) {
    console.error('[getOrdensByProjeto] Erro:', error);
    return { success: false, error: String(error) };
  }
}
