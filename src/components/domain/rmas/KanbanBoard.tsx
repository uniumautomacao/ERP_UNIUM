import { ReactNode } from 'react';

interface KanbanBoardProps {
  children: ReactNode;
}

export function KanbanBoard({ children }: KanbanBoardProps) {
  return (
    <div
      className="gap-4 pb-4"
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(320px, 1fr)',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
