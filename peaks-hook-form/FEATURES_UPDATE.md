# 表单组件 marginBottom 和 errorPosition 配置更新日志

## 📅 更新日期

2026-04-10

## 🎯 更新目标

为所有 `hook-form/children` 目录下的表单子组件添加：
1. **marginBottom** 配置项：自定义表单项底部外边距
2. **errorPosition** 配置项：支持两种错误提示位置（below/border）

---

## ✅ 已完成的组件

### 1. HookInputFormItem.tsx

**新增属性：**

```typescript
/** 底部外边距，默认使用 Ant Design Form.Item 的默认值（24px），可手动设置覆盖 */
marginBottom?: string | number;
/** 错误提示位置，默认 'below'（输入框下方），可选 'border'（输入框边框红色） */
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
// marginBottom 使用
<HookInputFormItem
  prop="name"
  label="姓名"
  marginBottom={16}  // 自定义间距
/>

// errorPosition: below（默认）
<HookInputFormItem
  prop="name"
  label="姓名"
  errorPosition="below"
/>

// errorPosition: border（紧凑模式）
<HookInputFormItem
  prop="name"
  label="姓名"
  errorPosition="border"
/>
```

---

### 2. HookSelectFormItem.tsx

**新增属性：**

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
<HookSelectFormItem
  prop="type"
  label="类型"
  options={options}
  marginBottom={12}
  errorPosition="border"
/>
```

---

### 3. HookSwitchFormItem.tsx

**新增属性：**

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
<HookSwitchFormItem
  prop="enabled"
  label="启用"
  marginBottom={8}
  errorPosition="border"
/>
```

---

### 4. HookTagFormItem.tsx

**新增属性：**

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
<HookTagFormItem
  prop="tags"
  label="标签"
  marginBottom={16}
  errorPosition="border"
/>
```

---

### 5. HookTextAreaFormItem.tsx

**新增属性：**

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
<HookTextAreaFormItem
  prop="description"
  label="描述"
  marginBottom={20}
  errorPosition="below"
/>
```

---

### 6. HookTextFormItem.tsx

**新增属性：**

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

**使用示例：**

```tsx
<HookTextFormItem
  prop="id"
  label="ID"
  marginBottom={12}
  errorPosition="border"
/>
```

---

## 🔧 技术实现细节

### 1. marginBottom 实现

```typescript
// Props 定义
marginBottom?: string | number;

// 使用方式
style={marginBottom !== undefined ? { marginBottom } : undefined}
```

**原理：**
- 类型为 `string | number`，支持数字（如 `16`）和字符串（如 `'1rem'`）
- 通过 `style` 属性传递给 `Form.Item`
- 当值为 `undefined` 时，使用 Ant Design 的默认值（24px）
- 不污染 `className`，保持样式独立性

---

### 2. errorPosition 实现

#### Mode 1: 'below'（默认模式）

```tsx
validateStatus={showError ? 'error' : ''}
help={
  errorPosition === 'below' && showError ? (
    <span className="text-red-500">{errorMessage}</span>
  ) : undefined
}
```

**特点：**
- 使用 Ant Design Form.Item 的 `help` 属性
- 错误文案显示在输入框**下方**
- 手动添加 `text-red-500` 确保文案为红色
- 占用额外空间

---

#### Mode 2: 'border'（紧凑模式）

```tsx
<div className="relative w-full">
  <Input className="w-full" />
  {errorPosition === 'border' && showError && errorMessage && (
    <div className="pointer-events-none absolute -top-2.5 left-2 bg-white px-1 text-xs text-red-500">
      {errorMessage}
    </div>
  )}
</div>
```

**特点：**
- 使用绝对定位将错误文案覆盖在输入框**左上角**
- 白色背景（`bg-white`）遮挡边框，形成类似缺口的效果
- 不改变 Input 原有的边框样式
- **不占用额外空间**，布局紧凑
- `pointer-events-none` 避免阻挡点击事件

**样式说明：**
- `absolute -top-2.5 left-2`: 定位在左上角
- `bg-white px-1`: 白色背景 + 左右内边距
- `text-xs text-red-500`: 小字号红色文案
- `pointer-events-none`: 不响应鼠标事件

---

### 3. 错误状态判断

```typescript
const error = fieldState.error;
const errorMessage = error?.message as string | undefined;
const showError =
  !!error &&
  (fieldState.isDirty || fieldState.isTouched || formState.isSubmitted);
```

**显示时机：**
- 字段被修改过（`isDirty`）
- 字段获得过焦点（`isTouched`）
- 表单已提交（`isSubmitted`）

---

## 📚 Skill 文档更新

### 更新文件

1. `.claude/skills/peaks-hook-form/SKILL.md`
   - 更新 InputFormItem 和 SelectFormItem 模板
   - 添加 `marginBottom` 和 `errorPosition` 属性定义
   - 更新代码示例

