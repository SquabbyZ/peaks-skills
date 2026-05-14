#!/usr/bin/env node
/**
 * OpenSpec MCP Server
 *
 * 实现 MCP 协议 (JSON-RPC over stdio)，包装 OpenSpec CLI 命令
 * 提供 /opsx:* slash commands 功能
 *
 * MCP Protocol Version: 2024-11-05
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// MCP Protocol constants
const MCP_VERSION = '2024-11-05';

// Transport: read JSON-RPC request from stdin
function readRequest() {
  const data = readFileSync(0, 'utf-8');
  if (!data.trim()) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Transport: send JSON-RPC response to stdout
function sendResponse(response) {
  writeFileSync(1, JSON.stringify(response) + '\n');
}

// Transport: send JSON-RPC notification (no id)
function sendNotification(method, params = {}) {
  writeFileSync(1, JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

// Execute OpenSpec CLI command
function execOpenSpec(command, args = []) {
  return new Promise((resolve, reject) => {
    const fullArgs = ['-y', '@fission-ai/openspec@latest', command, ...args];
    const proc = spawn('npx', fullArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });

    proc.on('error', reject);
  });
}

// MCP Tool definitions
const TOOLS = [
  {
    name: 'opsx_init',
    description: 'Initialize OpenSpec directory structure (specs/, changes/, .openspec/)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'opsx_new',
    description: 'Create a new change proposal',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name (e.g., "add-user-login", "refactor-auth")'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'opsx_list',
    description: 'List all change proposals',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'opsx_show',
    description: 'Show details of a specific change',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name to show'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'opsx_validate',
    description: 'Validate a change proposal',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name to validate'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'opsx_apply',
    description: 'Apply/review changes for a specific change',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name to apply'
        }
      },
      required: []
    }
  },
  {
    name: 'opsx_archive',
    description: 'Archive a change and merge specs into main documentation',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name to archive'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'opsx_status',
    description: 'Show completion status of a change',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Change name to check status'
        }
      },
      required: []
    }
  },
  {
    name: 'opsx_specs',
    description: 'List all specification documents',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Tool name to OpenSpec command mapping
const COMMAND_MAP = {
  opsx_init: { cmd: 'init', args: [] },
  opsx_new: { cmd: 'new', args: ['change'] },
  opsx_list: { cmd: 'list', args: [] },
  opsx_show: { cmd: 'show', args: [] },
  opsx_validate: { cmd: 'validate', args: [] },
  opsx_apply: { cmd: 'apply', args: [] },
  opsx_archive: { cmd: 'archive', args: [] },
  opsx_status: { cmd: 'status', args: [] },
  opsx_specs: { cmd: 'list', args: ['--specs'] }
};

// Tool handlers
async function handleTool(name, args) {
  const mapping = COMMAND_MAP[name];
  if (!mapping) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const result = await execOpenSpec(mapping.cmd, [...mapping.args, ...(args?.name ? [args.name] : [])]);

  const output = result.stdout || result.stderr || (result.success ? 'OK' : 'Command failed');

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}

// MCP Protocol request handler
async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      sendResponse({
        id,
        result: {
          protocolVersion: MCP_VERSION,
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'openspec',
            version: '1.0.0'
          }
        }
      });
      break;

    case 'tools/list':
      sendResponse({
        id,
        result: {
          tools: TOOLS
        }
      });
      break;

    case 'tools/call': {
      const { name, arguments: toolArgs = {} } = params;
      try {
        const result = await handleTool(name, toolArgs);
        sendResponse({ id, result });
      } catch (error) {
        sendResponse({
          id,
          error: {
            code: -32603,
            message: error.message
          }
        });
      }
      break;
    }

    case 'notifications/initialized':
      // Client ready notification - no response needed
      break;

    default:
      sendResponse({
        id,
        error: {
          code: -32601,
          message: `Unknown method: ${method}`
        }
      });
  }
}

// Main MCP server loop
async function main() {
  // Send initial ready notification
  sendNotification('server/ready', {
    serverInfo: { name: 'openspec', version: '1.0.0' }
  });

  // Process requests until EOF
  let running = true;
  while (running) {
    try {
      const request = readRequest();
      if (request) {
        await handleRequest(request);
      }
    } catch (err) {
      // Send error response for malformed requests
      console.error('[openspec-server] Error:', err.message);
    }
  }
}

main().catch((err) => {
  console.error('[openspec-server] Fatal error:', err);
  process.exit(1);
});
