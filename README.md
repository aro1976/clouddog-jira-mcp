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

Adicione ao `~/.kiro/settings.json`:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/Users/alessandro/Projects/CloudDog/clouddog-jira-mcp/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://sua-empresa.atlassian.net",
        "JIRA_EMAIL": "seu-email@empresa.com",
        "JIRA_API_TOKEN": "seu-token"
      }
    }
  }
}
```

## Tools Disponíveis

### Projects
| Tool | Descrição |
|---|---|
| `list_projects` | Listar projetos |
| `get_project` | Obter projeto por key/ID |

### Issues
| Tool | Descrição |
|---|---|
| `search_issues` | Buscar issues via JQL |
| `get_issue` | Obter issue por key/ID |
| `create_issue` | Criar nova issue |
| `edit_issue` | Editar issue existente |
| `delete_issue` | Deletar issue |
| `assign_issue` | Atribuir issue a um usuário |
| `get_transitions` | Listar transições disponíveis |
| `transition_issue` | Mover issue para outro status |

### Comments
| Tool | Descrição |
|---|---|
| `get_comments` | Listar comentários de uma issue |
| `add_comment` | Adicionar comentário |

### Worklogs
| Tool | Descrição |
|---|---|
| `get_worklogs` | Listar worklogs de uma issue |
| `add_worklog` | Lançar horas em uma issue |
| `update_worklog` | Atualizar worklog existente |
| `delete_worklog` | Deletar worklog |
