import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const JIRA_BASE_URL = process.env.JIRA_BASE_URL!; // e.g. https://your-domain.atlassian.net
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error("Missing env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN");
  process.exit(1);
}

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

async function jiraRequest(path: string, options: RequestInit = {}) {
  const url = `${JIRA_BASE_URL}/rest/api/3${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Jira API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const server = new McpServer({
  name: "clouddog-jira-mcp",
  version: "1.0.0",
});

// ── Projects ──

server.tool(
  "list_projects",
  "List all Jira projects",
  { maxResults: z.number().optional(), startAt: z.number().optional() },
  async ({ maxResults, startAt }) => {
    const params = new URLSearchParams();
    if (maxResults) params.set("maxResults", String(maxResults));
    if (startAt) params.set("startAt", String(startAt));
    const data = await jiraRequest(`/project/search?${params}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_project",
  "Get a Jira project by key or ID",
  { projectIdOrKey: z.string() },
  async ({ projectIdOrKey }) => {
    const data = await jiraRequest(`/project/${projectIdOrKey}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Issues ──

server.tool(
  "search_issues",
  "Search issues using JQL",
  {
    jql: z.string(),
    maxResults: z.number().optional(),
    nextPageToken: z.string().optional().describe("Token for pagination, returned as nextPageToken in previous response"),
    fields: z.array(z.string()).optional(),
  },
  async ({ jql, maxResults, nextPageToken, fields }) => {
    const body: Record<string, unknown> = { jql };
    if (maxResults !== undefined) body.maxResults = maxResults;
    if (nextPageToken) body.nextPageToken = nextPageToken;
    if (fields) body.fields = fields;
    const data = await jiraRequest("/search/jql", { method: "POST", body: JSON.stringify(body) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_issue",
  "Get a Jira issue by key or ID",
  {
    issueIdOrKey: z.string(),
    fields: z.array(z.string()).optional(),
  },
  async ({ issueIdOrKey, fields }) => {
    const params = fields ? `?fields=${fields.join(",")}` : "";
    const data = await jiraRequest(`/issue/${issueIdOrKey}${params}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_issue",
  "Create a new Jira issue",
  {
    projectKey: z.string(),
    issueType: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    assigneeAccountId: z.string().optional(),
    priority: z.string().optional(),
    labels: z.array(z.string()).optional(),
  },
  async ({ projectKey, issueType, summary, description, assigneeAccountId, priority, labels }) => {
    const fields: Record<string, unknown> = {
      project: { key: projectKey },
      issuetype: { name: issueType },
      summary,
    };
    if (description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: description }] }],
      };
    }
    if (assigneeAccountId) fields.assignee = { accountId: assigneeAccountId };
    if (priority) fields.priority = { name: priority };
    if (labels) fields.labels = labels;
    const data = await jiraRequest("/issue", { method: "POST", body: JSON.stringify({ fields }) });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "edit_issue",
  "Edit an existing Jira issue",
  {
    issueIdOrKey: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    assigneeAccountId: z.string().optional(),
    priority: z.string().optional(),
    labels: z.array(z.string()).optional(),
  },
  async ({ issueIdOrKey, summary, description, assigneeAccountId, priority, labels }) => {
    const fields: Record<string, unknown> = {};
    if (summary) fields.summary = summary;
    if (description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: description }] }],
      };
    }
    if (assigneeAccountId) fields.assignee = { accountId: assigneeAccountId };
    if (priority) fields.priority = { name: priority };
    if (labels) fields.labels = labels;
    await jiraRequest(`/issue/${issueIdOrKey}`, { method: "PUT", body: JSON.stringify({ fields }) });
    return { content: [{ type: "text", text: `Issue ${issueIdOrKey} updated.` }] };
  }
);

server.tool(
  "delete_issue",
  "Delete a Jira issue",
  { issueIdOrKey: z.string(), deleteSubtasks: z.boolean().optional() },
  async ({ issueIdOrKey, deleteSubtasks }) => {
    const params = deleteSubtasks ? "?deleteSubtasks=true" : "";
    await jiraRequest(`/issue/${issueIdOrKey}${params}`, { method: "DELETE" });
    return { content: [{ type: "text", text: `Issue ${issueIdOrKey} deleted.` }] };
  }
);

