#!/usr/bin/env node
/**
 * File Size Check Script - 文件大小检查脚本
 * 检查文件行数是否超过限制
 */

import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';

// 阈值配置
const THRESHOLDS = {
  softWarn: 400,   // 超过此行数发出警告
  hardLimit: 800   // 超过此行数必须拆分
};

// 支持的文件类型
const CHECKED_TYPES = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less', '.go', '.java', '.py'];

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
  if (SKIP_PATTERNS.some(pattern => filePath.includes(pattern))) {
    return true;
  }
  const ext = extname(filePath).toLowerCase();
  return !CHECKED_TYPES.includes(ext);
}

// 统计文件行数
function countLines(filePath) {
  if (!existsSync(filePath)) {
    return -1;
  }
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

// 获取拆分建议
function getSplitSuggestions(filePath, totalLines) {
  const fileName = basename(filePath, extname(filePath));
  const ext = extname(filePath);

  const suggestions = [];

  if (ext === '.tsx' || ext === '.jsx') {
    suggestions.push(`${fileName}.tsx → 拆分为:`);
    suggestions.push(`  - ${fileName}.tsx (主组件, ~100行)`);
    suggestions.push(`  - ${fileName}Header.tsx (~80行)`);
    suggestions.push(`  - ${fileName}Body.tsx (~150行)`);
    suggestions.push(`  - ${fileName}Footer.tsx (~80行)`);
    suggestions.push(`  - ${fileName}.utils.ts (~50行)`);
    suggestions.push(`  - ${fileName}.types.ts (类型定义)`);
  } else if (ext === '.ts' || ext === '.js') {
    suggestions.push(`${fileName}${ext} → 拆分为:`);
    suggestions.push(`  - ${fileName}/index.ts (导出入口)`);
    suggestions.push(`  - ${fileName}/core.ts (核心逻辑)`);
    suggestions.push(`  - ${fileName}/utils.ts (工具函数)`);
    suggestions.push(`  - ${fileName}/types.ts (类型定义)`);
  } else {
    suggestions.push(`建议按职责拆分为多个小文件`);
  }

  return suggestions;
}

// 主函数
function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(`
✅ File Size Check Script - 文件大小检查

用法:
  node file-size-check.mjs <文件路径>

阈值:
  > ${THRESHOLDS.softWarn} 行: 警告，建议拆分
  > ${THRESHOLDS.hardLimit} 行: 阻断，必须拆分

示例:
  node file-size-check.mjs src/components/BigComponent.tsx
    `);
    process.exit(0);
  }

  // 检查是否跳过
  if (shouldSkip(filePath)) {
    console.log(`ℹ️ 跳过: ${filePath} (不支持的格式或匹配跳过规则)`);
    process.exit(0);
  }

  // 统计行数
  const lineCount = countLines(filePath);

  if (lineCount === -1) {
    console.log(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  const fileName = basename(filePath);

  // 检查阈值
  if (lineCount > THRESHOLDS.hardLimit) {
    console.log(`\n🚨 [FileSizeCheck] ${fileName}:${lineCount}`);
    console.log(`   🚨 文件超过 ${THRESHOLDS.hardLimit} 行 (实际: ${lineCount} 行)`);
    console.log(`   ⚠️  必须拆分，禁止超过 ${THRESHOLDS.hardLimit} 行`);
    console.log(`\n   📋 拆分建议:`);
    getSplitSuggestions(filePath, lineCount).forEach(line => console.log(`   ${line}`));
    console.log('');
    process.exit(1);
  }

  if (lineCount > THRESHOLDS.softWarn) {
    console.log(`\n⚠️ [FileSizeCheck] ${fileName}:${lineCount}`);
    console.log(`   ⚠️  文件超过 ${THRESHOLDS.softWarn} 行 (实际: ${lineCount} 行)`);
    console.log(`   ℹ️  建议拆分`);
    console.log(`\n   📋 拆分建议:`);
    getSplitSuggestions(filePath, lineCount).forEach(line => console.log(`   ${line}`));
    console.log('');
    process.exit(1);
  }

  console.log(`✅ ${fileName}: ${lineCount} 行 (正常)`);
  process.exit(0);
}

main();

export { countLines, shouldSkip, getSplitSuggestions };