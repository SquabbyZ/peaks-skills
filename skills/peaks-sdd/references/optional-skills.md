# Optional Skill Enhancements

peaks-sdd agents can use external skills to improve domain depth, but these skills are **enhancements, not dependencies**.

## Runtime Policy

1. Do not install optional skills during project initialization.
2. At the start of a task, identify only the optional skills relevant to that task.
3. Tell the user which missing skills are recommended and what each one improves.
4. If the user agrees, install the selected skills first, then continue the task.
5. If the user declines, installation fails, or the network is unavailable, continue with the agent's built-in workflow.
6. Never treat a missing optional skill as a blocker.

## User Message Template

```text
当前任务可以通过以下外部 skills 增强：

- <skill-name>: <收益>
- <skill-name>: <收益>

这些 skills 未安装。安装后可以提升上述能力，但不是必须；不安装也会继续使用 peaks-sdd 内置流程。是否现在安装？
```

If the user approves, install only the approved skills. If the user declines or does not answer clearly, continue without installing.

## Agent Recommendations

| Agent | Optional skills | Benefits | Built-in fallback |
| --- | --- | --- | --- |
| product | `brainstorming`, `office-hours` | Better requirement discovery, product tradeoff questioning, sharper PRD framing | Use built-in PRD questions and current change `product/` templates |
| dispatcher | `improve-codebase-architecture`, `systematic-debugging`, `investigate`, `test-driven-development`, `code-review` | Stronger feature decomposition, root-cause analysis, regression-test discipline, implementation review guidance | Use dispatcher feature/bug flows, R&D dispatchers, QA dispatcher, and local quality gates |
| design | `design-taste-frontend`, `ui-ux-pro-max`, `frontend-design`, `design-shotgun`, `design-html`, `design-md` | Better visual direction, stronger UI taste, UX depth, design variants, production HTML mockups, design specs | Use Design Dials, Anti-Slop rules, HTML preview, design spec, and screenshots |
| frontend | `frontend-design`, `vercel-react-best-practices`, `react-components`, `browser-use`, `e2e-testing-patterns` | Higher-quality UI implementation, framework guidance, component patterns, browser validation | Use project conventions, Playwright MCP, local tests, and built-in UI rules |
| backend | `backend-patterns`, `api-design`, `test-driven-development`, `security-review` | Better API boundaries, service structure, TDD and security review | Use backend template rules, local tests, and code-review agents |
| postgres | `postgres-patterns`, `database-migrations` | Better schema design, migration safety, indexing guidance | Use postgres agent checklist and migration verification |
| tauri | `rust-patterns`, `rust-testing`, `rust-review` | Stronger Rust/Tauri native code quality and tests | Use Tauri template, cargo checks, and local review |
| qa | `webapp-testing`, `e2e-testing-patterns`, `javascript-testing-patterns` | Better test-case design, E2E reliability, automation planning | Use QA dispatcher templates, project test scripts, and Playwright MCP |
| qa-child | `webapp-testing`, `browser-use`, `e2e-testing-patterns`, `security-review`, `security-scan`, `cso` | Stronger focused execution for functional, performance, security, and automation QA briefs | Execute the QA brief with local commands, Playwright MCP, manual evidence, and built-in security/performance checklists |
| code-reviewer-frontend | `code-review`, `frontend-patterns`, `vercel-react-best-practices` | Stronger frontend review and framework-specific feedback | Use template review checklist |
| code-reviewer-backend | `code-review`, `backend-patterns`, `api-design`, `security-review` | Stronger backend review, API and security feedback | Use template review checklist |
| security-reviewer | `security-review`, `cso` | Deeper vulnerability review and threat modeling | Use OWASP checklist and local grep/scans |
| devops | `docker-patterns`, `deployment-patterns`, `canary` | Better deployment safety, container guidance, post-deploy checks | Use devops checklist and local health checks |
| triage | `investigate`, `systematic-debugging` | Better issue classification and root-cause routing | Use triage state machine |
| dispatcher | `subagent-driven-development`, `dispatching-parallel-agents` | Better multi-agent task decomposition and handoffs | Use dispatcher template and local reports |
| sub-agent | Task-specific skills from the parent agent | Deepens the subtask domain only when useful | Follow assigned brief and project local rules |

## External Enhancement Sources

These repositories can be referenced, imported in small excerpts, or installed only with user approval:

| Source | Use |
| --- | --- |
| `forrestchang/andrej-karpathy-skills` | Karpathy-style AI coding and research discipline |
| `shanraisshan/claude-code-best-practice` | Claude Code workflow and context practices |
| `affaan-m/everything-claude-code` | Claude Code ecosystem reference |
| `AMap-Web/amap-skills` | Map/location scenarios |
| `pbakaus/impeccable` | Strict vibe coding and review practices |
| `mattpocock/skills` | TypeScript and frontend engineering practices |
| `MiniMax-AI/skills` | AI and multimodal features |
| `garrytan/gstack` | Browser QA, design, deploy and canary workflows |
| `obra/superpowers` | Skill workflow discipline and gated planning |

Record every used enhancement source in `.peaks/changes/<change-id>/enhancements.md`.

## Installation Guidance

When the user approves installation, prefer the project's existing skill installation mechanism. Install the smallest relevant set, not the whole recommendation table.

Examples:

- Frontend UI task: recommend `frontend-design` and `browser-use`, not backend/security skills.
- Bug task: recommend `systematic-debugging` and `test-driven-development`, not design skills.
- Database migration task: recommend `postgres-patterns` and `database-migrations`, not frontend skills.
