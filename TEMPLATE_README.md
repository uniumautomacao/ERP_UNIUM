# Template UI - Model-Driven App Moderno

Template de aplicação web completo inspirado nos **Microsoft Power Apps Model-Driven Apps modernos**, utilizando **React 18 + TypeScript + Fluent UI v9 + Tailwind CSS**.

## 🎨 Visual

Este template replica fielmente o visual e comportamento dos Model-Driven Apps do Power Platform, utilizando a biblioteca oficial Fluent UI da Microsoft.

## 🛠️ Stack Tecnológica

- **React 18.3.1** com TypeScript
- **@fluentui/react-components v9** - Biblioteca oficial Microsoft
- **@fluentui/react-icons** - Ícones oficiais
- **Tailwind CSS 3.4** - Apenas para layout (grid, flex, spacing)
- **React Router DOM v6** - Navegação
- **Recharts** - Gráficos customizados

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Componentes de layout principal
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CommandBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PageContainer.tsx
│   │   └── ThemeToggle.tsx
│   ├── shared/          # Componentes compartilhados
│   │   ├── KPICard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Timeline.tsx
│   │   ├── DataGrid.tsx
│   │   ├── FilterBar.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   ├── charts/          # Gráficos
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── DonutChart.tsx
│   │   ├── LineChart.tsx
│   │   └── GanttChart.tsx
│   └── domain/          # Componentes específicos de domínio
│       ├── inventory/
│       ├── projects/
│       └── team/
├── pages/
│   ├── section1-analytics/
│   │   ├── DashboardPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── ReportsPage.tsx
│   └── section2-operations/
│       ├── InventoryPage.tsx
│       ├── ProjectPlannerPage.tsx
│       └── TeamManagementPage.tsx
├── hooks/               # React hooks customizados
├── context/             # Contextos React
├── config/              # Configurações
├── types/               # Tipos TypeScript
├── data/                # Dados mockados
└── styles/              # Estilos globais
```

## 🚀 Como Usar

### 1. Instalação

```bash
npm install
```

### 2. Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### 3. Build para Produção

```bash
npm run build
```

## 📄 Páginas Disponíveis

### Analytics (Seção 1)
- **Dashboard** (`/dashboard`) - Visão executiva com KPIs
- **Analytics** (`/analytics`) - Análises profundas com filtros
- **Reports** (`/reports`) - Geração e exportação de relatórios

### Operations (Seção 2)
- **Inventory** (`/inventory`) - Gestão de estoque
- **Project Planner** (`/projects`) - Planejamento com Gantt
- **Team Management** (`/team`) - Gestão de equipe

## 🎨 Componentes Principais

### Layout

#### AppShell
Container principal que envolve toda a aplicação com FluentProvider e gerencia o layout responsivo.

#### Sidebar
Navegação lateral com:
- Expansível/colapsável (desktop)
- Overlay em tablet
- Drawer em mobile
- Toggle de tema claro/escuro
- Avatar e informações do usuário

#### CommandBar
Barra de comandos contextual no topo de cada página com:
- Ações primárias
- Ações secundárias
- Overflow menu

#### PageHeader
Cabeçalho de página com:
- Título e subtítulo
- KPIs opcionais
- Tabs opcionais

### Compartilhados

#### KPICard
Card para exibição de métricas com:
- Valor principal
- Trend (positivo/negativo/neutro)
- Label customizável

#### StatusBadge
Badge de status com cores semânticas:
- `active` (verde)
- `inactive` (azul)
- `pending` (amarelo)
- `error` (vermelho)
- `warning` (amarelo)

#### DataGrid
Wrapper do Fluent UI DataGrid com:
- Seleção múltipla
- Ordenação
- Colunas redimensionáveis
- Estado vazio customizável

#### Timeline
Lista de atividades com:
- Ícones por tipo de atividade
- Linha conectora
- Timestamps
- Informações do usuário

### Gráficos

Todos os gráficos usam Recharts com estilização Fluent UI:
- **AreaChart** - Gráfico de área
- **BarChart** - Gráfico de barras (vertical/horizontal)
- **DonutChart** - Gráfico de rosca
- **LineChart** - Gráfico de linhas múltiplas
- **GanttChart** - Diagrama de Gantt customizado

## 🎨 Tema e Estilização

### Cores Power Apps

O tema usa as cores oficiais do Power Apps:
- Primary: `#0078D4`
- Gradiente de azuis compatível

