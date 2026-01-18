import { Spinner, Text, tokens } from '@fluentui/react-components';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <Spinner size="large" />
      <Text
        size={400}
        style={{
          color: tokens.colorNeutralForeground3,
          marginTop: '16px',
        }}
      >
        {label}
      </Text>
    </div>
  );
}
