## Resumo do Canvas App (Power Apps) — `Compras Page`

Este arquivo descreve, com base no conteúdo de `powerapps/unpacked/`, o que o Canvas App **“Compras Page”** fazia, quais **tabelas do Dataverse** ele utilizava e quais eram suas **lógicas de negócio**.

### Visão geral (o que o app fazia)

O app é uma **tela única** (Desktop/Tablet) voltada para o time de **Compras**, com o objetivo de:

- **Identificar itens de “Produtos-Serviço”** que precisam ser comprados (itens associados a uma Ordem de Serviço, ativos e marcados para pedido).
- **Agrupar esses itens por fornecedor principal**, mostrando quais fornecedores têm pendências e quantos itens cada um possui.
- Permitir **selecionar itens** e **iniciar uma Cotação** no Dataverse (criando o registro e vinculando os itens selecionados).
- Calcular e exibir **valor total estimado** da seleção com base na tabela de **Preços de Produtos**.
- Gerar um **resumo copiável** (quantidade + referência) para facilitar envio/registro externo (ex.: pedido ao fornecedor).

### Estrutura (telas e componentes)

- **Telas**
  - `Home Screen`: única tela do app, com lista de fornecedores à esquerda e lista de itens do fornecedor à direita.
- **Componentes**
  - `SearchBox`: componente reutilizável de pesquisa (entrada de texto + ícone), usado para filtrar a lista de fornecedores.
- **Controles/PCFs (terceiros)**
  - PowerCAT: `Fluent Command Bar`, `Fluent Details List`, `Fluent Spinner`
  - CanvizLLCPCF: `PCFCopyTextComponent` (textbox + botão para copiar texto)

### Tabelas do Dataverse utilizadas (Data Sources)

Todas as fontes abaixo aparecem em `powerapps/unpacked/DataSources/*.json` como `NativeCDSDataSourceInfo` (Dataverse), exceto onde indicado.

| Nome no app | Tipo | Logical name / Entity set |
|---|---|---|
| `Produtos-Serviço` | Dataverse | `new_produtoservico` / `new_produtoservicos` |
| `Cotações` | Dataverse | `new_cotacao` / `new_cotacaos` |
| `Preços de Produtos` | Dataverse | `new_precodeproduto` / `new_precodeprodutos` |
| `Fornecedores From Sharepoint Lists` | Dataverse | `cr22f_fornecedoresfromsharepointlist` / `cr22f_fornecedoresfromsharepointlists` |
| `Modelos de Produto From Sharepoint Lists` | Dataverse | `cr22f_modelosdeprodutofromsharepointlist` / `cr22f_modelosdeprodutofromsharepointlists` |
| `Fabricantes From Sharpoint Lists` | Dataverse | `cr22f_fabricantesfromsharpointlist` / `cr22f_fabricantesfromsharpointlists` |
| `AppPreferences` | Dataverse | `new_apppreference` / `new_apppreferences` |
| `Users` | Dataverse (tabela padrão) | `systemuser` / `systemusers` |
| `Ordens de Serviço Field Control` | Dataverse | `new_ordemdeservicofieldcontrol` / `new_ordemdeservicofieldcontrols` |

**Observação importante sobre “From Sharepoint Lists”:** apesar do nome, aqui são tabelas do **Dataverse** (prefixo `cr22f_*`), provavelmente alimentadas por integração/sincronização com listas do SharePoint.

### Mapeamento detalhado de colunas utilizadas (por tabela)

Nesta seção eu listo **todas as colunas do Dataverse** efetivamente utilizadas em fórmulas/controles do app, e **onde** cada uma aparece.

> **Nota sobre nomes de coluna:** o app mistura **Display Names** (ex.: `Previsão de Entrega`) com **nomes internos/invariantes** (ex.: `new_previsaodeentrega`) em funções como `SortByColumns(...)`, `GroupBy(...)` e no `Fluent Details List`.

#### `Produtos-Serviço` (`new_produtoservico`)

