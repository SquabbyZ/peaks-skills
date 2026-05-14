#!/usr/bin/env node
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MCP_SERVER_REGISTRY = {
  gitnexus: {
    command: 'npx',
    args: projectPath => ['-y', 'gitnexus@latest', 'mcp', '--repo', projectPath],
    strategy: 'event-driven',
    stages: ['product', 'design', 'architecture', 'swarm', 'review', 'final']
  },
  'claude-mem': {
    command: 'npx',
    args: () => ['-y', '@the.dot/mem'],
    strategy: 'long-term-memory-only',
    stages: ['product', 'architecture', 'user-preferences']
  },
  context7: {
    command: 'npx',
    args: () => ['-y', '@upstash/context7-mcp@latest'],
    strategy: 'docs-on-demand',
    stages: ['tech-selection', 'shadcn', 'tauri', 'orm', 'framework-api']
  },
  fs: {
    command: 'npx',
    args: () => ['-y', '@bunas/fs-mcp'],
    strategy: 'restricted-project-filesystem',
    stages: ['artifact-validation']
  },
  'claude-md-management': {
    command: 'npx',
    args: () => ['-y', 'claude-md-management@claude-plugins-official'],
    strategy: 'rules-management-on-demand',
    stages: ['initialization', 'claude-md-update']
  },
  'code-review': {
    command: 'npx',
    args: () => ['-y', 'code-review@claude-plugins-official'],
    strategy: 'review-stage-only',
    stages: ['review', 'fix-wave']
  },
  'typescript-lsp': {
    command: 'npx',
    args: () => ['-y', 'typescript-lsp@claude-plugins-official'],
    strategy: 'typescript-projects-only',
    stages: ['frontend', 'backend-typescript', 'review']
  },
  superpowers: {
    command: 'npx',
    args: () => ['-y', 'superpowers@claude-plugins-official'],
    strategy: 'process-guidance-on-demand',
    stages: ['brainstorm', 'planning', 'verification']
  },
  'frontend-design': {
    command: 'npx',
    args: () => ['-y', 'frontend-design@claude-plugins-official'],
    strategy: 'ui-projects-only',
    stages: ['design', 'frontend-implementation', 'preview']
  },
  openspec: {
    command: 'node',
    args: () => [join(__dirname, '..', 'mcp', 'openspec-server.mjs')],
    strategy: 'openspec-change-management',
    stages: ['product', 'openspec-change', 'apply', 'archive']
  }
};

export function getRecommendedMcpServers(techStack = {}) {
  const recommended = ['gitnexus', 'claude-mem', 'context7', 'openspec'];

  if (hasTypeScript(techStack)) {
    recommended.push('typescript-lsp');
  }

  if (hasUi(techStack)) {
    recommended.push('frontend-design');
  }

  return recommended;
}

export function buildMcpServers(projectPath, techStack = {}) {
  const selected = getRecommendedMcpServers(techStack);
  return Object.fromEntries(
    selected.map(name => {
      const config = MCP_SERVER_REGISTRY[name];
      return [name, { command: config.command, args: config.args(projectPath) }];
    })
  );
}

export function buildMcpPolicyNotes(techStack = {}) {
  const selected = getRecommendedMcpServers(techStack);
  return selected.map(name => {
    const config = MCP_SERVER_REGISTRY[name];
    return {
      name,
      strategy: config.strategy,
      stages: config.stages
    };
  });
}

function hasTypeScript(techStack = {}) {
  const frontend = String(techStack.frontend || '').toLowerCase();
  const backend = String(techStack.backend || '').toLowerCase();
  return Boolean(frontend || backend || techStack.typescript || techStack.ui);
}

function hasUi(techStack = {}) {
  const frontend = String(techStack.frontend || '').toLowerCase();
  const ui = String(techStack.ui || '').toLowerCase();
  return Boolean(frontend || ui || techStack.hasUi);
}
