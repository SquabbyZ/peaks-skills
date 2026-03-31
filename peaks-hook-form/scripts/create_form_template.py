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
    fields: List[str],
    output_dir: str
) -> str:
    """
    Create a form component template file.
    
    Args:
        component_name: Name of the component (e.g., 'DatasetSettingsAntd')
        schema_name: Name of the schema (e.g., 'RagConfig')
        fields: List of field names to include in the form
        output_dir: Directory to save the template file
    
    Returns:
        Path to the generated file
    """
    # Convert names to proper formats
    schema_var_name = f"{schema_name}Schema"
    schema_file_name = f"{schema_name.lower()}.schema"
    
    # Generate the template content
    content = f"""import {{ zodResolver }} from '@hookform/resolvers/zod';
import {{ memo }} from 'react';
import {{ FormProvider, useForm, useWatch }} from 'react-hook-form';
import {{ z }} from 'zod';
import {{
  defaultValue,
  {schema_var_name},
}} from '@/components/hook-form/schemas/{schema_file_name}';

function {component_name}() {{
  const form = useForm<z.infer<typeof {schema_var_name}>>({{
    resolver: zodResolver({schema_var_name}),
    defaultValues: defaultValue,
  }});

  const {fields[0] if fields else 'name'} = useWatch({{
    control: form.control,
    name: '{fields[0] if fields else 'name'}',
  }});

  async function onSubmit(data: z.infer<typeof {schema_var_name}>) {{
    console.log('🚀 ~ {component_name} ~ data:', data);
  }}

  return (
    <section className="p-5 h-full flex flex-col">
      <div className="flex gap-14 flex-1 min-h-0">
        <FormProvider {{...form}}>
          <form
            onSubmit={{form.handleSubmit(onSubmit)}}
            className="space-y-6 flex-1"
          >
            {{/* TODO: Add form fields here */}}
          </form>
        </FormProvider>
      </div>
    </section>
  );
}}

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
