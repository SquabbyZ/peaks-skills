#!/usr/bin/env python3
"""
Setup script to create the required directory structure for hook-form components.
Creates src/components/hook-form with schemas and children subdirectories.
"""

import argparse
import os
import sys


def setup_hook_form_directories(project_root=None):
    """
    Create the hook-form directory structure if it doesn't exist.
    
    Args:
        project_root: Root directory of the project. If None, uses current directory.
    """
    if project_root is None:
        project_root = os.getcwd()
    
    # Define directory paths
    base_dir = os.path.join(project_root, 'src', 'components', 'hook-form')
    schemas_dir = os.path.join(base_dir, 'schemas')
    children_dir = os.path.join(base_dir, 'children')
    
    # Track created directories
    created_dirs = []
    
    # Create base directory if it doesn't exist
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
        created_dirs.append(base_dir)
        print(f"✓ Created: {base_dir}")
    else:
        print(f"✓ Already exists: {base_dir}")
    
    # Create schemas subdirectory if it doesn't exist
    if not os.path.exists(schemas_dir):
        os.makedirs(schemas_dir)
        created_dirs.append(schemas_dir)
        print(f"✓ Created: {schemas_dir}")
    else:
        print(f"✓ Already exists: {schemas_dir}")
    
    # Create children subdirectory if it doesn't exist
    if not os.path.exists(children_dir):
        os.makedirs(children_dir)
        created_dirs.append(children_dir)
        print(f"✓ Created: {children_dir}")
    else:
        print(f"✓ Already exists: {children_dir}")
    
    # Create .gitkeep files to ensure directories are tracked by git
    for dir_path in [schemas_dir, children_dir]:
        gitkeep_path = os.path.join(dir_path, '.gitkeep')
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, 'w') as f:
                f.write('# This file ensures the directory is tracked by git\n')
            print(f"✓ Created: {gitkeep_path}")
    
    if created_dirs:
        print(f"\n✓ Successfully created {len(created_dirs)} directories")
    else:
        print(f"\n✓ All directories already exist")
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description='Setup hook-form directory structure',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Setup in current directory
  python setup_hook_form_dirs.py
  
  # Setup in specific project directory
  python setup_hook_form_dirs.py --project-root /path/to/project
        """
    )
    
    parser.add_argument(
        '--project-root',
        type=str,
        default=None,
        help='Root directory of the project (default: current directory)'
    )
    
    args = parser.parse_args()
    
    try:
        success = setup_hook_form_directories(args.project_root)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
