import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createColumn, createContagemSnapshotTables, createTable, listEntities, publishAll } from './schema';

const server = new McpServer({
  name: 'dataverse-schema-mcp',
  version: '0.1.0',
});

server.tool(
  'dataverse_schema_list_entity_definitions',
  'Lista entidades (top 10) para validar autenticação.',
  {},
  async () => {
    const data = await listEntities();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'dataverse_schema_create_table',
  'Cria tabela no Dataverse (EntityDefinition).',
  {
    schemaName: z.string(),
    logicalName: z.string(),
    displayName: z.string(),
    displayCollectionName: z.string(),
    entitySetName: z.string(),
    primaryNameSchema: z.string(),
    primaryNameLogical: z.string(),
    primaryNameDisplay: z.string(),
  },
  async (input) => {
    await createTable({
      schemaName: input.schemaName,
      logicalName: input.logicalName,
      displayName: input.displayName,
      displayCollectionName: input.displayCollectionName,
      entitySetName: input.entitySetName,
      primaryNameSchema: input.primaryNameSchema,
      primaryNameLogical: input.primaryNameLogical,
      primaryNameDisplay: input.primaryNameDisplay,
    });
    return { content: [{ type: 'text', text: 'Tabela criada.' }] };
  }
);

server.tool(
  'dataverse_schema_create_column',
  'Cria coluna no Dataverse (AttributeDefinition).',
  {
    tableLogicalName: z.string(),
    payload: z.record(z.any()),
  },
  async (input) => {
    await createColumn(input.tableLogicalName, input.payload);
    return { content: [{ type: 'text', text: 'Coluna criada.' }] };
  }
);

server.tool(
  'dataverse_schema_publish_all',
  'Publica customizacoes no Dataverse.',
  {},
  async () => {
    await publishAll();
    return { content: [{ type: 'text', text: 'PublishAllXml executado.' }] };
  }
);

server.tool(
  'unium_create_contagem_snapshot_tables',
  'Cria tabelas e colunas da contagem diaria e publica.',
  {},
  async () => {
    await createContagemSnapshotTables();
    return { content: [{ type: 'text', text: 'Tabelas e colunas criadas e publicadas.' }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
