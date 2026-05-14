import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { detectTechStack } from './tech-stack-detector.mjs';
import { getPeaksPaths, readCurrentChangeId } from './change-artifacts.mjs';
import { isValidPlanningConfirmation } from './planning-confirmations.mjs';

export function getSkillDir() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    dir = join(dir, '..');
    if (existsSync(join(dir, 'SKILL.md')) && existsSync(join(dir, 'templates', 'agents'))) {
      return dir;
    }
  }
  throw new Error('Cannot locate peaks-sdd skill directory');
}

export function getActiveChange(projectPath) {
  const changeId = readCurrentChangeId(projectPath);
  if (!changeId) throw new Error('Missing .peaks/current-change');
  return getPeaksPaths(projectPath, changeId);
}

export function assertPlanningConfirmed(projectPath) {
  const paths = getActiveChange(projectPath);
  const scope = detectExecutionScopeFromPaths(projectPath, paths);
  const required = [
    join(paths.changeDir, 'product', 'prd-confirmation.md'),
    ...(scope.hasUi ? [join(paths.changeDir, 'design', 'design-confirmation.md')] : []),
    join(paths.changeDir, 'architecture', 'system-design-confirmation.md')
  ];
  const missing = required.filter(path => !existsSync(path));
  if (missing.length > 0) {
    throw new Error(`Planning confirmations missing: ${missing.map(path => path.replace(projectPath, '')).join(', ')}`);
  }

  for (const path of required) {
    assertValidConfirmation(path);
  }
  return paths;
}

export function detectExecutionScope(projectPath) {
  const paths = getActiveChange(projectPath);
  return detectExecutionScopeFromPaths(projectPath, paths);
}

function detectExecutionScopeFromPaths(projectPath, paths) {
  const techStack = detectTechStack(projectPath);
  const noApiPath = join(paths.changeDir, 'product', 'no-api.md');
  const swaggerPath = join(paths.changeDir, 'product', 'swagger.json');
  const systemDesignPath = join(paths.changeDir, 'architecture', 'system-design.md');
  const systemDesign = existsSync(systemDesignPath) ? readFileSync(systemDesignPath, 'utf-8').toLowerCase() : '';

  const hasUi = Boolean(techStack.frontend || techStack.frontendFramework || techStack.buildTool || existsSync(join(paths.changeDir, 'design', 'design-confirmation.md')));
  const hasApi = !existsSync(noApiPath) && (existsSync(swaggerPath) || Boolean(techStack.backend) || /backend|api|server|express|nestjs|fastify|auth|login|register/.test(systemDesign));
  const hasDatabase = Boolean(techStack.database) || /database|postgres|sqlite|mysql|prisma|drizzle|typeorm|schema/.test(systemDesign);
  const hasAuth = /auth|login|register|session|jwt|用户|登录|注册/.test(systemDesign)
    || (existsSync(swaggerPath) && /auth|login|register/i.test(readFileSync(swaggerPath, 'utf-8')));

  return {
    ...techStack,
    projectPath,
    hasUi,
    hasApi,
    hasDatabase,
    hasAuth,
    frontend: techStack.frontend || (hasUi ? 'react' : null),
    backend: techStack.backend || (hasApi ? 'express' : null),
    database: techStack.database || (hasDatabase ? 'postgresql' : null),
    hasConfirmedPlanningArtifacts: true,
    isZeroToOneProject: true
  };
}

function assertValidConfirmation(path) {
  if (!isValidPlanningConfirmation(path)) {
    throw new Error(`Invalid planning confirmation: ${path}`);
  }
}

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function writeArtifact(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf-8');
}

export function artifactPath(projectPath, absolutePath) {
  const root = resolve(projectPath);
  const target = resolve(absolutePath);
  const rel = relative(root, target);
  if (rel.startsWith('..') || rel === '..' || rel.startsWith('/')) {
    throw new Error(`Artifact path escapes project root: ${absolutePath}`);
  }
  return rel;
}

export function getExecutionAgents(scope) {
  return [
    ...(scope.hasUi ? ['frontend', 'frontend-child'] : []),
    ...(scope.hasApi ? ['backend', 'backend-child'] : []),
    ...(scope.hasDatabase ? ['postgres'] : []),
    'qa-child',
    ...(scope.hasUi ? ['code-reviewer-frontend'] : []),
    ...(scope.hasApi ? ['code-reviewer-backend'] : []),
    'security-reviewer'
  ];
}

export function getBriefAgents(scope) {
  return [
    ...(scope.hasUi ? ['frontend'] : []),
    ...(scope.hasApi ? ['backend'] : []),
    ...(scope.hasDatabase ? ['postgres'] : []),
    'qa-child',
    ...(scope.hasUi ? ['code-reviewer-frontend'] : []),
    ...(scope.hasApi ? ['code-reviewer-backend'] : []),
    'security-reviewer'
  ];
}
