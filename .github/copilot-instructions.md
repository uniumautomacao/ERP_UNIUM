# General Coding Guidance

## General Behavior

- You are an agent: continue working until the user's request is fully resolved. 
  Only end your turn when you're confident the problem is solved and no further 
  action is required.

- Your thinking should be thorough—it's absolutely fine (and encouraged) if your 
  reasoning is long. Think step by step before and after each action you take.

- Plan extensively before making any function calls. Reflect critically after 
  each one. Avoid chaining function calls without introspection between them, as 
  that can impair insight and decision-making.

- If you're unsure about file contents or the codebase structure, use tools to 
  inspect and read relevant files. Never guess or make assumptions.

- Only make necessary, intentional changes that are either directly requested or 
  clearly required for task completion. Avoid editing unrelated or unclear areas.

## ⚠️ REGRAS CRÍTICAS - SEGUIR SEMPRE

### 1. Atualização de Versão Obrigatória
**TODA interação de código DEVE incluir atualização de versão em `src/version.ts`:**
- Incrementar `APP_VERSION` (mesmo para mudanças mínimas - isso ajuda a verificar 
  se a interface foi atualizada)
- Atualizar `APP_BUILD_DATE` para a data atual
- Adicionar entrada em `VERSION_HISTORY` descrevendo a mudança
- Use PATCH (0.0.X) para qualquer alteração pequena

### 2. NUNCA Publicar Automaticamente
**O agente NÃO deve executar `pac code push` sem solicitação explícita:**
- Sempre testar localmente primeiro usando `npm run dev`
- Verificar funcionamento no localhost antes de qualquer publicação
- Só publicar para o PowerApps quando o usuário solicitar explicitamente
- Quando o usuário pedir para publicar, perguntar confirmação antes de executar

### 3. 🚨 OBRIGATÓRIO: Gerar Metadados ao Importar Tabelas do Dataverse
**Ao adicionar/importar uma nova tabela do Dataverse, é OBRIGATÓRIO gerar os arquivos de metadados:**

Esta regra é **CRÍTICA** e **NÃO PODE SER IGNORADA**. Sem os arquivos de metadados, futuros agentes não terão informações sobre campos, tipos e navigation properties.

#### Caminho do PAC CLI neste projeto:
```bash
/Users/bschron/.dotnet/tools/pac
```

#### Comando obrigatório para cada nova tabela:
```bash
/Users/bschron/.dotnet/tools/pac modelbuilder build --entitynamesfilter "nome_da_entidade" --outdirectory ./metadata
```

#### Arquivos que DEVEM ser gerados/atualizados:
| Arquivo | Descrição |
|---------|-----------|
| `metadata/Entities/<entidade>.cs` | Metadados completos da entidade (campos, tipos, lookups) |
| `metadata/OptionSets/*.cs` | OptionSets globais usados pela entidade (se houver) |
| `metadata/EntityOptionSetEnum.cs` | Enums de option sets |
| `DATAVERSE_METADATA.md` | Documentação resumida (atualizar manualmente) |

#### Checklist obrigatório ao importar tabela:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🚨 CHECKLIST OBRIGATÓRIO AO IMPORTAR TABELA DO DATAVERSE                        │
│                                                                                  │
│  ☐ 1. Executar PAC para gerar metadados:                                        │
│       /Users/bschron/.dotnet/tools/pac modelbuilder build \                     │
│         --entitynamesfilter "nome_entidade" --outdirectory ./metadata           │
│                                                                                  │
│  ☐ 2. Verificar se metadata/Entities/<entidade>.cs foi criado                   │
│                                                                                  │
│  ☐ 3. Adicionar em .power/schemas/appschemas/dataSourcesInfo.ts                 │
│                                                                                  │
│  ☐ 4. Criar src/generated/services/<Entidade>Service.ts                         │
│                                                                                  │
│  ☐ 5. Criar src/generated/models/<Entidade>Model.ts                             │
│                                                                                  │
│  ☐ 6. Exportar em src/generated/index.ts                                        │
│                                                                                  │
│  ☐ 7. Mapear em power.config.json (dataSources)                                 │
│                                                                                  │
│  ☐ 8. Documentar em DATAVERSE_METADATA.md                                       │
│                                                                                  │
│  ☐ 9. Atualizar src/version.ts                                                  │
│                                                                                  │
│  ⚠️ SE O PAC NÃO ESTIVER NO PATH: usar o caminho completo acima                  │
│  ⚠️ SE O PAC NÃO FOR ENCONTRADO: informar ao usuário e pedir para instalar      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**IMPORTANTE**: Esta regra existe porque os arquivos de metadados são essenciais para:
- Conhecer os nomes exatos dos campos (case-sensitive!)
- Identificar navigation properties para lookups
- Saber os tipos de dados de cada campo
- Evitar erros de 0x80048d19 por nomes incorretos de campos

