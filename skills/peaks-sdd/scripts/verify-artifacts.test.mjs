import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { runGateChecks } from './verify-artifacts.mjs';

function writeFile(path, content = '') {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function createProject(options = {}) {
  const projectPath = mkdtempSync(join(tmpdir(), 'peaks-sdd-gate-'));
  const changeId = '2026-05-13-quality-gates';
  const changeRoot = join(projectPath, '.peaks', 'changes', changeId);

  if (options.packageJson) {
    writeFile(join(projectPath, 'package.json'), JSON.stringify(options.packageJson));
  } else if (options.hasUi !== false) {
    writeFile(join(projectPath, 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0', vite: '^6.0.0' } }));
  }

  writeFile(join(projectPath, '.peaks', 'current-change'), changeId);
  writeFile(join(projectPath, '.peaks', 'project', 'overview.md'), '# Overview\n');
  writeFile(join(projectPath, '.peaks', 'project', 'product-knowledge.md'), '# Knowledge\n');
  writeFile(join(projectPath, '.peaks', 'project', 'roadmap.md'), '# Roadmap\n');
  writeFile(join(projectPath, '.peaks', 'project', 'decisions.md'), '# Decisions\n');
  writeFile(join(projectPath, 'openspec', 'README.md'), '# OpenSpec\n');
  writeFile(join(projectPath, '.claude', 'settings.json'), '{}');
  writeFile(join(projectPath, '.claude', 'session-state.json'), '{}');
  writeFile(join(projectPath, '.claude', 'hookify', 'context-monitor.local.md'), 'context-monitor');
  writeFile(join(projectPath, '.claude', 'agents', 'dispatcher.md'), 'dispatcher');
  writeFile(join(projectPath, '.claude', 'agents', 'product.md'), 'product');
  writeFile(join(projectPath, '.claude', 'agents', 'design.md'), 'design');
  writeFile(join(projectPath, '.claude', 'agents', 'qa.md'), 'qa');
  writeFile(join(projectPath, '.claude', 'agents', 'triage.md'), 'triage');
  writeFile(join(projectPath, '.claude', 'agents', 'frontend.md'), 'frontend');
  writeFile(join(projectPath, '.claude', 'agents', 'backend.md'), 'backend');
  writeFile(join(projectPath, '.claude', 'agents', 'qa-child.md'), 'qa-child');
  writeFile(join(projectPath, '.claude', 'agents', 'code-reviewer-frontend.md'), 'code-reviewer-frontend');
  writeFile(join(projectPath, '.claude', 'agents', 'code-reviewer-backend.md'), 'code-reviewer-backend');
  writeFile(join(projectPath, '.claude', 'agents', 'security-reviewer.md'), 'security-reviewer');

  writeFile(join(changeRoot, 'product', 'prd.md'), `# PRD

## Problem
Clear user problem and current pain.

## Target Users
Primary user segment and context.

## Goals
Measurable outcomes for the product.

## Non-Goals
Explicit scope exclusions.

## User Stories
- As a user, I can complete the core workflow.

## Functional Requirements
- FR-001: Core workflow requirement.

## Non-Functional Requirements
- NFR-001: Security, performance, reliability requirement.

## Acceptance Criteria
- AC-001: Reviewable acceptance criterion.

## Risks and Open Questions
- Risk: Implementation risk and mitigation.

## Review Notes
This PRD contains enough detail for reviewers to understand why the product exists, who it serves, what is included, what is excluded, how behavior will be accepted, and which risks remain before implementation. It is intentionally structured so product, design, engineering, QA, and security reviewers can each map their feedback to a concrete section instead of guessing intent from a short brainstorming summary.
`);
  writeFile(join(changeRoot, 'product', 'brainstorm.md'), `# Brainstorm Interaction Log

## Round 1: target user
- question: Who is the primary user?
- source: AskUserQuestion
- user answer: Developers managing multiple AI providers.
- decision: Target users are Claude Code power users.

## Round 2: job to be done
- question: What job should the product solve first?
- source: AskUserQuestion
- user answer: Make provider switching and routing configuration visible.
- decision: The product focuses on visual provider and routing control.

## Round 3: core workflow
- question: What is the core workflow?
- source: AskUserQuestion
- user answer: Open app, inspect current route, switch provider, save config.
- decision: The core flow centers on inspect, edit, switch, and persist.

## Round 4: MVP scope
- question: What is in the first version?
- source: AskUserQuestion
- user answer: Provider management, route editing, tray switching, status display.
- decision: MVP excludes cloud sync and community features.

## Round 5: success metric
- question: What success metric matters?
- source: AskUserQuestion
- user answer: A user can switch providers in under three seconds.
- decision: Optimize the first release for fast visible switching.
`);
  writeFile(join(changeRoot, 'product', 'prd-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: product/prd.md\nsource: AskUserQuestion\ndecision: User approved this artifact for the next phase.\n');
  writeFile(join(changeRoot, 'product', 'swagger.json'), JSON.stringify({ openapi: '3.0.0', info: { title: 'Demo API', version: '1.0.0' }, paths: { '/health': { get: { responses: { 200: { description: 'OK' } } } } } }));
  if (options.hasUi !== false) {
    writeFile(join(changeRoot, 'design', 'design-spec.md'), '# Design\n');
    if (options.withVisualArtifact !== false) {
      writeFile(join(changeRoot, 'design', 'design-preview.html'), `<!doctype html><html><head><title>Design</title></head><body>${'visual design content '.repeat(80)}</body></html>`);
    }
    writeFile(join(changeRoot, 'design', 'design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: design/design-preview.html\nsource: user confirmation\nPreview URL: http://localhost:3001/design-preview.html\nPreview Command: npx serve .peaks/changes/2026-05-13-quality-gates/design -p 3001 --no-clipboard\nScreenshot: design/design-preview.png\ndecision: User approved the previewed visual artifact for the next phase.\n');
  }
  writeFile(join(changeRoot, 'architecture', 'system-design.md'), '# System Design\n');
  writeFile(join(changeRoot, 'architecture', 'system-design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: architecture/system-design.md\nsource: AskUserQuestion\ndecision: User approved this artifact for the next phase.\n');
  writeFile(join(changeRoot, 'qa', 'test-plan.md'), '# Test Plan\n');
  writeFile(join(changeRoot, 'swarm', 'task-graph.json'), JSON.stringify({
    nodes: [
      { agentId: 'frontend', module: 'frontend-ui', files: ['src'], dependsOn: ['design'] },
      { agentId: 'backend', module: 'backend-api', files: ['server'], dependsOn: ['architecture'] },
      { agentId: 'qa-child', module: 'qa-functional', files: ['.peaks'], dependsOn: ['frontend', 'backend'] },
      { agentId: 'qa-child', module: 'unit-test', files: ['.peaks/ut'], dependsOn: ['frontend', 'backend'] },
      { agentId: 'qa-child', module: 'runtime-smoke', files: ['.peaks/changes/2026-05-13-quality-gates/qa'], dependsOn: ['frontend', 'backend'] },
      { agentId: 'code-reviewer-frontend', module: 'frontend-code-review', files: ['src'], dependsOn: ['frontend'] },
      { agentId: 'code-reviewer-backend', module: 'backend-code-review', files: ['server'], dependsOn: ['backend'] },
      { agentId: 'security-reviewer', module: 'security', files: ['src', 'server'], dependsOn: ['backend'] }
    ]
  }));
  writeFile(join(changeRoot, 'swarm', 'waves.json'), JSON.stringify({
    waves: [
      { phase: 1, parallel: ['frontend', 'backend'] },
      { phase: 2, parallel: ['code-reviewer-frontend', 'security-reviewer', 'qa-child'] }
    ]
  }));
  writeFile(join(changeRoot, 'swarm', 'reports', 'module-self-test.md'), '# Self Test\n');
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/review/code-review.md\nReviewer: code-reviewer-frontend\nScope: source changes\n\n| Severity | Finding | Status |\n| --- | --- | --- |\n| LOW | No blocking issues | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'review', 'code-review-smoke.md'), '# Code Review Smoke\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/review/code-review-smoke.md\nCommand: code-reviewer-frontend dry run\nTarget: review/code-review.md\nStatus: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security Review\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/security/security-report.md\nReviewer: security-reviewer\nScope: source changes\n\n| Severity | Risk | Status |\n| --- | --- | --- |\n| LOW | No blocking issues | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-smoke.md'), '# Security Smoke\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/security/security-smoke.md\nCommand: security-reviewer dry run\nTarget: security/security-report.md\nStatus: PASS\n');
  writeFile(join(changeRoot, 'final-report.md'), '# Final\n');

  return { projectPath, changeRoot };
}

function writeRequiredQualityReports(changeRoot) {
  for (const [agent, phase] of [
    ['product', 'Product Brainstorming and PRD'],
    ['design', 'Visual Design'],
    ['dispatcher', 'Architecture and Swarm Planning'],
    ['qa', 'QA Planning']
  ]) {
    writeFile(join(changeRoot, 'checkpoints', `${agent}-phase-handoff.md`), `# ${agent} Phase Handoff\n\nPhase: ${phase}\nProject Agent: .claude/agents/${agent}.md\nActual Invocation Evidence:\n- Agent: .claude/agents/${agent}.md\n- Evidence: phase artifact was produced by the project-local agent in this fixture.\nRequired Invocation Evidence:\n- Record actual invocation before accepting this phase.\nOutput Artifacts:\n- phase artifact\nStatus: COMPLETED\n`);
  }

  const agents = ['frontend', 'backend', 'qa-child', 'code-reviewer-frontend', 'code-reviewer-backend', 'security-reviewer'];
  for (const agent of agents) {
    writeFile(join(changeRoot, 'swarm', 'briefs', `${agent}.md`), `# ${agent} Brief\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/swarm/briefs/${agent}.md\nTask: Execute assigned scope\nFiles: owned files only\nDepends On: upstream artifacts\nHandoff: write swarm/handoffs/${agent}.md\n`);
    writeFile(join(changeRoot, 'swarm', 'handoffs', `${agent}.md`), `# ${agent} Handoff\n\nInput Version: v1\nOutput Version: v2\nFiles Changed: recorded\nNext Agent: downstream qa/review/security\n`);
  }
  writeFile(join(changeRoot, 'qa', 'functional-report.md'), '# Functional QA\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'business-report.md'), '# Business QA\n\n## PRD Acceptance Mapping\n- AC-001: Core business flow verified.\n\n## Core Business Value\n- The user can complete the core workflow.\n\nstatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'performance-report.md'), '# Performance QA\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'runtime-smoke-report.md'), '# Runtime Smoke\n\ncommand: pnpm dev\nurl: http://localhost:5173\nuser UX verification: requested\nstatus: pass\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-1.md'), '# QA Round 1\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-2.md'), '# QA Round 2\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-3.md'), '# QA Round 3\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'qa', 'acceptance-report.md'), '# Acceptance\n\nStatus: PASS\n');
  writeFile(join(changeRoot, 'swarm', 'agent-usage.md'), '# Agent Usage\n\n| Agent | Task | Report |\n| --- | --- | --- |\n| product | PRD | product/prd.md |\n| design | UI | design/design-confirmation.md |\n| frontend | Frontend implementation | swarm/reports/module-self-test.md |\n| backend | Backend API implementation | swarm/reports/module-self-test.md |\n| code-reviewer-frontend | review | review/code-review.md |\n| security-reviewer | security | security/security-report.md |\n| qa | QA dispatch | qa/test-plan.md |\n| qa-child | QA execution | qa/acceptance-report.md |\n');
}

function writeCoverage(projectPath, pct) {
  const summary = JSON.stringify({ total: { lines: { pct }, statements: { pct }, branches: { pct }, functions: { pct } } });
  writeFile(join(projectPath, 'coverage', 'coverage-summary.json'), summary);
  writeFile(join(projectPath, '.peaks', 'ut', 'coverage-summary.json'), summary);
  writeFile(join(projectPath, '.peaks', 'ut', 'unit-test-report.md'), '# Unit Test Report\n\nstatus: pass\ncoverage: 95\n');
}

test('verifier CLI runs through symlinked skill paths', () => {
  const { projectPath } = createProject();
  const symlinkRoot = mkdtempSync(join(tmpdir(), 'peaks-sdd-symlink-'));
  const symlinkPath = join(symlinkRoot, 'peaks-sdd');

  try {
    symlinkSync(join(import.meta.dirname, '..'), symlinkPath, 'dir');

    const result = spawnSync(process.execPath, [join(symlinkPath, 'scripts', 'verify-artifacts.mjs'), projectPath], {
      encoding: 'utf-8'
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /peaks-sdd 产出物门禁检查/);
    assert.match(result.stdout, /门禁检查未通过/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
    rmSync(symlinkRoot, { recursive: true, force: true });
  }
});

test('initialization baseline requires settings session hookify triage and openspec', async () => {
  const { projectPath } = createProject();

  rmSync(join(projectPath, '.claude', 'settings.json'), { force: true });
  rmSync(join(projectPath, '.claude', 'session-state.json'), { force: true });
  rmSync(join(projectPath, '.claude', 'hookify'), { recursive: true, force: true });
  rmSync(join(projectPath, '.claude', 'agents', 'triage.md'), { force: true });
  rmSync(join(projectPath, 'openspec'), { recursive: true, force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.match(result.results.find(item => item.name === '初始化基线').details, /settings\.json/);
});

test('phase handoff gate rejects ready templates once phase artifacts exist', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'product', 'brainstorm.md'), `# Brainstorm Interaction Log\n\n${Array.from({ length: 5 }, (_, index) => `## Round ${index + 1}\n- question: Q${index + 1}\n- source: AskUserQuestion\n- user answer: A${index + 1}\n- decision: D${index + 1}\n`).join('\n')}`);
  writeFile(join(changeRoot, 'checkpoints', 'product-phase-handoff.md'), '# product Phase Handoff\n\nPhase: Product Brainstorming and PRD\nProject Agent: .claude/agents/product.md\nRequired Invocation Evidence:\n- Record actual invocation before accepting this phase.\nOutput Artifacts:\n- product/brainstorm.md\nStatus: READY\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.match(result.results.find(item => item.name === '项目 Agent 阶段交接').details, /product-phase-handoff/);
});

test('quality gates block when QA reports and coverage evidence are missing', async () => {
  const { projectPath } = createProject();

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '功能测试报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '性能测试报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'QA 三轮测试' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '单元测试覆盖率' && item.pass === false));
});

test('quality gates require blocking confirmations for PRD design and technical design', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'product', 'prd-confirmation.md'), '');
  writeFile(join(changeRoot, 'design', 'design-confirmation.md'), '');
  writeFile(join(changeRoot, 'architecture', 'system-design-confirmation.md'), '');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'PRD 阻塞确认' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '设计阻塞确认' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '技术方案阻塞确认' && item.pass === false));
});

