#!/usr/bin/env node
/**
 * Tailwind Enforce Script - TailwindCSS 样式强制检查脚本
 * 检查是否使用了内联 style 属性
 */

import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';

// 检查规则
const RULES = [
  {
    pattern: /style\s*=\s*\{\s*\{/,
    level: 'CRITICAL',
    message: '禁止使用内联 style 对象'
  },
  {
    pattern: /style\s*=\s*["'][^"']*["']/,
    level: 'CRITICAL',
    message: '禁止使用内联 style 字符串'
  }
];

// 允许使用 style 的例外模式
const ALLOWED_PATTERNS = [
  /style\s*=\s*\{\s*['"`]\$\{[^}]+\}/,  // 动态值: style={{ `height: ${var}` }}
  /style\s*=\s*\{\s*['"`]--[\w-]+/,     // CSS 变量: style={{ '--theme-color': value }}
  /style\s*=\s*\{\s*[\w]+\s*\}/,        // 变量引用: style={myStyle}
  /style\s*=\s*\{\s*getStyle\s*\(/,       // 函数调用: style={getStyle()}
];

// 跳过的文件模式
const SKIP_PATTERNS = [
  'node_modules/',
  '.min.js',
  'dist/',
  'build/',
  'generated/'
];

// 跳过的文件类型
const CHECKED_TYPES = ['.tsx', '.jsx', '.html', '.vue'];

// 检查文件是否应该跳过
function shouldSkip(filePath) {
  const ext = extname(filePath).toLowerCase();
  return !CHECKED_TYPES.includes(ext) ||
         SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

// 检查是否允许例外
function isAllowedException(line) {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(line));
}

// Tailwind CSS 常见转换对照
const TAILWIND_CONVERSIONS = [
  { style: 'padding: 12px', tailwind: 'p-3' },
  { style: 'padding: 16px', tailwind: 'p-4' },
  { style: 'margin: 16px', tailwind: 'm-4' },
  { style: 'margin: 8px', tailwind: 'm-2' },
  { style: 'font-size: 14px', tailwind: 'text-sm' },
  { style: 'font-size: 16px', tailwind: 'text-base' },
  { style: 'font-size: 18px', tailwind: 'text-lg' },
  { style: 'font-size: 24px', tailwind: 'text-xl' },
  { style: 'color: red', tailwind: 'text-red-500' },
  { style: 'color: blue', tailwind: 'text-blue-500' },
  { style: 'display: flex', tailwind: 'flex' },
  { style: 'display: block', tailwind: 'block' },
  { style: 'display: inline', tailwind: 'inline' },
  { style: 'background-color: white', tailwind: 'bg-white' },
  { style: 'background-color: #fff', tailwind: 'bg-white' },
  { style: 'width: 100%', tailwind: 'w-full' },
  { style: 'height: 100%', tailwind: 'h-full' },
  { style: 'height: 50px', tailwind: 'h-12' }
];

// 获取转换建议
function getConversionSuggestion(line) {
  for (const { style, tailwind } of TAILWIND_CONVERSIONS) {
    if (line.includes(style)) {
      return `可转换为: className="${tailwind}"`;
    }
  }
  return null;
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

    // 检查是否符合规则
    for (const { pattern, level, message } of RULES) {
      if (pattern.test(line)) {
        // 检查是否是允许的例外
        if (isAllowedException(line)) {
          continue;
        }

        const conversion = getConversionSuggestion(line);
        issues.push({
          line: lineNum,
          content: line.trim(),
          level,
          message,
          conversion
        });
      }
    }
  }

  return { errors: issues, skipped: false };
}

// 输出检查结果
function printReport(filePath, result) {
  const fileName = basename(filePath);

  if (result.skipped) {
    console.log(`ℹ️ 跳过: ${fileName} (${result.message})`);
    return;
  }

  if (result.errors.length === 0) {
    console.log(`✅ ${fileName}: 无内联样式问题`);
    return;
  }

  console.log(`\n🚨 [TailwindCheck] ${filePath}`);

  for (const error of result.errors) {
    const icon = error.level === 'CRITICAL' ? '🚨' : '⚠️';
    console.log(`   ${icon} ${error.message}`);
    console.log(`   ${error.line} | ${error.content}`);

    if (error.conversion) {
      console.log(`   ℹ️  ${error.conversion}`);
    }
  }
}

// 主函数
function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(`
✅ Tailwind Enforce Script - TailwindCSS 样式强制检查

用法:
  node tailwind-enforce.mjs <文件路径>

示例:
  node tailwind-enforce.mjs src/components/Button.tsx
    `);
    process.exit(0);
  }

  // 检查是否跳过
  if (shouldSkip(filePath)) {
    console.log(`ℹ️ 跳过: ${filePath} (不支持的格式或匹配跳过规则)`);
    process.exit(0);
  }

  // 检查文件
  const result = checkFile(filePath);
  printReport(filePath, result);

  // CRITICAL 级别错误会导致退出码 1
  const hasCritical = result.errors.some(e => e.level === 'CRITICAL');
  process.exit(hasCritical ? 1 : (result.errors.length > 0 ? 1 : 0));
}

main();

export { checkFile, shouldSkip, isAllowedException };