# peaks-pixso-code-sync 使用场景详解

## 📖 概述

本文档详细介绍 peaks-pixso-code-sync 技能的各种使用场景，帮助用户理解在不同情况下如何正确使用该技能。

## 🎯 核心场景

### 场景分类

根据**选中状态**和**同步范围**，Pixso→代码 同步分为三种场景：

1. **未选中内容** → 同步整个画布（默认行为）
2. **选中组件** → 同步选中组件
3. **选中区块** → 同步选中区块

---

## 场景 1：未选中内容 → 同步整个画布

### 🎯 场景描述

当用户在 Pixso 中**没有选中任何特定的节点或组件**时，技能会自动同步**整个画布**的所有内容。

### 📋 触发条件

- ✅ 用户打开了 Pixso 画布
- ✅ 用户**没有选中任何内容**（或点击空白处取消选择）
- ✅ 用户输入了触发词（如"从 Pixso 同步到代码"）

### 🔄 处理逻辑

```
1. 检测当前选中状态
   ↓
   未选中任何节点

2. 自动获取画布根节点（最顶层 Frame）
   ↓
   获取整个画布的层级结构

3. 同步整个画布的所有内容
   ↓
   包含所有区域、组件、元素

4. 生成完整的页面代码
   ↓
   输出完整的 React 组件
```

### 💡 实际示例

**用户操作流程**：

```
1. 打开 Pixso 画布 "首页设计 - 完整版"
2. 点击画布空白处（确保没有选中任何内容）
3. 输入："从 Pixso 同步到代码"
```

**AI 处理过程**：

```
✅ 检测到未选中任何内容
✅ 自动获取画布根节点（Frame 9:4107）
✅ 同步整个"首页设计"画布
✅ 生成完整的首页代码
```

**代码输出**：

```tsx
// 生成整个页面的完整代码
import { memo } from 'react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-20">

        {/* Hero 区域 */}
        <section className="mb-24 text-center">
          <h1 className="text-6xl font-bold">
            Data-driven decisions for your business
          </h1>
          <p className="text-xl text-gray-600">
            Transform your data into actionable insights...
          </p>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white">
              Start Free Trial
            </button>
            <button className="border-2 border-blue-600">
              Book a Demo
            </button>
          </div>
        </section>

        {/* 信任背书区域 */}
        <section className="mb-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">
            Trusted by 5000+ companies
          </p>
          <div className="flex gap-x-16">
            {['Google', 'Microsoft', 'Amazon', 'Netflix', 'Spotify'].map(...)}
          </div>
        </section>

        {/* 数据卡片区域 */}
        <section className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-2xl">
            <h2 className="text-2xl font-bold">Real-time Performance</h2>
            <div className="h-80 bg-gray-50">Chart Placeholder</div>
          </div>
          <div className="rounded-2xl bg-white shadow-2xl">
            <p className="text-6xl font-bold">$124,500</p>
            <p className="text-green-600">↑ 12.5% from last month</p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default memo(Home);
```

### ✅ 适用场景

- 🆕 **首次同步**：项目刚开始，需要从设计稿生成完整页面
- 🔄 **重大更新**：设计稿有大改动，需要完整替换现有代码
- 📄 **完整还原**：需要 100% 还原设计稿的所有细节
- 🎨 **设计评审后**：设计师完成所有修改，需要同步到代码

### ⚠️ 注意事项

1. **会覆盖现有代码**：整个页面的代码会被替换
2. **保留逻辑代码**：useState、useEffect 等逻辑会被保留
3. **建议 Git 提交**：同步前建议先提交当前代码

---

## 场景 2：选中组件 → 同步选中组件

### 🎯 场景描述

当用户在 Pixso 中**选中了特定的组件**时，技能会仅同步**该组件**的内容。

### 📋 触发条件

- ✅ 用户打开了 Pixso 画布
- ✅ 用户**选中了特定的节点或组件**
- ✅ 用户输入了触发词

### 🔄 处理逻辑

```
1. 检测当前选中状态
   ↓
   选中了特定节点

2. 仅获取选中节点及其子节点
   ↓
   获取组件的层级结构

3. 同步选中的组件内容
   ↓
   仅包含该组件的元素

4. 生成组件代码
   ↓
   输出组件的 React 代码
```

### 💡 实际示例

**用户操作流程**：

```
1. 打开 Pixso 画布 "首页设计 - 完整版"
2. 选中"导航栏"组件（Frame 9:4463）
3. 输入："从 Pixso 同步到代码"
```

**AI 处理过程**：

```
✅ 检测到选中了"导航栏"节点
✅ 仅获取导航栏组件的内容
✅ 同步导航栏组件
✅ 生成导航栏代码
```

**代码输出**：

```tsx
// 仅生成导航栏组件的代码
import { memo } from 'react';

const Navbar = () => {
  return (
    <nav className="fixed z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* 导航链接 */}
        <div className="hidden items-center space-x-8 md:flex">
          <a
            href="#documentation"
            className="text-gray-700 hover:text-blue-600"
          >
            Documentation
          </a>
          <a href="#about" className="text-gray-700 hover:text-blue-600">
            About
          </a>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
            Sign In
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navbar);
```

### ✅ 适用场景

- 🔧 **组件更新**：只更新某个特定组件
- 🧩 **组件复用**：将设计组件应用到其他页面
- 🎯 **局部调整**：设计师只修改了某个组件
- 📦 **组件库建设**：从设计稿提取可复用组件

### ⚠️ 注意事项

