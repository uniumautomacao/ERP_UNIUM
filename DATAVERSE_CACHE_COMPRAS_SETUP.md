## Cache Compras - Setup restante no Dataverse

Este arquivo documenta os passos manuais restantes no Dataverse
para concluir o cache diario de compras.

### Tabela
- Logical name: `new_cachecomprasprodutospendentes`
- Display name: `Cache - Compras (Produtos pendentes)`

### Colunas ja criadas via MCP
- `new_snapshotdate` (Date Only)
- `new_snapshotdatetime` (Date and Time)
- `new_sourcesystem` (Text, 50)
- `new_referenciadoproduto` (Text, 255)
- `new_descricao` (Text, 4000)
- `new_quantidade` (Whole Number)
- `new_nomedoclientefx` (Text, 255)
- `new_previsaodeentrega` (Date and Time)
- `new_datalimiteparapedido` (Date and Time)
- `new_diasparapedido` (Decimal)
- `new_faixadeprazo` (Choice)
- `new_nomedofornecedorprincipal` (Text, 255)
- `new_fornecedorprincipalid` (Text, 64)
- `new_nomedofabricante` (Text, 255)
- `new_apelidodoprojetofx` (Text, 255)
- `new_source_modifiedon` (Date and Time)

### Colunas de lookup (status)
Relacionamentos 1:N (lookup) ja criados via script:
1) `new_produtoservico` -> `new_produtoservicos`
   - Schema name: `new_CacheComprasProdutosPendentes_ProdutoServico`
2) `new_cotacao` -> `new_cotacaos` (opcional)
   - Schema name: `new_CacheComprasProdutosPendentes_Cotacao`
3) `new_modelodeprodutooriginal` -> `cr22f_modelosdeprodutofromsharepointlists` (opcional)
   - Schema name: `new_CacheComprasProdutosPendentes_ModeloDeProdutoOriginal`

### Colunas calculadas (criar manualmente)
Crie as colunas como **Calculated** (SourceType = Calculated), usando o
lookup `new_produtoservico`:

1) `new_contemcotacao` (Yes/No)
   - Formula: `NOT(ISBLANK(new_produtoservico.new_cotacao))`

2) `new_original_ativo` (Yes/No)
   - Formula: `new_produtoservico.statecode = 0`

3) `new_original_pendente_para_compras` (Yes/No)
   - Formula (modelo):
     `AND(` +
     `new_produtoservico.statecode = 0,` +
     `ISBLANK(new_produtoservico.new_cotacao),` +
     `new_produtoservico.new_opcaodefornecimento = 100000000,` +
     `new_produtoservico.new_eemprestimo <> true,` +
     `NOT(ISBLANK(new_produtoservico.new_fornecedorprincipalid))` +
     `)`

### Alternate Key (idempotencia do dataflow)
Criar chave alternativa:
- `AK_cachecompras_snapshot_produto`
  - `new_snapshotdate` + `new_produtoservico`

### Purge diario
Configure um **Bulk Delete Job** (ou Power Automate) com regra:
- `new_snapshotdate < Today()`

Agendar antes do dataflow diario (ou logo apos).
