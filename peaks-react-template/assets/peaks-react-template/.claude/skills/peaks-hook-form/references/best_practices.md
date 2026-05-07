# Hook Form Best Practices

## Type Safety

**【强制】禁止使用 `any` 类型**

- 始终使用明确的 TypeScript 类型定义
- 使用具体的 interface 或 type 定义 props
- 使用 `unknown` 代替 `any` 当类型不确定时
- 事件处理函数使用明确的事件类型：
  - `React.ChangeEvent<HTMLInputElement>` 用于 input 事件
  - `React.ChangeEvent<HTMLSelectElement>` 用于 select 事件
  - 其他组件事件使用对应的类型
- 泛型组件使用类型约束而非 `any`

## Component Structure

### File Naming Convention

- Use PascalCase for component files: `HookInputFormItem.tsx`
- Component name should follow the pattern: `Hook[ComponentName]FormItem`

### Props Interface

- Extend the corresponding Ant Design component props
- Omit `value` and `onChange` since they're handled by React Hook Form
- Include required `prop` field for form field name
- Include optional `label`, `tooltip`, `placeholder`, and `required` fields

### Component Implementation

1. **Import Dependencies**:
   - Ant Design components and icons
   - React and React Hook Form utilities
   - TypeScript interfaces

2. **Use useFormContext**:
   - Access `control`, `trigger`, and `formState` from React Hook Form
   - This allows the component to integrate with the form context

3. **Controller Wrapper**:
   - Use `Controller` from React Hook Form to wrap the Ant Design component
   - Handle value changes and validation triggers

4. **Error Handling**:
   - Display validation errors using Ant Design's `Form.Item`
   - Use `validateStatus` and `help` props for error feedback

5. **Memoization**:
   - Use `memo` to optimize re-renders
   - This improves performance, especially in large forms

## Usage Examples

### Basic Input Component

```tsx
import { InputFormItem } from '@/components/hook-form/form-children/HookInputFormItem';

// Usage in a form
<InputFormItem
  prop="username"
  label="用户名"
  placeholder="请输入用户名"
  required
  tooltip="请输入您的用户名"
/>;
```

### Basic Select Component

```tsx
import { SelectFormItem } from '@/components/hook-form/form-children/HookSelectFormItem';

// Usage in a form
<SelectFormItem
  prop="role"
  label="角色"
  options={[
    { label: '管理员', value: 'admin' },
    { label: '用户', value: 'user' },
  ]}
  placeholder="请选择角色"
  required
/>;
```

## Validation

### Using React Hook Form Validation

```tsx
// In your form component
const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm({
  defaultValues: {
    username: '',
    email: '',
  },
});

// Define validation rules
const onSubmit = handleSubmit((data) => {
  console.log(data);
});

// In your form JSX
<FormContext value={{ control, formState: { errors }, trigger }}>
  <InputFormItem
    prop="username"
    label="用户名"
    placeholder="请输入用户名"
    required
  />
  <InputFormItem prop="email" label="邮箱" placeholder="请输入邮箱" required />
  <button type="submit" onClick={onSubmit}>
    提交
  </button>
</FormContext>;
```

## Performance Optimization

### Memoization

- Use `memo` for all form components to prevent unnecessary re-renders
- This is especially important in large forms with many fields

### Avoid Inline Functions

- Define event handlers outside of the render function when possible
- This prevents creating new function references on each render

### Use Form Context Efficiently

- Only access what you need from the form context
- This reduces the number of re-renders when the form state changes

## Accessibility

### Labels and Descriptions

- Always provide clear labels for form fields
- Use tooltips for additional information
- Ensure all form fields are properly associated with their labels

### Error Messages

- Display clear, concise error messages
- Position error messages close to the relevant field
- Use appropriate color and styling for error feedback

## Testing

### Unit Testing

- Test component rendering with different props
- Test error display and validation
- Test user interactions and form submission

### Integration Testing

- Test form components in the context of a complete form
- Test validation flows and error handling
- Test form submission with valid and invalid data

## Common Issues and Solutions

### Issue: Form fields not updating

**Solution:** Ensure you're using the `field.onChange` method from React Hook Form

### Issue: Validation errors not displaying

**Solution:** Make sure you're passing the `formState.errors` to the form context

### Issue: Component re-rendering too often

**Solution:** Use `memo` and avoid inline functions

### Issue: Select component not clearing properly

**Solution:** Handle empty values correctly in the `handleChange` function

## Conclusion

Following these best practices will help you create consistent, performant, and accessible form components using the form-children pattern. The generated components will integrate seamlessly with React Hook Form and Ant Design, providing a great user experience for form interactions.
