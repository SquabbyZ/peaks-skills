---
name: component-library-enforce
enabled: true
event: PostToolUse
action: warn
---

## 组件库强制检查 Hook

在每次 Edit/Write 操作后，检查是否使用了组件库已提供的组件，或使用了禁止的原生方法。

### 检查规则

| 检测内容 | 严重级别 | 动作 |
|---------|---------|------|
| `window.alert()` | CRITICAL | 🚨 禁止，必须使用组件库 |
| `window.confirm()` | CRITICAL | 🚨 禁止，必须使用组件库 |
| `window.prompt()` | CRITICAL | 🚨 禁止，必须使用组件库 |
| 自己实现 Modal/Dialog | CRITICAL | 🚨 禁止，使用组件库 |
| 自己实现 Dropdown | HIGH | ⚠️ 警告，使用组件库 |
| 自己实现 DatePicker | HIGH | ⚠️ 警告，使用组件库 |
| 自己实现 Table | MEDIUM | ⚠️ 警告，使用组件库 |

### 检测的原生方法（禁止使用）

```javascript
// ❌ 禁止使用
window.alert('message');
window.confirm('确认删除？');
window.prompt('请输入名称');
window.open(url);
window.showModalDialog();
window.showModelessDialog();

// ✅ 使用组件库替代
import { Modal, message } from 'antd';
Modal.confirm({ title: '确认删除？', ... });
message.success('操作成功');
```

### 常见组件库替代对照

| 原生方法 | Ant Design | MUI | Chakra UI |
|---------|-----------|-----|-----------|
| alert/confirm | `Modal.confirm()` | `Alert` + `Dialog` | `Alert` + `useDisclosure` |
| prompt | `Modal.confirm()` + input | `TextField` in Dialog | `Alert` + `Input` |
| dropdown | `Select` / `Dropdown` | `Select` / `Menu` | `Menu` / `List` |
| date picker | `DatePicker` | `DatePicker` | `DatePicker` |
| modal | `Modal` | `Dialog` | `Modal` |
| notification | `message` / `notification` | `Snackbar` | `useToast` |
| tooltip | `Tooltip` | `Tooltip` | `Tooltip` |

### 检测逻辑

1. **扫描 window.* 调用**：检测 `window.alert`, `window.confirm`, `window.prompt`, `window.open` 等
2. **扫描自定义实现**：检测 `function Modal()`, `class Dialog`, `const CustomModal` 等
3. **检查项目依赖**：读取 `package.json` 中的组件库依赖
4. **给出替代建议**：根据已安装的组件库提供具体替代方案

### 警告输出格式

```
🚨 [ComponentLibCheck] src/components/UserForm.tsx:45
   🚨 禁止使用 window.confirm()

   45 | const confirmed = window.confirm('确认删除用户？');

   ℹ️ 检测到项目已安装: antd ^5.0.0

   ✅ 正确写法:
   import { Modal } from 'antd';

   Modal.confirm({
     title: '确认删除用户？',
     content: '此操作不可撤销',
     okText: '确认',
     cancelText: '取消',
     onOk: () => deleteUser(userId)
   });
```

### 项目依赖检测

检查 `package.json` 中的组件库：

```json
{
  "dependencies": {
    "antd": "^5.0.0",        // Ant Design
    "@mui/material": "^5.0.0", // Material UI
    "@chakra-ui/react": "^2.0.0", // Chakra UI
    "radix-ui": "^1.0.0"     // Radix UI
  }
}
```

### 允许的例外

以下情况允许自己实现：
1. 项目没有安装任何 UI 组件库
2. 组件库没有提供该组件（如自定义图表）
3. 组件库有严重 bug 且无替代方案

```typescript
// 例外：组件库不满足需求时
// 可以自己实现，但需要注释说明原因
// TODO: [ComponentLib] 临时方案，等待 antd 支持虚拟列表后再迁移
```

### 自动修复建议

```bash
# 替换为 antd message
# window.alert('success') → message.success('success')

# 替换为 antd Modal.confirm
# window.confirm('confirm?') → Modal.confirm({ title: 'confirm?', ... })
```

### 配合其他 Hook

此 hook 可以与 `tailwind-enforce` hook 配合使用：
- `component-library-enforce` 确保使用组件库
- `tailwind-enforce` 确保样式使用 Tailwind

### 完整的检查流程

```
1. 检测 window.alert/confirm/prompt → 立即报错
2. 检测 Modal/Dialog/Dropdown 自实现 → 警告，建议用组件库
3. 检测组件库依赖 → 根据项目依赖给出具体建议
4. 通过检查 → 放行
```