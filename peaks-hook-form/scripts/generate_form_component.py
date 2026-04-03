#!/usr/bin/env python3
"""
Generate React Hook Form components with Ant Design integration based on the form-children pattern.
"""

import argparse
import os

def generate_input_component(output_dir):
    """Generate a generic Input Form Item component"""
    component_class_name = "HookInputFormItem"
    props_interface_name = "HookInputFormItemProps"
    
    content = """import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input, InputProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface __PROPS_INTERFACE_NAME__ extends Omit<InputProps, 'value' | 'onChange'> {
  prop: string;
  label?: string;
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const __COMPONENT_CLASS_NAME__ = memo(
  ({ prop, label, tooltip, placeholder, required, ...restInputProps }: __PROPS_INTERFACE_NAME__) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            field.onChange(e.target.value);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              required={required}
              label={
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {label}
                    {tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={tooltip}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={tooltip}
                  >
                    <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                  </Tooltip>
                ) : undefined
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
""".replace('__PROPS_INTERFACE_NAME__', props_interface_name).replace('__COMPONENT_CLASS_NAME__', component_class_name)
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"Generated {output_file}")
    else:
        print(f"Component {output_file} already exists, skipping.")
    return output_file

def generate_select_component(output_dir):
    """Generate a generic Select Form Item component"""
    component_class_name = "HookSelectFormItem"
    props_interface_name = "HookSelectFormItemProps"
    
    content = """import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select, SelectProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface __PROPS_INTERFACE_NAME__ extends Omit<SelectProps, 'value' | 'onChange'> {
  prop: string;
  label?: string;
  options: SelectProps['options'];
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const __COMPONENT_CLASS_NAME__ = memo(
  ({ prop, label, tooltip, options, placeholder, required, ...restSelectProps }: __PROPS_INTERFACE_NAME__) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const displayValue = field.value === '' ? undefined : field.value;
          const handleChange = (value: unknown) => {
            const finalValue = value === undefined || value === null ? '' : value;
            field.onChange(finalValue);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              label={
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {label}
                    {tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={tooltip}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={tooltip}
                  >
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
""".replace('__PROPS_INTERFACE_NAME__', props_interface_name).replace('__COMPONENT_CLASS_NAME__', component_class_name)
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"Generated {output_file}")
    else:
        print(f"Component {output_file} already exists, skipping.")
    return output_file

def generate_switch_component(output_dir):
    """Generate a generic Switch Form Item component"""
    component_class_name = "HookSwitchFormItem"
    props_interface_name = "HookSwitchFormItemProps"
    
    content = """import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Switch, SwitchProps, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface __PROPS_INTERFACE_NAME__ extends Omit<SwitchProps, 'checked' | 'onChange'> {
  prop: string;
  label?: string;
  tooltip?: string;
  required?: boolean;
}

export const __COMPONENT_CLASS_NAME__ = memo(
  ({ prop, label, tooltip, required, ...restSwitchProps }: __PROPS_INTERFACE_NAME__) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const handleChange = (checked: boolean) => {
            field.onChange(checked);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              label={
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {label}
                    {tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={tooltip}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={tooltip}
                  >
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
              <Switch
                {...restSwitchProps}
                checked={field.value}
                onChange={handleChange}
              />
            </Form.Item>
          );
        }}
      />
    );
  },
);
""".replace('__PROPS_INTERFACE_NAME__', props_interface_name).replace('__COMPONENT_CLASS_NAME__', component_class_name)
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"Generated {output_file}")
    else:
        print(f"Component {output_file} already exists, skipping.")
    return output_file

def generate_textarea_component(output_dir):
    """Generate a generic TextArea Form Item component"""
    component_class_name = "HookTextAreaFormItem"
    props_interface_name = "HookTextAreaFormItemProps"
    
    content = """import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface __PROPS_INTERFACE_NAME__ extends Omit<React.ComponentProps<typeof Input.TextArea>, 'value' | 'onChange'> {
  prop: string;
  label?: string;
  tooltip?: string;
  placeholder?: string;
  required?: boolean;
}

export const __COMPONENT_CLASS_NAME__ = memo(
  ({ prop, label, tooltip, placeholder, required, ...restTextAreaProps }: __PROPS_INTERFACE_NAME__) => {
    const { control, trigger, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            field.onChange(e.target.value);
            trigger(prop);
          };

          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              required={required}
              label={
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {label}
                    {tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={tooltip}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={tooltip}
                  >
                    <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                  </Tooltip>
                ) : undefined
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={error ? 'error' : ''}
              help={errorMessage}
            >
              <Input.TextArea
                {...restTextAreaProps}
                {...field}
                onChange={handleChange}
                placeholder={placeholder ?? '请输入'}
                className="w-full"
                autoComplete="off"
                allowClear
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          );
        }}
      />
    );
  },
);
""".replace('__PROPS_INTERFACE_NAME__', props_interface_name).replace('__COMPONENT_CLASS_NAME__', component_class_name)
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"Generated {output_file}")
    else:
        print(f"Component {output_file} already exists, skipping.")
    return output_file

def generate_text_component(output_dir):
    """Generate a generic Text Form Item component (Display only)"""
    component_class_name = "HookTextFormItem"
    props_interface_name = "HookTextFormItemProps"
    
    content = """import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export interface __PROPS_INTERFACE_NAME__ {
  prop: string;
  label?: string;
  tooltip?: string;
  required?: boolean;
}

export const __COMPONENT_CLASS_NAME__ = memo(
  ({ prop, label, tooltip, required }: __PROPS_INTERFACE_NAME__) => {
    const { control, formState } = useFormContext();

    return (
      <Controller
        name={prop}
        control={control}
        render={({ field }) => {
          const error = formState.errors[prop];
          const errorMessage = error?.message as string | undefined;

          return (
            <Form.Item
              required={required}
              label={
                label ? (
                  <span className="text-base text-label whitespace-wrap">
                    {label}
                    {tooltip && (
                      <Tooltip
                        className="cursor-pointer"
                        title={tooltip}
                      >
                        <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                ) : tooltip ? (
                  <Tooltip
                    className="cursor-pointer"
                    title={tooltip}
                  >
                    <InfoCircleOutlined className="ml-1 text-sm text-gray-400" />
                  </Tooltip>
                ) : undefined
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              validateStatus={error ? 'error' : ''}
              help={errorMessage}
            >
              <div className="w-full text-base min-h-[32px] leading-[32px] break-all">
                {field.value}
              </div>
            </Form.Item>
          );
        }}
      />
    );
  },
);
""".replace('__PROPS_INTERFACE_NAME__', props_interface_name).replace('__COMPONENT_CLASS_NAME__', component_class_name)
    
    output_file = os.path.join(output_dir, f"{component_class_name}.tsx")
    if not os.path.exists(output_file):
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"Generated {output_file}")
    else:
        print(f"Component {output_file} already exists, skipping.")
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Generate React Hook Form components with Ant Design integration')
    parser.add_argument('component_type', choices=['input', 'select', 'switch', 'textarea', 'text'], help='Type of component to generate')
    parser.add_argument('--output-dir', default='./src/components/hook-form/children', help='Output directory for the generated component')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.component_type == 'input':
        generate_input_component(args.output_dir)
    elif args.component_type == 'select':
        generate_select_component(args.output_dir)
    elif args.component_type == 'switch':
        generate_switch_component(args.output_dir)
    elif args.component_type == 'textarea':
        generate_textarea_component(args.output_dir)
    elif args.component_type == 'text':
        generate_text_component(args.output_dir)
    
    print("Component generated successfully!")

if __name__ == '__main__':
    main()