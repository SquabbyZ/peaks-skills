import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPeaksDirectory, configureProjectSettings, syncProjectTemplates } from './lib/directory-creator.mjs';

const skillDir = join(import.meta.dirname, '..');

function createProject() {
  return mkdtempSync(join(tmpdir(), 'peaks-sdd-settings-'));
}

function readSettings(projectPath) {
  return JSON.parse(readFileSync(join(projectPath, '.claude', 'settings.json'), 'utf-8'));
}

test('init supports monorepo package scanning', () => {
  const projectPath = createProject();

  try {
    writeFileSync(join(projectPath, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }));
    writeFileSync(join(projectPath, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
    mkdirSync(join(projectPath, 'packages', 'web'), { recursive: true });
    writeFileSync(join(projectPath, 'packages', 'web', 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0' } }));

    const result = spawnSync(process.execPath, [join(import.meta.dirname, 'init.mjs'), projectPath, '--monorepo=true', '--change=monorepo-smoke'], {
      encoding: 'utf-8'
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(readFileSync(join(projectPath, '.peaks', 'current-change'), 'utf-8'), /changes\/\d{4}-\d{2}-\d{2}-monorepo-smoke/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('initializes phase handoff briefs for project core agents', () => {
  const projectPath = createProject();

  try {
    createPeaksDirectory(projectPath, { changeId: '2026-05-14-simple-ai-chat-web-app' });

    for (const [agent, phase] of [
      ['product', 'Product Brainstorming and PRD'],
      ['design', 'Visual Design'],
      ['dispatcher', 'Architecture and Swarm Planning'],
      ['qa', 'QA Planning']
    ]) {
      const handoff = readFileSync(join(projectPath, '.peaks', 'changes', '2026-05-14-simple-ai-chat-web-app', 'checkpoints', `${agent}-phase-handoff.md`), 'utf-8');
      assert.match(handoff, new RegExp(`# ${agent} Phase Handoff`));
      assert.match(handoff, new RegExp(`Phase: ${phase}`));
      assert.match(handoff, new RegExp(`Project Agent: \\.claude/agents/${agent}\\.md`));
      assert.match(handoff, /Required Invocation Evidence:/);
    }
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('does not overwrite existing phase handoff evidence on reinitialization', () => {
  const projectPath = createProject();

  try {
    const paths = createPeaksDirectory(projectPath, { changeId: '2026-05-14-simple-ai-chat-web-app' });
    const handoffPath = join(paths.changeDir, 'checkpoints', 'product-phase-handoff.md');
    const recordedEvidence = '# product Phase Handoff\n\nStatus: COMPLETED\nActual Invocation Evidence:\n- Agent: .claude/agents/product.md\nOutput Artifacts:\n- product/brainstorm.md\n';
    writeFileSync(handoffPath, recordedEvidence, 'utf-8');

    createPeaksDirectory(projectPath, { changeId: '2026-05-14-simple-ai-chat-web-app' });

    assert.equal(readFileSync(handoffPath, 'utf-8'), recordedEvidence);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('configures 0-to-1 project hooks and MCP from template', () => {
  const projectPath = createProject();

  try {
    configureProjectSettings(projectPath, { frontend: 'react' }, skillDir);

    const settings = readSettings(projectPath);
    assert.ok(settings.mcpServers.gitnexus);
    assert.ok(settings.mcpServers.playwright);
    assert.ok(settings.hooks.Stop.some(hook => hook.command.includes('verify-artifacts.mjs')));
    assert.ok(settings.hooks.Stop.some(hook => hook.command.includes(projectPath)));
    assert.ok(settings.hooks.PostToolUse.some(hook => hook.command.includes('auto-format.mjs')));
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('renders settings template when paths contain JSON escape characters', () => {
  const projectPath = `${createProject()}-quote-\\-path`;
  const escapedSkillDir = `${createProject()}-quote-\\-skill`;

  try {
    mkdirSync(join(escapedSkillDir, 'templates', '.claude'), { recursive: true });
    writeFileSync(
      join(escapedSkillDir, 'templates', '.claude', 'settings.json'),
      readFileSync(join(skillDir, 'templates', '.claude', 'settings.json'), 'utf-8')
    );

    configureProjectSettings(projectPath, { frontend: 'react' }, escapedSkillDir);

    const settings = readSettings(projectPath);
    const stopHook = settings.hooks.Stop.find(hook => hook.command.includes('verify-artifacts.mjs'));
    assert.ok(stopHook.command.includes(projectPath));
    assert.ok(stopHook.command.includes(escapedSkillDir));
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
    rmSync(escapedSkillDir, { recursive: true, force: true });
  }
});

test('merges settings template without overwriting existing user MCP and hooks', () => {
  const projectPath = createProject();

  try {
    mkdirSync(join(projectPath, '.claude'), { recursive: true });
    writeFileSync(join(projectPath, '.claude', 'settings.json'), JSON.stringify({
      mcpServers: {
        playwright: { command: 'custom-playwright' },
        custom: { command: 'custom-mcp' }
      },
      hooks: {
        Stop: [{ command: 'custom-stop', description: 'Custom stop hook' }]
      }
    }, null, 2));

    configureProjectSettings(projectPath, { frontend: 'react' }, skillDir);

    const settings = readSettings(projectPath);
    assert.equal(settings.mcpServers.playwright.command, 'custom-playwright');
    assert.equal(settings.mcpServers.custom.command, 'custom-mcp');
    assert.ok(settings.hooks.Stop.some(hook => hook.command === 'custom-stop'));
    assert.ok(settings.hooks.Stop.some(hook => hook.command.includes('verify-artifacts.mjs')));
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('syncs 0-to-1 project template assets without overwriting existing files', () => {
  const projectPath = createProject();

  try {
    mkdirSync(join(projectPath, '.claude'), { recursive: true });
    writeFileSync(join(projectPath, '.claude', 'session-state.json'), '{"custom":true}\n');

    const result = syncProjectTemplates(projectPath, skillDir);

    assert.ok(result.skipped.includes('.claude/session-state.json'));
    assert.ok(result.copied.includes('.claude/hookify/context-monitor.local.md'));
    assert.ok(result.copied.includes('.claude/hookify/hooks-config.local.md'));
    assert.ok(result.copied.includes('openspec/README.md'));
    assert.equal(readFileSync(join(projectPath, '.claude', 'session-state.json'), 'utf-8'), '{"custom":true}\n');
    assert.match(readFileSync(join(projectPath, '.claude', 'hookify', 'context-monitor.local.md'), 'utf-8'), /context-monitor/);
    assert.match(readFileSync(join(projectPath, 'openspec', 'README.md'), 'utf-8'), /OpenSpec Integration/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});
