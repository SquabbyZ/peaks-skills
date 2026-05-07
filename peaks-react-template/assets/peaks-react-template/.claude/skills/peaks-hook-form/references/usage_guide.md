# peaks-hook-form 使用指南

## 📖 简介

peaks-hook-form 是一个用于快速生成 React Hook Form + Ant Design + Zod 验证的完整表单解决方案的技能。

**核心特性：**

- ✅ 一键生成完整表单（推荐）
- ✅ 自动生成 Zod schema（带 defaultValues）
- ✅ 自动生成表单组件模板（memo 优化）
- ✅ 自动生成 Ant Design 表单字段组件
- ✅ 自动创建项目目录结构

## 🚀 快速开始（5 分钟）

**推荐使用一键生成命令：**

```bash
python3 scripts/quick_start.py \
  DatasetSettingsAntd \
  RagConfig \
  --fields '[
    {"name":"name","type":"string","label":"名称","required":true},
    {"name":"description","type":"string","label":"描述"},
    {"name":"apiUrl","type":"string","label":"API 地址","validation":"url"},
    {"name":"enabled","type":"boolean","label":"启用"}
  ]'
```

**详细说明请查看 [5 分钟快速开始指南](./quick_start.md)**

---

## 📁 目录结构

使用本技能前，建议先了解生成的文件结构：

```
src/
├── components/
│   ├── hook-form/
│   │   ├── schemas/              # Zod schema 文件目录
│   │   │   ├── ragconfig.schema.ts
│   │   │   └── userform.schema.ts
│   │   └── children/             # 表单字段组件目录
│   │       ├── HookNameFormItem.tsx
│   │       └── HookEmailFormItem.tsx
│   └── DatasetSettingsAntd.tsx   # 表单组件模板
```

## 🚀 快速开始

### 步骤 1: 设置目录结构

首次使用时，先创建必要的目录结构：

```bash
cd /path/to/your/project
python3 /path/to/peaks-hook-form/scripts/setup_hook_form_dirs.py
```

输出示例：

```
✓ Created: /path/to/project/src/components/hook-form
✓ Created: /path/to/project/src/components/hook-form/schemas
✓ Created: /path/to/project/src/components/hook-form/children
✓ Created: /path/to/project/src/components/hook-form/schemas/.gitkeep
✓ Created: /path/to/project/src/components/hook-form/children/.gitkeep

✓ Successfully created 3 directories
```

### 步骤 2: 生成 Zod Schema

生成包含验证规则和默认值的 schema 文件：

#### 简单模式（单字段）

```bash
python3 scripts/generate_zod_schema.py simple RagConfig name
```

生成的 `ragconfig.schema.ts`：

```typescript
import { z } from 'zod';

export const RagConfigSchema = z.object({
  name: z.string().min(1, {
    message: '请输入 name',
  }),
});

export type RagConfig = z.infer<typeof RagConfigSchema>;

export const defaultValue: RagConfig = {
  name: '',
};
```

#### 复杂模式（多字段）

```bash
python3 scripts/generate_zod_schema.py complex UserForm --fields '[
  {
    "name": "username",
    "type": "string",
    "validation": "min",
    "min_length": "3",
    "message": "用户名至少 3 个字符"
  },
  {
    "name": "email",
    "type": "string",
    "validation": "email"
  },
  {
    "name": "age",
    "type": "number"
  },
  {
    "name": "enabled",
    "type": "boolean"
  }
]'
```

生成的 `userform.schema.ts`：

```typescript
import { z } from 'zod';

export const UserFormSchema = z.object({
  username: z.string().min(3, {
    message: '用户名至少 3 个字符',
  }),
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
  age: z.number({
    message: '请输入有效的数字',
  }),
  enabled: z.boolean(),
});

export type UserForm = z.infer<typeof UserFormSchema>;

export const defaultValue: UserForm = {
  username: '',
  email: '',
  age: 0,
  enabled: false,
};
```

### 步骤 3: 创建表单组件模板

使用 schema 生成完整的表单组件（已优化性能）：

```bash
python3 scripts/create_form_template.py DatasetSettingsAntd RagConfig --fields name description apiUrl
```

生成的 `DatasetSettingsAntd.tsx`：

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { memo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  defaultValue,
  RagConfigSchema,
} from '@/components/hook-form/schemas/ragconfig.schema';

function DatasetSettingsAntd() {
  const form = useForm<z.infer<typeof RagConfigSchema>>({
    resolver: zodResolver(RagConfigSchema),
    defaultValues: defaultValue,
  });

  const name = useWatch({
    control: form.control,
    name: 'name',
  });

  async function onSubmit(data: z.infer<typeof RagConfigSchema>) {
    console.log('🚀 ~ DatasetSettingsAntd ~ data:', data);
  }

  return (
    <section className="flex h-full flex-col p-5">
      <div className="flex min-h-0 flex-1 gap-14">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-6"
          >
            {/* TODO: Add form fields here */}
          </form>
        </FormProvider>
      </div>
    </section>
  );
}

