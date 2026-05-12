#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const DEFAULT_INITIAL_CHANGE_SLUG = 'initial-product';

export const CHANGE_SUBDIRS = [
  'product',
  'design/screenshots',
  'architecture',
  'openspec',
  'swarm/briefs',
  'swarm/reports',
  'dispatch',
  'qa/screenshots',
  'review',
  'checkpoints'
];

export function getDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function slugifyChangeName(input = DEFAULT_INITIAL_CHANGE_SLUG) {
  const slug = String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || DEFAULT_INITIAL_CHANGE_SLUG;
}

export function createChangeId(input = DEFAULT_INITIAL_CHANGE_SLUG, date = new Date()) {
  const slug = slugifyChangeName(input);
  const stamp = getDateStamp(date);
  if (slug.startsWith(`${stamp}-`)) return slug;
  return `${stamp}-${slug}`;
}

export function getPeaksPaths(projectPath, changeId) {
  const peaksDir = join(projectPath, '.peaks');
  const projectDir = join(peaksDir, 'project');
  const changesDir = join(peaksDir, 'changes');
  const currentChangeFile = join(peaksDir, 'current-change');
  const activeChangeId = normalizeChangeId(changeId || readCurrentChangeId(projectPath) || createChangeId());
  const changeRelativePath = join('changes', activeChangeId);
  const changeDir = join(peaksDir, changeRelativePath);
  assertInsideDirectory(changesDir, changeDir);

  return {
    peaksDir,
    projectDir,
    changesDir,
    currentChangeFile,
    changeId: activeChangeId,
    changeRelativePath,
    changeDir
  };
}

export function readCurrentChangeId(projectPath) {
  const currentChangeFile = join(projectPath, '.peaks', 'current-change');
  if (!existsSync(currentChangeFile)) return null;

  const content = readFileSync(currentChangeFile, 'utf-8').trim();
  if (!content) return null;
  return normalizeChangeId(content.replace(/^changes\//, ''));
}

export function writeCurrentChange(projectPath, changeId) {
  const { peaksDir, currentChangeFile } = getPeaksPaths(projectPath, changeId);
  mkdirSync(peaksDir, { recursive: true });
  writeFileSync(currentChangeFile, `changes/${changeId}\n`, 'utf-8');
}

export function createPeaksProjectLayout(projectPath, options = {}) {
  const changeId = options.changeId || createChangeId(options.changeName || DEFAULT_INITIAL_CHANGE_SLUG);
  const paths = getPeaksPaths(projectPath, changeId);

  mkdirSync(paths.projectDir, { recursive: true });
  mkdirSync(paths.changesDir, { recursive: true });
  mkdirSync(paths.changeDir, { recursive: true });

  for (const subdir of CHANGE_SUBDIRS) {
    mkdirSync(join(paths.changeDir, subdir), { recursive: true });
  }

  writeCurrentChange(projectPath, changeId);
  ensureProjectFile(join(paths.projectDir, 'overview.md'), '# Project Overview\n\n当前产品总览会在 PRD 确认后更新。\n');
  ensureProjectFile(join(paths.projectDir, 'product-knowledge.md'), '# Product Knowledge\n\n跨迭代稳定知识会在每个 change 完成后沉淀。\n');
  ensureProjectFile(join(paths.projectDir, 'roadmap.md'), '# Roadmap\n\n阶段规划会在需要时更新。\n');
  ensureProjectFile(join(paths.projectDir, 'decisions.md'), '# Project Decisions\n\n跨 change 的长期决策索引。\n');
  ensureProjectFile(join(paths.changeDir, 'enhancements.md'), '# Enhancements\n\n记录本 change 使用的外部 skills、MCP 查询和最佳实践来源。\n');

  return paths;
}

export function resolveChangeArtifact(projectPath, relativePath, changeId = readCurrentChangeId(projectPath)) {
  const paths = getPeaksPaths(projectPath, changeId);
  const artifactPath = join(paths.changeDir, relativePath);
  assertInsideDirectory(paths.changeDir, artifactPath);
  return artifactPath;
}

function normalizeChangeId(changeId) {
  const normalized = String(changeId || '')
    .trim()
    .replace(/^changes\//, '')
    .replace(/\\/g, '/');

  if (!normalized || normalized.includes('/') || normalized === '.' || normalized === '..' || normalized.includes('..')) {
    throw new Error(`Invalid change id: ${changeId}`);
  }

  return slugifyChangeName(normalized);
}

function assertInsideDirectory(parentDir, childPath) {
  const rel = relative(parentDir, childPath);
  if (rel.startsWith('..') || rel === '..') {
    throw new Error(`Path escapes expected directory: ${childPath}`);
  }
}

function ensureProjectFile(path, content) {
  if (!existsSync(path)) {
    writeFileSync(path, content, 'utf-8');
  }
}
