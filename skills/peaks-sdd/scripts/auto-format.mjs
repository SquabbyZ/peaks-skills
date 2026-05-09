#!/usr/bin/env node
/**
 * Auto Format Hook Script - 自动格式化脚本
 * 在每次 Edit/Write 后自动格式化代码文件
 */

import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { extname } from 'path';

// 支持的文件类型和对应的格式化工具
const FORMATTERS = {
  '.ts': { cmd: 'prettier', args: ['--write'], parser: 'typescript' },
  '.tsx': { cmd: 'prettier', args: ['--write'], parser: 'typescript' },
  '.js': { cmd: 'prettier', args: ['--write'], parser: 'babel' },
  '.jsx': { cmd: 'prettier', args: ['--write'], parser: 'babel' },
  '.css': { cmd: 'prettier', args: ['--write'], parser: 'css' },
  '.scss': { cmd: 'prettier', args: ['--write'], parser: 'scss' },
  '.less': { cmd: 'prettier', args: ['--write'], parser: 'less' },
  '.json': { cmd: 'prettier', args: ['--write'] },
  '.md': { cmd: 'prettier', args: ['--write'], parser: 'markdown' },
  '.html': { cmd: 'prettier', args: ['--write'], parser: 'html' },
  '.vue': { cmd: 'prettier', args: ['--write'], parser: 'vue' },
  '.yaml': { cmd: 'prettier', args: ['--write'], parser: 'yaml' },
  '.yml': { cmd: 'prettier', args: ['--write'], parser: 'yaml' }
};

// 跳过的文件模式
const SKIP_PATTERNS = [
  'node_modules/',
  '.min.',
  'dist/',
  'build/',
  '.d.ts'
];

// 检查文件是否应该跳过
function shouldSkip(filePath) {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

// 获取文件对应的格式化工具
function getFormatter(filePath) {
  const ext = extname(filePath).toLowerCase();
  return FORMATTERS[ext] || null;
}

// 检查 prettier 是否可用
function checkPrettier() {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['prettier', '--version'], { shell: true });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

// 执行格式化
function runFormat(filePath) {
  return new Promise((resolve) => {
    const ext = extname(filePath).toLowerCase();
    const formatter = getFormatter(filePath);

    if (!formatter) {
      resolve({ success: true, skipped: true, message: '不支持的格式' });
      return;
    }

    const args = [...formatter.args, filePath];
    const proc = spawn('npx', ['prettier', ...args], { shell: true });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, skipped: false });
      } else {
        resolve({ success: false, skipped: false, error: stderr.substring(0, 200) });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, skipped: false, error: err.message });
    });
  });
}

// 主函数
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(`
✅ Auto Format Script - 自动格式化脚本

用法:
  node auto-format.mjs <文件路径>

示例:
  node auto-format.mjs src/components/Button.tsx
    `);
    process.exit(0);
  }

  // 检查是否跳过
  if (shouldSkip(filePath)) {
    console.log(`⚠️ 跳过: ${filePath} (匹配跳过规则)`);
    process.exit(0);
  }

  // 检查格式化器是否可用
  const hasPrettier = await checkPrettier();
  if (!hasPrettier) {
    console.log(`⚠️ 跳过: ${filePath} (prettier 未安装)`);
    process.exit(0);
  }

  // 执行格式化
  const result = await runFormat(filePath);

  if (result.skipped) {
    console.log(`ℹ️ 跳过: ${filePath} (${result.message})`);
    process.exit(0);
  }

  if (result.success) {
    console.log(`✅ 已格式化: ${filePath}`);
    process.exit(0);
  } else {
    console.log(`❌ 格式化失败: ${filePath}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
    process.exit(1);
  }
}

main();

export { runFormat, shouldSkip, getFormatter };