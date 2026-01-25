# Power Apps Code App - Instruções do Agente

## Comportamento Geral
- Continue trabalhando até resolver completamente a tarefa
- Planeje antes de cada ação, reflita após cada uma
- Use ferramentas para inspecionar código - nunca assuma
- Faça apenas mudanças necessárias e intencionais

## ⚠️ REGRAS CRÍTICAS

### 1. Atualização de Versão
Atualizar `src/version.ts` **apenas quando**:
- Publicar no PowerApps (`pac code push`)
- Usuário solicitar explicitamente

> Versão exibida via `AppShell.tsx`

### 2. NUNCA Publicar Automaticamente
- Testar localmente com `npm run dev` primeiro
- Só executar `pac code push` com solicitação EXPLÍCITA do usuário
- Pedir confirmação antes de publicar

### 3. Gerar Metadados ao Importar Tabelas
**Caminho PAC**: `/Users/bschron/.dotnet/tools/pac`

```bash
/Users/bschron/.dotnet/tools/pac modelbuilder build \
  --entitynamesfilter "nome_entidade" --outdirectory ./metadata
```

**Checklist obrigatório:**
1. Executar PAC (gera `metadata/Entities/<entidade>.cs`)
2. Adicionar em `.power/schemas/appschemas/dataSourcesInfo.ts`
3. Criar `src/generated/services/<Entidade>Service.ts`
4. Criar `src/generated/models/<Entidade>Model.ts`
5. Exportar em `src/generated/index.ts`
6. Mapear em `power.config.json`
7. Documentar em `DATAVERSE_METADATA.md`
8. Atualizar `src/version.ts`

## Qualidade de Código
- Soluções simples e fáceis de manter
- Evitar duplicação - verificar funcionalidades existentes
- Refatorar arquivos > 200-300 linhas
- Nunca sobrescrever `.env` sem confirmação

## 🚨 Queries Delegáveis - OBRIGATÓRIO

**NUNCA filtrar localmente dados do Dataverse!**

```typescript
// ❌ PROIBIDO
const all = await Service.getAll();
const filtered = all.filter(r => r.status === 'active');

// ✅ CORRETO
const filtered = await Service.getAll({
  filter: "statecode eq 0",
  select: ['id', 'name'],
  orderBy: ['name asc'],
  top: 50
});
```

### Operadores OData
| Operador | Exemplo |
|----------|---------|
| `eq/ne/gt/ge/lt/le` | `status eq 'active'` |
| `and/or/not` | `status eq 'active' and price gt 100` |
| `contains/startswith/endswith` | `contains(name, 'search')` |

## Metadados Dataverse

**ANTES de CRUD**: Consultar `DATAVERSE_METADATA.md`

⚠️ Navigation Properties são **case-sensitive**:
```typescript
// ✅ CORRETO
payload['new_employee@odata.bind'] = '/systemusers(guid)';

// ❌ ERRADO - erro 0x80048d19
payload['new_Employee@odata.bind'] = '/systemusers(guid)';
```

## Setup Novo Projeto (Resumo)

### 1. Criar React + Vite
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install
npm i --save-dev @types/node
# Downgrade para React 18 (Fluent v9)
```

### 2. Configurar vite.config.ts
```typescript
export default defineConfig({
  base: "./",
  server: { host: "::", port: 3000 },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
});
```

### 3. tsconfig.app.json
```json
{ "compilerOptions": { "verbatimModuleSyntax": false } }
```

### 4. Instalar SDKs
```bash
npm install --save-dev "@pa-client/power-code-sdk@https://github.com/microsoft/PowerAppsCodeApps/releases/download/v0.0.2/6-18-pa-client-power-code-sdk-0.0.1.tgz"
npm install @fluentui/react-components @fluentui/react-icons
```

### 5. PowerProvider + FluentProvider
Envolver app com ambos providers.

### 6. Inicializar Power Apps
```bash
pac code init --displayName "App Name" -l "[caminho/vite.svg]"
```

### 7. Adicionar Data Sources
```bash
pac connection list  # Obter connectionId
pac code add-data-source -a "shared_sql" -c <connectionId> -sp "sp_Name" -d "server,db"
```

## Fluent UI v9 - Regras DataGrid
- Sorting/filtering sempre server-side
- Fornecer views desktop (table) e mobile (cards)
- Usar skeleton para loading states
- Reset página 1 ao mudar sort/filter

## Versionamento Semântico
| Tipo | Quando | Exemplo |
|------|--------|---------|
| MAJOR | Breaking changes | 1.0.0 → 2.0.0 |
| MINOR | Novas features | 1.0.0 → 1.1.0 |
| PATCH | Correções/ajustes | 1.0.0 → 1.0.1 |

## Referências
- Modelos/Serviços: `src/Models`, `src/Services`, `src/generated`
- Schemas: `.power/schemas`
- Metadados: `DATAVERSE_METADATA.md`, `metadata/Entities/*.cs`