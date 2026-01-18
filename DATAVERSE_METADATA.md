# Dataverse Metadata Reference

Este arquivo contém a documentação resumida das tabelas do Dataverse usadas no projeto.

## Índice de Entidades

| Entidade | Logical Name | Entity Set Name | Primary Key |
|----------|--------------|-----------------|-------------|
| CodeApp Page Allowed Security Role | `new_codeapppageallowedsecurityrole` | `new_codeapppageallowedsecurityroles` | `new_codeapppageallowedsecurityroleid` |

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
