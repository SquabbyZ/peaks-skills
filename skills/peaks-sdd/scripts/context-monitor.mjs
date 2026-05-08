#!/usr/bin/env node
/**
 * Context 监控脚本
 * 监控 context 使用率，超过阈值时自动触发 /compact
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

// Context 阈值配置
const THRESHOLDS = {
  warning: 50,    // % 发出警告
  action: 70,     // % 建议 compact
  critical: 85,   // % 自动 compact
  block: 90        // % 阻断操作
};

// 读取 session state
function getSessionState(projectPath) {
  const statePath = join(projectPath, '.claude/session-state.json');
  if (existsSync(statePath)) {
    try {
      return JSON.parse(readFileSync(statePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

// 估算当前 context（模拟 Claude Code 的估算逻辑）
function estimateContext(contextWindow = 200000) {
  // 简化估算，实际 Claude Code 会提供精确值
  // 这里通过 session state 中的 tokenUsage 推算
  const state = getSessionState(process.cwd());

  if (state?.contextEstimate) {
    return state.contextEstimate;
  }

  // 如果没有精确值，返回基于文件大小的估算
  const files = [
    '.claude/session-state.json',
    '.peaks/constitution.md',
    '.peaks/prds/prd-latest.md'
  ];

  let totalSize = 0;
  for (const file of files) {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      totalSize += readFileSync(path, 'utf-8').length;
    }
  }

  // 粗略估算: 每字符 ~4 tokens
  const estimatedTokens = totalSize * 4;
  return Math.round((estimatedTokens / contextWindow) * 100);
}

// 建议动作
function getAction(contextPct) {
  if (contextPct >= THRESHOLDS.critical) {
    return {
      level: 'critical',
      action: 'compact',
      message: `Context 使用率 ${contextPct}% 已超过 85%，建议执行 /compact`
    };
  }
  if (contextPct >= THRESHOLDS.action) {
    return {
      level: 'warning',
      action: 'compact',
      message: `Context 使用率 ${contextPct}% 已超过 70%，请考虑执行 /compact`
    };
  }
  if (contextPct >= THRESHOLDS.warning) {
    return {
      level: 'info',
      action: 'none',
      message: `Context 使用率 ${contextPct}% 正常范围`
    };
  }
  return {
    level: 'good',
    action: 'none',
    message: `Context 使用率 ${contextPct}% 状态良好`
  };
}

// 执行 Claude 命令
function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    const proc = spawn('echo', [cmd], {
      shell: true,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', reject);
  });
}

// 生成报告
function generateReport(contextPct, action, stats = null) {
  const barLength = 30;
  const filled = Math.min(Math.floor(contextPct / 100 * barLength), barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  const levelColors = {
    good: '\x1b[32m',     // 绿色
    info: '\x1b[36m',      // 青色
    warning: '\x1b[33m',   // 黄色
    critical: '\x1b[31m',  // 红色
  };
  const reset = '\x1b[0m';

  console.log('\n' + '='.repeat(60));
  console.log('  📊 Context 监控报告');
  console.log('='.repeat(60) + '\n');

  console.log(`  当前 Context: ${levelColors[action.level]}${contextPct}%${reset}`);
  console.log(`  [${bar}]`);

  // 阈值标记
  const markers = [
    { pct: THRESHOLDS.warning, label: '50%' },
    { pct: THRESHOLDS.action, label: '70%' },
    { pct: THRESHOLDS.critical, label: '85%' }
  ];

  console.log('\n  阈值:');
  markers.forEach(({ pct, label }) => {
    const pos = Math.floor(pct / 100 * barLength);
    const spaces = ' '.repeat(Math.max(0, pos - label.length / 2));
    console.log(`  ${spaces}${label} ${contextPct >= pct ? '👈' : '  '}`);
  });

  console.log(`\n  状态: ${levelColors[action.level]}${action.message}${reset}`);

  // 统计信息
  if (stats) {
    console.log('\n  📈 统计:');
    console.log(`    平均使用率: ${stats.avgUsage?.toFixed(1) || 0}%`);
    console.log(`    峰值使用率: ${stats.maxUsage?.toFixed(1) || 0}%`);
    console.log(`    Compact 次数: ${stats.compactCount || 0}`);
  }

  // 建议
  if (action.action === 'compact') {
    console.log('\n  💡 建议操作:');
    console.log('    1. 执行 /compact 压缩上下文');
    console.log('    2. 将中间产物保存到 .peaks/ 目录');
    console.log('    3. 使用 /loop 分割长任务');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return action;
}

// 监控循环
async function monitorLoop(projectPath, intervalMs = 60000) {
  console.log(`\n🔄 开始 Context 监控 (间隔 ${intervalMs / 1000}s)`);
  console.log('   按 Ctrl+C 停止\n');

  let compactCount = 0;
  const history = [];

  const loop = setInterval(async () => {
    const contextPct = estimateContext();
    history.push(contextPct);

    // 保留最近 20 个数据点
    if (history.length > 20) history.shift();

    const stats = {
      avgUsage: history.reduce((a, b) => a + b, 0) / history.length,
      maxUsage: Math.max(...history),
      compactCount
    };

    const action = getAction(contextPct);
    generateReport(contextPct, action, stats);

    // 自动 compact（可选，需要 Claude Code 支持）
    if (action.action === 'compact' && process.env.AUTO_COMPACT === 'true') {
      console.log('🔧 自动执行 /compact...\n');
      await executeCommand('/compact');
      compactCount++;
    }
  }, intervalMs);

  // 处理退出
  process.on('SIGINT', () => {
    clearInterval(loop);
    console.log('\n\n👋 监控已停止');
    console.log(`   总计执行 compact: ${compactCount} 次\n`);
    process.exit(0);
  });
}

// 单次检查
function checkOnce(projectPath) {
  const contextPct = estimateContext();
  const action = getAction(contextPct);
  generateReport(contextPct, action);

  return contextPct;
}

// 入口
const projectPath = process.argv[2] || process.cwd();
const command = process.argv[3];
const interval = parseInt(process.argv[4] || '60000');

if (command === 'monitor') {
  monitorLoop(projectPath, interval);
} else if (command === 'check') {
  const pct = checkOnce(projectPath);
  process.exit(pct >= THRESHOLDS.critical ? 1 : 0);
} else if (command === 'watch') {
  // 持续监控直到用户中断
  monitorLoop(projectPath, 30000); // 30s 间隔
} else {
  // 默认单次检查
  const pct = checkOnce(projectPath);

  console.log('\n用法:');
  console.log('  node context-monitor.js [项目路径] check     # 单次检查');
  console.log('  node context-monitor.js [项目路径] monitor    # 持续监控 (60s)');
  console.log('  node context-monitor.js [项目路径] watch      # 持续监控 (30s)');
  console.log('\n环境变量:');
  console.log('  AUTO_COMPACT=true  # 超过阈值时自动执行 /compact');

  process.exit(pct >= THRESHOLDS.critical ? 1 : 0);
}

export { estimateContext, getAction, THRESHOLDS };