- **`Produto-Serviço`** (`new_produtoservicoid`, chave primária)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido` (selecionada via `ShowColumns(...)`)
  - **Usada em** `Home Screen` → iniciar cotação:
    - `Distinct(ProdutosSelecionados, new_produtoservicoid)` (gera lista de IDs)
    - `Filter('Produtos-Serviço', P.'Produto-Serviço' in ProdIds.Result ...)` (busca os registros reais para atualizar)
    - `Patch('Produtos-Serviço', {'Produto-Serviço': ProdServ.'Produto-Serviço', ...})` (atualiza cada item)
  - **Usada em** `Home Screen` → grid (`Fluent Details List`):
    - `RecordKey: ="new_produtoservicoid"` (identifica a linha)
    - `Self.EventRowKey` → `GUID(Self.EventRowKey)` (toggle de seleção)

- **`Ordem de Serviço`** (lookup)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - `!IsBlank(P.'Ordem de Serviço')` (só considera itens vinculados a OS)

- **`Status`** (`statecode`)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - `P.Status = 'Status (Produtos-Serviço)'.Active`

- **`Efetuar Pedido`** (`new_efetuarpedido`, boolean)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - `P.'Efetuar Pedido' = 'Efetuar Pedido (Produtos-Serviço)'.Yes`

- **`Fornecedor Principal Id`** (`new_fornecedorprincipalid`)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - `!IsBlank(P.'Fornecedor Principal Id')`
  - **Usada em** `Src/App.fx.yaml` → `Fornecedores`:
    - `CountIf(ProdutosPedido, P.new_fornecedorprincipalid = F.ID)` (contagem por fornecedor)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - `Filter(ProdutosPedido, P.new_fornecedorprincipalid = FornecedorSelecionadoId)` (itens do fornecedor selecionado)

- **`Cotação`** (lookup para `Cotações`)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - `Or(IsBlank(P.Cotação), P.Cotação.Status <> 'Status (Cotações)'.Active)` (exclui itens com cotação ativa)
  - **Usada em** `Home Screen` → iniciar cotação:
    - `Filter('Produtos-Serviço', ... && IsBlank(P.Cotação))` (garante que só vincula itens ainda sem cotação)
    - `Patch('Produtos-Serviço', {..., Cotação: Results.NovaCotacao})` (vincula lookup)
    - `Filter('Produtos-Serviço', Cotação.Cotação = NovaCotacaoId.Result)` (busca itens já vinculados para calcular valor total da cotação)

- **`Nome do Cliente (Fx)`** (`new_nomedoclientefx`, texto)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - ordenação: `"new_nomedoclientefx"`
    - selecionada: `'Nome do Cliente (Fx)'`
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - `GroupBy(..., new_nomedoclientefx, ...)`
  - **Usada em** `Home Screen` → grid:
    - coluna `"new_nomedoclientefx"`

- **`Referência do Produto`** (`new_referenciadoproduto`, texto)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - ordenação: `"new_referenciadoproduto"`
    - selecionada: `'Referência do Produto'`
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - `GroupBy(..., new_referenciadoproduto, ...)`
  - **Usada em** `Home Screen` → grid:
    - coluna `"new_referenciadoproduto"`
  - **Usada em** `Home Screen` → resumo copiável:
    - `GroupBy(ProdutosSelecionados, new_referenciadoproduto, Items)` e `Group.new_referenciadoproduto`

- **`Previsão de Entrega`** (`new_previsaodeentrega`, data)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - ordenação: `"new_previsaodeentrega"`
    - selecionada: `'Previsão de Entrega'`
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - `GroupBy(..., new_previsaodeentrega, ...)`
    - coluna calculada `DataEntrega = Text(Prods.new_previsaodeentrega, DateTimeFormat.ShortDate, "pt-BR")`
  - **Usada em** `Home Screen` → grid:
    - coluna calculada `PrevisaoEntrega = Text(P.new_previsaodeentrega, DateTimeFormat.ShortDate, "pt-BR")`

- **`Descrição`** (`new_descricao`, texto)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - selecionada: `Descrição`
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - `GroupBy(..., new_descricao, ...)`
  - **Usada em** `Home Screen` → grid:
    - coluna `"new_descricao"`

- **`Quantidade`** (`new_quantidade`, número)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido`:
    - selecionada: `Quantidade`
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor`:
    - agregação: `Sum(Prods.Produtos, P.new_quantidade)`
  - **Usada em** `Home Screen` → grid:
    - coluna `"new_quantidade"`
  - **Usada em** `Home Screen` → valor total e resumo:
    - `Prod.Quantidade` (multiplicação por preço)
    - `Sum(Group.Items, I.new_quantidade)` (resumo por referência)

- **`Entrega Próxima`** (`new_entregaproxima`, boolean)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido` (selecionada)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor` (`GroupBy(..., new_entregaproxima, ...)`)
  - **Observação**: aparece como dimensão de agrupamento; não é exibida diretamente na UI principal.

- **`Nome do Fabricante V2`** (`new_nomedofabricantev2`, texto)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosPedido` (selecionada)
  - **Usada em** `Src/App.fx.yaml` → `ProdutosFornecedor` (`GroupBy(..., new_nomedofabricantev2, ...)`)
  - **Observação**: disponível no dataset agrupado; não é exibida nas colunas do grid.

