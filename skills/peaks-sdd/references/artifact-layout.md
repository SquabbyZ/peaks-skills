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
- Required completion gates are `product/brainstorm.md`, `product/prd.md`, `design/design-spec.md`, `architecture/system-design.md`, `qa/test-plan.md`, `swarm/reports/*.md`, `review/code-review.md`, `review/security-review.md`, and `final-report.md` inside the active change.
- `product/brainstorm.md` must be an interaction log with at least 5 AskUserQuestion rounds, user answers/selections, and decisions. Analysis summaries or open-question drafts must use `product/brainstorm-draft.md` and cannot advance the gate.
- Do not write new artifacts to legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, `.peaks/plans`, `.peaks/test-docs`, `.peaks/briefs`, or `.peaks/checkpoints`.
