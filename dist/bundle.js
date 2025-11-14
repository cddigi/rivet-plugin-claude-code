// image.png
var image_default = "data:image/png;base64,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";

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
        infoBoxImageUri: image_default
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
