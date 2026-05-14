#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ensureProjectAgents } from './lib/agent-generator.mjs';
import { artifactPath, assertPlanningConfirmed, detectExecutionScope, getExecutionAgents, getSkillDir, writeArtifact } from './lib/execution-bridge.mjs';

export function ensureExecutionAgents({ projectPath, templatesDir = join(getSkillDir(), 'templates', 'agents') }) {
  const paths = assertPlanningConfirmed(projectPath);
  const scope = detectExecutionScope(projectPath);

  const result = ensureProjectAgents({
    projectPath,
    templatesDir,
    techStack: scope,
    mode: 'full'
  });

  const requiredAgents = getExecutionAgents(scope);
  const missing = requiredAgents.filter(agent => !existsSync(join(projectPath, '.claude', 'agents', `${agent}.md`)));
  if (missing.length > 0) {
    throw new Error(`Execution agents missing after generation: ${missing.join(', ')}`);
  }
  const stale = requiredAgents.filter(agent => !isValidAgentFile(join(projectPath, '.claude', 'agents', `${agent}.md`), agent));
  if (stale.length > 0) {
    throw new Error(`Stale execution agents: ${stale.join(', ')}`);
  }

  const reportPath = join(paths.changeDir, 'swarm', 'execution-agents.md');
  writeArtifact(reportPath, `# Execution Agents\n\nArtifact Path: ${artifactPath(projectPath, reportPath)}\nStatus: READY\n\n## Scope\n\n- UI: ${scope.hasUi ? 'yes' : 'no'}\n- API/backend: ${scope.hasApi ? 'yes' : 'no'}\n- Database: ${scope.hasDatabase ? 'yes' : 'no'}\n- Auth: ${scope.hasAuth ? 'yes' : 'no'}\n\n## Required Agents\n\n${requiredAgents.map(agent => `- ${agent}: .claude/agents/${agent}.md`).join('\n')}\n\n## Generator Result\n\n- Generated: ${result.generatedAgents.join(', ') || 'none'}\n- Patched: ${result.patchedAgents.join(', ') || 'none'}\n- Deferred restored: ${result.deferredAgents.length === 0 ? 'none' : result.deferredAgents.join(', ')}\n`);

  return {
    ready: true,
    changeId: paths.changeId,
    scope,
    requiredAgents,
    generatedAgents: result.generatedAgents,
    reportPath
  };
}

function isValidAgentFile(path, agent) {
  const content = readFileSync(path, 'utf-8');
  return content.includes(`name: ${agent}`) && /---[\s\S]*---/.test(content);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const result = ensureExecutionAgents({ projectPath });
  console.log(`Execution agents ready: ${result.requiredAgents.join(', ')}`);
}
