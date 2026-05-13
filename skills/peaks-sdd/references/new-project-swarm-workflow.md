# New Project Swarm Workflow

Use this when the current directory is empty or nearly empty and the user describes a product/application idea.

## Flow

1. Create `.peaks/project/`, `.peaks/changes/<change-id>/`, `.peaks/current-change`, `.claude/agents/`, and `.gitnexus/`.
2. Run deep product brainstorming before writing PRD.
3. Confirm PRD before technical planning; write `product/prd-confirmation.md` and stop until the user explicitly approves.
4. If UI exists, create a visual design artifact (`design/*.html` or equivalent design-platform export), confirm it with the user, then write `design/design-spec.md` and `design/design-confirmation.md`.
5. Write reviewable architecture in `architecture/system-design.md`, confirm it with the user, and write `architecture/system-design-confirmation.md` before task graph or swarm execution.
6. Use Context7 for current framework/library docs when selecting shadcn/ui, Tauri, ORM, or framework APIs.
7. Create OpenSpec records when available; otherwise write `openspec/summary.md`.
8. Generate swarm task graph, waves, file ownership, and child briefs.
9. Execute bounded waves with max 5 child agents per wave and max 10 development child agents.
10. Require TDD and unit tests in implementation briefs; business/application projects require >= 95% line/branch/function/statement coverage, while open-source component libraries require >= 60%.
11. Run code review, security review, QA, and fix waves until no CRITICAL/HIGH issues remain.
12. Write canonical gate artifacts: `review/code-review.md`, `security/security-report.md`, `qa/test-plan.md`, `qa/functional-report.md`, `qa/performance-report.md`, `qa/qa-round-1.md`, `qa/qa-round-2.md`, `qa/qa-round-3.md`, `qa/acceptance-report.md`, `swarm/reports/*.md`, and `final-report.md`.
13. Start the app, verify the core path, and write final verification evidence into `final-report.md`.

## Gates

- PRD cannot be written from a shallow one-shot prompt, and `product/prd-confirmation.md` is mandatory before design or technical planning.
- UI projects require a visual design artifact (`design/*.html` or equivalent design-platform export), `design/design-spec.md`, and `design/design-confirmation.md` before frontend technical docs.
- Technical planning must be reviewable: requirements mapping, module boundaries, data/API/IPC contracts, security model, test strategy, risks/tradeoffs, and file-level implementation plan. `architecture/system-design-confirmation.md` is mandatory before task graph generation.
- Docker Desktop is required before local database tasks.
- shadcn/ui must use official installation docs for the selected framework.
- Tauri tasks require Rust/Tauri preflight checks.
- Deployment requires explicit user confirmation.
- Unit coverage below the project-type threshold blocks completion: 95% for business/application projects, 60% for open-source component libraries. No `--force` bypass for new-project swarm acceptance.
- QA must produce separate functional, performance, and security evidence. Security evidence is written to `security/security-report.md`; functional/performance evidence is written to `qa/functional-report.md` and `qa/performance-report.md`.
