import { createRoot } from 'react-dom/client'
import { FluentProvider } from '@fluentui/react-components'
import './index.css'
import App from './App.tsx'
import PowerProvider from './PowerProvider.tsx'
import { theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <PowerProvider>
    <FluentProvider theme={theme}>
      <App />
    </FluentProvider>
  </PowerProvider>,
)
