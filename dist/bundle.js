// src/nodes/ClaudeCodeHeadlessNode.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
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
        infoBoxTitle: "Claude Code Headless Node"
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
        const prompt = rivet.getInputOrData(
          data,
          inputData,
          "prompt",
          "string"
        );
        const systemPrompt = data.useSystemPromptInput ? rivet.getInputOrData(data, inputData, "systemPrompt", "string") : data.systemPrompt;
        const sessionId = data.useSessionIdInput ? rivet.getInputOrData(data, inputData, "sessionId", "string") : data.sessionId;
        const mcpConfig = data.useMcpConfigInput ? rivet.getInputOrData(data, inputData, "mcpConfig", "string") : data.mcpConfig;
        if (!prompt || prompt.trim() === "") {
          throw new Error("Prompt is required");
        }
        try {
          await execAsync("claude --version");
        } catch (error) {
          throw new Error(
            "Claude CLI not found. Please install Claude Code CLI. Visit https://code.claude.com for installation instructions."
          );
        }
        const args = ["claude", "--print"];
        args.push("--output-format", data.outputFormat);
        if (data.model) {
          args.push("--model", data.model);
        }
        if (systemPrompt) {
          args.push("--system-prompt", `"${systemPrompt.replace(/"/g, '\\"')}"`);
        }
        if (data.appendSystemPrompt) {
          args.push(
            "--append-system-prompt",
            `"${data.appendSystemPrompt.replace(/"/g, '\\"')}"`
          );
        }
        if (data.allowedTools) {
          args.push("--allowedTools", data.allowedTools);
        }
        if (data.disallowedTools) {
          args.push("--disallowedTools", data.disallowedTools);
        }
        if (data.enableResume) {
          if (data.continueLastSession) {
            args.push("--continue");
          } else if (sessionId) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(sessionId)) {
              throw new Error(
                `Invalid session ID format: ${sessionId}. Must be a valid UUID.`
              );
            }
            args.push("--resume", sessionId);
          }
        }
        if (mcpConfig) {
          args.push("--mcp-config", `"${mcpConfig.replace(/"/g, '\\"')}"`);
        }
        if (data.permissionMode && data.permissionMode !== "default") {
          const modeMap = {
            acceptEdits: "--accept-edits",
            bypassPermissions: "--dangerously-skip-permissions",
            plan: "--plan"
          };
          args.push(modeMap[data.permissionMode]);
        }
        if (data.verbose) {
          args.push("--verbose");
        }
        if (data.fallbackModel) {
          args.push("--fallback-model", data.fallbackModel);
        }
        if (data.additionalDirs) {
          const dirs = data.additionalDirs.split(",").map((d) => d.trim());
          for (const dir of dirs) {
            if (dir) {
              args.push("--add-dir", `"${dir.replace(/"/g, '\\"')}"`);
            }
          }
        }
        args.push(`"${prompt.replace(/"/g, '\\"')}"`);
        const command = args.join(" ");
        const { stdout, stderr } = await execAsync(command, {
          maxBuffer: 10 * 1024 * 1024
          // 10MB buffer for large responses
        });
        let response = "";
        let metadata = {};
        let extractedSessionId = "";
        if (data.outputFormat === "json" || data.outputFormat === "stream-json") {
          try {
            const jsonOutput = JSON.parse(stdout);
            response = jsonOutput.response || jsonOutput.content || stdout;
            metadata = {
              cost: jsonOutput.cost,
              duration: jsonOutput.duration,
              session_id: jsonOutput.session_id,
              model: jsonOutput.model,
              ...jsonOutput.metadata
            };
            extractedSessionId = jsonOutput.session_id || "";
          } catch (parseError) {
            response = stdout;
          }
        } else {
          response = stdout;
        }
        return {
          ["response"]: {
            type: "string",
            value: response
          },
          ["metadata"]: {
            type: "object",
            value: metadata
          },
          ["success"]: {
            type: "boolean",
            value: true
          },
          ["error"]: {
            type: "string",
            value: ""
          },
          ["sessionId"]: {
            type: "string",
            value: extractedSessionId || sessionId || ""
          }
        };
      } catch (error) {
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
