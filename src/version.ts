export const APP_VERSION = '0.1.58';
export const APP_BUILD_DATE = '2026-01-24';
export const VERSION_HISTORY = [
  {
    version: '0.1.58',
    date: '2026-01-24',
    changes: 'Ajustado z-index de nós/arestas no React Flow para garantir arestas visíveis.',
  },
  {
    version: '0.1.57',
    date: '2026-01-24',
    changes: 'Arestas do React Flow elevadas acima dos nós para melhor visualização.',
  },
  {
    version: '0.1.56',
    date: '2026-01-24',
    changes: 'Ajustado espaçamento e tamanho de nós no layout ELK para evitar sobreposição.',
  },
  {
    version: '0.1.55',
    date: '2026-01-24',
    changes:
      'Reformulado Guia de Conexões v2: layout automático com nó raiz, sem drag e inclusão baseada em conexões.',
  },
  {
    version: '0.1.54',
    date: '2026-01-24',
    changes: 'Implementado Guia de Conexões v2 com canvas interativo, paleta, auto-layout e persistência local.',
  },
  {
    version: '0.1.53',
    date: '2026-01-24',
    changes: 'Publicação do app no PowerApps conforme solicitado pelo usuário.',
  },
  {
    version: '0.1.52',
    date: '2026-01-23',
    changes: 'Dropdown de Vincular Conexão agora mostra todas as conexões compatíveis ao clique, sem precisar digitar.',
  },
  {
    version: '0.1.51',
    date: '2026-01-23',
    changes: 'Removidos botões Relatório e CSV Etiquetas do CommandBar do Guia de Conexões.',
  },
  {
    version: '0.1.50',
    date: '2026-01-23',
    changes: 'Removida coluna Produto-Serviço do grid principal de Guia de Conexões.',
  },
  {
    version: '0.1.49',
    date: '2026-01-23',
    changes:
      'Adicionada exclusão em lote de equipamentos no Guia de Conexões (desvincula e apaga conexões).',
  },
  {
    version: '0.1.48',
    date: '2026-01-23',
    changes:
      'Corrige criação de conexões com bindings corretos e validação de falhas.',
  },
  {
    version: '0.1.47',
    date: '2026-01-23',
    changes:
      'Corrigido casing dos bindings @odata.bind em new_deviceio (new_ModelodeProduto/new_Projeto/new_Produto).',
  },
  {
    version: '0.1.46',
    date: '2026-01-23',
    changes: 'Ajuste no binding de lookups para usar nomes lógicos sem _value.',
  },
  {
    version: '0.1.45',
    date: '2026-01-23',
    changes: 'Corrigido binding de lookups em Gerar Pendências: usar _new_*.value@odata.bind para todos os lookups.',
  },
  {
    version: '0.1.44',
    date: '2026-01-23',
    changes: 'Corrigido binding de modelo em Gerar Pendências: usar navigation property new_new_deviceio_ModelodeProduto_cr22f_modelo ao invés de new_modelodeproduto.',
  },
  {
    version: '0.1.43',
    date: '2026-01-23',
    changes: 'Adicionados logs detalhados de erro ao criar equipamentos em Gerar Pendências para diagnóstico.',
  },
  {
    version: '0.1.42',
    date: '2026-01-23',
    changes: 'Usa lookup _new_produto_value para resolver modelo nas pendências.',
  },
  {
    version: '0.1.41',
    date: '2026-01-23',
    changes: 'Resolve modelo por dispositivos existentes ou referência na geração.',
  },
  {
    version: '0.1.40',
    date: '2026-01-23',
    changes: 'Fallback do modelo por referencia ao gerar pendências.',
  },
  {
    version: '0.1.39',
    date: '2026-01-23',
    changes: 'Usa modelo do produto ao gerar pendências no guia de conexões.',
  },
  {
    version: '0.1.38',
    date: '2026-01-23',
    changes: 'Permite selecionar quais pendências gerar no guia de conexões.',
  },
  {
    version: '0.1.37',
    date: '2026-01-23',
    changes: 'Exibe referência do produto nas pendências do guia de conexões.',
  },
  {
    version: '0.1.36',
    date: '2026-01-22',
    changes: 'Log de erro ao limpar vínculo para diagnóstico.',
  },
  {
    version: '0.1.35',
    date: '2026-01-22',
    changes: 'Ajustado limpeza de vínculo usando new_connectedto = null.',
  },
  {
    version: '0.1.34',
    date: '2026-01-22',
    changes:
      'Modal de detalhes ampliado e tipos de conexão exibidos com display name do optionset.',
  },
  {
    version: '0.1.33',
    date: '2026-01-22',
    changes: 'Fechamento do modal de detalhes corrigido com render condicional.',
  },
  {
    version: '0.1.32',
    date: '2026-01-22',
    changes: 'Ajustado controle de abertura/fechamento do modal de detalhes.',
  },
  {
    version: '0.1.31',
    date: '2026-01-22',
    changes:
      'Reformulado modal de detalhes do equipamento com accordion em árvore, resolução de destinos e vínculo via sub-dialog.',
  },
  {
    version: '0.1.30',
    date: '2026-01-22',
    changes:
      'Implementado Guia de Conexões com rotas, tela principal, detalhes, geração de pendências e exports (CSV/Mermaid/relatório).',
  },
  {
    version: '0.1.29',
    date: '2026-01-22',
    changes:
      'SearchableCombobox agora só busca após digitação; lista vazia até usuário informar termo.',
  },
  {
    version: '0.1.28',
    date: '2026-01-22',
    changes:
      'Corrigido carregamento de rótulos no formulário de Regime de Cotação para o SearchableCombobox de Modelo.',
  },
  {
    version: '0.1.27',
    date: '2026-01-22',
    changes:
      'Corrigido carregamento de rótulos em Modo Editar de Preço de Produto para Modelo e Fornecedor no SearchableCombobox.',
  },
  {
    version: '0.1.26',
    date: '2026-01-22',
    changes:
      'Corrigido SearchableCombobox para permitir digitação livre no campo de busca usando estado interno sincronizado.',
  },
  {
    version: '0.1.25',
    date: '2026-01-22',
    changes:
      'Substituídos Dropdowns estáticos por SearchableCombobox com busca delegável ao Dataverse (contains) para Modelos, Fabricantes e Fornecedores nas abas de Ajustes de Cadastro de Produtos. Listbox limitado a 300px de altura com scroll.',
  },
  {
    version: '0.1.24',
    date: '2026-01-22',
    changes:
      'Nova página Ajustes de Cadastro de Produtos com edição, duplicação e cópia de modelos, preços e regimes em fluxo unificado.',
  },
  {
    version: '0.1.23',
    date: '2026-01-22',
    changes: 'Ajustada busca de templates para executar apenas ao pressionar Enter, removendo busca automática durante digitação.',
  },
  {
    version: '0.1.22',
    date: '2026-01-22',
    changes: 'Adicionado destaque visual nos campos alterados do modal de comparação do modelo.',
  },
  {
    version: '0.1.21',
    date: '2026-01-22',
    changes:
      'Adicionado modal para detectar referência existente e permitir atualização do modelo com comparação de campos.',
  },
  {
    version: '0.1.20',
    date: '2026-01-22',
    changes: 'Ajustado tratamento do campo validade ao copiar regimes de cotação temporária.',
  },
  {
    version: '0.1.19',
    date: '2026-01-22',
    changes:
      'Adicionada edição de descrição, markup, validade e desconto nos regimes de cotação temporária copiados.',
  },
  {
    version: '0.1.18',
    date: '2026-01-22',
    changes: 'Corrigida ordem de inicialização do carregamento de regimes na página Cadastro Rápido de Produto.',
  },
  {
    version: '0.1.17',
    date: '2026-01-22',
    changes:
      'Adicionada opção de copiar regimes de cotação temporária e serviços do regime na página Cadastro Rápido de Produto.',
  },
  {
    version: '0.1.16',
    date: '2026-01-22',
    changes: 'Alterada busca de templates de produto para usar contains (delegável) em vez de startswith na página Cadastro Rápido de Produto.',
  },
  {
    version: '0.1.15',
    date: '2026-01-22',
    changes: 'Corrigido tipo do campo cr22f_horasagregadas (string em vez de number) na criação de modelos de produto.',
  },
  {
    version: '0.1.14',
    date: '2026-01-22',
    changes: 'Adicionados logs detalhados na função de criação de novo item na página Cadastro Rápido de Produto para facilitar debug de erros.',
  },
  {
    version: '0.1.13',
    date: '2026-01-22',
    changes: 'Melhorado layout dos formulários na página Cadastro Rápido de Produto: labels acima dos campos, espaçamentos otimizados e UI mais limpa.',
  },
  {
    version: '0.1.12',
    date: '2026-01-22',
    changes: 'Adicionados labels com Display Names nos campos dos formulários da página Cadastro Rápido de Produto.',
  },
  {
    version: '0.1.11',
    date: '2026-01-22',
    changes: 'Adicionada a página Cadastro Rápido de Produto com clonagem de modelos, preços e vínculos de serviços.',
  },
  {
    version: '0.1.10',
    date: '2026-01-22',
    changes: 'Importadas tabelas do Dataverse: new_cotacaotemporariadeproduto, new_regimedecotacaotemporaria e new_tipodeservicoregimedecotacaotemporaria.',
  },
  {
    version: '0.1.9',
    date: '2026-01-22',
    changes: 'Importadas tabelas do Dataverse: new_precodeproduto, cr22f_fornecedoresfromsharepointlist, new_tiposervicoprecodeproduto e new_tipodeservico.',
  },
  {
    version: '0.1.8',
    date: '2026-01-22',
    changes: 'Lista do dia agora combina duas consultas: itens contados hoje têm prioridade e são mesclados com pendentes, mantendo o total máximo de 200 registros.',
  },
  {
    version: '0.1.7',
    date: '2026-01-22',
    changes: 'Novo fluxo de Contagem de Estoque: suporte a leitor Bluetooth, bipagem sequencial de produtos sem modal (quantidade=1 assume automaticamente, >1 abre modal), armazenamento local temporário até bipar endereço que confirma e persiste todas as contagens, atualização de endereço se diferente, registro de leituras em new_registrodeleiturademercadoriaemestoque, filtro para mostrar apenas pendentes, itens contados hoje permanecem visíveis com status OK.',
  },
  {
    version: '0.1.6',
    date: '2026-01-22',
    changes: 'Reformulada a Lista do Dia na Contagem de Estoque Mobile: agora usa Accordion para agrupar itens por endereço, ordenados por prioridade (mais atrasados primeiro), com badges de status, botão Expandir/Recolher Todos e melhor navegação para estoquistas.',
  },
  {
    version: '0.1.5',
    date: '2026-01-22',
    changes: 'Importada a pagina Galeria de Fotos em Instalações, mantendo a logica do app e adaptando a UI ao template.',
  },
  {
    version: '0.1.4',
    date: '2026-01-21',
    changes: 'Importada nova tabela do Dataverse: new_s3objects.',
  },
  {
    version: '0.1.3',
    date: '2026-01-21',
    changes: 'Corrigidos cliques de gráficos na Inteligência Comercial: BarChart passa o item correto ao modal, LineChart suporta clique em todos os pontos com série identificada e filtros de valores “Sem ...” delegáveis no Dataverse.',
  },
  {
    version: '0.1.2',
    date: '2026-01-21',
    changes: 'Corrigidos cliques e filtros na Inteligência Comercial: identificação da série clicada no gráfico comparativo, filtro de evolução por mês/ano correto, produto vs serviço delegável e busca OData com escape.',
  },
  {
    version: '0.1.1',
    date: '2026-01-21',
    changes: 'Ajustada a Análise ABC para agrupar produtos por referência (modelo), mantendo a descrição apenas para exibição.',
  },
  {
    version: '0.1.0',
    date: '2026-01-21',
    changes: 'Adicionada aba de Análise ABC na Inteligência Comercial: permite classificar produtos por faturamento ou lucro em classes A/B/C (~80%/15%/5%), com filtro de período delegável ao Dataverse, KPIs por classe, gráfico de distribuição e tabela detalhada.',
  },
  {
    version: '0.0.131',
    date: '2026-01-21',
    changes: 'Corrigidos eventos de clique nos gráficos BarChart e LineChart: BarChart agora usa diretamente o parâmetro data do handler, e LineChart implementa activeDot customizado para capturar cliques nos pontos das linhas.',
  },
  {
    version: '0.0.130',
    date: '2026-01-21',
    changes: 'Adicionada funcionalidade de clique nos gráficos da Inteligência Comercial: ao clicar em qualquer item (fabricante, vendedor, arquiteto, categoria, etc), abre modal com KPIs agregados e tabela detalhada de todas as vendas relacionadas.',
  },
  {
    version: '0.0.129',
    date: '2026-01-21',
    changes: 'Corrigida margem esquerda dos gráficos na Inteligência Comercial: valores monetários no eixo Y não são mais cortados, com margem de 80px para acomodar valores formatados (R$).',
  },
  {
    version: '0.0.128',
    date: '2026-01-21',
    changes: 'Ajustada formatação de valores monetários nos gráficos da Inteligência Comercial: todos os valores monetários agora são exibidos no padrão brasileiro (R$) nos tooltips e eixos dos gráficos.',
  },
  {
    version: '0.0.127',
    date: '2026-01-21',
    changes: 'Adicionada aba de Comparação Ano a Ano na Inteligência Comercial: permite comparar métricas entre dois anos selecionados com KPIs comparativos, evolução mensal e gráficos lado a lado.',
  },
  {
    version: '0.0.126',
    date: '2026-01-21',
    changes: 'Melhorado layout responsivo dos filtros na Inteligência Comercial: ajustado wrap e larguras máximas. Busca agora dispara apenas ao pressionar Enter.',
  },
  {
    version: '0.0.125',
    date: '2026-01-21',
    changes: 'Adicionada opção "Todos os tempos" no filtro de período da Inteligência Comercial para visualizar vendas sem restrição de data.',
  },
  {
    version: '0.0.124',
    date: '2026-01-21',
    changes: 'Adicionado filtro por arquiteto e campo de busca global delegável (cliente, produto, fabricante, vendedor, arquiteto, referência, ID) na Inteligência Comercial.',
  },
  {
    version: '0.0.123',
    date: '2026-01-21',
    changes: 'Adicionada opção de período personalizado na Inteligência Comercial com seleção de data inicial e final.',
  },
  {
    version: '0.0.122',
    date: '2026-01-21',
    changes: 'Adicionado filtro de período na Inteligência Comercial com opções: Este ano (padrão), Últimos 30 dias, Últimos 12 meses e Este semestre.',
  },
  {
    version: '0.0.121',
    date: '2026-01-21',
    changes: 'Adicionada seção Comercial com página Inteligência Comercial: dashboards, gráficos e análises de vendas da tabela new_registrodevenda.',
  },
  {
    version: '0.0.120',
    date: '2026-01-21',
    changes: 'Centralizada definição de páginas para gerar rotas e matriz automaticamente.',
  },
  {
    version: '0.0.119',
    date: '2026-01-21',
    changes: 'Importada nova tabela do Dataverse: new_registrodevenda.',
  },
  {
    version: '0.0.118',
    date: '2026-01-21',
    changes: 'Corrigido erro de tipagem em useMercadoriaReader para endereco.',
  },
  {
    version: '0.0.117',
    date: '2026-01-21',
    changes: 'Republicação incremental solicitada pelo usuário.',
  },
  {
    version: '0.0.116',
    date: '2026-01-21',
    changes: 'Oculta aba de número de série em atualizações em lote (apenas endereço permitido).',
  },
  {
    version: '0.0.115',
    date: '2026-01-21',
    changes: 'Adiciona botão de refresh e altera ícone de ativação em lote para evitar confusão.',
  },
  {
    version: '0.0.114',
    date: '2026-01-21',
    changes: 'Centraliza lógica de status ativo/inativo (Status + Tag Confirmada).',
  },
  {
    version: '0.0.113',
    date: '2026-01-21',
    changes: 'Renomeia rótulo do leitor bluetooth.',
  },
  {
    version: '0.0.112',
    date: '2026-01-21',
    changes: 'Remove simulador de leitura modo DEV da página de Leitor de Mercadorias.',
  },
  {
    version: '0.0.111',
    date: '2026-01-21',
    changes: 'Adiciona suporte ao leitor Bluetooth e lista para remover códigos antes do processamento.',
  },
  {
    version: '0.0.110',
    date: '2026-01-21',
    changes: 'Ignora erros transitórios do scanner (checksum/format) para evitar mensagens falsas.',
  },
  {
    version: '0.0.109',
    date: '2026-01-21',
    changes: 'Adiciona a página Leitor de Mercadorias com scanner QR/Barcode, ativação em lote e atualização de informações.',
  },
  {
    version: '0.0.108',
    date: '2026-01-21',
    changes: 'Importada nova tabela do Dataverse: new_registrodeleiturademercadoriaemestoque.',
  },
  {
    version: '0.0.107',
    date: '2026-01-21',
    changes: 'Menu de Vistorias: Contagem de Estoque agora só fica ativa na rota exata, evitando destaque simultâneo com Gestão de Contagem.',
  },
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
