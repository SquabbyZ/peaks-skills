# R&D Dispatcher Protocol

This protocol is used by `templates/agents/sub-front/frontend.md` and `templates/agents/sub-back/backend.md`.

## Role

The frontend and backend R&D dispatcher agents do two jobs in order:

1. Write the technical document for their domain.
2. Split that technical document into executable child-agent tasks.

They are not ordinary implementation agents. They coordinate implementation through child agents after the technical document is complete.

## Required Inputs

| Domain | Required inputs |
| --- | --- |
| Frontend | PRD, design spec/screenshot if UI exists, swagger/API contract, test cases, project conventions |
| Backend | PRD, backend requirements, DB schema if present, API requirements, test cases, project conventions |

If a required input is missing, write a `NEEDS_CONTEXT` note with the missing file path or decision.

## Phase 1: Write Technical Document

The R&D dispatcher must write a domain technical document before dispatching child agents.

| Domain | Output |
| --- | --- |
| Frontend | `.peaks/changes/<change-id>/architecture/system-design.md` |
| Backend | `.peaks/changes/<change-id>/architecture/system-design.md` |

The technical document must include:

- Scope and non-goals
- Architecture decisions
- File/module plan
- Data/API contracts
- Task table with IDs, dependencies, owned files, tests, and acceptance criteria
- Risks and integration points

## Phase 2: Build Task Graph

Convert the task table into a task graph.

```typescript
interface RdTaskNode {
  id: string;
  title: string;
  domain: 'frontend' | 'backend';
  ownedFiles: string[];
  readOnlyFiles: string[];
  dependsOn: string[];
  acceptanceCriteria: string[];
  requiredTests: string[];
  outputReport: string;
}

interface RdTaskGraph {
  feature: string;
  generatedFrom: string;
  nodes: RdTaskNode[];
  waves: string[][];
}
```

Write the task graph to:

```text
.peaks/changes/<change-id>/dispatch/[front|back]-task-graph.json
```

## Dependency Rules

- Tasks with no dependency and no overlapping `ownedFiles` can run in the same wave.
- Tasks that modify the same file must be serial.
- Tasks depending on generated contracts/types must wait for the producer task.
- Shared files require explicit dispatcher ownership in the task graph.
- Maximum child agents per wave: 5.
- Maximum child agents per domain workflow: 10.

## Phase 3: Write Child-Agent Briefs

Every child agent receives a brief file. Do not rely on conversation context.

Brief path:

```text
.peaks/changes/<change-id>/swarm/briefs/[front|back]-[TASK-ID]-[slug].md
```

Brief template:

```markdown
# Child Agent Brief - [TASK-ID] [Title]

## Status Contract
Return exactly one status: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED.

## Goal
[One clear goal]

## Non-Goals
- [Explicitly forbidden scope]

## Required Context
- PRD: [path]
- Technical doc: [path]
- API/DB/design/test docs: [paths]

## File Boundaries
### May Modify
- [paths]

### Read Only
- [paths]

### Must Not Touch
- [paths]

## Implementation Steps
1. [Specific step]
2. [Specific step]

## Acceptance Criteria
- [Criterion]

## Required Tests
- [Command or test file]

## Output Artifacts
- Self-test report: [path]

## Response Format
```yaml
status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
summary: "one-line summary"
changed_files:
  - path: "..."
    reason: "..."
tests_run:
  - command: "..."
    result: "PASS | FAIL | NOT_RUN"
artifacts:
  - "..."
next_actions:
  - "..."
concerns:
  - "..."
```
```

## Phase 4: Dispatch by Waves

1. Dispatch all tasks in wave 1 concurrently.
2. Collect structured responses.
3. If any task returns `NEEDS_CONTEXT`, provide missing context and rerun that task.
4. If any task returns `BLOCKED`, stop downstream dependent tasks and write a blocker report.
5. Only start wave N+1 after all dependencies in previous waves are `DONE` or `DONE_WITH_CONCERNS` with accepted concerns.

## Phase 5: Review and Summary

For each child task:

1. Check the self-test report exists.
2. Verify modified files stay inside allowed boundaries.
3. Verify required tests were run or explicitly marked with a reason.
4. If the task violates the brief, rerun or create a fix brief.

Write summary:

```text
.peaks/changes/<change-id>/swarm/reports/[frontend|backend]-summary.md
```

Summary must include:

- Task graph path
- Brief paths
- Child agent statuses
- Changed files
- Tests run
- Integration risks
- Handoff notes for upper dispatcher / QA
