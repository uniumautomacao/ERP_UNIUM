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
