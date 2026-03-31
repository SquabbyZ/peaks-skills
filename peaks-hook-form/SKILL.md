---
name: peaks-hook-form
description: Generate React Hook Form + Ant Design forms with one command. Includes Zod validation, memo-optimized components, and complete form templates. Use when needing to quickly create production-ready forms with minimal setup.
---

# Hook Form Generator

## ⚡ Quick Start (5 minutes)

**One command to generate everything:**

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

This generates:

- ✅ Zod schema with validation rules and defaultValues
- ✅ Complete form component with memo optimization
- ✅ All field components (Input, Select, Switch, etc.)
- ✅ TypeScript types and imports

📖 **See [Quick Start Guide](./references/quick_start.md) for detailed instructions.**

## Directory Structure Setup

**Optional**: Only needed if you want to manually create directories.

```bash
python3 scripts/setup_hook_form_dirs.py
```

This creates:

```
src/components/hook-form/
├── schemas/          # Zod schema files
└── children/         # Form field components
```

**Note**: The `quick_start.py` script automatically creates these directories for you!

## Scripts

### 🚀 quick_start.py (Recommended)

Generate complete form with one command:

```bash
python3 scripts/quick_start.py FormName SchemaName --fields '[{"name":"field1","type":"string"}]'
```

**Features:**

- Generates schema + form template + all field components
- Auto-detects field types (string→Input, boolean→Switch, etc.)
- Creates directories automatically
- Shows clear progress and next steps

### 📝 generate_zod_schema.py

Generate Zod schema with validation and defaultValues:

```bash
# Simple mode
python3 scripts/generate_zod_schema.py simple SchemaName fieldName

# Complex mode
python3 scripts/generate_zod_schema.py complex SchemaName --fields '[{"name":"field1","type":"string"}]'
```

### 📄 create_form_template.py

Generate form component template:

```bash
python3 scripts/create_form_template.py FormName SchemaName --fields field1 field2
```

### 🧩 generate_form_component.py

Generate individual field components:

```bash
# Input component
python3 scripts/generate_form_component.py input FieldName --output-dir src/components/hook-form/children

# Select component
python3 scripts/generate_form_component.py select FieldName --output-dir src/components/hook-form/children
```

## Documentation

- **[Quick Start Guide](./references/quick_start.md)** - 5 分钟快速开始
- **[Usage Guide](./references/usage_guide.md)** - Complete usage instructions
- **[Prompt Templates](./references/prompt_templates.md)** - Ready-to-use prompt templates for AI agents ⭐
- **[Best Practices](./references/best_practices.md)** - Development best practices
- **[Performance Guide](./references/performance.md)** - Performance optimization
- **[Usage Examples](./references/usage_example.md)** - Real-world examples
- **[Optimization Summary](./references/optimization_summary.md)** - Overview of all optimizations

## Component Templates

### Type Safety Rules

**【强制】禁止使用 `any` 类型** - 必须使用明确的类型定义：

- 使用具体的 interface 或 type
- 使用 `unknown` 代替 `any` 当类型不确定时
- 使用泛型约束而非 `any`
- 事件处理函数使用明确的事件类型（如 `React.ChangeEvent<HTMLInputElement>`）

### Input Form Item

```tsx
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input, InputProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface InputFormItemProps extends Omit<
  InputProps,
  'value' | 'onChange'
> {
  prop: string;
  label: string;
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const InputFormItem = memo(
  ({
    prop,
    label,
    tooltip,
    placeholder,
    required,
    ...restInputProps
  }: InputFormItemProps) => {
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

### Select Form Item

```tsx
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select, SelectProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface SelectFormItemProps extends Omit<
  SelectProps,
  'value' | 'onChange' | 'options'
