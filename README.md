# CloudDog Jira MCP Server

MCP Server para integração com Jira Cloud cobrindo Issues, Projects e Worklogs.

## Pré-requisitos

- Node.js 18+
- Jira Cloud com API Token ([gerar aqui](https://id.atlassian.com/manage-profile/security/api-tokens))

## Instalação

```bash
npm install
npm run build
```

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `JIRA_BASE_URL` | URL base da instância Jira | `https://sua-empresa.atlassian.net` |
| `JIRA_EMAIL` | Email da conta Atlassian | `usuario@empresa.com` |
| `JIRA_API_TOKEN` | API Token gerado no Atlassian | `ATATT3x...` |

## Configuração no Kiro CLI

Adicione ao `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/caminho/para/clouddog-jira-mcp/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://sua-empresa.atlassian.net",
        "JIRA_EMAIL": "seu-email@empresa.com",
        "JIRA_API_TOKEN": "seu-token"
      },
      "disabled": false,
      "autoApprove": [
        "list_projects",
        "get_project",
        "search_issues",
        "get_issue",
        "get_transitions",
        "get_comments",
        "get_worklogs",
        "get_issue_link_types",
        "get_issue_link"
      ]
    }
  }
}
```

## Tools Disponíveis

> ✅ = auto-approve habilitado por padrão

### Projects
| Tool | Descrição | Auto-approve |
|---|---|---|
| `list_projects` | Listar projetos | ✅ |
| `get_project` | Obter projeto por key/ID | ✅ |

### Issues
| Tool | Descrição | Auto-approve |
|---|---|---|
| `search_issues` | Buscar issues via JQL | ✅ |
| `get_issue` | Obter issue por key/ID | ✅ |
| `create_issue` | Criar nova issue | |
| `edit_issue` | Editar issue existente | |
| `delete_issue` | Deletar issue | |
| `assign_issue` | Atribuir issue a um usuário | |
| `get_transitions` | Listar transições disponíveis | ✅ |
| `transition_issue` | Mover issue para outro status | |

### Comments
| Tool | Descrição | Auto-approve |
|---|---|---|
| `get_comments` | Listar comentários de uma issue | ✅ |
| `add_comment` | Adicionar comentário (API v3) | |
| `add_internal_comment` | Comentário interno via Service Desk API (visível só para agentes) | |
| `add_external_comment` | Comentário público via Service Desk API (visível para clientes) | |

### Worklogs
| Tool | Descrição | Auto-approve |
|---|---|---|
| `get_worklogs` | Listar worklogs de uma issue | ✅ |
| `add_worklog` | Lançar horas em uma issue | |
| `update_worklog` | Atualizar worklog existente | |
| `delete_worklog` | Deletar worklog | |

### Issue Links
| Tool | Descrição | Auto-approve |
|---|---|---|
| `get_issue_link_types` | Listar tipos de link disponíveis (Blocks, Relates, etc.) | ✅ |
| `link_issues` | Criar link entre duas issues | |
| `get_issue_link` | Obter link pelo ID | ✅ |
| `delete_issue_link` | Deletar link pelo ID | |

### Organizations
| Tool | Descrição | Auto-approve |
|---|---|---|
| `list_organizations` | Listar todas as organizações do JSM | ✅ |
| `get_organization` | Obter detalhes de uma organização pelo ID | ✅ |
| `create_organization` | Criar nova organização | |
| `delete_organization` | Deletar organização pelo ID | |
| `list_organization_users` | Listar usuários de uma organização | ✅ |
| `add_organization_users` | Adicionar usuários a uma organização | |
| `remove_organization_users` | Remover usuários de uma organização | |
