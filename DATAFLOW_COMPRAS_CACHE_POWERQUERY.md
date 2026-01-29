## Dataflow - Cache Compras (Produtos pendentes)

Este arquivo contem a Power Query (M) para o dataflow que popula diariamente
`new_cachecomprasprodutospendentes`.

### Variaveis a ajustar
- `EnvironmentUrl`: URL do seu org Dataverse.

### Power Query (M)
```powerquery
let
  EnvironmentUrl = "https://unium.crm2.dynamics.com",
  SnapshotDate = Date.From(DateTimeZone.FixedUtcNow()),
  SnapshotDateTime = DateTimeZone.FixedUtcNow(),

  // Filtro base (espelhado da GestaoComprasPage)
  FilterText = Text.Combine({
    "statecode eq 0",
    "_new_ordemdeservico_value ne null",
    "new_fornecedorprincipalid ne null",
    "new_opcaodefornecimento eq 100000000",
    "_new_cotacao_value eq null",
    "new_eemprestimo ne true",

    // new_situacaoreserva != (lista usada na UI)
    "new_situacaoreserva ne 100000000",
    "new_situacaoreserva ne 100000001",
    "new_situacaoreserva ne 100000002",
    "new_situacaoreserva ne 100000003",
    "new_situacaoreserva ne 100000004",
    "new_situacaoreserva ne 100000005",
    "new_situacaoreserva ne 100000008",
    "new_situacaoreserva ne 100000009",
    "new_situacaoreserva ne 1000000010",
    "new_situacaoreserva ne 1000000011",

    // Regra de data limite / cliente especifico
    "(new_datalimiteparapedido ne null or _new_cliente_value eq 79d96ce3-23e3-ef11-9342-6045bd3b8bec)"
  }, " and "),

  SelectText = Text.Combine({
    "new_produtoservicoid",
    "new_referenciadoproduto",
    "new_descricao",
    "new_quantidade",
    "new_nomedoclientefx",
    "new_previsaodeentrega",
    "new_datalimiteparapedido",
    "new_diasparapedido",
    "new_faixadeprazo",
    "new_nomedofornecedorprincipal",
    "new_fornecedorprincipalid",
    "new_nomedofabricante",
    "new_apelidodoprojetofx",
    "_new_modelodeprodutooriginal_value",
    "modifiedon"
  }, ","),

  Url = EnvironmentUrl & "/api/data/v9.2/new_produtoservicos?$select=" & SelectText & "&$filter=" & Uri.EscapeDataString(FilterText),
  Source = OData.Feed(Url, null, [Implementation = "2.0"]),

  // Normaliza para o formato do cache
  AddSnapshotDate = Table.AddColumn(Source, "new_snapshotdate", each SnapshotDate, type date),
  AddSnapshotDateTime = Table.AddColumn(AddSnapshotDate, "new_snapshotdatetime", each SnapshotDateTime, type datetimezone),

  // Lookup destino: new_produtoservico (GUID do registro original)
  AddLookupToOriginal = Table.AddColumn(AddSnapshotDateTime, "new_produtoservico", each [new_produtoservicoid], type text),

  // Colunas de diagnostico
  AddSourceModifiedOn = Table.AddColumn(AddLookupToOriginal, "new_source_modifiedon", each [modifiedon], type datetimezone),

  // (Opcional) montar o Primary Name do cache
  AddName = Table.AddColumn(AddSourceModifiedOn, "new_name", each Text.Combine({
      if [new_referenciadoproduto] <> null then Text.From([new_referenciadoproduto]) else "(sem referencia)",
      " - ",
      Text.From([new_produtoservicoid])
    }), type text),

  // Seleciona apenas o que sera carregado no cache
  Output = Table.SelectColumns(AddName, {
    "new_name",
    "new_snapshotdate",
    "new_snapshotdatetime",
    "new_produtoservico",

    "new_referenciadoproduto",
    "new_descricao",
    "new_quantidade",
    "new_nomedoclientefx",
    "new_previsaodeentrega",
    "new_datalimiteparapedido",
    "new_diasparapedido",
    "new_faixadeprazo",
    "new_nomedofornecedorprincipal",
    "new_fornecedorprincipalid",
    "new_nomedofabricante",
    "new_apelidodoprojetofx",

    // Para mapear lookups opcionais no destino
    "_new_modelodeprodutooriginal_value",
    "new_source_modifiedon"
  })
in
  Output
```
