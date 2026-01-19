import { ReactNode } from 'react';

interface KanbanBoardProps {
  children: ReactNode;
}

export function KanbanBoard({ children }: KanbanBoardProps) {
  return (
    <div
      className="grid gap-4 pb-4"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {children}
    </div>
  );
}
