import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPeaksPaths, writeCurrentChange } from './lib/change-artifacts.mjs';
import { hasValidPlanningConfirmations } from './lib/planning-confirmations.mjs';
import { tmpdir } from 'node:os';
import { ensureProjectAgents } from './lib/agent-generator.mjs';

const templatesDir = join(import.meta.dirname, '..', 'templates', 'agents');

function createProject() {
  const projectPath = mkdtempSync(join(tmpdir(), 'peaks-sdd-agents-'));
  return projectPath;
}

test('bootstraps project agents when .claude/agents is missing', () => {
  const projectPath = createProject();

  try {
    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, frontend: 'react' }
    });

    assert.equal(result.bootstrapped, true);
    assert.ok(result.generatedAgents.includes('dispatcher'));
    assert.match(readFileSync(join(projectPath, '.claude', 'agents', 'dispatcher.md'), 'utf-8'), /name: dispatcher/);
    assert.match(readFileSync(join(projectPath, '.claude', 'agents', 'product.md'), 'utf-8'), /name: product/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('bootstraps only core agents for 0-to-1 projects before product brainstorming', () => {
  const projectPath = createProject();

  try {
    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, isZeroToOneProject: true }
    });

    const expectedCoreAgents = ['dispatcher', 'product', 'design', 'qa', 'triage'];
    const deferredAgents = [
      'frontend',
      'frontend-child',
      'backend',
      'backend-child',
      'devops',
      'postgres',
      'tauri',
      'security-reviewer',
      'code-reviewer-frontend',
      'code-reviewer-backend',
      'qa-child'
    ];

    for (const agent of expectedCoreAgents) {
      assert.ok(result.generatedAgents.includes(agent), `${agent} should be generated`);
      assert.match(readFileSync(join(projectPath, '.claude', 'agents', `${agent}.md`), 'utf-8'), new RegExp(`name: ${agent}`));
    }

    for (const agent of deferredAgents) {
      assert.ok(!result.generatedAgents.includes(agent), `${agent} should be deferred until PRD/design/tech plan confirmation`);
    }
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('malformed planning confirmations do not unlock deferred execution agents', () => {
  const projectPath = createProject();

  try {
    const changeId = '2026-05-14-malformed-confirmations';
    writeCurrentChange(projectPath, changeId);
    const paths = getPeaksPaths(projectPath, changeId);
    mkdirSync(join(paths.changeDir, 'product'), { recursive: true });
    mkdirSync(join(paths.changeDir, 'design'), { recursive: true });
    mkdirSync(join(paths.changeDir, 'architecture'), { recursive: true });
    writeFileSync(join(paths.changeDir, 'product', 'prd-confirmation.md'), 'status: approved\n');
    writeFileSync(join(paths.changeDir, 'design', 'design-confirmation.md'), 'status: approved\n');
    writeFileSync(join(paths.changeDir, 'architecture', 'system-design-confirmation.md'), 'status: approved\n');

    assert.equal(hasValidPlanningConfirmations(projectPath), false);

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, isZeroToOneProject: true, hasConfirmedPlanningArtifacts: hasValidPlanningConfirmations(projectPath) }
    });

    assert.ok(result.generatedAgents.includes('product'));
    assert.ok(!result.generatedAgents.includes('frontend'));
    assert.ok(!result.generatedAgents.includes('security-reviewer'));
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('valid planning confirmations unlock deferred execution agents', () => {
  const projectPath = createProject();

  try {
    const changeId = '2026-05-14-valid-confirmations';
    writeCurrentChange(projectPath, changeId);
    const paths = getPeaksPaths(projectPath, changeId);
    mkdirSync(join(paths.changeDir, 'product'), { recursive: true });
    mkdirSync(join(paths.changeDir, 'design'), { recursive: true });
    mkdirSync(join(paths.changeDir, 'architecture'), { recursive: true });
    for (const [dir, file, artifact] of [
      ['product', 'prd-confirmation.md', 'product/prd.md'],
      ['design', 'design-confirmation.md', 'design/design-preview.html'],
      ['architecture', 'system-design-confirmation.md', 'architecture/system-design.md']
    ]) {
      writeFileSync(join(paths.changeDir, dir, file), `status: approved\napprover: user\napprovedAt: 2026-05-14T00:00:00Z\nartifact: ${artifact}\nsource: user confirmation\ndecision: User approved ${artifact} with enough detail to proceed.\n`);
    }

    assert.equal(hasValidPlanningConfirmations(projectPath), true);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('quarantines deferred agents during 0-to-1 core initialization', () => {
  const projectPath = createProject();

  try {
    const agentsDir = join(projectPath, '.claude', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(join(agentsDir, 'frontend.md'), 'stale frontend agent');
    writeFileSync(join(agentsDir, 'security-reviewer.md'), 'stale security agent');

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, isZeroToOneProject: true }
    });

    assert.deepEqual(result.deferredAgents.sort(), ['frontend', 'security-reviewer']);
    assert.throws(() => readFileSync(join(agentsDir, 'frontend.md'), 'utf-8'));
    assert.throws(() => readFileSync(join(agentsDir, 'security-reviewer.md'), 'utf-8'));
    assert.equal(readFileSync(join(agentsDir, '.deferred', 'frontend.md'), 'utf-8'), 'stale frontend agent');
    assert.equal(readFileSync(join(agentsDir, '.deferred', 'security-reviewer.md'), 'utf-8'), 'stale security agent');
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('bootstraps project agents when .claude/agents exists but is empty', () => {
  const projectPath = createProject();

  try {
    mkdirSync(join(projectPath, '.claude', 'agents'), { recursive: true });

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, frontend: 'react' }
    });

    assert.equal(result.bootstrapped, true);
    assert.ok(result.generatedAgents.includes('dispatcher'));
    assert.match(readFileSync(join(projectPath, '.claude', 'agents', 'qa.md'), 'utf-8'), /name: qa/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('fills missing base agents without overwriting existing project agents', () => {
  const projectPath = createProject();

  try {
    const agentsDir = join(projectPath, '.claude', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    const customDispatcher = 'custom dispatcher knowledge';
    const customProduct = 'custom product knowledge';
    const customQa = 'custom qa knowledge';
    writeFileSync(join(agentsDir, 'dispatcher.md'), customDispatcher);
    writeFileSync(join(agentsDir, 'product.md'), customProduct);
    writeFileSync(join(agentsDir, 'qa.md'), customQa);

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath }
    });

    assert.equal(result.bootstrapped, true);
    assert.ok(result.generatedAgents.includes('devops'));
    assert.match(readFileSync(join(agentsDir, 'dispatcher.md'), 'utf-8'), /custom dispatcher knowledge[\s\S]*peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'product.md'), 'utf-8'), /custom product knowledge[\s\S]*peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'qa.md'), 'utf-8'), /custom qa knowledge[\s\S]*peaks-sdd-contract-v2/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('fills missing core agents without overwriting customized existing agents', () => {
  const projectPath = createProject();

  try {
    const agentsDir = join(projectPath, '.claude', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    const customDispatcher = 'custom dispatcher knowledge';
    const customProduct = 'custom product knowledge';
    writeFileSync(join(agentsDir, 'dispatcher.md'), customDispatcher);
    writeFileSync(join(agentsDir, 'product.md'), customProduct);

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath }
    });

    assert.equal(result.bootstrapped, true);
    assert.ok(result.generatedAgents.includes('qa'));
    assert.deepEqual(result.missingCoreAgents, []);
    assert.match(readFileSync(join(agentsDir, 'dispatcher.md'), 'utf-8'), /custom dispatcher knowledge[\s\S]*peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'product.md'), 'utf-8'), /custom product knowledge[\s\S]*peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'qa.md'), 'utf-8'), /name: qa/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('fills missing stack-specific agents when core agents already exist', () => {
  const projectPath = createProject();

  try {
    const agentsDir = join(projectPath, '.claude', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(join(agentsDir, 'dispatcher.md'), 'custom dispatcher knowledge');
    writeFileSync(join(agentsDir, 'product.md'), 'custom product knowledge');
    writeFileSync(join(agentsDir, 'qa.md'), 'custom qa knowledge');

    const result = ensureProjectAgents({
      projectPath,
      templatesDir,
      techStack: { projectName: 'demo', projectPath, frontend: 'react' }
    });

    assert.equal(result.bootstrapped, true);
    assert.ok(result.generatedAgents.includes('frontend'));
    assert.ok(result.generatedAgents.includes('design'));
    assert.match(readFileSync(join(agentsDir, 'dispatcher.md'), 'utf-8'), /peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'product.md'), 'utf-8'), /peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'qa.md'), 'utf-8'), /peaks-sdd-contract-v2/);
    assert.match(readFileSync(join(agentsDir, 'frontend.md'), 'utf-8'), /name: frontend/);
    assert.match(readFileSync(join(agentsDir, 'frontend-child.md'), 'utf-8'), /name: frontend-child/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});
