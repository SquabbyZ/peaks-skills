#!/usr/bin/env python3
"""
Generate Zod schema files for React Hook Form validation.
Creates schema files in src/components/hook-form/schemas directory.
"""

import argparse
import os
import sys
from typing import Dict, List, Optional


def generate_zod_schema(
    schema_name: str,
    fields: List[Dict[str, str]],
    output_dir: str
) -> str:
    """
    Generate a Zod schema file with defaultValues export.
    
    Args:
        schema_name: Name of the schema (e.g., 'RagConfig')
        fields: List of field definitions with name, type, and validation
        output_dir: Directory to save the schema file
    
    Returns:
        Path to the generated file
    """
    # Convert schema name to proper format
    schema_var_name = f"{schema_name}Schema"
    
    # Generate import statement
    content = "import { z } from 'zod';\n\n"
    
    # Generate schema export
    content += f"export const {schema_var_name} = z.object({{\n"
    
    # Generate field definitions
    for field in fields:
        field_name = field['name']
        field_type = field.get('type', 'string')
        validation = field.get('validation', '')
        error_message = field.get('message', f'请输入{field_name}')
        
        # Generate validation based on type
        if field_type == 'string':
            if validation == 'min':
                min_length = field.get('min_length', '1')
                content += f"  {field_name}: z.string().min({min_length}, {{\n"
                content += f"    message: '{error_message}',\n"
                content += f"  }}),\n"
            elif validation == 'email':
                content += f"  {field_name}: z.string().email({{\n"
                content += f"    message: '请输入有效的邮箱地址',\n"
                content += f"  }}),\n"
            elif validation == 'url':
                content += f"  {field_name}: z.string().url({{\n"
                content += f"    message: '请输入有效的 URL',\n"
                content += f"  }}),\n"
            else:
                content += f"  {field_name}: z.string({{\n"
                content += f"    message: '{error_message}',\n"
                content += f"  }}),\n"
        
        elif field_type == 'number':
            content += f"  {field_name}: z.number({{\n"
            content += f"    message: '请输入有效的数字',\n"
            content += f"  }}),\n"
        
        elif field_type == 'boolean':
            content += f"  {field_name}: z.boolean(),\n"
        
        elif field_type == 'array':
            content += f"  {field_name}: z.array(z.string()),\n"
        
        elif field_type == 'enum':
            enum_values = field.get('enum_values', [])
            enum_str = ', '.join([f"'{v}'" for v in enum_values])
            content += f"  {field_name}: z.enum([{enum_str}]),\n"
    
    content += "});\n"
    
    # Generate type export
    content += f"\nexport type {schema_name} = z.infer<typeof {schema_var_name}>;\n"
    
    # Generate defaultValues export
    content += f"\nexport const defaultValue: {schema_name} = {{\n"
    for field in fields:
        field_name = field['name']
        field_type = field.get('type', 'string')
        
        # Generate default value based on type
        if field_type == 'string':
            content += f"  {field_name}: '',\n"
        elif field_type == 'number':
            content += f"  {field_name}: 0,\n"
        elif field_type == 'boolean':
            content += f"  {field_name}: false,\n"
        elif field_type == 'array':
            content += f"  {field_name}: [],\n"
        elif field_type == 'enum':
            enum_values = field.get('enum_values', [])
            first_value = enum_values[0] if enum_values else "''"
            content += f"  {field_name}: '{first_value}',\n"
    content += "};\n"
    
    # Write to file
    output_file = os.path.join(output_dir, f"{schema_name.lower()}.schema.ts")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_file


def generate_simple_schema(schema_name: str, field_name: str, output_dir: str) -> str:
    """
    Generate a simple Zod schema with a single field.
    
    Args:
        schema_name: Name of the schema (e.g., 'RagConfig')
        field_name: Name of the field (e.g., 'name')
        output_dir: Directory to save the schema file
    
    Returns:
        Path to the generated file
    """
    fields = [
        {
            'name': field_name,
            'type': 'string',
            'validation': 'min',
            'min_length': '1',
            'message': f'请输入{field_name}'
        }
    ]
    
    return generate_zod_schema(schema_name, fields, output_dir)


def main():
    parser = argparse.ArgumentParser(
        description='Generate Zod schema files for React Hook Form validation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a simple schema with one field
  python generate_zod_schema.py simple RagConfig name
  
  # Generate a schema with multiple fields (JSON format)
  python generate_zod_schema.py complex UserForm --fields '[{"name":"username","type":"string","validation":"min","min_length":"3"},{"name":"email","type":"string","validation":"email"}]'
        """
    )
    
    parser.add_argument(
        'mode',
        choices=['simple', 'complex'],
        help='Generation mode: simple (single field) or complex (multiple fields)'
    )
    
    parser.add_argument(
        'schema_name',
        help='Name of the schema (e.g., RagConfig, UserForm)'
    )
    
    parser.add_argument(
        'field_name',
        nargs='?',
        default='name',
        help='Name of the field for simple mode (default: name)'
    )
    
    parser.add_argument(
        '--fields',
        type=str,
        help='JSON array of field definitions for complex mode'
    )
    
    parser.add_argument(
        '--output-dir',
        default='./src/components/hook-form/schemas',
        help='Output directory for the generated schema (default: ./src/components/hook-form/schemas)'
    )
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    try:
        if args.mode == 'simple':
            output_file = generate_simple_schema(
                args.schema_name,
                args.field_name,
                args.output_dir
            )
        else:  # complex mode
            import json
            fields = json.loads(args.fields) if args.fields else []
            if not fields:
                print("✗ Error: --fields is required for complex mode", file=sys.stderr)
                sys.exit(1)
            output_file = generate_zod_schema(
                args.schema_name,
                fields,
                args.output_dir
            )
        
        print(f"✓ Generated: {output_file}")
        print("\nSchema generated successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
