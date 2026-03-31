#!/usr/bin/env python3
"""
Generate React Hook Form components with Ant Design integration based on the form-children pattern.
"""

import argparse
import os

def generate_input_component(component_name, output_dir):
    """Generate an Input Form Item component"""
    component_class_name = f"Hook{component_name}FormItem"
    props_interface_name = f"{component_name}FormItemProps"
    
    content = f"""import {{ InfoCircleOutlined }} from '@ant-design/icons';
import {{ Form, Input, InputProps, Tooltip }} from 'antd';
import {{ memo }} from 'react';
import {{ Controller, useFormContext }} from 'react-hook-form';

export interface {props_interface_name} extends Omit<InputProps, 'value' | 'onChange'> {{
  prop: string;
  label: string;
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}}

export const {component_class_name} = memo(
  ({{ prop, label, tooltip, placeholder, required, ...restInputProps }}: {props_interface_name}) => {{
    const {{ control, trigger, formState }} = useFormContext();

    return (
      <Controller
        name={{prop}}
        control={{control}}
        render={{{{ field }}}} => {{{{
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {{{{
            field.onChange(e);
            trigger(prop);
          }}}};

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              required={{required}}
              label={{
                <span className="text-base text-label whitespace-wrap">
                  {{label}}
                  {{tooltip && (
                    <Tooltip
                      className="cursor-pointer"
                      title={{tooltip}}
                    >
                      <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                    </Tooltip>
                  )}}
                </span>
              }}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={{error ? 'error' : ''}}
              help={{errorMessage}}
            >
              <Input
                {{{{...restInputProps}}}}
                {{{{...field}}}}
                onChange={{handleChange}}
                placeholder={{placeholder ?? '请输入'}}
                className="w-full"
                autoComplete="off"
                allowClear
              />
            </Form.Item>
          );
        }}}}
      />
    );
  }},
);
"""
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    with open(output_file, 'w') as f:
        f.write(content)
    print(f"Generated {output_file}")

def generate_select_component(component_name, output_dir):
    """Generate a Select Form Item component"""
    component_class_name = f"Hook{component_name}FormItem"
    props_interface_name = f"{component_name}FormItemProps"
    
    content = f"""import {{ InfoCircleOutlined }} from '@ant-design/icons';
import {{ Form, Select, SelectProps, Tooltip }} from 'antd';
import {{ memo }} from 'react';
import {{ Controller, useFormContext }} from 'react-hook-form';

export interface {props_interface_name} extends Omit<SelectProps, 'value' | 'onChange' | 'options'> {{
  prop: string;
  label?: string;
  options: SelectProps['options'];
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}}

export const {component_class_name} = memo(
  ({{ prop, label, tooltip, options, placeholder, required, ...restSelectProps }}: {props_interface_name}) => {{
    const {{ control, trigger, formState }} = useFormContext();

    return (
      <Controller
        name={{prop}}
        control={{control}}
        render={{{{ field }}}} => {{{{
          const displayValue = field.value === '' ? undefined : field.value;
          const handleChange = (value: unknown) => {{{{
            const finalValue = value === undefined || value === null ? '' : value;
            field.onChange(finalValue);
            trigger(prop);
          }}}};

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              label={{
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {{label}}
                    {{tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={{tooltip}}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={{tooltip}}
                  >
                    <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                  </Tooltip>
                ) : undefined
              }}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={{error ? 'error' : ''}}
              help={{errorMessage}}
              required={{required}}
            >
              <Select
                {{{{...restSelectProps}}}}
                value={{displayValue}}
                onChange={{handleChange}}
                options={{options}}
                placeholder={{placeholder ?? '请选择'}}
                className="w-full"
              />
            </Form.Item>
          );
        }}}}
      />
    );
  }},
);
"""
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    with open(output_file, 'w') as f:
        f.write(content)
    print(f"Generated {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Generate React Hook Form components with Ant Design integration')
    parser.add_argument('component_type', choices=['input', 'select'], help='Type of component to generate')
    parser.add_argument('component_name', help='Name of the component (e.g., MyInput)')
    parser.add_argument('--output-dir', default='./src/components/hook-form/form-children', help='Output directory for the generated component')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.component_type == 'input':
        generate_input_component(args.component_name, args.output_dir)
    elif args.component_type == 'select':
        generate_select_component(args.component_name, args.output_dir)
    
    print("Component generated successfully!")

if __name__ == '__main__':
    main()