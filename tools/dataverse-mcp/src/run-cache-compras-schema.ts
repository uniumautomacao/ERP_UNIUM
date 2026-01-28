import { createLookupRelationship, publishAll, relationshipExists } from './schema';

const solutionUniqueName = process.env.SOLUTION_UNIQUE_NAME;

if (!solutionUniqueName) {
  throw new Error('SOLUTION_UNIQUE_NAME e obrigatorio para criar schema.');
}

const cacheComprasLogical = 'new_cachecomprasprodutospendentes';

const relationships = [
  {
    schemaName: 'new_CacheComprasProdutosPendentes_ProdutoServico',
    lookupSchemaName: 'new_ProdutoServico',
    referencingEntity: cacheComprasLogical,
    referencedEntity: 'new_produtoservico',
    referencedAttribute: 'new_produtoservicoid',
    displayName: 'Produto-Servico',
  },
  {
    schemaName: 'new_CacheComprasProdutosPendentes_Cotacao',
    lookupSchemaName: 'new_Cotacao',
    referencingEntity: cacheComprasLogical,
    referencedEntity: 'new_cotacao',
    referencedAttribute: 'new_cotacaoid',
    displayName: 'Cotacao',
  },
  {
    schemaName: 'new_CacheComprasProdutosPendentes_ModeloDeProdutoOriginal',
    lookupSchemaName: 'new_ModeloDeProdutoOriginal',
    referencingEntity: cacheComprasLogical,
    referencedEntity: 'cr22f_modelosdeprodutofromsharepointlist',
    referencedAttribute: 'cr22f_modelosdeprodutofromsharepointlistid',
    displayName: 'Modelo de Produto Original',
  },
];

async function main() {
  console.log('Iniciando criacao de lookups do cache de compras...');
  try {
    for (const relationship of relationships) {
      if (await relationshipExists(relationship.schemaName)) {
        console.log(`Relacionamento ${relationship.schemaName} ja existe.`);
        continue;
      }
      await createLookupRelationship({ ...relationship, solutionUniqueName });
      console.log(`Relacionamento ${relationship.schemaName} criado.`);
    }

    await publishAll();
    console.log('Customizacoes publicadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar lookups do cache de compras:', error);
    process.exit(1);
  }
}

main();