1. **独立组件**：生成的是独立组件代码
2. **可能需要嵌入**：可能需要手动嵌入到页面中
3. **样式隔离**：确保组件样式不会冲突

---

## 场景 3：选中区块 → 同步选中区块

### 🎯 场景描述

当用户在 Pixso 中**选中了某个区块**（如 Hero 区域、卡片区域）时，技能会仅同步**该区块**的内容。

### 📋 触发条件

- ✅ 用户打开了 Pixso 画布
- ✅ 用户选中了某个区块（Frame 或 Group）
- ✅ 用户输入了触发词

### 🔄 处理逻辑

```
1. 检测当前选中状态
   ↓
   选中了某个区块

2. 获取选中区块及其子节点
   ↓
   获取区块的层级结构

3. 同步选中的区块内容
   ↓
   仅包含该区块的元素

4. 生成区块代码
   ↓
   输出区块的 HTML/JSX 代码
```

### 💡 实际示例

**用户操作流程**：

```
1. 打开 Pixso 画布 "首页设计 - 完整版"
2. 选中"Hero 区域"（Frame 9:4108）
3. 输入："同步这个区域到代码"
```

**AI 处理过程**：

```
✅ 检测到选中了"Hero 区域"
✅ 仅获取 Hero 区域的内容
✅ 同步 Hero 区域
✅ 生成 Hero 区域代码
```

**代码输出**：

```tsx
// 生成 Hero 区域的代码（可嵌入现有页面）
<section className="mb-24 text-center">
  <h1 className="text-6xl font-bold leading-tight tracking-tight">
    Data-driven decisions for your business
  </h1>
  <p className="mx-auto mb-12 max-w-3xl text-xl text-gray-600">
    Transform your data into actionable insights with our powerful analytics
    platform. Track performance, identify trends, and make informed decisions.
  </p>
  <div className="flex items-center justify-center gap-4">
    <button className="rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg">
      Start Free Trial
    </button>
    <button className="rounded-lg border-2 border-blue-600 px-8 py-4 font-semibold text-blue-600">
      Book a Demo
    </button>
  </div>
</section>
```

### ✅ 适用场景

- 📝 **页面更新**：更新页面的某一部分
- ➕ **添加功能区**：添加新的功能区块
- 🎨 **布局调整**：调整某个区域的布局
- 🔀 **增量同步**：只同步变化的部分

### ⚠️ 注意事项

1. **需要手动嵌入**：生成的代码需要手动放入页面
2. **保持样式一致**：确保与现有页面样式一致
3. **响应式考虑**：注意响应式设计的适配

---

## 📊 场景对比

| 特性                 | 未选中（同步整个画布） | 选中组件           | 选中区块           |
| -------------------- | ---------------------- | ------------------ | ------------------ |
| **同步范围**         | 整个画布               | 单个组件           | 单个区块           |
| **代码输出**         | 完整页面组件           | 独立组件           | 区块代码           |
| **适用场景**         | 首次同步、重大更新     | 组件复用、局部更新 | 增量更新、添加功能 |
| **是否需要手动嵌入** | ❌ 不需要              | ✅ 需要            | ✅ 需要            |
| **覆盖范围**         | 整个页面               | 组件本身           | 区块本身           |
| **推荐频率**         | 低（重大变更时）       | 中（组件更新时）   | 高（日常开发）     |

---

## 🎓 最佳实践

### ✅ 推荐做法

1. **首次同步用"未选中"**

   ```
   打开画布 → 不选中任何内容 → 同步整个页面
   ```

2. **组件更新用"选中组件"**

   ```
   选中组件 → 同步组件 → 嵌入到合适位置
   ```

3. **增量更新用"选中区块"**

   ```
   选中区块 → 同步区块 → 手动嵌入页面
   ```

4. **频繁同步保持同步**
   ```
   设计修改 → 立即同步 → 避免差异累积
   ```

### ❌ 避免做法

1. **长时间不同步**

   ```
   ❌ 设计修改了很多次才同步一次
   ✅ 每次设计修改后立即同步
   ```

2. **同时双向修改**

   ```
   ❌ 同时修改设计和代码
   ✅ 单向修改，然后同步
   ```

3. **忽略视觉验证**
   ```
   ❌ 同步后不检查效果
   ✅ 同步后对比设计稿验证
   ```

---

## 🔧 技术提示

### 检测选中状态的逻辑

```javascript
async function detectSelection() {
  // 尝试获取选中的节点
  const selectedNode = await mcp_pixso_get_selected_node();

  if (!selectedNode) {
    // 未选中，获取根节点
    return await mcp_pixso_get_root_node();
  } else {
    // 已选中，返回选中节点
    return selectedNode;
  }
}
```

### 同步范围判断

```javascript
function determineSyncRange(node) {
  if (node.type === 'CANVAS') {
    return 'FULL_PAGE';
  } else if (node.type === 'COMPONENT') {
    return 'COMPONENT';
  } else if (node.type === 'FRAME' || node.type === 'GROUP') {
    return 'SECTION';
  }
}
```

---

## 📚 相关文档

- [skill.md](../skill.md) - 主技能文档
- [quick-reference.md](./quick-reference.md) - 快速参考
- [mcp-optimization-guide.md](./mcp-optimization-guide.md) - MCP 工具优化指南
- [test-case.md](./test-case.md) - 测试案例

---

**通过理解这些使用场景，您可以更高效地使用 peaks-pixso-code-sync 技能，实现设计与代码的完美同步！** 🚀
