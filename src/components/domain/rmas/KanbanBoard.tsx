import { ReactNode } from 'react';

interface KanbanBoardProps {
  children: ReactNode;
}

export function KanbanBoard({ children }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {children}
    </div>
  );
}
