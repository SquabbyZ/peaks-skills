import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureExecutionAgents } from './ensure-execution-agents.mjs';
import { planSwarm } from './plan-swarm.mjs';
import { runQualityGates } from './run-quality-gates.mjs';
import { runDeliverySmoke } from './run-delivery-smoke.mjs';

const templatesDir = join(import.meta.dirname, '..', 'templates', 'agents');

function writeFile(path, content = '') {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function createConfirmedProject(options = {}) {
  const projectPath = mkdtempSync(join(tmpdir(), 'peaks-sdd-bridge-'));
  const changeId = '2026-05-14-initial-product';
  const changeRoot = join(projectPath, '.peaks', 'changes', changeId);

  writeFile(join(projectPath, 'package.json'), JSON.stringify({
    scripts: { dev: 'vite', build: 'tsc && vite build', test: 'vitest run --coverage' },
    dependencies: {
      react: '^18.0.0',
      express: '^4.0.0',
      prisma: '^5.0.0'
    },
    devDependencies: { vite: '^6.0.0', typescript: '^5.0.0', vitest: '^2.0.0' }
  }));
  writeFile(join(projectPath, '.peaks', 'current-change'), `changes/${changeId}\n`);
  writeFile(join(changeRoot, 'product', 'prd.md'), '# PRD\n\n## Acceptance Criteria\n- AC-001: User can register, log in, and send a chat message.\n');
  writeFile(join(changeRoot, 'product', 'prd-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-14T00:00:00Z\nartifact: product/prd.md\nsource: user confirmation\ndecision: User approved the PRD for the next phase.\n');
  writeFile(join(changeRoot, 'product', 'swagger.json'), JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Chat API', version: '1.0.0' },
    paths: { '/api/auth/login': {}, '/api/chat': {} }
  }));
  writeFile(join(changeRoot, 'design', 'design-spec.md'), '# Design Spec\n');
  writeFile(join(changeRoot, 'design', 'design-preview.html'), `<!doctype html><html><body>${'chat design '.repeat(120)}</body></html>`);
  writeFile(join(changeRoot, 'design', 'design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-14T00:00:00Z\nartifact: design/design-preview.html\nsource: user confirmation\nPreview URL: http://localhost:3001/design-preview.html\nPreview Command: npx serve .peaks/changes/2026-05-14-initial-product/design -p 3001 --no-clipboard\nScreenshot: design/design-preview.png\ndecision: User approved the visual artifact for implementation.\n');
  writeFile(join(changeRoot, 'architecture', 'system-design.md'), '# System Design\n\nFrontend: React. Backend: Express. Database: Prisma/PostgreSQL. QA: Playwright/Vitest.\n');
  writeFile(join(changeRoot, 'architecture', 'system-design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-14T00:00:00Z\nartifact: architecture/system-design.md\nsource: user confirmation\ndecision: User approved the technical architecture for swarm execution.\n');

  for (const agent of ['dispatcher', 'product', 'design', 'qa', 'triage']) {
    writeFile(join(projectPath, '.claude', 'agents', `${agent}.md`), agent);
  }

  return { projectPath, changeId, changeRoot, cleanup: () => rmSync(projectPath, { recursive: true, force: true }) };
}

function writeQualityEvidence(projectPath, changeRoot) {
  writeFile(join(changeRoot, 'swarm', 'reports', 'frontend-summary.md'), '# Frontend Self Test\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/swarm/reports/frontend-summary.md\nAgent: frontend\nCommand: npm test -- frontend\nStatus: PASS\n');
  writeFile(join(changeRoot, 'swarm', 'reports', 'backend-summary.md'), '# Backend Self Test\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/swarm/reports/backend-summary.md\nAgent: backend\nCommand: npm test -- backend\nStatus: PASS\n');
  writeFile(join(changeRoot, 'swarm', 'reports', 'postgres-summary.md'), '# Database Self Test\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/swarm/reports/postgres-summary.md\nAgent: postgres\nCommand: npm test -- database\nStatus: PASS\n');
  writeFile(join(changeRoot, 'swarm', 'reports', 'qa-summary.md'), '# QA Self Test\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/swarm/reports/qa-summary.md\nAgent: qa-child\nCommand: qa-child execution\nStatus: PASS\n');
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/review/code-review.md\nReviewer: code-reviewer-frontend, code-reviewer-backend\nScope: frontend/backend changes\n\n| Severity | Finding | Status |\n| --- | --- | --- |\n| CRITICAL | 0 | resolved |\n| HIGH | 0 | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'review', 'code-review-smoke.md'), '# Code Review Smoke\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/review/code-review-smoke.md\nCommand: code-reviewer dry run\nTarget: review/code-review.md\nStatus: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security Review\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/security/security-report.md\nReviewer: security-reviewer\nScope: auth, API, frontend input handling\n\n| Severity | Risk | Status |\n| --- | --- | --- |\n| CRITICAL | 0 | resolved |\n| HIGH | 0 | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-smoke.md'), '# Security Smoke\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/security/security-smoke.md\nCommand: security-reviewer dry run\nTarget: security/security-report.md\nStatus: PASS\n');
  writeFile(join(projectPath, '.peaks', 'ut', 'unit-test-report.md'), '# Unit Test Report\n\nArtifact Path: .peaks/ut/unit-test-report.md\nCommand: npm test -- --coverage\nStatus: PASS\nCoverage Target: 95%\n');
  writeFile(join(projectPath, '.peaks', 'ut', 'coverage-summary.json'), JSON.stringify({ total: { lines: { pct: 95 }, statements: { pct: 95 }, branches: { pct: 95 }, functions: { pct: 95 } } }));
  for (const [file, title] of [['qa-round-1.md', 'QA Round 1'], ['qa-round-2.md', 'QA Round 2'], ['qa-round-3.md', 'QA Round 3'], ['functional-report.md', 'Functional QA'], ['performance-report.md', 'Performance QA'], ['acceptance-report.md', 'Acceptance Report']]) {
    writeFile(join(changeRoot, 'qa', file), `# ${title}\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/qa/${file}\nStatus: PASS\n`);
  }
  writeFile(join(changeRoot, 'qa', 'business-report.md'), '# Business QA\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/qa/business-report.md\n- AC-001: Core business flow verified.\nBusiness Flow Value: user can complete the core path.\nstatus: PASS\n');
}

