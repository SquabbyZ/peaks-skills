---
name: peaks-react-prompt-editor
description: Expert guide for using, integrating, and customizing the react-prompt-editor (RPEditor) library — a tree-structured React prompt editor for AI workflows. Use this skill when working with the react-prompt-editor package, building prompt management UIs, integrating PromptEditor component into React apps, configuring AI optimization, implementing variable insertion, handling node execution, customizing toolbars/actions, or debugging any issues related to react-prompt-editor. Triggers on tasks involving PromptEditor component, TaskNode data, RunTaskRequest, OptimizeRequest, OptimizeConfig, DataSelector, or any mention of react-prompt-editor.
---

# React Prompt Editor (RPEditor) Skill

## Installation

```bash
pnpm add react-prompt-editor antd @ant-design/x
```

**Always import styles** (required):
```tsx
import 'react-prompt-editor/styles/index.css';
```

## Quick Start

```tsx
import { PromptEditor, TaskNode, enUS } from 'react-prompt-editor';
import 'react-prompt-editor/styles/index.css';

const [data, setData] = useState<TaskNode[]>([
  { id: '1', title: 'System Prompt', content: '# Role\nYou are a helpful assistant.', children: [], isLocked: false, hasRun: false }
]);

<PromptEditor value={data} onChange={setData} locale={enUS} />
```

## Key Concepts

- **TaskNode**: Public tree-nested format used in `value`/`onChange`. Has `children: TaskNode[]`.
- **Controlled vs uncontrolled**: Use `value`+`onChange` for controlled; `initialValue` for uncontrolled.
- **Callback-based async**: Component fires callbacks (`onRunRequest`, `onOptimizeRequest`); you handle API calls and notify component via `request.meta?.onNodeRun?.()` or `request.applyOptimizedContent()`.
- **Dependencies**: Each node can declare `dependencies: string[]` (IDs). When running, `dependenciesContent` is auto-collected and passed in `RunTaskRequest`.
- **Editor**: Uses CodeMirror 5 (`react-codemirror2`) with fixed 220px height and internal scrolling. Supports Chinese IME input natively.

## Common Patterns

### Node Execution
```tsx
const handleRunRequest = (request: RunTaskRequest) => {
  myAPI.run({ content: request.content, deps: request.dependenciesContent })
    .then(result => request.meta?.onNodeRun?.(request.nodeId, result));
};
<PromptEditor onRunRequest={handleRunRequest} ... />
```

### AI Optimization — Simple Mode (recommended)
```tsx
<PromptEditor
  optimizeConfig={{
    url: 'https://api.openai.com/v1/chat/completions',
    headers: { Authorization: 'Bearer sk-...' },
    model: 'gpt-4o',
    platform: 'openai',  // 'openai' | 'dify' | 'bailian' | 'auto'
  }}
  ...
/>
```

### AI Optimization — Advanced Mode (full control)
```tsx
const handleOptimize = (request: OptimizeRequest) => {
  streamAPI(request.messages, request.signal)
    .then(content => request.applyOptimizedContent(content))
    .catch(err => request.setOptimizeError(err));
};
<PromptEditor onOptimizeRequest={handleOptimize} ... />
```

### Variable Insertion (Data Selector)

`dataSelector` must be a **React component type** (not a render function / JSX element). Variables are inserted as **plain text** at the cursor position.

```tsx
import { List, Modal, Tag } from 'antd';
import type { DataSelectorComponentProps, TagData } from 'react-prompt-editor';

const VARIABLES: TagData[] = [
  { id: 'username', label: '@用户名', value: '{{username}}',
    metadata: { desc: '当前登录用户的昵称' } },
  { id: 'date', label: '@当前日期', value: '{{current_date}}',
    metadata: { desc: '今日日期' } },
];

const DataSelector: React.FC<DataSelectorComponentProps> = ({ onSelect, onCancel }) => (
  <Modal open title="选择要插入的变量" onCancel={onCancel} footer={null}>
    <List
      dataSource={VARIABLES}
      renderItem={(item) => (
        <List.Item style={{ cursor: 'pointer' }} onClick={() => onSelect(item)}>
          <List.Item.Meta
            title={<Tag color="blue">{item.label}</Tag>}
            description={item.metadata?.desc}
          />
        </List.Item>
      )}
    />
  </Modal>
);

<PromptEditor
  value={value}
  onChange={setValue}
  dataSelector={DataSelector}
/>
```

**Key points:**
- `onSelect(item)` inserts `item.label` as plain text at the cursor position.
- `onSelect` accepts `TagData | TagData[]` — pass an array for multi-select batch insert (joined with spaces).
- Variables are plain text in the editor content — no tag widgets, no `×` close buttons.
- `onVariableChange` prop has been removed. Variable tracking is no longer needed.
- On Run, `request.content` contains the raw text including variable labels as-is.

### Preview Mode
```tsx
<PromptEditor previewMode value={data} previewRenderMode="markdown" />
// previewRenderMode: 'readonly-editor' (default) | 'markdown'
```

