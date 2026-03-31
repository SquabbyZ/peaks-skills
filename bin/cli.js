#!/usr/bin/env node

/**
 * Peaks Skills CLI
 * 
 * A command-line interface for managing and installing AI coding skills.
 * Supports integration with Trae IDE and other AI coding assistants.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Available skills
const SKILLS = [
  'peaks-react-template',
  'peaks-pixso-code-sync',
  'peaks-hook-form',
  'peaks-api-create'
];

/**
 * Display help information
 */
function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   Peaks Skills CLI                        ║
║   AI-driven frontend development skills collection        ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  npx peaks-skills <command> [options]

Commands:
  list              List all available skills
  install <skill>   Install a specific skill to your project
  add <skill>       Alias for install
  info <skill>      Show detailed information about a skill
  init              Initialize peaks-skills in current project
  help              Show this help message

Examples:
  npx peaks-skills list
  npx peaks-skills install peaks-react-template
  npx peaks-skills add peaks-pixso-code-sync
  npx peaks-skills info peaks-hook-form
  npx peaks-skills init

For more information, visit:
  https://github.com/your-username/peaks-skills
`);
}

/**
 * List all available skills
 */
function listSkills() {
  console.log('\n📦 Available Peaks Skills:\n');
  console.log('═'.repeat(60));
  
  SKILLS.forEach((skill, index) => {
    const skillPath = join(ROOT_DIR, skill, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const nameMatch = content.match(/^name:\s*(.+)/m);
      const descMatch = content.match(/^description:\s*([\s\S]+?)(?:\n---|\n\n|$)/m);
      
      const name = nameMatch ? nameMatch[1].trim() : skill;
      const desc = descMatch ? descMatch[1].trim().split('\n')[0] : 'No description available';
      
      console.log(`\n${index + 1}. ${name}`);
      console.log(`   ${desc}`);
      console.log(`   Package: ${skill}`);
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 Usage: npx peaks-skills install <skill-name>');
  console.log('   Example: npx peaks-skills install peaks-react-template\n');
}

/**
 * Get skill information
 */
function getSkillInfo(skillName) {
  if (!SKILLS.includes(skillName)) {
    console.error(`❌ Error: Skill '${skillName}' not found.`);
    console.error('\nAvailable skills:', SKILLS.join(', '));
    process.exit(1);
  }

  const skillPath = join(ROOT_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    console.error(`❌ Error: Skill file not found for '${skillName}'`);
    process.exit(1);
  }

  const content = fs.readFileSync(skillPath, 'utf-8');
  
  // Extract information
  const nameMatch = content.match(/^name:\s*(.+)/m);
  const descMatch = content.match(/^description:\s*([\s\S]+?)(?:\n---|\n\n|$)/m);
  
  console.log('\n📋 Skill Information:\n');
  console.log('═'.repeat(60));
  console.log(`Name: ${nameMatch ? nameMatch[1].trim() : skillName}`);
  console.log(`\nDescription:`);
  if (descMatch) {
    console.log(descMatch[1].trim());
  }
  console.log('\n' + '═'.repeat(60));
  console.log(`\n💡 Install with: npx peaks-skills install ${skillName}\n`);
}

/**
 * Install a skill to the target project
 */
function installSkill(skillName, targetDir = '.') {
  if (!SKILLS.includes(skillName)) {
    console.error(`❌ Error: Skill '${skillName}' not found.`);
    console.error('\nAvailable skills:', SKILLS.join(', '));
    console.error('\n💡 Tip: Run "npx peaks-skills list" to see all available skills\n');
    process.exit(1);
  }

  const sourcePath = join(ROOT_DIR, skillName);
  const targetPath = join(process.cwd(), targetDir, '.trae', 'skills', skillName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: Skill source directory not found: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`\n📦 Installing ${skillName}...`);
  console.log('═'.repeat(60));
  
  try {
    // Create target directory
    fs.mkdirSync(targetPath, { recursive: true });

    // Copy files using cp command (more reliable for complex structures)
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: use xcopy
      execSync(`xcopy /E /I /Y "${sourcePath}\\*" "${targetPath}"`, { 
        stdio: 'inherit',
        shell: true 
      });
    } else {
      // Unix-like: use cp
      execSync(`cp -R "${sourcePath}/." "${targetPath}/"`, { 
        stdio: 'inherit',
        shell: true 
      });
    }

    console.log('\n✅ Installation successful!');
    console.log('\n' + '═'.repeat(60));
    console.log(`📍 Installed to: ${targetPath}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Open your project in Trae IDE');
    console.log('   2. The skill will be automatically activated');
    console.log('   3. Start using the skill in your AI conversations\n');
    
  } catch (error) {
    console.error('\n❌ Error during installation:', error.message);
    console.error('\n💡 Tip: Try running with administrator privileges\n');
    process.exit(1);
  }
}

/**
 * Initialize peaks-skills in current project
 */
function initProject() {
  const traeDir = join(process.cwd(), '.trae', 'skills');
  
  console.log('\n🚀 Initializing Peaks Skills...\n');
  console.log('═'.repeat(60));
  
  try {
    fs.mkdirSync(traeDir, { recursive: true });
    
    // Create a README in the skills directory
    const readmePath = join(traeDir, 'README.md');
    const readmeContent = `# Peaks Skills

This directory contains installed AI coding skills for your project.

## Installed Skills

Skills will be installed here automatically when you run:
\`\`\`bash
npx peaks-skills install <skill-name>
\`\`\`

## Available Skills

- peaks-react-template
- peaks-pixso-code-sync
- peaks-hook-form
- peaks-api-create

## Usage

1. Open your project in Trae IDE
2. The skills will be automatically activated
3. Use natural language to trigger the skills

For more information, visit: https://github.com/your-username/peaks-skills
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log('✅ Peaks Skills initialized successfully!');
    console.log('\n' + '═'.repeat(60));
    console.log(`📍 Skills directory: ${traeDir}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Run "npx peaks-skills install <skill-name>" to add skills');
    console.log('   2. Open your project in Trae IDE');
    console.log('   3. Start using the skills!\n');
    
  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

/**
 * Main command handler
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
    case 'ls':
      listSkills();
      break;
    
    case 'install':
    case 'add':
    case 'get':
      if (!args[1]) {
        console.error('❌ Error: Please specify a skill name');
        console.error('💡 Usage: npx peaks-skills install <skill-name>\n');
        process.exit(1);
      }
      installSkill(args[1], args[2]);
      break;
    
    case 'info':
    case 'show':
      if (!args[1]) {
        console.error('❌ Error: Please specify a skill name');
        console.error('💡 Usage: npx peaks-skills info <skill-name>\n');
        process.exit(1);
      }
      getSkillInfo(args[1]);
      break;
    
    case 'init':
      initProject();
      break;
    
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    
    case undefined:
      showHelp();
      break;
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('💡 Run "npx peaks-skills help" to see available commands\n');
      process.exit(1);
  }
}

// Run the CLI
main();
