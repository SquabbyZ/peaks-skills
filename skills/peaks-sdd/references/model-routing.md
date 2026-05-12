# Model Routing

peaks-sdd uses role-based model routing instead of forcing every agent onto one model.

## Defaults

| Agent role | Default model | Reason |
| --- | --- | --- |
| `dispatcher` | `sonnet` | Orchestration, dependency reasoning, and gate decisions need strong balanced reasoning. |
| `product` | `sonnet` | Deep brainstorming, product tradeoffs, and PRD shaping need careful reasoning. |
| `design` | `sonnet` | UI/UX direction and design spec generation need taste and structured judgment. |
| `peaksfeat` | `sonnet` | Feature orchestration and planning need reliable reasoning. |
| `peaksbug` | `sonnet` | Debugging needs root-cause reasoning. |
| frontend/backend R&D dispatchers | `sonnet` | Technical docs, task graphs, file boundaries, and handoffs need strong reasoning. |
| frontend/backend child agents | `sonnet` | First version favors implementation reliability over cost optimization. |
| `qa` dispatcher | `sonnet` | Test planning and QA task graph generation need judgment. |
| `qa-child` | `haiku` | Narrow test execution and evidence collection are frequent and bounded. Escalate failures to `sonnet`. |
| `triage` | `haiku` | Classification and routing should be fast and cheap. Escalate ambiguous cases to `sonnet`. |
| `code-reviewer-*` | `sonnet` | Review accuracy matters more than marginal cost. |
| `security-reviewer` | `sonnet` | Security review needs careful reasoning; use `opus` only for high-risk final passes. |
| `devops` | `sonnet` | Local environment and CI/deploy issues can be subtle. |
| `postgres` | `sonnet` | Schema, migration, and query decisions need correctness. |
| `tauri` | `sonnet` | Rust/native integration and desktop packaging need stronger reasoning. |

## Escalation Rules

Use `opus` only for explicit high-value or high-risk work:

- Ambiguous product strategy with many tradeoffs.
- Final architecture review before large implementation.
- Security-critical code or sensitive data flows.
- Complex root-cause analysis after cheaper agents fail.
- Release-blocking review where false confidence is expensive.

Use `haiku` for bounded, repetitive, evidence-oriented work:

- QA child execution.
- Initial issue triage.
- Simple artifact presence checks.
- Summarizing known reports.

## Configuration Rules

- Prefer aliases: `haiku`, `sonnet`, `opus`.
- Avoid full model IDs in templates unless reproducibility matters more than maintenance.
- Keep `model: inherit` for cases where the caller must force a model externally.
- Document any environment-level overrides such as `CLAUDE_CODE_SUBAGENT_MODEL`, because they can override template expectations.

## Current First-Version Policy

Only `qa-child` and `triage` default to `haiku` now. Most agents remain on `sonnet` to keep the new-project swarm reliable while the workflow is still being dogfooded. After real runs produce enough evidence, simple implementation child agents can be split further into `haiku` and `sonnet` variants.
