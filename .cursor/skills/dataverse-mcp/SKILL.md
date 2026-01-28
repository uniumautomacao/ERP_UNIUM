---
name: dataverse-mcp
description: Gerencia e utiliza o MCP de schema do Dataverse para criar tabelas, colunas e relacionamentos, publicar mudanças e reimportar metadados. Use quando o usuário mencionar MCP, Dataverse schema, criação de tabela/coluna/lookup, ou validação de metadados.
---

# Dataverse MCP

## Objetivo
Usar o MCP de schema do Dataverse para criar/ajustar tabelas e manter o projeto sincronizado com metadados.

## Pré-requisitos
- MCP configurado em `.cursor/mcp.json`
- Dependências instaladas em `tools/dataverse-mcp` (`npm install`)
- Autenticação por Device Code concluída ao menos uma vez

## Fluxo recomendado (schema)
1. Validar acesso com listagem de entidades (tool `dataverse_schema_list_entity_definitions`).
2. Listar soluções disponíveis (`dataverse_schema_list_solutions`) e escolher a `solutionUniqueName`.
3. Criar tabela/coluna/relacionamento com as tools de schema, informando `solutionUniqueName`.
4. Publicar customizações (`dataverse_schema_publish_all`).
5. Reimportar metadados no projeto via `pac modelbuilder`.
6. Atualizar `power.config.json`, `.power/schemas/appschemas/dataSourcesInfo.ts` e `DATAVERSE_METADATA.md`.

## Tools MCP disponíveis
- `dataverse_schema_list_entity_definitions`
- `dataverse_schema_list_solutions`
- `dataverse_schema_create_table` (exige `solutionUniqueName`)
- `dataverse_schema_create_column` (exige `solutionUniqueName`)
- `dataverse_schema_create_global_optionset` (exige `solutionUniqueName`)
- `dataverse_schema_publish_all`
- `unium_create_contagem_snapshot_tables` (exige `solutionUniqueName`)

## Reimportar metadados (PAC)
Use o filtro com **ponto e vírgula**:

```
/Users/bschron/.dotnet/tools/pac modelbuilder build \
  --entitynamesfilter "new_contagemdodia;new_contagemdodiaitem" \
  --outdirectory ./metadata
```

## Observações importantes
- LCID: o ambiente DEV aceita `1033` (use labels em en-US se necessário).
- Lookups podem exigir criação via `RelationshipDefinitions` (1:N).
- Sempre publicar (`PublishAllXml`) antes de validar no portal.

## Verificação rápida
Checar em `metadata/Entities/*.cs`:
- `EntitySetName`
- Campos esperados
- Lookups (navigation properties)

## Arquivos de referência
- MCP: `tools/dataverse-mcp/src/index.ts`
- Schema: `tools/dataverse-mcp/src/schema.ts`
- Config: `.cursor/mcp.json`
