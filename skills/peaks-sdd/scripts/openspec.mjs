#!/usr/bin/env node
/**
 * OpenSpec 命令执行脚本
 * 用于自动执行 OpenSpec 相关命令
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 默认项目路径
const DEFAULT_PROJECT = '.';

// OpenSpec 命令映射
const COMMANDS = {
  status: '查看项目状态',
  list: '列出所有可用命令',
  init: '初始化项目配置',
  checkpoint: '创建检查点',
  save: '保存当前进度',
  restore: '恢复检查点',
  report: '生成进度报告'
};

// 读取项目状态
function getProjectState(projectPath) {
  const statePath = join(projectPath, '.claude/session-state.json');
  if (existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  }
  return null;
}

// 读取 constitution
function getConstitution(projectPath) {
  const path = join(projectPath, '.peaks/constitution.md');
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  return null;
}

// 读取 PRD
function getPRD(projectPath) {
  const prdDir = join(projectPath, '.peaks/prds');
  if (existsSync(prdDir)) {
    const files = readdirSync(prdDir).filter(f => f.endsWith('.md'));
    if (files.length > 0) {
      const latest = files.sort().pop();
      return readFileSync(join(prdDir, latest), 'utf-8');
    }
  }
  return null;
}

// 获取 OpenSpec 状态
function status(projectPath) {
  const state = getProjectState(projectPath);
  const constitution = getConstitution(projectPath);
  const prd = getPRD(projectPath);

  console.log('\n📊 OpenSpec 状态报告\n');

  // 项目基本信息
  console.log('项目路径:', projectPath);
  console.log('配置文件:', existsSync(join(projectPath, '.claude/settings.json')) ? '✅ 存在' : '❌ 缺失');

  // Constitution 状态
  console.log('\n📋 Constitution:');
  if (constitution) {
    const lines = constitution.split('\n').length;
    console.log(`  ✅ 已创建 (${lines} 行)`);
  } else {
    console.log('  ❌ 未创建');
  }

  // PRD 状态
  console.log('\n📄 PRD:');
  if (prd) {
    console.log('  ✅ 已创建');
  } else {
    console.log('  ❌ 未创建');
  }

  // Session 状态
  console.log('\n🔄 Session 状态:');
  if (state) {
    console.log('  Context:', state.contextEstimate ? `${state.contextEstimate}%` : '未知');
    console.log('  已完成阶段:', state.phasesCompleted?.join(', ') || '无');
  } else {
    console.log('  ❌ 无 session 记录');
  }

  // 检查 OpenSpec 配置文件
  const openspecConfig = join(projectPath, '.openspec.json');
  console.log('\n⚙️  OpenSpec 配置:', existsSync(openspecConfig) ? '✅ 存在' : '❌ 缺失');

  console.log('');
}

// 列出可用命令
function list() {
  console.log('\n📋 OpenSpec 可用命令:\n');
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  /openspec ${cmd.padEnd(12)} - ${desc}`);
  }
  console.log('\n使用示例:');
  console.log('  /openspec status --project .peaks');
  console.log('  /openspec checkpoint --name "功能完成"');
  console.log('');
}

// 初始化项目配置
function init(projectPath) {
  const configPath = join(projectPath, '.openspec.json');
  const defaultConfig = {
    version: '1.0.0',
    projectPath: projectPath,
    lastUpdated: new Date().toISOString()
  };

  if (existsSync(configPath)) {
    console.log('⚠️  OpenSpec 配置已存在');
  } else {
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ 已创建 OpenSpec 配置文件');
  }
}

// 创建检查点
function checkpoint(projectPath, name) {
  const checkpointDir = join(projectPath, '.peaks/checkpoints');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointFile = join(checkpointDir, `checkpoint-${timestamp}.json`);

  const state = getProjectState(projectPath);
  const constitution = getConstitution(projectPath);

  const checkpointData = {
    timestamp,
    name: name || `检查点 ${timestamp}`,
    state,
    constitution: constitution ? constitution.substring(0, 500) : null, // 只保存前500字符
    contextEstimate: state?.contextEstimate || 0
  };

  // 确保目录存在
  if (!existsSync(checkpointDir)) {
    require('fs').mkdirSync(checkpointDir, { recursive: true });
  }

  writeFileSync(checkpointFile, JSON.stringify(checkpointData, null, 2));
  console.log(`✅ 检查点已创建: ${checkpointFile}`);
}

// 保存进度
function save(projectPath) {
  const state = getProjectState(projectPath);
  if (!state) {
    console.log('❌ 无 session 状态可保存');
    return;
  }

  const savePath = join(projectPath, '.peaks/saves/save-latest.json');
  const savesDir = join(projectPath, '.peaks/saves');

  if (!existsSync(savesDir)) {
    require('fs').mkdirSync(savesDir, { recursive: true });
  }

  writeFileSync(savePath, JSON.stringify(state, null, 2));
  console.log('✅ 进度已保存');
}

// 恢复进度
function restore(projectPath) {
  const savePath = join(projectPath, '.peaks/saves/save-latest.json');
  if (!existsSync(savePath)) {
    console.log('❌ 未找到保存的进度');
    return;
  }

  const saveData = JSON.parse(readFileSync(savePath, 'utf-8'));
  const statePath = join(projectPath, '.claude/session-state.json');

  writeFileSync(statePath, JSON.stringify(saveData, null, 2));
  console.log('✅ 进度已恢复');
}

// 生成报告
function report(projectPath) {
  const state = getProjectState(projectPath);
  const constitution = getConstitution(projectPath);
  const prd = getPRD(projectPath);

  const reportPath = join(projectPath, '.peaks/reports/openspec-report.json');
  const reportDir = join(projectPath, '.peaks/reports');

  if (!existsSync(reportDir)) {
    require('fs').mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    projectPath,
    constitution: !!constitution,
    prd: !!prd,
    contextEstimate: state?.contextEstimate || 0,
    phasesCompleted: state?.phasesCompleted || []
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ 报告已生成: ${reportPath}`);
}

// 主入口
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const projectPath = args.includes('--project')
    ? args[args.indexOf('--project') + 1]
    : DEFAULT_PROJECT;

  // 处理帮助
  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`
🔧 OpenSpec 命令执行器

用法:
  openspec.mjs <command> [options]

命令:
  status      查看项目状态
  list        列出所有可用命令
  init        初始化项目配置
  checkpoint  创建检查点
  save        保存当前进度
  restore     恢复检查点
  report      生成进度报告

选项:
  --project <path>  指定项目路径 (默认: .)

示例:
  node openspec.mjs status
  node openspec.mjs status --project .peaks
  node openspec.mjs checkpoint --name "功能完成"
`);
    return;
  }

  // 执行命令
  switch (command) {
    case 'status':
      status(projectPath);
      break;
    case 'list':
      list();
      break;
    case 'init':
      init(projectPath);
      break;
    case 'checkpoint':
      const checkpointName = args.includes('--name')
        ? args[args.indexOf('--name') + 1]
        : null;
      checkpoint(projectPath, checkpointName);
      break;
    case 'save':
      save(projectPath);
      break;
    case 'restore':
      restore(projectPath);
      break;
    case 'report':
      report(projectPath);
      break;
    default:
      console.log(`❌ 未知命令: ${command}`);
      list();
      process.exit(1);
  }
}

main();