test('backend-only projects do not require UI design artifacts', async () => {
  const { projectPath, changeRoot } = createProject({ hasUi: false, packageJson: { dependencies: { express: '^4.0.0' } } });
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, true);
  assert.equal(result.results.some(item => item.name === '设计规范'), false);
  assert.equal(result.results.some(item => item.name === '可视化设计稿'), false);
});

test('visual design gate accepts design-platform exports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'design', 'design-preview.html'), '');
  writeFile(join(changeRoot, 'design', 'mockup.png'), Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(2048, 0x01)
  ]));
  writeFile(join(changeRoot, 'design', 'design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: design/mockup.png\nsource: user confirmation\nPreview URL: http://localhost:3001/mockup.png\nPreview Command: npx serve .peaks/changes/2026-05-13-quality-gates/design -p 3001 --no-clipboard\nScreenshot: design/mockup.png\ndecision: User approved the previewed design-platform export for the next phase.\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, true);
});

test('visual design gate rejects URL stubs without exported visual artifacts', async () => {
  const { projectPath, changeRoot } = createProject({ withVisualArtifact: false });
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'design', 'pixso-url.md'), 'https://example.com/design');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '可视化设计稿' && item.pass === false));
});

test('design confirmation must approve the previewed visual artifact', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'design', 'design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: design/design-spec.md\nsource: user confirmation\ndecision: User approved this artifact for the next phase.\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '设计阻塞确认' && item.pass === false));
});

