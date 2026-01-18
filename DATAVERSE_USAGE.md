# Guia de Uso - Conexão Dataverse (systemusers)

## Visão Geral

Este projeto foi configurado com sucesso para conectar à tabela **systemusers** do Microsoft Dataverse.

## Arquivos Gerados

O comando `pac code add-data-source` gerou automaticamente os seguintes arquivos:

- **src/generated/models/SystemusersModel.ts** - Modelo de dados TypeScript com todos os tipos
- **src/generated/services/SystemusersService.ts** - Serviço com métodos CRUD
- **src/generated/models/CommonModels.ts** - Modelos comuns compartilhados
- **src/generated/index.ts** - Arquivo de índice para exports

## Configuração

A configuração foi adicionada automaticamente em `power.config.json`:

```json
{
  "databaseReferences": {
    "default.cds": {
      "state": "Configured",
      "instanceUrl": "https://dev-unium.crm2.dynamics.com/",
      "dataSources": {
        "users": {
          "entitySetName": "systemusers",
          "logicalName": "systemuser"
        }
      }
    }
  }
}
```

## Como Usar

### 1. Inicialização do SDK

Sempre inicialize o Power Apps SDK antes de fazer chamadas de dados:

```typescript
import { initialize } from '@microsoft/power-apps'

useEffect(() => {
  const init = async () => {
    try {
      await initialize()
      setIsInitialized(true)
    } catch (err) {
      console.error('Erro ao inicializar SDK:', err)
    }
  }
  init()
}, [])
```

### 2. Importar o Serviço

```typescript
import { SystemusersService } from './generated/services/SystemusersService'
import type { Systemusers } from './generated/models/SystemusersModel'
```

### 3. Operações CRUD

#### Buscar Todos os Usuários

```typescript
const fetchUsers = async () => {
  try {
    const result = await SystemusersService.getAll()
    if (result.data) {
      console.log('Usuários:', result.data)
    }
  } catch (err) {
    console.error('Erro ao buscar usuários:', err)
  }
}
```

#### Buscar com Filtros e Opções

```typescript
const fetchActiveUsers = async () => {
  const options = {
    select: ['fullname', 'internalemailaddress', 'systemuserid', 'isdisabled'],
    filter: "isdisabled eq false",
    orderBy: ['fullname asc'],
    top: 10
  }
  
  try {
    const result = await SystemusersService.getAll(options)
    return result.data || []
  } catch (err) {
    console.error('Erro:', err)
    return []
  }
}
```

#### Buscar Usuário por ID

```typescript
const getUserById = async (userId: string) => {
  try {
    const result = await SystemusersService.get(userId, {
      select: ['fullname', 'internalemailaddress']
    })
    return result.data
  } catch (err) {
    console.error('Erro ao buscar usuário:', err)
  }
}
```

#### Atualizar Usuário

```typescript
const updateUser = async (userId: string) => {
  const changes = {
    // Apenas inclua os campos que você quer atualizar
    title: "Novo Título"
  }
  
  try {
    await SystemusersService.update(userId, changes)
    console.log('Usuário atualizado com sucesso')
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err)
  }
}
```

#### Deletar Usuário

```typescript
const deleteUser = async (userId: string) => {
  try {
    await SystemusersService.delete(userId)
    console.log('Usuário deletado com sucesso')
  } catch (err) {
    console.error('Erro ao deletar usuário:', err)
  }
}
```

## Opções de Query (IGetAllOptions)

```typescript
interface IGetAllOptions {
  maxPageSize?: number    // Número máximo de registros por página
  select?: string[]       // Campos específicos para retornar
  filter?: string         // String de filtro OData
  orderBy?: string[]      // Campos para ordenação
  top?: number           // Número máximo de registros
  skip?: number          // Número de registros para pular
  skipToken?: string     // Token para paginação
}
```

## Filtros OData Comuns

```typescript
// Usuários ativos
filter: "isdisabled eq false"

// Buscar por nome
filter: "contains(fullname, 'João')"

// Múltiplas condições
filter: "isdisabled eq false and contains(fullname, 'João')"

// Data
filter: "createdon gt 2024-01-01"
```

## Boas Práticas

1. **Sempre limite os campos retornados** usando `select` para melhor performance:
   ```typescript
   select: ['fullname', 'internalemailaddress', 'systemuserid']
   ```

2. **Use filtros** para reduzir a quantidade de dados transferidos:
   ```typescript
   filter: "isdisabled eq false"
   ```

3. **Limite o número de registros** com `top`:
   ```typescript
   top: 50
   ```

4. **Trate erros adequadamente**:
   ```typescript
   try {
     const result = await SystemusersService.getAll()
   } catch (err) {
     console.error('Erro:', err)
   }
   ```

5. **Aguarde a inicialização** do SDK antes de fazer chamadas de dados

## Limitações Atuais

Segundo a documentação oficial, as seguintes funcionalidades ainda não são suportadas:

- Valores formatados/nomes de exibição para option sets
- Campos de lookup (incluindo lookups polimórficos)
- Actions e functions do Dataverse
- Suporte a FetchXML
- Suporte a chaves alternativas

## Exemplo Completo

Veja o arquivo `src/App.tsx` para um exemplo completo de implementação que:
- Inicializa o Power Apps SDK
- Busca usuários ativos
- Exibe os dados em cards
- Trata estados de loading e erro

## Comandos Úteis

Para executar o app localmente:
```bash
npm run dev
```

Para fazer build e publicar:
```bash
npm run build
pac code push
```

## Recursos Adicionais

- [Documentação oficial - Connect to Dataverse](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse)
- [Power Apps SDK - npm](https://www.npmjs.com/package/@microsoft/power-apps)
- [PAC CLI Reference](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code)