server.tool(
  "assign_issue",
  "Assign a Jira issue to a user",
  { issueIdOrKey: z.string(), accountId: z.string().nullable() },
  async ({ issueIdOrKey, accountId }) => {
    await jiraRequest(`/issue/${issueIdOrKey}/assignee`, {
      method: "PUT",
      body: JSON.stringify({ accountId }),
    });
    return { content: [{ type: "text", text: `Issue ${issueIdOrKey} assigned.` }] };
  }
);

server.tool(
  "get_transitions",
  "Get available transitions for an issue",
  { issueIdOrKey: z.string() },
  async ({ issueIdOrKey }) => {
    const data = await jiraRequest(`/issue/${issueIdOrKey}/transitions`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "transition_issue",
  "Transition an issue to a new status",
  {
    issueIdOrKey: z.string(),
    transitionId: z.string(),
    comment: z.string().optional(),
  },
  async ({ issueIdOrKey, transitionId, comment }) => {
    const body: Record<string, unknown> = { transition: { id: transitionId } };
    if (comment) {
      body.update = {
        comment: [
          {
            add: {
              body: {
                type: "doc",
                version: 1,
                content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }],
              },
            },
          },
        ],
      };
    }
    await jiraRequest(`/issue/${issueIdOrKey}/transitions`, { method: "POST", body: JSON.stringify(body) });
    return { content: [{ type: "text", text: `Issue ${issueIdOrKey} transitioned.` }] };
  }
);

// ── Comments ──

server.tool(
  "get_comments",
  "Get comments for an issue",
  { issueIdOrKey: z.string(), maxResults: z.number().optional(), startAt: z.number().optional() },
  async ({ issueIdOrKey, maxResults, startAt }) => {
    const params = new URLSearchParams();
    if (maxResults) params.set("maxResults", String(maxResults));
    if (startAt) params.set("startAt", String(startAt));
    const data = await jiraRequest(`/issue/${issueIdOrKey}/comment?${params}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "add_comment",
  "Add a comment to an issue",
  { issueIdOrKey: z.string(), body: z.string() },
  async ({ issueIdOrKey, body: commentBody }) => {
    const data = await jiraRequest(`/issue/${issueIdOrKey}/comment`, {
      method: "POST",
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text: commentBody }] }],
        },
      }),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Worklogs ──

server.tool(
  "get_worklogs",
  "Get worklogs for an issue",
  { issueIdOrKey: z.string(), maxResults: z.number().optional(), startAt: z.number().optional() },
  async ({ issueIdOrKey, maxResults, startAt }) => {
    const params = new URLSearchParams();
    if (maxResults) params.set("maxResults", String(maxResults));
    if (startAt) params.set("startAt", String(startAt));
    const data = await jiraRequest(`/issue/${issueIdOrKey}/worklog?${params}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "add_worklog",
  "Add a worklog entry to an issue (log time spent)",
  {
    issueIdOrKey: z.string(),
    timeSpentSeconds: z.number().describe("Time spent in seconds (e.g. 3600 = 1h)"),
    started: z.string().optional().describe("Start datetime in ISO format, e.g. 2024-01-15T09:00:00.000+0000"),
    comment: z.string().optional(),
  },
  async ({ issueIdOrKey, timeSpentSeconds, started, comment }) => {
    const body: Record<string, unknown> = { timeSpentSeconds };
    if (started) body.started = started;
    if (comment) {
      body.comment = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }],
      };
    }
    const data = await jiraRequest(`/issue/${issueIdOrKey}/worklog`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_worklog",
  "Update an existing worklog entry",
  {
    issueIdOrKey: z.string(),
    worklogId: z.string(),
    timeSpentSeconds: z.number().optional(),
    started: z.string().optional(),
    comment: z.string().optional(),
  },
  async ({ issueIdOrKey, worklogId, timeSpentSeconds, started, comment }) => {
    const body: Record<string, unknown> = {};
    if (timeSpentSeconds) body.timeSpentSeconds = timeSpentSeconds;
    if (started) body.started = started;
    if (comment) {
      body.comment = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }],
      };
    }
    const data = await jiraRequest(`/issue/${issueIdOrKey}/worklog/${worklogId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_worklog",
  "Delete a worklog entry",
  { issueIdOrKey: z.string(), worklogId: z.string() },
  async ({ issueIdOrKey, worklogId }) => {
    await jiraRequest(`/issue/${issueIdOrKey}/worklog/${worklogId}`, { method: "DELETE" });
    return { content: [{ type: "text", text: `Worklog ${worklogId} deleted from ${issueIdOrKey}.` }] };
  }
);

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
