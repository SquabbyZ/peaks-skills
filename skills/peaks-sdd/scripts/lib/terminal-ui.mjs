#!/usr/bin/env node
/**
 * peaks-sdd 终端 UI 动画效果模块
 * 提供加载动画和进度条效果
 */

/**
 * 简单的加载动画类
 */
export class Spinner {
  constructor(message = '加载中') {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.frameIndex = 0;
    this.interval = null;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.started = true;
    process.stdout.write(`\x1b[36m${this.frames[0]}\x1b[0m ${this.message}...`);
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      process.stdout.write(`\r\x1b[36m${this.frames[this.frameIndex]}\x1b[0m ${this.message}...`);
    }, 80);
  }

  stop(text = '完成') {
    if (!this.started) return;
    this.started = false;
    clearInterval(this.interval);
    process.stdout.write(`\r\x1b[32m✓\x1b[0m ${text}\n`);
  }

  fail(text = '失败') {
    if (!this.started) return;
    this.started = false;
    clearInterval(this.interval);
    process.stdout.write(`\r\x1b[31m✗\x1b[0m ${text}\n`);
  }
}

/**
 * 进度条动画类
 */
export class ProgressBar {
  constructor(total = 100, width = 30) {
    this.total = total;
    this.width = width;
    this.current = 0;
    this.started = false;
    this.interval = null;
  }

  start() {
    this.started = true;
    this.render();
  }

  update(current) {
    this.current = current;
    this.render();
  }

  render() {
    const filled = Math.round((this.current / this.total) * this.width);
    const empty = this.width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percent = Math.round((this.current / this.total) * 100);
    process.stdout.write(`\r\x1b[36m[\x1b[0m${bar}\x1b[36m]\x1b[0m ${percent}%`);
  }

  stop(text = '完成') {
    this.started = false;
    clearInterval(this.interval);
    this.current = this.total;
    this.render();
    process.stdout.write(` \x1b[32m${text}\x1b[0m\n`);
  }
}

/**
 * 打字机效果
 */
export async function typeWriter(text, delay = 30) {
  for (const char of text) {
    process.stdout.write(char);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  process.stdout.write('\n');
}

/**
 * 渐入效果
 */
export async function fadeIn(lines, delay = 100) {
  for (const line of lines) {
    console.log(line);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * 打印带动画的标题
 */
export function printAnimatedTitle(text) {
  const decorations = {
    '🔍': '═'.repeat(30),
    '📦': '─'.repeat(20),
    '🧩': '─'.repeat(20),
    '⬇':  '─'.repeat(20),
    '📁': '─'.repeat(20),
    '📂': '─'.repeat(20),
    '🔌': '─'.repeat(20),
    '✅': '─'.repeat(20),
  };

  const icon = text.match(/^[^\w]/) ? text.match(/^[^\w]/)[0] : '';
  const deco = decorations[icon] || '─'.repeat(20);

  console.log(`\n\x1b[1m\x1b[36m${icon}\x1b[0m \x1b[1m${text.replace(/^[^\w]\s*/, '')}\x1b[0m`);
  console.log(`\x1b[90m${deco}\x1b[0m`);
}

/**
 * 带动画的列表打印
 */
export async function animateList(items, { icon = '•', delay = 50 } = {}) {
  for (const item of items) {
    process.stdout.write(`\r\x1b[36m${icon}\x1b[0m ${item}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  process.stdout.write('\n');
}

/**
 * 成功/失败/警告的消息格式化
 */
export const status = {
  success: (text) => `\x1b[32m✓ ${text}\x1b[0m`,
  error: (text) => `\x1b[31m✗ ${text}\x1b[0m`,
  warning: (text) => `\x1b[33m⚠ ${text}\x1b[0m`,
  skip: (text) => `\x1b[36m➖ ${text}\x1b[0m`,
  info: (text) => `\x1b[34mℹ ${text}\x1b[0m`,
};
