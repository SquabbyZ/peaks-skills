#!/usr/bin/env node
/**
 * 设计稿截图脚本
 * 从 .claude/agents/design.md 提取设计稿并截图保存
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 默认截图配置
const SCREENSHOT_CONFIG = {
  viewport: { width: 1440, height: 900 },
  quality: 90,
  format: 'png',
  outputDir: '.peaks/designs'
};

// 提取 design.md 中的图片 URL
function extractImageUrls(designMd) {
  const urlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  const urls = [];
  let match;

  while ((match = urlRegex.exec(designMd)) !== null) {
    urls.push(match[1]);
  }

  // 也提取相对路径
  const localRegex = /!\[.*?\]\(([^)]+\.(png|jpg|jpeg|webp))\)/g;
  while ((match = localRegex.exec(designMd)) !== null) {
    urls.push(match[1]);
  }

  return [...new Set(urls)];
}

// 提取设计稿描述
function extractDesignDescriptions(designMd) {
  const descriptions = [];
  const lines = designMd.split('\n');

  for (const line of lines) {
    // 提取标题
    if (line.startsWith('# ')) {
      descriptions.push({ type: 'title', content: line.slice(2) });
    }
    // 提取组件描述
    if (line.startsWith('## ')) {
      descriptions.push({ type: 'section', content: line.slice(3) });
    }
  }

  return descriptions;
}

// 生成 HTML 预览页面
function generatePreviewHtml(designMd, imageUrls) {
  const descriptions = extractDesignDescriptions(designMd);

  let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a1a;
    color: #fff;
    padding: 40px;
  }
  .container { max-width: 1200px; margin: 0 auto; }
  .title { font-size: 24px; margin-bottom: 24px; color: #fff; }
  .images { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
  .image-card {
    background: #2a2a2a;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #333;
  }
  .image-card img { width: 100%; height: auto; display: block; }
  .desc { padding: 16px; font-size: 14px; color: #aaa; }
  h1 { font-size: 32px; margin-bottom: 32px; }
  h2 { font-size: 20px; margin: 24px 0 16px; color: #00ff88; }
  p { line-height: 1.6; margin-bottom: 16px; }
  .spec-table { width: 100%; margin: 16px 0; }
  .spec-table td { padding: 8px; border: 1px solid #333; }
  .spec-table td:first-child { color: #00ff88; width: 30%; }
</style>
</head>
<body>
<div class="container">
  <h1>Design Document</h1>
`;

  // 添加设计稿内容
  html += '<div class="content">\n';

  const lines = designMd.split('\n');
  let inTable = false;
  let tableContent = '';

  for (const line of lines) {
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableContent = '<table class="spec-table"><tbody>\n';
      }
      const cells = line.split('|').filter(c => c.trim());
      tableContent += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>\n';
    } else {
      if (inTable) {
        tableContent += '</tbody></table>\n';
        html += tableContent;
        tableContent = '';
        inTable = false;
      }

      if (line.startsWith('# ')) {
        html += `<h1>${line.slice(2)}</h1>\n`;
      } else if (line.startsWith('## ')) {
        html += `<h2>${line.slice(3)}</h2>\n`;
      } else if (line.startsWith('- ')) {
        html += `<li>${line.slice(2)}</li>\n`;
      } else if (line.trim()) {
        html += `<p>${line}</p>\n`;
      }
    }
  }

  if (inTable) {
    html += tableContent + '</tbody></table>\n';
  }

  html += '</div>\n';

  // 添加图片
  if (imageUrls.length > 0) {
    html += '<div class="images">\n';
    imageUrls.forEach(url => {
      html += `
      <div class="image-card">
        <img src="${url}" alt="Design screenshot" onerror="this.style.display='none'" />
      </div>\n`;
    });
    html += '</div>\n';
  }

  html += `
</div>
</body>
</html>`;

  return html;
}

// 保存截图
async function captureScreenshot(projectPath, designMd, options = {}) {
  const config = { ...SCREENSHOT_CONFIG, ...options };
  const outputDir = join(projectPath, config.outputDir);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 提取图片 URL
  const imageUrls = extractImageUrls(designMd);

  // 生成预览 HTML
  const html = generatePreviewHtml(designMd, imageUrls);
  const htmlPath = join(outputDir, 'preview.html');
  writeFileSync(htmlPath, html, 'utf-8');

  console.log(`✅ 预览页面已生成: ${htmlPath}`);

  // 如果有图片，使用 playwright 截图
  if (imageUrls.length > 0 && options.screenshot === true) {
    try {
      const { execSync } = await import('child_process');

      // 使用 npx playwright screenshot
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const outputPath = join(outputDir, `design-${timestamp}.png`);

      execSync(`npx playwright screenshot "${htmlPath}" "${outputPath}" --viewport-size=${config.viewport.width},${config.viewport.height} --wait-for-timeout=3000`, {
        stdio: 'inherit'
      });

      console.log(`✅ 截图已保存: ${outputPath}`);
      return outputPath;
    } catch (e) {
      console.log('⚠️  截图失败，使用 HTML 预览替代');
    }
  }

  return htmlPath;
}

// 入口
const projectPath = process.argv[2] || process.cwd();
const command = process.argv[3];

if (command === 'capture') {
  const designMdPath = process.argv[4] || join(projectPath, 'templates/agents/design.md');
  const screenshot = process.argv.includes('--screenshot');

  if (!existsSync(designMdPath)) {
    console.error(`❌ 文件不存在: ${designMdPath}`);
    process.exit(1);
  }

  const designMd = readFileSync(designMdPath, 'utf-8');
  const outputPath = captureScreenshot(projectPath, designMd, { screenshot });
  console.log(`📄 输出: ${outputPath}`);

} else if (command === 'preview') {
  const designMdPath = process.argv[4];
  if (!designMdPath || !existsSync(designMdPath)) {
    console.error('❌ 请提供有效的 design.md 路径');
    process.exit(1);
  }

  const designMd = readFileSync(designMdPath, 'utf-8');
  const html = generatePreviewHtml(designMd, []);
  console.log(html);

} else {
  console.log(`
📸 设计稿截图脚本

用法:
  node scripts/design-screenshot.js capture [design.md路径] [--screenshot]
  node scripts/design-screenshot.js preview <design.md路径>

示例:
  node scripts/design-screenshot.js capture templates/agents/design.md
  node scripts/design-screenshot.js capture templates/agents/design.md --screenshot
  node scripts/design-screenshot.js preview templates/agents/design.md
  `);
}

export { captureScreenshot, generatePreviewHtml, extractImageUrls };