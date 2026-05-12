#!/usr/bin/env node
/**
 * peaks-sdd 工作流自动执行脚本
 * 检查当前状态并自动执行下一步
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SessionStateManager, WorkflowState } from './lib/session-state-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getSkillDir() {
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    dir = join(dir, '..');
    if (existsSync(join(dir, 'SKILL.md'))) {
      return dir;
    }
  }
  return null;
}

function hasFileMatching(dir, matcher) {
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some(matcher);
}

/**
 * 状态流转映射
 */
const STATE_TRANSITIONS = {
  [WorkflowState.INIT]: 'step1_confirm_name',
  [WorkflowState.NAME_CONFIRMED]: 'step2_prd_brainstorm',
  [WorkflowState.PRD_DONE]: 'step3_confirm_tech_stack',
  [WorkflowState.TECH_STACK_CONFIRMED]: 'step4_design',
  [WorkflowState.DESIGN_DONE]: 'step5_knowledge',
  [WorkflowState.KNOWLEDGE_DONE]: 'step6_docs',
  [WorkflowState.DOCS_DONE]: 'step7_development',
  [WorkflowState.DEVELOPMENT_DONE]: 'step8_cr_security',
  [WorkflowState.CR_SECURITY_PASSED]: 'step9_qa',
  [WorkflowState.QA_PASSED]: 'step10_deploy'
};

/**
 * 检查产出物是否存在
 */
function checkArtifacts(projectPath, state) {
  const artifacts = {
    [WorkflowState.NAME_CONFIRMED]: () => existsSync(join(projectPath, 'package.json')),
    [WorkflowState.PRD_DONE]: () => {
      const prdsDir = join(projectPath, '.peaks', 'prds');
      return hasFileMatching(prdsDir, name => name.startsWith('prd-') && name.endsWith('.md'));
    },
    [WorkflowState.TECH_STACK_CONFIRMED]: () => true, // 技术栈在 state 中
    [WorkflowState.DESIGN_DONE]: () => {
      const designsDir = join(projectPath, '.peaks', 'designs');
      return hasFileMatching(designsDir, name => name.endsWith('.png') || name.endsWith('.html') || name.endsWith('.md'));
    },
    [WorkflowState.KNOWLEDGE_DONE]: () => existsSync(join(projectPath, '.peaks', 'knowledge', 'product-knowledge.md')),
    [WorkflowState.DOCS_DONE]: () => {
      const plansDir = join(projectPath, '.peaks', 'plans');
      const testDocsDir = join(projectPath, '.peaks', 'test-docs');
      return hasFileMatching(plansDir, name => name.startsWith('tech-doc-') && name.endsWith('.md'))
        && hasFileMatching(testDocsDir, name => name.startsWith('test-case-') && name.endsWith('.md'));
    },
    [WorkflowState.DEVELOPMENT_DONE]: () => {
      const reportsDir = join(projectPath, '.peaks', 'reports');
      return hasFileMatching(reportsDir, name => name.startsWith('dispatcher-summary') && name.endsWith('.md'));
    },
    [WorkflowState.CR_SECURITY_PASSED]: () => {
      const checkpointsDir = join(projectPath, '.peaks', 'checkpoints');
      const reportsDir = join(projectPath, '.peaks', 'reports');
      const hasCodeReview = hasFileMatching(checkpointsDir, name => name.includes('code-review') && name.endsWith('.md'))
        || hasFileMatching(reportsDir, name => name.includes('code-review') && name.endsWith('.md'))
        || hasFileMatching(reportsDir, name => name.startsWith('cr-report') && name.endsWith('.md'));
      const hasSecurity = hasFileMatching(checkpointsDir, name => name.includes('security') && name.endsWith('.md'))
        || hasFileMatching(reportsDir, name => name.includes('security') && name.endsWith('.md'));
      return hasCodeReview && hasSecurity;
    },
    [WorkflowState.QA_PASSED]: () => {
      const reportsDir = join(projectPath, '.peaks', 'reports');
      return hasFileMatching(reportsDir, name => name.startsWith('final-report') && name.endsWith('.md'))
        || hasFileMatching(reportsDir, name => name.startsWith('qa-round') && name.endsWith('.md'));
    }
  };

  const checker = artifacts[state];
  if (!checker) return true;
  return checker();
}