- **`Produto`** (lookup para “Modelos de Produto From Sharepoint Lists”)
  - **Usada em** `Home Screen` → cálculo de preço:
    - `Prod.Produto.'Modelos de Produto From Sharepoint List'` (id do modelo do item, usado para cruzar com preço)

#### `Cotações` (`new_cotacao`)

- **`Cotação`** (`new_cotacaoid`, chave primária)
  - **Usada em** `Home Screen` → iniciar cotação:
    - retorno da criação: `Patch(...).Cotação` (id do registro criado)
    - `LookUp(Cotações, Cotação = NovaCotacaoId.Result)` (busca o registro para reutilizar como lookup)
  - **Usada em** `Home Screen` → recalcular valor total:
    - `Filter('Produtos-Serviço', Cotação.Cotação = NovaCotacaoId.Result)` (usa o id da cotação via lookup)

- **`Fornecedor`** (lookup para `Fornecedores From Sharepoint Lists`)
  - **Usada em** `Home Screen` → criação:
    - `Patch(Cotações, Defaults(Cotações), {Fornecedor: LookUp('Fornecedores...', F.ID = FornecedorSelecionadoId)})`

- **`Status`** (`statecode`)
  - **Usada em** `Src/App.fx.yaml` indiretamente via `Produtos-Serviço`:
    - `P.Cotação.Status <> 'Status (Cotações)'.Active`

- **`Valor Total`** (`new_valortotal`, moeda/número)
  - **Usada em** `Home Screen` → atualização pós-vínculo:
    - `Patch(Cotações, Results.NovaCotacao, {'Valor Total': <cálculo>})`

#### `Fornecedores From Sharepoint Lists` (`cr22f_fornecedoresfromsharepointlist`)

- **`Status`** (`statecode`)
  - **Usada em** `Src/App.fx.yaml` → `Fornecedores`:
    - `F.Status = 'Status (Fornecedores From Sharepoint Lists)'.Active`

- **`NomeFantasia`** (`cr22f_nomefantasia`)
  - **Usada em** `Src/App.fx.yaml` → `Fornecedores`:
    - `!IsBlank(F.NomeFantasia)`
    - ordenação: `"cr22f_nomefantasia"`
  - **Usada em** `Home Screen` → lista e exibição:
    - pesquisa: `Search(..., NomeFantasia, ...)`
    - `Coalesce(ThisItem.NomeFantasia, ThisItem.RazãoSocial)` (título)

- **`RazãoSocial`** (`cr22f_razosocial`)
  - **Usada em** `Src/App.fx.yaml` → `Fornecedores`:
    - `!IsBlank(F.RazãoSocial)`
  - **Usada em** `Home Screen`:
    - pesquisa: `Search(..., RazãoSocial, ...)`
    - fallback no título: `Coalesce(..., ThisItem.RazãoSocial)`

