import { createContext, ReactNode, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useIsDesktop } from '../hooks/useMediaQuery';

interface SidebarContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleExpanded: () => void;
  toggleMobileOpen: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const isDesktop = useIsDesktop();
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>('sidebar-expanded', true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpanded = () => {
    if (isDesktop) {
      setIsExpanded(!isExpanded);
    }
  };

  const toggleMobileOpen = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        toggleExpanded,
        toggleMobileOpen,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