2. `.claude/skills/peaks-hook-form/references/usage_example.md`
   - 添加 "Advanced Usage" 章节
   - 详细说明 `errorPosition` 的两种模式
   - 提供 `marginBottom` 的使用示例

3. `.claude/skills/peaks-hook-form/FEATURES_UPDATE.md`（本文件）
   - 记录本次更新的所有内容
   - 提供技术实现细节
   - 包含使用场景和示例

---

## 💡 使用场景

### 场景 1：紧凑表格（border 模式 + 自定义间距）

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
      marginBottom={8}
      errorPosition="border"
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
      marginBottom={8}
      errorPosition="border"
    />
  </div>
</div>
```

### 场景 2：常规表单（below 模式 + 默认间距）

```tsx
<FormProvider {...methods}>
  <form>
    <HookInputFormItem
      prop="name"
      label="姓名"
      required
      errorPosition="below"
      // marginBottom 不传，使用默认值 24px
    />
    <HookSelectFormItem
      prop="role"
      label="角色"
      options={roles}
      errorPosition="below"
    />
    <HookTextAreaFormItem
      prop="bio"
      label="简介"
      errorPosition="below"
    />
  </form>
</FormProvider>
```

### 场景 3：配置面板（border 模式 + 紧凑间距）

```tsx
<div className="space-y-4">
  <HookSwitchFormItem
    prop="enabled"
    label="启用功能"
    layout="horizontal"
    labelWidth={100}
    marginBottom={12}
    errorPosition="border"
  />
  <HookSelectFormItem
    prop="mode"
    label="运行模式"
    options={modes}
    layout="horizontal"
    labelWidth={100}
    marginBottom={12}
    errorPosition="border"
  />
</div>
```

### 场景 4：混合使用

```tsx
<div className="space-y-6">
  {/* 重要字段使用 below 模式，确保错误提示明显 */}
  <HookInputFormItem
    prop="email"
    label="邮箱"
    required
    errorPosition="below"
    marginBottom={24}
  />

  {/* 次要字段使用 border 模式，节省空间 */}
  <HookInputFormItem
    prop="nickname"
    label="昵称"
    errorPosition="border"
    marginBottom={16}
  />

  {/* 多选字段使用 border 模式 */}
  <HookTagFormItem
    prop="tags"
    label="标签"
    errorPosition="border"
    marginBottom={16}
  />
</div>
```

---

## ⚠️ 注意事项

### 1. 向后兼容

所有新属性都有默认值，现有代码无需修改：

- `marginBottom = undefined`（使用 Form.Item 默认值 24px）
- `errorPosition = 'below'`

### 2. 类型安全

所有新增属性都是可选的，TypeScript 类型检查完全通过：

```typescript
marginBottom?: string | number;
errorPosition?: 'below' | 'border';
```

### 3. Prettier 格式化

所有文件已通过 Prettier 格式化，无 lint 错误。

### 4. 性能优化

所有组件都使用 `memo` 包裹，避免不必要的重渲染。

### 5. 'border' 模式限制

- 错误文案使用白色背景遮挡边框，如果输入框背景不是白色，可能需要调整
- 文案长度过长时可能溢出，建议错误文案保持简短
- 适用于 Input、Select、TextArea、Switch、Tag、Text 等所有表单组件

---

## 🎨 视觉效果对比

### 'below' 模式（默认）

```
┌─────────────────────┐
│ Label               │
├─────────────────────┤
│ [Input Field]       │
│ Error message here  │  ← 占用额外空间
└─────────────────────┘
```

### 'border' 模式（紧凑）

```
┌──Error message──────┐  ← 文案覆盖在边框上
│ [Input Field]       │
└─────────────────────┘
```

---

## 📖 相关文档

- [peaks-hook-form SKILL.md](../SKILL.md)
- [Horizontal Layout Update](./HORIZONTAL_LAYOUT_UPDATE.md)
- [Quick Start Guide](./references/quick_start.md)
- [Usage Examples](./references/usage_example.md)

---

## ✨ 总结

本次更新为所有 6 个表单子组件添加了：

1. ✅ **底部外边距自定义**（`marginBottom` 属性）
   - 支持 `string | number` 类型
   - 默认使用 Ant Design Form.Item 的默认值（24px）
   - 可手动覆盖以适应不同场景

2. ✅ **错误提示位置配置**（`errorPosition` 属性）
   - `'below'` 模式：错误文案显示在输入框下方（默认）
   - `'border'` 模式：错误文案显示在输入框左上角（紧凑）
   - 两种模式都支持红色错误文案

3. ✅ **Skill 模板同步更新**
   - SKILL.md 中的组件模板已更新
   - usage_example.md 添加了高级用法示例
   - 本文件详细记录了技术实现细节

所有改动保持向后兼容，不影响现有代码，同时提供了更灵活的样式选项以适应不同场景需求。
