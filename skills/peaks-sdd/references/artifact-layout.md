# Artifact Layout

peaks-sdd stores durable workflow state in `.peaks/`. Do not rely on conversation context for phase state.

## Layout

```text
.peaks/
  project/
    overview.md
    product-knowledge.md
    roadmap.md
    decisions.md
  current-change
  changes/
    YYYY-MM-DD-initial-product/
      product/
        brainstorm.md
        prd.md
      design/
        ux-flow.md
        ui-direction.md
        design-spec.md
        approved-preview.html
        screenshots/
      architecture/
        tech-stack.md
        system-design.md
        decisions.md
      openspec/
        change-name.txt
        summary.md
      enhancements.md
      swarm/
        task-graph.json
        waves.json
        status.json
        file-ownership.json
        briefs/
        reports/
      dispatch/
      qa/
        test-plan.md
        e2e-report.md
        screenshots/
      review/
        code-review.md
        security-review.md
      checkpoints/
      final-report.md
```

## Rules

- Every new project, feature iteration, and bugfix gets its own `.peaks/changes/<change-id>/`.
- `.peaks/current-change` contains the active relative path, for example `changes/2026-05-12-initial-product`.
- `.peaks/project/` stores cross-iteration knowledge only.
- Child agents receive explicit change-scoped file paths in their briefs.
- Core phase handoffs live in `checkpoints/product-phase-handoff.md`, `checkpoints/design-phase-handoff.md`, `checkpoints/dispatcher-phase-handoff.md`, and `checkpoints/qa-phase-handoff.md`; they point to the project-local `.claude/agents/*.md` files that must execute each phase.
- Required completion gates are `checkpoints/*-phase-handoff.md`, `product/brainstorm.md`, `product/prd.md`, `product/prd-confirmation.md`, `product/swagger.json` or `product/no-api.md`, `design/design-spec.md`, `design/design-confirmation.md`, `architecture/system-design.md`, `architecture/system-design-confirmation.md`, `qa/test-plan.md`, `swarm/agent-usage.md`, `swarm/reports/*.md`, `review/code-review.md`, `review/code-review-smoke.md`, `security/security-report.md`, `security/security-smoke.md`, `.peaks/ut/unit-test-report.md`, `.peaks/ut/coverage-summary.json`, `qa/functional-report.md`, `qa/business-report.md`, `qa/performance-report.md`, `qa/runtime-smoke-report.md`, `qa/qa-round-1.md`, `qa/qa-round-2.md`, `qa/qa-round-3.md`, `qa/acceptance-report.md`, and `final-report.md` inside the active change. Reports must explicitly include their Artifact Path.
- `product/brainstorm.md` must be an interaction log with at least 5 AskUserQuestion rounds, user answers/selections, and decisions. Analysis summaries or open-question drafts must use `product/brainstorm-draft.md` and cannot advance the gate.
- Do not write new artifacts to legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, `.peaks/plans`, `.peaks/test-docs`, `.peaks/briefs`, or `.peaks/checkpoints`.
