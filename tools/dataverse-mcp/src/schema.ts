import { dataverseRequest } from './dataverseClient';

const languageCode = 1033;

const label = (text: string) => ({
  LocalizedLabels: [{ Label: text, LanguageCode: languageCode }],
  UserLocalizedLabel: { Label: text, LanguageCode: languageCode },
});

const requiredLevel = (value: 'None' | 'ApplicationRequired') => ({
  Value: value,
});

const stringAttribute = (schemaName: string, displayName: string, maxLength = 200) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  MaxLength: maxLength,
  FormatName: { Value: 'Text' },
});

export const integerAttribute = (schemaName: string, displayName: string) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  MinValue: -2147483648,
  MaxValue: 2147483647,
});

const dateAttribute = (schemaName: string, displayName: string, format: 'DateOnly' | 'DateAndTime') => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  Format: format,
});

const lookupAttribute = (schemaName: string, displayName: string, targets: string[]) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  Targets: targets,
});

const choiceAttribute = (schemaName: string, displayName: string, options: Array<{ label: string; value: number }>) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  OptionSet: {
    IsGlobal: false,
    OptionSetType: 'Picklist',
    Options: options.map((opt) => ({
      Value: opt.value,
      Label: label(opt.label),
    })),
  },
});

const booleanAttribute = (schemaName: string, displayName: string) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata',
  SchemaName: schemaName,
  DisplayName: label(displayName),
  RequiredLevel: requiredLevel('None'),
  OptionSet: {
    OptionSetType: 'Boolean',
    Options: [
      { Value: 0, Label: label('No') },
      { Value: 1, Label: label('Yes') },
    ],
  },
});

const buildPrimaryAttribute = (input: { schemaName: string; logicalName: string; displayName: string }) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
  SchemaName: input.schemaName,
  LogicalName: input.logicalName,
  AttributeType: 'String',
  AttributeTypeName: { Value: 'StringType' },
  DisplayName: label(input.displayName),
  RequiredLevel: requiredLevel('None'),
  IsPrimaryName: true,
  MaxLength: 100,
  FormatName: { Value: 'Text' },
});

const buildEntityPayload = (input: {
  schemaName: string;
  logicalName: string;
  displayName: string;
  displayCollectionName: string;
  entitySetName: string;
  primaryNameSchema: string;
  primaryNameLogical: string;
  primaryNameDisplay: string;
}) => {
  const primaryAttribute = buildPrimaryAttribute({
    schemaName: input.primaryNameSchema,
    logicalName: input.primaryNameLogical,
    displayName: input.primaryNameDisplay,
  });
  return {
  '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
  SchemaName: input.schemaName,
  LogicalName: input.logicalName,
  EntitySetName: input.entitySetName,
  DisplayName: label(input.displayName),
  DisplayCollectionName: label(input.displayCollectionName),
  OwnershipType: 'UserOwned',
  IsActivity: false,
  HasActivities: false,
  HasNotes: true,
  PrimaryNameAttribute: input.primaryNameLogical,
  Attributes: [primaryAttribute],
  };
};

const entityExists = async (logicalName: string) => {
  try {
    await dataverseRequest({
      method: 'GET',
      path: `EntityDefinitions(LogicalName='${logicalName}')?$select=LogicalName`,
    });
    return true;
  } catch {
    return false;
  }
};

const attributeExists = async (logicalName: string, attributeLogicalName: string) => {
  try {
    const result = await dataverseRequest<{ value?: Array<{ LogicalName?: string }> }>({
      method: 'GET',
      path: `EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=LogicalName&$filter=LogicalName eq '${attributeLogicalName}'`,
    });
    return (result?.value ?? []).length > 0;
  } catch {
    return false;
  }
};

