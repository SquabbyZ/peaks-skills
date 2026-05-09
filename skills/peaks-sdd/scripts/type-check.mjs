#!/usr/bin/env node
/**
 * Type Check Script - TypeScript 类型检查脚本
 * 检查是否使用了 any 类型，并发出警告
 */

import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';
import { spawn } from 'child_process';

// 检查规则
const RULES = {
  'any': { level: 'HIGH', message: '禁止使用 any 类型，建议使用 unknown' },
  'as any': { level: 'HIGH', message: '禁止使用 as any 类型断言' },
  ': any': { level: 'MEDIUM', message: '建议添加明确的类型注解' }
};

// 跳过的文件模式
const SKIP_PATTERNS = [
  'node_modules/',
  '.d.ts',
  'generated/',
  'dist/',
  'build/'
];

// 检查文件是否应该跳过
function shouldSkip(filePath) {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

// 检查文件内容
function checkFile(filePath) {
  if (!existsSync(filePath)) {
    return { errors: [], skipped: true, message: '文件不存在' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检查各种 any 使用模式
    for (const [pattern, rule] of Object.entries(RULES)) {
      if (line.includes(pattern)) {
        issues.push({
          line: lineNum,
          content: line.trim(),
          pattern,
          ...rule
        });
      }
    }
  }

  return { errors: issues, skipped: false };
}

// 运行 tsc 检查
function runTsc(projectRoot = '.') {
  return new Promise((resolve) => {
    const tsconfigPath = `${projectRoot}/tsconfig.json`;

    if (!existsSync(tsconfigPath)) {
      resolve({ success: true, message: '无 tsconfig.json，跳过' });
      return;
    }

    const proc = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
      cwd: projectRoot,
      shell: true
    });

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: '通过' });
      } else {
        resolve({ success: false, message: stderr.substring(0, 500) });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });
  });
}

// 输出检查结果
function printReport(filePath, result) {
  const fileName = basename(filePath);

  if (result.skipped) {
    console.log(`ℹ️ 跳过: ${fileName} (${result.message})`);
    return;
  }

  if (result.errors.length === 0) {
    console.log(`✅ ${fileName}: 无 any 类型问题`);
    return;
  }

  console.log(`\n🚨 [TypeCheck] ${filePath}`);

  for (const error of result.errors) {
    const icon = error.level === 'HIGH' ? '⚠️' : 'ℹ️';
    console.log(`   ${icon} ${error.message}`);
    console.log(`   ${error.line} | ${error.content}`);
  }
}

// 主函数
async function main() {
  const filePath = process.argv[2];
  const command = process.argv[3];

  // 如果没有文件路径，显示帮助
  if (!filePath) {
    console.log(`
✅ Type Check Script - TypeScript 类型检查

用法:
  node type-check.mjs <文件路径>        # 检查单个文件
  node type-check.mjs <文件路径> tsc    # 运行 tsc 类型检查
  node type-check.mjs <文件路径> strict  # 严格模式 (crash on any)

示例:
  node type-check.mjs src/api/user.ts
  node type-check.mjs . tsc
    `);
    process.exit(0);
  }

  // 检查是否跳过
  if (shouldSkip(filePath)) {
    console.log(`ℹ️ 跳过: ${filePath} (匹配跳过规则)`);
    process.exit(0);
  }

  // 如果指定 tsc 命令
  if (command === 'tsc') {
    const result = await runTsc(filePath);
    if (result.success) {
      console.log(`✅ TypeScript 类型检查: ${result.message}`);
    } else {
      console.log(`❌ TypeScript 类型检查失败:`);
      console.log(result.message);
    }
    process.exit(result.success ? 0 : 1);
  }

  // 检查文件
  const result = checkFile(filePath);
  printReport(filePath, result);

  // 严格模式下，任何 any 使用都会导致退出码 1
  if (command === 'strict' && result.errors.length > 0) {
    process.exit(1);
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main();

export { checkFile, shouldSkip, runTsc };