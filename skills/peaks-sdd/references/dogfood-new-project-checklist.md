# Dogfood Checklist: New Project 0→1 Flow

Use this checklist to manually test `/peaks-sdd 我想做一个...` after the automated dogfood script passes.

## Preflight

- [ ] Start from an empty or nearly-empty directory.
- [ ] Confirm Docker Desktop is running if your idea needs a database.
- [ ] Prepare one real product idea in natural language.
- [ ] Decide whether the target is Web only, Tauri desktop, or both.
- [ ] If the UI will use shadcn/ui, expect the workflow to consult the official shadcn/ui install path for the selected framework.

## Suggested Prompt Shape

```text
/peaks-sdd 我想做一个 <真实产品想法>。
目标用户是 <谁>，大概解决 <什么问题>，我希望第一版能 <核心结果>。
```

Do not over-specify the whole product. The point is to verify whether product brainstorming helps you refine the idea.

## Phase 0: Initialization

Expected artifacts:

- [ ] `.peaks/current-change`
- [ ] `.peaks/project/overview.md`
- [ ] `.peaks/project/product-knowledge.md`
- [ ] `.peaks/changes/<change-id>/enhancements.md`
- [ ] `.claude/agents/dispatcher.md`
- [ ] `.claude/agents/product.md`
- [ ] `.claude/agents/design.md` when UI exists
- [ ] `.gitnexus/`
- [ ] `.claude/settings.json` contains only fine-grained default MCP servers for this project type

Quality checks:

- [ ] It does not create legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, or `.peaks/checkpoints` for new artifacts.
- [ ] It does not overwrite existing user files without warning.
- [ ] It records the active change path in `.peaks/current-change`.

## Phase 1: Product Brainstorming

Expected behavior:

- [ ] At least 5 meaningful interaction rounds unless you explicitly skip.
- [ ] Each round adds new information, decisions, or scope reduction.
- [ ] It asks about target user, job-to-be-done, core workflow, constraints, success metric, and MVP scope.
- [ ] It challenges at least 3 weak assumptions or risky choices.
- [ ] It proposes 2-3 possible wedges or product directions with tradeoffs.
- [ ] It records rejected directions and why.
- [ ] It asks for explicit confirmation of target user, core flow, MVP scope, and success criteria before PRD.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/product/brainstorm.md`
- [ ] `.peaks/changes/<change-id>/product/prd.md`
- [ ] `.peaks/project/product-knowledge.md` is updated only with stable cross-iteration knowledge

Red flags:

- [ ] It turns your first message directly into PRD without serious questioning.
- [ ] It asks generic questions that do not change the product direction.
- [ ] It moves to technical planning before you confirm MVP and success criteria.

## Phase 2: Design

Expected behavior:

- [ ] If UI exists, it recommends style exploration and may reference awesome-design-md.
- [ ] It uses or recommends `design-taste-frontend`, `ui-ux-pro-max`, `frontend-design`, or `design-md` as optional enhancers.
- [ ] It produces a first design artifact or preview.
- [ ] It waits for your design confirmation before frontend technical docs.
- [ ] After first design confirmation, it generates a design spec.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/design/ux-flow.md`
- [ ] `.peaks/changes/<change-id>/design/ui-direction.md`
- [ ] `.peaks/changes/<change-id>/design/approved-preview.html`
- [ ] `.peaks/changes/<change-id>/design/design-spec.md`
- [ ] `.peaks/changes/<change-id>/design/screenshots/` if browser evidence is available

Design spec must include:

- [ ] Design goal and mood keywords
- [ ] Color tokens
- [ ] Typography strategy
- [ ] Spacing, radius, and shadow rules
- [ ] Responsive breakpoints
- [ ] Component states: hover, focus, active, disabled, loading, empty, error
- [ ] Motion and reduced-motion requirements
- [ ] Accessibility requirements
- [ ] shadcn/ui theme mapping if applicable

## Phase 3: Tech Stack and Architecture

Expected behavior:

- [ ] It confirms package manager, frontend framework, backend framework if needed, database type, test framework, and app structure.
- [ ] If database is needed, it defaults to Docker Compose and checks Docker Desktop before database work.
- [ ] If Tauri is selected, it checks Rust/Tauri prerequisites and isolates desktop tasks to Tauri-specific agents.
- [ ] If shadcn/ui is selected, it follows official shadcn/ui installation docs for the selected framework.
- [ ] It uses Context7 for current docs before shadcn/ui, Tauri, ORM, or framework-specific API choices.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/architecture/tech-stack.md`
- [ ] `.peaks/changes/<change-id>/architecture/system-design.md`
- [ ] `.peaks/changes/<change-id>/architecture/decisions.md`
- [ ] `.peaks/changes/<change-id>/enhancements.md` records Context7/external reference use

## Phase 4: Swarm Planning

Expected behavior:

- [ ] It creates a bounded task graph before child-agent dispatch.
- [ ] Max 5 child agents per wave.
- [ ] Max 10 development child agents for the first version.
- [ ] No overlapping `mayModify` files in the same wave.
- [ ] Shared files are owned by dispatcher or a dedicated integration task.
- [ ] Every implementation brief includes unit tests or a written reason why unit tests do not apply.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/swarm/task-graph.json`
- [ ] `.peaks/changes/<change-id>/swarm/waves.json`
- [ ] `.peaks/changes/<change-id>/swarm/status.json`
- [ ] `.peaks/changes/<change-id>/swarm/file-ownership.json`
- [ ] `.peaks/changes/<change-id>/swarm/briefs/`

## Phase 5: Implementation, Review, QA

Expected behavior:

- [ ] Child agents read their brief and stay inside file boundaries.
- [ ] Unit tests run before E2E when relevant.
- [ ] Code review and security review run after integration.
- [ ] CRITICAL/HIGH issues create fix briefs and block completion.
- [ ] QA runs smoke, feature behavior, and regression/e2e when feasible.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/swarm/agent-usage.md`
- [ ] `.peaks/changes/<change-id>/swarm/reports/`
- [ ] `.peaks/changes/<change-id>/review/code-review.md`
- [ ] `.peaks/changes/<change-id>/security/security-report.md`
- [ ] `.peaks/changes/<change-id>/qa/test-plan.md`
- [ ] `.peaks/changes/<change-id>/qa/functional-report.md`
- [ ] `.peaks/changes/<change-id>/qa/business-report.md`
- [ ] `.peaks/changes/<change-id>/qa/performance-report.md`
- [ ] `.peaks/changes/<change-id>/qa/runtime-smoke-report.md`

## Phase 6: Preview and Final Report

Expected behavior:

- [ ] It installs dependencies using the selected package manager.
- [ ] It starts the dev server or explains a precise blocker.
- [ ] It opens or verifies the app when browser tooling is available.
- [ ] It verifies the homepage and core happy path.
- [ ] Startup failures produce a startup-fix brief instead of being ignored.
- [ ] Deployment is not attempted without explicit user confirmation.

Expected artifacts:

- [ ] `.peaks/changes/<change-id>/final-report.md`
- [ ] Final report links PRD, design spec, architecture, task graph, review, QA, screenshots/evidence, and blockers if any.

## Manual Scoring

Score each area from 0-2:

| Area | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Product brainstorming | shallow/perfunctory | useful but incomplete | genuinely sharp and helpful |
| Artifact layout | old/flat paths | mixed paths | fully change-scoped |
| Design flow | skips design spec | weak spec | complete design spec after approval |
| Tech decisions | assumptions only | asks but weak docs | confirms, records, uses Context7 |
| Swarm planning | no task graph | graph but weak boundaries | clear waves, ownership, briefs |
| Quality | no unit tests/review | partial | unit tests + CR + security + QA gates |
| Preview | no run | attempted but vague | verified or precise blocker |

Passing threshold for first dogfood: at least 10/14 and no 0 in Product brainstorming, Artifact layout, Quality, or Preview.

## Issues to Capture

For each issue, record:

```md
### Issue: <short title>

- Phase:
- Expected:
- Actual:
- Evidence path:
- Severity: blocker | high | medium | low
- Suggested fix:
```