- **`ID`** (`cr22f_id`)
  - **Usada em** `Src/App.fx.yaml` → `Fornecedores`:
    - join com itens: `P.new_fornecedorprincipalid = F.ID`
  - **Usada em** `Home Screen`:
    - seleção: `Set(FornecedorSelecionadoId, ThisItem.ID)`
    - pesquisa: `Search(..., ID)`
  - **Usada em** `Home Screen` → iniciar cotação:
    - `LookUp('Fornecedores...', F.ID = FornecedorSelecionadoId)` (registro do fornecedor para preencher o lookup em `Cotações`)

- **Coluna calculada (não-Dataverse)**: `Counter`
  - **Criada em** `Src/App.fx.yaml` → `Fornecedores = AddColumns(..., Counter, CountIf(...))`
  - **Usada em** UI para mostrar a quantidade de itens pendentes do fornecedor.

#### `Preços de Produtos` (`new_precodeproduto`)

- **`Status`** (`statecode`)
  - **Usada em** `Home Screen` → cálculo de preço:
    - `Status = 'Status (Preços de Produtos)'.Active`

- **`Modelo de Produto`** (lookup para `Modelos de Produto From Sharepoint Lists`)
  - **Usada em** `Home Screen` → match do preço:
    - `Prec.'Modelo de Produto'.'Modelos de Produto From Sharepoint List' = Prod.Produto.'Modelos de Produto From Sharepoint List'`

- **`Preço de Compra`** (`new_precodecompra`)
  - **Usada em** `Home Screen` → valor total:
    - `LookUp('Preços de Produtos', ...).'Preço de Compra' * Prod.Quantidade`
  - **Usada em** `Home Screen` → valor total da cotação (no Patch):
    - `Cur.Quantidade * LookUp(...).'Preço de Compra'`

#### `Modelos de Produto From Sharepoint Lists` (`cr22f_modelosdeprodutofromsharepointlist`)

- **`Modelos de Produto From Sharepoint List`** (id/chave primária do modelo)
  - **Usada indiretamente** no cruzamento “produto → preço”:
    - lado do preço: `Prec.'Modelo de Produto'.'Modelos de Produto From Sharepoint List'`
    - lado do item: `Prod.Produto.'Modelos de Produto From Sharepoint List'`

#### Tabelas carregadas/atualizadas, mas sem colunas referenciadas em fórmulas

- **`Fabricantes From Sharpoint Lists`**, **`AppPreferences`**, **`Users`**, **`Ordens de Serviço Field Control`**
  - **Uso no app**: apenas `Refresh(...)` no botão “Atualizar”.

### Procedimentos CRUD (Power Fx) utilizados no app (por tabela)

Aqui estão os “procedimentos” de CRUD **exatamente como aparecem** no app. Observação: não existe `Remove(...)`/deleção em Dataverse; o `Remove(...)` do app é apenas para a coleção local `IdsSelecionados`.

#### Procedimento completo (end-to-end): “Iniciar Cotação”

Origem: `Home Screen` → controle `btn_iniciarcotacao` → propriedade `OnSelect`.

Este é o fluxo completo que executa **CREATE em `Cotações`**, **UPDATE em `Produtos-Serviço`** (vincular a cotação), e **UPDATE em `Cotações`** (valor total).

