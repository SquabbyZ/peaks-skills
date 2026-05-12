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
      review/
      checkpoints/
      final-report.md
```

## Rules

- Every new project, feature iteration, and bugfix gets its own `.peaks/changes/<change-id>/`.
- `.peaks/current-change` contains the active relative path, for example `changes/2026-05-12-initial-product`.
- `.peaks/project/` stores cross-iteration knowledge only.
- Child agents receive explicit change-scoped file paths in their briefs.
- Do not write new artifacts to legacy top-level `.peaks/prds`, `.peaks/designs`, `.peaks/reports`, or `.peaks/checkpoints`.