test('visual design gate rejects fake image files', async () => {
  const { projectPath, changeRoot } = createProject({ withVisualArtifact: false });
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'design', 'mockup.png'), 'not really png');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '可视化设计稿' && item.pass === false));
});

test('quality gates require at least 95 percent unit test coverage', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 94.99);

  const failed = await runGateChecks(projectPath);

  assert.equal(failed.passed, false);
  assert.match(failed.results.find(item => item.name === '单元测试覆盖率').details, /94\.99%/);

  writeCoverage(projectPath, 95);
  const passed = await runGateChecks(projectPath);

  assert.equal(passed.passed, true);
});

test('quality gates require a reviewable PRD', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'product', 'prd.md'), '# PRD\n\nToo vague.\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'PRD 可评审性' && item.pass === false));
});

test('quality gates reject brainstorm summaries without AskUserQuestion interaction evidence', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'product', 'brainstorm.md'), `# Brainstorming - CCR Desktop App

## 参考项目分析总结
- Tauri 2.8 + React 18 + TypeScript
- SQLite 本地存储

## 产品脑暴 - 多角色视角
### 产品经理视角
目标用户是 Claude Code 用户和多 Provider 开发者。

## 需要确认的问题
1. 是否需要保留现有 CLI 的所有功能?
2. 配置存储继续用 config.json 还是迁移 SQLite?
`);

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '交互式脑暴记录' && item.pass === false));
});