```powerfx
UpdateContext({SpinCounter: SpinCounter + 1});
With(
    {
        Result: ForAll(
            Distinct(
                ProdutosSelecionados,
                new_produtoservicoid
            ),
            {Result: ThisRecord.Value}
        )
    } As ProdIds,
    With(
        {
            Result: Filter(
                'Produtos-Serviço' As P,
                P.'Produto-Serviço' in ProdIds.Result && IsBlank(P.Cotação)
            )
        } As ProdServs,
        If(
            CountRows(ProdServs.Result) > 0,
            With(
                {
                    Result: Patch(
                        Cotações,
                        Defaults(Cotações),
                        {
                            Fornecedor: LookUp(
                                'Fornecedores From Sharepoint Lists' As F,
                                F.ID = FornecedorSelecionadoId
                            )
                        }
                    ).Cotação
                } As NovaCotacaoId,
                If(
                    !IsBlank(NovaCotacaoId),
                    With(
                        {
                            NovaCotacao: LookUp(
                                Cotações,
                                Cotação = NovaCotacaoId.Result
                            ),
                            Fornecedor: LookUp(
                                'Fornecedores From Sharepoint Lists' As F,
                                F.ID = FornecedorSelecionadoId
                            )
                        } As Results,
                        ForAll(
                            ProdServs.Result As ProdServ,
                            Patch(
                                'Produtos-Serviço',
                                {
                                    'Produto-Serviço': ProdServ.'Produto-Serviço',
                                    Cotação: Results.NovaCotacao
                                }
                            )
                        );
                        Patch(
                            Cotações,
                            Results.NovaCotacao,
                            {
                                'Valor Total': With(
                                    {
                                        Result: Filter(
                                            'Produtos-Serviço',
                                            Cotação.Cotação = NovaCotacaoId.Result
                                        )
                                    } As ProdServRelacionados,
                                    Sum(
                                        ProdServRelacionados.Result As Cur,
                                        Cur.Quantidade * LookUp(
                                            'Preços de Produtos',
                                            Status = 'Status (Preços de Produtos)'.Active
                                                && 'Modelo de Produto'.'Modelos de Produto From Sharepoint List'
                                                   = Cur.Produto.'Modelos de Produto From Sharepoint List'
                                        ).'Preço de Compra'
                                    )
                                )
                            }
                        );
                        Select(btn_refreshProdutos);
                        Clear(IdsSelecionados);
                        Launch(
                            "https://unium.crm2.dynamics.com/main.aspx?appid=3ec4d8a9-2a8e-ee11-8179-002248de6f66&forceUCI=1&pagetype=entityrecord&etn=new_cotacao&id=" & NovaCotacaoId.Result,
                            Blank(),
                            LaunchTarget.New
                        )
                    )
                )
            )
        )
    )
);
UpdateContext({SpinCounter: SpinCounter - 1})
```

#### Procedimento completo (UI): Toggle de seleção no grid

Origem: `Home Screen` → controle `ProdutosDList` (Fluent Details List) → propriedade `OnChange`.

Apesar de não ser CRUD de Dataverse, este trecho é importante porque ele gera a lista de IDs (`IdsSelecionados`) que alimenta os `Filter(...)`/`Patch(...)` do Dataverse no fluxo acima.

```powerfx
Set(
    Debug,
    Self.EventRowKey
);
If(
    And(
        Self.EventName = "CellAction",
        Self.EventColumn = "IconeSelecionado",
        !IsBlank(Self.EventRowKey)
    ),
    With(
        {Value: GUID(Self.EventRowKey)} As Key,
        If(
            IsBlank(
                LookUp(
                    IdsSelecionados As Id,
                    Id.Value = Key.Value
                )
            ),
            Collect(
                IdsSelecionados,
                Key
            ),
            Remove(
                IdsSelecionados,
                Key
            )
        )
    )
)
```

#### Leitura (READ) usada na UI: “Valor Total” da seleção

Origem: `Home Screen` → label `lbl_produtosParaCompra_ValorTotal` → propriedade `Text`.

```powerfx
"Valor Total: " & With(
    {
        Result: ForAll(
            Distinct(
                ProdutosSelecionados As X,
                X.new_produtoservicoid
            ),
            {Result: ThisRecord.Value}
        )
    } As SelecaoIds,
    With(
        {
            Result: Filter(
                'Produtos-Serviço',
                'Produto-Serviço' in SelecaoIds.Result
            )
        } As Selecao,
        Text(
            Sum(
                Selecao.Result As Prod,
                LookUp(
                    'Preços de Produtos' As Prec,
                    Prec.'Modelo de Produto'.'Modelos de Produto From Sharepoint List'
                        = Prod.Produto.'Modelos de Produto From Sharepoint List'
                ).'Preço de Compra' * Prod.Quantidade
            ),
            "[$-pt-BR]R$#.##0,00"
        )
    )
)
```

