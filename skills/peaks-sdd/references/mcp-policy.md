# MCP Policy

MCP servers are optional capabilities. Configure them narrowly and inject them into the phases that need them.

| MCP server | Default policy | Use phase | Rule |
| --- | --- | --- | --- |
| `gitnexus` | Configure at init, trigger at gates | Product, Design, Architecture, Swarm, Review, Final | Record decisions and audit summaries only |
| `claude-mem` | Configure at init, trigger on long-term memory events | Product, Architecture, User preferences | Store stable preferences/facts only |
| `context7` | Configure at init, query on demand | Tech selection, shadcn/ui, Tauri, ORM/API | Query current official docs and summarize into artifacts |
| `fs` | On demand | Artifact validation | Keep inside project and respect file boundaries |
| `claude-md-management` | On demand | CLAUDE.md/rules updates | Do not write phase artifacts |
| `code-review` | Review phase only | Review, fix wave | Output to current change `review/` |
| `typescript-lsp` | TypeScript projects only | Frontend, backend TS, review | Helps navigation and diagnostics; does not replace tests |
| `superpowers` | On demand | Brainstorm, planning, verification | Process guidance only |
| `frontend-design` | UI projects only | Design, frontend, preview | Must feed design spec and frontend briefs |

## Rules

- Do not give every child agent every MCP by default.
- Inject MCP access through task briefs.
- MCP use must respect `mayModify`, `readOnly`, and `mustNotTouch` boundaries.
- Writes through MCP must be recorded in the current change report.
- Project-external filesystem, remote service, or global config access requires user approval.
