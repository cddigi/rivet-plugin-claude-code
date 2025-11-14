// src/nodes/ClaudeCodeHeadlessNode.ts
function claudeCodeHeadlessNode(rivet) {
  const ClaudeCodeHeadlessNodeImpl = {
    create() {
      const node = {
        id: rivet.newId(),
        data: {
          prompt: "Hello, Claude!",
          outputFormat: "text",
          permissionMode: "default",
          verbose: false,
          enableResume: false,
          continueLastSession: false
        },
        title: "Claude Code Headless",
        type: "claudeCodeHeadless",
        visualData: {
          x: 0,
          y: 0,
          width: 300
        }
      };
      return node;
    },
    getInputDefinitions(data, _connections, _nodes, _project) {
      const inputs = [];
      if (data.usePromptInput) {
        inputs.push({
          id: "prompt",
          dataType: "string",
          title: "Prompt"
        });
      }
      if (data.useSystemPromptInput) {
        inputs.push({
          id: "systemPrompt",
          dataType: "string",
          title: "System Prompt"
        });
      }
      if (data.useSessionIdInput && data.enableResume) {
        inputs.push({
          id: "sessionId",
          dataType: "string",
          title: "Session ID"
        });
      }
      if (data.useMcpConfigInput) {
        inputs.push({
          id: "mcpConfig",
          dataType: "string",
          title: "MCP Config"
        });
      }
      return inputs;
    },
    getOutputDefinitions(_data, _connections, _nodes, _project) {
      return [
        {
          id: "response",
          dataType: "string",
          title: "Response"
        },
        {
          id: "metadata",
          dataType: "object",
          title: "Metadata"
        },
        {
          id: "success",
          dataType: "boolean",
          title: "Success"
        },
        {
          id: "error",
          dataType: "string",
          title: "Error"
        },
        {
          id: "sessionId",
          dataType: "string",
          title: "Session ID"
        }
      ];
    },
    getUIData() {
      return {
        contextMenuTitle: "Claude Code Headless",
        group: "Claude",
        infoBoxBody: "Execute Claude Code in headless mode. Supports prompts, session management, tool control, and MCP integration.",
        infoBoxTitle: "Claude Code Headless Node",
        infoBoxImageUri: "image.png"
      };
    },
    getEditors(data) {
      const editors = [
        {
          type: "string",
          dataKey: "prompt",
          useInputToggleDataKey: "usePromptInput",
          label: "Prompt"
        },
        {
          type: "dropdown",
          dataKey: "outputFormat",
          label: "Output Format",
          options: [
            { label: "Text", value: "text" },
            { label: "JSON", value: "json" },
            { label: "Stream JSON", value: "stream-json" }
          ]
        },
        {
          type: "string",
          dataKey: "model",
          label: "Model (optional)"
        },
        {
          type: "string",
          dataKey: "systemPrompt",
          useInputToggleDataKey: "useSystemPromptInput",
          label: "System Prompt (optional)"
        },
        {
          type: "string",
          dataKey: "appendSystemPrompt",
          label: "Append System Prompt (optional)"
        },
        {
          type: "string",
          dataKey: "allowedTools",
          label: "Allowed Tools (comma-separated)"
        },
        {
          type: "string",
          dataKey: "disallowedTools",
          label: "Disallowed Tools (comma-separated)"
        },
        {
          type: "toggle",
          dataKey: "enableResume",
          label: "Enable Session Management"
        }
      ];
      if (data.enableResume) {
        editors.push(
          {
            type: "string",
            dataKey: "sessionId",
            useInputToggleDataKey: "useSessionIdInput",
            label: "Session ID (optional)"
          },
          {
            type: "toggle",
            dataKey: "continueLastSession",
            label: "Continue Last Session"
          }
        );
      }
      editors.push(
        {
          type: "string",
          dataKey: "mcpConfig",
          useInputToggleDataKey: "useMcpConfigInput",
          label: "MCP Config (path or JSON)"
        },
        {
          type: "dropdown",
          dataKey: "permissionMode",
          label: "Permission Mode",
          options: [
            { label: "Default", value: "default" },
            { label: "Accept Edits", value: "acceptEdits" },
            { label: "Bypass Permissions", value: "bypassPermissions" },
            { label: "Plan Mode", value: "plan" }
          ]
        },
        {
          type: "toggle",
          dataKey: "verbose",
          label: "Verbose Logging"
        },
        {
          type: "string",
          dataKey: "fallbackModel",
          label: "Fallback Model (optional)"
        },
        {
          type: "string",
          dataKey: "additionalDirs",
          label: "Additional Directories (comma-separated)"
        }
      );
      return editors;
    },
    getBody(data) {
      const promptDisplay = data.usePromptInput ? "(Using Input)" : data.prompt.length > 50 ? data.prompt.substring(0, 50) + "..." : data.prompt;
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
    async process(data, inputData, _context) {
      try {
        console.log("[Claude Code Node] Process started");
        const prompt = rivet.getInputOrData(
          data,
          inputData,
          "prompt",
          "string"
        );
        console.log("[Claude Code Node] Prompt:", prompt);
        const systemPrompt = data.useSystemPromptInput ? rivet.getInputOrData(data, inputData, "systemPrompt", "string") : data.systemPrompt;
        const sessionId = data.useSessionIdInput ? rivet.getInputOrData(data, inputData, "sessionId", "string") : data.sessionId;
        const mcpConfig = data.useMcpConfigInput ? rivet.getInputOrData(data, inputData, "mcpConfig", "string") : data.mcpConfig;
        console.log("[Claude Code Node] Attempting dynamic import...");
        const { executeClaude } = await import("./ClaudeCodeHeadlessNode.node.js");
        console.log("[Claude Code Node] Dynamic import successful");
        const options = {
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
          additionalDirs: data.additionalDirs
        };
        console.log("[Claude Code Node] Calling executeClaude...");
        const result = await executeClaude(options);
        console.log("[Claude Code Node] executeClaude returned:", result.success);
        return {
          ["response"]: {
            type: "string",
            value: result.response
          },
          ["metadata"]: {
            type: "object",
            value: result.metadata
          },
          ["success"]: {
            type: "boolean",
            value: result.success
          },
          ["error"]: {
            type: "string",
            value: result.error
          },
          ["sessionId"]: {
            type: "string",
            value: result.sessionId
          }
        };
      } catch (error) {
        console.error("[Claude Code Node] Error:", error);
        return {
          ["response"]: {
            type: "string",
            value: ""
          },
          ["metadata"]: {
            type: "object",
            value: {}
          },
          ["success"]: {
            type: "boolean",
            value: false
          },
          ["error"]: {
            type: "string",
            value: error.message || String(error)
          },
          ["sessionId"]: {
            type: "string",
            value: ""
          }
        };
      }
    }
  };
  const claudeCodeHeadlessNodeDefinition = rivet.pluginNodeDefinition(
    ClaudeCodeHeadlessNodeImpl,
    "Claude Code Headless"
  );
  return claudeCodeHeadlessNodeDefinition;
}

// src/index.ts
var plugin = (rivet) => {
  const claudeHeadlessNode = claudeCodeHeadlessNode(rivet);
  const claudeCodePlugin = {
    // The ID of your plugin should be unique across all plugins.
    id: "claude-code",
    // The name of the plugin is what is displayed in the Rivet UI.
    name: "Claude Code",
    // Define all configuration settings in the configSpec object.
    configSpec: {
      defaultModel: {
        type: "string",
        label: "Default Model",
        description: "Default Claude model to use (sonnet/opus/haiku or full model name)",
        helperText: "Leave empty to use Claude Code's default model"
      }
    },
    // Define any additional context menu groups your plugin adds here.
    contextMenuGroups: [
      {
        id: "claude",
        label: "Claude"
      }
    ],
    // Register any additional nodes your plugin adds here. This is passed a `register`
    // function, which you can use to register your nodes.
    register: (register) => {
      register(claudeHeadlessNode);
    }
  };
  return claudeCodePlugin;
};
var src_default = plugin;
export {
  src_default as default
};
