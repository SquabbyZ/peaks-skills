#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { runQualityGates } from './run-quality-gates.mjs';
import { artifactPath, assertPlanningConfirmed, writeArtifact } from './lib/execution-bridge.mjs';

export function runDeliverySmoke({ projectPath }) {
  const paths = assertPlanningConfirmed(projectPath);
  runQualityGates({ projectPath });

  const smokePath = join(paths.changeDir, 'qa', 'runtime-smoke-report.md');
  if (!existsSync(smokePath)) {
    writeDeliveryBlockedReport(projectPath, paths, smokePath);
    throw new Error(`Missing runtime smoke evidence: ${artifactPath(projectPath, smokePath)}`);
  }

  const smoke = readFileSync(smokePath, 'utf-8');
  if (!/(^|\n)\s*(status|decision|结论|状态)\s*[:：-]\s*PASS\b/i.test(smoke)
    || !/(^|\n)\s*(command|命令)\s*[:：-]\s*\S+/i.test(smoke)
    || !/(^|\n)\s*(url|target|endpoint|路径|窗口)\s*[:：-]\s*\S+/i.test(smoke)
    || !/(user\s*UX\s*verification|UX\s*verification|用户.*体验|用户.*验证)\s*[:：-]\s*(requested|confirmed|done|yes|已请求|已确认|已完成)/i.test(smoke)) {
    writeDeliveryBlockedReport(projectPath, paths, smokePath);
    throw new Error(`Invalid runtime smoke evidence: ${artifactPath(projectPath, smokePath)}`);
  }

  const finalPath = join(paths.changeDir, 'final-report.md');
  writeArtifact(finalPath, `# Final Report\n\nArtifact Path: ${artifactPath(projectPath, finalPath)}\nStatus: PASS\n\n## Evidence Chain\n\n- PRD: product/prd.md\n- PRD Confirmation: product/prd-confirmation.md\n- Design Spec: design/design-spec.md\n- Design Confirmation: design/design-confirmation.md\n- Architecture: architecture/system-design.md\n- Architecture Confirmation: architecture/system-design-confirmation.md\n- Task Graph: swarm/task-graph.json\n- Waves: swarm/waves.json\n- Briefs: swarm/briefs/\n- Handoffs: swarm/handoffs/\n- Agent Usage: swarm/agent-usage.md\n- Code Review: review/code-review.md\n- Security Review: security/security-report.md\n- Unit Test Report: ../../ut/unit-test-report.md\n- Functional QA: qa/functional-report.md\n- Business QA: qa/business-report.md\n- Performance QA: qa/performance-report.md\n- Runtime Smoke: qa/runtime-smoke-report.md\n- Acceptance: qa/acceptance-report.md\n- Screenshots: qa/screenshots/ or design/screenshots/ when available\n\n## Delivery\n\nRuntime smoke evidence was supplied before final report generation, and user UX verification was requested or confirmed.\n`);

  return { ready: true, changeId: paths.changeId, smokePath, finalPath };
}

function writeDeliveryBlockedReport(projectPath, paths, smokePath) {
  const blockedPath = join(paths.changeDir, 'qa', 'delivery-smoke-blocked.md');
  writeArtifact(blockedPath, `# Delivery Smoke Blocked\n\nArtifact Path: ${artifactPath(projectPath, blockedPath)}\nStatus: BLOCKED\nMissing or invalid runtime smoke: ${artifactPath(projectPath, smokePath)}\nRequired: command, URL/target, user UX verification, and PASS status from a real smoke run.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const result = runDeliverySmoke({ projectPath });
  console.log(`Delivery smoke ready for ${result.changeId}`);
}
