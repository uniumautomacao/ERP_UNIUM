export const APP_VERSION = '0.0.63';
export const APP_BUILD_DATE = '2026-01-19';
export const VERSION_HISTORY = [
  {
    version: '0.0.63',
    date: '2026-01-19',
    changes: 'Corrigida a ordem dos hooks na gestão de contagem para evitar erro de inicialização.',
  },
  {
    version: '0.0.62',
    date: '2026-01-19',
    changes: 'Adicionada a tela de gestão de contagem com abas (dashboard, divergências, ajustes, configurações e relatórios).',
  },
  {
    version: '0.0.61',
    date: '2026-01-19',
    changes: 'Removida a leitura automática de quantidade do QR Code; agora o sistema absorve apenas a Tag.',
  },
  {
    version: '0.0.60',
    date: '2026-01-19',
    changes: 'Alterada a lógica do QR Code para o formato TAG|QTD e busca por Tag em vez de GUID.',
  },
  {
    version: '0.0.59',
    date: '2026-01-19',
    changes: 'Ajustada a exibição dos itens na lista do dia para incluir tag e endereço, evitando repetição da referência.',
  },
  {
    version: '0.0.58',
    date: '2026-01-19',
    changes: 'Adicionada a seção Vistorias com fluxo mobile de contagem por QR Code.',
  },
  {
    version: '0.0.57',
    date: '2026-01-19',
    changes: 'Atualizados os metadados da tabela new_ajustedeestoque (campo new_contagem alterado para lookup).',
  },
  {
    version: '0.0.56',
    date: '2026-01-19',
    changes: 'Atualizados os metadados da tabela cr22f_estoquefromsharepointlist com novos campos de localização e criticidade.',
  },
  {
    version: '0.0.55',
    date: '2026-01-19',
    changes: 'Importadas tabelas do Dataverse: new_contagemestoque e new_ajustedeestoque.',
  },
  {
    version: '0.0.54',
    date: '2026-01-19',
    changes: 'Persistência da rota após refresh com HashRouter e restauração automática da última página.',
  },
  {
    version: '0.0.53',
    date: '2026-01-19',
    changes: 'Definida altura mínima nos cards de RMA para evitar encolhimento vertical.',
  },
  {
    version: '0.0.52',
    date: '2026-01-19',
    changes: 'Aumentada a largura mínima das colunas no Kanban de RMAs para evitar cartões encolhidos.',
  },
  {
    version: '0.0.51',
    date: '2026-01-19',
    changes: 'Ajustado o quadro de RMAs para rolar horizontalmente quando as colunas não cabem na tela.',
  },
  {
    version: '0.0.50',
    date: '2026-01-19',
    changes: 'Adicionada página DEV para leitura de QR Code com câmera do dispositivo.',
  },
  {
    version: '0.0.49',
    date: '2026-01-19',
    changes: 'Publicação do app no PowerApps com correções de RMA e mercadorias devolvidas.',
  },
  {
    version: '0.0.48',
    date: '2026-01-19',
    changes: 'Corrigida a carga de S/N no grid de mercadorias devolvidas, exibindo S/N Antigo e S/N Novo.',
  },
  {
    version: '0.0.46',
    date: '2026-01-19',
    changes: 'Implementado salvamento automático (autosave) nos campos de informações do RMA na janela de cadastro de mercadorias.',
  },
  {
    version: '0.0.45',
    date: '2026-01-19',
    changes: 'Recriada a janela interna de cadastro de mercadorias do RMA com regras do app legado, integrando ao quadro de RMAs.',
  },
  {
    version: '0.0.44',
    date: '2026-01-19',
    changes: 'Centralizada a definição de seções/páginas para menu e Home, reaproveitando as mesmas regras de permissão.',
  },
  {
    version: '0.0.43',
    date: '2026-01-19',
    changes: 'Reformulado o card de RMA no Kanban com layout compacto, ações agrupadas e pré-carregamento das referências de produtos.',
  },
  {
    version: '0.0.42',
    date: '2026-01-18',
    changes: 'Implementada busca combinada: agora é possível pesquisar RMAs por campos do RMA e por informações dos itens de estoque vinculados (número de série, referência, etc).',
  },
  {
    version: '0.0.41',
    date: '2026-01-18',
    changes: 'Corrigido o cálculo de overflow do CommandBar para ser mais estável e evitar esconder itens sem necessidade.',
  },
  {
    version: '0.0.40',
    date: '2026-01-18',
    changes: 'Melhorado o espaçamento e alinhamento dos filtros na página de RMAs.',
  },
  {
    version: '0.0.39',
    date: '2026-01-18',
    changes: 'Ajustado o layout do app e do Kanban de RMAs para evitar cortes, suportar quebra em linhas e melhorar o espaçamento dos filtros.',
  },
  {
    version: '0.0.38',
    date: '2026-01-18',
    changes: 'Criada a página Quadro de RMAs com Kanban em drag&drop, filtros, preferências de estágios e ações integradas ao Dataverse.',
  },
  {
    version: '0.0.37',
    date: '2026-01-18',
    changes: 'Importadas tabelas do Dataverse: contact, cr22f_estoquefromsharepointlist, new_estoquerma e new_rma.',
  },
  {
    version: '0.0.36',
    date: '2026-01-18',
    changes: 'Publicação do app no PowerApps conforme solicitado pelo usuário.',
  },
  {
    version: '0.0.35',
    date: '2026-01-18',
    changes: 'Reescrita a UI da página Dispositivos IO para o padrão do template, mantendo o fluxo e o autosave.',
  },
  {
    version: '0.0.34',
    date: '2026-01-18',
    changes: 'Importado o app Editor IO Dispositivos para a página Dispositivos IO, mantendo a funcionalidade original de gerenciamento de templates de dispositivos.',
  },
  {
    version: '0.0.33',
    date: '2026-01-18',
    changes: 'Adicionada a seção Cadastros com a página em branco Dispositivos IO.',
  },
  {
    version: '0.0.32',
    date: '2026-01-18',
    changes: 'Importadas tabelas do Dataverse: cr22f_modelosdeprodutofromsharepointlist, cr22f_fabricantesfromsharpointlist, new_deviceio e new_deviceioconnection.',
  },
  {
    version: '0.0.31',
    date: '2026-01-18',
    changes: 'Redesenhado o modal de Nova Atividade para melhorar o layout, hierarquia visual e responsividade.',
  },
  {
    version: '0.0.30',
    date: '2026-01-18',
    changes: 'Adequada a tela Linha do Tempo ao template com CommandBar/PageHeader, controles Fluent UI e tokens de tema.',
  },
  { 
    version: '0.0.29', 
    date: '2026-01-18', 
    changes: 'Reordenada a seção Instalações para aparecer após a Home no menu lateral.' 
  },
  { 
    version: '0.0.28', 
    date: '2026-01-18', 
    changes: 'Importada a tela Uso do Instalador (Linha do Tempo) para a seção Instalações, com componentes, estilos e serviços gerados.' 
  },
  { 
    version: '0.0.27', 
    date: '2026-01-18', 
    changes: 'Importadas tabelas do Dataverse: cr22f_projetos, new_apppreferences, new_atividadefieldcontrols, new_corcolaboradorlinhadotempos, new_ordemdeservicofieldcontrols e new_produtoservicos.' 
  },
  { 
    version: '0.0.26', 
    date: '2026-01-18', 
    changes: 'Centralizada a lógica de ordenação de security roles em utilitário compartilhado e aplicada às colunas da matriz de usuários.' 
  },
  { 
    version: '0.0.25', 
    date: '2026-01-18', 
    changes: 'Adicionados filtros de exclusão na matriz de usuários para ignorar nomes iniciando com # e emails terminando com @onmicrosoft.com.' 
  },
  { 
    version: '0.0.24', 
    date: '2026-01-18', 
    changes: 'Corrigida lógica de busca de usuários na matriz para garantir exibição de ativos mesmo com busca vazia e tipos de dados variados no Dataverse.' 
  },
  { 
    version: '0.0.23', 
    date: '2026-01-18', 
    changes: 'Ajustada busca de usuários para garantir retorno com isdisabled ne 1 e fallback delegável quando não houver resultados.' 
  },
  { 
    version: '0.0.21', 
    date: '2026-01-18', 
    changes: 'Ajustada ordenação da Matriz de Acesso para não considerar a página Home (/) como página habilitada para fins de ranking das roles.' 
  },
  { 
    version: '0.0.20', 
    date: '2026-01-18', 
    changes: 'Adicionado left padding no nome das security roles na Matriz de Acesso.' 
  },
  { 
    version: '0.0.18', 
    date: '2026-01-18', 
    changes: 'Adicionada barra de pesquisa delegável por nome de security role na Matriz de Acesso.' 
  },
  { 
    version: '0.0.17', 
    date: '2026-01-18', 
    changes: 'Reformulada página de Acesso por Role para formato de matriz, com agrupamento por seção, ordenação customizada de roles e comportamento visual de override para o wildcard (*).' 
  },
  { 
    version: '0.0.15', 
    date: '2026-01-18', 
    changes: 'Melhorias de segurança no RBAC: logs só em DEV, mensagens genéricas e allowlist de rotas.' 
  },
  { 
    version: '0.0.14', 
    date: '2026-01-18', 
    changes: 'Implementado RBAC dinâmico via tabela new_codeapppageallowedsecurityrole, com suporte a wildcard (*) e política deny-by-default.' 
  },
  { 
    version: '0.0.13', 
    date: '2026-01-18', 
    changes: 'Importada a tabela new_codeapppageallowedsecurityrole do Dataverse com geração de metadados, serviço e modelo.' 
  },
  { 
    version: '0.0.12', 
    date: '2026-01-18', 
    changes: 'Adicionado controle de acesso por roles nas rotas e no menu, com página de acesso negado e notas de segurança no Dataverse.' 
  },
  { 
    version: '0.0.11', 
    date: '2026-01-18', 
    changes: 'Alinhadas chaves de dataSources no power.config para roles e vínculos de usuário.' 
  },
  { 
    version: '0.0.10', 
    date: '2026-01-18', 
    changes: 'Adicionada lista de Security Roles do Dataverse na Área do Desenvolvedor.' 
  },
  { 
    version: '0.0.9', 
    date: '2026-01-18', 
    changes: 'Adicionada a exibição do AAD Object Id do usuário na Área do Desenvolvedor.' 
  },
  { 
    version: '0.0.8', 
    date: '2026-01-18', 
    changes: 'Adicionada nova seção DEV no menu com uma página em branco para desenvolvimento.' 
  },
  { 
    version: '0.0.7', 
    date: '2026-01-18', 
    changes: 'Ajustadas configurações de host para 0.0.0.0 e porta para 3000 no vite.config.ts.' 
  },
  { 
    version: '0.0.6', 
    date: '2026-01-18', 
    changes: 'Removidos os divisores entre comandos da CommandBar, mantendo espaçamento por gap. Divisores agora aparecem apenas entre categorias (primary/secondary e overflow).' 
  },
  { 
    version: '0.0.5', 
    date: '2026-01-18', 
    changes: 'Ajustado o comportamento de overflow da CommandBar para mover comandos ao menu apenas quando não couberem, com cálculo responsivo de largura.' 
  },
  { 
    version: '0.0.4', 
    date: '2026-01-18', 
    changes: 'Movido o comando Refresh do overflow para a barra principal na tela Inventory, garantindo visibilidade imediata.' 
  },
  { 
    version: '0.0.3', 
    date: '2026-01-18', 
    changes: 'Corrigido desalinhamento vertical na CommandBar removendo wrappers e ajustando os dividers para altura consistente. Botão de overflow padronizado com appearance subtle.' 
  },
  { 
    version: '0.0.2', 
    date: '2026-01-18', 
    changes: 'Corrigido layout do CommandBar para seguir o padrão PowerApps. Todos os botões agora são renderizados em sequência da esquerda para a direita, sem espaçamento artificial. Removido justify-content: space-between e consolidado em uma única Toolbar.' 
  },
  { 
    version: '0.0.1', 
    date: '2026-01-18', 
    changes: 'Melhorado o posicionamento dos botões no CommandBar em toda a aplicação. Botões de ação primária agora ficam à esquerda, botões utilitários (Refresh, Export, Customize, Settings, Import) à direita. Atualizado CommandBar para usar layout flexbox com justify-content: space-between. Páginas atualizadas: Dashboard, Analytics, Reports e Project Planner.' 
  },
];
