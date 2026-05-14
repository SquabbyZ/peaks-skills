import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPeaksPaths, readCurrentChangeId } from './change-artifacts.mjs';

export function getPlanningConfirmationPaths(projectPath) {
  const changeId = readCurrentChangeId(projectPath);
  if (!changeId) return [];

  const paths = getPeaksPaths(projectPath, changeId);
  return [
    join(paths.changeDir, 'product', 'prd-confirmation.md'),
    join(paths.changeDir, 'design', 'design-confirmation.md'),
    join(paths.changeDir, 'architecture', 'system-design-confirmation.md')
  ];
}

export function isValidPlanningConfirmation(path) {
  if (!existsSync(path)) return false;

  const content = readFileSync(path, 'utf-8');
  const hasApprovedStatus = /(^|\n)status:\s*approved\b/i.test(content);
  const hasApprover = /(^|\n)approver:\s*\S+/i.test(content);
  const hasApprovedAt = /(^|\n)approvedAt:\s*\S+/i.test(content);
  const hasArtifact = /(^|\n)artifact:\s*\S+/i.test(content);
  const hasSource = /(^|\n)source:\s*\S+/i.test(content);
  const decision = content.match(/(^|\n)decision:\s*(.+)/i)?.[2]?.trim() || '';
  return hasApprovedStatus && hasApprover && hasApprovedAt && hasArtifact && hasSource && decision.length >= 20;
}

export function hasValidPlanningConfirmations(projectPath) {
  const required = getPlanningConfirmationPaths(projectPath);
  return required.length > 0 && required.every(isValidPlanningConfirmation);
}
