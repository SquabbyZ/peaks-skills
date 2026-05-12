#!/usr/bin/env node
/**
 * check-gate.mjs
 * Code Review + Security 强制检查门禁
 *
 * 在 npm/pnpm/yarn 命令前检查是否有未完成的 CR 或 Security Scan
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查是否有待处理的 CR 或 Security 问题
function checkPendingReviews() {
  try {
    const projectRoot = resolveProjectRoot(process.argv[3] || process.cwd());
    const currentChangePath = readCurrentChangePath(projectRoot);
    if (!currentChangePath) return { pendingCR: true, pendingSecurity: true };

    const reviewDir = join(projectRoot, '.peaks', currentChangePath, 'review');
    if (!existsSync(reviewDir)) return { pendingCR: true, pendingSecurity: true };

    const files = readdirSync(reviewDir, { withFileTypes: true });
    const pendingCR = hasPendingReview(files, reviewDir, 'code-review.md');
    const pendingSecurity = hasPendingReview(files, reviewDir, 'security-review.md');

    return { pendingCR, pendingSecurity };
  } catch {
    return { pendingCR: true, pendingSecurity: true };
  }
}

function hasPendingReview(entries, reviewDir, expectedFileName) {
  const entry = entries.find(item => item.name === expectedFileName);
  if (!entry) return true;

  return !entry.isFile() || !isPassingReview(join(reviewDir, expectedFileName));
}

function isPassingReview(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return /^Verdict:\s*(APPROVE|PASS|通过)\s*$/im.test(content);
}

function resolveProjectRoot(startPath) {
  let current = resolve(startPath);

  while (true) {
    if (existsSync(join(current, '.peaks', 'current-change'))) return current;

    const parent = dirname(current);
    if (parent === current) return resolve(startPath);
    current = parent;
  }
}

function readCurrentChangePath(projectPath) {
  const currentChangeFile = join(projectPath, '.peaks', 'current-change');
  if (!existsSync(currentChangeFile)) return null;

  const content = readFileSync(currentChangeFile, 'utf-8').trim().replace(/\\/g, '/');
  if (!content || content.includes('..') || !content.startsWith('changes/')) return null;
  return content;
}

function printGateStatus(command) {
  console.log('\n\x1b[1m\x1b[36m🚦 peaks-sdd 质量门禁\x1b[0m');
  console.log(`   命令: ${command}`);

  const { pendingCR, pendingSecurity } = checkPendingReviews();

  if (pendingCR) {
    console.log('\n   \x1b[33m⚠️  存在待处理的 Code Review\x1b[0m');
    console.log('   建议: 先完成 CR 再继续开发');
  }

  if (pendingSecurity) {
    console.log('\n   \x1b[31m🚨 存在待处理的安全问题\x1b[0m');
    console.log('   必须: 先修复安全问题再继续');
  }

  if (!pendingCR && !pendingSecurity) {
    console.log('\n   \x1b[32m✅ 质量门禁通过\x1b[0m');
  }

  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  if (command === 'check') {
    // 检查模式
    const pending = checkPendingReviews();

    if (pending.pendingSecurity) {
      console.log('\n\x1b[1m\x1b[31m🚨 安全问题未解决，阻断部署\x1b[0m\n');
      process.exit(1);
    }

    if (pending.pendingCR) {
      console.log('\n\x1b[1m\x1b[33m⚠️  存在待处理的 Code Review\x1b[0m\n');
      // CR 不阻断，只警告
      process.exit(0);
    }

    console.log('\n   \x1b[32m✅ 质量门禁通过\x1b[0m');
    process.exit(0);

  } else if (command === 'status') {
    // 状态输出
    const pending = checkPendingReviews();
    printGateStatus('npm/pnpm/yarn');

  } else {
    // 帮助
    console.log(`
\x1b[1mCheck Gate\x1b[0m - Code Review + Security 强制检查

用法:
  node check-gate.mjs check      检查门禁状态
  node check-gate.mjs status     输出详细状态

退出码:
  0 - 门禁通过
  1 - 安全问题未解决（阻断）
`);
  }

  process.exit(0);
}

main().catch(console.error);