test('ensureExecutionAgents rejects incomplete planning confirmations', () => {
  const { projectPath, cleanup } = createConfirmedProject();
  try {
    writeFile(join(projectPath, '.peaks', 'changes', '2026-05-14-initial-product', 'product', 'prd-confirmation.md'), 'status: approved\n');

    assert.throws(() => ensureExecutionAgents({ projectPath, templatesDir }), /Invalid planning confirmation/);
  } finally {
    cleanup();
  }
});

test('ensureExecutionAgents does not require design confirmation for backend-only projects', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    writeFile(join(projectPath, 'package.json'), JSON.stringify({
      dependencies: { express: '^4.0.0' },
      devDependencies: { vitest: '^2.0.0' }
    }));
    rmSync(join(changeRoot, 'design'), { recursive: true, force: true });
    writeFile(join(projectPath, 'src', 'server.ts'), 'export const server = true;\n');
    writeFile(join(changeRoot, 'architecture', 'system-design.md'), '# System Design\n\nBackend: Express API. No UI is in scope.\n');

    const result = ensureExecutionAgents({ projectPath, templatesDir });

    assert.equal(result.ready, true);
    assert.ok(result.requiredAgents.includes('backend'));
    assert.ok(!result.requiredAgents.includes('frontend'));
    assert.ok(!result.requiredAgents.includes('code-reviewer-frontend'));
  } finally {
    cleanup();
  }
});

test('ensureExecutionAgents rejects stale execution agents', () => {
  const { projectPath, cleanup } = createConfirmedProject();
  try {
    writeFile(join(projectPath, '.claude', 'agents', 'frontend.md'), 'stale frontend');

    assert.throws(() => ensureExecutionAgents({ projectPath, templatesDir }), /Stale execution agents/);
  } finally {
    cleanup();
  }
});

test('ensureExecutionAgents generates scoped execution agents after all planning confirmations', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    const result = ensureExecutionAgents({ projectPath, templatesDir });

    assert.equal(result.ready, true);
    for (const agent of ['frontend', 'frontend-child', 'backend', 'backend-child', 'postgres', 'qa-child', 'code-reviewer-frontend', 'code-reviewer-backend', 'security-reviewer']) {
      assert.ok(existsSync(join(projectPath, '.claude', 'agents', `${agent}.md`)), `${agent} should exist`);
    }
    assert.ok(existsSync(join(changeRoot, 'swarm', 'execution-agents.md')));
    assert.match(readFileSync(join(changeRoot, 'swarm', 'execution-agents.md'), 'utf-8'), /Artifact Path:/);
  } finally {
    cleanup();
  }
});

test('planSwarm writes graph waves briefs handoffs and ownership for phase 4', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    const result = planSwarm({ projectPath });

    assert.equal(result.ready, true);
    for (const file of ['task-graph.json', 'waves.json', 'file-ownership.json', 'status.json']) {
      assert.ok(existsSync(join(changeRoot, 'swarm', file)), `${file} should exist`);
    }
    const graph = JSON.parse(readFileSync(join(changeRoot, 'swarm', 'task-graph.json'), 'utf-8'));
    assert.ok(graph.nodes.some(node => node.module === 'backend-api'));
    assert.ok(graph.nodes.some(node => node.module === 'runtime-smoke'));
    const waves = JSON.parse(readFileSync(join(changeRoot, 'swarm', 'waves.json'), 'utf-8')).waves;
    assert.ok(waves.some(wave => wave.parallel.length >= 2 && wave.parallel.length <= 5));
    for (const agent of ['frontend', 'backend', 'qa-child', 'code-reviewer-frontend', 'code-reviewer-backend', 'security-reviewer']) {
      assert.ok(existsSync(join(changeRoot, 'swarm', 'briefs', `${agent}.md`)), `${agent} brief should exist`);
      assert.ok(existsSync(join(changeRoot, 'swarm', 'handoffs', `${agent}.md`)), `${agent} handoff should exist`);
    }
  } finally {
    cleanup();
  }
});

