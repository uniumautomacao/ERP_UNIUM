/**
 * Layout de 3 colunas para a página de Orçamentos
 *
 * Estrutura:
 * - Coluna esquerda (200px): Tab Navigation
 * - Coluna central (flexível): Content Area
 * - Coluna direita (320px): AI Chat + Credits
 */

import { tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { LAYOUT } from '../../../features/orcamentos/constants';

interface OrcamentoLayoutProps {
  /** Conteúdo da coluna esquerda (Tab Navigation) */
  leftPanel: ReactNode;

  /** Conteúdo da coluna central (Content Area) */
  centerPanel: ReactNode;

  /** Conteúdo da coluna direita (AI Chat + Credits) */
  rightPanel: ReactNode;

  /** Classe CSS adicional */
  className?: string;
}

export function OrcamentoLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  className,
}: OrcamentoLayoutProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: tokens.spacingHorizontalM,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Tab Navigation */}
      <div
        style={{
          width: `${LAYOUT.TAB_NAVIGATION_WIDTH}px`,
          minWidth: `${LAYOUT.TAB_NAVIGATION_WIDTH}px`,
          maxWidth: `${LAYOUT.TAB_NAVIGATION_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacingVerticalS,
          overflow: 'auto',
        }}
      >
        {leftPanel}
      </div>

      {/* Center Panel - Content Area */}
      <div
        style={{
          flex: 1,
          minWidth: `${LAYOUT.CONTENT_MIN_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacingVerticalM,
          overflow: 'auto',
        }}
      >
        {centerPanel}
      </div>

      {/* Right Panel - AI Chat + Credits */}
      <div
        style={{
          width: `${LAYOUT.AI_CHAT_WIDTH}px`,
          minWidth: `${LAYOUT.AI_CHAT_WIDTH}px`,
          maxWidth: `${LAYOUT.AI_CHAT_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacingVerticalS,
          overflow: 'auto',
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
