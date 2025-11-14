<h1 align="center"><img src="https://rivet.ironcladapp.com/img/logo-banner-wide.png" alt="Rivet Logo"></h1>

# Rivet Claude Code Plugin

A [Rivet](https://github.com/Ironclad/rivet) plugin that integrates Claude Code's headless mode, enabling programmatic execution of Claude within Rivet workflows.

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Using the plugin](#using-the-plugin)
  - [In Rivet](#in-rivet)
  - [In Code](#in-code)
- [Node Reference](#node-reference)
  - [Claude Code Headless Node](#claude-code-headless-node)
  - [Configuration Options](#configuration-options)
  - [Input Ports](#input-ports)
  - [Output Ports](#output-ports)
- [Usage Examples](#usage-examples)
  - [Basic Prompt Execution](#basic-prompt-execution)
  - [Multi-Turn Conversations](#multi-turn-conversations)
  - [Tool Control](#tool-control)
  - [MCP Integration](#mcp-integration)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

## Features

- **Full Claude Code Integration** - Execute Claude Code in headless mode directly from Rivet workflows
- **Multiple Output Formats** - Support for text, JSON, and stream-JSON output formats
- **Session Management** - Resume conversations by ID or continue the last session for multi-turn interactions
- **Tool Control** - Fine-grained control over which tools Claude can use (allowedTools/disallowedTools)
- **System Prompt Customization** - Override or append to Claude's system prompt
- **MCP Support** - Integration with Model Context Protocol servers via configuration
- **Permission Modes** - Control Claude's behavior with different permission modes (default, acceptEdits, bypassPermissions, plan)
- **Model Selection** - Choose specific models and configure fallback options
- **Comprehensive Error Handling** - Clear error messages with actionable guidance

## Prerequisites

Before using this plugin, you must have Claude Code CLI installed:

1. Visit [https://code.claude.com](https://code.claude.com) for installation instructions
2. Verify installation by running `claude --version` in your terminal

## Using the plugin

### In Rivet

To use this plugin in Rivet:

1. Open the plugins overlay at the top of the screen
2. Search for "rivet-plugin-claude-code"
3. Click the "Install" button to install the plugin into your current project
4. The "Claude Code Headless" node will appear in the "Claude" context menu group

### In Code

Load your plugin and Rivet into your application:

```ts
import * as Rivet from "@ironclad/rivet-core";
import claudeCodePlugin from "rivet-plugin-claude-code";
```

Register your plugin with Rivet:

```ts
Rivet.globalRivetNodeRegistry.registerPlugin(claudeCodePlugin(Rivet));
```

## Node Reference

### Claude Code Headless Node

The Claude Code Headless node executes Claude Code in headless mode and returns the response along with metadata.

**Location:** Context Menu → Claude → Claude Code Headless

### Configuration Options

#### Basic Configuration

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| **Prompt** | string | The prompt/query to send to Claude | "Hello, Claude!" |
| **Output Format** | dropdown | Response format: `text`, `json`, or `stream-json` | `text` |
| **Model** | string | Model override (sonnet/opus/haiku or full model name) | _(empty)_ |

#### System Prompts

| Option | Type | Description |
|--------|------|-------------|
| **System Prompt** | string | Override the default system prompt completely |
| **Append System Prompt** | string | Additional text to append to the default system prompt |

#### Tool Control

| Option | Type | Description |
|--------|------|-------------|
| **Allowed Tools** | string | Comma-separated list of tools Claude can use (e.g., "Bash,Read,Write") |
| **Disallowed Tools** | string | Comma-separated list of tools Claude cannot use (e.g., "WebFetch,WebSearch") |

#### Session Management

| Option | Type | Description |
|--------|------|-------------|
| **Enable Session Management** | toggle | Enable session resume/continue functionality |
| **Session ID** | string | UUID of a previous session to resume (requires Enable Session Management) |
| **Continue Last Session** | toggle | Continue the most recent conversation (requires Enable Session Management) |

#### Advanced Options

| Option | Type | Description |
|--------|------|-------------|
| **MCP Config** | string | Path to MCP config file or JSON string |
| **Permission Mode** | dropdown | `default`, `acceptEdits`, `bypassPermissions`, or `plan` |
| **Verbose Logging** | toggle | Enable verbose output for debugging |
| **Fallback Model** | string | Model to use if default is overloaded |
| **Additional Directories** | string | Comma-separated paths to include in context |

### Input Ports

All input ports are **conditional** and only appear when their corresponding "use input" toggle is enabled in the node editor. This allows you to connect dynamic values from other nodes in your graph.

| Port | Type | Toggle Setting | Description |
|------|------|----------------|-------------|
| **Prompt** | string | `usePromptInput` | Dynamic prompt input. Overrides the static prompt field when connected. |
| **System Prompt** | string | `useSystemPromptInput` | Dynamic system prompt. Overrides the static system prompt field when connected. |
| **Session ID** | string | `useSessionIdInput` | Dynamic session ID for resuming conversations. Must be a valid UUID. |
| **MCP Config** | string | `useMcpConfigInput` | Dynamic MCP configuration. Can be a file path or JSON string. |

**Example:** To create a dynamic prompt from user input, enable the "Use Prompt Input" toggle and connect a Text node or user input to the Prompt port.

### Output Ports

All output ports are **always available** and provide different aspects of the Claude execution result.

| Port | Type | Always Present | Description | Example Value |
|------|------|----------------|-------------|---------------|
| **Response** | string | ✅ | The response from Claude. Format depends on Output Format setting. | Text: `"Hello! How can I help?"` <br> JSON: `{"type":"result","result":"..."}` <br> Stream-JSON: JSONL stream |
| **Metadata** | object | ✅ | Execution metadata including cost, duration, and usage statistics. | `{"cost": 0.0063, "duration": 2257, "session_id": "...", "usage": {...}}` |
| **Success** | boolean | ✅ | `true` if execution succeeded, `false` if an error occurred. | `true` or `false` |
| **Error** | string | ✅ | Error message if execution failed. Empty string on success. | `""` (success) or `"Claude CLI not found..."` (error) |
| **Session ID** | string | ✅ | UUID of the session. Populated when Session Management is enabled. | `"354f251b-b47f-4552-b01d-74ccd2533ded"` |

#### Output Format Behavior

The **Response** port returns different formats based on the **Output Format** setting:

**Text Format:**
```
Hello! How can I help you today?
```

**JSON Format:**
```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 2257,
  "result": "Hello! How can I help you today?",
  "session_id": "354f251b-b47f-4552-b01d-74ccd2533ded",
  "total_cost_usd": 0.0063495,
  "usage": {
    "input_tokens": 1,
    "output_tokens": 39,
    ...
  }
}
```

**Stream-JSON Format:**
```jsonl
{"type":"text","text":"Hello"}
{"type":"text","text":"!"}
{"type":"text","text":" How"}
...
{"type":"result","result":"Hello! How can I help you today?","session_id":"..."}
```

#### Metadata Object Structure

The **Metadata** port always returns an object with the following structure:

```json
{
  "cost": 0.0063495,              // Total cost in USD
  "duration": 2257,                // Execution time in milliseconds
  "session_id": "354f251b-...",   // Session UUID
  "model": "claude-sonnet-4-5-20250929",  // Model used
  "usage": {
    "input_tokens": 1,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 19205,
    "output_tokens": 39
  },
  "modelUsage": {
    "claude-sonnet-4-5-20250929": {
      "inputTokens": 1,
      "outputTokens": 39,
      "costUSD": 0.0063495
    }
  }
}
```

**Note:** Metadata is extracted from JSON output even when using text format (if Session Management is enabled).

## Usage Examples

### Basic Prompt Execution

The simplest usage - send a prompt and get a text response:

1. Add a "Claude Code Headless" node to your graph
2. Set the **Prompt** field to your question (e.g., "What is 2+2?")
3. Keep **Output Format** as `text`
4. Connect the **Response** output to display or process the answer

### Multi-Turn Conversations

To maintain context across multiple prompts:

**Initial Turn:**
1. Create a Claude Code Headless node with your first prompt
2. Enable **Enable Session Management** toggle
3. Run the node and capture the **Session ID** output

**Subsequent Turns:**
1. Create another Claude Code Headless node with your follow-up prompt
2. Enable **Enable Session Management** toggle
3. Set **Session ID** to the captured ID from the first turn, OR
4. Enable **Continue Last Session** to automatically continue the previous conversation

### Tool Control

To restrict Claude to only specific tools:

1. Set **Allowed Tools** to `Read,Grep,Glob` (only file reading operations)
2. This prevents Claude from modifying files or executing commands

Or to prevent specific tools:

1. Set **Disallowed Tools** to `WebFetch,WebSearch,Bash` (no web access or command execution)

### MCP Integration

To use Model Context Protocol servers:

1. Set **MCP Config** to a file path: `/path/to/mcp-config.json`
2. Or provide inline JSON configuration
3. Claude will have access to the MCP server's tools and resources

## Local Development

### Setup

1. Clone this repository
2. Run `yarn install` to install dependencies
3. Run `yarn dev` to start the compiler and bundler in watch mode

### Development Workflow

1. `yarn dev` watches for changes and automatically rebuilds to `dist/`
2. The bundler syncs changes to Rivet's plugin directory (with `--sync` flag)
3. Restart Rivet to see changes
4. Use `yarn build` for a production build

### Project Structure

```
rivet-plugin-claude-code/
├── src/
│   ├── index.ts                       # Plugin registration
│   └── nodes/
│       └── ClaudeCodeHeadlessNode.ts  # Main node implementation
├── dist/                              # Compiled output
├── bundle.ts                          # Build configuration
├── package.json                       # Project metadata
└── README.md                          # This file
```

### Testing

The plugin requires Claude Code CLI to be installed for testing:

```bash
# Verify Claude CLI is available
claude --version

# Build the plugin
yarn build

# The plugin is ready to load in Rivet
```

## Troubleshooting

### "Claude CLI not found" Error

**Problem:** The node returns an error that Claude CLI is not available.

**Solution:**
- Install Claude Code CLI from [https://code.claude.com](https://code.claude.com)
- Ensure `claude` is in your PATH by running `claude --version` in terminal
- Restart Rivet after installing Claude CLI

### Session ID Validation Error

**Problem:** Error message about invalid session ID format.

**Solution:**
- Session IDs must be valid UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Use the **Session ID** output from a previous execution
- Or enable **Continue Last Session** instead of manually entering an ID

### Permission Errors

**Problem:** Claude cannot perform certain operations due to permissions.

**Solution:**
- Check the **Permission Mode** setting
- Use `acceptEdits` to automatically accept file edits
- Use `bypassPermissions` to skip permission checks (use with caution)
- Use `plan` mode for planning without execution

### JSON Parsing Errors

**Problem:** When using `json` output format, the response cannot be parsed.

**Solution:**
- Ensure your prompt asks for a specific format
- The Claude CLI may return text even with `--output-format json` for certain prompts
- Check the **Error** output for parsing details
- The **Response** output will contain raw text as fallback

### Large Response Timeouts

**Problem:** Long-running prompts timeout or fail.

**Solution:**
- The node uses a 10MB buffer for responses (configurable in code)
- Complex tasks may take time - this is expected behavior
- Check **Verbose Logging** for detailed execution information
- Consider breaking complex tasks into smaller steps

## Contributing

Issues and pull requests are welcome! Please visit:
- GitHub: [https://github.com/lawls/rivet-plugin-claude-code](https://github.com/lawls/rivet-plugin-claude-code)

## License

MIT License - see LICENSE file for details

## Credits

- Built for [Rivet](https://github.com/Ironclad/rivet) by Ironclad
- Integrates [Claude Code](https://code.claude.com) by Anthropic