---

## Code Quality and Style

- Prefer simple solutions that are easy to understand and maintain.

- Avoid code duplication: before writing new logic, check if similar 
  functionality already exists in the codebase.

- Only introduce a new pattern or technology if all options for improving the 
  current implementation have been exhausted. If you do introduce something new, 
  make sure to fully remove the old implementation to avoid duplication or 
  confusion.

- Keep the codebase clean and organized. Use consistent patterns and naming 
  conventions where applicable.

- Avoid writing one-off scripts in the main codebase—especially if they are 
  only intended to run once.

- Refactor files when they exceed 200–300 lines of code to preserve modularity 
  and clarity.

- Never overwrite the .env file without asking for and receiving explicit 
  confirmation.

- Follow best practices around formatting and consistency. Use linters, 
  formatters, and style guides where appropriate.

## Coding Workflow

- Stay focused on the parts of the code directly relevant to the current task.

- Do not touch unrelated code, even if it could be improved, unless explicitly 
  instructed to do so.

- Avoid major architectural changes or large refactors unless they are 
  structured, justified, and approved.

- Before making a change, always consider its impact on other parts of the 
  system—downstream dependencies, shared services, and global logic should be 
  reviewed.

- Document or summarize your reasoning and decision-making if a change affects 
  multiple components.

---

# Building Power Apps Code Apps

Follow these steps in order to create a complete Power Apps Code App:

1. **Create a React App with Vite** - Set up the foundation
2. **Configure for Power Apps Code App** - Add Power Platform SDK integration
3. **Install Fluent UI v9** - Add the UI framework
4. **Build app to work locally with mocked data** - Develop and test locally
5. **Configure the app to run in Power Apps** - Set up Power Platform integration
6. **Wire up to real connectors** - Connect to live data sources
7. **Test and deploy** - Final testing and deployment

---

## Step 1: Create a React App with Vite

Always use TypeScript for better type safety and development experience.

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm i --save-dev @types/node
```

Replace `my-app` with the name of the app provided by the user.

IMPORTANT NOTE: You will need to downgrade to react 18 for use with Fluent v9.
---

## Step 2: Configure for Power Apps Code App

### Update Vite Configuration

Update your `vite.config.ts` to ensure proper configuration:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 3000,  // Important: Power Apps Code Apps require port 3000
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Critical TypeScript Configuration

Update `tsconfig.app.json` to set `verbatimModuleSyntax` to `false`:

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": false
  }
}
```

This is required to work with the Power SDK generated code.

### Install Power Platform SDK

Install the Power Platform SDK (currently from GitHub release):

```bash
npm install --save-dev "@pa-client/power-code-sdk@https://github.com/microsoft/PowerAppsCodeApps/releases/download/v0.0.2/6-18-pa-client-power-code-sdk-0.0.1.tgz"
```

### Update Package.json Scripts

Update the dev script in `package.json`:

```json
{
  "scripts": {
    "dev": "start pac code run && vite",
    "build": "tsc -b && vite build"
  }
}
```

**Note for macOS users**: Remove `start` from the dev script:
```json
{
  "scripts": {
    "dev": "vite && pac code run"
  }
}
```

### Create PowerProvider Component

Create `src/PowerProvider.tsx` with the following content:

```typescript
import React from 'react';
import { PowerProvider as Provider } from '@pa-client/power-code-sdk';

interface PowerProviderProps {
  children: React.ReactNode;
}

const PowerProvider: React.FC<PowerProviderProps> = ({ children }) => {
  return (
    <Provider>
      {children}
    </Provider>
  );
};

export default PowerProvider;
```

### Update main.tsx

Update `src/main.tsx` to include the PowerProvider:

```typescript
  <StrictMode>
    <PowerProvider>
      <App />
    </PowerProvider>
  </StrictMode>,
```

---

## Step 3: Install Fluent UI v9

### Install Fluent UI Packages

```bash
npm install @fluentui/react-components @fluentui/react-icons
```

### FluentProvider Setup

Wrap your app with FluentProvider for consistent theming:

```typescript
import { 
  FluentProvider, 
  webLightTheme, 
  webDarkTheme 
} from '@fluentui/react-components';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      {/* Your app content */}
    </FluentProvider>
  );
}
```

### Critical Implementation Rules for DataGrids