test('runQualityGates blocks when real execution evidence is missing', () => {
  const { projectPath, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });

    assert.throws(() => runQualityGates({ projectPath }), /Missing quality evidence/);
  } finally {
    cleanup();
  }
});

test('runQualityGates blocks failing unit coverage evidence', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });
    writeQualityEvidence(projectPath, changeRoot);
    writeFile(join(projectPath, '.peaks', 'ut', 'unit-test-report.md'), '# Unit Test Report\n\nStatus: FAIL\n');
    writeFile(join(projectPath, '.peaks', 'ut', 'coverage-summary.json'), JSON.stringify({ total: { lines: { pct: 5 }, statements: { pct: 5 }, branches: { pct: 5 }, functions: { pct: 5 } } }));

    assert.throws(() => runQualityGates({ projectPath }), /Unresolved blocking findings: unit test report, coverage summary/);
  } finally {
    cleanup();
  }
});

test('runQualityGates blocks failed QA reports', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });
    writeQualityEvidence(projectPath, changeRoot);
    writeFile(join(changeRoot, 'qa', 'functional-report.md'), '# Functional QA\n\nStatus: FAIL\n');
    writeFile(join(changeRoot, 'qa', 'acceptance-report.md'), '# Acceptance\n\nStatus: BLOCKED\n');

    assert.throws(() => runQualityGates({ projectPath }), /Unresolved blocking findings: functional QA, acceptance report/);
  } finally {
    cleanup();
  }
});

test('runQualityGates collects existing review security coverage and QA evidence', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });
    writeQualityEvidence(projectPath, changeRoot);
    const result = runQualityGates({ projectPath });

    assert.equal(result.ready, true);
    for (const file of [
      ['review', 'code-review.md'],
      ['review', 'code-review-smoke.md'],
      ['security', 'security-report.md'],
      ['security', 'security-smoke.md'],
      ['qa', 'qa-round-1.md'],
      ['qa', 'qa-round-2.md'],
      ['qa', 'qa-round-3.md'],
      ['qa', 'functional-report.md'],
      ['qa', 'business-report.md'],
      ['qa', 'performance-report.md'],
      ['qa', 'acceptance-report.md']
    ]) {
      assert.ok(existsSync(join(changeRoot, ...file)), file.join('/'));
    }
    assert.ok(existsSync(join(projectPath, '.peaks', 'ut', 'unit-test-report.md')));
    assert.ok(existsSync(join(projectPath, '.peaks', 'ut', 'coverage-summary.json')));
    assert.ok(existsSync(join(changeRoot, 'swarm', 'reports', 'frontend-summary.md')));
    assert.ok(existsSync(join(changeRoot, 'swarm', 'reports', 'backend-summary.md')));
    assert.ok(existsSync(join(changeRoot, 'swarm', 'reports', 'postgres-summary.md')));
    assert.ok(existsSync(join(changeRoot, 'swarm', 'reports', 'qa-summary.md')));
    assert.match(readFileSync(join(changeRoot, 'review', 'code-review.md'), 'utf-8'), /CRITICAL[\s\S]*0/);
  } finally {
    cleanup();
  }
});

test('runDeliverySmoke blocks when runtime smoke evidence is missing', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });
    writeQualityEvidence(projectPath, changeRoot);
    runQualityGates({ projectPath });

    assert.throws(() => runDeliverySmoke({ projectPath }), /Missing runtime smoke evidence/);
  } finally {
    cleanup();
  }
});

test('runDeliverySmoke writes final report from existing runtime smoke evidence chain', () => {
  const { projectPath, changeRoot, cleanup } = createConfirmedProject();
  try {
    ensureExecutionAgents({ projectPath, templatesDir });
    planSwarm({ projectPath });
    writeQualityEvidence(projectPath, changeRoot);
    runQualityGates({ projectPath });
    writeFile(join(changeRoot, 'qa', 'runtime-smoke-report.md'), '# Runtime Smoke Report\n\nArtifact Path: .peaks/changes/2026-05-14-initial-product/qa/runtime-smoke-report.md\nCommand: npm run dev\nURL: http://localhost:5173\nTarget: core chat path\nCore Path: register/login/chat\nUser UX Verification: requested\nStatus: PASS\n');
    const result = runDeliverySmoke({ projectPath });

    assert.equal(result.ready, true);
    assert.ok(existsSync(join(changeRoot, 'qa', 'runtime-smoke-report.md')));
    assert.ok(existsSync(join(changeRoot, 'final-report.md')));
    const finalReport = readFileSync(join(changeRoot, 'final-report.md'), 'utf-8');
    for (const path of ['product/prd.md', 'design/design-spec.md', 'architecture/system-design.md', 'swarm/task-graph.json', 'review/code-review.md', 'security/security-report.md', 'qa/runtime-smoke-report.md']) {
      assert.match(finalReport, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  } finally {
    cleanup();
  }
});
