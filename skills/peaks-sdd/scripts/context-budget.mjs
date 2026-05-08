#!/usr/bin/env node
/**
 * Token/Context 消耗追踪脚本
 * 用于 peaks-sdd 工作流中追踪每次操作的 token 消耗
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 默认阈值
const THRESHOLDS = {
  warning: 50,    // % 警告
  critical: 70,   // % 强制 compact
  block: 85       // % 阻断操作
};

// 读取 session-state.json
function getSessionState(projectPath) {
  const statePath = join(projectPath, '.claude/session-state.json');
  if (existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  }
  return { contextEstimate: 0, tokenUsage: {} };
}

// 更新消耗统计
function updateTokenStats(projectPath, stats) {
  const statsPath = join(projectPath, '.peaks/stats/token-stats.json');
  let existingStats = { sessions: [], totalTokens: 0 };

  if (existsSync(statsPath)) {
    existingStats = JSON.parse(readFileSync(statsPath, 'utf-8'));
  }

  existingStats.sessions.push({
    timestamp: new Date().toISOString(),
    ...stats
  });

  // 保留最近 50 次 session
  if (existingStats.sessions.length > 50) {
    existingStats.sessions = existingStats.sessions.slice(-50);
  }

  writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));
  return existingStats;
}

// 计算预估消耗
function estimateContextTokens(contextLines) {
  // 粗略估算: 每行约 4 tokens
  return contextLines * 4;
}

// 输出消耗报告
function printUsageReport(projectPath) {
  const state = getSessionState(projectPath);
  const statsPath = join(projectPath, '.peaks/stats/token-stats.json');

  console.log('\n📊 Token/Context 消耗报告\n');

  // 当前 session 状态
  const contextPct = state.contextEstimate || 0;
  const barLength = 30;
  const filled = Math.floor(contextPct / 100 * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  console.log(`  当前 Context: ${contextPct}%`);
  console.log(`  [${bar}]`);

  if (contextPct >= THRESHOLDS.block) {
    console.log('  ⚠️  警告: Context 已超过 85%，建议执行 /compact');
  } else if (contextPct >= THRESHOLDS.critical) {
    console.log('  ⚠️  注意: Context 已超过 70%，请考虑清理');
  }

  // 累计统计
  if (existsSync(statsPath)) {
    const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    const recentSessions = stats.sessions.slice(-10);

    console.log('\n  最近 10 次 Session 消耗:');
    recentSessions.forEach((s, i) => {
      const inputTokens = s.inputTokens || 0;
      const outputTokens = s.outputTokens || 0;
      const total = inputTokens + outputTokens;
      console.log(`    ${i + 1}. Input: ${(inputTokens / 1000).toFixed(1)}k | Output: ${(outputTokens / 1000).toFixed(1)}k | Total: ${(total / 1000).toFixed(1)}k`);
    });

    console.log(`\n  总计: ${(stats.totalTokens / 1000000).toFixed(2)}M tokens`);
  }

  console.log('\n  💡 优化建议:');
  console.log('    - 定期执行 /compact 清理冗余上下文');
  console.log('    - 产出文件到 .peaks/ 而非依赖 context');
  console.log('    - 长任务使用 /loop 分割');

  console.log('');
  return contextPct;
}

// 更新 session state
function updateSessionState(projectPath, updates) {
  const statePath = join(projectPath, '.claude/session-state.json');
  let state = { contextEstimate: 0, tokenUsage: {} };

  if (existsSync(statePath)) {
    state = JSON.parse(readFileSync(statePath, 'utf-8'));
  }

  state = { ...state, ...updates };
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 主动清理建议
function suggestCompaction(contextPct) {
  if (contextPct >= THRESHOLDS.critical) {
    return [
      '建议执行 /compact 压缩上下文',
      '保存当前进度到 .peaks/ 目录',
      '使用 /loop 分割长任务'
    ];
  }
  return [];
}

// 入口
const projectPath = process.argv[2] || process.cwd();
const command = process.argv[3] || 'report';

if (command === 'report') {
  const pct = printUsageReport(projectPath);
  const suggestions = suggestCompaction(pct);
  if (suggestions.length > 0) {
    console.log('  ⚠️  清理建议:');
    suggestions.forEach(s => console.log(`    - ${s}`));
  }
  process.exit(pct >= THRESHOLDS.block ? 1 : 0);
} else if (command === 'update') {
  const inputTokens = parseInt(process.argv[4] || '0');
  const outputTokens = parseInt(process.argv[5] || '0');

  updateTokenStats(projectPath, { inputTokens, outputTokens });
  console.log(`✅ 已记录: Input ${inputTokens}, Output ${outputTokens}`);
}

export { printUsageReport, updateTokenStats, suggestCompaction };