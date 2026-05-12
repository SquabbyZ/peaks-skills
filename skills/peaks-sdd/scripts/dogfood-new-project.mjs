#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const skillDir = join(__dirname, '..');
const initScript = join(__dirname, 'init.mjs');
const verifyScript = join(__dirname, 'verify-artifacts.mjs');
const projectPath = mkdtempSync(join(tmpdir(), 'peaks-sdd-dogfood-'));
const changeIdPattern = /^changes\/\d{4}-\d{2}-\d{2}-initial-product$/;

const checks = [];

function pass(name, details = '') {
  checks.push({ name, status: 'PASS', details });
}

function fail(name, details = '') {
  checks.push({ name, status: 'FAIL', details });
}

function checkPath(relativePath, type = 'file') {
  const fullPath = join(projectPath, relativePath);
  const ok = existsSync(fullPath);
  if (ok) pass(`${type}: ${relativePath}`);
  else fail(`${type}: ${relativePath}`, 'missing');
  return ok;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || skillDir,
    encoding: 'utf-8',
    stdio: options.stdio || 'pipe'
  });
}

function writeArtifact(relativePath, content) {
  const fullPath = join(projectPath, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
}

console.log(`Dogfood project: ${projectPath}`);

const initResult = run('node', [initScript, projectPath, '--frontend=react', '--ui=shadcn', '--database=postgresql', '--change=initial-product']);
if (initResult.status === 0) pass('init script exits 0');
else fail('init script exits 0', initResult.stderr || initResult.stdout);

checkPath('.peaks/current-change');
checkPath('.peaks/project/overview.md');
checkPath('.peaks/project/product-knowledge.md');
checkPath('.peaks/project/roadmap.md');
checkPath('.peaks/project/decisions.md');

let currentChange = '';
try {
  currentChange = readFileSync(join(projectPath, '.peaks/current-change'), 'utf-8').trim();
  if (changeIdPattern.test(currentChange)) pass('current-change uses change-scoped initial-product path', currentChange);
  else fail('current-change uses change-scoped initial-product path', currentChange);
} catch (error) {
  fail('read current-change', error.message);
}

const changeRoot = `.peaks/${currentChange}`;
const requiredDirs = [
  'product',
  'design/screenshots',
  'architecture',
  'openspec',
  'swarm/briefs',
  'swarm/reports',
  'dispatch',
  'qa/screenshots',
  'review',
  'checkpoints'
];
for (const dir of requiredDirs) checkPath(`${changeRoot}/${dir}`, 'dir');
checkPath(`${changeRoot}/enhancements.md`);

checkPath('.claude/agents/dispatcher.md');
checkPath('.claude/agents/product.md');
checkPath('.claude/agents/design.md');
checkPath('.claude/agents/qa.md');
checkPath('.claude/agents/qa-child.md');
checkPath('.gitnexus', 'dir');

try {
  const settings = JSON.parse(readFileSync(join(projectPath, '.claude/settings.json'), 'utf-8'));
  const mcpNames = Object.keys(settings.mcpServers || {}).sort();
  const expected = ['claude-mem', 'context7', 'frontend-design', 'gitnexus', 'typescript-lsp'];
  const hasExpected = expected.every(name => mcpNames.includes(name));
  const hasDeferred = ['fs', 'code-review', 'superpowers', 'claude-md-management'].some(name => mcpNames.includes(name));
  if (hasExpected && !hasDeferred) pass('MCP settings use fine-grained defaults', mcpNames.join(','));
  else fail('MCP settings use fine-grained defaults', mcpNames.join(','));
  if (settings.peaksSdd?.mcpPolicy?.mode === 'fine-grained-stage-injection') pass('MCP policy metadata written');
  else fail('MCP policy metadata written');
} catch (error) {
  fail('parse MCP settings', error.message);
}

if (currentChange) {
  writeArtifact(`${changeRoot}/product/prd.md`, '# PRD\n');
  writeArtifact(`${changeRoot}/design/design-spec.md`, '# Design Spec\n');
  writeArtifact(`${changeRoot}/architecture/system-design.md`, '# System Design\n');
  writeArtifact(`${changeRoot}/qa/test-plan.md`, '# Test Plan\n');
  writeArtifact(`${changeRoot}/swarm/reports/self-test.md`, '# Self Test\n');
  writeArtifact(`${changeRoot}/review/code-review.md`, '# Code Review\n');
  writeArtifact(`${changeRoot}/review/security-review.md`, '# Security Review\n');
  writeArtifact(`${changeRoot}/final-report.md`, '# Final Report\n');

  const verifyResult = run('node', [verifyScript, projectPath]);
  if (verifyResult.status === 0) pass('verify-artifacts accepts current change artifacts');
  else fail('verify-artifacts accepts current change artifacts', verifyResult.stderr || verifyResult.stdout);
}

const nestedProjectPath = mkdtempSync(join(tmpdir(), 'peaks-sdd-nested-'));
try {
  const nestedChangeId = 'changes/2026-05-12-ccr-desktop';
  const nestedChangeRoot = `.peaks/${nestedChangeId}`;
  mkdirSync(join(nestedProjectPath, 'ccr-desktop'), { recursive: true });
  mkdirSync(join(nestedProjectPath, '.peaks'), { recursive: true });
  writeFileSync(join(nestedProjectPath, '.peaks', 'current-change'), `${nestedChangeId}\n`, 'utf-8');
  const nestedFiles = [
    '.peaks/project/overview.md',
    '.peaks/project/product-knowledge.md',
    '.peaks/project/roadmap.md',
    '.peaks/project/decisions.md',
    '.claude/agents/dispatcher.md',
    '.claude/agents/product.md',
    '.claude/agents/qa.md',
    `${nestedChangeRoot}/product/prd.md`,
    `${nestedChangeRoot}/design/design-spec.md`,
    `${nestedChangeRoot}/architecture/system-design.md`,
    `${nestedChangeRoot}/qa/test-plan.md`,
    `${nestedChangeRoot}/swarm/reports/self-test.md`,
    `${nestedChangeRoot}/review/code-review.md`,
    `${nestedChangeRoot}/review/security-review.md`,
    `${nestedChangeRoot}/final-report.md`,
    'ccr-desktop/package.json',
    'ccr-desktop/tsconfig.json',
    'ccr-desktop/node_modules/typescript/package.json',
    'ccr-desktop/node_modules/typescript/bin/tsc'
  ];

  for (const file of nestedFiles) {
    const fullPath = join(nestedProjectPath, file);
    mkdirSync(dirname(fullPath), { recursive: true });
    const content = file.endsWith('ccr-desktop/package.json') || file.endsWith('ccr-desktop\\package.json')
      ? '{"scripts":{"build":"tsc --noEmit"},"devDependencies":{"typescript":"~5.8.3"}}\n'
      : file.endsWith('typescript/package.json') || file.endsWith('typescript\\package.json')
        ? '{"bin":{"tsc":"./bin/tsc"}}\n'
        : file.endsWith('tsconfig.json')
          ? '{"compilerOptions":{"noEmit":true},"files":[]}\n'
          : file.endsWith('/tsc') || file.endsWith('\\tsc')
            ? 'process.exit(0);\n'
            : '# Fixture\n';
    writeFileSync(fullPath, content, 'utf-8');
  }

  const nestedVerifyResult = run('node', [verifyScript, nestedProjectPath]);
  const blocksWithoutOptIn = nestedVerifyResult.status !== 0;
  if (blocksWithoutOptIn) pass('verify-artifacts blocks nested app compile without local-tool opt-in');
  else fail('verify-artifacts blocks nested app compile without local-tool opt-in', nestedVerifyResult.stderr || nestedVerifyResult.stdout);

  const nestedCompileResult = run('node', [verifyScript, nestedProjectPath, '--allow-local-tools']);
  if (nestedCompileResult.status === 0) pass('verify-artifacts can compile nested app with explicit local-tool opt-in');
  else fail('verify-artifacts can compile nested app with explicit local-tool opt-in', nestedCompileResult.stderr || nestedCompileResult.stdout);
} finally {
  if (process.env.PEAKS_DOGFOOD_KEEP !== '1') {
    rmSync(nestedProjectPath, { recursive: true, force: true });
  } else {
    console.log(`\nKept nested dogfood project: ${nestedProjectPath}`);
  }
}

const failed = checks.filter(check => check.status === 'FAIL');
console.log('\nDogfood checks:');
for (const check of checks) {
  const marker = check.status === 'PASS' ? '✓' : '✗';
  console.log(`${marker} ${check.name}${check.details ? ` — ${check.details}` : ''}`);
}

if (process.env.PEAKS_DOGFOOD_KEEP !== '1') {
  rmSync(projectPath, { recursive: true, force: true });
} else {
  console.log(`\nKept dogfood project: ${projectPath}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} dogfood check(s) failed.`);
  process.exit(1);
}

console.log('\nAll dogfood checks passed.');
