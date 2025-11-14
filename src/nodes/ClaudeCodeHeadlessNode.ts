// **** IMPORTANT ****
// Make sure you do `import type` and do not pull in the entire Rivet core library here.
// Export a function that takes in a Rivet object, and you can access rivet library functionality
// from there.
import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Project,
  Rivet,
} from "@ironclad/rivet-core";

// Import types only from the Node.js implementation
import type {
  ClaudeExecutionOptions,
  ClaudeExecutionResult,
} from "./ClaudeCodeHeadlessNode.node.js";

/**
 * Claude Code Headless Node
 *
 * This node integrates Claude Code's headless mode, enabling programmatic execution
 * of Claude within Rivet workflows.
 */
export type ClaudeCodeHeadlessNode = ChartNode<
  "claudeCodeHeadless",
  ClaudeCodeHeadlessNodeData
>;

/**
 * Data structure for the Claude Code Headless Node
 */
export type ClaudeCodeHeadlessNodeData = {
  /** The prompt/query to send to Claude */
  prompt: string;

  /** Toggle for prompt input port */
  usePromptInput?: boolean;

  /** Output format selection */
  outputFormat: "text" | "json" | "stream-json";

  /** Model override (sonnet/opus/haiku or full model name) */
  model?: string;

  /** Optional system prompt override */
  systemPrompt?: string;

  /** Toggle for system prompt input port */
  useSystemPromptInput?: boolean;

  /** Additional system prompt to append to default */
  appendSystemPrompt?: string;

  /** Comma-separated list of allowed tools */
  allowedTools?: string;

  /** Comma-separated list of disallowed tools */
  disallowedTools?: string;

  /** Enable session resumption */
  enableResume?: boolean;

  /** Session ID for resume/continue */
  sessionId?: string;

  /** Toggle for session ID input port */
  useSessionIdInput?: boolean;

  /** Continue most recent conversation */
  continueLastSession?: boolean;

  /** Path to MCP config file or JSON string */
  mcpConfig?: string;

  /** Toggle for MCP config input port */
  useMcpConfigInput?: boolean;

  /** Permission mode for Claude execution */
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";

  /** Enable verbose logging */
  verbose?: boolean;

  /** Fallback model when default is overloaded */
  fallbackModel?: string;

  /** Additional directories to include in context */
  additionalDirs?: string;
};

/**
 * Creates the Claude Code Headless node implementation
 */
