# Dataverse Metadata Reference

Este arquivo contém a documentação resumida das tabelas do Dataverse usadas no projeto.

## Índice de Entidades

| Entidade | Logical Name | Entity Set Name | Primary Key |
|----------|--------------|-----------------|-------------|
| CodeApp Page Allowed Security Role | `new_codeapppageallowedsecurityrole` | `new_codeapppageallowedsecurityroles` | `new_codeapppageallowedsecurityroleid` |
| Projeto | `cr22f_projeto` | `cr22f_projetos` | `cr22f_projetoid` |
| App Preference | `new_apppreference` | `new_apppreferences` | `new_apppreferenceid` |
| Atividade Field Control | `new_atividadefieldcontrol` | `new_atividadefieldcontrols` | `new_atividadefieldcontrolid` |
| Cor Colaborador Linha do Tempo | `new_corcolaboradorlinhadotempo` | `new_corcolaboradorlinhadotempos` | `new_corcolaboradorlinhadotempoid` |
| Ordem de Serviço Field Control | `new_ordemdeservicofieldcontrol` | `new_ordemdeservicofieldcontrols` | `new_ordemdeservicofieldcontrolid` |
| Produto-Serviço | `new_produtoservico` | `new_produtoservicos` | `new_produtoservicoid` |
| Fabricantes From Sharepoint List | `cr22f_fabricantesfromsharpointlist` | `cr22f_fabricantesfromsharpointlists` | `cr22f_fabricantesfromsharpointlistid` |
| Modelos de Produto From Sharepoint List | `cr22f_modelosdeprodutofromsharepointlist` | `cr22f_modelosdeprodutofromsharepointlists` | `cr22f_modelosdeprodutofromsharepointlistid` |
| Device IO | `new_deviceio` | `new_deviceios` | `new_deviceioid` |
| Device IO Connection | `new_deviceioconnection` | `new_deviceioconnections` | `new_deviceioconnectionid` |
| Contact | `contact` | `contacts` | `contactid` |
| Estoque From Sharepoint List | `cr22f_estoquefromsharepointlist` | `cr22f_estoquefromsharepointlists` | `cr22f_estoquefromsharepointlistid` |
| Estoque-RMA | `new_estoquerma` | `new_estoquermas` | `new_estoquermaid` |
| RMA | `new_rma` | `new_rmas` | `new_rmaid` |
| Contagem Estoque | `new_contagemestoque` | `new_contagemestoques` | `new_contagemestoqueid` |
| Ajuste de Estoque | `new_ajustedeestoque` | `new_ajustedeestoques` | `new_ajustedeestoqueid` |
| Solicitação de Ajuste de Estoque | `new_solicitacaodeajustedeestoque` | `new_solicitacaodeajustedeestoques` | `new_solicitacaodeajustedeestoqueid` |
| Registro de Leitura de Mercadoria em Estoque | `new_registrodeleiturademercadoriaemestoque` | `new_registrodeleiturademercadoriaemestoques` | `new_registrodeleiturademercadoriaemestoqueid` |
| Registro de Venda | `new_registrodevenda` | `new_registrodevendas` | `new_registrodevendaid` |
| S3 Objects | `new_s3objects` | `new_s3objectses` | `new_s3objectsid` |
| Preço de Produto | `new_precodeproduto` | `new_precodeprodutos` | `new_precodeprodutoid` |
| Fornecedores From Sharepoint List | `cr22f_fornecedoresfromsharepointlist` | `cr22f_fornecedoresfromsharepointlists` | `cr22f_fornecedoresfromsharepointlistid` |
| TipoServiço-PreçodeProduto | `new_tiposervicoprecodeproduto` | `new_tiposervicoprecodeprodutos` | `new_tiposervicoprecodeprodutoid` |
| Tipo de Serviço | `new_tipodeservico` | `new_tipodeservicos` | `new_tipodeservicoid` |
| Cotação Temporária de Produto | `new_cotacaotemporariadeproduto` | `new_cotacaotemporariadeprodutos` | `new_cotacaotemporariadeprodutoid` |
| Regime de Cotação Temporária | `new_regimedecotacaotemporaria` | `new_regimedecotacaotemporarias` | `new_regimedecotacaotemporariaid` |
| Tipo de Serviço Regime de Cotação Temporária | `new_tipodeservicoregimedecotacaotemporaria` | `new_tipodeservicoregimedecotacaotemporarias` | `new_tipodeservicoregimedecotacaotemporariaid` |