### Custom Node Top Slot

`renderNodeTopSlot` renders custom ReactNode **inside the editor shell, above the CodeMirror area**.

```tsx
<PromptEditor
  value={value}
  onChange={setValue}
  renderNodeTopSlot={({ node, isDarkMode }) => (
    <div style={{ padding: '6px 8px', background: isDarkMode ? '#1e3a5f' : '#eff6ff', borderRadius: 6 }}>
      Node: {node.title} — {node.hasRun ? 'ran' : 'not run'}
    </div>
  )}
/>
```

### Custom Node Actions
```tsx
<PromptEditor
  renderNodeActions={({ node, defaultActions, isDarkMode }) => (
    <Space>
      <Button onClick={defaultActions.handleRun}>Run</Button>
      <Button onClick={defaultActions.handleOptimize}>AI</Button>
      <Button onClick={defaultActions.handleOpenDataSelector}>Variable</Button>
    </Space>
  )}
  ...
/>
```

> When using `renderNodeActions`, you must manually call `defaultActions.handleOpenDataSelector/handleRun/handleOptimize` to preserve those capabilities.

### Custom Toolbar
```tsx
<PromptEditor
  renderToolbar={(actions) => (
    <Button onClick={() => actions.addRootNode()}>+ Add Node</Button>
  )}
  ...
/>
```

### Drag-and-Drop & Theme & i18n
```tsx
import { zhCN, enUS } from 'react-prompt-editor';
<PromptEditor draggable theme="dark" locale={enUS} onChange={setData} ... />
// theme: 'system' | 'light' | 'dark'
```

## Full API Reference

See [references/api_reference.md](references/api_reference.md) for complete prop/type documentation including all interfaces and callback signatures.

## Troubleshooting

- **Styles missing**: Ensure `import 'react-prompt-editor/styles/index.css'` is present.
- **Peer dep errors**: Install `antd` and `@ant-design/x` alongside the package.
- **onChange not firing**: Confirm you're passing both `value` and `onChange` (controlled mode).
- **optimizeConfig not working**: Check `platform` matches your API (`'auto'` for auto-detection).
- **Variables not showing**: `dataSelector` must be a React component, not a render function.
- **Chinese IME input**: Supported natively via CodeMirror 5. No additional configuration needed.


# React Prompt Editor (RPEditor) Skill

## Installation

```bash
pnpm add react-prompt-editor antd @ant-design/x
```

**Always import styles** (required):
```tsx
import 'react-prompt-editor/styles/index.css';
```

## Quick Start

```tsx
import { PromptEditor, TaskNode, enUS } from 'react-prompt-editor';
import 'react-prompt-editor/styles/index.css';

const [data, setData] = useState<TaskNode[]>([
  { id: '1', title: 'System Prompt', content: '# Role\nYou are a helpful assistant.', children: [], isLocked: false, hasRun: false }
]);

<PromptEditor value={data} onChange={setData} locale={enUS} />
```

## Key Concepts

- **TaskNode**: Public tree-nested format used in `value`/`onChange`. Has `children: TaskNode[]`.
- **Controlled vs uncontrolled**: Use `value`+`onChange` for controlled; `initialValue` for uncontrolled.
- **Callback-based async**: Component fires callbacks (`onRunRequest`, `onOptimizeRequest`); you handle API calls and notify component via `request.meta?.onNodeRun?.()` or `request.applyOptimizedContent()`.
- **Dependencies**: Each node can declare `dependencies: string[]` (IDs). When running, `dependenciesContent` is auto-collected and passed in `RunTaskRequest`.

## Common Patterns

### Node Execution
```tsx
const handleRunRequest = (request: RunTaskRequest) => {
  myAPI.run({ content: request.content, deps: request.dependenciesContent })
    .then(result => request.meta?.onNodeRun?.(request.nodeId, result));
};
<PromptEditor onRunRequest={handleRunRequest} ... />
```

### AI Optimization — Simple Mode (recommended)
```tsx
<PromptEditor
  optimizeConfig={{
    url: 'https://api.openai.com/v1/chat/completions',
    headers: { Authorization: 'Bearer sk-...' },
    model: 'gpt-4o',
    platform: 'openai',  // 'openai' | 'dify' | 'bailian' | 'auto'
  }}
  ...
/>
```

### AI Optimization — Advanced Mode (full control)
```tsx
const handleOptimize = (request: OptimizeRequest) => {
  streamAPI(request.messages, request.signal)
    .then(content => request.applyOptimizedContent(content))
    .catch(err => request.setOptimizeError(err));
};
<PromptEditor onOptimizeRequest={handleOptimize} ... />
```

### Variable Insertion (Data Selector)

`dataSelector` must be a **React component type** (not a render function / JSX element). The editor instantiates it when the user clicks the "Insert Variable" button or triggers it via `defaultActions.handleOpenDataSelector`.