const relationshipExists = async (schemaName: string) => {
  try {
    const result = await dataverseRequest<{ value?: Array<{ SchemaName?: string }> }>({
      method: 'GET',
      path: `RelationshipDefinitions?$select=SchemaName&$filter=SchemaName eq '${schemaName}'`,
    });
    return (result?.value ?? []).length > 0;
  } catch {
    return false;
  }
};

type GlobalOptionSetOption = {
  label: string;
  value: number;
};

export const buildGlobalOptionSetPayload = (input: {
  name: string;
  displayName: string;
  description?: string;
  options: GlobalOptionSetOption[];
}) => ({
  '@odata.type': 'Microsoft.Dynamics.CRM.OptionSetMetadata',
  Name: input.name,
  DisplayName: label(input.displayName),
  Description: label(input.description ?? input.displayName),
  OptionSetType: 'Picklist',
  Options: input.options.map((option) => ({
    Value: option.value,
    Label: label(option.label),
  })),
});

export const globalOptionSetExists = async (name: string) => {
  try {
    await dataverseRequest({
      method: 'GET',
      path: `GlobalOptionSetDefinitions(Name='${name}')?$select=Name`,
    });
    return true;
  } catch {
    return false;
  }
};

export const createGlobalOptionSet = async (payload: ReturnType<typeof buildGlobalOptionSetPayload>) => {
  await dataverseRequest({
    method: 'POST',
    path: 'GlobalOptionSetDefinitions',
    body: payload,
    useSolution: true,
  });
};

const createLookupRelationship = async (input: {
  schemaName: string;
  lookupSchemaName: string;
  referencingEntity: string;
  referencedEntity: string;
  referencedAttribute: string;
  displayName: string;
}) => {
  await dataverseRequest({
    method: 'POST',
    path: 'RelationshipDefinitions',
    body: {
      '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
      SchemaName: input.schemaName,
      ReferencingEntity: input.referencingEntity,
      ReferencedEntity: input.referencedEntity,
      ReferencedAttribute: input.referencedAttribute,
      Lookup: {
        SchemaName: input.lookupSchemaName,
        DisplayName: label(input.displayName),
        Description: label(input.displayName),
        RequiredLevel: requiredLevel('None'),
      },
    },
    useSolution: true,
  });
};

export const createTable = async (payload: ReturnType<typeof buildEntityPayload>) => {
  await dataverseRequest({
    method: 'POST',
    path: 'EntityDefinitions',
    body: payload,
    useSolution: true,
  });
};

export const createColumn = async (tableLogicalName: string, payload: Record<string, unknown>) => {
  await dataverseRequest({
    method: 'POST',
    path: `EntityDefinitions(LogicalName='${tableLogicalName}')/Attributes`,
    body: payload,
    useSolution: true,
  });
};

export const publishAll = async () => {
  await dataverseRequest({
    method: 'POST',
    path: 'PublishAllXml',
    body: {},
  });
};

export const listEntities = async () => {
  return dataverseRequest<{ value: Array<{ LogicalName?: string; SchemaName?: string }> }>({
    method: 'GET',
    path: 'EntityDefinitions?$select=LogicalName,SchemaName',
  });
};