---

## 🔵 new_contagemestoque (Contagem Estoque)

### Informações Básicas
```
EntityLogicalName:                new_contagemestoque
EntityLogicalCollectionName:      new_contagemestoques
EntitySetName:                    new_contagemestoques
PrimaryKey:                       new_contagemestoqueid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_itemestoque | new_ItemEstoque | cr22f_estoquefromsharepointlists |
| new_usuario | new_Usuario | systemusers |

---

## 🔵 new_ajustedeestoque (Ajuste de Estoque)

### Informações Básicas
```
EntityLogicalName:                new_ajustedeestoque
EntityLogicalCollectionName:      new_ajustedeestoques
EntitySetName:                    new_ajustedeestoques
PrimaryKey:                       new_ajustedeestoqueid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_itemestoque | new_ItemEstoque | cr22f_estoquefromsharepointlists |
| new_usuarioajuste | new_UsuarioAjuste | systemusers |
| new_contagem | new_Contagem | new_contagemestoques |

---

## 🔵 new_solicitacaodeajustedeestoque (Solicitação de Ajuste de Estoque)

### Informações Básicas
```
EntityLogicalName:                new_solicitacaodeajustedeestoque
EntityLogicalCollectionName:      new_solicitacaodeajustedeestoques
EntitySetName:                    new_solicitacaodeajustedeestoques
PrimaryKey:                       new_solicitacaodeajustedeestoqueid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_ajustecriado | new_AjusteCriado | new_ajustedeestoques |
| new_contagem | new_Contagem | new_contagemestoques |
| new_itemdeestoque | new_ItemdeEstoque | cr22f_estoquefromsharepointlists |
| new_usuariosolicitante | new_UsuarioSolicitante | systemusers |

---

## 🔵 new_registrodeleiturademercadoriaemestoque (Registro de Leitura de Mercadoria em Estoque)

### Informações Básicas
```
EntityLogicalName:                new_registrodeleiturademercadoriaemestoque
EntityLogicalCollectionName:      new_registrodeleiturademercadoriaemestoques
EntitySetName:                    new_registrodeleiturademercadoriaemestoques
PrimaryKey:                       new_registrodeleiturademercadoriaemestoqueid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_mercadoria | new_Mercadoria | cr22f_estoquefromsharepointlists |
| new_registradopor | new_RegistradoPor | systemusers |

---

## 🔵 new_registrodevenda (Registro de Venda)

### Informações Básicas
```
EntityLogicalName:                new_registrodevenda
EntityLogicalCollectionName:      new_registrodevendas
EntitySetName:                    new_registrodevendas
PrimaryKey:                       new_registrodevendaid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_itemdeorcamento | new_ItemdeOrcamento | new_orcamentoitems |
| new_orcamento | new_Orcamento | new_orcamentos |
| new_precodeproduto | new_PrecodeProduto | new_precodeprodutos |
| new_produto | new_Produto | products |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 new_s3objects (S3 Objects)

### Informações Básicas
```
EntityLogicalName:                new_s3objects
EntityLogicalCollectionName:      new_s3objectses
EntitySetName:                    new_s3objectses
PrimaryKey:                       new_s3objectsid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_componentedescricaoitemcatalogoverificacao | new_ComponenteDescricaoItemCatalogoVerificacao | catalogitems |
| new_feedbackdocolaborador | new_FeedbackdoColaborador | new_feedbackdocolaboradores |
| new_ordemdeservico | new_OrdemdeServico | new_ordemdeservicofieldcontrols |
| new_rma | new_RMA | new_rmas |
| new_userlocation | new_UserLocation | new_userlocations |
| new_wazzupmessage | new_WazzupMessage | new_wazzupmessages |

---

## 🔵 new_precodeproduto (Preço de Produto)