#### Leitura (READ) usada na UI: “Resumo copiável” (quantidade x referência)

Origem: `Home Screen` → controle `PCFCopyTextComponent1` → propriedade `Value`.

```powerfx
Concat(
    ForAll(
        SortByColumns(
            GroupBy(
                ProdutosSelecionados,
                new_referenciadoproduto,
                Items
            ),
            "new_referenciadoproduto",
            SortOrder.Ascending
        ) As Group,
        Concatenate(
            Sum(
                Group.Items As I,
                I.new_quantidade
            ),
            "x ",
            Group.new_referenciadoproduto
        )
    ) As Cur,
    Cur.Value,
    Char(13)
)
```

#### `Cotações` — CREATE / READ / UPDATE

**CREATE (criar cotação)** — `Home Screen` → `btn_iniciarcotacao.OnSelect`:

```powerfx
Patch(
    Cotações,
    Defaults(Cotações),
    {
        Fornecedor: LookUp(
            'Fornecedores From Sharepoint Lists' As F,
            F.ID = FornecedorSelecionadoId
        )
    }
).Cotação
```

**READ (buscar a cotação recém-criada como registro)** — usado para ter o “registro” e reutilizar no lookup do item:

```powerfx
LookUp(
    Cotações,
    Cotação = NovaCotacaoId.Result
)
```

**UPDATE (atualizar `Valor Total`)** — após vincular itens:

```powerfx
Patch(
    Cotações,
    Results.NovaCotacao,
    {
        'Valor Total': With(
            {
                Result: Filter(
                    'Produtos-Serviço',
                    Cotação.Cotação = NovaCotacaoId.Result
                )
            } As ProdServRelacionados,
            Sum(
                ProdServRelacionados.Result As Cur,
                Cur.Quantidade * LookUp(
                    'Preços de Produtos',
                    Status = 'Status (Preços de Produtos)'.Active
                        && 'Modelo de Produto'.'Modelos de Produto From Sharepoint List'
                           = Cur.Produto.'Modelos de Produto From Sharepoint List'
                ).'Preço de Compra'
            )
        )
    }
)
```

#### `Produtos-Serviço` — READ / UPDATE

**READ (base do app: itens “para pedido”)** — `Src/App.fx.yaml` → `ProdutosPedido`:

```powerfx
ProdutosPedido = ShowColumns(
    SortByColumns(
        Filter(
            'Produtos-Serviço' As P,
            !IsBlank(P.'Ordem de Serviço'),
            P.Status = 'Status (Produtos-Serviço)'.Active,
            P.'Efetuar Pedido' = 'Efetuar Pedido (Produtos-Serviço)'.Yes,
            !IsBlank(P.'Fornecedor Principal Id'),
            Or(
                IsBlank(P.Cotação),
                P.Cotação.Status <> 'Status (Cotações)'.Active
            )
        ),
        "new_previsaodeentrega",
        SortOrder.Ascending,
        "new_nomedoclientefx",
        SortOrder.Ascending,
        "new_referenciadoproduto",
        SortOrder.Ascending
    ),
    'Produto-Serviço',
    'Nome do Cliente (Fx)',
    'Referência do Produto',
    'Entrega Próxima',
    'Previsão de Entrega',
    Descrição,
    Quantidade,
    'Fornecedor Principal Id',
    'Nome do Fabricante V2'
)
```

**READ (trazer registros reais a partir dos IDs selecionados)** — `Home Screen` → iniciar cotação:

```powerfx
Filter(
    'Produtos-Serviço' As P,
    P.'Produto-Serviço' in ProdIds.Result && IsBlank(P.Cotação)
)
```

**UPDATE (vincular cada item à cotação)** — `Home Screen` → `ForAll(... Patch('Produtos-Serviço' ...))`:

