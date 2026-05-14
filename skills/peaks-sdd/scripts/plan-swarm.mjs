#!/usr/bin/env node

import { join } from 'path';
import { ensureExecutionAgents } from './ensure-execution-agents.mjs';
import { artifactPath, assertPlanningConfirmed, detectExecutionScope, getBriefAgents, writeArtifact } from './lib/execution-bridge.mjs';
import { createWaveProgressCard, createPhaseCard, writeWaveStatus } from './lib/progress-communicator.mjs';

export function planSwarm({ projectPath }) {
  const paths = assertPlanningConfirmed(projectPath);
  const scope = detectExecutionScope(projectPath);
  ensureExecutionAgents({ projectPath });

  const nodes = buildTaskGraphNodes(scope);
  const waves = buildWaves(scope);
  const briefAgents = getBriefAgents(scope);

  const taskGraphPath = join(paths.changeDir, 'swarm', 'task-graph.json');
  const wavesPath = join(paths.changeDir, 'swarm', 'waves.json');
  const ownershipPath = join(paths.changeDir, 'swarm', 'file-ownership.json');
  const statusPath = join(paths.changeDir, 'swarm', 'status.json');

  writeArtifact(taskGraphPath, `${JSON.stringify({ nodes }, null, 2)}\n`);
  writeArtifact(wavesPath, `${JSON.stringify({ waves }, null, 2)}\n`);
  writeArtifact(ownershipPath, `${JSON.stringify(buildFileOwnership(scope), null, 2)}\n`);
  writeArtifact(statusPath, `${JSON.stringify({ status: 'PLANNED', phase: 4, updatedAt: new Date().toISOString() }, null, 2)}\n`);

  // Output wave progress cards for user visibility
  console.log('\n' + createPhaseCard({ phase: 'development', step: 4, totalSteps: 7, description: '开发阶段任务规划', changeId: paths.changeId }));
  for (const wave of waves) {
    console.log('\n' + createWaveProgressCard({ wave: wave.phase, totalWaves: waves.length, agents: wave.parallel, status: 'planned' }));
    writeWaveStatus(projectPath, paths.changeId, wave.phase, 'planned', wave.parallel);
  }

  for (const agent of briefAgents) {
    writeBrief({ projectPath, paths, agent, scope });
    writeInitialHandoff({ projectPath, paths, agent });
  }

  return {
    ready: true,
    changeId: paths.changeId,
    taskGraphPath,
    wavesPath,
    briefAgents
  };
}

function buildTaskGraphNodes(scope) {
  return [
    ...(scope.hasDatabase ? [{ agentId: 'postgres', module: 'database-schema', files: ['prisma', 'src/db'], dependsOn: ['architecture'] }] : []),
    ...(scope.hasApi ? [{ agentId: 'backend', module: 'backend-api', files: ['server', 'src/server', 'src/api'], dependsOn: scope.hasDatabase ? ['database-schema'] : ['architecture'] }] : []),
    ...(scope.hasUi ? [{ agentId: 'frontend', module: 'frontend-ui', files: ['src/pages', 'src/components', 'src/hooks'], dependsOn: ['design', ...(scope.hasApi ? ['backend-api'] : [])] }] : []),
    { agentId: 'qa-child', module: 'unit-test', files: ['.peaks/ut'], dependsOn: [...(scope.hasUi ? ['frontend-ui'] : []), ...(scope.hasApi ? ['backend-api'] : [])] },
    ...(scope.hasUi ? [{ agentId: 'code-reviewer-frontend', module: 'frontend-code-review', files: ['src'], dependsOn: ['frontend-ui'] }] : []),
    ...(scope.hasApi ? [{ agentId: 'code-reviewer-backend', module: 'backend-code-review', files: ['server', 'src/server', 'src/api'], dependsOn: ['backend-api'] }] : []),
    { agentId: 'security-reviewer', module: 'security', files: ['src', 'server', 'prisma'], dependsOn: [...(scope.hasApi ? ['backend-api'] : []), ...(scope.hasUi ? ['frontend-ui'] : [])] },
    { agentId: 'qa-child', module: 'qa-functional', files: ['.peaks/changes'], dependsOn: ['unit-test'] },
    { agentId: 'qa-child', module: 'qa-business', files: ['.peaks/changes'], dependsOn: ['qa-functional'] },
    { agentId: 'qa-child', module: 'qa-performance', files: ['.peaks/changes'], dependsOn: ['qa-business'] },
    { agentId: 'qa-child', module: 'runtime-smoke', files: ['.peaks/changes'], dependsOn: ['qa-performance', 'security'] }
  ];
}