### Informações Básicas
```
EntityLogicalName:                new_precodeproduto
EntityLogicalCollectionName:      new_precodeprodutos
EntitySetName:                    new_precodeprodutos
PrimaryKey:                       new_precodeprodutoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_atividadedecopiadeproduto | new_AtividadedeCopiadeProduto | new_atividades |
| new_atividadedetrocadeitemdekit | new_AtividadedeTrocadeItemdeKit | new_atividades |
| new_atividadetrocadepalavras | new_AtividadeTrocadePalavras | new_atividades |
| new_cotacaotemporaria | new_CotacaoTemporaria | new_cotacoestemporarias |
| new_fornecedor | new_Fornecedor | cr22f_fornecedoresfromsharepointlists |
| new_modelodeproduto | new_ModelodeProduto | cr22f_modelosdeprodutofromsharepointlists |
| new_produtodesigner | new_ProdutoDesigner | products |
| new_promocao | new_Promocao | new_promocoes |
| new_servicoparaadicionardev | new_ServicoparaadicionarDEV | new_tipodeservicos |

---

## 🔵 cr22f_fornecedoresfromsharepointlist (Fornecedores From Sharepoint List)

### Informações Básicas
```
EntityLogicalName:                cr22f_fornecedoresfromsharepointlist
EntityLogicalCollectionName:      cr22f_fornecedoresfromsharepointlists
EntitySetName:                    cr22f_fornecedoresfromsharepointlists
PrimaryKey:                       cr22f_fornecedoresfromsharepointlistid
```

---

## 🔵 new_tiposervicoprecodeproduto (TipoServiço-PreçodeProduto)

### Informações Básicas
```
EntityLogicalName:                new_tiposervicoprecodeproduto
EntityLogicalCollectionName:      new_tiposervicoprecodeprodutos
EntitySetName:                    new_tiposervicoprecodeprodutos
PrimaryKey:                       new_tiposervicoprecodeprodutoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_orcamento | new_Orcamento | new_orcamentos |
| new_precodeproduto | new_PrecodeProduto | new_precodeprodutos |
| new_tipodeservico | new_TipodeServico | new_tipodeservicos |

---

## 🔵 new_tipodeservico (Tipo de Serviço)

### Informações Básicas
```
EntityLogicalName:                new_tipodeservico
EntityLogicalCollectionName:      new_tipodeservicos
EntitySetName:                    new_tipodeservicos
PrimaryKey:                       new_tipodeservicoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_master | new_Master | new_tipodeservicos |

---

## 🔵 new_cotacaotemporariadeproduto (Cotação Temporária de Produto)

### Informações Básicas
```
EntityLogicalName:                new_cotacaotemporariadeproduto
EntityLogicalCollectionName:      new_cotacaotemporariadeprodutos
EntitySetName:                    new_cotacaotemporariadeprodutos
PrimaryKey:                       new_cotacaotemporariadeprodutoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_fornecedor | new_Fornecedor | cr22f_fornecedoresfromsharepointlists |
| new_regime | new_Regime | new_regimedecotacaotemporarias |

---

## 🔵 new_regimedecotacaotemporaria (Regime de Cotação Temporária)

### Informações Básicas
```
EntityLogicalName:                new_regimedecotacaotemporaria
EntityLogicalCollectionName:      new_regimedecotacaotemporarias
EntitySetName:                    new_regimedecotacaotemporarias
PrimaryKey:                       new_regimedecotacaotemporariaid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_modelodeproduto | new_ModelodeProduto | cr22f_modelosdeprodutofromsharepointlists |

---

## 🔵 new_tipodeservicoregimedecotacaotemporaria (Tipo de Serviço Regime de Cotação Temporária)

### Informações Básicas
```
EntityLogicalName:                new_tipodeservicoregimedecotacaotemporaria
EntityLogicalCollectionName:      new_tipodeservicoregimedecotacaotemporarias
EntitySetName:                    new_tipodeservicoregimedecotacaotemporarias
PrimaryKey:                       new_tipodeservicoregimedecotacaotemporariaid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_regime | new_Regime | new_regimedecotacaotemporarias |
| new_tipodeservico | new_TipodeServico | new_tipodeservicos |

---

## 🔵 contact (Contact)

### Informações Básicas
```
EntityLogicalName:                contact
EntityLogicalCollectionName:      contacts
EntitySetName:                    contacts
PrimaryKey:                       contactid
```

---

## 🔵 cr22f_estoquefromsharepointlist (Estoque From Sharepoint List)

