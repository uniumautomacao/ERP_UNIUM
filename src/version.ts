export const APP_VERSION = '0.0.106';
export const APP_BUILD_DATE = '2026-01-21';
export const VERSION_HISTORY = [
  {
    version: '0.0.106',
    date: '2026-01-21',
    changes: 'Relatórios agora mostram o fullname do usuário em vez do GUID na coluna Usuário.',
  },
  {
    version: '0.0.105',
    date: '2026-01-21',
    changes: 'Relatórios corrigidos com paginação via skipToken (removido uso de skip) para evitar resultados vazios.',
  },
  {
    version: '0.0.104',
    date: '2026-01-21',
    changes: 'Relatórios agora incluem contagens sem new_datacontagem usando createdon como fallback no filtro e na exibição.',
  },
  {
    version: '0.0.103',
    date: '2026-01-21',
    changes: 'Reordenadas abas da gestão de contagem: Configurações movida para última posição (Dashboard > Divergências > Ajustes > Relatórios > Configurações).',
  },
  {
    version: '0.0.102',
    date: '2026-01-21',
    changes: 'Filtros padrão de Ajustes e Relatórios agora mostram últimos 7 dias + hoje.',
  },
  {
    version: '0.0.101',
    date: '2026-01-21',
    changes: 'Histórico de ajustes agora exibe o identificador da contagem pelo campo new_id (em vez de new_name).',
  },
  {
    version: '0.0.100',
    date: '2026-01-21',
    changes: 'Histórico de ajustes agora exibe o nome da contagem (new_name) e o nome do usuário (fullname) em vez de GUIDs.',
  },
  {
    version: '0.0.99',
    date: '2026-01-21',
    changes: 'Aumentado período de exibição de solicitações de ajuste de 1 para 30 dias na aba de Divergências.',
  },
  {
    version: '0.0.98',
    date: '2026-01-21',
    changes: 'Normalização robusta do status de processamento (number/string/object), evitando badge "Desconhecido" durante processamento.',
  },
  {
    version: '0.0.97',
    date: '2026-01-21',
    changes: 'Normaliza status de processamento (number/string) para evitar badge "Desconhecido" durante processamento.',
  },
  {
    version: '0.0.96',
    date: '2026-01-21',
    changes: 'Correções no feedback de ajustes: corrigido status "Desconhecido" (Concludo vs Concluido), contagens ajustadas permanecem visíveis o dia todo, polling inteligente com intervalo gradativo (5s-30s), polling para apenas quando não há pendentes/processando, botão desabilitado para Pendente E Processando, contagens concluídas mostram "Ajuste concluído" em vez do botão.',
  },
  {
    version: '0.0.95',
    date: '2026-01-21',
    changes: 'Implementado feedback visual em tempo real para ajustes: badges de status (Pendente/Processando/Ajustada/Erro), polling automático a cada 5s, exibição de mensagens de erro, desabilitação do botão durante processamento, e remoção automática de contagens ajustadas após 5s.',
  },
  {
    version: '0.0.94',
    date: '2026-01-21',
    changes: 'Corrigido casing dos campos OData binding na criação de solicitação de ajuste (new_Contagem, new_ItemdeEstoque, new_UsuarioSolicitante com PascalCase).',
  },
  {
    version: '0.0.93',
    date: '2026-01-21',
    changes: 'Implementada criação de solicitação de ajuste via Dataverse. O app apenas cria a solicitação; o Power Automate processa e atualiza a contagem para "Ajustada".',
  },
  {
    version: '0.0.92',
    date: '2026-01-21',
    changes: 'Implementada criação de solicitação de ajuste via tabela Dataverse (substituindo chamada HTTP ao Power Automate). Removido código MSAL e autenticação OAuth.',
  },
  {
    version: '0.0.91',
    date: '2026-01-21',
    changes: 'Importada nova tabela do Dataverse: new_solicitacaodeajustedeestoque.',
  },
  {
    version: '0.0.90',
    date: '2026-01-21',
    changes: 'Corrigida URL do fluxo Power Automate de ajuste de estoque (workflow ID atualizado).',
  },
  {
    version: '0.0.89',
    date: '2026-01-20',
    changes: 'Republicação incremental solicitada pelo usuário.',
  },
  {
    version: '0.0.88',
    date: '2026-01-20',
    changes: 'Republicação incremental solicitada pelo usuário.',
  },
  {
    version: '0.0.87',
    date: '2026-01-20',
    changes: 'Republicação solicitada pelo usuário.',
  },
  {
    version: '0.0.86',
    date: '2026-01-20',
    changes: 'Republicação com incremento de versão para garantir atualização no PowerApps.',
  },
  {
    version: '0.0.85',
    date: '2026-01-20',
    changes: 'Corrige scope MSAL para Flows.Run (permissão para executar Flows).',
  },
  {
    version: '0.0.84',
    date: '2026-01-20',
    changes: 'Corrige scope MSAL para User (nome exato da permissão delegada no Azure).',
  },
  {
    version: '0.0.83',
    date: '2026-01-20',
    changes: 'Ajusta escopo MSAL para Flow (user_impersonation) para evitar erro AADSTS650057.',
  },
  {
    version: '0.0.82',
    date: '2026-01-20',
    changes: 'Publicação do app no PowerApps com fluxos de contagem e gestão de vistorias.',
  },
  {
    version: '0.0.81',
    date: '2026-01-20',
    changes: 'Remove redirect em iframe e mantém autenticação via popup.',
  },
  {
    version: '0.0.80',
    date: '2026-01-20',
    changes: 'Habilita redirect em iframe no MSAL como fallback para login.',
  },
  {
    version: '0.0.79',
    date: '2026-01-20',
    changes: 'Remove fallback de redirect no MSAL e melhora erro de popup.',
  },
  {
    version: '0.0.78',
    date: '2026-01-20',
    changes: 'Fallback para login/redirect no MSAL quando popup expira.',
  },
  {
    version: '0.0.77',
    date: '2026-01-20',
    changes: 'Inicializa MSAL antes de autenticar o fluxo HTTP.',
  },
  {
    version: '0.0.76',
    date: '2026-01-20',
    changes: 'Integra ajuste de divergência via Flow HTTP com autenticação do usuário.',
  },
  {
    version: '0.0.75',
    date: '2026-01-19',
    changes: 'Adicionado campo de busca delegável (SKU ou Tag) na lista do dia do fluxo mobile.',
  },
  {
    version: '0.0.74',
    date: '2026-01-19',
    changes: 'Normaliza agrupamento do gráfico para data local.',
  },
  {
    version: '0.0.73',
    date: '2026-01-19',
    changes: 'Inclui lookup _new_itemestoque_value na lista do dashboard.',
  },
  {
    version: '0.0.72',
    date: '2026-01-19',
    changes: 'Remove parâmetro expand e mantém logs de diagnóstico.',
  },
  {
    version: '0.0.71',
    date: '2026-01-19',
    changes: 'Logs de diagnóstico no dashboard para itens de estoque vinculados.',
  },
  {
    version: '0.0.70',
    date: '2026-01-19',
    changes: 'Reimportada a tabela cr22f_estoquefromsharepointlist com atualização completa de campos e lookups.',
  },
  {
    version: '0.0.69',
    date: '2026-01-19',
    changes: 'Carregamento de etiqueta e S/N via estoque relacionado no dashboard.',
  },
  {
    version: '0.0.68',
    date: '2026-01-19',
    changes: 'Adicionadas colunas de Etiqueta e Número de Série no dashboard de gestão.',
  },
  {
    version: '0.0.67',
    date: '2026-01-19',
    changes: 'Removida a opção de validar contagem sem ajuste; agora apenas o ajuste de estoque é permitido para divergências.',
  },
  {
    version: '0.0.65',
    date: '2026-01-19',
    changes: 'Reordenadas colunas de divergências para evitar referência antes da inicialização.',
  },
  {
    version: '0.0.64',
    date: '2026-01-19',
    changes: 'Adicionadas ações de validação e ajuste na tabela de divergências.',
  },
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
    changes: 'Reordenada a seção Instalações para aparecer após a Home no menu lateral.',
  },
  {
    version: '0.0.28',
    date: '2026-01-18',
    changes: 'Importada a tela Uso do Instalador (Linha do Tempo) para a seção Instalações, com componentes, estilos e serviços gerados.',
  },
  {
    version: '0.0.27',
    date: '2026-01-18',
    changes: 'Importadas tabelas do Dataverse: cr22f_projetos, new_apppreferences, new_atividadefieldcontrols, new_corcolaboradorlinhadotempos, new_ordemdeservicofieldcontrols e new_produtoservicos.',
  },
  {
    version: '0.0.26',
    date: '2026-01-18',
    changes: 'Centralizada a lógica de ordenação de security roles em utilitário compartilhado e aplicada às colunas da matriz de usuários.',
  },
  {
    version: '0.0.25',
    date: '2026-01-18',
    changes: 'Adicionados filtros de exclusão na matriz de usuários para ignorar nomes iniciando com # e emails terminando com @onmicrosoft.com.',
  },
  {
    version: '0.0.24',
    date: '2026-01-18',
    changes: 'Corrigida lógica de busca de usuários na matriz para garantir exibição de ativos mesmo com busca vazia e tipos de dados variados no Dataverse.',
  },
  {
    version: '0.0.23',
    date: '2026-01-18',
    changes: 'Ajustada busca de usuários para garantir retorno com isdisabled ne 1 e fallback delegável quando não houver resultados.',
  },
  {
    version: '0.0.21',
    date: '2026-01-18',
    changes: 'Ajustada ordenação da Matriz de Acesso para não considerar a página Home (/) como página habilitada para fins de ranking das roles.',
  },
  {
    version: '0.0.20',
    date: '2026-01-18',
    changes: 'Adicionado left padding no nome das security roles na Matriz de Acesso.',
  },
  {
    version: '0.0.18',
    date: '2026-01-18',
    changes: 'Adicionada barra de pesquisa delegável por nome de security role na Matriz de Acesso.',
  },
  {
    version: '0.0.17',
    date: '2026-01-18',
    changes: 'Reformulada página de Acesso por Role para formato de matriz, com agrupamento por seção, ordenação customizada de roles e comportamento visual de override para o wildcard (*).',
  },
  {
    version: '0.0.15',
    date: '2026-01-18',
    changes: 'Melhorias de segurança no RBAC: logs só em DEV, mensagens genéricas e allowlist de rotas.',
  },
  {
    version: '0.0.14',
    date: '2026-01-18',
    changes: 'Implementado RBAC dinâmico via tabela new_codeapppageallowedsecurityrole, com suporte a wildcard (*) e política deny-by-default.',
  },
  {
    version: '0.0.13',
    date: '2026-01-18',
    changes: 'Importada a tabela new_codeapppageallowedsecurityrole do Dataverse com geração de metadados, serviço e modelo.',
  },
  {
    version: '0.0.12',
    date: '2026-01-18',
    changes: 'Adicionado controle de acesso por roles nas rotas e no menu, com página de acesso negado e notas de segurança no Dataverse.',
  },
  {
    version: '0.0.11',
    date: '2026-01-18',
    changes: 'Alinhadas chaves de dataSources no power.config para roles e vínculos de usuário.',
  },
  {
    version: '0.0.10',
    date: '2026-01-18',
    changes: 'Adicionada lista de Security Roles do Dataverse na Área do Desenvolvedor.',
  },
  {
    version: '0.0.9',
    date: '2026-01-18',
    changes: 'Adicionada a exibição do AAD Object Id do usuário na Área do Desenvolvedor.',
  },
  {
    version: '0.0.8',
    date: '2026-01-18',
    changes: 'Adicionada nova seção DEV no menu com uma página em branco para desenvolvimento.',
  },
  {
    version: '0.0.7',
    date: '2026-01-18',
    changes: 'Ajustadas configurações de host para 0.0.0.0 e porta para 3000 no vite.config.ts.',
  },
  {
    version: '0.0.6',
    date: '2026-01-18',
    changes: 'Removidos os divisores entre comandos da CommandBar, mantendo espaçamento por gap. Divisores agora aparecem apenas entre categorias (primary/secondary e overflow).',
  },
  {
    version: '0.0.5',
    date: '2026-01-18',
    changes: 'Ajustado o comportamento de overflow da CommandBar para mover comandos ao menu apenas quando não couberem, com cálculo responsivo de largura.',
  },
  {
    version: '0.0.4',
    date: '2026-01-18',
    changes: 'Movido o comando Refresh do overflow para a barra principal na tela Inventory, garantindo visibilidade imediata.',
  },
  {
    version: '0.0.3',
    date: '2026-01-18',
    changes: 'Corrigido desalinhamento vertical na CommandBar removendo wrappers e ajustando os dividers para altura consistente. Botão de overflow padronizado com appearance subtle.',
  },
  {
    version: '0.0.2',
    date: '2026-01-18',
    changes: 'Corrigido layout do CommandBar para seguir o padrão PowerApps. Todos os botões agora são renderizados em sequência da esquerda para a direita, sem espaçamento artificial. Removido justify-content: space-between e consolidado em uma única Toolbar.',
  },
  {
    version: '0.0.1',
    date: '2026-01-18',
    changes: 'Melhorado o posicionamento dos botões no CommandBar em toda a aplicação. Botões de ação primária agora ficam à esquerda, botões utilitários (Refresh, Export, Customize, Settings, Import) à direita. Atualizado CommandBar para usar layout flexbox com justify-content: space-between. Páginas atualizadas: Dashboard, Analytics, Reports e Project Planner.',
  },
];
