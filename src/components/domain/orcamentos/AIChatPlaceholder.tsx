/**
 * Placeholder para AI Chat
 * Será implementado no futuro
 */

import { tokens } from '@fluentui/react-components';
import { Bot24Regular } from '@fluentui/react-icons';

export function AIChatPlaceholder() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacingVerticalXXL,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
        textAlign: 'center',
        minHeight: '200px',
      }}
    >
      <Bot24Regular
        style={{
          fontSize: '48px',
          color: tokens.colorNeutralForeground3,
          marginBottom: tokens.spacingVerticalM,
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: tokens.colorNeutralForeground2,
        }}
      >
        Em breve
      </p>
      <p
        style={{
          margin: 0,
          marginTop: tokens.spacingVerticalS,
          fontSize: '14px',
          color: tokens.colorNeutralForeground3,
          maxWidth: '250px',
        }}
      >
        Assistente AI para auxiliar na criação de orçamentos será implementado
        em breve
      </p>
    </div>
  );
}