/**
 * 继续工作流
 */
async function continueWorkflow(projectPath) {
  const skillDir = getSkillDir();
  const manager = new SessionStateManager(projectPath);
  const currentState = manager.getCurrentState();

  console.log(`\n🔄 当前状态: ${currentState}`);

  // 检查产出物
  if (!checkArtifacts(projectPath, currentState)) {
    console.error(`❌ 状态 ${currentState} 的产出物缺失，请先完成当前步骤`);
    return { success: false, state: currentState, error: 'artifacts_missing' };
  }

  // 确定下一步
  const nextStep = STATE_TRANSITIONS[currentState];
  if (!nextStep) {
    console.log(`✅ 工作流已完成，当前状态: ${currentState}`);
    return { success: true, state: currentState, done: true };
  }

  console.log(`📍 下一步: ${nextStep}`);

  // 更新状态
  manager.updateWorkflowState(getNextState(currentState), { nextStep });

  return {
    success: true,
    state: currentState,
    nextStep,
    instruction: getStepInstruction(nextStep)
  };
}

/**
 * 根据下一步获取目标状态
 */
function getNextState(current) {
  const transitions = {
    [WorkflowState.INIT]: WorkflowState.NAME_CONFIRMED,
    [WorkflowState.NAME_CONFIRMED]: WorkflowState.PRD_DONE,
    [WorkflowState.PRD_DONE]: WorkflowState.TECH_STACK_CONFIRMED,
    [WorkflowState.TECH_STACK_CONFIRMED]: WorkflowState.DESIGN_DONE,
    [WorkflowState.DESIGN_DONE]: WorkflowState.KNOWLEDGE_DONE,
    [WorkflowState.KNOWLEDGE_DONE]: WorkflowState.DOCS_DONE,
    [WorkflowState.DOCS_DONE]: WorkflowState.DEVELOPMENT_DONE,
    [WorkflowState.DEVELOPMENT_DONE]: WorkflowState.CR_SECURITY_PASSED,
    [WorkflowState.CR_SECURITY_PASSED]: WorkflowState.QA_PASSED,
    [WorkflowState.QA_PASSED]: WorkflowState.DEPLOY_DONE
  };
  return transitions[current] || current;
}

/**
 * 获取步骤指令
 */
function getStepInstruction(step) {
  const instructions = {
    'step1_confirm_name': '使用 AskUserQuestion 确认项目名称',
    'step2_prd_brainstorm': '调度 product agent 进行 PRD 脑暴',
    'step3_confirm_tech_stack': '使用 AskUserQuestion 确认技术栈',
    'step4_design': '调度 design agent（如有前端）确认设计稿',
    'step5_knowledge': '调度 product agent 生成知识积累',
    'step6_docs': '并行生成技术文档和测试用例',
    'step7_development': '调度 dispatcher 拆分子 agent 开发',
    'step8_cr_security': '并行执行 CodeReview 和安全检查',
    'step9_qa': '调度 qa 生成测试 brief 并执行 3 轮 QA 测试',
    'step10_deploy': '调度 devops 执行部署'
  };
  return instructions[step] || '未知步骤';
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  console.log(`\n🔄 peaks-sdd 工作流继续器\n`);
  console.log(`项目: ${projectPath}\n`);

  const result = await continueWorkflow(projectPath);
  if (result.success) {
    if (result.done) {
      console.log(result.instruction || '工作流已完成');
    } else {
      console.log(`下一步: ${result.instruction}`);
    }
  } else {
    console.error(`错误: ${result.error}`);
    process.exit(1);
  }
}

export { continueWorkflow, getStepInstruction };