#!/usr/bin/env node
/**
 * Gate Check Script - 代码审查和安全检查门禁
 * 在测试/部署前检查是否完成 CR 和安全扫描
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 检查项目根目录
const PROJECT_ROOT = process.argv[2] || '.';

// 通过标志文件路径
const GATE_STATUS_FILE = join(PROJECT_ROOT, '.peaks/gate-status.json');

// 检查项定义
const CHECKS = {
  codeReview: {
    name: 'Code Review',
    file: '.peaks/reviews/cr-approved.json',
    required: true,
    description: '必须至少 1 人 approve'
  },
  securityScan: {
    name: 'Security Scan',
    file: '.peaks/security/scan-result.json',
    required: true,
    description: '必须无 CRITICAL/HIGH 漏洞'
  },
  typeCheck: {
    name: '类型检查',
    command: 'tsc --noEmit --pretty false',
    required: false,
    description: 'tsc --noEmit 通过'
  },
  eslint: {
    name: 'ESLint',
    command: 'eslint --quiet',
    required: false,
    description: '无 error 级别问题'
  }
};

// 读取 Gate 状态
function getGateStatus() {
  if (existsSync(GATE_STATUS_FILE)) {
    return JSON.parse(readFileSync(GATE_STATUS_FILE, 'utf-8'));
  }
  return null;
}

// 更新 Gate 状态
function updateGateStatus(checks) {
  const status = {
    timestamp: new Date().toISOString(),
    checks: {},
    allPassed: true
  };

  for (const [key, check] of Object.entries(checks)) {
    status.checks[key] = {
      name: check.name,
      passed: check.passed || false,
      message: check.message || ''
    };
    if (!check.passed && CHECKS[key].required) {
      status.allPassed = false;
    }
  }

  // 确保目录存在
  const dir = join(PROJECT_ROOT, '.peaks');
  if (!existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }

  require('fs').writeFileSync(GATE_STATUS_FILE, JSON.stringify(status, null, 2));
  return status;
}

// 检查 Code Review 状态
function checkCodeReview() {
  const filePath = join(PROJECT_ROOT, CHECKS.codeReview.file);
  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (data.approved && data.approvedCount >= 1) {
      return { passed: true, message: `Approved by ${data.approvedBy?.join(', ')}` };
    }
  }
  return { passed: false, message: '请等待至少 1 人 approve' };
}

// 检查 Security Scan 状态
function checkSecurityScan() {
  const filePath = join(PROJECT_ROOT, CHECKS.securityScan.file);
  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (data.vulnerabilities) {
      const critical = data.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
      const high = data.vulnerabilities.filter(v => v.severity === 'HIGH').length;
      if (critical === 0 && high === 0) {
        return { passed: true, message: '0 vulnerabilities' };
      }
      return { passed: false, message: `发现 ${critical} CRITICAL, ${high} HIGH 漏洞` };
    }
  }
  // 如果没有扫描结果，认为未通过
  return { passed: false, message: '请先运行安全扫描' };
}

// 执行命令检查
function runCommand(cmd) {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
      resolve({ passed: true, message: '通过' });
    } catch (error) {
      resolve({ passed: false, message: error.message?.substring(0, 100) });
    }
  });
}

// 执行所有检查
async function runAllChecks() {
  console.log('\n🔍 Gate Check - 代码审查和安全检查\n');
  console.log('='.repeat(50));

  const results = {};

  // 1. Code Review 检查
  console.log('\n📋 Code Review 状态:');
  const crResult = checkCodeReview();
  results.codeReview = crResult;
  console.log(`  ${crResult.passed ? '✅' : '❌'} ${crResult.message}`);

  // 2. Security Scan 检查
  console.log('\n🔒 Security Scan 状态:');
  const secResult = checkSecurityScan();
  results.securityScan = secResult;
  console.log(`  ${secResult.passed ? '✅' : '❌'} ${secResult.message}`);

  // 3. 类型检查 (可选)
  console.log('\n📝 类型检查:');
  if (existsSync(join(PROJECT_ROOT, 'tsconfig.json'))) {
    const typeResult = await runCommand('cd ' + PROJECT_ROOT + ' && npx tsc --noEmit --pretty false 2>&1 | head -20');
    results.typeCheck = typeResult;
    console.log(`  ${typeResult.passed ? '✅' : '❌'} ${typeResult.message}`);
  } else {
    console.log('  ℹ️  未配置 TypeScript，跳过');
    results.typeCheck = { passed: true, message: 'N/A' };
  }

  // 4. ESLint 检查 (可选)
  console.log('\n🧹 ESLint 状态:');
  if (existsSync(join(PROJECT_ROOT, '.eslintrc.json')) ||
      existsSync(join(PROJECT_ROOT, '.eslintrc.js'))) {
    const lintResult = await runCommand('cd ' + PROJECT_ROOT + ' && npx eslint --quiet src/ 2>&1 | head -20');
    results.eslint = lintResult;
    console.log(`  ${lintResult.passed ? '✅' : '❌'} ${lintResult.message}`);
  } else {
    console.log('  ℹ️  未配置 ESLint，跳过');
    results.eslint = { passed: true, message: 'N/A' };
  }

  // 输出总结
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 检查结果汇总:\n');

  let allPassed = true;
  for (const [key, result] of Object.entries(results)) {
    const check = CHECKS[key];
    const status = result.passed ? '✅' : (check.required ? '❌' : '⚠️');
    console.log(`  ${status} ${check.name}: ${result.message}`);
    if (!result.passed && check.required) {
      allPassed = false;
    }
  }

  // 保存状态
  const gateStatus = updateGateStatus(results);

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('\n✅ 所有必检项已通过 Gate Check\n');
    process.exit(0);
  } else {
    console.log('\n❌ Gate Check 未通过\n');
    console.log('💡 如何完成检查:');
    console.log('  1. Code Review: 发起 PR，等待至少 1 人 approve');
    console.log('  2. Security Scan: 运行 npm run security:scan');
    console.log('  3. 修复所有漏洞后重试\n');
    process.exit(1);
  }
}

// 快速检查（不运行命令，只检查文件）
function quickCheck() {
  console.log('\n🔍 Gate Check (快速模式)\n');

  const crResult = checkCodeReview();
  const secResult = checkSecurityScan();

  const allPassed = crResult.passed && secResult.passed;

  console.log('  ' + (crResult.passed ? '✅' : '❌') + ' Code Review: ' + crResult.message);
  console.log('  ' + (secResult.passed ? '✅' : '❌') + ' Security Scan: ' + secResult.message);
  console.log('');

  return allPassed;
}

// 入口
const command = process.argv[3];

if (command === 'check') {
  const passed = quickCheck();
  process.exit(passed ? 0 : 1);
} else if (command === 'full') {
  runAllChecks();
} else {
  console.log(`
🔍 Gate Check - 代码审查和安全检查门禁

用法:
  node check-gate.mjs [项目路径] check     # 快速检查（只检查文件）
  node check-gate.mjs [项目路径] full      # 完整检查（运行命令）

示例:
  node check-gate.mjs . check
  node check-gate.mjs . full

必检项:
  - Code Review: 必须至少 1 人 approve
  - Security Scan: 必须无 CRITICAL/HIGH 漏洞

可选检查:
  - 类型检查: tsc --noEmit
  - ESLint: 无 error 级别问题
`);
  process.exit(1);
}

export { checkCodeReview, checkSecurityScan, runAllChecks, quickCheck };