1. **Server-Side Only**: Never implement client-side sorting with compare functions
2. **Responsive Design**: Always provide both desktop table and mobile card views
3. **Loading States**: Include skeleton components for all data loading states
4. **Column Resizing**: Use columnSizingOptions with proper width constraints
5. **Pagination**: Reset to page 1 when changing sort or filter parameters
6. **Accessibility**: Implement proper ARIA labels and keyboard navigation

### Reference Documentation
- [Fluent UI DataGrid Documentation](https://fluentuipr.z22.web.core.windows.net/heads/master/public-docsite-v9/storybook/?path=/docs/components-datagrid--default)
- [Resizable Columns Example](https://github.com/microsoft/fluentui/blob/938a069ea4e0c460050e0dc147b9786e144cb6d3/packages/react-components/react-table/stories/src/DataGrid/ResizableColumns.stories.tsx)

### Common Implementation Patterns
- Use `makeStyles` for consistent styling with design tokens
- Implement `useEffect` hooks for data loading on parameter changes
- Use `useMemo` for column definitions to prevent unnecessary re-renders
- Handle loading, error, and empty states appropriately
- Implement proper accessibility with ARIA labels and keyboard navigation
- Use proper TypeScript interfaces for type safety

---

## Step 4: Build App to Work Locally with Mocked Data

### Data Access Service Interface Pattern

- Define TypeScript interfaces for all data operations (CRUD, search, pagination)
- Create contracts that both mock and real services will implement
- Ensure strongly-typed parameters and return types for all operations

- Implement singleton factory to manage service instances
- Allow runtime switching between mock and real services
- Provide single point of configuration for the entire application

#### Mock Services (Initial Implementation)

- Create mock implementations that simulate real data operations
- Include realistic test data and proper pagination/filtering simulation
- Provide comprehensive logging for development debugging
- **Start here - implement mock services first**

#### Real Services (Future Implementation)

- **Do not implement initially - focus on mock services**
- **Stored procedure names will be determined later**
- Will integrate with Power Apps generated service classes
- Must maintain same interface as mock services

### Accessibility Guidelines

#### ARIA Best Practices
- Always include `aria-label` or `aria-labelledby` for interactive elements
- Use `aria-describedby` for additional context
- Implement proper focus management with `tabIndex`
- Use semantic HTML elements when possible

#### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Implement proper tab order with `tabIndex`
- Use arrow keys for grid navigation
- Provide skip links for long content

#### Color and Contrast
- Use Fluent UI design tokens for consistent colors
- Ensure minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information

### Performance Optimization

#### React Best Practices
- Use `useMemo` and `useCallback` for expensive computations
- Implement proper dependency arrays in `useEffect`
- Use `React.memo` for components that don't need frequent re-renders
- Implement proper key props for lists

#### Data Loading Patterns
- Implement server-side pagination for large datasets
- Use loading skeletons instead of spinners
- Implement proper error boundaries
- Cache API responses where appropriate

#### Bundle Optimization
- Use dynamic imports for code splitting
- Implement proper tree shaking
- Optimize images and assets
- Use Vite's built-in optimization features

### Responsive Design Guidelines

#### Mobile-First Approach
- Design for mobile screens first, then enhance for larger screens
- Use Fluent UI's responsive breakpoints
- Implement touch-friendly interactions (minimum 44px tap targets)

#### Layout Patterns
- Use CSS Grid and Flexbox for responsive layouts
- Implement proper viewport meta tags
- Use relative units (rem, em, %) instead of fixed pixels
- Test on various screen sizes and orientations

#### Component Responsiveness
- Provide alternative layouts for different screen sizes
- Use compound components for complex responsive patterns
- Implement proper overflow handling
- Consider content hierarchy on smaller screens

### Local Development Testing

```bash
npm run dev
```

This starts both the Vite development server and Power SDK server.

---

## Step 5: Configure the App to Run in Power Apps

### Power Platform Setup

First release environment is required. Confirm with the user:

```bash
pac admin create --name 'Code Apps' --region 'unitedstatesfirstrelease' --type 'Developer'
```

Authenticate and select environment:

```bash
pac auth create --environment {environment id}
pac auth who  # Verify correct environment is selected
```

### Initialize Power Apps Code App

Configure the Power Apps Code App:

```bash
pac code init --displayName "My App" -l "[location of the vite.svg]"    
```

**Note:** Replace "My App" with the actual app name provided by the user. 
Replace [location of the vite.svg] with the real location

---

## Step 6: Wire Up to Real Connectors

Initially use mocked data for development. Once the app is ready, replace with 
actual data sources.

Confirm everything is working with mocked data before integrating with real 
data sources.

### Get Connection IDs

List available connections to find the connection ID:

```bash
pac connection list
```

This will show all available connections with their IDs and names.

### Add Office 365 Connection

For Office 365 Users:

```bash
pac code add-data-source -a "shared_office365users" -c <connectionId>
```

### Add SQL Data Source

Discover the stored procedures available in your database using the MSSQL tool 
or ask the user to provide them.

Example stored procedures for a typical CRUD application:

```bash
pac code add-data-source -a "shared_sql" -c <connectionId> \
  -sp "sp_CreateClient" -d "server.database.windows.net,database"
```

**Note:** Replace the stored procedure names and server name with the actual 
procedures available in your database. Ask the user to provide their specific 
stored procedure names or use the MSSQL tool to discover them.

---

## Step 7: Test and Deploy

## ⚠️ IMPORTANTE: Controle de Versão e Publicação

### Regra 1: Versão Atualizada em TODA Mudança de Código
**Qualquer alteração de código, por menor que seja, DEVE atualizar a versão:**
- Isso é OBRIGATÓRIO para ajudar a verificar se a interface foi atualizada
- Mesmo ajustes de estilo, correções de typo ou pequenas mudanças exigem incremento
- Use PATCH (0.0.X) para mudanças pequenas

### Regra 2: NUNCA Publicar Sem Solicitação
**O agente NÃO pode executar `pac code push` automaticamente:**
- Testar TUDO localmente primeiro usando `npm run dev` (localhost:3000)
- Verificar funcionamento completo antes de qualquer publicação
- Só publicar quando o usuário SOLICITAR EXPLICITAMENTE
- Quando solicitado, PERGUNTAR CONFIRMAÇÃO antes de executar o push

### Regras de Versionamento (Semantic Versioning)

| Tipo | Quando Incrementar | Exemplo |
|------|-------------------|----------|
| **MAJOR** (X.0.0) | Mudanças que quebram compatibilidade, redesign completo | 1.0.0 → 2.0.0 |
| **MINOR** (0.X.0) | Novas funcionalidades, melhorias significativas | 1.0.0 → 1.1.0 |
| **PATCH** (0.0.X) | Correções de bugs, ajustes de estilo | 1.0.0 → 1.0.1 |

### Arquivo de Versão: `src/version.ts`

```typescript
export const APP_VERSION = 'X.Y.Z';  // Atualizar aqui
export const APP_BUILD_DATE = 'YYYY-MM-DD';  // Data do push
export const VERSION_HISTORY = [
  { version: 'X.Y.Z', date: 'YYYY-MM-DD', changes: 'Descrição das mudanças' },
];
```

### Build and Deploy

```bash
npm run build
pac code push
```

### Common Issues and Troubleshooting

- **Port 3000 Required**: Power Apps Code Apps require port 3000
- **PowerProvider Issues**: Ensure PowerProvider.tsx is properly configured
- **Build Errors**: Run `npm run build` before deploying
- **Authentication**: Use same browser profile as Power Platform tenant

---

## Using Model and Service

- Read the files under src\Models and src\Services folder for data binding.
- Read the files under .power\schemas folder for other schema reference.

---

## 🚨 REGRA CRÍTICA: Queries Delegáveis - NUNCA Filtrar Localmente

### ⚠️ PROIBIDO: Filtros Locais em Dados do Dataverse

**NUNCA implemente código que:**
- Busque uma lista completa de registros e depois filtre localmente com `.filter()`
- Use `.find()`, `.some()`, `.every()` em dados que vieram do Dataverse
- Carregue mais dados do que o necessário e depois reduza com JavaScript/TypeScript

### ✅ OBRIGATÓRIO: Queries Delegáveis (Server-Side)

**SEMPRE use parâmetros de query delegáveis no Dataverse:**

```typescript
// ❌ ERRADO - Buscar tudo e filtrar localmente
const allRecords = await MyService.getAll();
const filtered = allRecords.filter(r => r.status === 'active');

// ✅ CORRETO - Filtrar no servidor
const filtered = await MyService.getAll({
  filter: "status eq 'active'"
});
```

### Parâmetros Delegáveis Suportados

Use sempre que possível na opção `IGetAllOptions`:

| Parâmetro | Uso | Exemplo |
|-----------|-----|---------|
| `filter` | Filtrar registros no servidor | `filter: "status eq 'active'"` |
| `select` | Selecionar apenas campos necessários | `select: ['id', 'name', 'status']` |
| `expand` | Expandir lookups relacionados | `expand: ['customer', 'owner']` |
| `orderBy` | Ordenar no servidor | `orderBy: ['createdon desc']` |
| `top` | Limitar quantidade de registros | `top: 50` |

### Exemplos de Queries Delegáveis Corretas

#### Filtro Simples
```typescript
// Buscar apenas fabricantes ativos
const result = await ManufacturerService.getAll({
  filter: "statecode eq 0",
  select: ['cr22f_fabricantesfromsharpointlistid', 'cr22f_name'],
  orderBy: ['cr22f_name asc']
});
```

#### Filtro com Lookup
```typescript
// Buscar produtos de um fabricante específico
const result = await ProductService.getAll({
  filter: `_cr22f_fabricante_value eq ${manufacturerId}`,
  select: ['cr22f_name', 'cr22f_modelo'],
  expand: ['cr22f_fabricante($select=cr22f_name)']
});
```

#### Filtro com Múltiplas Condições
```typescript
// Buscar conexões ativas de um dispositivo
const result = await ConnectionService.getAll({
  filter: `_new_deviceio_value eq ${deviceId} and statecode eq 0`,
  select: ['new_deviceioconnectionid', 'new_name', 'new_direction'],
  orderBy: ['createdon desc'],
  top: 100
});
```

#### Busca com Texto (contains/startswith/endswith)
```typescript
// Buscar por nome que contém texto
const result = await ProductService.getAll({
  filter: `contains(cr22f_name, '${searchTerm}')`,
  select: ['cr22f_modelosdeprodutofromsharepointlistid', 'cr22f_name']
});
```

### 🎯 Por Que Queries Delegáveis São Obrigatórias

1. **Performance**: Evita transferir dados desnecessários pela rede
2. **Escalabilidade**: Funciona mesmo com milhares de registros
3. **Limites do Dataverse**: O Dataverse tem limites de paginação (5000 registros)
4. **Experiência do Usuário**: Respostas mais rápidas
5. **Custo**: Reduz uso de API calls e transferência de dados

### ❌ Exemplos de Código PROIBIDO

```typescript
// ❌ NUNCA FAZER ISSO - Buscar tudo e filtrar localmente
const allManufacturers = await ManufacturerService.getAll();
const activeManufacturers = allManufacturers.filter(m => m.statecode === 0);

// ❌ NUNCA FAZER ISSO - Buscar tudo e ordenar localmente
const allProducts = await ProductService.getAll();
const sortedProducts = allProducts.sort((a, b) => a.name.localeCompare(b.name));

// ❌ NUNCA FAZER ISSO - Buscar tudo e limitar localmente
const allConnections = await ConnectionService.getAll();
const limitedConnections = allConnections.slice(0, 10);

// ❌ NUNCA FAZER ISSO - Buscar tudo e procurar localmente
const allDevices = await DeviceService.getAll();
const device = allDevices.find(d => d.id === deviceId);
```

### ✅ Versões Corretas dos Exemplos Acima

```typescript
// ✅ CORRETO - Filtrar no servidor
const activeManufacturers = await ManufacturerService.getAll({
  filter: "statecode eq 0"
});

// ✅ CORRETO - Ordenar no servidor
const sortedProducts = await ProductService.getAll({
  orderBy: ['cr22f_name asc']
});

// ✅ CORRETO - Limitar no servidor
const limitedConnections = await ConnectionService.getAll({
  top: 10,
  orderBy: ['createdon desc']
});

// ✅ CORRETO - Buscar registro específico
const device = await DeviceService.get(deviceId);
```

### 📚 Referência de Sintaxe OData Filter

O Dataverse usa OData para queries. Principais operadores:

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `eq` | Igual | `status eq 'active'` |
| `ne` | Diferente | `status ne 'inactive'` |
| `gt` | Maior que | `createdon gt 2024-01-01` |
| `ge` | Maior ou igual | `price ge 100` |
| `lt` | Menor que | `createdon lt 2024-12-31` |
| `le` | Menor ou igual | `price le 500` |
| `and` | E lógico | `status eq 'active' and price gt 100` |
| `or` | Ou lógico | `status eq 'active' or status eq 'pending'` |
| `not` | Negação | `not (status eq 'inactive')` |
| `contains` | Contém texto | `contains(name, 'search')` |
| `startswith` | Começa com | `startswith(name, 'A')` |
| `endswith` | Termina com | `endswith(name, 'Ltd')` |

### 🔍 Quando Revisar Código Existente

Se encontrar código que:
- Usa `.filter()` em dados do Dataverse
- Carrega listas completas sem parâmetros
- Faz paginação ou ordenação no client-side

**→ REFATORE imediatamente para usar queries delegáveis!**

---

## 📊 Dataverse Metadata Reference

### ⚠️ REGRA OBRIGATÓRIA para operações CRUD no Dataverse

**ANTES de criar ou modificar qualquer código que faça create/update/delete em tabelas do Dataverse:**

1. **PRIMEIRO**: Consulte o arquivo `DATAVERSE_METADATA.md` na raiz do projeto
2. **VERIFIQUE**: Os nomes exatos de campos e navigation properties (são case-sensitive!)
3. **SE A TABELA NÃO ESTIVER DOCUMENTADA ou HOUVER DÚVIDA**: Execute o PAC para verificar

### Arquivos de Referência de Metadados

| Arquivo | Conteúdo |
|---------|----------|
| `DATAVERSE_METADATA.md` | Documentação resumida de todas as tabelas (CONSULTAR PRIMEIRO) |
| `metadata/Entities/*.cs` | Arquivos C# com metadados completos gerados pelo PAC |

### ⚠️ Cuidado com Navigation Properties!
Os nomes de navigation properties são **case-sensitive** e podem variar:
```typescript
// ✅ CORRETO - new_employee é minúsculo!
payload['new_employee@odata.bind'] = '/systemusers(guid)';

// ✅ CORRETO - new_OrdemdeServico é CamelCase!
payload['new_OrdemdeServico@odata.bind'] = '/new_ordemdeservicofieldcontrols(guid)';

// ❌ INCORRETO - vai dar erro 0x80048d19!
payload['new_Employee@odata.bind'] = '/systemusers(guid)';
```

### Quando Usar PAC para Verificar/Atualizar Metadados

Use o comando PAC quando:
- A tabela não estiver documentada em `DATAVERSE_METADATA.md`
- Houver suspeita de que os metadados estão desatualizados
- O usuário reportar erro relacionado a campos/lookups
- Uma nova tabela for adicionada ao projeto

```bash
# Verificar/atualizar metadados de uma tabela específica
pac modelbuilder build --entitynamesfilter "nome_da_tabela" --outdirectory ./metadata
```

### 🔄 Fluxo de Trabalho para Operações CRUD no Dataverse

```
┌─────────────────────────────────────────────────────────────┐
│  1. Consultar DATAVERSE_METADATA.md                         │
│     ↓                                                       │
│  2. Tabela documentada e informações claras?                │
│     ├─ SIM → Usar nomes exatos do arquivo                   │
│     └─ NÃO ou DÚVIDA → Executar PAC para verificar         │
│     ↓                                                       │
│  3. Implementar código com nomes EXATOS (case-sensitive!)   │
│     ↓                                                       │
│  4. Testar localmente antes de publicar                     │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 REGRA: Atualizar Metadados do Projeto

**Sempre que executar o PAC para verificar metadados, ATUALIZE os arquivos do projeto:**

1. **Executar PAC** para gerar/atualizar os arquivos C# em `metadata/`:
   ```bash
   pac modelbuilder build --entitynamesfilter "nome_da_entidade" --outdirectory ./metadata
   ```

2. **Atualizar `DATAVERSE_METADATA.md`** com as informações novas/corrigidas:
   - Adicionar nova tabela se não existir
   - Corrigir navigation properties se estavam errados
   - Adicionar novos campos relevantes

3. **Documentar a atualização** no histórico de versão em `src/version.ts`

Isso garante que:
- ✅ Os metadados do projeto estejam sempre atualizados
- ✅ Futuros agentes/sessões do Copilot terão a informação correta
- ✅ Evita repetir o mesmo erro de casing em navigation properties

### Exemplo de Atualização de Metadados

Se descobrir que um campo tem casing diferente do documentado:

```bash
# 1. Verificar os metadados atuais
pac modelbuilder build --entitynamesfilter "new_atividadefieldcontrol" --outdirectory ./metadata

# 2. Ler o arquivo gerado para confirmar o nome correto
# metadata/Entities/new_atividadefieldcontrol.cs

# 3. Atualizar DATAVERSE_METADATA.md com a correção

# 4. Atualizar version.ts
```

### 🆕 REGRA: Adicionar Nova Tabela do Dataverse ao Projeto

**Sempre que uma nova tabela do Dataverse for adicionada ao projeto, OBRIGATORIAMENTE seguir TODOS os passos abaixo:**

⚠️ **ATENÇÃO**: Esta é uma regra crítica! Ver também a Regra 3 nas "REGRAS CRÍTICAS" no início deste documento.

#### Passo 1: Gerar Metadados da Entidade (OBRIGATÓRIO!)

**IMPORTANTE**: O `pac` pode não estar no PATH. Neste projeto, use o caminho completo:

```bash
# Caminho do PAC CLI neste projeto:
/Users/bschron/.dotnet/tools/pac modelbuilder build --entitynamesfilter "nome_da_entidade" --outdirectory ./metadata
```

Se o comando `pac` não funcionar diretamente, tente:
1. Verificar se existe em `/Users/bschron/.dotnet/tools/pac`
2. Ou procurar com: `mdfind "kMDItemFSName == 'pac'" | head -n 10`
3. Ou verificar se está autenticado: `/Users/bschron/.dotnet/tools/pac auth list`

Este passo é **CRÍTICO** porque gera os arquivos em `metadata/Entities/` que contêm:
- Nomes exatos dos campos (case-sensitive!)
- Navigation properties para lookups
- Tipos de dados
- OptionSets relacionados

#### Passo 2: Ler o Arquivo C# Gerado
Ler `metadata/Entities/nome_da_entidade.cs` e identificar:
- `EntityLogicalName` (nome singular da tabela)
- `EntitySetName` (nome plural usado em queries)
- `EntityLogicalCollectionName`
- Primary Key (campo ID)
- Campos de Lookup (EntityReference) e seus Navigation Properties
- Campos importantes para o uso no app

#### Passo 3: Registrar no dataSourcesInfo.ts
Adicionar a nova entidade em `.power/schemas/appschemas/dataSourcesInfo.ts`:

```typescript
export const dataSourcesInfo = {
  // ... outras entidades
  "nome_entityset": {
    "tableId": "",
    "version": "",
    "primaryKey": "nome_da_primarykey",
    "dataSourceType": "Dataverse",
    "apis": {}
  }
};
```

**⚠️ IMPORTANTE**: Use o `EntitySetName` (plural) como chave do objeto!

#### Passo 4: Criar o Serviço TypeScript
Criar `src/generated/services/NomeDaEntidadeService.ts` seguindo o padrão:

```typescript
/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is autogenerated. Do not edit this file directly.
 */

import type { GetEntityMetadataOptions, EntityMetadata } from '@microsoft/power-apps/data/metadata/dataverse';
import type { IGetOptions, IGetAllOptions } from '../models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';

export class NomeDaEntidadeService {
  private static readonly dataSourceName = 'entityset_name'; // EntitySetName aqui!

  private static readonly client = getClient(dataSourcesInfo);

  public static async create(record: Record<string, any>): Promise<IOperationResult<any>> {
    const result = await NomeDaEntidadeService.client.createRecordAsync<Record<string, any>, any>(
      NomeDaEntidadeService.dataSourceName,
      record
    );
    return result;
  }

  public static async update(id: string, changedFields: Partial<Record<string, any>>): Promise<IOperationResult<any>> {
    const result = await NomeDaEntidadeService.client.updateRecordAsync<Partial<Record<string, any>>, any>(
      NomeDaEntidadeService.dataSourceName,
      id.toString(),
      changedFields
    );
    return result;
  }

  public static async delete(id: string): Promise<void> {
    await NomeDaEntidadeService.client.deleteRecordAsync(
      NomeDaEntidadeService.dataSourceName,
      id.toString());
  }

  public static async get(id: string, options?: IGetOptions): Promise<IOperationResult<any>> {
    const result = await NomeDaEntidadeService.client.retrieveRecordAsync<any>(
      NomeDaEntidadeService.dataSourceName,
      id.toString(),
      options
    );
    return result;
  }

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<any[]>> {
    const result = await NomeDaEntidadeService.client.retrieveMultipleRecordsAsync<any>(
      NomeDaEntidadeService.dataSourceName,
      options
    );
    return result;
  }

  public static getMetadata(
    options: GetEntityMetadataOptions<any> = {}
  ): Promise<IOperationResult<Partial<EntityMetadata>>> {
    return NomeDaEntidadeService.client.executeAsync({
      dataverseRequest: {
        action: 'getEntityMetadata',
        parameters: {
          tableName: NomeDaEntidadeService.dataSourceName,
          options: options as GetEntityMetadataOptions,
        },
      },
    });
  }
}
```

#### Passo 5: Exportar o Serviço
Adicionar export em `src/generated/index.ts`:

```typescript
// Services
export * from './services/NomeDaEntidadeService';
```

#### Passo 6: Mapear em power.config.json
Adicionar o data source em `power.config.json` dentro de `databaseReferences.default.cds.dataSources`:

```json
{
  "databaseReferences": {
    "default.cds": {
      "dataSources": {
        "entityset_name": {
          "entitySetName": "entityset_name",
          "logicalName": "entity_logical_name",
          "isHidden": false
        }
      }
    }
  }
}
```

**⚠️ IMPORTANTE**: 
- Chave do objeto = `EntitySetName` (plural)
- `entitySetName` = `EntitySetName` (plural)
- `logicalName` = `EntityLogicalName` (singular)

#### Passo 7: Documentar em DATAVERSE_METADATA.md
Adicionar a nova tabela seguindo o padrão:

```markdown
## 🔵 nome_da_entidade (Nome Amigável)

### Informações Básicas
```
EntityLogicalName:                nome_da_entidade
EntityLogicalCollectionName:      nome_da_entidades
EntitySetName:                    nome_da_entidades
PrimaryKey:                       nome_da_entidadeid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| lookup_field | navigation_property | target_entities |

### Campos Principais
| AttributeLogicalName | Type | Notas |
|----------------------|------|-------|
| campo | Tipo | Descrição |
```

**Também atualizar a tabela de índice no início do arquivo:**
```markdown
| Nova Entidade | `nome_da_entidade` | `nome_da_entidades` | `nome_da_entidadeid` |
```

#### Passo 8: Atualizar Versão
Atualizar `src/version.ts`:
- Incrementar `APP_VERSION` (PATCH para mudanças pequenas)
- Atualizar `APP_BUILD_DATE`
- Adicionar entrada em `VERSION_HISTORY`

### 📋 Fluxo Completo (Checklist)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🚨 FLUXO OBRIGATÓRIO PARA IMPORTAR TABELA DO DATAVERSE                          │
│                                                                                  │
│  ✅ 1. GERAR METADADOS (CRÍTICO - NÃO PULAR!):                                   │
│       /Users/bschron/.dotnet/tools/pac modelbuilder build \                     │
│         --entitynamesfilter "entidade" --outdirectory ./metadata                │
│     ↓                                                                           │
│  ✅ 2. Verificar se metadata/Entities/entidade.cs foi criado                    │
│     ↓                                                                           │
│  ✅ 3. Ler metadata/Entities/entidade.cs (identificar nomes exatos)             │
│     ↓                                                                           │
│  ✅ 4. Adicionar em .power/schemas/appschemas/dataSourcesInfo.ts                │
│     ↓                                                                           │
│  ✅ 5. Criar src/generated/services/EntidadeService.ts                          │
│     ↓                                                                           │
│  ✅ 6. Criar src/generated/models/EntidadeModel.ts                              │
│     ↓                                                                           │
│  ✅ 7. Exportar serviço e modelo em src/generated/index.ts                      │
│     ↓                                                                           │
│  ✅ 8. Mapear em power.config.json (dataSources)                                │
│     ↓                                                                           │
│  ✅ 9. Documentar em DATAVERSE_METADATA.md                                      │
│     ↓                                                                           │
│  ✅ 10. Atualizar src/version.ts (versão + histórico)                           │
│                                                                                  │
│  ⚠️ O PASSO 1 É CRÍTICO! Sem ele, não há informações sobre campos e lookups!    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ⚠️ ERROS COMUNS A EVITAR

1. **Esquecer de gerar metadados com PAC**: Sem os arquivos em `metadata/Entities/`, futuros agentes não saberão os nomes corretos dos campos.

2. **PAC não está no PATH**: Use o caminho completo: `/Users/bschron/.dotnet/tools/pac`

3. **Não verificar se o arquivo foi criado**: Sempre confirmar que `metadata/Entities/<entidade>.cs` existe após executar o PAC.

4. **Não atualizar DATAVERSE_METADATA.md**: Este arquivo é a referência rápida para operações CRUD.

### 🔍 Exemplo Real: cr22f_modelosdeprodutofromsharepointlist

**Do arquivo C# gerado:**
- EntityLogicalName: `cr22f_modelosdeprodutofromsharepointlist`
- EntitySetName: `cr22f_modelosdeprodutofromsharepointlists`
- PrimaryKey: `cr22f_modelosdeprodutofromsharepointlistid`

**dataSourcesInfo.ts:**
```typescript
"cr22f_modelosdeprodutofromsharepointlists": {
  "primaryKey": "cr22f_modelosdeprodutofromsharepointlistid",
  "dataSourceType": "Dataverse"
}
```

**power.config.json:**
```json
"cr22f_modelosdeprodutofromsharepointlists": {
  "entitySetName": "cr22f_modelosdeprodutofromsharepointlists",
  "logicalName": "cr22f_modelosdeprodutofromsharepointlist"
}
```

**Serviço:**
```typescript
export class Cr22fModelosdeprodutofromsharepointlistService {
  private static readonly dataSourceName = 'cr22f_modelosdeprodutofromsharepointlists';
  // ...
}
```