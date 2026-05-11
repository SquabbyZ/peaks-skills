#!/usr/bin/env node
/**
 * context-monitor.mjs
 * Context 使用率监控与自动 Compact 触发
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SESSION_STATE_PATH = join(process.cwd(), '.claude', 'session-state.json');

// 阈值配置
const THRESHOLDS = {
  warning: 75,      // 警告阈值
  critical: 90,     // 阻断阈值
  autoCompact: 75  // 自动 compact 阈值（对于全自动阶段）
};

// 阶段自动化级别
const AUTOMATION_LEVELS = {
  FULLAUTO: ['开发', 'Code Review', '安全检测', '测试', '自动化测试', '部署'],
  SEMI: ['Constitution', 'PRD', '设计', '原型验证']
};

function getCurrentPhase() {
  try {
    if (existsSync(SESSION_STATE_PATH)) {
      const data = JSON.parse(readFileSync(SESSION_STATE_PATH, 'utf-8'));
      return {
        phase: data.currentPhase || '未知',
        automationLevel: data.automationLevel || 'semi',
        contextEstimate: data.contextEstimate || 0
      };
    }
  } catch (e) {
    // ignore
  }
  return { phase: '未知', automationLevel: 'semi', contextEstimate: 0 };
}

function isFullAutoPhase(phase) {
  return AUTOMATION_LEVELS.FULLAUTO.some(p => phase.includes(p));
}

function getContextEstimate() {
  try {
    if (existsSync(SESSION_STATE_PATH)) {
      const data = JSON.parse(readFileSync(SESSION_STATE_PATH, 'utf-8'));
      return data.contextEstimate || 0;
    }
  } catch (e) {
    // ignore
  }
  return 0;
}

function updateSessionState(contextEstimate, phase, automationLevel) {
  try {
    let data = {};
    if (existsSync(SESSION_STATE_PATH)) {
      data = JSON.parse(readFileSync(SESSION_STATE_PATH, 'utf-8'));
    }
    data.contextEstimate = contextEstimate;
    data.currentPhase = phase;
    data.automationLevel = automationLevel;
    data.lastUpdated = new Date().toISOString();
    writeFileSync(SESSION_STATE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    // ignore
  }
}

function createCheckpoint(moduleName, currentTask, completed, pending, contextEstimate) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const checkpointPath = join(process.cwd(), '.peaks', 'checkpoints', `checkpoint-${moduleName}-${timestamp}.md`);

  const content = `# 检查点 - ${moduleName} - ${timestamp}

## 阶段信息
- 当前任务: ${currentTask}
- Context 预估: ${contextEstimate}%

## 已完成
${completed.map(t => `- [ ] ${t}`).join('\n')}

## 待处理
${pending.map(t => `- [ ] ${t}`).join('\n')}

## Context 状态
- contextEstimate: ${contextEstimate}%
- 预估剩余容量: ${100 - contextEstimate}%

## 恢复指令
读取此检查点文件，然后继续执行待处理任务。
`;

  try {
    const checkpointDir = join(process.cwd(), '.peaks', 'checkpoints');
    if (!existsSync(checkpointDir)) {
      import('fs').then(({ mkdirSync }) => mkdirSync(checkpointDir, { recursive: true }));
    }
    writeFileSync(checkpointPath, content);
    console.log(`\n   📌 检查点已保存: .peaks/checkpoints/checkpoint-${moduleName}-${timestamp}.md`);
  } catch (e) {
    // ignore
  }
}

function printWarning(contextEstimate, phase) {
  console.log('\n\x1b[1m\x1b[33m⚠️  Context 使用率警告\x1b[0m');
  console.log(`   当前: ${contextEstimate}%`);
  console.log(`   阶段: ${phase}`);
  console.log(`   剩余: ${100 - contextEstimate}%`);
  console.log('\n   \x1b[33m建议\x1b[0m: 运行 /compact 释放 context');
  console.log('   \x1b[90m或继续等待自动处理\x1b[0m');
}

function printCritical(contextEstimate, phase, isFullAuto) {
  console.log('\n\x1b[1m\x1b[31m🚨 Context 使用率临界\x1b[0m');
  console.log(`   当前: ${contextEstimate}%`);
  console.log(`   阶段: ${phase}`);
  console.log(`   剩余: ${100 - contextEstimate}%`);

  if (isFullAuto) {
    console.log('\n   \x1b[32m全自动阶段 → 自动执行 compact\x1b[0m');
    console.log('   检查点已保存，compact 后自动恢复\n');
  } else {
    console.log('\n   \x1b[31m半自动阶段 → 阻断操作\x1b[0m');
    console.log('   请手动运行 /compact 释放 context\n');
  }
}

// 主逻辑
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  if (command === 'check') {
    // 检查模式：从 session-state.json 读取并输出状态
    const { phase, automationLevel, contextEstimate } = getCurrentPhase();

    console.log(`\n   Context: ${contextEstimate}% | 阶段: ${phase} | 模式: ${automationLevel}`);

    if (contextEstimate >= THRESHOLDS.critical) {
      printCritical(contextEstimate, phase, isFullAutoPhase(phase));
      process.exit(isFullAutoPhase(phase) ? 0 : 1); // 全自动不阻断，半自动阻断
    } else if (contextEstimate >= THRESHOLDS.warning) {
      printWarning(contextEstimate, phase);
      process.exit(0);
    }

  } else if (command === 'monitor') {
    // 监控模式：持续监控（用于 loop）
    const interval = parseInt(args[1]) || 60000; // 默认 60s

    console.log(`\n   🔄 Context 监控模式 (每 ${interval/1000}s 检查一次)`);

    setInterval(() => {
      const { phase, automationLevel, contextEstimate } = getCurrentPhase();

      if (contextEstimate >= THRESHOLDS.critical) {
        if (isFullAutoPhase(phase)) {
          console.log(`\n   [${new Date().toISOString()}] 🚨 全自动阶段临界，执行自动 compact...`);
          console.log('   请在另一个终端运行: /compact');
        } else {
          console.log(`\n   [${new Date().toISOString()}] 🚨 Context 达到 ${contextEstimate}%，请运行 /compact`);
        }
      } else if (contextEstimate >= THRESHOLDS.warning) {
        console.log(`\n   [${new Date().toISOString()}] ⚠️  Context ${contextEstimate}%`);
      }
    }, interval);

  } else if (command === 'update') {
    // 更新 session-state.json
    const contextEstimate = parseInt(args[1]) || 0;
    const phase = args[2] || '未知';
    const automationLevel = args[3] || 'semi';

    updateSessionState(contextEstimate, phase, automationLevel);
    console.log(`   ✅ Context 更新: ${contextEstimate}% | ${phase} | ${automationLevel}`);

  } else if (command === 'checkpoint') {
    // 创建检查点
    const moduleName = args[1] || 'unknown';
    const currentTask = args[2] || '任务进行中';
    const completed = args.slice(3).filter(a => !a.startsWith('--pending'));
    const pending = args.slice(4).filter(a => a.startsWith('--pending=')).map(a => a.replace('--pending=', ''));

    createCheckpoint(moduleName, currentTask, completed, pending, getContextEstimate());

  } else {
    // 帮助信息
    console.log(`
\x1b[1mContext Monitor\x1b[0m - Context 使用率监控工具

用法:
  node context-monitor.mjs check                    检查当前 context 状态
  node context-monitor.mjs monitor [interval]       持续监控（默认 60s）
  node context-monitor.mjs update <context> <phase> <level>  更新状态
  node context-monitor.mjs checkpoint <module> <task> [completed...] --pending=[pending...]

示例:
  node context-monitor.mjs check
  node context-monitor.mjs monitor 30000
  node context-monitor.mjs update 45 "PRD 分析" "semi"
  node context-monitor.mjs checkpoint auth "完成登录模块" "用户注册" "订单管理" --pending=后台管理
`);
  }

  process.exit(0);
}

main().catch(console.error);