/**
 * USO DO INSTALADOR (SEMANA)
 * 
 * Tela de gerenciamento da programação semanal da equipe de instalações
 * Inspirada no layout "Resource Usage" do Microsoft Project
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type {
  UsoInstaladorProps,
  Installer,
  Activity,
  InstallerGridData,
  ProjectRow,
  DailyHours,
  WeekDay,
  DetailPanelState,
} from './types';
import {
  InstallerColorMap,
  ActivityTypeIcons,
  WEEKDAY_LABELS,
  WEEKDAY_FULL_LABELS,
} from './types';
import { formatDateKey, getMondayOfWeek } from './mockData';
import { projectColors, generateProjectColorMap } from '../../utils/colors';
import { APP_VERSION } from '../../version';
import { AtividadefieldcontrolService } from '../../generated/services/AtividadefieldcontrolService';
import { 
  mapDataverseActivity, 
  extractInstallersFromActivities, 
  extractProjectsFromMappedActivities, 
  updateInstallerColors, 
  updateInstallerColor, 
  getAvailableUsers,
  getFixedUsers,
  toggleFixedUser,
  updateActivity,
  copyActivity,
  createActivity,
  getAvailableProjects,
  getOrdensByProjeto,
  getProdutosByOrdem,
  type AvailableUser,
  type AvailableOrdemDeServico,
} from './dataverseMapper';
import type { InstallerColor, Project } from './types';
import './UsoInstalador.css';
import ProdutosDataGrid from './ProdutosDataGrid';
// Note: Produto table replaced by ProdutosDataGrid (Fluent-style with sorting)

// Constantes para os modais
const MODAL_STEPS = {
  PROJECT_SELECTION: 'project',
  ORDER_SELECTION: 'order',
  EMPLOYEE_SELECTION: 'employee',
  ACTIVITY_DETAILS: 'details'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Formata data para exibição DD/MM
 */
function formatDateShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formata data completa para exibição DD/MM/YYYY
 */
function formatDateFull(date: Date): string {
  return `${formatDateShort(date)}/${date.getFullYear()}`;
}

/**
 * Verifica se duas datas são o mesmo dia
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gera configuração da semana para exibição
 */
function generateWeekDays(monday: Date, includeSunday: boolean = false): WeekDay[] {
  const today = new Date();
  const days: WeekDay[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dayOfWeek = date.getDay();
    
    days.push({
      date,
      dayOfWeek,
      label: WEEKDAY_LABELS[dayOfWeek],
      fullLabel: WEEKDAY_FULL_LABELS[dayOfWeek],
      formattedDate: formatDateShort(date),
      isToday: isSameDay(date, today),
    });
  }
  
  if (includeSunday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() - 1);
    const dayOfWeek = 0; // Domingo
    days.unshift({
      date: sunday,
      dayOfWeek,
      label: WEEKDAY_LABELS[dayOfWeek],
      fullLabel: WEEKDAY_FULL_LABELS[dayOfWeek],
      formattedDate: formatDateShort(sunday),
      isToday: isSameDay(sunday, today),
    });
  }
  
  return days;
}

/**
 * Processa atividades e agrupa por instalador para a grid
 */
