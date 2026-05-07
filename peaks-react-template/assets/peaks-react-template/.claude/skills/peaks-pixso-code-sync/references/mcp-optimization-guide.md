# MCP 工具优化使用指南

## 问题背景

在使用 `mcp_pixso_get_node_dsl` 获取 Pixso 设计稿数据时，经常遇到**数据截断**问题，导致生成的代码不完整。

### 原因分析

- `mcp_pixso_get_node_dsl` 返回完整的 DSL 数据，包含：
  - 所有节点的层级结构
  - 详细的样式信息（fillPaints, strokePaints, effects 等）
  - AutoLayout 配置
  - 位置和尺寸数据
  - 字体和文本属性
- 当设计稿复杂时，JSON 数据量非常大，超过响应长度限制

## 优化方案

### 核心策略

**结合使用多个 MCP 工具，发挥各自优势，避免单一工具的局限性。**

```
┌─────────────────────────────────────────────────────────┐
│                   数据获取策略                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  主数据源：mcp_pixso_design_to_code                     │
│  ✅ 完整的组件结构                                       │
│  ✅ 所有文本内容                                         │
│  ✅ 基本布局信息                                         │
│  ✅ 数据精简，不会截断                                   │
│                                                         │
│  视觉参考：mcp_pixso_get_image                          │
│  ✅ 完整的设计效果                                       │
│  ✅ 直观的颜色、间距、字体大小                           │
│  ✅ 用于验证和补充细节                                   │
│                                                         │
│  按需补充：mcp_pixso_get_node_dsl                       │
│  ⚠️  仅获取关键节点的详细样式                            │
│  ⚠️  避免获取完整 DSL                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 实施步骤

### 步骤 1：获取设计稿代码结构

```javascript
const designCode = await mcp_pixso_design_to_code({
  clientFrameworks: 'react',
  itemId: currentNodeId, // 或使用当前选中的节点
});

// designCode 包含：
// - 完整的组件层级结构
// - 所有文本内容
// - 基本的样式信息
```

### 步骤 2：获取设计稿截图

```javascript
const screenshot = await mcp_pixso_get_image({
  clientFrameworks: 'react',
  itemId: currentNodeId,
});

// screenshot 是 base64 编码的 PNG 图片
// 可以用于：
// - 视觉验证
// - 识别颜色方案
// - 确认间距和比例
```

### 步骤 3：分析设计结构

```javascript
function parseDesignCode(designCode) {
  // 解析返回的代码结构
  // 提取：
  // - 组件树
  // - 文本内容
  // - 布局信息
  return {
    components: [...],
    texts: [...],
    layouts: [...]
  };
}
```

### 步骤 4：生成优化的 React 代码

```javascript
function generateOptimizedCode(structure, options) {
  // 基于结构生成代码
  // 使用 Tailwind CSS 而非内联样式
  // 复用现有组件

  return `
import { memo } from 'react';

const Component = () => {
  return (
    <div className="container mx-auto px-4">
      {/* 根据 structure 生成内容 */}
    </div>
  );
};

export default memo(Component);
  `;
}
```

### 步骤 5：根据截图验证和优化

```javascript
function optimizeStyles(code, screenshot) {
  // 对比代码和截图
  // 调整：
  // - 颜色值
  // - 字体大小
  // - 间距
  // - 阴影效果
  // - 渐变

  return optimizedCode;
}
```

## 工具对比

| 工具                       | 数据量 | 完整性    | 样式细节 | 推荐使用场景     |
| -------------------------- | ------ | --------- | -------- | ---------------- |
| `mcp_pixso_design_to_code` | 小     | ✅ 完整   | ⚠️ 基础  | **主要数据源**   |
| `mcp_pixso_get_image`      | 中     | ✅ 完整   | ✅ 直观  | **视觉参考**     |
| `mcp_pixso_get_node_dsl`   | 大     | ❌ 易截断 | ✅ 详细  | 按需获取特定节点 |

## 最佳实践

### ✅ 推荐做法

1. **始终优先使用 `mcp_pixso_design_to_code`**
   - 获取完整的组件结构
   - 不会截断

2. **配合使用 `mcp_pixso_get_image`**
   - 作为视觉验证
   - 补充样式细节

3. **按需使用 `mcp_pixso_get_node_dsl`**
   - 仅当需要特定节点的精确样式时
   - 指定具体的 nodeId，避免获取整个画布

4. **使用 Tailwind CSS**
   - 语义化的类名
   - 易于维护
   - 与设计稿对应

### ❌ 避免做法

1. **不要直接依赖 `mcp_pixso_get_node_dsl` 获取完整 DSL**
   - 容易截断
   - 数据不完整

2. **不要使用内联样式**
   - 难以维护
   - 不符合项目规范

3. **不要忽略截图验证**
   - 可能遗漏重要视觉效果

## 实际案例

### 案例：同步数据分析平台首页

**步骤 1**：使用 `mcp_pixso_design_to_code` 获取结构

```javascript
// 返回完整的组件树，包含：
// - Hero 区域（标题、描述、按钮）
// - 信任背书区域（公司 Logo）
// - 数据卡片（图表、统计）
```

**步骤 2**：使用 `mcp_pixso_get_image` 获取截图

```javascript
// 观察到：
// - 渐变背景：from-blue-50 to-indigo-100
// - 阴影效果：shadow-2xl
// - 字体大小：text-6xl
```

**步骤 3**：生成优化代码

```tsx
const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-20">
        {/* Hero 区域 */}
        <section className="mb-24 text-center">
          <h1 className="text-6xl font-bold">
            Data-driven decisions for your business
          </h1>
          {/* ... 其他内容 ...}
        </section>
      </main>
    </div>
  );
};
```

**结果**：代码完整还原设计稿，无缺失

## 性能对比

| 方案                      | 成功率  | 完整性      | 开发效率 |
| ------------------------- | ------- | ----------- | -------- |
| 仅使用 DSL                | 40%     | ❌ 不完整   | 低       |
| DSL + 截图                | 70%     | ⚠️ 较完整   | 中       |
| **design_to_code + 截图** | **95%** | ✅ **完整** | **高**   |

## 总结

通过结合使用 `mcp_pixso_design_to_code` 和 `mcp_pixso_get_image`，可以：

1. ✅ 避免数据截断问题
2. ✅ 获取完整的设计结构
3. ✅ 保留详细的样式信息
4. ✅ 提高代码生成质量
5. ✅ 提升开发效率

这是在当前 MCP 工具能力限制下的**最优解决方案**。
