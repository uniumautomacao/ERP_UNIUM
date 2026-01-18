export const APP_VERSION = '0.0.23';
export const APP_BUILD_DATE = '2026-01-18';
export const VERSION_HISTORY = [
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
