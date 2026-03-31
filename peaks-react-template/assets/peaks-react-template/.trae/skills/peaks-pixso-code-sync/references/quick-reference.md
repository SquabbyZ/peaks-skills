# peaks-pixso-code-sync 快速参考卡片

## 🚀 快速开始

### 从 Pixso 同步到代码

```
"从 Pixso 同步到代码"
"根据设计生成代码"
"更新代码"
```

### 从代码同步到 Pixso

```
"把代码同步到 Pixso"
"更新 Pixso 设计"
"代码转设计"
```

## 📋 常用触发词

| 同步方向       | 触发词示例                                    |
| -------------- | --------------------------------------------- |
| **Pixso→代码** | 从 Pixso 同步、生成代码、更新代码、从画布同步 |
| **代码→Pixso** | 把代码同步、更新设计、代码转设计、同步到画布  |
| **通用**       | 同步 Pixso、双向同步、保持一致                |

## 🎯 使用场景

### Pixso→代码 同步范围

#### 场景 1：未选中内容 → 同步整个画布

```
用户操作：
1. 打开 Pixso 画布
2. 没有选中任何内容（或点击空白处）
3. 触发同步

AI 处理：
✅ 自动获取画布根节点
✅ 同步整个画布的所有内容
✅ 生成完整的页面代码
```

**适用场景**：

- 首次同步整个页面
- 画布有重大更新
- 需要完整还原设计稿

#### 场景 2：选中组件 → 同步选中组件

```
用户操作：
1. 打开 Pixso 画布
2. 选中特定组件（如导航栏、卡片）
3. 触发同步

AI 处理：
✅ 仅同步选中的组件
✅ 生成组件代码
```

**适用场景**：

- 只更新某个组件
- 复用设计组件
- 局部调整

#### 场景 3：选中区块 → 同步选中区块

```
用户操作：
1. 打开 Pixso 画布
2. 选中某个区块（如 Hero 区域）
3. 触发同步

AI 处理：
✅ 仅同步选中的区块
✅ 生成区块代码
```

**适用场景**：

- 更新页面某一部分
- 添加新功能区
- 调整布局结构

### 决策流程

```
检查选中状态
   ↓
   ├─ 未选中 → 同步整个画布（默认）
   ├─ 选中组件 → 同步组件
   └─ 选中区块 → 同步区块
```

## 🔄 工作流程

### Pixso→代码（优化版）

**核心策略**：结合使用 `mcp_pixso_design_to_code` 和 `mcp_pixso_get_image`，避免 DSL 数据截断问题。

```
1. 获取设计结构 (mcp_pixso_design_to_code)
   ↓
2. 获取设计截图 (mcp_pixso_get_image)
   ↓
3. 整合分析数据
   ↓
4. 生成优化代码
   ↓
5. 格式化保存
   ↓
6. 创建映射
```

**详细说明**：

- **步骤 1**：使用 `mcp_pixso_design_to_code` 获取完整组件结构（不会截断）
- **步骤 2**：使用 `mcp_pixso_get_image` 获取设计稿截图作为视觉参考
- **步骤 3**：整合两个数据源，提取完整的结构和样式信息
- **步骤 4**：基于结构生成 React + Tailwind 代码
- **步骤 5**：使用 Prettier 格式化代码
- **步骤 6**：更新映射关系文件

### 代码→Pixso

```
1. 读取代码 → 2. 解析结构 → 3. 转换设计 → 4. 更新页面 → 5. 更新映射
```

## 🛡️ 安全保护

### ✅ 会自动保护

- useState
- useEffect
- onClick 等事件处理
- 业务逻辑代码

### ⚠️ 冲突处理

```tsx
// TODO: [Pixso Sync] Review and merge changes
新代码内容;
```

## 📁 映射关系

**文件位置**：`.trae/skills/peaks-pixso-code-sync/mappings.json`

**格式**：

```json
{
  "code_path": "src/pages/index.tsx",
  "pixso_page_id": "9:4855",
  "sync_direction": "pixso_to_code"
}
```

## 🎨 样式转换

### 基础样式

#### 颜色

```
#3b82f6  →  blue-500
#ffffff  →  white
#000000  →  black
```

#### 字体大小

```
12px  →  text-xs
16px  →  text-base
24px  →  text-2xl
```

#### 间距

```
8px   →  p-2
16px  →  p-4
24px  →  p-6
```

### 透明度转换（根据截图微调）

#### 背景透明度

```
几乎透明  →  bg-white/20 - bg-white/30   (导航栏、卡片背景)
半透明    →  bg-white/50 - bg-white/60   (模态框、遮罩)
轻微透明  →  bg-white/70 - bg-white/80   (浮层、下拉菜单)
```

#### 元素透明度

