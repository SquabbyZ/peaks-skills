# 表单组件横向布局支持更新日志

## 📅 更新日期

2026-04-10

## 🎯 更新目标

为所有 `hook-form/children` 目录下的表单子组件添加横向布局支持，并优化 peaks-hook-form skill 模板。

---

## ✅ 已完成的组件

### 1. HookInputFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;      // 是否显示必填标记 *，默认 true
layout?: 'vertical' | 'horizontal';  // label 布局方向，默认 vertical
labelWidth?: number;             // 横向布局时 label 宽度，默认 80
```

**使用示例：**

```tsx
// 纵向（默认）
<HookInputFormItem prop="name" label="姓名" />

// 横向
<HookInputFormItem
  prop="name"
  label="姓名"
  layout="horizontal"
  labelWidth={80}
/>
```

---

### 2. HookSelectFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;
layout?: 'vertical' | 'horizontal';
labelWidth?: number;
```

**使用示例：**

```tsx
<HookSelectFormItem
  prop="type"
  label="类型"
  options={options}
  layout="horizontal"
  labelWidth={60}
/>
```

---

### 3. HookSwitchFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;
layout?: 'vertical' | 'horizontal';
labelWidth?: number;
```

**使用示例：**

```tsx
<HookSwitchFormItem
  prop="enabled"
  label="启用"
  layout="horizontal"
  labelWidth={80}
/>
```

---

### 4. HookTagFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;
layout?: 'vertical' | 'horizontal';
labelWidth?: number;
```

**使用示例：**

```tsx
<HookTagFormItem prop="tags" label="标签" layout="horizontal" labelWidth={80} />
```

---

### 5. HookTextAreaFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;
layout?: 'vertical' | 'horizontal';
labelWidth?: number;
```

**使用示例：**

```tsx
<HookTextAreaFormItem
  prop="description"
  label="描述"
  layout="horizontal"
  labelWidth={80}
/>
```

**注意：** TextArea 在横向布局时使用 `flex items-start` 而非 `items-center`，因为多行文本框需要顶部对齐。

---

### 6. HookTextFormItem.tsx

**新增属性：**

```typescript
showRequiredMark?: boolean;
layout?: 'vertical' | 'horizontal';
labelWidth?: number;
```

**使用示例：**

```tsx
<HookTextFormItem prop="id" label="ID" layout="horizontal" labelWidth={80} />
```

---

## 🔧 技术实现细节

### 1. 布局控制逻辑

```typescript
labelCol={
  layout === 'horizontal'
    ? { flex: `0 0 ${labelWidth}px` }
    : { span: 24 }
}
wrapperCol={layout === 'horizontal' ? { flex: 1 } : { span: 24 }}
className={layout === 'horizontal' ? 'flex items-center' : ''}
```

**原理：**

- **纵向布局**：使用 Ant Design 的 `span: 24`，label 和 content 各占一行
- **横向布局**：使用 Flexbox，label 固定宽度，content 自适应剩余空间

### 2. 必填标记控制

```typescript
required={required && showRequiredMark}
```

**作用：**

- 表格等紧凑场景中设置 `showRequiredMark={false}` 隐藏 `*` 标记
- 保留表单验证功能，仅控制视觉显示

### 3. 特殊处理

**HookTextAreaFormItem：**

```tsx
className={layout === 'horizontal' ? 'flex items-start' : ''}
```

- 使用 `items-start` 而非 `items-center`
- 确保多行文本框与 label 顶部对齐

---

## 📚 Skill 文档更新

### 更新文件

`.claude/skills/peaks-hook-form/SKILL.md`

### 更新内容

1. **InputFormItem 模板**：添加新属性定义和使用示例
2. **SelectFormItem 模板**：添加新属性定义和使用示例
3. **代码示例**：展示横向布局的实现方式

---

## 💡 使用场景

### 场景 1：常规表单（纵向）

```tsx
<FormProvider {...methods}>
  <form>
    <HookInputFormItem prop="name" label="姓名" required />
    <HookSelectFormItem prop="role" label="角色" options={roles} />
    <HookTextAreaFormItem prop="bio" label="简介" />
  </form>
</FormProvider>
```

### 场景 2：紧凑表格（横向 + 隐藏星号）

```tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3">
    <HookInputFormItem
      prop="code"
      label=""
      required
      showRequiredMark={false}
      layout="horizontal"
      labelWidth={0}
    />
  </div>
  <div className="col-span-3">
    <HookInputFormItem
      prop="name"
      label=""
      required
      showRequiredMark={false}
      layout="horizontal"
      labelWidth={0}
    />
  </div>
</div>
```

### 场景 3：配置面板（横向）

```tsx
<div className="space-y-4">
  <HookSwitchFormItem
    prop="enabled"
    label="启用功能"
    layout="horizontal"
    labelWidth={100}
  />
  <HookSelectFormItem
    prop="mode"
    label="运行模式"
    options={modes}
    layout="horizontal"
    labelWidth={100}
  />
</div>
```

---

## ⚠️ 注意事项

### 1. 向后兼容

所有新属性都有默认值，现有代码无需修改：

- `showRequiredMark = true`
- `layout = 'vertical'`
- `labelWidth = 80`

### 2. 类型安全

所有新增属性都是可选的，TypeScript 类型检查完全通过。

### 3. Prettier 格式化

所有文件已通过 Prettier 格式化，无 lint 错误。

### 4. 性能优化

所有组件都使用 `memo` 包裹，避免不必要的重渲染。

---

## 🎨 样式说明

### 纵向布局（默认）

```
┌─────────────────────┐
│ Label               │
├─────────────────────┤
│ [Input Field]       │
└─────────────────────┘
```

### 横向布局

```
┌──────────┬──────────────────┐
│ Label    │ [Input Field]    │
└──────────┴──────────────────┘
   80px        flex: 1
```

---

## 📖 相关文档

- [peaks-hook-form SKILL.md](../.claude/skills/peaks-hook-form/SKILL.md)
- [Quick Start Guide](../.claude/skills/peaks-hook-form/references/quick_start.md)
- [Usage Examples](../.claude/skills/peaks-hook-form/references/usage_example.md)

---

## ✨ 总结

本次更新为所有 6 个表单子组件添加了：

1. ✅ **横向布局支持**（`layout` 属性）
2. ✅ **必填标记控制**（`showRequiredMark` 属性）
3. ✅ **Label 宽度自定义**（`labelWidth` 属性）
4. ✅ **Skill 模板同步更新**

所有改动保持向后兼容，不影响现有代码，同时提供了更灵活的布局选项以适应不同场景需求。