export function claudeCodeHeadlessNode(rivet: typeof Rivet) {
  const ClaudeCodeHeadlessNodeImpl: PluginNodeImpl<ClaudeCodeHeadlessNode> = {
    create(): ClaudeCodeHeadlessNode {
      const node: ClaudeCodeHeadlessNode = {
        id: rivet.newId<NodeId>(),
        data: {
          prompt: "Hello, Claude!",
          outputFormat: "text",
          permissionMode: "default",
          verbose: false,
          enableResume: false,
          continueLastSession: false,
        },
        title: "Claude Code Headless",
        type: "claudeCodeHeadless",
        visualData: {
          x: 0,
          y: 0,
          width: 300,
        },
      };
      return node;
    },

    getInputDefinitions(
      data: ClaudeCodeHeadlessNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project
    ): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      if (data.usePromptInput) {
        inputs.push({
          id: "prompt" as PortId,
          dataType: "string",
          title: "Prompt",
        });
      }

      if (data.useSystemPromptInput) {
        inputs.push({
          id: "systemPrompt" as PortId,
          dataType: "string",
          title: "System Prompt",
        });
      }

      if (data.useSessionIdInput && data.enableResume) {
        inputs.push({
          id: "sessionId" as PortId,
          dataType: "string",
          title: "Session ID",
        });
      }

      if (data.useMcpConfigInput) {
        inputs.push({
          id: "mcpConfig" as PortId,
          dataType: "string",
          title: "MCP Config",
        });
      }

      return inputs;
    },

    getOutputDefinitions(
      _data: ClaudeCodeHeadlessNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project
    ): NodeOutputDefinition[] {
      return [
        {
          id: "response" as PortId,
          dataType: "string",
          title: "Response",
        },
        {
          id: "metadata" as PortId,
          dataType: "object",
          title: "Metadata",
        },
        {
          id: "success" as PortId,
          dataType: "boolean",
          title: "Success",
        },
        {
          id: "error" as PortId,
          dataType: "string",
          title: "Error",
        },
        {
          id: "sessionId" as PortId,
          dataType: "string",
          title: "Session ID",
        },
      ];
    },

    getUIData(): NodeUIData {
      return {
        contextMenuTitle: "Claude Code Headless",
        group: "Claude",
        infoBoxBody:
          "Execute Claude Code in headless mode. Supports prompts, session management, tool control, and MCP integration.",
        infoBoxTitle: "Claude Code Headless Node",
        infoBoxImageUri: "image.png",
      };
    },

    getEditors(
      data: ClaudeCodeHeadlessNodeData
    ): EditorDefinition<ClaudeCodeHeadlessNode>[] {
      const editors: EditorDefinition<ClaudeCodeHeadlessNode>[] = [
        {
          type: "string",
          dataKey: "prompt",
          useInputToggleDataKey: "usePromptInput",
          label: "Prompt",
        },
        {
          type: "dropdown",
          dataKey: "outputFormat",
          label: "Output Format",
          options: [
            { label: "Text", value: "text" },
            { label: "JSON", value: "json" },
            { label: "Stream JSON", value: "stream-json" },
          ],
        },
        {
          type: "string",
          dataKey: "model",
          label: "Model (optional)",
        },
        {
          type: "string",
          dataKey: "systemPrompt",
          useInputToggleDataKey: "useSystemPromptInput",
          label: "System Prompt (optional)",
        },
        {
          type: "string",
          dataKey: "appendSystemPrompt",
          label: "Append System Prompt (optional)",
        },
        {
          type: "string",
          dataKey: "allowedTools",
          label: "Allowed Tools (comma-separated)",
        },
        {
          type: "string",
          dataKey: "disallowedTools",
          label: "Disallowed Tools (comma-separated)",
        },
        {
          type: "toggle",
          dataKey: "enableResume",
          label: "Enable Session Management",
        },
      ];

      // Conditionally show session-related editors
      if (data.enableResume) {
        editors.push(
          {
            type: "string",
            dataKey: "sessionId",
            useInputToggleDataKey: "useSessionIdInput",
            label: "Session ID (optional)",
          },
          {
            type: "toggle",
            dataKey: "continueLastSession",
            label: "Continue Last Session",
          }
        );
      }

      editors.push(
        {
          type: "string",
          dataKey: "mcpConfig",
          useInputToggleDataKey: "useMcpConfigInput",
          label: "MCP Config (path or JSON)",
        },
        {
          type: "dropdown",
          dataKey: "permissionMode",
          label: "Permission Mode",
          options: [
            { label: "Default", value: "default" },
            { label: "Accept Edits", value: "acceptEdits" },
            { label: "Bypass Permissions", value: "bypassPermissions" },
            { label: "Plan Mode", value: "plan" },
          ],
        },
        {
          type: "toggle",
          dataKey: "verbose",
          label: "Verbose Logging",
        },
        {
          type: "string",
          dataKey: "fallbackModel",
          label: "Fallback Model (optional)",
        },
        {
          type: "string",
          dataKey: "additionalDirs",
          label: "Additional Directories (comma-separated)",
        }
      );

      return editors;
    },

    getBody(
      data: ClaudeCodeHeadlessNodeData
    ): string | NodeBodySpec | NodeBodySpec[] | undefined {
      const promptDisplay = data.usePromptInput
        ? "(Using Input)"
        : data.prompt.length > 50
        ? data.prompt.substring(0, 50) + "..."
        : data.prompt;

      const parts = [`Prompt: ${promptDisplay}`, `Format: ${data.outputFormat}`];

      if (data.model) {
        parts.push(`Model: ${data.model}`);
      }

      if (data.enableResume) {
        if (data.continueLastSession) {
          parts.push("Session: Continue Last");
        } else if (data.sessionId || data.useSessionIdInput) {
          parts.push(
            `Session: ${data.useSessionIdInput ? "(Using Input)" : data.sessionId}`
          );
        }
      }

      return rivet.dedent`
        ${parts.join("\n")}
      `;
    },

    async process(
      data: ClaudeCodeHeadlessNodeData,
      inputData: Inputs,
      _context: InternalProcessContext
    ): Promise<Outputs> {
      try {
        console.log("[Claude Code Node] Process started");

        // Extract input values
        const prompt = rivet.getInputOrData(
          data,
          inputData,
          "prompt",
          "string"
        );

        console.log("[Claude Code Node] Prompt:", prompt);

        const systemPrompt = data.useSystemPromptInput
          ? rivet.getInputOrData(data, inputData, "systemPrompt", "string")
          : data.systemPrompt;

        const sessionId = data.useSessionIdInput
          ? rivet.getInputOrData(data, inputData, "sessionId", "string")
          : data.sessionId;

        const mcpConfig = data.useMcpConfigInput
          ? rivet.getInputOrData(data, inputData, "mcpConfig", "string")
          : data.mcpConfig;

        // Dynamically import the Node.js implementation
        console.log("[Claude Code Node] Attempting dynamic import...");
        const { executeClaude } = await import(
          "./ClaudeCodeHeadlessNode.node.js"
        );
        console.log("[Claude Code Node] Dynamic import successful");

        // Build execution options
        const options: ClaudeExecutionOptions = {
          prompt,
          outputFormat: data.outputFormat,
          model: data.model,
          systemPrompt,
          appendSystemPrompt: data.appendSystemPrompt,
          allowedTools: data.allowedTools,
          disallowedTools: data.disallowedTools,
          enableResume: data.enableResume,
          sessionId,
          continueLastSession: data.continueLastSession,
          mcpConfig,
          permissionMode: data.permissionMode,
          verbose: data.verbose,
          fallbackModel: data.fallbackModel,
          additionalDirs: data.additionalDirs,
        };

        // Execute Claude CLI
        console.log("[Claude Code Node] Calling executeClaude...");
        const result = await executeClaude(options);
        console.log("[Claude Code Node] executeClaude returned:", result.success);

        return {
          ["response" as PortId]: {
            type: "string",
            value: result.response,
          },
          ["metadata" as PortId]: {
            type: "object",
            value: result.metadata,
          },
          ["success" as PortId]: {
            type: "boolean",
            value: result.success,
          },
          ["error" as PortId]: {
            type: "string",
            value: result.error,
          },
          ["sessionId" as PortId]: {
            type: "string",
            value: result.sessionId,
          },
        };
      } catch (error: any) {
        console.error("[Claude Code Node] Error:", error);
        return {
          ["response" as PortId]: {
            type: "string",
            value: "",
          },
          ["metadata" as PortId]: {
            type: "object",
            value: {},
          },
          ["success" as PortId]: {
            type: "boolean",
            value: false,
          },
          ["error" as PortId]: {
            type: "string",
            value: error.message || String(error),
          },
          ["sessionId" as PortId]: {
            type: "string",
            value: "",
          },
        };
      }
    },
  };

  const claudeCodeHeadlessNodeDefinition = rivet.pluginNodeDefinition(
    ClaudeCodeHeadlessNodeImpl,
    "Claude Code Headless"
  );

  return claudeCodeHeadlessNodeDefinition;
}