```
几乎透明  →  opacity-20 - opacity-30   (Logo、图标背景)
半透明    →  opacity-40 - opacity-60   (次要元素、占位符)
中等透明  →  opacity-70 - opacity-80   (边框、分隔线)
轻微透明  →  opacity-90                (文字、按钮)
```

#### 文字颜色深浅

```
非常浅  →  text-gray-400         (占位符、次要信息)
较浅    →  text-gray-500/600     (副标题、说明文字)
正常    →  text-gray-700/800     (正文、段落)
深色    →  text-gray-900         (标题、重要文字)
```

### 渐变背景

```
淡蓝到淡紫  →  bg-gradient-to-br from-blue-50 to-indigo-100   (页面背景)
蓝色到紫色  →  bg-gradient-to-r from-blue-600 to-indigo-600   (CTA 区域)
蓝白渐变    →  bg-gradient-to-br from-blue-100 to-white       (卡片背景)
粉紫渐变    →  bg-gradient-to-br from-purple-100 to-pink-100  (图表占位符)
绿色渐变    →  bg-gradient-to-br from-green-100 to-emerald-100 (数据卡片)
```

### 图标背景颜色（超淡效果）

```
超淡蓝  →  bg-blue-50     (图标背景)
超淡紫  →  bg-purple-50   (图标背景)
超淡绿  →  bg-green-50    (图标背景)
超淡红  →  bg-red-50      (图标背景)
```

### 阴影柔和度

```
轻微阴影  →  shadow-sm   (卡片、按钮)
中等阴影  →  shadow-md   (悬浮元素)
大阴影    →  shadow-lg   (弹窗、模态框)
超大阴影  →  shadow-xl   (重要浮层)
```

## 🎯 交互状态

```
Pixso 变体    →  Tailwind 前缀
Hover        →  hover:
Active       →  active:
Focus        →  focus:
```

## ✅ 最佳实践

### Do's ✅

- 频繁同步
- 清晰命名
- 小步迭代
- Git 提交

### Don'ts ❌

- 长时间不同步
- 命名不一致
- 同时双向修改

## 📊 性能参考

| 页面复杂度 | 元素数量 | 耗时   |
| ---------- | -------- | ------ |
| 简单       | < 10     | ~2 秒  |
| 中等       | 10-50    | ~5 秒  |
| 复杂       | 50+      | ~10 秒 |

## 🛠️ MCP 工具使用策略

### 工具对比

| 工具                       | 数据量 | 完整性    | 推荐使用场景                 |
| -------------------------- | ------ | --------- | ---------------------------- |
| `mcp_pixso_design_to_code` | 小     | ✅ 完整   | **主要数据源**，获取组件结构 |
| `mcp_pixso_get_image`      | 中     | ✅ 完整   | **视觉参考**，验证样式细节   |
| `mcp_pixso_get_node_dsl`   | 大     | ❌ 易截断 | 按需获取特定节点样式         |

### 最佳实践

✅ **推荐**：

1. 优先使用 `mcp_pixso_design_to_code` 获取结构
2. 配合 `mcp_pixso_get_image` 验证视觉效果
3. 按需使用 `mcp_pixso_get_node_dsl` 获取特定节点详情

❌ **避免**：

1. 直接依赖 `mcp_pixso_get_node_dsl` 获取完整 DSL（会截断）
2. 仅使用单一数据源
3. 忽略截图验证

📖 **详细文档**：[MCP 优化使用指南](./mcp-optimization-guide.md)

## 🔧 技术栈

```
React 18 + TypeScript + Umijs + Tailwind CSS 3 + Ant Design 6
```

## 📚 完整文档

- [快速开始指南](./references/quick-start.md)
- [实现指南](./references/bidirectional-sync-guide.md)
- [演示案例](./references/demo-showcase.md)
- [技能说明](./references/skill-enhancement-summary.md)

## 💡 示例

### 简单同步

```
用户：从 Pixso 同步首页到代码
AI：✅ 同步完成！
   - Pixso 页面：src/pages/index
   - 代码文件：src/pages/index.tsx
   - 设计元素：5 个
```

### 带状态同步

```
用户：同步 Card 组件，包含 Hover 状态
AI：✅ 同步完成！
   - 基础样式：已转换
   - 交互状态：hover: 前缀
   - 过渡效果：已添加
```

## ⚡ 快捷键思维

**需要同步？** → 直接说：

- "同步 Pixso"
- "从设计生成代码"
- "更新设计稿"

**遇到冲突？** → AI 会自动：

- 保护逻辑代码
- 添加 TODO 标记
- 保留旧代码

**检查映射？** → 查看：
`.trae/skills/peaks-pixso-code-sync/mappings.json`

---

**立即开始使用 peaks-pixso-code-sync，体验高效的双向同步！** 🚀