```powerfx
Patch(
    'Produtos-Serviço',
    {
        'Produto-Serviço': ProdServ.'Produto-Serviço',
        Cotação: Results.NovaCotacao
    }
)
```

#### `Fornecedores From Sharepoint Lists` — READ

**READ (fornecedores com pendências + contador)** — `Src/App.fx.yaml` → `Fornecedores`:

```powerfx
Fornecedores = Filter(
    AddColumns(
        SortByColumns(
            Filter(
                'Fornecedores From Sharepoint Lists' As F,
                F.Status = 'Status (Fornecedores From Sharepoint Lists)'.Active,
                !IsBlank(F.NomeFantasia),
                !IsBlank(F.RazãoSocial)
            ),
            "cr22f_nomefantasia",
            SortOrder.Ascending
        ) As F,
        Counter,
        CountIf(
            ProdutosPedido As P,
            P.new_fornecedorprincipalid = F.ID
        )
    ) As F,
    F.Counter > 0
)
```

**READ (buscar o fornecedor para preencher lookup em `Cotações`)** — em `btn_iniciarcotacao.OnSelect`:

```powerfx
LookUp(
    'Fornecedores From Sharepoint Lists' As F,
    F.ID = FornecedorSelecionadoId
)
```

#### `Preços de Produtos` — READ

Não há criação/edição de preço no app; apenas leitura pontual via `LookUp(...)` para cálculo.

**READ (obter preço de compra do modelo do item)** — aparece no cálculo do valor total (label) e no update de `Cotações`:

```powerfx
LookUp(
    'Preços de Produtos' As Prec,
    Prec.Status = 'Status (Preços de Produtos)'.Active
        && Prec.'Modelo de Produto'.'Modelos de Produto From Sharepoint List'
           = Prod.Produto.'Modelos de Produto From Sharepoint List'
).'Preço de Compra'
```

### Funcionalidades (todas)

- **Listar fornecedores com pendências**
  - Filtra fornecedores ativos e com Nome Fantasia/Razão Social preenchidos.
  - Calcula um **contador** por fornecedor baseado em quantos itens de `Produtos-Serviço` (pendentes de pedido) estão associados àquele fornecedor.
  - Mostra apenas fornecedores com contador > 0.
  - Permite **pesquisa** (Search) na lista por `NomeFantasia`, `RazãoSocial` e `ID`.

- **Selecionar um fornecedor e carregar seus itens**
  - Ao escolher um fornecedor, define o `FornecedorSelecionadoId` (global) e recalcula a lista de itens desse fornecedor.
  - Se o fornecedor mudar, limpa a seleção anterior (`IdsSelecionados`).

- **Listar itens “Produtos-Serviço” para compra**
  - Exibe os itens do fornecedor selecionado em uma grade moderna (`Fluent Details List`) com colunas:
    - Quantidade, Cliente, Referência, Descrição, Previsão (data formatada pt-BR)
  - Permite **marcar/desmarcar itens** clicando no ícone (círculo vs check), mantendo estado em `IdsSelecionados` (coleção local).

- **Ações rápidas**
  - **Fechar**: limpa o fornecedor selecionado e a seleção de itens.
  - **Selecionar Tudo**: adiciona todos os ids em `IdsSelecionados`.
  - **Limpar Seleção**: limpa `IdsSelecionados`.
  - **Atualizar**: executa `Refresh(...)` de várias tabelas (produtos, preços, cotações, etc.).

- **Calcular o “Valor Total” estimado da seleção**
  - Para cada item selecionado, busca o **preço de compra** em `Preços de Produtos` (apenas preços ativos),
    fazendo o match pelo **Modelo de Produto** do item.
  - Soma \(Quantidade \times Preço\) e formata como moeda pt-BR.

