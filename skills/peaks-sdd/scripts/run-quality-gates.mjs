#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { planSwarm } from './plan-swarm.mjs';
import { artifactPath, assertPlanningConfirmed, detectExecutionScope, writeArtifact } from './lib/execution-bridge.mjs';

export function runQualityGates({ projectPath }) {
  const paths = assertPlanningConfirmed(projectPath);
  const scope = detectExecutionScope(projectPath);
  planSwarm({ projectPath });

  const required = getRequiredEvidence(projectPath, paths, scope);
  const missing = required.filter(item => !existsSync(item.path));
  if (missing.length > 0) {
    writeQualityBlockedReport(projectPath, paths, missing);
    throw new Error(`Missing quality evidence: ${missing.map(item => item.label).join(', ')}`);
  }

  const unresolved = [
    ...findUnresolvedBlockingFindings(required),
    ...findFailedStatusEvidence(required),
    ...findInsufficientCoverage(required)
  ];
  if (unresolved.length > 0) {
    writeQualityBlockedReport(projectPath, paths, unresolved);
    throw new Error(`Unresolved blocking findings: ${unresolved.map(item => item.label).join(', ')}`);
  }

  writeAgentUsage(projectPath, paths, scope);
  return { ready: true, changeId: paths.changeId, evidence: required.map(item => artifactPath(projectPath, item.path)) };
}

function getRequiredEvidence(projectPath, paths, scope) {
  return [
    ...(scope.hasUi ? [{ label: 'frontend self-test', path: join(paths.changeDir, 'swarm', 'reports', 'frontend-summary.md') }] : []),
    ...(scope.hasApi ? [{ label: 'backend self-test', path: join(paths.changeDir, 'swarm', 'reports', 'backend-summary.md') }] : []),
    ...(scope.hasDatabase ? [{ label: 'database self-test', path: join(paths.changeDir, 'swarm', 'reports', 'postgres-summary.md') }] : []),
    { label: 'qa self-test', path: join(paths.changeDir, 'swarm', 'reports', 'qa-summary.md') },
    { label: 'code review', path: join(paths.changeDir, 'review', 'code-review.md'), scanBlocking: true },
    { label: 'code review smoke', path: join(paths.changeDir, 'review', 'code-review-smoke.md') },
    { label: 'security review', path: join(paths.changeDir, 'security', 'security-report.md'), scanBlocking: true },
    { label: 'security smoke', path: join(paths.changeDir, 'security', 'security-smoke.md') },
    { label: 'unit test report', path: join(projectPath, '.peaks', 'ut', 'unit-test-report.md'), requirePass: true },
    { label: 'coverage summary', path: join(projectPath, '.peaks', 'ut', 'coverage-summary.json'), coverageThreshold: 95 },
    { label: 'qa round 1', path: join(paths.changeDir, 'qa', 'qa-round-1.md'), requirePass: true },
    { label: 'qa round 2', path: join(paths.changeDir, 'qa', 'qa-round-2.md'), requirePass: true },
    { label: 'qa round 3', path: join(paths.changeDir, 'qa', 'qa-round-3.md'), requirePass: true },
    { label: 'functional QA', path: join(paths.changeDir, 'qa', 'functional-report.md'), requirePass: true },
    { label: 'business QA', path: join(paths.changeDir, 'qa', 'business-report.md'), requirePass: true },
    { label: 'performance QA', path: join(paths.changeDir, 'qa', 'performance-report.md'), requirePass: true },
    { label: 'acceptance report', path: join(paths.changeDir, 'qa', 'acceptance-report.md'), requirePass: true }
  ];
}

function findUnresolvedBlockingFindings(required) {
  return required.filter(item => {
    if (!item.scanBlocking) return false;
    const content = readFileSync(item.path, 'utf-8');
    const rows = content.split('\n').filter(line => /^\s*\|/.test(line) && /\b(CRITICAL|HIGH)\b/i.test(line));
    return rows.some(row => !/\b(resolved|fixed|closed|pass|已修复|已解决|通过)\b/i.test(row));
  });
}

function findFailedStatusEvidence(required) {
  return required.filter(item => {
    if (!item.requirePass) return false;
    const content = readFileSync(item.path, 'utf-8');
    if (/(^|\n)\s*(status|verdict|结论|状态)\s*[:：-]\s*(FAIL|FAILED|BLOCKED|ERROR|未通过|失败|阻塞)\b/i.test(content)) return true;
    return !/(^|\n)\s*(status|verdict|结论|状态)\s*[:：-]\s*PASS\b/i.test(content);
  });
}

function findInsufficientCoverage(required) {
  return required.filter(item => {
    if (!item.coverageThreshold) return false;
    try {
      const summary = JSON.parse(readFileSync(item.path, 'utf-8'));
      return ['lines', 'statements', 'branches', 'functions'].some(metric => Number(summary.total?.[metric]?.pct ?? 0) < item.coverageThreshold);
    } catch {
      return true;
    }
  });
}

function writeQualityBlockedReport(projectPath, paths, items) {
  const reportPath = join(paths.changeDir, 'review', 'quality-gates-blocked.md');
  writeArtifact(reportPath, `# Quality Gates Blocked\n\nArtifact Path: ${artifactPath(projectPath, reportPath)}\nStatus: BLOCKED\n\n## Missing or Blocking Evidence\n\n${items.map(item => `- ${item.label}: ${artifactPath(projectPath, item.path)}`).join('\n')}\n\nFix Loop: dispatch repair wave and rerun this script.\n`);
}

function writeAgentUsage(projectPath, paths, scope) {
  const reportPath = join(paths.changeDir, 'swarm', 'agent-usage.md');
  const rows = [
    ['product', 'PRD confirmation', 'product/prd.md'],
    ...(scope.hasUi ? [['design', 'Visual design confirmation', 'design/design-confirmation.md'], ['frontend', 'Frontend implementation', 'swarm/reports/frontend-summary.md']] : []),
    ...(scope.hasApi ? [['backend', 'Backend/API implementation', 'swarm/reports/backend-summary.md']] : []),
    ...(scope.hasDatabase ? [['postgres', 'Database schema', 'swarm/reports/postgres-summary.md']] : []),
    ...(scope.hasUi ? [['code-reviewer-frontend', 'Frontend code review', 'review/code-review.md']] : []),
    ...(scope.hasApi ? [['code-reviewer-backend', 'Backend code review', 'review/code-review.md']] : []),
    ['security-reviewer', 'Security review', 'security/security-report.md'],
    ['qa', 'QA dispatch', 'qa/test-plan.md'],
    ['qa-child', 'QA execution', 'qa/acceptance-report.md']
  ];
  writeArtifact(reportPath, `# Agent Usage\n\nArtifact Path: ${artifactPath(projectPath, reportPath)}\n\n| Agent | Task | Report |\n| --- | --- | --- |\n${rows.map(row => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join('\n')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const result = runQualityGates({ projectPath });
  console.log(`Quality gates ready for ${result.changeId}`);
}
