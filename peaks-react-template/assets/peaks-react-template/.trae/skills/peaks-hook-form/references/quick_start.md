# ⚡ 5 分钟快速开始

使用 peaks-hook-form 快速生成完整的 React Hook Form + Ant Design 表单！

## 🎯 一键生成（推荐）

### 第一步（1 分钟）：运行一键生成命令

```bash
cd /path/to/your/project

python3 /path/to/peaks-hook-form/scripts/quick_start.py \
  DatasetSettingsAntd \
  RagConfig \
  --fields '[
    {"name":"name","type":"string","label":"名称","required":true},
    {"name":"description","type":"string","label":"描述"},
    {"name":"apiUrl","type":"string","label":"API 地址","validation":"url"},
    {"name":"enabled","type":"boolean","label":"启用"}
  ]'
```

**自动生成：**

- ✅ Zod schema 文件（带验证规则和默认值）
- ✅ 完整的表单组件（带 memo 优化）
- ✅ 所有字段组件（Input、Switch 等）

### 第二步（2 分钟）：查看生成的文件

```
src/
├── components/
│   └── hook-form/
│       ├── schemas/
│       │   └── ragconfig.schema.ts       ← Schema + defaultValues
│       └── children/
│           ├── HookNameFormItem.tsx      ← 名称字段组件
│           ├── HookDescriptionFormItem.tsx ← 描述字段组件
│           ├── HookApiUrlFormItem.tsx    ← API 地址字段组件
│           └── HookEnabledFormItem.tsx   ← 启用开关组件
└── pages/
    └── DatasetSettingsAntd.tsx           ← 完整表单组件
```

### 第三步（2 分钟）：添加到路由并自定义

**1. 添加到路由**

```tsx
// routes.ts
{
  path: '/dataset-settings',
  element: <DatasetSettingsAntd />
}
```

**2. 导入字段组件**

```tsx
// DatasetSettingsAntd.tsx
import { HookNameFormItem as NameInput } from '@/components/hook-form/children/HookNameFormItem';
import { HookDescriptionFormItem as DescriptionInput } from '@/components/hook-form/children/HookDescriptionFormItem';
import { HookApiUrlFormItem as ApiUrlInput } from '@/components/hook-form/children/HookApiUrlFormItem';
import { HookEnabledFormItem as EnabledInput } from '@/components/hook-form/children/HookEnabledFormItem';
```

**3. 添加字段到表单**

```tsx
<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
  <NameInput
    prop="name"
    label="名称"
    placeholder="请输入名称"
    required
    tooltip="数据集的唯一标识"
  />

  <DescriptionInput prop="description" label="描述" placeholder="请输入描述" />

  <ApiUrlInput
    prop="apiUrl"
    label="API 地址"
    placeholder="请输入 API 地址"
    required
  />

  <EnabledInput prop="enabled" label="启用" />

  <Form.Item>
    <Button type="primary" htmlType="submit">
      提交
    </Button>
  </Form.Item>
</form>
```

**4. 实现提交逻辑**

```tsx
import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';

async function onSubmit(data: z.infer<typeof RagConfigSchema>) {
  try {
    await api.createDataset(data);
    message.success('创建成功');
  } catch (error) {
    message.error('创建失败');
  }
}
```

## 🎉 完成！

现在访问 `/dataset-settings` 即可看到完整的表单页面！

## 📖 下一步

- 查看 [完整使用指南](./usage_guide.md) 了解更多高级功能
- 查看 [最佳实践](./best_practices.md) 学习优化技巧
- 查看 [性能优化](./performance.md) 了解性能最佳实践

## 🆘 遇到问题？

### Q: 生成的组件不显示？

A: 检查是否正确导入了字段组件，确保路径正确

### Q: 验证不生效？

A: 确认 schema 中的字段名和表单组件的 prop 一致

### Q: 如何添加更多字段？

A: 重新运行 `quick_start.py` 命令，或者手动运行单个脚本生成

### Q: 如何修改默认值？

A: 编辑 schema 文件中的 `defaultValue` 对象

## 🎓 其他生成方式

### 方式 2：分步生成

如果需要对每个步骤有更多控制，可以分步执行：

```bash
# 1. 生成 schema
python3 scripts/generate_zod_schema.py complex RagConfig --fields '[...]'

# 2. 生成表单模板
python3 scripts/create_form_template.py DatasetSettingsAntd RagConfig --fields name description

# 3. 生成字段组件
python3 scripts/generate_form_component.py input Name --output-dir src/components/hook-form/children
```

### 方式 3：使用现有 schema

如果 schema 已存在，只需生成组件：

```bash
# 生成表单模板（使用现有 schema）
python3 scripts/create_form_template.py MyForm ExistingSchema --fields field1 field2

# 生成字段组件
python3 scripts/generate_form_component.py input Field1 --output-dir src/components/hook-form/children
```

---

**Happy Coding!** 🚀
