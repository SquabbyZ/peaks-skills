---
name: tailwind-enforce
enabled: true
event: PostToolUse
action: warn
---

## TailwindCSS 样式强制检查 Hook

在每次 Edit/Write 操作后，检查是否使用了内联 `style` 属性或 `style={...}` 硬编码样式。

### 检查规则

| 检测内容 | 严重级别 | 动作 |
|---------|---------|------|
| `style={{` 内联样式对象 | CRITICAL | 🚨 禁止，必须使用 Tailwind class |
| `style="..."` 内联字符串样式 | CRITICAL | 🚨 禁止，必须使用 Tailwind class |
| `className` 缺失 | HIGH | ⚠️ 警告，缺少 Tailwind class |
| 使用非 Tailwind CSS | MEDIUM | ℹ️ 提示，建议使用 Tailwind |

### 匹配规则

- 只检查 `.tsx` `.jsx` `.html` 文件
- 跳过 `node_modules/` 目录
- 跳过 `.min.js` 文件
- 跳过 `generated/` 目录

### 警告输出格式

```
🚨 [TailwindCheck] src/components/Button.tsx:23
   🚨 禁止使用内联 style 属性
   ℹ️ 请使用 Tailwind class 替代

   23 | <div style={{ padding: '12px' }}>
      |        ^^^^^^^^^^^^^^^^^^^^^^^^

   ✅ 正确写法:
   <div className="p-3">
     ...
   </div>
```

### Tailwind CSS 常见转换对照

| 内联样式 | Tailwind Class |
|---------|---------------|
| `style={{ padding: '12px' }}` | `className="p-3"` |
| `style={{ margin: '16px' }}` | `className="m-4"` |
| `style={{ fontSize: '14px' }}` | `className="text-sm"` |
| `style={{ color: 'red' }}` | `className="text-red-500"` |
| `style={{ display: 'flex' }}` | `className="flex"` |
| `style={{ backgroundColor: '#fff' }}` | `className="bg-white"` |
| `style={{ width: '100%' }}` | `className="w-full"` |
| `style={{ height: '50px' }}` | `className="h-12"` |

### 允许的情况

以下情况允许使用 `style` 属性：
1. **动态值**：值来自 JavaScript 变量或计算
   ```tsx
   const padding = isLarge ? '24px' : '12px';
   <div style={{ padding }}>...</div>
   ```
2. **主题变量**：引用设计系统 token
   ```tsx
   <div style={{ '--theme-color': theme.primary }}>
   ```

### 配置检查

检查项目中是否配置了 Tailwind CSS：

```json
// package.json
{
  "dependencies": {
    "tailwindcss": "^3.0.0"
  }
}
```

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // ...
}
```

### 自动修复建议

对于可以自动转换的内联样式，可以使用 `npx @tailwindcss/upgrade` 工具：

```bash
# 转换 HTML 文件中的内联样式
npx @tailwindcss/upgrade --transform

# 仅检查不转换
npx @tailwindcss/upgrade --check
```

### 与其他 Hook 配合

此 hook 可以与 `auto-format` hook 配合使用：
1. `auto-format` 确保代码格式一致
2. `tailwind-enforce` 确保样式使用 Tailwind

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