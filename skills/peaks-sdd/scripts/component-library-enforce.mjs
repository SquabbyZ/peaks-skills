#!/usr/bin/env node
/**
 * Component Library Enforce Script - 组件库强制检查脚本
 * 检查是否使用了禁止的原生方法，强制使用组件库
 */

import { existsSync, readFileSync } from 'fs';
import { extname, basename, join } from 'path';

// 禁止的原生方法
const FORBIDDEN_PATTERNS = [
  { pattern: 'window.alert', level: 'CRITICAL', message: '禁止使用 window.alert()' },
  { pattern: 'window.confirm', level: 'CRITICAL', message: '禁止使用 window.confirm()' },
  { pattern: 'window.prompt', level: 'CRITICAL', message: '禁止使用 window.prompt()' },
  { pattern: 'window.open', level: 'HIGH', message: '禁止使用 window.open()' },
  { pattern: 'window.showModalDialog', level: 'CRITICAL', message: '禁止使用 window.showModalDialog()' },
  { pattern: 'window.showModelessDialog', level: 'CRITICAL', message: '禁止使用 window.showModelessDialog()' }
];

// 检测自定义实现模式的正则
const CUSTOM_IMPLEMENTATION_PATTERNS = [
  { pattern: /class\s+Modal/, level: 'HIGH', message: '检测到自定义 Modal 实现' },
  { pattern: /class\s+Dialog/, level: 'HIGH', message: '检测到自定义 Dialog 实现' },
  { pattern: /class\s+Dropdown/, level: 'MEDIUM', message: '检测到自定义 Dropdown 实现' },
  { pattern: /class\s+DatePicker/, level: 'MEDIUM', message: '检测到自定义 DatePicker 实现' },
  { pattern: /class\s+Table/, level: 'MEDIUM', message: '检测到自定义 Table 实现' },
  { pattern: /const\s+Modal\s*=/, level: 'HIGH', message: '检测到自定义 Modal 实现' },
  { pattern: /const\s+CustomModal/, level: 'HIGH', message: '检测到自定义 CustomModal 实现' }
];

// 跳过的文件模式
const SKIP_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  'generated/'
];

// 检查文件是否应该跳过
function shouldSkip(filePath) {
  const ext = extname(filePath).toLowerCase();
  return !['.ts', '.tsx', '.js', '.jsx'].includes(ext) ||
         SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

// 获取项目依赖的组件库
function getProjectUILibraries(projectRoot = '.') {
  const pkgPath = join(projectRoot, 'package.json');
  const libs = [];

  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.antd) libs.push({ name: 'Ant Design', package: 'antd' });
    if (deps['@mui/material']) libs.push({ name: 'MUI', package: '@mui/material' });
    if (deps['@chakra-ui/react']) libs.push({ name: 'Chakra UI', package: '@chakra-ui/react' });
    if (deps.radix-ui) libs.push({ name: 'Radix UI', package: 'radix-ui' });
  }

  return libs;
}

// 替代方案映射
const ALTERNATIVES = {
  'Ant Design': {
    'window.alert': "import { message } from 'antd'; message.success('内容')",
    'window.confirm': "import { Modal } from 'antd'; Modal.confirm({ title: '确认？', onOk: () => {} })",
    'window.prompt': "import { Modal } from 'antd'; Modal.confirm({ title: '输入', content: <Input /> })",
    'window.open': "window.location.href 或 history.push()"
  },
  'MUI': {
    'window.alert': "import { Alert } from '@mui/material'; <Alert severity=\"success\">内容</Alert>",
    'window.confirm': "import { Dialog } from '@mui/material'; <Dialog open={true} onClose={...}>确认？</Dialog>",
    'window.prompt': "使用 Dialog + TextField"
  }
};

// 检查文件内容
function checkFile(filePath) {
  if (!existsSync(filePath)) {
    return { errors: [], skipped: true, message: '文件不存在' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // 检查禁止的原生方法
  for (const { pattern, level, message } of FORBIDDEN_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        issues.push({
          line: i + 1,
          content: lines[i].trim(),
          pattern,
          level,
          message
        });
      }
    }
  }

  // 检查自定义实现
  for (const { pattern, level, message } of CUSTOM_IMPLEMENTATION_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        issues.push({
          line: i + 1,
          content: lines[i].trim(),
          pattern: pattern.toString(),
          level,
          message
        });
      }
    }
  }

  return { errors: issues, skipped: false };
}

// 输出检查结果
function printReport(filePath, result, uiLibraries) {
  const fileName = basename(filePath);

  if (result.skipped) {
    console.log(`ℹ️ 跳过: ${fileName} (${result.message})`);
    return;
  }

  if (result.errors.length === 0) {
    console.log(`✅ ${fileName}: 无组件库问题`);
    return;
  }

  console.log(`\n🚨 [ComponentLibCheck] ${filePath}`);

  for (const error of result.errors) {
    const icon = error.level === 'CRITICAL' ? '🚨' : '⚠️';
    console.log(`   ${icon} ${error.message}`);
    console.log(`   ${error.line} | ${error.content}`);

    // 提供替代建议
    if (uiLibraries.length > 0 && error.pattern in ALTERNATIVES['Ant Design']) {
      const lib = uiLibraries.find(l => l.name === 'Ant Design');
      if (lib) {
        console.log(`\n   ℹ️  检测到项目已安装: ${lib.name}`);
        console.log(`   ✅ 正确写法:`);
        console.log(`   ${ALTERNATIVES['Ant Design'][error.pattern]}`);
      }
    }
  }
}

// 主函数
function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(`
✅ Component Library Enforce Script - 组件库强制检查

用法:
  node component-library-enforce.mjs <文件路径> [项目路径]

示例:
  node component-library-enforce.mjs src/components/UserForm.tsx
  node component-library-enforce.mjs src/components/UserForm.tsx ../my-project
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

  // 获取项目 UI 库
  const projectRoot = process.argv[3] || '.';
  const uiLibraries = getProjectUILibraries(projectRoot);

  printReport(filePath, result, uiLibraries);

  // CRITICAL 级别错误会导致退出码 1
  const hasCritical = result.errors.some(e => e.level === 'CRITICAL');
  process.exit(hasCritical ? 1 : (result.errors.length > 0 ? 1 : 0));
}

main();

export { checkFile, shouldSkip, FORBIDDEN_PATTERNS };