function buildWaves(scope) {
  const devWave = [
    ...(scope.hasDatabase ? ['postgres'] : []),
    ...(scope.hasApi ? ['backend'] : []),
    ...(scope.hasUi ? ['frontend'] : [])
  ].slice(0, 5);

  const qualityWave = [
    ...(scope.hasUi ? ['code-reviewer-frontend'] : []),
    ...(scope.hasApi ? ['code-reviewer-backend'] : []),
    'security-reviewer',
    'qa-child'
  ].slice(0, 5);

  return [
    ...(devWave.length > 0 ? [{ phase: 1, name: 'development', parallel: devWave }] : []),
    { phase: 2, name: 'quality', parallel: qualityWave },
    { phase: 3, name: 'delivery', parallel: ['qa-child'] }
  ];
}

function buildFileOwnership(scope) {
  return {
    ...(scope.hasUi ? { frontend: ['src/pages/**', 'src/components/**', 'src/hooks/**'] } : {}),
    ...(scope.hasApi ? { backend: ['server/**', 'src/server/**', 'src/api/**'] } : {}),
    ...(scope.hasDatabase ? { postgres: ['prisma/**', 'migrations/**', 'src/db/**'] } : {}),
    qa: ['.peaks/**', 'tests/**'],
    review: ['review/**', 'security/**']
  };
}

function writeBrief({ projectPath, paths, agent, scope }) {
  const briefPath = join(paths.changeDir, 'swarm', 'briefs', `${agent}.md`);
  writeArtifact(briefPath, `# ${agent} Brief\n\nArtifact Path: ${artifactPath(projectPath, briefPath)}\nTask: Execute the ${agent} responsibility for phase 4-6 without expanding file ownership.\nFiles: ${ownedFiles(agent, scope).join(', ')}\nDepends On: product/prd.md, design/design-spec.md, architecture/system-design.md, swarm/task-graph.json\nHandoff: write swarm/handoffs/${agent}.md with input version, output version, files changed, and next agent.\nAcceptance: status PASS only after self-test evidence and report paths are written.\n`);
}

function writeInitialHandoff({ projectPath, paths, agent }) {
  const handoffPath = join(paths.changeDir, 'swarm', 'handoffs', `${agent}.md`);
  writeArtifact(handoffPath, `# ${agent} Handoff\n\nInput Version: planning-v1\nOutput Version: pending\nFiles Changed: none yet\nNext Agent: dispatcher\nStatus: READY\n`);
}

function ownedFiles(agent, scope) {
  if (agent === 'frontend') return ['src/pages/**', 'src/components/**', 'src/hooks/**'];
  if (agent === 'backend') return ['server/**', 'src/server/**', 'src/api/**'];
  if (agent === 'postgres') return ['prisma/**', 'migrations/**', 'src/db/**'];
  if (agent === 'qa-child') return ['.peaks/changes/**/qa/**', '.peaks/ut/**'];
  if (agent.startsWith('code-reviewer')) return scope.hasApi ? ['src/**', 'server/**'] : ['src/**'];
  if (agent === 'security-reviewer') return ['src/**', 'server/**', 'prisma/**'];
  return ['.peaks/**'];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const result = planSwarm({ projectPath });
  console.log(`Swarm plan ready: ${result.briefAgents.join(', ')}`);
}