### Tokens Fluent UI

Use sempre `tokens.colorXxx` ao invés de cores hardcoded:

```typescript
import { tokens } from '@fluentui/react-components';

style={{
  backgroundColor: tokens.colorNeutralBackground1,
  color: tokens.colorNeutralForeground1,
}}
```

### Tailwind CSS

**Use apenas para layout**, nunca para estilização de componentes:

```tsx
// ✅ CORRETO - Layout
<div className="grid grid-cols-2 gap-4">

// ❌ ERRADO - Estilização
<div className="bg-blue-500 text-white">
```

## 📱 Responsividade

### Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 0,      // 0-767px
  tablet: 768,    // 768-1023px
  desktop: 1024,  // 1024-1279px
  wide: 1280,     // 1280px+
}
```

### Comportamentos

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Sidebar | Drawer | Colapsada (48px) | Expandida (280px) |
| KPI Cards | 2 cols | 2 cols | 4 cols |
| Charts | Stack | 2 cols | Grid definido |
| Team Cards | 1 col | 2 cols | 4 cols |

## 🔧 Hooks Customizados

### useTheme()
Gerencia tema claro/escuro com persistência em localStorage.

```typescript
const { theme, isDark, toggleTheme } = useTheme();
```

### useSidebar()
Controla estado da sidebar (expandida/colapsada/mobile).

```typescript
const { isExpanded, toggleExpanded, isMobileOpen, toggleMobileOpen } = useSidebar();
```

### useMediaQuery()
Detecta breakpoints.

```typescript
const isMobile = useIsMobile();
const isDesktop = useIsDesktop();
```

## 📊 Dados Mockados

Todos os dados mockados estão em `src/data/mockData.ts` com:
- KPIs (4 métricas)
- Revenue data (30 dias)
- Sales by region (4 regiões)
- Inventory items (60 itens)
- Project com 3 fases
- Team members (12 membros)
- Report templates (6 templates)
- E mais...

## 🎯 Regras de Desenvolvimento

### 1. Use Fluent UI para TODOS os componentes de interface
Nunca use HTML puro ou outras bibliotecas de UI.

### 2. Tailwind apenas para layout
Grid, flex, gap, padding, margin - nada mais.

### 3. Sempre use tokens do Fluent UI
Nunca use cores hardcoded como `#fff` ou `blue`.

### 4. Performance
- Use `useMemo` para cálculos pesados
- Use `useCallback` para handlers em listas grandes
- Implemente virtualization para listas com 100+ itens

### 5. Acessibilidade
- Sempre inclua `aria-label`
- Navegação por teclado
- Contraste de cores WCAG AA
- Respeite `prefers-reduced-motion`

## 🔄 Fluxo de Desenvolvimento

### Para adicionar nova página:

1. Criar página em `src/pages/`
2. Adicionar rota em `src/App.tsx`
3. Adicionar item no menu em `src/config/navigation.tsx`
4. Seguir estrutura padrão:
   ```tsx
   <>
     <CommandBar primaryActions={...} />
     <PageHeader title="..." />
     <PageContainer>
       {/* Conteúdo */}
     </PageContainer>
   </>
   ```

### Para adicionar novo componente:

1. Criar em pasta apropriada (`shared/`, `domain/`, etc)
2. Usar Fluent UI components como base
3. Adicionar tipos TypeScript
4. Documentar props

## 📚 Recursos

- [Fluent UI v9 Documentation](https://react.fluentui.dev/)
- [Fluent UI Storybook](https://react.fluentui.dev/?path=/docs/concepts-introduction--page)
- [Recharts Documentation](https://recharts.org/)
- [React Router v6](https://reactrouter.com/)

## ✨ Características

- ✅ Design idêntico aos Model-Driven Apps
- ✅ Tema claro/escuro com persistência
- ✅ Totalmente responsivo
- ✅ 6 páginas completas e funcionais
- ✅ Dados mockados realistas
- ✅ TypeScript 100%
- ✅ Componentes reutilizáveis
- ✅ Gráficos interativos
- ✅ Navegação fluida
- ✅ Acessibilidade (ARIA)

## 📝 Licença

Este é um template de demonstração. Adapte conforme necessário para seu projeto.

---

**Desenvolvido com ❤️ usando Fluent UI v9**
