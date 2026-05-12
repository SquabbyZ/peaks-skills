# New Project Swarm Workflow

Use this when the current directory is empty or nearly empty and the user describes a product/application idea.

## Flow

1. Create `.peaks/project/`, `.peaks/changes/<change-id>/`, `.peaks/current-change`, `.claude/agents/`, and `.gitnexus/`.
2. Run deep product brainstorming before writing PRD.
3. Confirm PRD before technical planning.
4. If UI exists, create and confirm a first design, then write `design/design-spec.md`.
5. Confirm tech stack and architecture.
6. Use Context7 for current framework/library docs when selecting shadcn/ui, Tauri, ORM, or framework APIs.
7. Create OpenSpec records when available; otherwise write `openspec/summary.md`.
8. Generate swarm task graph, waves, file ownership, and child briefs.
9. Execute bounded waves with max 5 child agents per wave and max 10 development child agents.
10. Require unit tests in implementation briefs.
11. Run code review, security review, QA, and fix waves until no CRITICAL/HIGH issues remain.
12. Write canonical gate artifacts: `review/code-review.md`, `review/security-review.md`, `qa/test-plan.md`, `swarm/reports/*.md`, and `final-report.md`.
13. Start the app, verify the core path, and write final verification evidence into `final-report.md`.

## Gates

- PRD cannot be written from a shallow one-shot prompt.
- Design spec is required before frontend technical docs.
- Docker Desktop is required before local database tasks.
- shadcn/ui must use official installation docs for the selected framework.
- Tauri tasks require Rust/Tauri preflight checks.
- Deployment requires explicit user confirmation.
