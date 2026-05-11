#!/usr/bin/env node
/**
 * check-gate.mjs
 * Code Review + Security 强制检查门禁
 *
 * 在 npm/pnpm/yarn 命令前检查是否有未完成的 CR 或 Security Scan
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查是否有待处理的 CR 或 Security 问题
function checkPendingReviews() {
  const checks = [];

  // 检查是否有 pending 的 Code Review
  const crPatterns = [
    '.peaks/reports/*cr*.md',
    '.peaks/reports/*review*.md',
    '.peaks/reports/*code-review*.md'
  ];

  // 检查是否有 pending 的 Security 问题
  const securityPatterns = [
    '.peaks/reports/*security*.md',
    '.peaks/reports/*vulnerability*.md'
  ];

  try {
    const reportsDir = join(process.cwd(), '.peaks', 'reports');
    if (existsSync(reportsDir)) {
      const files = readdirSync(reportsDir);

      const pendingCR = files.some(f => {
        const lower = f.toLowerCase();
        return (lower.includes('cr') || lower.includes('review') || lower.includes('code-review')) &&
               !lower.includes('pass') && !lower.includes('pass');
      });

      const pendingSecurity = files.some(f => {
        const lower = f.toLowerCase();
        return lower.includes('security') || lower.includes('vulnerability');
      });

      return { pendingCR, pendingSecurity };
    }
  } catch (e) {
    // ignore
  }

  return { pendingCR: false, pendingSecurity: false };
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