test('coverage gate accepts archived coverage under .peaks/ut', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(projectPath, 'coverage'), { recursive: true, force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, true);
  assert.match(result.results.find(item => item.name === '单元测试覆盖率').details, /95\.00%/);
});

test('quality gates require unit test reports under .peaks/ut', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(projectPath, '.peaks', 'ut'), { recursive: true, force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '单元测试报告' && item.pass === false));
});

test('quality gates allow explicit no-api declaration instead of swagger', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'product', 'swagger.json'), { force: true });
  writeFile(join(changeRoot, 'product', 'no-api.md'), '# No API\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/product/no-api.md\nReason: This 0-1 project has no backend or HTTP API in scope.\nDecision: NO_API\n');
  rmSync(join(projectPath, '.claude', 'agents', 'backend.md'), { force: true });
  rmSync(join(projectPath, '.claude', 'agents', 'code-reviewer-backend.md'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'briefs', 'backend.md'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'briefs', 'code-reviewer-backend.md'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'handoffs', 'backend.md'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'handoffs', 'code-reviewer-backend.md'), { force: true });
  writeFile(join(changeRoot, 'swarm', 'task-graph.json'), JSON.stringify({
    nodes: [
      { agentId: 'frontend', module: 'frontend-ui', files: ['src'], dependsOn: ['design'] },
      { agentId: 'qa-child', module: 'qa-functional', files: ['.peaks'], dependsOn: ['frontend'] },
      { agentId: 'qa-child', module: 'unit-test', files: ['.peaks/ut'], dependsOn: ['frontend'] },
      { agentId: 'qa-child', module: 'runtime-smoke', files: ['.peaks/changes/2026-05-13-quality-gates/qa'], dependsOn: ['frontend'] },
      { agentId: 'code-reviewer-frontend', module: 'frontend-code-review', files: ['src'], dependsOn: ['frontend'] },
      { agentId: 'security-reviewer', module: 'security', files: ['src'], dependsOn: ['frontend'] }
    ]
  }));
  writeFile(join(changeRoot, 'swarm', 'agent-usage.md'), '# Agent Usage\n\n| Agent | Task | Report |\n| --- | --- | --- |\n| product | PRD | product/prd.md |\n| design | UI | design/design-confirmation.md |\n| frontend | Frontend implementation | swarm/reports/module-self-test.md |\n| code-reviewer-frontend | review | review/code-review.md |\n| security-reviewer | security | security/security-report.md |\n| qa | QA dispatch | qa/test-plan.md |\n| qa-child | QA execution | qa/acceptance-report.md |\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, true);
  assert.ok(result.results.find(item => item.name === 'Swagger API 规范' && item.pass === true));
});