export default memo(DatasetSettingsAntd);
```

**性能优化**：生成的组件使用 `memo()` 包装，可以防止不必要的重新渲染，提高性能。

### 步骤 4: 生成表单字段组件

为每个字段生成 Ant Design 表单组件：

```bash
# 生成 Input 字段组件
python3 scripts/generate_form_component.py input Name --output-dir src/components/hook-form/children

# 生成 Select 字段组件
python3 scripts/generate_form_component.py select Role --output-dir src/components/hook-form/children
```

生成的 `HookNameFormItem.tsx`：

```tsx
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input, InputProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface NameFormItemProps extends Omit<
  InputProps,
  'value' | 'onChange'
> {
  prop: string;
  label: string;
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const HookNameFormItem = memo(
  ({
    prop,
    label,
    tooltip,
    placeholder,
    required,
    ...restInputProps
  }: NameFormItemProps) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            field.onChange(e);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              required={required}
              label={
                <span className="text-label whitespace-wrap text-base">
                  {label}
                  {tooltip && (
                    <Tooltip className="cursor-pointer" title={tooltip}>
                      <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                    </Tooltip>
                  )}
                </span>
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={error ? 'error' : ''}
              help={errorMessage}
            >
              <Input
                {...restInputProps}
                {...field}
                onChange={handleChange}
                placeholder={placeholder ?? '请输入'}
                className="w-full"
                autoComplete="off"
                allowClear
              />
            </Form.Item>
          );
        }}
      />
    );
  },
);
```

### 步骤 5: 组装完整表单

将生成的字段组件添加到表单模板中：

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button, Form } from 'antd';
import {
  defaultValue,
  RagConfigSchema,
} from '@/components/hook-form/schemas/ragconfig.schema';
import { HookNameFormItem as NameInput } from '@/components/hook-form/children/HookNameFormItem';
import { HookDescriptionFormItem as DescriptionInput } from '@/components/hook-form/children/HookDescriptionFormItem';
import { HookApiUrlFormItem as ApiUrlInput } from '@/components/hook-form/children/HookApiUrlFormItem';

export default function DatasetSettingsAntd() {
  const form = useForm<z.infer<typeof RagConfigSchema>>({
    resolver: zodResolver(RagConfigSchema),
    defaultValues: defaultValue,
  });

  const name = useWatch({
    control: form.control,
    name: 'name',
  });

  async function onSubmit(data: z.infer<typeof RagConfigSchema>) {
    console.log('🚀 ~ DatasetSettingsAntd ~ data:', data);
    // TODO: 实现提交逻辑
  }

  return (
    <section className="flex h-full flex-col p-5">
      <div className="flex min-h-0 flex-1 gap-14">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-6"
          >
            <NameInput
              prop="name"
              label="名称"
              placeholder="请输入名称"
              required
              tooltip="请输入 RAG 配置的名称"
            />

            <DescriptionInput
              prop="description"
              label="描述"
              placeholder="请输入描述"
              required
            />

            <ApiUrlInput
              prop="apiUrl"
              label="API 地址"
              placeholder="请输入 API 地址"
              required
            />

            <Form.Item>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </form>
        </FormProvider>
      </div>
    </section>
  );
}
```

## 📚 支持的字段类型

### Zod Schema 支持的类型

| 类型      | 说明     | 默认值       |
| --------- | -------- | ------------ |
| `string`  | 文本字段 | `''`         |
| `number`  | 数字字段 | `0`          |
| `boolean` | 布尔字段 | `false`      |
| `array`   | 数组字段 | `[]`         |
| `enum`    | 枚举字段 | 第一个枚举值 |

### 验证规则

| 验证类型 | 说明         | 参数         |
| -------- | ------------ | ------------ |
| `min`    | 最小长度验证 | `min_length` |
| `email`  | 邮箱格式验证 | 无           |
| `url`    | URL 格式验证 | 无           |

## 🔧 脚本参数说明

### generate_zod_schema.py

```bash
# 简单模式
python3 scripts/generate_zod_schema.py simple <schema_name> <field_name>

# 复杂模式
python3 scripts/generate_zod_schema.py complex <schema_name> --fields '<JSON 数组>'

# 指定输出目录
python3 scripts/generate_zod_schema.py simple RagConfig name --output-dir ./custom/schemas
```

参数说明：

- `mode`: 生成模式（simple 或 complex）
- `schema_name`: Schema 名称（如 RagConfig, UserForm）
- `field_name`: 字段名称（简单模式）
- `--fields`: JSON 格式的字段定义数组（复杂模式）
- `--output-dir`: 输出目录（默认：./src/components/hook-form/schemas）

### create_form_template.py

