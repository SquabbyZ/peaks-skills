#!/usr/bin/env node
/**
 * Progress Communicator - User-facing progress and status communication
 *
 * 提供可视化卡片：phase cards、wave progress、handoff notifications
 * 输出到控制台并写入 artifact 文件
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PHASE_ICONS = {
  'product': '🧠',
  'design': '🎨',
  'architecture': '🏗️',
  'planning': '📋',
  'development': '🔨',
  'quality': '🔍',
  'delivery': '🚀',
  'review': '📝',
  'security': '🔒',
  'qa': '✅',
  'frontend': '🖥️',
  'backend': '⚙️',
  'dispatch': '🎯'
};

const PHASE_LABELS = {
  'product': '产品定义',
  'design': 'UI/UX 设计',
  'architecture': '架构设计',
  'planning': '任务规划',
  'development': '开发执行',
  'quality': '质量保障',
  'delivery': '交付部署',
  'review': '代码审查',
  'security': '安全审查',
  'qa': '测试验证',
  'frontend': '前端开发',
  'backend': '后端开发',
  'dispatch': '调度协调'
};

export const STEP_LABELS = {
  1: { phase: 'product', label: '产品脑暴与 PRD' },
  2: { phase: 'design', label: '设计稿与确认' },
  3: { phase: 'architecture', label: '技术方案设计' },
  4: { phase: 'development', label: '前后端开发' },
  5: { phase: 'review', label: '代码与安全审查' },
  6: { phase: 'qa', label: '测试验证' },
  7: { phase: 'delivery', label: '交付部署' }
};

export function createPhaseCard({ phase, step, totalSteps = 7, description, changeId }) {
  const icon = PHASE_ICONS[phase] || '📦';
  const label = PHASE_LABELS[phase] || phase;
  const progress = Math.round((step / totalSteps) * 100);
  const filled = Math.floor(progress / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

  return `
╔══════════════════════════════════════════════════════════════╗
║  ${icon} ${label.padEnd(14)}  Step ${String(step).padStart(2)}/${totalSteps}                     ║
╠══════════════════════════════════════════════════════════════╣
║  ${bar}  ${String(progress).padStart(3)}%                                         ║
╠══════════════════════════════════════════════════════════════╣
║  ${(description || STEP_LABELS[step]?.label || '').padEnd(58)}  ║
╠══════════════════════════════════════════════════════════════╣
║  Change: ${(changeId || '').padEnd(49)}  ║
╚══════════════════════════════════════════════════════════════╝`;
}

export function createWaveProgressCard({ wave, totalWaves, agents, status = 'running' }) {
  const agentList = (agents || []).map(a => `  • ${a}`).join('\n') || '  (empty)';
  return `
┌─ Wave ${String(wave)}/${totalWaves} ─────────────────────────────────────────┐
│  Status: ${status.padEnd(53)}  │
├────────────────────────────────────────────────────────────────────┤
│  Agents in parallel:                                                     │
${agentList.padEnd(68)}  │
└────────────────────────────────────────────────────────────────────┘`;
}

export function createHandoffCard({ fromAgent, toAgent, files = [], status = 'pending' }) {
  const fileCount = files.length;
  const fileList = files.slice(0, 3).map(f => `  • ${f}`).join('\n');
  const more = fileCount > 3 ? `\n  • ... and ${fileCount - 3} more` : '';
  return `
╔══════════════════════════════════════════════════════════════╗
║  🔄 HANDOFF: ${fromAgent.padEnd(12)} → ${toAgent.padEnd(12)}               ║
╠══════════════════════════════════════════════════════════════╣
║  Status: ${status.padEnd(53)}  ║
║  Files: ${String(fileCount).padEnd(54)}  ║
${fileList || '  (no files)'}${more}
╚══════════════════════════════════════════════════════════════╝`;
}

export function createChecklistCard({ phase, items = [] }) {
  const label = PHASE_LABELS[phase] || phase;
  const itemLines = items.map(item => {
    const icon = item.done ? '✓' : '○';
    const text = item.text || item;
    return `  ${icon} ${text}`;
  }).join('\n');
  return `
┌─ ${label.toUpperCase()} CHECKLIST ──────────────────────────────────────────┐
${itemLines || '  (no items)'}
└────────────────────────────────────────────────────────────────────┘`;
}

export function createWelcomeCard({ projectPath, changeId }) {
  return `
╔══════════════════════════════════════════════════════════════╗
║  🎯 peaks-sdd 已就绪                                              ║
╠══════════════════════════════════════════════════════════════╣
║  当前 Change: ${(changeId || 'N/A').padEnd(48)}  ║
║                                                               ║
║  工作流阶段:                                                    ║
║    1. 🧠 产品脑暴与 PRD 定义                                      ║
║    2. 🎨 设计稿与确认                                            ║
║    3. 🏗️ 技术方案设计                                            ║
║    4. 🔨 前后端开发                                              ║
║    5. 📝 代码与安全审查                                           ║
║    6. ✅ 测试验证                                                 ║
║    7. 🚀 交付部署                                                 ║
╠══════════════════════════════════════════════════════════════╣
║  下一步: 运行 /peaks-sdd <你的产品想法>                           ║
╚══════════════════════════════════════════════════════════════╝`;
}

export function writeProgressArtifact(projectPath, changeId, phase, content, type = 'phase') {
  const baseDir = join(projectPath, '.peaks', 'changes', changeId);
  if (!baseDir || !changeId) return null;

  const progressDir = join(baseDir, 'checkpoints', 'progress');
  if (!existsSync(progressDir)) {
    mkdirSync(progressDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const artifactPath = join(progressDir, `${type}-${phase}-${timestamp}.md`);
  writeFileSync(artifactPath, content, 'utf-8');

  return artifactPath;
}

export function logAgentActivity(projectPath, changeId, agentName, activity, details = {}) {
  if (!projectPath || !changeId) return;

  const baseDir = join(projectPath, '.peaks', 'changes', changeId);
  const logDir = join(baseDir, 'swarm');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const logPath = join(logDir, 'agent-activity.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${agentName}] ${activity} ${JSON.stringify(details)}\n`;

  appendFileSync(logPath, logEntry, 'utf-8');
}

export function getWaveStatusPath(projectPath, changeId) {
  return join(projectPath, '.peaks', 'changes', changeId, 'swarm', 'wave-status.json');
}

export function writeWaveStatus(projectPath, changeId, waveNum, status, agents = []) {
  if (!projectPath || !changeId) return;

  const baseDir = join(projectPath, '.peaks', 'changes', changeId);
  const swarmDir = join(baseDir, 'swarm');
  if (!existsSync(swarmDir)) {
    mkdirSync(swarmDir, { recursive: true });
  }

  const statusPath = join(swarmDir, 'wave-status.json');
  let waveStatus = {};

  if (existsSync(statusPath)) {
    try {
      waveStatus = JSON.parse(readFileSync(statusPath, 'utf-8'));
    } catch (e) {}
  }

  waveStatus[`wave-${waveNum}`] = {
    status,
    agents,
    updatedAt: new Date().toISOString()
  };

  writeFileSync(statusPath, JSON.stringify(waveStatus, null, 2), 'utf-8');
  return statusPath;
}

// CLI entry for testing
if (process.argv[1] && process.argv[1].endsWith('progress-communicator.mjs')) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'phase-card': {
      const phase = args.find(a => a.startsWith('--phase='))?.split('=')[1] || 'product';
      const step = parseInt(args.find(a => a.startsWith('--step='))?.split('=')[1] || '1');
      const total = parseInt(args.find(a => a.startsWith('--total='))?.split('=')[1] || '7');
      const changeId = args.find(a => a.startsWith('--change-id='))?.split('=')[1] || 'test';
      console.log(createPhaseCard({ phase, step, totalSteps: total, changeId }));
      break;
    }
    case 'wave-card': {
      const wave = parseInt(args.find(a => a.startsWith('--wave='))?.split('=')[1] || '1');
      const total = parseInt(args.find(a => a.startsWith('--total='))?.split('=')[1] || '3');
      const agentsArg = args.find(a => a.startsWith('--agents='))?.split('=')[1] || '';
      const agents = agentsArg ? agentsArg.split(',') : [];
      console.log(createWaveProgressCard({ wave, totalWaves: total, agents }));
      break;
    }
    case 'welcome': {
      const projectPath = args.find(a => a.startsWith('--project='))?.split('=')[1] || '.';
      const changeId = args.find(a => a.startsWith('--change-id='))?.split('=')[1] || 'N/A';
      console.log(createWelcomeCard({ projectPath, changeId }));
      break;
    }
    default:
      console.log('Usage:');
      console.log('  node progress-communicator.mjs phase-card --phase=product --step=1 --total=7 --change-id=xxx');
      console.log('  node progress-communicator.mjs wave-card --wave=1 --total=3 --agents=frontend,backend');
      console.log('  node progress-communicator.mjs welcome --project=. --change-id=xxx');
  }
}
