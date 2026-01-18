import { FluentProvider } from '@fluentui/react-components';
import EditorIOApp from '../../features/editor-io-dispositivos/App';
import { theme } from '../../features/editor-io-dispositivos/theme';

export function DispositivosIOPage() {
  return (
    <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <FluentProvider theme={theme}>
        <EditorIOApp />
      </FluentProvider>
    </div>
  );
}