```tsx
import { List, Modal, Tag } from 'antd';
import type {
  DataSelectorComponentProps,
  EditorVariable,
  TagData,
} from 'react-prompt-editor';

// 1. Define your variables (often from API/context)
const VARIABLES: TagData[] = [
  { id: 'username', label: '@用户名', value: '{{username}}',
    metadata: { desc: '当前登录用户的昵称' } },
  { id: 'date', label: '@当前日期', value: '{{current_date}}',
    metadata: { desc: '今日日期' } },
];

// 2. Build the selector component — receives onSelect / onCancel / cursorPosition
const DataSelector: React.FC<DataSelectorComponentProps> = ({
  onSelect,
  onCancel,
}) => (
  <Modal open title="选择要插入的变量" onCancel={onCancel} footer={null}>
    <List
      dataSource={VARIABLES}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(item)}  // inserts the tag at cursor
        >
          <List.Item.Meta
            title={<Tag color="blue">{item.label}</Tag>}
            description={item.metadata?.desc}
          />
        </List.Item>
      )}
    />
  </Modal>
);

// 3. (Optional) Track inserted variables per node
const [variableMap, setVariableMap] = useState<Record<string, EditorVariable[]>>({});
const handleVariableChange = (nodeId: string, variables: EditorVariable[]) => {
  setVariableMap((prev) => ({ ...prev, [nodeId]: variables }));
};

<PromptEditor
  value={value}
  onChange={setValue}
  dataSelector={DataSelector}           // pass component reference, NOT <DataSelector/>
  onVariableChange={handleVariableChange}
/>
```

**Key points:**
- `onSelect(item)` inserts the variable at the cursor; `item.label` is displayed as a styled tag with a `×` close button.
- Clicking `×` on a tag removes it from the editor and fires `onVariableChange` with updated positions.
- On Run, `@label` is stripped of the `@` prefix in `request.content` (e.g. `@用户名` → `用户名`). The `value` field is NOT used for run serialization.
- `onVariableChange` fires per node; keep a `Record<nodeId, EditorVariable[]>` to track state.
- To open the selector from a custom action button, call `defaultActions.handleOpenDataSelector` inside `renderNodeActions`.
- `onSelect` accepts `TagData | TagData[]` — pass an array for multi-select batch insert.

### Preview Mode
```tsx
<PromptEditor previewMode value={data} previewRenderMode="markdown" />
// previewRenderMode: 'readonly-editor' (default) | 'markdown'
```

### Custom Node Top Slot

`renderNodeTopSlot` renders custom ReactNode **inside the editor shell, above the CodeMirror area**. It shows/hides together with the editor (expands/collapses with the edit button).

```tsx
<PromptEditor
  value={value}
  onChange={setValue}
  renderNodeTopSlot={({ node, isDarkMode }) => (
    <div style={{ padding: '6px 8px', background: isDarkMode ? '#1e3a5f' : '#eff6ff', borderRadius: 6 }}>
      Node: {node.title} — {node.hasRun ? 'ran' : 'not run'}
    </div>
  )}
/>
```

Callback params: `node: TaskNode`, `isDarkMode: boolean`.

Combined with `renderNodeActions`:
```tsx
<PromptEditor
  renderNodeTopSlot={({ node }) => <Alert message={node.title} type="info" showIcon />}
  renderNodeActions={({ defaultActions }) => (
    <Space>
      <Button onClick={defaultActions.handleRun}>Run</Button>
      <Button onClick={defaultActions.handleOpenDataSelector}>Variable</Button>
    </Space>
  )}
/>
```

> When using `renderNodeActions`, you must manually call `defaultActions.handleOpenDataSelector/handleRun/handleOptimize` to preserve those capabilities.

### Custom Node Actions
```tsx
<PromptEditor
  renderNodeActions={({ node, defaultActions, isDarkMode }) => (
    <Space>
      <Button onClick={defaultActions.handleRun}>Run</Button>
      <Button onClick={defaultActions.handleOptimize}>AI</Button>
      <Button onClick={defaultActions.handleOpenDataSelector}>Variable</Button>
    </Space>
  )}
  ...
/>
```

### Custom Toolbar
```tsx
<PromptEditor
  renderToolbar={(actions) => (
    <Button onClick={() => actions.addRootNode()}>+ Add Node</Button>
  )}
  ...
/>
```

### Drag-and-Drop & Theme & i18n
```tsx
import { zhCN, enUS } from 'react-prompt-editor';
<PromptEditor draggable theme="dark" locale={enUS} onChange={setData} ... />
// theme: 'system' | 'light' | 'dark'
```

## Full API Reference

See [references/api_reference.md](references/api_reference.md) for complete prop/type documentation including all interfaces and callback signatures.

## Troubleshooting

- **Styles missing**: Ensure `import 'react-prompt-editor/styles/index.css'` is present.
- **Peer dep errors**: Install `antd` and `@ant-design/x` alongside the package.
- **onChange not firing**: Confirm you're passing both `value` and `onChange` (controlled mode).
- **optimizeConfig not working**: Check `platform` matches your API (`'auto'` for auto-detection).
- **Variables not showing**: `dataSelector` must be a React component, not a render function.