```bash
python3 scripts/create_form_template.py <component_name> <schema_name> --fields <字段列表>
```

参数说明：

- `component_name`: 组件名称（如 DatasetSettingsAntd）
- `schema_name`: Schema 名称（如 RagConfig）
- `--fields`: 需要 watch 的字段列表（默认：name）
- `--output-dir`: 输出目录（默认：./src/components）

### generate_form_component.py

```bash
# 生成 Input 组件
python3 scripts/generate_form_component.py input <component_name> --output-dir <输出目录>

# 生成 Select 组件
python3 scripts/generate_form_component.py select <component_name> --output-dir <输出目录>
```

参数说明：

- `component_type`: 组件类型（input 或 select）
- `component_name`: 组件名称
- `--output-dir`: 输出目录（默认：./src/components/hook-form/form-children）

## 💡 最佳实践

### 1. 命名规范

- **Schema 文件**: 小写 + schema 后缀，如 `ragconfig.schema.ts`
- **Schema 类型**: PascalCase + Schema 后缀，如 `RagConfigSchema`
- **组件文件**: Hook + 字段名 + FormItem.tsx，如 `HookNameFormItem.tsx`
- **组件导出**: Hook + 字段名 + FormItem，如 `HookNameFormItem`

### 2. 导入规范

```typescript
// 导入 schema 和 defaultValue
import {
  defaultValue,
  RagConfigSchema,
} from '@/components/hook-form/schemas/ragconfig.schema';

// 导入表单组件
import { HookNameFormItem as NameInput } from '@/components/hook-form/children/HookNameFormItem';
```

### 3. 类型安全

始终使用 schema 生成的类型：

```typescript
// ✅ 推荐
type FormData = z.infer<typeof RagConfigSchema>;

// ❌ 避免手动定义类型
interface FormData {
  name: string;
  email: string;
}
```

### 4. 默认值使用

使用 schema 生成的 `defaultValue`：

```typescript
const form = useForm<z.infer<typeof RagConfigSchema>>({
  resolver: zodResolver(RagConfigSchema),
  defaultValues: defaultValue, // ✅ 使用生成的默认值
});
```

### 5. 表单验证

```typescript
// 在 schema 中定义验证规则
export const UserFormSchema = z.object({
  username: z.string().min(3, {
    message: '用户名至少 3 个字符',
  }),
  email: z.string().email({
    message: '请输入有效的邮箱地址',
  }),
});

// 表单会自动显示验证错误
<NameInput
  prop="username"
  label="用户名"
  required
  tooltip="至少 3 个字符"
/>
```

## 🎯 完整示例

### 用户注册表单

```bash
# 1. 生成 schema
python3 scripts/generate_zod_schema.py complex UserRegister --fields '[
  {"name":"username","type":"string","validation":"min","min_length":"3","message":"用户名至少 3 个字符"},
  {"name":"email","type":"string","validation":"email"},
  {"name":"password","type":"string","validation":"min","min_length":"6","message":"密码至少 6 个字符"},
  {"name":"confirmPassword","type":"string"},
  {"name":"agree","type":"boolean"}
]'

# 2. 生成表单模板
python3 scripts/create_form_template.py UserRegisterForm UserRegister --fields username email

# 3. 生成字段组件
python3 scripts/generate_form_component.py input Username --output-dir src/components/hook-form/children
python3 scripts/generate_form_component.py input Email --output-dir src/components/hook-form/children
python3 scripts/generate_form_component.py input Password --output-dir src/components/hook-form/children
```

## ⚠️ 常见问题

### Q: 如何修改默认值？

A: 直接编辑 schema 文件中的 `defaultValue` 对象：

```typescript
export const defaultValue: RagConfig = {
  name: '默认名称', // 修改默认值
  age: 18,
};
```

### Q: 如何添加自定义验证规则？

A: 在 schema 文件中手动添加验证规则：

```typescript
export const UserFormSchema = z.object({
  username: z.string().min(3),
  // 添加自定义验证
  password: z
    .string()
    .refine((val) => /[A-Z]/.test(val), { message: '密码必须包含大写字母' }),
});
```

### Q: 如何修改组件样式？

A: 编辑 `children/` 目录下对应的组件文件，修改 className 或添加新的样式属性。

### Q: 如何添加新的字段类型？

A: 修改 `generate_zod_schema.py` 脚本，在字段类型判断中添加新的类型处理逻辑。

## 📝 更新日志

- ✅ 自动生成 Zod schema（包含 defaultValues）
- ✅ 自动生成表单组件模板
- ✅ 自动生成 Ant Design 表单字段组件
- ✅ 自动创建项目目录结构

## 🎓 学习资源

- [React Hook Form 官方文档](https://react-hook-form.com/)
- [Zod 官方文档](https://zod.dev/)
- [Ant Design 表单组件](https://ant.design/components/form-cn)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)

---

**Happy Coding!** 🎉