function processInstallerData(
  installers: Installer[],
  activities: Activity[],
  weekDays: WeekDay[],
  maxProjectsPerInstaller: number,
  expandedState: Record<string, boolean>
): InstallerGridData[] {
  // Criar set de datas válidas da semana para filtro rápido
  const weekDateKeys = new Set(weekDays.map(d => formatDateKey(d.date)));
  
  return installers.map(installer => {
    // Filtrar atividades do instalador que estão dentro da semana
    const installerActivities = activities.filter(a => {
      const activityDateKey = formatDateKey(a.date);
      const isInstallerMatch = a.installerId === installer.id;
      const isInWeek = weekDateKeys.has(activityDateKey);
      return isInstallerMatch && isInWeek;
    });
    
    // Agrupar por projeto
    const projectsMap = new Map<string, ProjectRow>();
    
    installerActivities.forEach(activity => {
      // Cada atividade (incluindo deslocamento/reserva) aparece com seu nome de projeto específico
      const key = activity.projectId;
      if (!projectsMap.has(key)) {
        projectsMap.set(key, {
          projectId: activity.projectId,
          projectName: activity.projectName,
          type: activity.type,
          hoursByDay: new Map(),
          activities: [],
        });
      }
      
      const project = projectsMap.get(key)!;
      project.activities.push(activity);
      
      const dateKey = formatDateKey(activity.date);
      const currentHours = project.hoursByDay.get(dateKey) || 0;
      project.hoursByDay.set(dateKey, currentHours + activity.hours);
    });
    
    // Ordenar projetos por total de horas (decrescente)
    const allProjects = Array.from(projectsMap.values())
      .sort((a, b) => {
        const totalA = Array.from(a.hoursByDay.values()).reduce((sum, h) => sum + h, 0);
        const totalB = Array.from(b.hoursByDay.values()).reduce((sum, h) => sum + h, 0);
        return totalB - totalA;
      });
    
    // Limitar projetos visíveis e criar "Outros" se necessário
    const expanded = expandedState[installer.id] ?? true;
    const visibleProjects = expanded ? allProjects : allProjects.slice(0, maxProjectsPerInstaller);
    const hiddenProjects = expanded ? [] : allProjects.slice(maxProjectsPerInstaller);
    
    let othersRow = undefined;
    if (hiddenProjects.length > 0) {
      const othersHoursByDay = new Map<string, number>();
      const othersActivities: Activity[] = [];
      
      hiddenProjects.forEach(project => {
        project.activities.forEach(a => othersActivities.push(a));
        project.hoursByDay.forEach((hours, dateKey) => {
          const current = othersHoursByDay.get(dateKey) || 0;
          othersHoursByDay.set(dateKey, current + hours);
        });
      });
      
      othersRow = {
        projectCount: hiddenProjects.length,
        hoursByDay: othersHoursByDay,
        activities: othersActivities,
      };
    }
    
    // Não há mais linha agregada de deslocamento - cada atividade aparece individualmente
    const travelRow = undefined;
    
    // Calcular totais por dia (linha PAI)
    const dailyHours: DailyHours[] = weekDays.map(day => {
      const dateKey = formatDateKey(day.date);
      const dayActivities = installerActivities.filter(a => 
        formatDateKey(a.date) === dateKey
      );
      
      const totalHours = dayActivities.reduce((sum, a) => sum + a.hours, 0);
      const fullDayCount = dayActivities.filter(a => a.isFullDay).length;
      
      return {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        totalHours,
        hasOverload: totalHours > 8,
        hasCriticalOverload: totalHours > 12,
        hasConflict: fullDayCount > 1,
        activities: dayActivities,
      };
    });
    
    // Calcular total alocado e porcentagem de capacidade
    const totalAllocatedHours = dailyHours.reduce((sum, d) => sum + d.totalHours, 0);
    const capacityPercentage = Math.round((totalAllocatedHours / installer.weeklyCapacity) * 100);
    
    return {
      installer,
      isExpanded: expandedState[installer.id] ?? true,
      totalAllocatedHours,
      dailyHours,
      projectRows: visibleProjects,
      othersRow,
      travelRow,
      hasAnyActivity: installerActivities.length > 0,
      capacityPercentage,
    };
  });
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TooltipProps {
  activity?: Activity;
  position: { x: number; y: number };
}

function Tooltip({ activity, position }: TooltipProps) {
  if (!activity) return null;
  
  return (
    <div 
      className="uso-instalador__tooltip"
      style={{ 
        left: position.x + 10, 
        top: position.y + 10,
      }}
    >
      <div className="uso-instalador__tooltip-title">
        {ActivityTypeIcons[activity.type]} {activity.projectName}
      </div>
      <div className="uso-instalador__tooltip-info">
        <span>🕐 {activity.startTime} - {activity.endTime} ({activity.hours}h)</span>
        {activity.address && <span>📍 {activity.address}</span>}
        <span>📊 Status: {activity.status === 'completed' ? 'Concluído' : 
                         activity.status === 'inProgress' ? 'Em andamento' : 
                         activity.status === 'cancelled' ? 'Cancelado' : 'Agendado'}</span>
      </div>
    </div>
  );
}

interface DetailPanelProps {
  state: DetailPanelState;
  onClose: () => void;
  onSave?: (activityId: string, updates: { agendamento?: Date; descricao?: string; duracao?: number }) => Promise<void>;
  onCopy?: (params: { sourceActivityId: string; targetEmployeeId: string; targetAgendamento: Date }) => Promise<void>;
}

function DetailPanel({ state, onClose, onSave, onCopy }: DetailPanelProps) {
  const shouldRender = state.isOpen && !!state.activity;

  // IMPORTANTE: hooks devem ser chamados sempre, então usamos um fallback.
  const activity: Activity = (state.activity ?? {
    id: '',
    projectId: '',
    projectName: '',
    installerId: '',
    installerName: '',
    date: new Date(),
    startTime: '08:00',
    endTime: '08:00',
    hours: 0,
    type: 'installation',
    status: 'scheduled',
    raw_status: 'scheduled',
  }) as Activity;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Estado de edição
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Estado de cópia
  const [isCopying, setIsCopying] = useState(false);
  const [isCreatingCopy, setIsCreatingCopy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyUsers, setCopyUsers] = useState<AvailableUser[]>([]);
  const [isLoadingCopyUsers, setIsLoadingCopyUsers] = useState(false);
  const [copyTargetEmployeeId, setCopyTargetEmployeeId] = useState<string>('');
  const [copyTargetDate, setCopyTargetDate] = useState<Date>(() => new Date(activity.date));
  
  // Valores editáveis
  const [editAgendamento, setEditAgendamento] = useState(activity.date);
  const [editStartTime, setEditStartTime] = useState(activity.startTime);
  const [editDescricao, setEditDescricao] = useState(activity.descricao || '');
  const [editHours, setEditHours] = useState(activity.hours);

  // Resetar estados quando a atividade mudar
  useEffect(() => {
    setIsEditing(false);
    setIsSaving(false);
    setEditError(null);
    setEditAgendamento(activity.date);
    setEditStartTime(activity.startTime);
    setEditDescricao(activity.descricao || '');
    setEditHours(activity.hours);

    setIsCopying(false);
    setIsCreatingCopy(false);
    setCopyError(null);
    setCopyTargetEmployeeId('');
    setCopyTargetDate(new Date(activity.date));
  }, [activity.id]);
  
  // Função auxiliar para formatar data e hora
  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return '—';
    return `${formatDateFull(date)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Validações de edição
  const canEditSchedule = (): boolean => {
    // Só pode editar se status for 'scheduled' e agendamento for no futuro
    const now = new Date();
    const scheduledDateTime = new Date(activity.date);
    const [hours, minutes] = activity.startTime.split(':').map(Number);
    scheduledDateTime.setHours(hours, minutes, 0, 0);
    
    return activity.raw_status === 'scheduled' && scheduledDateTime > now;
  };
  
  const canEditDescriptionAndDuration = (): boolean => {
    // Só pode editar se for atividade de hoje ou futuro
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(activity.date);
    activityDate.setHours(0, 0, 0, 0);
    
    return activityDate >= today;
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditError(null);
  };

  const canCopy = (): boolean => {
    // Foco no caso solicitado: atividade já agendada (scheduled)
    return activity.raw_status === 'scheduled';
  };

  const ensureCopyUsersLoaded = async () => {
    if (copyUsers.length > 0) return;
    setIsLoadingCopyUsers(true);
    try {
      const result = await getAvailableUsers();
      if (!isMountedRef.current) return;
      if (result.success && result.data) {
        setCopyUsers(result.data);
      } else {
        setCopyError(result.error || 'Erro ao carregar colaboradores');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setCopyError(err instanceof Error ? err.message : 'Erro ao carregar colaboradores');
    } finally {
      if (!isMountedRef.current) return;
      setIsLoadingCopyUsers(false);
    }
  };

  const handleStartCopy = async () => {
    if (!onCopy) return;
    setIsCopying(true);
    setCopyError(null);
    setCopyTargetDate(new Date(activity.date));
    await ensureCopyUsersLoaded();
    // Pré-selecionar o colaborador atual após carregar a lista
    setCopyTargetEmployeeId(activity.installerId);
  };

  const handleCancelCopy = () => {
    setIsCopying(false);
    setIsCreatingCopy(false);
    setCopyError(null);
    setCopyTargetEmployeeId('');
    setCopyTargetDate(new Date(activity.date));
  };

  const handleCreateCopy = async () => {
    if (!onCopy) return;

    try {
      setIsCreatingCopy(true);
      setCopyError(null);

      if (!copyTargetEmployeeId) {
        setCopyError('Selecione o colaborador de destino');
        return;
      }

      // Criar novo agendamento combinando a data destino com o horário da atividade origem
      const [hours, minutes] = activity.startTime.split(':').map(Number);
      const newSchedule = new Date(copyTargetDate);
      newSchedule.setHours(hours, minutes, 0, 0);

      const now = new Date();
      if (newSchedule <= now) {
        setCopyError('Não é possível criar cópia para uma data/hora anterior ao momento atual');
        return;
      }

      await onCopy({
        sourceActivityId: activity.id,
        targetEmployeeId: copyTargetEmployeeId,
        targetAgendamento: newSchedule,
      });

      // Fechar o painel ao concluir
      onClose();
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : 'Erro ao criar cópia');
    } finally {
      setIsCreatingCopy(false);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditError(null);
    // Restaurar valores originais
    setEditAgendamento(activity.date);
    setEditStartTime(activity.startTime);
    setEditDescricao(activity.descricao || '');
    setEditHours(activity.hours);
  };
  
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      setEditError(null);
      
      const updates: { agendamento?: Date; descricao?: string; duracao?: number } = {};
      
      // Agendamento
      if (canEditSchedule()) {
        const [hours, minutes] = editStartTime.split(':').map(Number);
        const newSchedule = new Date(editAgendamento);
        console.log('[handleSave] editAgendamento antes de setHours:', editAgendamento.toString(), 'Date:', editAgendamento.getDate(), 'Month:', editAgendamento.getMonth() + 1);
        newSchedule.setHours(hours, minutes, 0, 0);
        console.log('[handleSave] newSchedule após setHours:', newSchedule.toString(), 'ISO:', newSchedule.toISOString());
        
        // Validar se a data/hora não é anterior ao momento atual
        const now = new Date();
        if (newSchedule <= now) {
          setEditError('Não é possível agendar para uma data/hora anterior ao momento atual');
          setIsSaving(false);
          return;
        }
        
        updates.agendamento = newSchedule;
      }
      
      // Descrição
      if (canEditDescriptionAndDuration()) {
        updates.descricao = editDescricao;
        updates.duracao = Math.round(editHours * 60); // converter horas para minutos
      }
      
      await onSave(activity.id, updates);
      setIsEditing(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Determinar se pode editar qualquer campo
  const canEdit = canEditSchedule() || canEditDescriptionAndDuration();

  if (!shouldRender) return null;
  
  return (
    <div className="uso-instalador__detail-overlay" onClick={onClose}>
      <div className="uso-instalador__detail-panel" onClick={e => e.stopPropagation()}>
        <div className="uso-instalador__detail-header">
          <h3 className="uso-instalador__detail-title">
            {ActivityTypeIcons[activity.type]} {isEditing ? 'Editar Atividade' : 'Detalhes da Atividade'}
          </h3>
          <button className="uso-instalador__detail-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        {editError && (
          <div className="uso-instalador__detail-error">
            ⚠️ {editError}
          </div>
        )}

        {copyError && (
          <div className="uso-instalador__detail-error">
            ⚠️ {copyError}
          </div>
        )}
        
        <div className="uso-instalador__detail-content">
          <div className="uso-instalador__detail-section">
            {/* Colaborador */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">👤 Colaborador</div>
              <div className={`uso-instalador__detail-value ${!activity.installerName ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.installerName || 'Não definido'}
              </div>
            </div>
            
            {/* Ordem de Serviço */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">📋 Ordem de Serviço</div>
              <div className={`uso-instalador__detail-value ${!activity.ordemDeServico ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.ordemDeServico || 'Não definido'}
              </div>
            </div>
            
            {/* Projeto */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">🏗️ Projeto</div>
              <div className={`uso-instalador__detail-value ${!activity.projectName ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.projectName || 'Não definido'}
              </div>
            </div>
            
            {/* Agendamento - editável com restrições */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">📅 Agendamento</div>
              {isEditing && canEditSchedule() ? (
                <div className="uso-instalador__detail-edit-group">
                  <input
                    type="date"
                    className="uso-instalador__detail-input"
                    value={`${editAgendamento.getFullYear()}-${String(editAgendamento.getMonth() + 1).padStart(2, '0')}-${String(editAgendamento.getDate()).padStart(2, '0')}`}
                    min={(() => {
                      const today = new Date();
                      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    })()}
                    onChange={e => {
                      // Criar data no fuso horário local (não UTC)
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const newDate = new Date(editAgendamento);
                      newDate.setFullYear(year, month - 1, day);
                      setEditAgendamento(newDate);
                      // Limpar erro ao editar
                      if (editError) setEditError(null);
                    }}
                  />
                  <input
                    type="time"
                    className="uso-instalador__detail-input"
                    value={editStartTime}
                    onChange={e => {
                      setEditStartTime(e.target.value);
                      // Limpar erro ao editar
                      if (editError) setEditError(null);
                    }}
                  />
                </div>
              ) : (
                <div className="uso-instalador__detail-value">
                  {WEEKDAY_FULL_LABELS[activity.date.getDay()]}, {formatDateFull(activity.date)}
                  <span style={{ marginLeft: '8px', color: 'var(--ui-text-secondary)' }}>
                    {activity.startTime} - {activity.endTime}
                  </span>
                  {isEditing && !canEditSchedule() && (
                    <span className="uso-instalador__detail-readonly-hint">
                      (somente agendamentos futuros podem ser alterados)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Descrição - editável com restrições */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">📝 Descrição</div>
              {isEditing && canEditDescriptionAndDuration() ? (
                <textarea
                  className="uso-instalador__detail-textarea"
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                  placeholder="Descrição da atividade"
                  rows={3}
                />
              ) : (
                <>
                  <div className={`uso-instalador__detail-value ${!activity.descricao ? 'uso-instalador__detail-value--empty' : ''}`}>
                    {activity.descricao || 'Não definido'}
                  </div>
                  {isEditing && !canEditDescriptionAndDuration() && (
                    <span className="uso-instalador__detail-readonly-hint">
                      (somente atividades de hoje ou futuras podem ser editadas)
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Duração - editável com restrições */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">⏱️ Duração</div>
              {isEditing && canEditDescriptionAndDuration() ? (
                <div className="uso-instalador__detail-edit-group">
                  <input
                    type="number"
                    className="uso-instalador__detail-input"
                    value={editHours}
                    onChange={e => setEditHours(parseFloat(e.target.value) || 0)}
                    min={0.5}
                    max={24}
                    step={0.5}
                  />
                  <span style={{ marginLeft: '8px' }}>horas</span>
                </div>
              ) : (
                <>
                  <div className="uso-instalador__detail-value">{activity.hours}h</div>
                  {isEditing && !canEditDescriptionAndDuration() && (
                    <span className="uso-instalador__detail-readonly-hint">
                      (somente atividades de hoje ou futuras podem ser editadas)
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Copiar atividade */}
            {isCopying && (
              <div className="uso-instalador__detail-field">
                <div className="uso-instalador__detail-label">📄 Criar cópia</div>
                <div className="uso-instalador__detail-edit-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label style={{ fontSize: '12px', color: 'var(--ui-text-secondary)' }}>
                    Colaborador de destino
                  </label>
                  <select
                    className="uso-instalador__detail-input"
                    value={copyTargetEmployeeId}
                    onChange={e => setCopyTargetEmployeeId(e.target.value)}
                    disabled={isLoadingCopyUsers || isCreatingCopy}
                  >
                    <option value="">{isLoadingCopyUsers ? 'Carregando...' : 'Selecione...'}</option>
                    {copyUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullname}
                      </option>
                    ))}
                  </select>

                  <label style={{ fontSize: '12px', color: 'var(--ui-text-secondary)', marginTop: '10px' }}>
                    Data de destino (horário será mantido: {activity.startTime})
                  </label>
                  <input
                    type="date"
                    className="uso-instalador__detail-input"
                    value={`${copyTargetDate.getFullYear()}-${String(copyTargetDate.getMonth() + 1).padStart(2, '0')}-${String(copyTargetDate.getDate()).padStart(2, '0')}`}
                    min={(() => {
                      const today = new Date();
                      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    })()}
                    onChange={e => {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const newDate = new Date(copyTargetDate);
                      newDate.setFullYear(year, month - 1, day);
                      setCopyTargetDate(newDate);
                      if (copyError) setCopyError(null);
                    }}
                    disabled={isCreatingCopy}
                  />
                </div>
              </div>
            )}
            
            {/* Descrição do Colaborador */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">💬 Descrição do Colaborador</div>
              <div className={`uso-instalador__detail-value ${!activity.descricaoColaborador ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.descricaoColaborador || 'Não definido'}
              </div>
            </div>
            
            {/* Situação */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">📊 Situação</div>
              <div className="uso-instalador__detail-value">
                {activity.situacao || (
                  activity.status === 'completed' ? '✅ Concluído' : 
                  activity.status === 'inProgress' ? '🔄 Em andamento' : 
                  activity.status === 'cancelled' ? '❌ Cancelado' : '📅 Agendado'
                )}
              </div>
            </div>
            
            {/* Iniciada em */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">▶️ Iniciada em</div>
              <div className={`uso-instalador__detail-value ${!activity.iniciadaEm ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.iniciadaEm ? formatDateTime(activity.iniciadaEm) : 'Não definido'}
              </div>
            </div>
            
            {/* Completada em */}
            <div className="uso-instalador__detail-field">
              <div className="uso-instalador__detail-label">✅ Completada em</div>
              <div className={`uso-instalador__detail-value ${!activity.completadaEm ? 'uso-instalador__detail-value--empty' : ''}`}>
                {activity.completadaEm ? formatDateTime(activity.completadaEm) : 'Não definido'}
              </div>
            </div>
          </div>
          
          {activity.notes && (
            <div className="uso-instalador__detail-section">
              <div className="uso-instalador__detail-section-title">📝 Observações</div>
              <div className="uso-instalador__detail-value">{activity.notes}</div>
            </div>
          )}
          
          {activity.checklist && activity.checklist.length > 0 && (
            <div className="uso-instalador__detail-section">
              <div className="uso-instalador__detail-section-title">✅ Checklist</div>
              <ul className="uso-instalador__detail-checklist">
                {activity.checklist.map(item => (
                  <li 
                    key={item.id}
                    className={`uso-instalador__detail-checklist-item ${
                      item.completed ? 'uso-instalador__detail-checklist-item--completed' : ''
                    }`}
                  >
                    {item.completed ? '☑' : '☐'} {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {activity.materials && activity.materials.length > 0 && (
            <div className="uso-instalador__detail-section">
              <div className="uso-instalador__detail-section-title">📦 Materiais</div>
              <ul className="uso-instalador__detail-materials">
                {activity.materials.map((material, idx) => (
                  <li key={idx}>{material}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="uso-instalador__detail-footer">
          {isEditing ? (
            <>
              <button 
                className="uso-instalador__btn uso-instalador__btn--primary" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '💾 Salvando...' : '💾 Salvar'}
              </button>
              <button 
                className="uso-instalador__btn" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </button>
            </>
          ) : isCopying ? (
            <>
              <button
                className="uso-instalador__btn uso-instalador__btn--primary"
                onClick={handleCreateCopy}
                disabled={isCreatingCopy || isLoadingCopyUsers}
              >
                {isCreatingCopy ? '📄 Criando...' : '📄 Criar Cópia'}
              </button>
              <button
                className="uso-instalador__btn"
                onClick={handleCancelCopy}
                disabled={isCreatingCopy}
              >
                Cancelar
              </button>
              <button className="uso-instalador__btn" onClick={onClose} disabled={isCreatingCopy}>
                Fechar
              </button>
            </>
          ) : (
            <>
              <button
                className="uso-instalador__btn"
                onClick={() => {
                  const baseUrl = 'https://unium.crm2.dynamics.com/main.aspx?forceUCI=1&pagetype=entityrecord&etn=new_atividadefieldcontrol&id=';
                  const url = baseUrl + (activity.id || '');
                  window.open(url, '_blank', 'noopener');
                }}
                disabled={!activity.id}
                title="Abrir registro no Power Apps"
              >
                🔗 Power Apps
              </button>
              {canEdit && (
                <button 
                  className="uso-instalador__btn uso-instalador__btn--primary" 
                  onClick={handleEdit}
                >
                  ✏️ Editar
                </button>
              )}
              {canCopy() && onCopy && (
                <button
                  className="uso-instalador__btn"
                  onClick={handleStartCopy}
                >
                  📄 Copiar
                </button>
              )}
              <button className="uso-instalador__btn" onClick={onClose}>
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function UsoInstalador({
  installers: propInstallers,
  activities: propActivities,
  projects: propProjects,
  initialWeekStart,
  defaultExpanded = false,
  maxProjectsPerInstaller = 4,
  onActivityClick,
  onActivityCreate: _onActivityCreate, // Mantido para compatibilidade, mas usamos modal interno
  onWeekChange,
}: UsoInstaladorProps) {
  // State
  const [weekStart, setWeekStart] = useState(() => 
    initialWeekStart || getMondayOfWeek()
  );
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({
    isOpen: false,
    mode: 'view',
  });
  const [tooltip, setTooltip] = useState<{
    activity?: Activity;
    position: { x: number; y: number };
  } | null>(null);
  const [dataverseActivities, setDataverseActivities] = useState<Activity[]>([]);
  const [dataverseInstallers, setDataverseInstallers] = useState<Installer[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dataverseRawRecords, setDataverseRawRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o popup de seleção de cor
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null); // ID do instalador ou null
  const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);
  
  // Estado para seleção de colaboradores fixos
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [fixedInstallers, setFixedInstallers] = useState<Installer[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchFilter, setUserSearchFilter] = useState('');
  const [isTogglingUser, setIsTogglingUser] = useState<string | null>(null);
  
  // Estado para edição inline de horário na célula
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editingCellTime, setEditingCellTime] = useState('');
  const [editingCellError, setEditingCellError] = useState<string | null>(null);
  
  // Estado para edição inline de duração na célula
  const [editingCellDurationId, setEditingCellDurationId] = useState<string | null>(null);
  const [editingCellDuration, setEditingCellDuration] = useState('');
  const [editingCellDurationError, setEditingCellDurationError] = useState<string | null>(null);
  
  // Estado para modal de criação de nova atividade
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createOSLoading, setCreateOSLoading] = useState(false);
  const [createSelectedOS, setCreateSelectedOS] = useState<AvailableOrdemDeServico | null>(null);
  const [createUsersList, setCreateUsersList] = useState<AvailableUser[]>([]);
  const [createUsersLoading, setCreateUsersLoading] = useState(false);
  const [createSelectedEmployee, setCreateSelectedEmployee] = useState<string>('');
  const [createAgendamentoDate, setCreateAgendamentoDate] = useState<string>(() => {
    // Default: amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [createAgendamentoTime, setCreateAgendamentoTime] = useState('08:00');
  const [createDuracao, setCreateDuracao] = useState(240); // 4 horas em minutos
  const [createDescricao, setCreateDescricao] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [currentModalStep, setCurrentModalStep] = useState<string>(MODAL_STEPS.PROJECT_SELECTION);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [availableOS, setAvailableOS] = useState<AvailableOrdemDeServico[]>([]);
  const [selectedOS, setSelectedOS] = useState<AvailableOrdemDeServico | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Pesquisa de projetos na criação de atividade
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');

  const loadAvailableProjects = useCallback(async (search?: string) => {
    setCreateOSLoading(true);
    try {
      const result = await getAvailableProjects(search);
      if (result.success && result.data) {
        setAvailableProjects(result.data);
      } else {
        setAvailableProjects([]);
      }
    } catch (err) {
      console.error('[loadAvailableProjects] Erro:', err);
      setAvailableProjects([]);
    } finally {
      setCreateOSLoading(false);
    }
  }, []);
  
  // Lista de cores disponíveis para seleção
  const availableColors: InstallerColor[] = [
    'lightBlue', 'blue', 'green', 'lightGreen', 'darkGreen',
    'yellow', 'orange', 'red', 'pink', 'purple', 'violet',
    'cyan', 'brown', 'gray', 'white'
  ];
  
  // Função para alterar a cor do instalador
  const handleColorChange = useCallback(async (installerId: string, newColor: InstallerColor) => {
    setIsUpdatingColor(true);
    try {
      const result = await updateInstallerColor(installerId, weekStart, newColor);
      
      if (result.success) {
        // Atualizar instaladores do Dataverse (com atividades)
        setDataverseInstallers(prev => 
          prev.map(inst => 
            inst.id === installerId ? { ...inst, color: newColor } : inst
          )
        );
        
        // Atualizar instaladores fixos (sem atividades)
        setFixedInstallers(prev => 
          prev.map(inst => 
            inst.id === installerId ? { ...inst, color: newColor } : inst
          )
        );
        
        console.log('[UsoInstalador] Cor atualizada com sucesso');
      } else {
        console.error('[UsoInstalador] Erro ao atualizar cor:', result.error);
        setError(`Erro ao atualizar cor: ${result.error}`);
      }
    } catch (err) {
      console.error('[UsoInstalador] Erro ao atualizar cor:', err);
      setError(`Erro ao atualizar cor: ${err}`);
    } finally {
      setIsUpdatingColor(false);
      setColorPickerOpen(null);
    }
  }, [weekStart]);
  
  // Função para salvar alterações na atividade
  const handleSaveActivity = useCallback(async (
    activityId: string,
    updates: { agendamento?: Date; descricao?: string; duracao?: number }
  ) => {
    try {
      const result = await updateActivity(activityId, updates);
      
      if (result.success) {
        console.log('[UsoInstalador] Atividade atualizada com sucesso');
        
        // Recarregar atividades do Dataverse
        const fetchResult = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
        
        if (fetchResult.success && fetchResult.data && fetchResult.data.length > 0) {
          // Guardar registros brutos
          setDataverseRawRecords(fetchResult.data);
          
          // Extrair e atualizar instaladores
          const extractedInstallers = extractInstallersFromActivities(fetchResult.data);
          const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
          setDataverseInstallers(installersWithColors);
          
          // Mapear atividades
          const mapped = fetchResult.data
            .map(mapDataverseActivity)
            .filter((a): a is Activity => a !== null);
          setDataverseActivities(mapped);
        }
        
        // Fechar o painel
        handleCloseDetail();
      } else {
        throw new Error(result.error || 'Erro ao atualizar atividade');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[UsoInstalador] Erro ao salvar atividade:', errorMsg);
      throw new Error(errorMsg);
    }
  }, [weekStart]);

  const handleCopyActivity = useCallback(async (params: {
    sourceActivityId: string;
    targetEmployeeId: string;
    targetAgendamento: Date;
  }) => {
    try {
      const result = await copyActivity(
        params.sourceActivityId,
        params.targetEmployeeId,
        params.targetAgendamento
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar cópia da atividade');
      }

      // Recarregar atividades do Dataverse para atualizar a grid (se cair na semana atual)
      const fetchResult = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
      if (fetchResult.success && fetchResult.data) {
        setDataverseRawRecords(fetchResult.data);

        const extractedInstallers = extractInstallersFromActivities(fetchResult.data);
        const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
        setDataverseInstallers(installersWithColors);

        const mapped = fetchResult.data
          .map(mapDataverseActivity)
          .filter((a): a is Activity => a !== null);
        setDataverseActivities(mapped);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[UsoInstalador] Erro ao copiar atividade:', errorMsg);
      throw new Error(errorMsg);
    }
  }, [weekStart]);
  
  // Função para abrir seletor de usuários
  const handleOpenUserSelector = useCallback(async () => {
    setUserSelectorOpen(true);
    setIsLoadingUsers(true);
    try {
      const result = await getAvailableUsers();
      if (result.success && result.data) {
        setAvailableUsers(result.data);
      } else {
        setError('Erro ao carregar usuários disponíveis');
      }
    } catch (err) {
      console.error('[UsoInstalador] Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);
  
  // Função para alternar usuário fixo
  const handleToggleFixedUser = useCallback(async (userId: string) => {
    setIsTogglingUser(userId);
    try {
      const result = await toggleFixedUser(userId);
      if (result.success) {
        // Atualizar lista de usuários disponíveis
        setAvailableUsers(prev => 
          prev.map(u => u.id === userId ? { ...u, isFixed: result.isNowFixed } : u)
        );
        
        // Recarregar usuários fixos e atividades para atualizar a grid
        const fixedResult = await getFixedUsers();
        if (fixedResult.success && fixedResult.data) {
          setFixedInstallers(fixedResult.data);
        }
      } else {
        setError(`Erro ao alterar usuário: ${result.error}`);
      }
    } catch (err) {
      console.error('[UsoInstalador] Erro ao alternar usuário fixo:', err);
      setError('Erro ao alternar usuário');
    } finally {
      setIsTogglingUser(null);
    }
  }, []);
  
  // Buscar usuários fixos ao carregar e atualizar suas cores
  useEffect(() => {
    async function fetchFixedUsers() {
      try {
        const result = await getFixedUsers();
        if (result.success && result.data && result.data.length > 0) {
          // Atualizar cores dos instaladores fixos para a semana atual
          const installersWithColors = await updateInstallerColors(result.data, weekStart);
          setFixedInstallers(installersWithColors);
          console.log('[UsoInstalador] Usuários fixos carregados:', installersWithColors.length);
        } else {
          setFixedInstallers([]);
        }
      } catch (err) {
        console.error('[UsoInstalador] Erro ao carregar usuários fixos:', err);
      }
    }
    fetchFixedUsers();
  }, [weekStart]); // Recarregar quando a semana mudar
  
  // Refresh manual e carregamento de atividades (semana ativa)
  const handleRefresh = useCallback(async () => {
    console.log('[UsoInstalador] Refresh manual disparado para semana:', weekStart);
    setIsLoading(true);
    setError(null);
    try {
      // Primeiro, testar conexão simples
      console.log('[UsoInstalador] Testando conexão simples primeiro...');
      const testResult = await AtividadefieldcontrolService.testConnection();
      console.log('[UsoInstalador] Teste de conexão:', testResult.success ? 'OK' : 'FALHOU', testResult);
      
      if (!testResult.success) {
        console.error('[UsoInstalador] Falha no teste de conexão:', testResult.error);
        setError('Falha na conexão com Dataverse');
        setDataverseActivities([]);
        return;
      }
      
      // Se a conexão funcionou, buscar com filtros
      const result = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
      console.log('[UsoInstalador] Resultado bruto do Dataverse:', result);
      console.log('[UsoInstalador] Dados recebidos:', result.data?.length || 0, 'registros');
      
      // Verificar se houve erro na resposta
      if (!result.success) {
        console.error('[UsoInstalador] Erro retornado pelo Dataverse:', result.error);
        setError(result.error?.message || 'Erro ao carregar atividades do Dataverse');
        setDataverseActivities([]);
        return;
      }
      
      if (result.data && result.data.length > 0) {
        console.log('[UsoInstalador] Primeiro registro exemplo:', JSON.stringify(result.data[0], null, 2));
        
        // Guardar registros brutos para extrair instaladores
        setDataverseRawRecords(result.data);
        
        // Extrair instaladores únicos dos registros
        const extractedInstallers = extractInstallersFromActivities(result.data);
        console.log('[UsoInstalador] Instaladores extraídos:', extractedInstallers.length, extractedInstallers.map(i => i.name));
        
        // Atualizar cores dos instaladores para a semana atual
        const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
        console.log('[UsoInstalador] Instaladores com cores atualizadas');
        setDataverseInstallers(installersWithColors);
        
        const mapped = result.data
          .map(mapDataverseActivity)
          .filter((a): a is Activity => a !== null);
        console.log('[UsoInstalador] Atividades mapeadas:', mapped.length);
        setDataverseActivities(mapped);
      } else {
        console.log('[UsoInstalador] Nenhum dado retornado do Dataverse (query ok, mas vazia)');
        setDataverseActivities([]);
        setDataverseInstallers([]);
        setDataverseRawRecords([]);
      }
    } catch (err: any) {
      console.error('[UsoInstalador] Exceção ao buscar atividades do Dataverse:', err);
      setError(err.message || 'Erro ao carregar atividades');
      // Em caso de erro, usar mock como fallback
      setDataverseActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  // Buscar atividades do Dataverse quando a semana mudar
  useEffect(() => {
    async function fetchActivities() {
      await handleRefresh();
    }
    
    // Se não foram fornecidas atividades via props, buscar do Dataverse
    if (!propActivities) {
      console.log('[UsoInstalador] Buscando atividades do Dataverse (sem props)');
      fetchActivities();
    } else {
      console.log('[UsoInstalador] Usando atividades das props:', propActivities.length);
    }
  }, [weekStart, propActivities, handleRefresh]);
  
  // Determinar instaladores: props > Dataverse + fixos > vazio
  // Mesmo que um usuário não tenha atividade, se for fixo ele aparece
  const installers = useMemo(() => {
    let result: Installer[] = [];
    
    if (propInstallers && propInstallers.length > 0) {
      result = propInstallers;
    } else if (dataverseInstallers.length > 0 || fixedInstallers.length > 0) {
      console.log('[UsoInstalador] Usando instaladores do Dataverse:', dataverseInstallers.length, '+ fixos:', fixedInstallers.length);
      
      // Criar mapa de IDs existentes
      const existingIds = new Set(dataverseInstallers.map(i => i.id));
      
      // Começar com os instaladores do Dataverse (que têm atividades)
      result = [...dataverseInstallers];
      
      // Adicionar instaladores fixos que não estão na lista
      for (const fixed of fixedInstallers) {
        if (!existingIds.has(fixed.id)) {
          result.push(fixed);
        }
      }
    } else {
      // Sem dados - retornar lista vazia
      return [];
    }
    
    // Ordenar por cor (usar a mesma ordem definida em availableColors)
    return [...result].sort((a, b) => {
      const orderIndex = (c: InstallerColor) => {
        const idx = availableColors.indexOf(c);
        return idx >= 0 ? idx : availableColors.length;
      };
      const ia = orderIndex(a.color);
      const ib = orderIndex(b.color);
      if (ia !== ib) return ia - ib;
      // Se a cor for a mesma, ordenar por nome do instalador para garantir ordem estável
      return a.name.localeCompare(b.name);
    });
  }, [propInstallers, dataverseInstallers, fixedInstallers]);
  
  // Determinar atividades: props > Dataverse > vazio
  const activities = useMemo(() => {
    if (propActivities && propActivities.length > 0) {
      return propActivities;
    }
    if (dataverseActivities.length > 0) {
      console.log('[UsoInstalador] Usando atividades do Dataverse:', dataverseActivities.length);
      return dataverseActivities;
    }
    // Sem dados - retornar lista vazia
    return [];
  }, [propActivities, dataverseActivities]);
  
  // Generate week days (movido para cima para usar na filtragem de projetos)
  const [showSunday, setShowSunday] = useState<boolean>(false);
  
  // Lista de dias visíveis conforme toggle de Domingo
  const weekDaysWithToggle = useMemo(() => generateWeekDays(weekStart, showSunday), [weekStart, showSunday]);
  
  // Criar set de datas da semana para filtros
  const weekDateKeys = useMemo(() => 
    new Set(weekDaysWithToggle.map(d => formatDateKey(d.date))), 
    [weekDaysWithToggle]
  );
  
  // Determinar projetos: props > Dataverse (extraídos das atividades na semana) > mock
  // Filtra atividades que estão dentro da semana antes de extrair projetos
  const projects = useMemo(() => {
    if (propProjects && propProjects.length > 0) {
      return propProjects;
    }
    if (dataverseActivities.length > 0) {
      // Filtrar apenas atividades que estão dentro da semana atual
      const activitiesInWeek = dataverseActivities.filter(a => 
        weekDateKeys.has(formatDateKey(a.date))
      );
      const extractedProjects = extractProjectsFromMappedActivities(activitiesInWeek);
      console.log('[UsoInstalador] Projetos extraídos (apenas da semana):', extractedProjects.length, 
        'de', dataverseActivities.length, 'atividades totais,', activitiesInWeek.length, 'na semana');
      return extractedProjects;
    }
    // Sem dados - retornar lista vazia
    return [];
  }, [propProjects, dataverseActivities, weekDateKeys]);

  // Project color map (evenly spaced hues to avoid repeats/similar colors)
  const projectColorMap = useMemo(() => generateProjectColorMap(projects), [projects]);
  
  // Process data for grid
  const gridData = useMemo(() => {
    // Initialize expanded state for new installers
    const initialExpanded: Record<string, boolean> = {};
    installers.forEach(inst => {
      initialExpanded[inst.id] = expandedState[inst.id] ?? defaultExpanded;
    });
    
    return processInstallerData(
      installers,
      activities,
      weekDaysWithToggle,
      maxProjectsPerInstaller,
      initialExpanded
    );
  }, [installers, activities, weekDaysWithToggle, maxProjectsPerInstaller, expandedState, defaultExpanded]);

  // Compute vertical merge groups: for each day, find consecutive parent rows (installers) in the same team
  // that have exactly one activity on that day and that activity matches (projectId, startTime, hours).
  const verticalMergeGroups = useMemo(() => {
    const map: Record<number, Array<{ start: number; len: number; activity: Activity }>> = {};
    for (let dayIndex = 0; dayIndex < weekDaysWithToggle.length; dayIndex++) {
      const groups: Array<{ start: number; len: number; activity: Activity }> = [];
      let i = 0;
      while (i < gridData.length) {
        const curr = gridData[i];
        const dayInfo = curr.dailyHours[dayIndex];
        if (!dayInfo || dayInfo.activities.length !== 1) { i++; continue; }
        const activity = dayInfo.activities[0];
        // Attempt to extend group downwards
        let j = i + 1;
        while (j < gridData.length) {
          const next = gridData[j];
          const nextDay = next.dailyHours[dayIndex];
          if (!nextDay || nextDay.activities.length !== 1) break;
          const nextActivity = nextDay.activities[0];
          if (
            next.installer.teamId === curr.installer.teamId &&
            nextActivity.projectId === activity.projectId &&
            nextActivity.startTime === activity.startTime &&
            nextActivity.hours === activity.hours
          ) {
            j++;
          } else {
            break;
          }
        }
        const len = j - i;
        if (len > 1) {
          groups.push({ start: i, len, activity });
        }
        i = j;
      }
      map[dayIndex] = groups;
    }
    return map;
  }, [gridData, weekDaysWithToggle]);
  
  // Week end date
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 5);
    return end;
  }, [weekStart]);
  
  // Handlers
  const handlePrevWeek = useCallback(() => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
    onWeekChange?.(newStart);
  }, [weekStart, onWeekChange]);
  
  const handleNextWeek = useCallback(() => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
    onWeekChange?.(newStart);
  }, [weekStart, onWeekChange]);
  

  // Date picker state (substitui o botão "Hoje")
  const [datePickerValue, setDatePickerValue] = useState<string>(() => {
    const d = new Date(weekStart);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  useEffect(() => {
    const d = new Date(weekStart);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDatePickerValue(`${y}-${m}-${day}`);
  }, [weekStart]);

  const handleDatePick = useCallback((value: string) => {
    if (!value) return;
    const picked = new Date(value + 'T00:00:00');
    const monday = getMondayOfWeek(picked);
    setWeekStart(monday);
    onWeekChange?.(monday);
  }, [onWeekChange]);
  
  const handleToggleExpand = useCallback((installerId: string) => {
    setExpandedState(prev => ({
      ...prev,
      [installerId]: !(prev[installerId] ?? defaultExpanded),
    }));
  }, [defaultExpanded]);
  
  const handleToggleAll = useCallback(() => {
    const newState = !allExpanded;
    const newExpandedState: Record<string, boolean> = {};
    installers.forEach(installer => {
      newExpandedState[installer.id] = newState;
    });
    setExpandedState(newExpandedState);
    setAllExpanded(newState);
  }, [allExpanded, installers]);
  
  // Handlers para edição inline de horário
  const canEditActivityTime = (activity: Activity): boolean => {
    // Só pode editar o horário de atividades futuras com status 'scheduled'
    const now = new Date();
    const activityDateTime = new Date(activity.date);
    const [hours, minutes] = activity.startTime.split(':').map(Number);
    activityDateTime.setHours(hours, minutes, 0, 0);
    
    // Atividade deve estar agendada no futuro
    return activity.raw_status === 'scheduled' && activityDateTime > now;
  };
  
  const handleStartEditCellTime = useCallback((activity: Activity, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!canEditActivityTime(activity)) {
      setEditingCellError('Apenas atividades futuras podem ter o horário alterado');
      setTimeout(() => setEditingCellError(null), 3000);
      return;
    }
    
    setEditingCellId(activity.id);
    setEditingCellTime(activity.startTime);
    setEditingCellError(null);
  }, []);
  
  const handleCancelEditCellTime = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingCellId(null);
    setEditingCellTime('');
    setEditingCellError(null);
  }, []);
  
  const handleSaveEditCellTime = useCallback(async (activity: Activity, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      setEditingCellError(null);
      
      // Validar formato da hora
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(editingCellTime)) {
        setEditingCellError('Formato de horário inválido. Use HH:mm');
        return;
      }
      
      // Criar data/hora nova
      const newDateTime = new Date(activity.date);
      const [newHours, newMinutes] = editingCellTime.split(':').map(Number);
      newDateTime.setHours(newHours, newMinutes, 0, 0);
      
      // Validar se a nova hora é no futuro
      const now = new Date();
      if (newDateTime <= now) {
        setEditingCellError('O novo horário deve ser no futuro');
        return;
      }
      
      // Atualizar a atividade via updateActivity
      const result = await updateActivity(activity.id, { agendamento: newDateTime });
      
      if (result.success) {
        console.log('[UsoInstalador] Horário atualizado com sucesso');
        
        // Recarregar atividades do Dataverse
        const fetchResult = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
        
        if (fetchResult.success && fetchResult.data && fetchResult.data.length > 0) {
          // Guardar registros brutos
          setDataverseRawRecords(fetchResult.data);
          
          // Extrair e atualizar instaladores
          const extractedInstallers = extractInstallersFromActivities(fetchResult.data);
          const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
          setDataverseInstallers(installersWithColors);
          
          // Mapear atividades
          const mapped = fetchResult.data
            .map(mapDataverseActivity)
            .filter((a): a is Activity => a !== null);
          setDataverseActivities(mapped);
        }
        
        setEditingCellId(null);
        setEditingCellTime('');
      } else {
        setEditingCellError(result.error || 'Erro ao atualizar horário');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[UsoInstalador] Erro ao salvar horário:', errorMsg);
      setEditingCellError(errorMsg);
    }
  }, [editingCellTime, weekStart]);
  
  // Handlers para edição inline de duração
  const handleStartEditCellDuration = useCallback((activity: Activity, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!canEditActivityTime(activity)) {
      setEditingCellDurationError('Apenas atividades futuras podem ter a duração alterada');
      setTimeout(() => setEditingCellDurationError(null), 3000);
      return;
    }
    
    setEditingCellDurationId(activity.id);
    setEditingCellDuration(activity.hours.toString());
    setEditingCellDurationError(null);
  }, []);
  
  const handleCancelEditCellDuration = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingCellDurationId(null);
    setEditingCellDuration('');
    setEditingCellDurationError(null);
  }, []);
  
  const handleSaveEditCellDuration = useCallback(async (activity: Activity, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      setEditingCellDurationError(null);
      
      // Validar duração
      const durationNum = parseFloat(editingCellDuration);
      if (isNaN(durationNum) || durationNum <= 0) {
        setEditingCellDurationError('Duração deve ser um número positivo');
        return;
      }
      
      if (durationNum > 24) {
        setEditingCellDurationError('Duração não pode exceder 24 horas');
        return;
      }
      
      // Atualizar a atividade via updateActivity
      // Converter horas para minutos (duracao em minutos)
      const durationMinutes = Math.round(durationNum * 60);
      const result = await updateActivity(activity.id, { duracao: durationMinutes });
      
      if (result.success) {
        console.log('[UsoInstalador] Duração atualizada com sucesso');
        
        // Recarregar atividades do Dataverse
        const fetchResult = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
        
        if (fetchResult.success && fetchResult.data && fetchResult.data.length > 0) {
          // Guardar registros brutos
          setDataverseRawRecords(fetchResult.data);
          
          // Extrair e atualizar instaladores
          const extractedInstallers = extractInstallersFromActivities(fetchResult.data);
          const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
          setDataverseInstallers(installersWithColors);
          
          // Mapear atividades
          const mapped = fetchResult.data
            .map(mapDataverseActivity)
            .filter((a): a is Activity => a !== null);
          setDataverseActivities(mapped);
        }
        
        setEditingCellDurationId(null);
        setEditingCellDuration('');
      } else {
        setEditingCellDurationError(result.error || 'Erro ao atualizar duração');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[UsoInstalador] Erro ao salvar duração:', errorMsg);
      setEditingCellDurationError(errorMsg);
    }
  }, [editingCellDuration, weekStart]);
  
  const handleCellClick = useCallback((activity: Activity) => {
    setDetailPanel({
      isOpen: true,
      activity,
      mode: 'view',
    });
    onActivityClick?.(activity);
  }, [onActivityClick]);
  
  const handleCellHover = useCallback((
    activity: Activity | undefined,
    event: React.MouseEvent
  ) => {
    if (activity) {
      setTooltip({
        activity,
        position: { x: event.clientX, y: event.clientY },
      });
    } else {
      setTooltip(null);
    }
  }, []);
  
  const handleCloseDetail = useCallback(() => {
    setDetailPanel({ isOpen: false, mode: 'view' });
  }, []);
  
  // Função para abrir modal de nova atividade - começa com seleção de projeto
  const handleNewActivity = useCallback(async () => {
    // Resetar estados do modal
    setCreateModalOpen(true);
    setCurrentModalStep(MODAL_STEPS.PROJECT_SELECTION);
    setSelectedProject(null);
    setSelectedOS(null);
    setCreateSelectedOS(null);
    setCreateSelectedEmployee('');
    setCreateDescricao('');
    setCreateDuracao(240);
    setCreateError(null);
    setAvailableOS([]);
    
    // Definir data padrão como amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCreateAgendamentoDate(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`);
    setCreateAgendamentoTime('08:00');
    
    // Carregar projetos disponíveis (inicializa pesquisa vazia)
    setProjectSearchTerm('');
    await loadAvailableProjects();
  }, [loadAvailableProjects]);
  
  // Atualiza a lista de projetos quando o modal abrir ou o termo de pesquisa mudar (debounce)
  useEffect(() => {
    if (!createModalOpen) return;
    const t = setTimeout(() => {
      loadAvailableProjects(projectSearchTerm);
    }, 300);

    return () => clearTimeout(t);
  }, [createModalOpen, projectSearchTerm, loadAvailableProjects]);

  // Função para selecionar projeto e avançar para seleção de OS
  const handleSelectProjectStep = useCallback(async (project: Project) => {
    setSelectedProject(project);
    setCurrentModalStep(MODAL_STEPS.ORDER_SELECTION);
    setCreateOSLoading(true);
    setCreateError(null);
    
    try {
      const result = await getOrdensByProjeto(project.id);
      if (result.success && result.data) {
        setAvailableOS(result.data);
      } else {
        setCreateError(result.error || 'Erro ao carregar ordens de serviço');
      }
    } catch (err) {
      console.error('[handleSelectProjectStep] Erro:', err);
      setCreateError('Erro ao carregar ordens de serviço');
    } finally {
      setCreateOSLoading(false);
    }
  }, []);
  
  // Função para selecionar OS e ir para próxima etapa (seleção de colaborador)
  const handleSelectOS = useCallback(async (os: AvailableOrdemDeServico) => {
    setSelectedOS(os);
    setCreateSelectedOS(os);
    setCurrentModalStep(MODAL_STEPS.EMPLOYEE_SELECTION);
    setCreateError(null);
    
    // Carregar lista de colaboradores
    setCreateUsersLoading(true);
    try {
      const result = await getAvailableUsers();
      if (result.success && result.data) {
        setCreateUsersList(result.data);
      }
    } catch (err) {
      console.error('[handleSelectOS] Erro ao carregar colaboradores:', err);
    } finally {
      setCreateUsersLoading(false);
    }
  }, []);

  // Handler para ordenar produtos server-side
  const handleSortProdutos = useCallback(async (ordemId: string, column: 'quantidade' | 'referenciaProduto' | 'descricao' | 'situacaoReserva', dir: 'asc' | 'desc') => {
    try {
      // Map column key to Dataverse attribute
      const columnMap: Record<string, string> = {
        quantidade: 'new_quantidade',
        referenciaProduto: 'new_referenciadoproduto',
        descricao: 'new_descricao',
        situacaoReserva: 'new_situacaoreserva'
      };

      const attr = columnMap[column];
      if (!attr) return;

      // Set loading flag for specific OS
      setAvailableOS(prev => prev.map(o => o.id === ordemId ? { ...o, produtosLoading: true } : o));

      const produtos = await getProdutosByOrdem(ordemId, { orderBy: `${attr} ${dir}` });

      setAvailableOS(prev => prev.map(o => o.id === ordemId ? { ...o, produtos: produtos, produtosLoading: false } : o));
    } catch (err) {
      console.error('[handleSortProdutos] Erro ao ordenar produtos:', err);
      setAvailableOS(prev => prev.map(o => o.id === ordemId ? { ...o, produtosLoading: false } : o));
    }
  }, []);
  
  // Função para criar a atividade
  const handleCreateActivity = useCallback(async () => {
    if (!createSelectedOS) {
      setCreateError('Selecione uma Ordem de Serviço');
      return;
    }
    if (!createSelectedEmployee) {
      setCreateError('Selecione um colaborador');
      return;
    }
    if (!createDescricao || createDescricao.trim().length === 0) {
      setCreateError('Descrição é obrigatória');
      return;
    }
    
    // Montar data/hora do agendamento
    const [year, month, day] = createAgendamentoDate.split('-').map(Number);
    const [hours, minutes] = createAgendamentoTime.split(':').map(Number);
    const agendamento = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Validar data futura
    const now = new Date();
    if (agendamento <= now) {
      setCreateError('O agendamento deve ser para uma data/hora futura');
      return;
    }
    
    setCreateSubmitting(true);
    setCreateError(null);
    
    try {
      const result = await createActivity({
        ordemDeServicoId: createSelectedOS.id,
        employeeId: createSelectedEmployee,
        agendamento,
        duracao: createDuracao,
        descricao: createDescricao.trim(),
        projetoId: createSelectedOS.projetoId || undefined,
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar atividade');
      }
      
      console.log('[handleCreateActivity] Atividade criada com sucesso:', result.id);
      
      // Fechar modal
      setCreateModalOpen(false);
      
      // Recarregar atividades para atualizar a grid
      const fetchResult = await AtividadefieldcontrolService.getWeekActivities(weekStart, 1);
      if (fetchResult.success && fetchResult.data) {
        setDataverseRawRecords(fetchResult.data);
        
        const extractedInstallers = extractInstallersFromActivities(fetchResult.data);
        const installersWithColors = await updateInstallerColors(extractedInstallers, weekStart);
        setDataverseInstallers(installersWithColors);
        
        const mapped = fetchResult.data
          .map(mapDataverseActivity)
          .filter((a): a is Activity => a !== null);
        setDataverseActivities(mapped);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[handleCreateActivity] Erro:', errorMsg);
      setCreateError(errorMsg);
    } finally {
      setCreateSubmitting(false);
    }
  }, [
    createSelectedOS,
    createSelectedEmployee,
    createAgendamentoDate,
    createAgendamentoTime,
    createDuracao,
    createDescricao,
    weekStart,
  ]);
  
  // Render helpers
  const getCapacityClass = (percentage: number) => {
    if (percentage < 40) return 'uso-instalador__installer-capacity--idle';
    if (percentage <= 80) return 'uso-instalador__installer-capacity--normal';
    if (percentage <= 100) return 'uso-instalador__installer-capacity--warning';
    return 'uso-instalador__installer-capacity--overload';
  };
  
  const renderHoursCell = (
    hours: number,
    dayInfo: DailyHours | null,
    isParent: boolean,
    isTravel: boolean,
    isToday: boolean,
    activity?: Activity,
    isCollapsed?: boolean,
    installerIndex?: number,
    dayIndex?: number
  ) => {
    const isEmpty = hours === 0;
    const isOverload = dayInfo?.hasOverload || false;
    const isCritical = dayInfo?.hasCriticalOverload || false;
    const hasConflict = dayInfo?.hasConflict || false;
    
    const cellClasses = [
      isParent ? 'uso-instalador__hours-cell' : 'uso-instalador__project-hours-cell',
      isEmpty && (isParent ? 'uso-instalador__hours-cell--empty' : 'uso-instalador__project-hours-cell--empty'),
      isParent && isOverload && 'uso-instalador__hours-cell--overload',
      isParent && isCritical && 'uso-instalador__hours-cell--critical',
      isParent && hasConflict && 'uso-instalador__hours-cell--conflict',
      isParent && 'uso-instalador__hours-cell--parent',
      isToday && 'uso-instalador__hours-cell--today',
      isTravel && 'uso-instalador__project-hours-cell--travel',
      // When parent row is collapsed, use a collapsed modifier to left-align content
      isParent && isCollapsed && 'uso-instalador__hours-cell--collapsed',
    ].filter(Boolean).join(' ');
    
    // Resumo de projetos para células colapsadas
    const projectSummary = isParent && isCollapsed && dayInfo && dayInfo.activities.length > 0
      ? (() => {
          // Mapear projectId -> projectName (mantendo a primeira ocorrência)
          const projectMap = new Map<string, string>();
          dayInfo.activities.forEach(a => {
            if (a.projectId && a.projectName && !projectMap.has(a.projectId)) {
              projectMap.set(a.projectId, a.projectName);
            }
          });

          const projectList = Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
          const displayList = projectList.slice(0, 5);
          const hasMore = projectList.length > 5;

          return { projects: displayList, hasMore };
        })()
      : null;
    
    // Horário da atividade para células expandidas
    const activityTime = !isParent && activity ? `${activity.startTime}` : null;
    
    // Determine merge state for this cell
    const isMergedCell = typeof installerIndex === 'number' && typeof dayIndex === 'number' && (() => {
      const groups = verticalMergeGroups[dayIndex] || [];
      return groups.some(g => installerIndex >= g.start && installerIndex < g.start + g.len);
    })();

    const innerContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: isParent && isCollapsed ? 'flex-start' : 'center',
      gap: isMergedCell ? '0px' : '1px',
      padding: isMergedCell ? '0px' : '2px',
      width: '100%',
    };

    return (
      <div 
        className={cellClasses}
        onClick={() => activity && handleCellClick(activity)}
        onMouseEnter={(e) => activity && handleCellHover(activity, e)}
        onMouseLeave={() => handleCellHover(undefined, {} as React.MouseEvent)}
        title={projectSummary ? projectSummary.projects.map(p => p.name).join(', ') : undefined}
      >
        {isEmpty ? '—' : (
          <div style={innerContainerStyle}>
            {/* Quando colapsado: priorizar nomes de projetos */}
            {isParent && isCollapsed ? (
              <>
                {projectSummary && (() => {
                  // Check if this cell is part of a merge group
                  let mergeInfo: { pos: number; len: number; activity: { projectId: string } } | null = null;
                  if (typeof installerIndex === 'number' && typeof dayIndex === 'number') {
                    const groups = verticalMergeGroups[dayIndex] || [];
                    const group = groups.find(g => installerIndex >= g.start && installerIndex < g.start + g.len);
                    if (group) {
                      mergeInfo = { pos: installerIndex - group.start, len: group.len, activity: group.activity };
                    }
                  }

                  // If we're in a merged cell but NOT the top, hide chip content
                  if (mergeInfo && mergeInfo.pos > 0) {
                    return <div className="uso-instalador__project-summary" style={{ visibility: 'hidden', height: '100%' }} />;
                  }

                  return (
                    <div className="uso-instalador__project-summary" style={{ display: 'flex', flexDirection: 'column', gap: mergeInfo ? '0px' : '2px', width: '100%', height: mergeInfo ? '100%' : 'auto', position: mergeInfo ? 'relative' : 'static' }}>
                      {projectSummary.projects.map((p, idx) => {
                        const color = projectColorMap[p.id] || projectColors(p.id);
                        let chipClass = 'uso-instalador__project-summary-name uso-instalador__project-chip';
                        let chipStyle: React.CSSProperties = { backgroundColor: color.background, color: color.text };

                        // If this is the top cell of a merge group and the project matches
                        if (mergeInfo && mergeInfo.pos === 0 && mergeInfo.activity.projectId === p.id) {
                          chipClass += ' uso-instalador__project-chip--spanning';
                          // Calculate height to span all merged cells
                          const rowHeight = 42; // var(--row-height-parent)
                          const spanHeight = rowHeight * mergeInfo.len;
                          chipStyle = {
                            ...chipStyle,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: `${spanHeight}px`,
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            borderRadius: '6px',
                          };
                        }

                        return (
                          <span
                            key={p.id}
                            className={chipClass}
                            style={chipStyle}
                            title={p.name}
                          >
                            {p.name}{idx === projectSummary.projects.length - 1 && projectSummary.hasMore ? '...' : ''}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
                {/* Hide hours meta when in middle/bottom of merge */}
                {(() => {
                  let hideHoursMeta = false;
                  if (typeof installerIndex === 'number' && typeof dayIndex === 'number') {
                    const groups = verticalMergeGroups[dayIndex] || [];
                    const group = groups.find(g => installerIndex >= g.start && installerIndex < g.start + g.len);
                    if (group && installerIndex > group.start) hideHoursMeta = true;
                  }
                  if (hideHoursMeta) return null;
                  return (
                    <span className="uso-instalador__hours-meta">
                      {hours}h
                      {isOverload && (
                        <span className="uso-instalador__hours-meta-icon">{isCritical ? '🔴' : '⚠️'}</span>
                      )}
                      {hasConflict && (
                        <span className="uso-instalador__hours-meta-icon">🟥</span>
                      )}
                    </span>
                  );
                })()}
              </>
            ) : (
              /* Quando expandido ou sem resumo: layout normal */
              <>
                {activity && editingCellDurationId === activity.id ? (
                  // Modo de edição de duração
                  <div 
                    style={{
                      display: 'flex',
                      gap: '4px',
                      fontSize: '10px',
                      alignItems: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="number"
                      value={editingCellDuration}
                      onChange={(e) => {
                        setEditingCellDuration(e.target.value);
                        setEditingCellDurationError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditCellDuration(activity, e as unknown as React.MouseEvent);
                        } else if (e.key === 'Escape') {
                          handleCancelEditCellDuration(e as unknown as React.MouseEvent);
                        }
                      }}
                      step="0.5"
                      min="0.5"
                      max="24"
                      style={{
                        padding: '2px 4px',
                        fontSize: '10px',
                        border: editingCellDurationError ? '1px solid #f44336' : '1px solid #ccc',
                        borderRadius: '3px',
                        width: '50px',
                      }}
                      autoFocus
                    />
                    <span style={{ fontSize: '10px' }}>h</span>
                    <button
                      onClick={(e) => handleSaveEditCellDuration(activity, e)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        minWidth: '28px',
                      }}
                      title="Salvar (Enter)"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => handleCancelEditCellDuration(e)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        minWidth: '28px',
                      }}
                      title="Cancelar (Esc)"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  // Modo de visualização
                  <span 
                    className="uso-instalador__hours-value"
                    onClick={(e) => activity && canEditActivityTime(activity) && handleStartEditCellDuration(activity, e)}
                    style={{
                      cursor: activity && canEditActivityTime(activity) ? 'pointer' : 'default',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (activity && canEditActivityTime(activity)) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    title={activity && canEditActivityTime(activity) ? 'Clique para editar duração' : 'Apenas atividades futuras podem ter duração alterada'}
                  >
                    {hours}h
                    {isParent && isOverload && (
                      <span className="uso-instalador__hours-alert">
                        {isCritical ? '🔴' : '⚠️'}
                      </span>
                    )}
                    {isParent && hasConflict && (
                      <span className="uso-instalador__hours-alert">🟥</span>
                    )}
                  </span>
                )}
                {activityTime && activity && (
                  editingCellId === activity.id ? (
                    // Modo de edição inline
                    <div 
                      style={{
                        display: 'flex',
                        gap: '4px',
                        fontSize: '10px',
                        alignItems: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="time"
                        value={editingCellTime}
                        onChange={(e) => {
                          setEditingCellTime(e.target.value);
                          setEditingCellError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditCellTime(activity, e as unknown as React.MouseEvent);
                          } else if (e.key === 'Escape') {
                            handleCancelEditCellTime(e as unknown as React.MouseEvent);
                          }
                        }}
                        style={{
                          padding: '2px 4px',
                          fontSize: '10px',
                          border: editingCellError ? '1px solid #f44336' : '1px solid #ccc',
                          borderRadius: '3px',
                          width: '60px',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveEditCellTime(activity, e)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          minWidth: '28px',
                        }}
                        title="Salvar (Enter)"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => handleCancelEditCellTime(e)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          minWidth: '28px',
                        }}
                        title="Cancelar (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    // Modo de visualização
                    <span
                      onClick={(e) => activity && handleStartEditCellTime(activity, e)}
                      style={{ 
                        fontSize: '9px', 
                        color: '#888',
                        lineHeight: 1,
                        cursor: canEditActivityTime(activity) ? 'pointer' : 'default',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (canEditActivityTime(activity)) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                      title={canEditActivityTime(activity) ? 'Clique para editar horário' : 'Apenas atividades futuras podem ter horário alterado'}
                    >
                      {activityTime}
                    </span>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Determine if we should show team separator
  const shouldShowSeparator = (index: number, data: InstallerGridData[]) => {
    if (index === 0) return false;
    const currentTeam = data[index].installer.teamId;
    const prevTeam = data[index - 1].installer.teamId;
    return currentTeam !== prevTeam;
  };
  
  return (
    <div className="uso-instalador">
      {/* Header */}
      <div className="uso-instalador__header">
        <div className="uso-instalador__title-section">
          <h1 className="uso-instalador__title">
            🗓️ USO DO INSTALADOR
            <span className="uso-instalador__week-range">
              Semana {formatDateShort(weekStart)} a {formatDateShort(weekEnd)}
            </span>
          </h1>
          {isLoading && (
            <span className="uso-instalador__loading">
              ⏳ Carregando atividades...
            </span>
          )}
          {error && (
            <span className="uso-instalador__error">
              ⚠️ {error} (usando dados de exemplo)
            </span>
          )}
        </div>
        
        <div className="uso-instalador__nav">
          <button 
            className="uso-instalador__nav-btn" 
            onClick={handlePrevWeek}
            title="Semana anterior"
          >
            ◀
          </button>
          <div className="uso-instalador__date-picker">
            <input 
              type="date"
              className="uso-instalador__date-input"
              value={datePickerValue}
              onChange={(e) => handleDatePick(e.target.value)}
              aria-label="Selecionar data"
            />
          </div>
          <button 
            className="uso-instalador__nav-btn" 
            onClick={handleNextWeek}
            title="Próxima semana"
          >
            ▶
          </button>
        </div>
        
        <div className="uso-instalador__actions">
          <button 
            className="uso-instalador__btn"
            onClick={handleRefresh}
            title="Recarregar dados da semana"
          >
            ↻ Atualizar
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={showSunday}
              onChange={(e) => setShowSunday(e.target.checked)}
              aria-label="Domingo"
            />
            Domingo
          </label>
          <button 
            className="uso-instalador__btn"
            onClick={handleOpenUserSelector}
            title="Selecionar colaboradores que aparecem sempre"
          >
            👥 Colaboradores
          </button>
          <button 
            className="uso-instalador__btn"
            onClick={handleToggleAll}
            title={allExpanded ? 'Colapsar todos' : 'Expandir todos'}
          >
            {allExpanded ? '▼' : '▶'} {allExpanded ? 'Colapsar Todos' : 'Expandir Todos'}
          </button>
          <button 
            className="uso-instalador__btn uso-instalador__btn--primary"
            onClick={handleNewActivity}
          >
            ➕ Nova Atividade
          </button>
          <span className="uso-instalador__version">v{APP_VERSION}</span>
        </div>
      </div>
      
      {/* Mensagem de erro na edição inline de horário */}
      {editingCellError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '300px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          ⚠️ {editingCellError}
        </div>
      )}
      
      {/* Mensagem de erro na edição inline de duração */}
      {editingCellDurationError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '300px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          ⚠️ {editingCellDurationError}
        </div>
      )}
      
      {/* User Selector Modal */}
      {userSelectorOpen && (
        <div className="uso-instalador__modal-overlay" onClick={() => setUserSelectorOpen(false)}>
          <div className="uso-instalador__modal" onClick={(e) => e.stopPropagation()}>
            <div className="uso-instalador__modal-header">
              <h3>👥 Selecionar Colaboradores</h3>
              <button 
                className="uso-instalador__modal-close"
                onClick={() => setUserSelectorOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="uso-instalador__modal-subheader">
              Marque os colaboradores que devem aparecer sempre na linha do tempo, mesmo sem atividades:
            </div>
            <div className="uso-instalador__modal-search">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={userSearchFilter}
                onChange={(e) => setUserSearchFilter(e.target.value)}
                className="uso-instalador__modal-search-input"
              />
            </div>
            <div className="uso-instalador__modal-content">
              {isLoadingUsers ? (
                <div className="uso-instalador__modal-loading">
                  <div className="uso-instalador__loading-spinner"></div>
                  <span>Carregando usuários...</span>
                </div>
              ) : (
                <div className="uso-instalador__user-list">
                  {availableUsers
                    .filter(u => 
                      userSearchFilter === '' || 
                      u.fullname.toLowerCase().includes(userSearchFilter.toLowerCase())
                    )
                    .map(user => (
                      <div 
                        key={user.id}
                        className={`uso-instalador__user-item ${user.isFixed ? 'uso-instalador__user-item--selected' : ''}`}
                        onClick={() => handleToggleFixedUser(user.id)}
                      >
                        <div className="uso-instalador__user-checkbox">
                          {isTogglingUser === user.id ? (
                            <div className="uso-instalador__loading-spinner uso-instalador__loading-spinner--small"></div>
                          ) : (
                            user.isFixed ? '☑' : '☐'
                          )}
                        </div>
                        <div className="uso-instalador__user-info">
                          <span className="uso-instalador__user-name">{user.fullname}</span>
                          {user.email && (
                            <span className="uso-instalador__user-email">{user.email}</span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                  {availableUsers.length === 0 && !isLoadingUsers && (
                    <div className="uso-instalador__modal-empty">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="uso-instalador__modal-footer">
              <button 
                className="uso-instalador__btn"
                onClick={() => setUserSelectorOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Criação de Nova Atividade */}
      {createModalOpen && (
        <div className="uso-instalador__modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="uso-instalador__modal uso-instalador__modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="uso-instalador__modal-header">
              <h3>➕ Nova Atividade</h3>
              <button 
                className="uso-instalador__modal-close"
                onClick={() => setCreateModalOpen(false)}
                disabled={createSubmitting}
              >
                ✕
              </button>
            </div>
            
            {/* Step Indicator */}
            <div className="uso-instalador__modal-steps">
              <div className={`uso-instalador__modal-step ${currentModalStep === MODAL_STEPS.PROJECT_SELECTION ? 'uso-instalador__modal-step--active' : ''} ${selectedProject ? 'uso-instalador__modal-step--completed' : ''}`}>
                <span className="uso-instalador__modal-step-number">1</span>
                <span className="uso-instalador__modal-step-label">Projeto</span>
              </div>
              <div className="uso-instalador__modal-step-divider" />
              <div className={`uso-instalador__modal-step ${currentModalStep === MODAL_STEPS.ORDER_SELECTION ? 'uso-instalador__modal-step--active' : ''} ${selectedOS ? 'uso-instalador__modal-step--completed' : ''}`}>
                <span className="uso-instalador__modal-step-number">2</span>
                <span className="uso-instalador__modal-step-label">Ordem de Serviço</span>
              </div>
              <div className="uso-instalador__modal-step-divider" />
              <div className={`uso-instalador__modal-step ${currentModalStep === MODAL_STEPS.EMPLOYEE_SELECTION || currentModalStep === MODAL_STEPS.ACTIVITY_DETAILS ? 'uso-instalador__modal-step--active' : ''}`}>
                <span className="uso-instalador__modal-step-number">3</span>
                <span className="uso-instalador__modal-step-label">Detalhes</span>
              </div>
            </div>
            
            {/* Etapa 1: Seleção de Projeto */}
            {currentModalStep === MODAL_STEPS.PROJECT_SELECTION && (
              <>
                <div className="uso-instalador__modal-subheader">
                  Selecione o Projeto para a nova atividade:
                </div>

                {/* Campo de pesquisa */}
                <div className="uso-instalador__modal-search">
                  <input
                    className="uso-instalador__modal-search-input"
                    placeholder="Pesquisar projeto..."
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    aria-label="Pesquisar projetos"
                  />
                </div>

                <div className="uso-instalador__modal-content">
                  {createOSLoading ? (
                    <div className="uso-instalador__modal-loading">
                      <div className="uso-instalador__loading-spinner"></div>
                      <span>Carregando Projetos...</span>
                    </div>
                  ) : (
                    <div className="uso-instalador__os-list">
                      {availableProjects.map(project => (
                        <div 
                          key={project.id}
                          className="uso-instalador__os-item"
                          onClick={() => handleSelectProjectStep(project)}
                        >
                          <div className="uso-instalador__os-main">
                            <span className="uso-instalador__os-id">🏗️ {project.name}</span>
                          </div>
                          <div className="uso-instalador__os-details">
                            <span className="uso-instalador__os-projeto">Status: {project.status}</span>
                          </div>
                        </div>
                      ))}
                      {availableProjects.length === 0 && !createOSLoading && (
                        <div className="uso-instalador__modal-empty">
                          Nenhum projeto disponível
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="uso-instalador__modal-footer">
                  <button 
                    className="uso-instalador__btn"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
            
            {/* Etapa 2: Seleção de OS */}
            {currentModalStep === MODAL_STEPS.ORDER_SELECTION && (
              <>
                <div className="uso-instalador__modal-subheader">
                  <strong>Projeto:</strong> {selectedProject?.name}
                  <br />
                  Selecione a Ordem de Serviço:
                </div>
                {createError && (
                  <div className="uso-instalador__modal-error">
                    ⚠️ {createError}
                  </div>
                )}
                <div className="uso-instalador__modal-content">
                  {createOSLoading ? (
                    <div className="uso-instalador__modal-loading">
                      <div className="uso-instalador__loading-spinner"></div>
                      <span>Carregando Ordens de Serviço...</span>
                    </div>
                  ) : (
                    <div className="uso-instalador__os-list">
                      {availableOS.map(os => (
                        <div 
                          key={os.id}
                          className="uso-instalador__os-item"
                          onClick={() => handleSelectOS(os)}
                        >
                          <div className="uso-instalador__os-main">
                            <span className="uso-instalador__os-id">📋 {os.identificador}</span>
                          </div>
                          <div className="uso-instalador__os-details">
                            {os.clienteNome && (
                              <span className="uso-instalador__os-cliente">👤 {os.clienteNome}</span>
                            )}
                            {os.tipoOrdemServico && (
                              <div className="uso-instalador__os-tipo">🔖 {os.tipoOrdemServico}</div>
                            )}
                            {os.produtos && os.produtos.length > 0 ? (
                              <ProdutosDataGrid produtos={os.produtos} ordemId={os.id} onRequestServerSort={handleSortProdutos} loading={os.produtosLoading} />
                            ) : (
                              <div className="uso-instalador__os-no-produtos">Sem produtos</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {availableOS.length === 0 && !createOSLoading && (
                        <div className="uso-instalador__modal-empty">
                          Nenhuma OS encontrada para este projeto
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="uso-instalador__modal-footer">
                  <button 
                    className="uso-instalador__btn"
                    onClick={() => setCurrentModalStep(MODAL_STEPS.PROJECT_SELECTION)}
                  >
                    ← Voltar
                  </button>
                  <button 
                    className="uso-instalador__btn"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
            
            {/* Etapa 3: Detalhes da Atividade */}
            {currentModalStep === MODAL_STEPS.EMPLOYEE_SELECTION && selectedOS && (
              <>
                <div className="uso-instalador__modal-subheader">
                  <strong>Projeto:</strong> {selectedProject?.name}
                  <br />
                  <strong>OS Selecionada:</strong> {selectedOS.identificador}
                  {selectedOS.clienteNome && ` - ${selectedOS.clienteNome}`}
                </div>
                
                {createError && (
                  <div className="uso-instalador__modal-error">
                    ⚠️ {createError}
                  </div>
                )}
                
                <div className="uso-instalador__modal-content uso-instalador__modal-content--form">
                  {/* Colaborador */}
                  <div className="uso-instalador__form-field">
                    <label className="uso-instalador__form-label">
                      👷 Colaborador <span className="uso-instalador__form-required">*</span>
                    </label>
                    {createUsersLoading ? (
                      <div className="uso-instalador__loading">Carregando...</div>
                    ) : (
                      <select
                        className="uso-instalador__form-select"
                        value={createSelectedEmployee}
                        onChange={(e) => setCreateSelectedEmployee(e.target.value)}
                        disabled={createSubmitting}
                      >
                        <option value="">Selecione o colaborador</option>
                        {createUsersList.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.fullname}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Data do Agendamento */}
                  <div className="uso-instalador__form-field">
                    <label className="uso-instalador__form-label">
                      📅 Data do Agendamento <span className="uso-instalador__form-required">*</span>
                    </label>
                    <input
                      type="date"
                      className="uso-instalador__form-input"
                      value={createAgendamentoDate}
                      min={(() => {
                        const today = new Date();
                        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      })()}
                      onChange={(e) => setCreateAgendamentoDate(e.target.value)}
                      disabled={createSubmitting}
                    />
                    <span className="uso-instalador__form-hint">
                      ⚠️ Apenas datas futuras são permitidas
                    </span>
                  </div>
                  
                  {/* Horário */}
                  <div className="uso-instalador__form-field">
                    <label className="uso-instalador__form-label">
                      🕐 Horário <span className="uso-instalador__form-required">*</span>
                    </label>
                    <input
                      type="time"
                      className="uso-instalador__form-input"
                      value={createAgendamentoTime}
                      onChange={(e) => setCreateAgendamentoTime(e.target.value)}
                      disabled={createSubmitting}
                    />
                  </div>
                  
                  {/* Duração */}
                  <div className="uso-instalador__form-field">
                    <label className="uso-instalador__form-label">
                      ⏱️ Duração
                    </label>
                    <select
                      className="uso-instalador__form-select"
                      value={createDuracao}
                      onChange={(e) => setCreateDuracao(Number(e.target.value))}
                      disabled={createSubmitting}
                    >
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                      <option value={180}>3 horas</option>
                      <option value={240}>4 horas</option>
                      <option value={300}>5 horas</option>
                      <option value={360}>6 horas</option>
                      <option value={420}>7 horas</option>
                      <option value={480}>8 horas</option>
                    </select>
                  </div>
                  
                  {/* Descrição */}
                  <div className="uso-instalador__form-field">
                    <label className="uso-instalador__form-label">
                      📝 Descrição <span style={{color: 'red'}}>*</span>
                    </label>
                    <textarea
                      className="uso-instalador__form-textarea"
                      value={createDescricao}
                      onChange={(e) => setCreateDescricao(e.target.value)}
                      placeholder="insira a descrição aqui"
                      rows={3}
                      disabled={createSubmitting}
                    />
                  </div>
                </div>
                
                <div className="uso-instalador__modal-footer">
                  <button 
                    className="uso-instalador__btn"
                    onClick={() => setCurrentModalStep(MODAL_STEPS.ORDER_SELECTION)}
                    disabled={createSubmitting}
                  >
                    ← Voltar
                  </button>
                  <button 
                    className="uso-instalador__btn"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={createSubmitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="uso-instalador__btn uso-instalador__btn--primary"
                    onClick={handleCreateActivity}
                    disabled={createSubmitting || !createSelectedEmployee}
                  >
                    {createSubmitting ? '⏳ Criando...' : '✅ Criar Atividade'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Grid */}
      <div className="uso-instalador__grid-container">
        <div className="uso-instalador__grid">
          {/* Header Row */}
          <div className="uso-instalador__grid-header">
            <div className="uso-instalador__grid-header-row">
              <div className="uso-instalador__grid-header-cell uso-instalador__grid-header-cell--name">
                Instalador / Projeto
              </div>
              {weekDaysWithToggle.map(day => (
                <div 
                  key={day.formattedDate}
                  className={`uso-instalador__grid-header-cell uso-instalador__grid-header-cell--day ${
                    day.isToday ? 'uso-instalador__grid-header-cell--today' : ''
                  }`}
                >
                  <span className="uso-instalador__header-day-label">{day.label}</span>
                  <span className="uso-instalador__header-day-date">{day.formattedDate}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Body */}
          <div className="uso-instalador__grid-body">
            {isLoading ? (
              <div className="uso-instalador__empty-row">
                <div className="uso-instalador__empty-cell uso-instalador__loading-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="uso-instalador__loading-spinner"></div>
                  <span>Carregando atividades...</span>
                </div>
              </div>
            ) : gridData.length === 0 ? (
              <div className="uso-instalador__empty-row">
                <div className="uso-instalador__empty-cell" style={{ gridColumn: '1 / -1' }}>
                  Nenhuma atividade encontrada para esta semana.
                </div>
              </div>
            ) : (
              gridData.map((data, index) => {
                const { installer, isExpanded, dailyHours, projectRows, othersRow, travelRow, totalAllocatedHours, capacityPercentage } = data;
                const colorInfo = InstallerColorMap[installer.color];
                
                return (
                  <div key={installer.id} style={{ display: 'contents' }}>
                    {/* Team Separator */}
                    {shouldShowSeparator(index, gridData) && (
                      <div className="uso-instalador__team-separator">
                        <div className="uso-instalador__team-separator-cell" style={{ gridColumn: '1 / -1' }} />
                      </div>
                    )}
                    
                    {/* Installer Row (Parent) */}
                    <div 
                      className="uso-instalador__installer-row"
                      style={{ backgroundColor: colorInfo.background }}
                      onClick={() => handleToggleExpand(installer.id)}
                    >
                      <div className="uso-instalador__installer-cell uso-instalador__installer-name-cell">
                        <div 
                          className="uso-instalador__color-bar uso-instalador__color-bar--clickable"
                          style={{ backgroundColor: colorInfo.primary }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const top = Math.max(8, rect.top);
                            const left = rect.left + rect.width + 8;
                            setColorPickerPos({ top, left });
                            setColorPickerOpen(colorPickerOpen === installer.id ? null : installer.id);
                          }}
                          title="Clique para alterar a cor"
                        />
                        {/* Color Picker Popup (Portal) */}
                        {colorPickerOpen === installer.id && createPortal(
                          <div className="uso-instalador__color-picker-overlay" onClick={() => setColorPickerOpen(null)}>
                            <div 
                              className="uso-instalador__color-picker"
                              onClick={(e) => e.stopPropagation()}
                              style={{ position: 'absolute', top: colorPickerPos?.top ?? 0, left: colorPickerPos?.left ?? 0 }}
                            >
                              <div className="uso-instalador__color-picker-header">
                                <span>Selecione a cor para a semana</span>
                                <button 
                                  className="uso-instalador__color-picker-close"
                                  onClick={() => setColorPickerOpen(null)}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="uso-instalador__color-picker-grid">
                                {availableColors.map((color) => (
                                  <button
                                    key={color}
                                    className={`uso-instalador__color-picker-item ${installer.color === color ? 'uso-instalador__color-picker-item--selected' : ''}`}
                                    style={{ backgroundColor: InstallerColorMap[color].primary }}
                                    onClick={() => handleColorChange(installer.id, color)}
                                    disabled={isUpdatingColor}
                                    title={color}
                                  />
                                ))}
                              </div>
                              {isUpdatingColor && (
                                <div className="uso-instalador__color-picker-loading">
                                  Salvando...
                                </div>
                              )}
                            </div>
                          </div>,
                          document.body
                        )}
                        <div className="uso-instalador__installer-name-wrapper">
                          <button 
                            className={`uso-instalador__expand-btn ${
                              isExpanded ? 'uso-instalador__expand-btn--expanded' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpand(installer.id);
                            }}
                          >
                            ▶
                          </button>
                          <div className="uso-instalador__installer-info">
                            <span className="uso-instalador__installer-name">
                              {installer.name}
                            </span>
                            <span className={`uso-instalador__installer-capacity ${getCapacityClass(capacityPercentage)}`}>
                              ({totalAllocatedHours}h/{installer.weeklyCapacity}h)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {dailyHours.map((dayHours, dayIndex) => {
                        // Determine merge group membership for this installer/day
                        const groups = verticalMergeGroups[dayIndex] || [];
                        const group = groups.find(g => index >= g.start && index < g.start + g.len);
                        let cellMergeClass = 'uso-instalador__installer-cell';
                        if (group) {
                          const pos = index - group.start;
                          if (pos === 0) cellMergeClass += ' uso-instalador__installer-cell--merged-top';
                          else if (pos === group.len - 1) cellMergeClass += ' uso-instalador__installer-cell--merged-bottom';
                          else cellMergeClass += ' uso-instalador__installer-cell--merged-middle';
                        }

                        return (
                          <div 
                            key={dayIndex}
                            className={cellMergeClass}
                          >
                            {renderHoursCell(
                              dayHours.totalHours,
                              dayHours,
                              true,
                              false,
                              weekDaysWithToggle[dayIndex].isToday,
                              undefined,
                              !isExpanded,
                              index,
                              dayIndex
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Project Rows (Children) - only show if expanded */}
                    {isExpanded && projectRows.map((project, projIndex) => (
                      <div 
                        key={project.projectId}
                        className="uso-instalador__project-row"
                        style={{ backgroundColor: colorInfo.background }}
                      >
                        <div className="uso-instalador__project-cell uso-instalador__project-name-cell">
                          <div className="uso-instalador__project-name-wrapper">
                            <span className="uso-instalador__project-indent">
                              {projIndex === projectRows.length - 1 && !othersRow && !travelRow ? '└─' : '├─'}
                            </span>
                            <span className="uso-instalador__project-icon">
                              {ActivityTypeIcons[project.type]}
                            </span>
                            <span 
                              className="uso-instalador__project-name"
                              title={project.projectName}
                            >
                              {project.projectName}
                            </span>
                          </div>
                        </div>
                        
                        {weekDaysWithToggle.map((day, dayIndex) => {
                          const dateKey = formatDateKey(day.date);
                          const hours = project.hoursByDay.get(dateKey) || 0;
                          const activity = project.activities.find(a => 
                            formatDateKey(a.date) === dateKey
                          );
                          
                          return (
                            <div 
                              key={dayIndex}
                              className="uso-instalador__project-cell"
                            >
                              {renderHoursCell(hours, null, false, false, day.isToday, activity)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    {/* Others Row */}
                    {isExpanded && othersRow && (
                      <div 
                        className="uso-instalador__project-row"
                        style={{ backgroundColor: colorInfo.background }}
                      >
                        <div className="uso-instalador__project-cell uso-instalador__project-name-cell">
                          <div className="uso-instalador__project-name-wrapper">
                            <span className="uso-instalador__project-indent">
                              {!travelRow ? '└─' : '├─'}
                            </span>
                            <span className="uso-instalador__project-icon">📦</span>
                            <span 
                              className="uso-instalador__project-name"
                              title={`${othersRow.projectCount} projetos adicionais`}
                            >
                              Outros ({othersRow.projectCount} projetos)
                            </span>
                          </div>
                        </div>
                        
                        {weekDaysWithToggle.map((day, dayIndex) => {
                          const dateKey = formatDateKey(day.date);
                          const hours = othersRow.hoursByDay.get(dateKey) || 0;
                          
                          return (
                            <div 
                              key={dayIndex}
                              className="uso-instalador__project-cell"
                            >
                              {renderHoursCell(hours, null, false, false, day.isToday)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="uso-instalador__legend">
        <div className="uso-instalador__legend-item">
          <span className="uso-instalador__legend-icon">⚠️</span>
          <span>Sobrecarga (&gt;8h)</span>
        </div>
        <div className="uso-instalador__legend-item">
          <span className="uso-instalador__legend-icon">🔴</span>
          <span>Crítico (&gt;12h)</span>
        </div>
        <div className="uso-instalador__legend-item">
          <span className="uso-instalador__legend-icon">🟥</span>
          <span>Conflito</span>
        </div>
        <div className="uso-instalador__legend-item">
          <span className="uso-instalador__legend-icon">🚗</span>
          <span>Deslocamento</span>
        </div>
        <div className="uso-instalador__legend-item">
          <span>—</span>
          <span>Sem alocação</span>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && <Tooltip activity={tooltip.activity} position={tooltip.position} />}
      
      {/* Detail Panel */}
      <DetailPanel 
        state={detailPanel}
        onClose={handleCloseDetail}
        onSave={handleSaveActivity}
        onCopy={handleCopyActivity}
      />
    </div>
  );
}