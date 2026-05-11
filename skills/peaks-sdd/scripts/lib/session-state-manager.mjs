#!/usr/bin/env node
/**
 * peaks-sdd Session 状态管理器
 * 管理 workflow 状态、检查点、context 估算
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Workflow 状态枚举
 */
export const WorkflowState = {
  INIT: 'init',
  NAME_CONFIRMED: 'name_confirmed',
  PRD_DONE: 'prd_done',
  TECH_STACK_CONFIRMED: 'tech_stack_confirmed',
  DESIGN_DONE: 'design_done',
  KNOWLEDGE_DONE: 'knowledge_done',
  DOCS_DONE: 'docs_done',
  DEVELOPMENT_DONE: 'development_done',
  CR_SECURITY_PASSED: 'cr_security_passed',
  QA_PASSED: 'qa_passed',
  DEPLOY_DONE: 'deploy_done'
};

/**
 * SessionStateManager 类
 */
export class SessionStateManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.stateFile = join(projectPath, '.claude', 'session-state.json');
    this.workflowStateFile = join(projectPath, '.peaks', 'workflow-state.json');
  }

  /**
   * 读取 session state
   */
  readSessionState() {
    if (!existsSync(this.stateFile)) {
      return {
        contextEstimate: 0,
        projectType: null,
        techStack: {},
        currentWorkflow: null
      };
    }
    try {
      return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
    } catch (e) {
      return { contextEstimate: 0, projectType: null, techStack: {}, currentWorkflow: null };
    }
  }

  /**
   * 写入 session state
   */
  writeSessionState(state) {
    mkdirSync(join(this.projectPath, '.claude'), { recursive: true });
    writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * 读取 workflow state
   */
  readWorkflowState() {
    if (!existsSync(this.workflowStateFile)) {
      return {
        currentState: WorkflowState.INIT,
        stepHistory: [],
        checkpoints: []
      };
    }
    try {
      return JSON.parse(readFileSync(this.workflowStateFile, 'utf-8'));
    } catch (e) {
      return { currentState: WorkflowState.INIT, stepHistory: [], checkpoints: [] };
    }
  }

  /**
   * 写入 workflow state
   */
  writeWorkflowState(state) {
    mkdirSync(join(this.projectPath, '.peaks'), { recursive: true });
    writeFileSync(this.workflowStateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * 更新 workflow 状态
   */
  updateWorkflowState(newState, metadata = {}) {
    const state = this.readWorkflowState();
    state.stepHistory.push({
      from: state.currentState,
      to: newState,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    state.currentState = newState;
    this.writeWorkflowState(state);
    return state;
  }

  /**
   * 产出检查点
   */
  saveCheckpoint(checkpointType, data) {
    const state = this.readWorkflowState();
    const checkpoint = {
      type: checkpointType,
      timestamp: new Date().toISOString(),
      data
    };
    state.checkpoints.push(checkpoint);
    this.writeWorkflowState(state);

    // 同时写入检查点文件
    const checkpointDir = join(this.projectPath, '.peaks', 'checkpoints');
    mkdirSync(checkpointDir, { recursive: true });
    const checkpointFile = join(checkpointDir, `checkpoint-${checkpointType}-${Date.now()}.md`);
    writeFileSync(checkpointFile, `# Checkpoint - ${checkpointType}\n\n${JSON.stringify(data, null, 2)}`, 'utf-8');
    return checkpointFile;
  }

  /**
   * 检查是否需要 compact
   */
  needsCompact() {
    const session = this.readSessionState();
    return session.contextEstimate >= 75;
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return this.readWorkflowState().currentState;
  }
}

export default SessionStateManager;