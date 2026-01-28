import { createRemessaSchema } from './schema';

async function main() {
  console.log('Iniciando atualização de schema...');
  try {
    await createRemessaSchema();
    console.log('Schema atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar schema:', error);
    process.exit(1);
  }
}

main();