- **Iniciar Cotação (criar Cotação + vincular itens)**
  - Cria um novo registro em `Cotações` com o lookup `Fornecedor` preenchido a partir do fornecedor selecionado.
  - Para cada `Produto-Serviço` selecionado (e ainda sem cotação), faz `Patch` no item para preencher o lookup `Cotação`.
  - Atualiza o registro da `Cotação` com `Valor Total` calculado (soma de Quantidade * Preço de Compra dos itens vinculados).
  - Atualiza os dados (`Refresh`) e limpa a seleção.
  - Abre o registro recém-criado no Dynamics (model-driven) via `Launch(...)` em nova aba.

- **Gerar/“Imprimir Resumo” (texto copiável)**
  - Ao clicar em “Imprimir Resumo”, mostra um componente de copiar texto que:
    - Agrupa os itens selecionados por **referência do produto**
    - Gera linhas no formato: `"{qtd}x {referência}"` separadas por quebra de linha
    - Facilita copiar e colar em e-mail/WhatsApp/ERP etc.

### Lógicas de negócio (regras e critérios)

#### 1) Critério de “Produtos para pedido” (base do app)

O conjunto principal (`ProdutosPedido`) vem de `Produtos-Serviço` e inclui somente itens que:

- **Possuem “Ordem de Serviço”** preenchida
- Estão com **Status = Active**
- Estão marcados para compra: **“Efetuar Pedido” = Yes**
- Possuem **“Fornecedor Principal Id”** preenchido
- **Não estão em cotação ativa**:
  - Ou `Cotação` está em branco, **ou**
  - `Cotação.Status <> Active`

Além disso, os itens são ordenados por:
- `Previsão de Entrega` (crescente), depois
- `Nome do Cliente (Fx)` (crescente), depois
- `Referência do Produto` (crescente)

#### 2) Critério de fornecedores exibidos

O conjunto `Fornecedores` filtra `Fornecedores From Sharepoint Lists` para:

- `Status = Active`
- `NomeFantasia` e `RazãoSocial` não vazios
- E mantém apenas fornecedores com **Counter > 0**, onde:
  - `Counter = CountIf(ProdutosPedido, fornecedorPrincipalId == fornecedor.ID)`

#### 3) Seleção de itens (coleção local)

- A seleção é controlada por `IdsSelecionados` (coleção de GUIDs).
- O grid dispara eventos (CellAction) e o app alterna:
  - Se o id não está em `IdsSelecionados` → `Collect`
  - Se já está → `Remove`

#### 4) Criação e atualização da cotação

Fluxo de “Iniciar Cotação”:

- **Cria a cotação** (`Patch(Cotações, Defaults(Cotações), {Fornecedor: ...})`)
- **Vincula itens** (`Patch('Produtos-Serviço', {'Produto-Serviço': <id>, Cotação: <registro>})`)
- **Recalcula Valor Total** da cotação usando:
  - `Sum(ItensDaCotacao, Quantidade * PreçoDeCompraDoModelo)`

> Há indícios de tentativa anterior de usar `Relate(...)` (comentado), mas o app efetivamente vincula via `Patch` no lookup.

### Variáveis/estado relevantes

- **`FornecedorSelecionadoId` (global)**: fornecedor atualmente selecionado.
- **`IdsSelecionados` (coleção)**: ids dos itens `Produtos-Serviço` marcados para cotação.
- **`SpinCounter` (contexto da tela)**: contador para exibir/ocultar spinner durante operações.
- **`ShowPrintSummaryWindow` (contexto da tela)**: controla visibilidade do painel de “Imprimir Resumo”.
- **Tema**: `AppTheme` e `AppThemeJson` são montados no `OnStart` e usados nos PCFs.

### Observações técnicas (como o app opera)

- **Sem navegação**: não há `Navigate(...)`; é um app “single page”.
- **Sem formulários**: não há `SubmitForm(...)`; toda escrita é via `Patch(...)`.
- **Limite de linhas**: o app considera o limite padrão de \(2000\) registros por fonte e exibe uma “capacidade” como `CountRows(ProdutosPedido)/2000`.
- **Refresh**: há um botão “Atualizar” que faz `Refresh(...)` de várias tabelas para forçar recálculo dos conjuntos e dados no cliente.

