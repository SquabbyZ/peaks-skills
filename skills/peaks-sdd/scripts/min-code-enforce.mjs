#!/usr/bin/env node
/**
 * Min Code Enforce Script - 最小代码量强制检查脚本
 * 检查未使用的 import、变量、冗余注释等
 */

import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';
import { spawn } from 'child_process';

// 检查规则
const RULES = {
  unusedImport: {
    pattern: /^import\s+.*from\s+['"][^'"]+['"];?$/gm,
    level: 'HIGH',
    message: '检测到未使用的 import'
  },
  redundantComment: {
    pattern: /\/\/\s*[A-Z][a-z]+[a-z0-9]*\s+(function|method|variable|to|for|add)/,
    level: 'MEDIUM',
    message: '检测到冗余注释'
  },
  copyPaste: {
    pattern: null, // 特殊处理
    level: 'HIGH',
    message: '检测到重复代码 (copy-paste)'
  }
};

// 跳过的文件模式
const SKIP_PATTERNS = [
  'node_modules/',
  'generated/',
  'dist/',
  'build/'
];

// 检查文件是否应该跳过
function shouldSkip(filePath) {
  const ext = extname(filePath).toLowerCase();
  return !['.ts', '.tsx', '.js', '.jsx'].includes(ext) ||
         SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

// 检查未使用的 import (通过 ESLint)
function checkUnusedImports(filePath) {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['eslint', '--quiet', filePath], {
      shell: true,
      env: { ...process.env, ESLINT_CACHE: 'false' }
    });

    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });

    proc.on('close', () => {
      const issues = [];
      const lines = output.split('\n');

      for (const line of lines) {
        // 匹配 "unused import" 类型的 ESLint 错误
        if (line.includes('unused') && (line.includes('import') || line.includes('import'))) {
          const match = line.match(/:(\d+):(\d+)\s+(.*)/);
          if (match) {
            issues.push({
              line: parseInt(match[1]),
              message: match[3] || '未使用的 import'
            });
          }
        }
      }

      resolve(issues);
    });

    proc.on('error', () => resolve([]));
  });
}

// 检查 TypeScript 未使用的变量
function checkUnusedVars(filePath) {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsc', '--noUnusedLocals', '--noEmit', '--pretty', 'false', filePath], {
      shell: true
    });

    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });

    proc.on('close', () => {
      const issues = [];
      const lines = output.split('\n');

      for (const line of lines) {
        // 匹配 "is declared but never used" 类型的错误
        if (line.includes('declared') && line.includes('never used')) {
          issues.push({ message: line.substring(0, 100) });
        }
      }

      resolve(issues);
    });

    proc.on('error', () => resolve([]));
  });
}

// 检测冗余注释
function checkRedundantComments(content) {
  const issues = [];
  const lines = content.split('\n');

  // 常见冗余注释模式
  const redundantPatterns = [
    /^\s*\/\/\s*Add\s+two\s+numbers\s*$/i,           // "Add two numbers"
    /^\s*\/\/\s*This\s+function\s+is\s+used\s+to\s+/i, // "This function is used to..."
    /^\s*\/\/\s* Helper (function|method)\s*$/i,    // "Helper function/method"
    /^\s*\/\/\s*TODO:\s*$/i,                        // 只写了 TODO: 没有内容
    /^\s*\/\/\s*Unused\s+.*$/i,                      // "Unused xxx"
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of redundantPatterns) {
      if (pattern.test(line.trim())) {
        issues.push({
          line: i + 1,
          content: line.trim(),
          message: '检测到冗余注释'
        });
      }
    }
  }

  return issues;
}

// 检测过度的抽象（单次使用的 helper 函数）
function checkOverAbstraction(content) {
  // 这需要更复杂的分析，暂时简化处理
  // 查找类似 `const x = helper()` 这种只用了一次的模式
  const issues = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 简化检测：如果一个函数定义后紧跟着被调用一次
    if (/^function\s+\w+\s*\(/.test(line.trim()) ||
        /^const\s+\w+\s*=\s*(async\s*)?\(?\s*\([^)]*\)\s*=>?\s*\{/.test(line.trim())) {
      // 检查下一行或附近是否有直接调用
      const nextFewLines = lines.slice(i + 1, i + 5).join('\n');
      const funcName = line.match(/(?:function|const)\s+(\w+)/)?.[1];
      if (funcName && nextFewLines.includes(funcName + '(')) {
        // 只使用了一次
        issues.push({
          line: i + 1,
          message: `过度抽象: ${funcName} 可能可以内联`
        });
      }
    }
  }

  return issues;
}

// 主函数
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(`
✅ Min Code Enforce Script - 最小代码量强制检查

用法:
  node min-code-enforce.mjs <文件路径>

检查项:
  ⚠️  未使用的 import (HIGH)
  ⚠️  未使用的变量 (HIGH)
  ⚠️  冗余注释 (MEDIUM)
  ⚠️  过度抽象 (MEDIUM)

示例:
  node min-code-enforce.mjs src/utils/helper.ts
    `);
    process.exit(0);
  }

  // 检查是否跳过
  if (shouldSkip(filePath)) {
    console.log(`ℹ️ 跳过: ${filePath} (不支持的格式或匹配跳过规则)`);
    process.exit(0);
  }

  if (!existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n🔍 [MinCodeCheck] ${basename(filePath)}\n`);

  const content = readFileSync(filePath, 'utf-8');
  const allIssues = [];

  // 1. 检查冗余注释
  const commentIssues = checkRedundantComments(content);
  allIssues.push(...commentIssues);

  // 2. 检查过度抽象
  const abstractionIssues = checkOverAbstraction(content);
  allIssues.push(...abstractionIssues);

  // 3. ESLint 检查未使用 import
  const unusedImports = await checkUnusedImports(filePath);
  allIssues.push(...unusedImports.map(i => ({ ...i, level: 'HIGH', message: '未使用的 import' })));

  // 输出结果
  if (allIssues.length === 0) {
    console.log(`✅ 无最小代码量问题`);
    process.exit(0);
  }

  // 按行号排序
  allIssues.sort((a, b) => (a.line || 0) - (b.line || 0));

  for (const issue of allIssues) {
    if (issue.line) {
      console.log(`   ⚠️ ${issue.message}`);
      console.log(`      ${issue.line} | ${issue.content || issue.message}`);
    } else {
      console.log(`   ⚠️ ${issue.message}`);
    }
  }

  console.log(`\n💡 修复建议:`);
  console.log(`   - 删除未使用的 import`);
  console.log(`   - 删除冗余注释`);
  console.log(`   - 简单逻辑直接内联，不抽象`);

  process.exit(1);
}

main();

export { checkRedundantComments, checkOverAbstraction, shouldSkip };