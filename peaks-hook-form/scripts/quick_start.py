#!/usr/bin/env python3
"""
Quick Start Script - One-command form generation.
Generates schema, form template, and all field components in one step.
"""

import argparse
import json
import os
import sys
from typing import List, Dict

# Import other scripts
from generate_zod_schema import generate_zod_schema
from create_form_template import create_form_template
from generate_form_component import generate_input_component, generate_select_component, generate_switch_component, generate_textarea_component, generate_text_component


def get_field_type(field: Dict) -> str:
    """Determine field component type based on field definition."""
    if 'component_type' in field:
        return field['component_type']
        
    field_type = field.get('type', 'string')
    validation = field.get('validation', '')
    
    # Map field types to component types
    if field_type == 'boolean':
        return 'switch'
    elif field_type == 'number':
        return 'number'
    elif field_type == 'enum':
        return 'select'
    elif field_type == 'array':
        return 'array'
    else:
        # string types
        if validation == 'email':
            return 'email'
        elif validation == 'url':
            return 'url'
        else:
            return 'input'


def get_component_name(field: Dict) -> str:
    """Generate component class name from field name."""
    field_name = field['name']
    # Convert to PascalCase
    return ''.join(word.capitalize() for word in field_name.replace('_', ' ').split())


def quick_start(
    form_name: str,
    schema_name: str,
    fields: List[Dict],
    output_dir: str = './src/pages',
    skip_schema: bool = False,
    skip_template: bool = False,
    skip_components: bool = False
):
    """
    Generate complete form with one command.
    
    Args:
        form_name: Name of the form component (e.g., 'DatasetSettingsAntd')
        schema_name: Name of the schema (e.g., 'RagConfig')
        fields: List of field definitions
        output_dir: Output directory for form component
        skip_schema: Skip schema generation
        skip_template: Skip template generation
        skip_components: Skip component generation
    """
    print(f"\n🚀 Starting quick form generation...")
    print(f"   Form: {form_name}")
    print(f"   Schema: {schema_name}")
    print(f"   Fields: {len(fields)}")
    print()
    
    results = {
        'schema': None,
        'template': None,
        'components': []
    }
    
    # Step 1: Generate schema
    if not skip_schema:
        print("📝 Step 1/3: Generating Zod schema...")
        schema_dir = './src/components/hook-form/schemas'
        os.makedirs(schema_dir, exist_ok=True)
        
        try:
            schema_file = generate_zod_schema(schema_name, fields, schema_dir)
            results['schema'] = schema_file
            print(f"   ✓ Generated: {schema_file}")
        except Exception as e:
            print(f"   ✗ Error generating schema: {e}")
            return None
    else:
        print("⊘ Step 1/3: Skipping schema generation")
    
    print()
    
    # Step 2: Generate form template
    if not skip_template:
        print("📄 Step 2/3: Generating form template...")
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            template_file = create_form_template(form_name, schema_name, fields, output_dir)
            results['template'] = template_file
            print(f"   ✓ Generated: {template_file}")
        except Exception as e:
            print(f"   ✗ Error generating template: {e}")
            return None
    else:
        print("⊘ Step 2/3: Skipping template generation")
    
    print()
    
    # Step 3: Generate field components
    if not skip_components:
        print("🧩 Step 3/3: Generating field components...")
        children_dir = './src/components/hook-form/children'
        os.makedirs(children_dir, exist_ok=True)
        
        for field in fields:
            if 'component_type' not in field:
                print(f"   ℹ Skipping component generation for '{field['name']}': no component_type specified")
                continue
                
            component_type = field['component_type'].lower()
            
            try:
                if component_type in ['select', 'enum']:
                    component_file = generate_select_component(children_dir)
                elif component_type in ['switch', 'boolean']:
                    component_file = generate_switch_component(children_dir)
                elif component_type in ['textarea', 'textarae']:
                    component_file = generate_textarea_component(children_dir)
                elif component_type in ['text', 'display']:
                    component_file = generate_text_component(children_dir)
                elif component_type in ['input', 'string', 'email', 'url']:
                    component_file = generate_input_component(children_dir)
                else:
                    print(f"   ℹ Skipping '{field['name']}': unsupported component_type '{component_type}', falling back to generic Input")
                    component_file = generate_input_component(children_dir)
                
                if component_file not in results['components']:
                    results['components'].append(component_file)
            except Exception as e:
                print(f"   ✗ Error generating component for {field['name']}: {e}")
    else:
        print("⊘ Step 3/3: Skipping component generation")
    
    print()
    print("=" * 60)
    print("✅ Form generation completed!")
    print("=" * 60)
    print()
    print("📁 Generated files:")
    if results['schema']:
        print(f"   Schema: {results['schema']}")
    if results['template']:
        print(f"   Template: {results['template']}")
    if results['components']:
        print(f"   Components: {len(results['components'])} files")
    
    print()
    print("📖 Next steps:")
    print("   1. Import field components in your form template")
    print("   2. Add field components inside the <form> element")
    print("   3. Customize onSubmit handler with your API logic")
    print()
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description='Quick start - Generate complete form with one command',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate complete form with fields
  python quick_start.py DatasetSettingsAntd RagConfig --fields '[
    {"name":"name","type":"string","component_type":"input","label":"名称","required":true},
    {"name":"description","type":"string","component_type":"input","label":"描述"},
    {"name":"apiUrl","type":"string","component_type":"input","label":"API 地址","validation":"url"},
    {"name":"enabled","type":"boolean","component_type":"switch","label":"启用"}
  ]'
  
  # Generate in specific directory
  python quick_start.py UserForm UserSchema --fields '[{"name":"username","type":"string","component_type":"input"}]' --output-dir src/pages/users
  
  # Skip certain steps
  python quick_start.py MyForm MySchema --fields '[{"name":"title","type":"string"}]' --skip-components
        """
    )
    
    parser.add_argument('form_name', help='Name of the form component (e.g., DatasetSettingsAntd)')
    parser.add_argument('schema_name', help='Name of the schema (e.g., RagConfig)')
    parser.add_argument('--fields', type=str, required=True, help='JSON array of field definitions')
    parser.add_argument('--output-dir', default='./src/pages', help='Output directory for form component')
    parser.add_argument('--skip-schema', action='store_true', help='Skip schema generation')
    parser.add_argument('--skip-template', action='store_true', help='Skip template generation')
    parser.add_argument('--skip-components', action='store_true', help='Skip component generation')
    
    args = parser.parse_args()
    
    # Parse fields JSON
    try:
        fields = json.loads(args.fields)
        if not isinstance(fields, list):
            raise ValueError("Fields must be a JSON array")
    except json.JSONDecodeError as e:
        print(f"✗ Error: Invalid JSON for --fields: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Validate fields
    for i, field in enumerate(fields):
        if not isinstance(field, dict):
            print(f"✗ Error: Field {i} must be an object", file=sys.stderr)
            sys.exit(1)
        if 'name' not in field:
            print(f"✗ Error: Field {i} missing 'name' property", file=sys.stderr)
            sys.exit(1)
    
    # Run quick start
    results = quick_start(
        args.form_name,
        args.schema_name,
        fields,
        args.output_dir,
        args.skip_schema,
        args.skip_template,
        args.skip_components
    )
    
    sys.exit(0 if results else 1)


if __name__ == '__main__':
    main()
