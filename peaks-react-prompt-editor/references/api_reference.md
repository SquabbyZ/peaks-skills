# React Prompt Editor — Complete API Reference

## PromptEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `TaskNode[]` | - | Controlled mode data |
| `initialValue` | `TaskNode[]` | `[]` | Uncontrolled initial data |
| `onChange` | `(data: TaskNode[]) => void` | - | Tree change callback |
| `onRunRequest` | `(request: RunTaskRequest) => void` | - | Node execution callback |
| `onOptimizeRequest` | `(request: OptimizeRequest) => void` | - | Advanced AI optimization callback |
| `optimizeConfig` | `OptimizeConfig` | - | Simple AI optimization config |
| `autoOptimize` | `boolean` | `true` | Auto-start optimization on dialog open |
| `onNodeRun` | `(nodeId, result) => void` | - | Execution completion callback |
| `onNodeOptimize` | `(nodeId, result) => void` | - | Optimization completion callback |
| `onNodeLock` | `(nodeId, isLocked) => void` | - | Node lock state callback |
| `previewMode` | `boolean` | `false` | Read-only mode |
| `previewRenderMode` | `'readonly-editor' \| 'markdown'` | `'readonly-editor'` | Preview rendering |
| `draggable` | `boolean` | `false` | Enable drag-and-drop |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | Theme |
| `locale` | `Locale` | `zhCN` | i18n locale |
| `renderToolbar` | `(actions) => ReactNode` | - | Custom toolbar renderer |
| `renderNodeActions` | `(props) => ReactNode` | - | Custom node action buttons |
| `renderNodeTopSlot` | `(props: { node: TaskNode; isDarkMode: boolean }) => ReactNode` | - | Custom slot above CodeMirror, inside editor shell (shows/hides with editor expand) |
| `dataSelector` | `React.ComponentType<DataSelectorComponentProps>` | - | Variable insertion component |
| `onVariableChange` | `(nodeId, variables) => void` | - | Variable change tracking (fires on insert and on tag close/delete) |

---

## Type Definitions

### TaskNode (public API)
```typescript
interface TaskNode {
  id: string;
  title: string;
  content: string;          // Markdown text
  parentId?: string;
  children?: TaskNode[];    // Nested children
  isLocked: boolean;
  hasRun: boolean;
  dependencies?: string[];  // IDs of dependency nodes
}
```

### RunTaskRequest
```typescript
interface RunTaskRequest {
  nodeId: string;
  content: string;
  dependenciesContent: DependencyInfo[];  // Auto-collected
  stream?: boolean;
  meta?: {
    onNodeRun?: (nodeId: string, result?: RunTaskResponse) => void;
    [key: string]: unknown;
  };
}

interface DependencyInfo {
  nodeId: string;
  title: string;
  content: string;
  hasRun: boolean;
}
```

### OptimizeRequest (advanced mode)
```typescript
interface OptimizeRequest {
  content: string;              // Full node content
  selectedText?: string;        // Selected text if any
  instruction?: string;         // User's optimization instruction
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  signal?: AbortSignal;
  config?: OptimizeConfig;
  // Methods to call back into component:
  applyOptimizedContent: (content: string) => void;
  setOptimizeError: (error: string | Error) => void;
  closeOptimizeDialog: () => void;
  meta?: Record<string, unknown>;
}
```

### OptimizeConfig (simple mode)
```typescript
interface OptimizeConfig {
  url: string;                  // API endpoint
  headers?: Record<string, string>;
  model?: string;
  temperature?: number;
  stream?: boolean;             // Default: true (SSE)
  platform?: 'auto' | 'openai' | 'dify' | 'bailian';
  extraParams?: Record<string, unknown>;
  systemPrompt?: string;        // Template: {selectedContent}, {userInstruction}
}
```

### Variable / Tag System
```typescript
interface TagData {
  id: string;
  label: string;                // Display text in editor, e.g. "@username"
  value: string;                // Actual variable value
  metadata?: Record<string, any>;
}

interface EditorVariable {
  id: string;
  position: number;             // Start position in text
  length: number;               // Tag length
  data: TagData;
}

interface DataSelectorComponentProps {
  onSelect: (data: TagData) => void;
  onCancel: () => void;
  cursorPosition?: number;
}
```

### renderNodeActions Props
```typescript
interface NodeActionsProps {
  node: TaskNode;
  isDarkMode: boolean;
  defaultActions: {
    handleRun: () => void;
    handleOptimize: () => void;
    handleOpenDataSelector: () => void;
  };
}
```

### renderToolbar Actions
```typescript
interface ToolbarActions {
  addRootNode: () => void;
}
```

---

## Exports

```typescript
// Components
export { PromptEditor } from 'react-prompt-editor';

// Types
export type {
  TaskNode,
  TaskNodeMinimal,
  RunTaskRequest,
  RunTaskResponse,
  OptimizeRequest,
  OptimizeResponse,
  OptimizeConfig,
  EditorVariable,
  TagData,
  DataSelectorComponentProps,
} from 'react-prompt-editor';

// Locales
export { zhCN, enUS } from 'react-prompt-editor';
```
