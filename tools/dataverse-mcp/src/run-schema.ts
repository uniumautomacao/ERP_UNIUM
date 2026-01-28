import { createRemessaSchema } from './schema';

const solutionUniqueName = process.env.SOLUTION_UNIQUE_NAME;

if (!solutionUniqueName) {
  throw new Error('SOLUTION_UNIQUE_NAME é obrigatório para criar schema.');
}

async function main() {
  console.log('Iniciando atualização de schema...');
  try {
    await createRemessaSchema(solutionUniqueName);
    console.log('Schema atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar schema:', error);
    process.exit(1);
  }
}

main();