### Informações Básicas
```
EntityLogicalName:                cr22f_estoquefromsharepointlist
EntityLogicalCollectionName:      cr22f_estoquefromsharepointlists
EntitySetName:                    cr22f_estoquefromsharepointlists
PrimaryKey:                       cr22f_estoquefromsharepointlistid
```

### ⚡ Campos Adicionais (Atualizados)
*   `new_ultimacontagem`: Data da última contagem realizada.
*   `new_centrodedistribuicao`: Centro de distribuição vinculado (OptionSet).
*   `new_deposito`: Depósito vinculado (OptionSet).
*   `new_rua`: Rua no depósito (OptionSet).
*   `new_estante`: Estante no depósito (OptionSet).
*   `new_prateleira`: Prateleira no depósito (OptionSet).
*   `new_classecriticidade`: Classe de criticidade do produto (OptionSet).
*   `new_confirmacaodeetiqueta`: Confirmação manual da etiqueta.
*   `new_confirmacaodetag`: Confirmação manual da tag.
*   `new_contemrma`: Indica se há RMA associado.
*   `new_endereco`: Endereço completo formatado.
*   `new_etiquetaemtextocalculated`: Etiqueta legível calculada.
*   `new_referenciadoproduto`: Referência do produto.

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_modelodeproduto | new_ModelodeProduto | cr22f_modelosdeprodutofromsharepointlists |
| new_produtoservico | new_ProdutoServico | new_produtoservicos |
| new_grupodeorigem | new_GrupodeOrigem | cr22f_estoquefromsharepointlists |
| new_mercadoriaanteriordorma | new_MercadoriaAnteriordoRMA | cr22f_estoquefromsharepointlists |
| new_ordemdeservico | new_OrdemdeServico | new_ordemdeservicofieldcontrols |
| new_insercao | new_Insercao | cr22f_estoquefromsharepointlists |
| new_remessa | new_Remessa | new_remessas |

---

## 🔵 new_estoquerma (Estoque-RMA)

### Informações Básicas
```
EntityLogicalName:                new_estoquerma
EntityLogicalCollectionName:      new_estoquermas
EntitySetName:                    new_estoquermas
PrimaryKey:                       new_estoquermaid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_produto | new_Produto | cr22f_estoquefromsharepointlists |
| new_produtonovo | new_ProdutoNovo | cr22f_estoquefromsharepointlists |
| new_rma | new_RMA | new_rmas |

---

## 🔵 new_rma (RMA)

### Informações Básicas
```
EntityLogicalName:                new_rma
EntityLogicalCollectionName:      new_rmas
EntitySetName:                    new_rmas
PrimaryKey:                       new_rmaid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_cliente | new_Cliente | contacts |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 cr22f_fabricantesfromsharpointlist (Fabricantes From Sharepoint List)

### Informações Básicas
```
EntityLogicalName:                cr22f_fabricantesfromsharpointlist
EntityLogicalCollectionName:      cr22f_fabricantesfromsharpointlists
EntitySetName:                    cr22f_fabricantesfromsharpointlists
PrimaryKey:                       cr22f_fabricantesfromsharpointlistid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_fornecedorprincipal | new_FornecedorPrincipal | accounts |

---

## 🔵 cr22f_modelosdeprodutofromsharepointlist (Modelos de Produto From Sharepoint List)

### Informações Básicas
```
EntityLogicalName:                cr22f_modelosdeprodutofromsharepointlist
EntityLogicalCollectionName:      cr22f_modelosdeprodutofromsharepointlists
EntitySetName:                    cr22f_modelosdeprodutofromsharepointlists
PrimaryKey:                       cr22f_modelosdeprodutofromsharepointlistid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_fabricante | new_Fabricante | cr22f_fabricantesfromsharpointlists |
| new_modelodocabopormetrocaixadecabo | new_ModelodoCaboporMetroCaixadeCabo | cr22f_modelosdeprodutofromsharepointlists |

---

## 🔵 new_deviceio (Device IO)

### Informações Básicas
```
EntityLogicalName:                new_deviceio
EntityLogicalCollectionName:      new_deviceios
EntitySetName:                    new_deviceios
PrimaryKey:                       new_deviceioid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_modelodeproduto | new_ModelodeProduto | cr22f_modelosdeprodutofromsharepointlists |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 new_deviceioconnection (Device IO Connection)

### Informações Básicas
```
EntityLogicalName:                new_deviceioconnection
EntityLogicalCollectionName:      new_deviceioconnections
EntitySetName:                    new_deviceioconnections
PrimaryKey:                       new_deviceioconnectionid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_device | new_Device | new_deviceios |
| new_connectedto | new_ConnectedTo | new_deviceioconnections |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 cr22f_projeto (Projeto)

