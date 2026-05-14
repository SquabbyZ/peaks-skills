import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const CORE_PHASE_HANDOFFS = [
  {
    agent: 'product',
    phase: 'Product Brainstorming and PRD',
    trigger: 'After initialization baseline passes and before writing product/brainstorm.md or product/prd.md',
    outputs: ['product/brainstorm.md', 'product/prd.md', 'product/prd-confirmation.md']
  },
  {
    agent: 'design',
    phase: 'Visual Design',
    trigger: 'After product/prd-confirmation.md is approved and before design/design-confirmation.md',
    outputs: ['design/design-preview.html', 'design/design-spec.md', 'design/design-confirmation.md']
  },
  {
    agent: 'dispatcher',
    phase: 'Architecture and Swarm Planning',
    trigger: 'After design/design-confirmation.md is approved and before architecture/system-design-confirmation.md or swarm planning',
    outputs: ['architecture/system-design.md', 'architecture/system-design-confirmation.md', 'swarm/task-graph.json', 'swarm/waves.json']
  },
  {
    agent: 'qa',
    phase: 'QA Planning',
    trigger: 'After PRD/design/architecture confirmations and before implementation evidence is accepted',
    outputs: ['qa/test-plan.md', 'qa/functional-report.md', 'qa/business-report.md', 'qa/performance-report.md']
  }
];

export function writeCorePhaseHandoffs(paths) {
  const checkpointDir = join(paths.changeDir, 'checkpoints');
  mkdirSync(checkpointDir, { recursive: true });

  const written = [];
  for (const handoff of CORE_PHASE_HANDOFFS) {
    const relativePath = join('checkpoints', `${handoff.agent}-phase-handoff.md`);
    const absolutePath = join(paths.changeDir, relativePath);
    if (!existsSync(absolutePath)) {
      writeFileSync(absolutePath, renderHandoff(handoff), 'utf-8');
      written.push(relativePath);
    }
  }

  return written;
}

function renderHandoff(handoff) {
  return `# ${handoff.agent} Phase Handoff

Phase: ${handoff.phase}
Project Agent: .claude/agents/${handoff.agent}.md
Trigger: ${handoff.trigger}

Required Invocation Evidence:
- Record the actual project agent used before accepting this phase as complete.
- If the main session performs work directly, write that as a blocked/deviation note instead of marking the phase complete.
- User confirmations must be captured through AskUserQuestion or an explicit approval artifact.

Output Artifacts:
${handoff.outputs.map(output => `- ${output}`).join('\n')}

Status: READY
`;
}