export const createContagemSnapshotTables = async () => {
  const contagemDiaLogical = 'new_contagemdodia';
  const contagemDiaItemLogical = 'new_contagemdodiaitem';

  if (!(await entityExists(contagemDiaLogical))) {
    const entity = buildEntityPayload({
      schemaName: 'new_ContagemDoDia',
      logicalName: contagemDiaLogical,
      entitySetName: 'new_contagemdodias',
      displayName: 'Contagem do Dia',
      displayCollectionName: 'Contagens do Dia',
      primaryNameSchema: 'new_Name',
      primaryNameLogical: 'new_name',
      primaryNameDisplay: 'Name',
    });
    await createTable(entity);
  }

  if (!(await entityExists(contagemDiaItemLogical))) {
    const entity = buildEntityPayload({
      schemaName: 'new_ContagemDoDiaItem',
      logicalName: contagemDiaItemLogical,
      entitySetName: 'new_contagemdodiaitems',
      displayName: 'Contagem do Dia Item',
      displayCollectionName: 'Contagens do Dia Item',
      primaryNameSchema: 'new_Name',
      primaryNameLogical: 'new_name',
      primaryNameDisplay: 'Name',
    });
    await createTable(entity);
  }

  const contagemDiaColumns = [
    { logical: 'new_data', payload: dateAttribute('new_Data', 'Data', 'DateOnly') },
    { logical: 'new_esperados', payload: integerAttribute('new_Esperados', 'Esperados') },
    { logical: 'new_thresholda', payload: integerAttribute('new_ThresholdA', 'Threshold A') },
    { logical: 'new_thresholdb', payload: integerAttribute('new_ThresholdB', 'Threshold B') },
    { logical: 'new_thresholdc', payload: integerAttribute('new_ThresholdC', 'Threshold C') },
  ];

  for (const column of contagemDiaColumns) {
    if (!(await attributeExists(contagemDiaLogical, column.logical))) {
      await createColumn(contagemDiaLogical, column.payload);
    }
  }

  const contagemDiaItemColumns = [
    { logical: 'new_sku', payload: stringAttribute('new_Sku', 'SKU', 200) },
    { logical: 'new_querytag', payload: integerAttribute('new_QueryTag', 'Query Tag') },
    { logical: 'new_endereco', payload: stringAttribute('new_Endereco', 'Endereco', 200) },
    {
      logical: 'new_classecriticidade',
      payload: integerAttribute('new_ClasseCriticidade', 'Classe Criticidade'),
    },
    {
      logical: 'new_ultimacontagemsnapshot',
      payload: dateAttribute('new_UltimaContagemSnapshot', 'Ultima Contagem Snapshot', 'DateAndTime'),
    },
  ];

  for (const column of contagemDiaItemColumns) {
    if (!(await attributeExists(contagemDiaItemLogical, column.logical))) {
      await createColumn(contagemDiaItemLogical, column.payload);
    }
  }

  const relationships = [
    {
      schemaName: 'new_ContagemDoDia_SystemUser',
      lookupSchemaName: 'new_Usuario',
      referencingEntity: contagemDiaLogical,
      referencedEntity: 'systemuser',
      referencedAttribute: 'systemuserid',
      displayName: 'Usuario',
    },
    {
      schemaName: 'new_ContagemDoDiaItem_ContagemDoDia',
      lookupSchemaName: 'new_Snapshot',
      referencingEntity: contagemDiaItemLogical,
      referencedEntity: contagemDiaLogical,
      referencedAttribute: 'new_contagemdodiaid',
      displayName: 'Snapshot',
    },
    {
      schemaName: 'new_ContagemDoDiaItem_ItemEstoque',
      lookupSchemaName: 'new_ItemEstoque',
      referencingEntity: contagemDiaItemLogical,
      referencedEntity: 'cr22f_estoquefromsharepointlist',
      referencedAttribute: 'cr22f_estoquefromsharepointlistid',
      displayName: 'Item Estoque',
    },
  ];

  for (const relationship of relationships) {
    if (!(await relationshipExists(relationship.schemaName))) {
      await createLookupRelationship(relationship);
    }
  }

  await publishAll();
};

