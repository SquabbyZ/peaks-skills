#!/usr/bin/env python3
"""
Create a form component template file with React Hook Form integration.
Creates template files in src/components directory.
"""

import argparse
import os
import sys
from typing import List


def create_form_template(
    component_name: str,
    schema_name: str,
    fields: List[dict],
    output_dir: str
) -> str:
    """
    Create a form component template file.
    
    Args:
        component_name: Name of the component (e.g., 'DatasetSettingsAntd')
        schema_name: Name of the schema (e.g., 'RagConfig')
        fields: List of field definitions to include in the form
        output_dir: Directory to save the template file
    
    Returns:
        Path to the generated file
    """
    # Convert names to proper formats
    schema_var_name = f"{schema_name}Schema"
    schema_file_name = f"{schema_name.lower()}.schema"
    enum_name = f"{schema_name}FormKey"
    
    first_field = fields[0]['name'] if fields else 'name'
    first_field_enum = f"{enum_name}.{first_field.upper()}"
    
    # Track which components need to be imported
    needed_components = set()
    
    # Generate form fields JSX
    fields_jsx = ""
    for field in fields:
        field_name = field['name']
        enum_key = f"{enum_name}.{field_name.upper()}"
        label = field.get('label', field_name)
        component_type = field.get('component_type', 'input').lower()
        
        if component_type in ['select', 'enum']:
            component_tag = "HookSelectFormItem"
            extra_props = 'options={[]}'
        elif component_type in ['switch', 'boolean']:
            component_tag = "HookSwitchFormItem"
            extra_props = ''
        elif component_type in ['textarea', 'textarae']:
            component_tag = "HookTextAreaFormItem"
            extra_props = f'placeholder="请输入{label}"'
        elif component_type in ['text', 'display']:
            component_tag = "HookTextFormItem"
            extra_props = ''
        else:
            component_tag = "HookInputFormItem"
            extra_props = f'placeholder="请输入{label}"'
            
        needed_components.add(component_tag)
        
        fields_jsx += f"""            {{/* {label} */}}
            <{component_tag}
              prop={{{enum_key}}}
              label="{label}"
              {extra_props}
            />\n"""
            
    # Generate imports
    imports_jsx = "import { cn } from '@/utils';\n"
    if needed_components:
        for comp in sorted(needed_components):
            imports_jsx += f"import {{ {comp} }} from '@/components/hook-form/children/{comp}';\n"
    
    # Generate the template content
    content = f"""import {{ zodResolver }} from '@hookform/resolvers/zod';
import {{ forwardRef, memo, useImperativeHandle }} from 'react';
import {{ FormProvider, useForm, useWatch }} from 'react-hook-form';
import {{ z }} from 'zod';
import {{
  defaultValue,
  {schema_var_name},
  {enum_name},
}} from '@/components/hook-form/schemas/{schema_file_name}';
{imports_jsx}
export interface {component_name}Ref {{
  submit: () => void;
}}

export interface {component_name}Props {{
  className?: string;
}}

const {component_name} = forwardRef<{component_name}Ref, {component_name}Props>(
  ({{ className }}, ref) => {{
    const form = useForm<z.infer<typeof {schema_var_name}>>({{
      resolver: zodResolver({schema_var_name}),
      defaultValues: defaultValue,
    }});

    const {first_field} = useWatch({{
      control: form.control,
      name: {first_field_enum},
    }});

    async function onSubmit(data: z.infer<typeof {schema_var_name}>) {{
      console.log('🚀 ~ {component_name} ~ data:', data);
    }}

    useImperativeHandle(ref, () => ({{
      submit: () => {{
        form.handleSubmit(onSubmit)();
      }},
    }}));

    return (
      <section className={{cn('flex h-full flex-col p-5', className)}}>
        <div className="flex min-h-0 flex-1 gap-14">
          <FormProvider {{...form}}>
            <form
              onSubmit={{form.handleSubmit(onSubmit)}}
              className="flex-1 space-y-6"
            >
{fields_jsx}            </form>
          </FormProvider>
        </div>
      </section>
    );
  }},
);

export default memo({component_name});
"""
    
    # Write to file
    output_file = os.path.join(output_dir, f"{component_name}.tsx")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_file


def create_form_template_with_schema(
    component_name: str,
    schema_name: str,
    fields: List[str],
    schema_output_dir: str,
    component_output_dir: str
) -> tuple:
    """
    Create both schema and form template files.
    
    Args:
        component_name: Name of the component
        schema_name: Name of the schema
        fields: List of field names
        schema_output_dir: Directory for schema file
        component_output_dir: Directory for component file
    
    Returns:
        Tuple of (schema_file, component_file) paths
    """
    # Import the schema generation function
    from generate_zod_schema import generate_simple_schema
    
    # Generate schema first
    schema_file = generate_simple_schema(schema_name, fields[0] if fields else 'name', schema_output_dir)
    
    # Generate component template
    component_file = create_form_template(component_name, schema_name, fields, component_output_dir)
    
    return schema_file, component_file


def main():
    parser = argparse.ArgumentParser(
        description='Create a form component template with React Hook Form integration',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a form template (schema should already exist)
  python create_form_template.py DatasetSettingsAntd RagConfig --fields name description apiUrl
  
  # Create form template with specific output directory
  python create_form_template.py UserSettings UserForm --fields username email --output-dir src/pages/settings
        """
    )
    
    parser.add_argument(
        'component_name',
        help='Name of the component (e.g., DatasetSettingsAntd, UserSettings)'
    )
    
    parser.add_argument(
        'schema_name',
        help='Name of the schema to use (e.g., RagConfig, UserForm)'
    )
    
    parser.add_argument(
        '--fields',
        nargs='+',
        default=['name'],
        help='List of field names to watch (default: name)'
    )
    
    parser.add_argument(
        '--output-dir',
        default='./src/components',
        help='Output directory for the generated component (default: ./src/components)'
    )
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    try:
        output_file = create_form_template(
            args.component_name,
            args.schema_name,
            args.fields,
            args.output_dir
        )
        
        print(f"✓ Generated: {output_file}")
        print(f"\nForm template created successfully!")
        print(f"\nNext steps:")
        print(f"1. Import form field components from @/components/hook-form/children")
        print(f"2. Add form fields inside the <form> element")
        print(f"3. Customize the onSubmit handler with your logic")
        
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