test('quality gates require swagger and review security smoke reports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'product', 'swagger.json'), { force: true });
  rmSync(join(changeRoot, 'review', 'code-review-smoke.md'), { force: true });
  rmSync(join(changeRoot, 'security', 'security-smoke.md'), { force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'Swagger API 规范' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Code Review 冒烟报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '安全检查冒烟报告' && item.pass === false));
});

test('quality gates require labeled artifact path and canonical smoke targets', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n\nMentions .peaks/changes/2026-05-13-quality-gates/review/code-review.md without label.\nReviewer: code-reviewer-frontend\nScope: source changes\n\n| Severity | Finding | Status |\n| --- | --- | --- |\n| LOW | No blocking issues | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security Review\n\nMentions .peaks/changes/2026-05-13-quality-gates/security/security-report.md without label.\nReviewer: security-reviewer\nScope: source changes\n\n| Severity | Risk | Status |\n| --- | --- | --- |\n| LOW | No blocking issues | resolved |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'review', 'code-review-smoke.md'), '# Code Review Smoke\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/review/code-review-smoke.md\nCommand: code-reviewer dry run\nTarget: review/wrong.md\nStatus: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-smoke.md'), '# Security Smoke\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/security/security-smoke.md\nCommand: security dry run\nTarget: security/wrong.md\nStatus: PASS\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'Code Review' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '安全审查' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Code Review 冒烟报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '安全检查冒烟报告' && item.pass === false));
});