export const createRemessaSchema = async () => {
  const remessaLogical = 'new_remessa';
  const produtoServicoLogical = 'new_produtoservico';
  const historicoRemessaLogical = 'new_historicoremessa';

  // 1. Campos em new_remessa
  const remessaColumns = [
    { logical: 'new_codigoderastreio', payload: stringAttribute('new_CodigoDeRastreio', 'Código de Rastreio', 200) },
    {
      logical: 'new_prioridade',
      payload: choiceAttribute('new_Prioridade', 'Prioridade', [
        { label: 'Alta', value: 100000000 },
        { label: 'Normal', value: 100000001 },
        { label: 'Baixa', value: 100000002 },
      ]),
    },
  ];

  for (const column of remessaColumns) {
    if (!(await attributeExists(remessaLogical, column.logical))) {
      await createColumn(remessaLogical, column.payload);
    }
  }

  // Lookup new_remessaorigem em new_remessa
  if (!(await relationshipExists('new_remessa_remessa_origem'))) {
    await createLookupRelationship({
      schemaName: 'new_remessa_remessa_origem',
      lookupSchemaName: 'new_RemessaOrigem',
      referencingEntity: remessaLogical,
      referencedEntity: remessaLogical,
      referencedAttribute: 'new_remessaid',
      displayName: 'Remessa Origem',
    });
  }

  // 2. Lookup new_remessa em new_produtoservico
  if (!(await attributeExists(produtoServicoLogical, 'new_remessa')) && !(await relationshipExists('new_produtoservico_remessa'))) {
    await createLookupRelationship({
      schemaName: 'new_produtoservico_remessa',
      lookupSchemaName: 'new_Remessa',
      referencingEntity: produtoServicoLogical,
      referencedEntity: remessaLogical,
      referencedAttribute: 'new_remessaid',
      displayName: 'Remessa',
    });
  }

  // 3. Tabela new_historicoremessa
  if (!(await entityExists(historicoRemessaLogical))) {
    const entity = buildEntityPayload({
      schemaName: 'new_HistoricoRemessa',
      logicalName: historicoRemessaLogical,
      entitySetName: 'new_historicoremessas',
      displayName: 'Histórico da Remessa',
      displayCollectionName: 'Históricos da Remessa',
      primaryNameSchema: 'new_Name',
      primaryNameLogical: 'new_name',
      primaryNameDisplay: 'Nome',
    });
    await createTable(entity);
  }

  const historicoColumns = [
    { logical: 'new_campoalterado', payload: stringAttribute('new_CampoAlterado', 'Campo Alterado', 200) },
    { logical: 'new_valoranterior', payload: stringAttribute('new_ValorAnterior', 'Valor Anterior', 4000) },
    { logical: 'new_valornovo', payload: stringAttribute('new_ValorNovo', 'Valor Novo', 4000) },
    { logical: 'new_dataalteracao', payload: dateAttribute('new_DataAlteracao', 'Data da Alteração', 'DateAndTime') },
    {
      logical: 'new_tipoacao',
      payload: choiceAttribute('new_TipoAcao', 'Tipo de Ação', [
        { label: 'Criação', value: 100000000 },
        { label: 'Alteração', value: 100000001 },
        { label: 'Exclusão', value: 100000002 },
        { label: 'Movimentação', value: 100000003 },
        { label: 'Divisão', value: 100000004 },
        { label: 'Junção', value: 100000005 },
      ]),
    },
  ];

  for (const column of historicoColumns) {
    if (!(await attributeExists(historicoRemessaLogical, column.logical))) {
      await createColumn(historicoRemessaLogical, column.payload);
    }
  }

  // Lookups em new_historicoremessa
  const historicoRelationships = [
    {
      schemaName: 'new_historicoremessa_remessa',
      lookupSchemaName: 'new_Remessa',
      referencingEntity: historicoRemessaLogical,
      referencedEntity: remessaLogical,
      referencedAttribute: 'new_remessaid',
      displayName: 'Remessa',
    },
    {
      schemaName: 'new_historicoremessa_alteradopor',
      lookupSchemaName: 'new_AlteradoPor',
      referencingEntity: historicoRemessaLogical,
      referencedEntity: 'systemuser',
      referencedAttribute: 'systemuserid',
      displayName: 'Alterado Por',
    },
  ];

  for (const rel of historicoRelationships) {
    if (!(await relationshipExists(rel.schemaName))) {
      await createLookupRelationship(rel);
    }
  }

  await publishAll();
};
