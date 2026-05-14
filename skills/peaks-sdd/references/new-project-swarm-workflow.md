# New Project Swarm Workflow

Use this when the current directory is empty or nearly empty and the user describes a product/application idea.

## Flow

1. Create `.peaks/project/`, `.peaks/changes/<change-id>/`, `.peaks/current-change`, `.claude/agents/`, `.gitnexus/`, and `checkpoints/*-phase-handoff.md` for `product`, `design`, `dispatcher`, and `qa`.
2. Run deep product brainstorming through `.claude/agents/product.md` before writing PRD. If the main session performs this work directly, record a deviation and do not mark the phase complete.
3. Confirm PRD before technical planning; write `product/prd-confirmation.md` and stop until the user explicitly approves.
4. If UI exists, create a visual design artifact through `.claude/agents/design.md` (`design/*.html` or equivalent design-platform export), confirm it with the user, write `design/design-spec.md` and `design/design-confirmation.md`, sync PRD if design changed scope/pages/states/copy/acceptance criteria, then explicitly ask whether to proceed to technical planning.
5. Write reviewable architecture through `.claude/agents/dispatcher.md` in `architecture/system-design.md`, confirm it with the user, and write `architecture/system-design-confirmation.md` before task graph or swarm execution.
6. Use Context7 for current framework/library docs when selecting shadcn/ui, Tauri, ORM, or framework APIs.
7. Create OpenSpec records when available; otherwise write `openspec/summary.md`.
8. Run `scripts/ensure-execution-agents.mjs <projectPath>` to dynamically generate or repair execution agents (`frontend`, `frontend-child`, `backend`, `backend-child`, `qa-child`, review, security, database/devops as needed). Core QA dispatcher alone does not satisfy swarm execution.
9. Run `scripts/plan-swarm.mjs <projectPath>` to generate swarm task graph, waves, file ownership, child briefs, and handoffs. The graph must include frontend, backend/API/database/auth when in scope, QA dispatch/execution, unit-test, code-review, security-review, and runtime-smoke nodes.
10. Execute bounded waves with max 5 child agents per wave and max 10 development child agents. At least one wave must show two or more agents in `parallel` unless the confirmed architecture is explicitly single-surface/no-backend.
11. Require TDD and unit tests in implementation briefs; business/application projects require >= 95% line/branch/function/statement coverage, while open-source component libraries require >= 60%.
12. Run `scripts/run-quality-gates.mjs <projectPath>` for code review, security review, QA, coverage, and fix-loop evidence until no CRITICAL/HIGH issues remain.
13. Write canonical gate artifacts with explicit Artifact Path in report bodies: `product/swagger.json` or `product/no-api.md`, `swarm/task-graph.json`, `swarm/waves.json`, `swarm/briefs/*.md`, `swarm/handoffs/*.md`, `swarm/agent-usage.md`, `swarm/reports/*.md`, `review/code-review.md`, `review/code-review-smoke.md`, `security/security-report.md`, `security/security-smoke.md`, `qa/test-plan.md`, `qa/functional-report.md`, `qa/business-report.md`, `qa/performance-report.md`, `qa/runtime-smoke-report.md`, `qa/qa-round-1.md`, `qa/qa-round-2.md`, `qa/qa-round-3.md`, `qa/acceptance-report.md`, and `final-report.md`.
14. Run `scripts/run-delivery-smoke.mjs <projectPath>` to start the app command target, verify the core path, ask the user to perform UX verification, write `qa/runtime-smoke-report.md`, and summarize evidence in `final-report.md`.

## Gates

- PRD cannot be written from a shallow one-shot prompt, and `product/prd-confirmation.md` is mandatory before design or technical planning.
- UI projects require a visual design artifact (`design/*.html` or equivalent design-platform export), `design/design-spec.md`, and `design/design-confirmation.md` before frontend technical docs.
- Technical planning must be reviewable: requirements mapping, module boundaries, data/API/IPC contracts, security model, test strategy, risks/tradeoffs, and file-level implementation plan. `architecture/system-design-confirmation.md` is mandatory before task graph generation.
- Docker Desktop is required before local database tasks.
- shadcn/ui must use official installation docs for the selected framework.
- Tauri tasks require Rust/Tauri preflight checks.
- Deployment requires explicit user confirmation.
- Unit coverage below the project-type threshold blocks completion: 95% for business/application projects, 60% for open-source component libraries. No `--force` bypass for new-project swarm acceptance.
- QA must produce separate functional, business, performance, runtime smoke, and security evidence. Security evidence is written to `security/security-report.md`; QA evidence is written to `qa/functional-report.md`, `qa/business-report.md`, `qa/performance-report.md`, and `qa/runtime-smoke-report.md`.
- Swarm evidence is mandatory: `swarm/task-graph.json`, `swarm/waves.json`, `swarm/briefs/*.md`, `swarm/handoffs/*.md`, generated execution agents, and `swarm/agent-usage.md` must prove actual frontend/backend/API/database/auth/QA/CR/security execution when those surfaces are in scope.
- Quality evidence is mandatory: frontend/backend code review runs in parallel when both surfaces exist, security review runs in the quality wave, CRITICAL/HIGH findings block completion, and fix/review loops may run up to 10 rounds before reporting blocked.
- Delivery evidence is mandatory: runtime smoke starts the app, verifies the core path, requests user UX verification, and links PRD/design/architecture/task graph/reviews/QA/screenshots from `final-report.md`.
- Stop hooks call the local artifact verifier; SOP wording is not enough to complete the workflow when required reports are missing.