> {
  prop: string;
  label?: string;
  options: SelectProps['options'];
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const SelectFormItem = memo(
  ({
    prop,
    label,
    tooltip,
    options,
    placeholder,
    required,
    ...restSelectProps
  }: SelectFormItemProps) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const displayValue = field.value === '' ? undefined : field.value;
          const handleChange = (value: unknown) => {
            const finalValue =
              value === undefined || value === null ? '' : value;
            field.onChange(finalValue);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              label={
                label ? (
                  <span className="text-label whitespace-wrap text-base">
                    {label}
                    {tooltip && (
                      <Tooltip className="cursor-pointer" title={tooltip}>
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip className="cursor-pointer" title={tooltip}>
                    <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                  </Tooltip>
                ) : undefined
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={error ? 'error' : ''}
              help={errorMessage}
              required={required}
            >
              <Select
                {...restSelectProps}
                value={displayValue}
                onChange={handleChange}
                options={options}
                placeholder={placeholder ?? '请选择'}
                className="w-full"
              />
            </Form.Item>
          );
        }}
      />
    );
  },
);
```

## Supported Component Types

The form-children pattern supports various Ant Design components:

- **Input**: Text input fields
- **Select**: Dropdown select menus
- **Textarea**: Multi-line text inputs
- **NumberInput**: Numeric input fields
- **Switch**: Toggle switches
- **Slider**: Range sliders
- **Avatar**: Image upload for avatars
- **Tag**: Tag creation and editing
- **DelimiterInput**: Input with delimiter support

## Usage Guidelines

### Step 1: Setup Directory Structure

Before generating components, run the setup script to create the required directories:

```bash
cd /path/to/your/project
python3 /path/to/peaks-hook-form/scripts/setup_hook_form_dirs.py
```

Or if the script is in your project:

```bash
python3 scripts/setup_hook_form_dirs.py
```

This creates:

```
src/components/hook-form/
├── schemas/          # Form validation schemas and types
└── children/         # Form field components (Hook*FormItem.tsx)
```

### Step 2: Generate Components

Use the generate_form_component.py script to create new form components:

```bash
# Generate an Input form component
python3 scripts/generate_form_component.py input Username --output-dir src/components/hook-form/children

# Generate a Select form component
python3 scripts/generate_form_component.py select Role --output-dir src/components/hook-form/children
```

### Step 3: Generate Zod Schema (Optional)

If you need to create form validation schemas, use the generate_zod_schema.py script:

```bash
# Simple mode - generate schema with single field
python3 scripts/generate_zod_schema.py simple RagConfig name

# Complex mode - generate schema with multiple fields
python3 scripts/generate_zod_schema.py complex UserForm --fields '[{"name":"username","type":"string","validation":"min","min_length":"3"},{"name":"email","type":"string","validation":"email"}]'
```

This creates schema files in `src/components/hook-form/schemas/`:

```typescript
// ragconfig.schema.ts
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

**Note**: The script automatically generates a `defaultValue` export that matches your schema fields!

### Step 4: Create Form Template (Optional)

Use the create_form_template.py script to create a complete form component with React Hook Form integration and memo optimization:

```bash
# Create a form template
python3 scripts/create_form_template.py DatasetSettingsAntd RagConfig --fields name description apiUrl

# Create in specific directory
python3 scripts/create_form_template.py UserSettings UserForm --fields username email --output-dir src/pages/settings
```

This generates a complete form component with memo optimization:

```tsx
// DatasetSettingsAntd.tsx
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

**Performance Optimization**: The component is wrapped with `memo()` to prevent unnecessary re-renders and improve performance.

#### Supported Field Types

- **string**: Text fields with optional validation (`min`, `email`, `url`)
- **number**: Numeric fields
- **boolean**: Checkbox/switch fields
- **array**: Array fields
- **enum**: Enum fields with predefined values

#### Field Validation Options

- `min`: Minimum length for strings (requires `min_length`)
- `email`: Email format validation
- `url`: URL format validation
- `enum_values`: Array of allowed values for enum type

### Component Guidelines

1. **Component Naming**: Use the pattern `Hook[ComponentName]FormItem`
2. **Props Interface**: Extend the corresponding Ant Design props, omitting value and onChange
3. **Form Integration**: Always use Controller from React Hook Form
4. **Error Handling**: Consistently display errors using Ant Design's Form.Item
5. **Performance**: Use memo to optimize re-renders
6. **Consistency**: Maintain consistent styling and behavior across all form components

## Resources

### scripts/

- `setup_hook_form_dirs.py`: Automatically creates the required directory structure
- `generate_form_component.py`: Generates form components (Input, Select, etc.) based on templates
- `generate_zod_schema.py`: Generates Zod validation schema files with defaultValues export
- `create_form_template.py`: Creates complete form component template with React Hook Form integration

### references/

Includes detailed documentation on component patterns and best practices:

- `best_practices.md`: Component development best practices
- `usage_example.md`: Complete usage examples showing schema and component integration
- `usage_guide.md`: Comprehensive usage guide with step-by-step instructions and examples
- `performance.md`: Performance optimization guide for React Hook Form components

### assets/

Stores template files and code snippets for component generation.