test('quality gates block unresolved critical or high review and security findings', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/review/code-review.md\nReviewer: code-reviewer-frontend\nScope: source changes\n\n| Severity | Finding | Status |\n| --- | --- | --- |\n| HIGH | Broken error handling | open |\n\nVerdict: PASS\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security Review\n\nArtifact Path: .peaks/changes/2026-05-13-quality-gates/security/security-report.md\nReviewer: security-reviewer\nScope: source changes\n\n| Severity | Risk | Status |\n| --- | --- | --- |\n| CRITICAL | Token leak | unresolved |\n\nVerdict: PASS\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.match(result.results.find(item => item.name === 'Code Review').details, /未解决/);
  assert.match(result.results.find(item => item.name === '安全审查').details, /未解决/);
});

test('quality gates require structured code review and security reports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'Code Review' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '安全审查' && item.pass === false));
});

test('quality gates require business QA report', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'qa', 'business-report.md'), { force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '业务验收报告' && item.pass === false));
});

test('quality gates require runtime smoke report for user UX verification', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'qa', 'runtime-smoke-report.md'), { force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '运行时冒烟验证' && item.pass === false));
});

test('quality gates require visible swarm graph waves briefs handoffs and execution agents', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'swarm', 'task-graph.json'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'waves.json'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'briefs', 'frontend.md'), { force: true });
  rmSync(join(changeRoot, 'swarm', 'handoffs', 'frontend.md'), { force: true });
  rmSync(join(projectPath, '.claude', 'agents', 'frontend.md'), { force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'Swarm 任务图' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Swarm 并行波次' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Swarm 任务简报' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Handoff Protocol' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '专项执行 Agents' && item.pass === false));
});