### Informações Básicas
```
EntityLogicalName:                cr22f_projeto
EntityLogicalCollectionName:      cr22f_projetos
EntitySetName:                    cr22f_projetos
PrimaryKey:                       cr22f_projetoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_arquiteto | new_Arquiteto | systemusers |
| new_cliente | new_Cliente | accounts/contacts |
| new_coordenador | new_Coordenador | systemusers |
| new_projetista | new_Projetista | systemusers |

---

## 🔵 new_apppreference (App Preference)

### Informações Básicas
```
EntityLogicalName:                new_apppreference
EntityLogicalCollectionName:      new_apppreferences
EntitySetName:                    new_apppreferences
PrimaryKey:                       new_apppreferenceid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_user | new_User | systemusers |

---

## 🔵 new_atividadefieldcontrol (Atividade Field Control)

### Informações Básicas
```
EntityLogicalName:                new_atividadefieldcontrol
EntityLogicalCollectionName:      new_atividadefieldcontrols
EntitySetName:                    new_atividadefieldcontrols
PrimaryKey:                       new_atividadefieldcontrolid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_employee | new_employee | systemusers |
| new_ordemdeservico | new_OrdemdeServico | new_ordemdeservicofieldcontrols |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 new_corcolaboradorlinhadotempo (Cor Colaborador Linha do Tempo)

### Informações Básicas
```
EntityLogicalName:                new_corcolaboradorlinhadotempo
EntityLogicalCollectionName:      new_corcolaboradorlinhadotempos
EntitySetName:                    new_corcolaboradorlinhadotempos
PrimaryKey:                       new_corcolaboradorlinhadotempoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_usuario | new_Usuario | systemusers |

---

## 🔵 new_ordemdeservicofieldcontrol (Ordem de Serviço Field Control)

### Informações Básicas
```
EntityLogicalName:                new_ordemdeservicofieldcontrol
EntityLogicalCollectionName:      new_ordemdeservicofieldcontrols
EntitySetName:                    new_ordemdeservicofieldcontrols
PrimaryKey:                       new_ordemdeservicofieldcontrolid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_cliente | new_Cliente | accounts/contacts |
| new_coordenador | new_Coordenador | systemusers |
| new_projeto | new_Projeto | cr22f_projetos |

---

## 🔵 new_produtoservico (Produto-Serviço)

### Informações Básicas
```
EntityLogicalName:                new_produtoservico
EntityLogicalCollectionName:      new_produtoservicos
EntitySetName:                    new_produtoservicos
PrimaryKey:                       new_produtoservicoid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_cliente | new_Cliente | accounts/contacts |
| new_ordemdeservico | new_OrdemdeServico | new_ordemdeservicofieldcontrols |
| new_projeto | new_Projeto | cr22f_projetos |
| new_produto | new_Produto | products |

---

## 🔵 new_codeapppageallowedsecurityrole (CodeApp Page Allowed Security Role)

### Informações Básicas
```
EntityLogicalName:                new_codeapppageallowedsecurityrole
EntityLogicalCollectionName:      new_codeapppageallowedsecurityroles
EntitySetName:                    new_codeapppageallowedsecurityroles
PrimaryKey:                       new_codeapppageallowedsecurityroleid
```

### ⚡ Campos de Lookup (Navigation Properties)
| Campo (AttributeLogicalName) | Navigation Property | Target EntitySet |
|------------------------------|---------------------|------------------|
| new_securityrole | new_SecurityRole | roles |

### Campos Principais
| AttributeLogicalName | Type | Notas |
|----------------------|------|-------|
| new_codeapppageallowedsecurityroleid | UniqueIdentifier | Primary Key |
| new_id | String | Identificador da página |
| new_securityrole | Lookup | Referência ao Security Role |
| statecode | OptionSet | Status (Active/Inactive) |
| statuscode | OptionSet | Reason for Status |
| createdon | DateTime | Data de criação |
| modifiedon | DateTime | Data de modificação |
