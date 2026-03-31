#!/usr/bin/env python3
"""
Script to copy the peaks-react-template to a target directory.
This script ensures ALL files including hidden files (.husky, .trae, .npmrc, etc.) are copied.

Usage: python use_template.py [target_directory]
"""

import os
import shutil
import sys
from pathlib import Path


def use_template(target_dir: str):
    """Copy the template to the target directory, preserving all hidden files."""
    
    # Get the script's directory
    script_dir = Path(__file__).parent.parent
    template_dir = script_dir / "assets" / "peaks-react-template"
    
    # Convert to absolute path
    target_path = Path(target_dir).absolute()
    
    print(f"📦 Copying peaks-react-template to: {target_path}")
    print(f"   Source: {template_dir}")
    
    # Check if template exists
    if not template_dir.exists():
        print(f"❌ Template directory not found: {template_dir}")
        sys.exit(1)
    
    # Check if target already exists
    if target_path.exists():
        print(f"⚠️  Target directory already exists: {target_path}")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Operation cancelled")
            sys.exit(0)
        shutil.rmtree(target_path)
    
    # Create target directory
    target_path.mkdir(parents=True, exist_ok=True)
    
    # Copy all files including hidden ones
    print("📋 Copying files (including hidden files)...")
    
    # Use copytree with dirs_exist_ok=True for Python 3.8+
    copied_files = 0
    for item in template_dir.iterdir():
        dest = target_path / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)
        copied_files += 1
    
    print(f"✅ Template copied successfully to: {target_path}")
    print(f"   Copied {copied_files} items (including hidden files)")
    
    # List hidden files that were copied
    hidden_files = [f.name for f in template_dir.iterdir() if f.name.startswith('.')]
    if hidden_files:
        print(f"\n📁 Hidden files included:")
        for hf in sorted(hidden_files):
            print(f"   ✓ {hf}")
    
    print("\n📝 Next steps:")
    print(f"   1. cd {target_path}")
    print("   2. Update package.json with your project name")
    print("   3. Install dependencies: pnpm install")
    print("   4. Configure .env with your environment variables")
    print("   5. Start development: pnpm dev")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python use_template.py <target_directory>")
        print("\nExample:")
        print("  python use_template.py ./my-new-project")
        sys.exit(1)
    
    target_directory = sys.argv[1]
    use_template(target_directory)
