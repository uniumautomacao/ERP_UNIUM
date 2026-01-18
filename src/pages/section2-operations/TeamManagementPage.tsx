import { useState } from 'react';
import { Button } from '@fluentui/react-components';
import {
  Add24Regular,
  Mail24Regular,
  Grid24Regular,
  DataBarVertical24Regular,
  Filter24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { TeamMemberCard } from '../../components/domain/team/TeamMemberCard';
import { CapacityBar } from '../../components/domain/team/CapacityBar';
import { teamMembers } from '../../data/mockData';
import { TeamMember } from '../../types';

type ViewMode = 'grid' | 'list';

export function TeamManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Calcular estatísticas
  const totalMembers = teamMembers.length;
  const departments = Array.from(new Set(teamMembers.map((m) => m.department)));
  const availableMembers = teamMembers.filter((m) => m.status === 'available' || m.status === 'away').length;
  const onLeaveMembers = teamMembers.filter((m) => m.status === 'on_leave').length;
  const averageCapacity = Math.round(
    teamMembers.reduce((sum, m) => sum + m.capacity, 0) / teamMembers.length
  );

  // Filtrar membros
  const filteredMembers =
    selectedDepartment === 'all'
      ? teamMembers
      : teamMembers.filter((m) => m.department === selectedDepartment);

  const primaryActions = [
    {
      id: 'add',
      label: 'Add Member',
      icon: <Add24Regular />,
      onClick: () => console.log('Add member'),
      appearance: 'primary' as const,
    },
    {
      id: 'invite',
      label: 'Send Invite',
      icon: <Mail24Regular />,
      onClick: () => console.log('Send invite'),
    },
  ];

  const secondaryActions = [
    {
      id: 'grid-view',
      label: 'Grid',
      icon: <Grid24Regular />,
      onClick: () => setViewMode('grid'),
      appearance: viewMode === 'grid' ? ('primary' as const) : ('subtle' as const),
    },
    {
      id: 'list-view',
      label: 'List',
      icon: <DataBarVertical24Regular />,
      onClick: () => setViewMode('list'),
      appearance: viewMode === 'list' ? ('primary' as const) : ('subtle' as const),
    },
  ];

  const overflowActions = [
    {
      id: 'filter',
      label: 'Advanced Filter',
      icon: <Filter24Regular />,
      onClick: () => console.log('Filter'),
    },
  ];

  return (
    <>
      <CommandBar
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
        overflowActions={overflowActions}
      />
      <PageHeader
        title="Team Management"
        kpis={[
          { label: 'Members', value: totalMembers },
          { label: 'Departments', value: departments.length },
          { label: 'Avg Capacity', value: `${averageCapacity}%` },
        ]}
      />
      <PageContainer>
        {/* Capacity Overview */}
        <div className="mb-6">
          <CapacityBar
            total={totalMembers}
            utilized={totalMembers - availableMembers - onLeaveMembers}
            available={availableMembers}
            onLeave={onLeaveMembers}
          />
        </div>

        {/* Department Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            appearance={selectedDepartment === 'all' ? 'primary' : 'secondary'}
            onClick={() => setSelectedDepartment('all')}
          >
            All
          </Button>
          {departments.map((dept) => {
            const count = teamMembers.filter((m) => m.department === dept).length;
            return (
              <Button
                key={dept}
                appearance={selectedDepartment === dept ? 'primary' : 'secondary'}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept} ({count})
              </Button>
            );
          })}
        </div>

        {/* Team Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onViewProfile={(m: TeamMember) => console.log('View profile', m)}
              />
            ))}
          </div>
        )}

        {/* Team List */}
        {viewMode === 'list' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
            }}
          >
            List view would be displayed here
          </div>
        )}
      </PageContainer>
    </>
  );
}
