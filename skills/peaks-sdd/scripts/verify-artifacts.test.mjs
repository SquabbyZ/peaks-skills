import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
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
  writeFile(join(projectPath, '.claude', 'agents', 'dispatcher.md'), 'dispatcher');
  writeFile(join(projectPath, '.claude', 'agents', 'product.md'), 'product');
  writeFile(join(projectPath, '.claude', 'agents', 'qa.md'), 'qa');

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
  if (options.hasUi !== false) {
    writeFile(join(changeRoot, 'design', 'design-spec.md'), '# Design\n');
    if (options.withVisualArtifact !== false) {
      writeFile(join(changeRoot, 'design', 'design-preview.html'), `<!doctype html><html><head><title>Design</title></head><body>${'visual design content '.repeat(80)}</body></html>`);
    }
    writeFile(join(changeRoot, 'design', 'design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: design/design-spec.md\nsource: AskUserQuestion\ndecision: User approved this artifact for the next phase.\n');
  }
  writeFile(join(changeRoot, 'architecture', 'system-design.md'), '# System Design\n');
  writeFile(join(changeRoot, 'architecture', 'system-design-confirmation.md'), 'status: approved\napprover: user\napprovedAt: 2026-05-13T00:00:00Z\nartifact: architecture/system-design.md\nsource: AskUserQuestion\ndecision: User approved this artifact for the next phase.\n');
  writeFile(join(changeRoot, 'qa', 'test-plan.md'), '# Test Plan\n');
  writeFile(join(changeRoot, 'swarm', 'reports', 'module-self-test.md'), '# Self Test\n');
  writeFile(join(changeRoot, 'review', 'code-review.md'), '# Code Review\n');
  writeFile(join(changeRoot, 'security', 'security-report.md'), '# Security\n');
  writeFile(join(changeRoot, 'final-report.md'), '# Final\n');

  return { projectPath, changeRoot };
}

function writeRequiredQualityReports(changeRoot) {
  writeFile(join(changeRoot, 'qa', 'functional-report.md'), '# Functional QA\n');
  writeFile(join(changeRoot, 'qa', 'performance-report.md'), '# Performance QA\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-1.md'), '# QA Round 1\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-2.md'), '# QA Round 2\n');
  writeFile(join(changeRoot, 'qa', 'qa-round-3.md'), '# QA Round 3\n');
  writeFile(join(changeRoot, 'qa', 'acceptance-report.md'), '# Acceptance\n');
}

function writeCoverage(projectPath, pct) {
  const summary = JSON.stringify({ total: { lines: { pct }, statements: { pct }, branches: { pct }, functions: { pct } } });
  writeFile(join(projectPath, 'coverage', 'coverage-summary.json'), summary);
  writeFile(join(projectPath, '.peaks', 'ut', 'coverage-summary.json'), summary);
  writeFile(join(projectPath, '.peaks', 'ut', 'unit-test-report.md'), '# Unit Test Report\n\nstatus: pass\ncoverage: 95\n');
}

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