test('quality gates require visible agent usage evidence', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'swarm', 'agent-usage.md'), { force: true });

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === 'Agent 使用证据' && item.pass === false));
});

test('quality gates reject failed functional performance and QA round reports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'qa', 'functional-report.md'), '# Functional QA\n\nStatus: FAIL\n');
  writeFile(join(changeRoot, 'qa', 'performance-report.md'), '# Performance QA\n\nStatus: BLOCKED\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-2.md'), '# QA Round 2\n\nStatus: FAIL\n');
  writeFile(join(changeRoot, 'qa', 'acceptance-report.md'), '# Acceptance\n\nStatus: BLOCKED\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '功能测试报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '性能测试报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'QA 三轮测试' && item.pass === false));
});

test('quality gates reject placeholder business runtime and agent usage reports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'qa', 'business-report.md'), '# Business QA\n');
  writeFile(join(changeRoot, 'qa', 'runtime-smoke-report.md'), '# Runtime Smoke\n');
  writeFile(join(changeRoot, 'swarm', 'agent-usage.md'), '# Agent Usage\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '业务验收报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '运行时冒烟验证' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Agent 使用证据' && item.pass === false));
});

test('quality gates reject keyword-only dogfood reports', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(changeRoot, 'qa', 'business-report.md'), 'This is not a real report but mentions Acceptance, business, and PASS.');
  writeFile(join(changeRoot, 'qa', 'runtime-smoke-report.md'), 'Command: pnpm dev\nURL: http://localhost:5173\nuser UX verification: not requested\nstatus: PASS\n');
  writeFile(join(changeRoot, 'swarm', 'agent-usage.md'), 'product task product/prd.md');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '业务验收报告' && item.pass === false));
  assert.ok(result.results.find(item => item.name === '运行时冒烟验证' && item.pass === false));
  assert.ok(result.results.find(item => item.name === 'Agent 使用证据' && item.pass === false));
});

test('quality gates reject legacy review security path without canonical security report', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  rmSync(join(changeRoot, 'security', 'security-report.md'), { force: true });
  writeFile(join(changeRoot, 'review', 'security-review.md'), '# Legacy Security Review\n\nstatus: pass\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.ok(result.results.find(item => item.name === '安全审查' && item.pass === false));
});

test('open-source component libraries can pass with 60 percent unit test coverage', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify({
      name: '@example/component-library',
      version: '1.0.0',
      exports: './src/index.ts',
      peerDependencies: { react: '^18.0.0' },
      keywords: ['react', 'components', 'ui-library']
    })
  );
  writeCoverage(projectPath, 60);

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, true);
  assert.match(result.results.find(item => item.name === '单元测试覆盖率').details, /目标 60%/);
});

test('quality gates fail when any discovered workspace project lacks coverage evidence', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeCoverage(projectPath, 95);
  writeFile(join(projectPath, 'packages', 'missing-coverage', 'package.json'), JSON.stringify({ name: 'missing-coverage' }));

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.match(result.results.find(item => item.name === '单元测试覆盖率').details, /missing-coverage.*无覆盖率报告/);
});

test('quality gates reject lcov because it cannot prove all required metrics', async () => {
  const { projectPath, changeRoot } = createProject();
  writeRequiredQualityReports(changeRoot);
  writeFile(join(projectPath, 'coverage', 'lcov.info'), 'LF:10\nLH:10\n');

  const result = await runGateChecks(projectPath);

  assert.equal(result.passed, false);
  assert.match(result.results.find(item => item.name === '单元测试覆盖率').details, /coverage-summary\.json/);
});
