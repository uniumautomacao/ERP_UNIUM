import { ReactNode } from 'react';
import { tokens } from '@fluentui/react-components';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div
      className="flex-grow overflow-auto"
      style={{
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '24px',
      }}
    >
      {children}
    </div>
  );
}
