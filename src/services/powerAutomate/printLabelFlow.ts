import { getContext } from '@microsoft/power-apps/app';

const FLOW_NAME = '(Estoque)-ImprimirEtiqueta(PowerApps)';

export const imprimirEtiquetas = async (mercadoriaIds: string[]) => {
  if (!mercadoriaIds.length) return;

  const context = await getContext();
  const actions = (context as any)?.actions;
  const runFlow = actions?.runFlow ?? actions?.invokeFlow ?? actions?.RunFlow;

  if (typeof runFlow !== 'function') {
    throw new Error('Flow de impressão não configurado no contexto do Power Apps.');
  }

  await runFlow(FLOW_NAME, {
    ids: mercadoriaIds.join(','),
  });
};
