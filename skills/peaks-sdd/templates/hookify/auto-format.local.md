---
name: auto-format
enabled: true
event: PostToolUse
action: auto
---

## 自动格式化 Hook

在每次 Edit/Write 操作后，自动格式化代码文件，保持风格一致。

### 支持的文件类型

| 文件类型 | 格式化工具 | 配置来源 |
|---------|-----------|---------|
| `.ts` `.tsx` `.js` `.jsx` | Prettier | 项目根目录 `.prettierrc` |
| `.css` `.scss` `.less` | Prettier | 项目根目录 `.prettierrc` |
| `.json` | Prettier | 内置规则 |
| `.md` | Prettier | 内置规则 |

### 行为逻辑

1. **匹配规则**：检测 Edit/Write 工具修改的文件
2. **跳过条件**：
   - 文件路径包含 `node_modules/`
   - 文件路径包含 `.min.` (已压缩文件)
   - 文件是二进制文件
3. **执行格式化**：对匹配的文件运行 `prettier --write`
4. **失败处理**：格式化失败不影响原操作，只记录警告

### 配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "prettier --write \"$FILE_PATH\"",
        "description": "Auto-format code after edit"
      }
    ]
  }
}
```

### 与项目的 prettier 配置对齐

优先使用项目自带的 prettier 配置：
- 项目根目录有 `.prettierrc` 或 `.prettierrc.json` → 使用项目配置
- 项目根目录有 `prettier.config.js` → 使用项目配置
- 无项目配置 → 使用内置默认配置（单引号、2空格缩进、末尾分号）

### 输出示例

```
✅ 已格式化: src/utils/helper.ts
✅ 已格式化: components/Button.tsx
⚠️ 跳过: node_modules/lodash/index.js (第三方)
```