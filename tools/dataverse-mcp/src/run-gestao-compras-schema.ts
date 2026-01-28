import { buildGlobalOptionSetPayload, createColumn, createGlobalOptionSet, globalOptionSetExists, integerAttribute, publishAll } from './schema';

const globalChoiceName = 'new_faixadeprazo_options';
const solutionUniqueName = process.env.SOLUTION_UNIQUE_NAME;

if (!solutionUniqueName) {
  throw new Error('SOLUTION_UNIQUE_NAME é obrigatório para criar schema.');
}

const createGlobalFaixaPrazo = async () => {
  if (await globalOptionSetExists(globalChoiceName)) {
    console.log(`Global choice "${globalChoiceName}" já existe.`);
    return;
  }

  const payload = buildGlobalOptionSetPayload({
    name: globalChoiceName,
    displayName: 'Faixa de Prazo',
    description: 'Opções de classificação por urgência',
    options: [
      { label: 'Atrasado', value: 100000000 },
      { label: 'Pedir Agora', value: 100000001 },
      { label: '7 dias', value: 100000007 },
      { label: '30 dias', value: 100000030 },
      { label: 'Futuro', value: 100000099 },
    ],
  });

  await createGlobalOptionSet(payload, solutionUniqueName);
  console.log(`Global choice "${globalChoiceName}" criado.`);
};

const createPrazoFreteColumn = async () => {
  const payload = {
    ...integerAttribute('new_PrazoFrete', 'Prazo de Frete (Dias)'),
    MinValue: 0,
    MaxValue: 365,
  };

  try {
    await createColumn('cr22f_fornecedoresfromsharepointlist', payload, solutionUniqueName);
    console.log('Coluna new_prazofrete criada.');
  } catch (error) {
    console.error('Falha ao criar new_prazofrete (talvez já exista).', error);
  }
};

async function main() {
  console.log('Iniciando schema de Gestão de Compras...');
  try {
    await createGlobalFaixaPrazo();
    await createPrazoFreteColumn();
    await publishAll();
    console.log('Schema publicado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar schema:', error);
    process.exit(1);
  }
}

main();
