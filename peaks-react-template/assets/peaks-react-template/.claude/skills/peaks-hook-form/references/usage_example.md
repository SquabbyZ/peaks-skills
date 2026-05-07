# Complete Usage Example

This document demonstrates how to use all three scripts together to create a complete form with validation.

## Example: Creating a RAG Config Form

### Step 1: Setup Directory Structure

```bash
cd /path/to/your/project
python3 scripts/setup_hook_form_dirs.py
```

This creates:

```
src/components/hook-form/
├── schemas/
│   └── .gitkeep
└── children/
    └── .gitkeep
```

### Step 2: Generate Zod Schema

```bash
python3 scripts/generate_zod_schema.py complex RagConfig --fields '[
  {"name":"name","type":"string","validation":"min","min_length":"1","message":"请输入名称"},
  {"name":"description","type":"string","validation":"min","min_length":"1","message":"请输入描述"},
  {"name":"apiUrl","type":"string","validation":"url","message":"请输入有效的 API URL"},
  {"name":"maxTokens","type":"number"},
  {"name":"enabled","type":"boolean"}
]'
```

This generates `src/components/hook-form/schemas/ragconfig.schema.ts`:

```typescript
import { z } from 'zod';

export const RagConfigSchema = z.object({
  name: z.string().min(1, {
    message: '请输入名称',
  }),
  description: z.string().min(1, {
    message: '请输入描述',
  }),
  apiUrl: z.string().url({
    message: '请输入有效的 API URL',
  }),
  maxTokens: z.number({
    message: '请输入有效的数字',
  }),
  enabled: z.boolean(),
});

export type RagConfig = z.infer<typeof RagConfigSchema>;
```

### Step 3: Generate Form Components

```bash
# Generate Input component for name
python3 scripts/generate_form_component.py input Name --output-dir src/components/hook-form/children

# Generate Input component for description
python3 scripts/generate_form_component.py input Description --output-dir src/components/hook-form/children

# Generate Input component for apiUrl
python3 scripts/generate_form_component.py input ApiUrl --output-dir src/components/hook-form/children

# Generate NumberInput component for maxTokens
python3 scripts/generate_form_component.py input MaxTokens --output-dir src/components/hook-form/children

# Generate Switch component for enabled
python3 scripts/generate_form_component.py input Enabled --output-dir src/components/hook-form/children
```

### Step 4: Use in Your Form

```tsx
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form } from 'antd';
import { RagConfigSchema } from '@/components/hook-form/schemas/ragconfig.schema';
import { InputFormItem as NameInput } from '@/components/hook-form/children/HookNameFormItem';
import { InputFormItem as DescriptionInput } from '@/components/hook-form/children/HookDescriptionFormItem';
import { InputFormItem as ApiUrlInput } from '@/components/hook-form/children/HookApiUrlFormItem';
import { InputFormItem as MaxTokensInput } from '@/components/hook-form/children/HookMaxTokensFormItem';
import { InputFormItem as EnabledInput } from '@/components/hook-form/children/HookEnabledFormItem';

export const RagConfigForm = () => {
  const methods = useForm<RagConfig>({
    resolver: zodResolver(RagConfigSchema),
    defaultValues: {
      name: '',
      description: '',
      apiUrl: '',
      maxTokens: 1000,
      enabled: true,
    },
  });

  const onSubmit = (data: RagConfig) => {
    console.log('Form submitted:', data);
  };

  return (
    <FormProvider {...methods}>
      <Form layout="vertical" onFinish={methods.handleSubmit(onSubmit)}>
        <NameInput prop="name" label="名称" placeholder="请输入名称" required />

        <DescriptionInput
          prop="description"
          label="描述"
          placeholder="请输入描述"
          required
        />

        <ApiUrlInput
          prop="apiUrl"
          label="API URL"
          placeholder="请输入 API URL"
          required
        />

        <MaxTokensInput
          prop="maxTokens"
          label="最大 Token 数"
          placeholder="请输入最大 Token 数"
          required
        />

        <EnabledInput prop="enabled" label="启用" placeholder="是否启用" />

        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Form>
    </FormProvider>
  );
};
```

## Tips

### 1. Component Naming

The generated components follow the pattern `Hook[ComponentName]FormItem`. You can rename them when importing:

```tsx
import { InputFormItem as NameInput } from '@/components/hook-form/children/HookNameFormItem';
```

### 2. Schema Composition

You can compose schemas from multiple files:

```typescript
import { z } from 'zod';
import { BaseConfigSchema } from './baseconfig.schema';

export const ExtendedSchema = BaseConfigSchema.extend({
  customField: z.string().min(1),
});
```

### 3. Type Safety

Always use the generated types:

```tsx
type FormData = z.infer<typeof RagConfigSchema>;
```

This ensures type safety between your schema and form components.
