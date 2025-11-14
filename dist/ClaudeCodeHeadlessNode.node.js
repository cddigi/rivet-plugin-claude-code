// src/nodes/ClaudeCodeHeadlessNode.node.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
async function executeClaude(options) {
  try {
    const { prompt, outputFormat, sessionId, mcpConfig } = options;
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
    args.push("--output-format", outputFormat);
    if (options.model) {
      args.push("--model", options.model);
    }
    if (options.systemPrompt) {
      args.push(
        "--system-prompt",
        `"${options.systemPrompt.replace(/"/g, '\\"')}"`
      );
    }
    if (options.appendSystemPrompt) {
      args.push(
        "--append-system-prompt",
        `"${options.appendSystemPrompt.replace(/"/g, '\\"')}"`
      );
    }
    if (options.allowedTools) {
      args.push("--allowedTools", options.allowedTools);
    }
    if (options.disallowedTools) {
      args.push("--disallowedTools", options.disallowedTools);
    }
    if (options.enableResume) {
      if (options.continueLastSession) {
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
    if (options.permissionMode && options.permissionMode !== "default") {
      const modeMap = {
        acceptEdits: "--accept-edits",
        bypassPermissions: "--dangerously-skip-permissions",
        plan: "--plan"
      };
      args.push(modeMap[options.permissionMode]);
    }
    if (options.verbose) {
      args.push("--verbose");
    }
    if (options.fallbackModel) {
      args.push("--fallback-model", options.fallbackModel);
    }
    if (options.additionalDirs) {
      const dirs = options.additionalDirs.split(",").map((d) => d.trim());
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
    if (outputFormat === "json" || outputFormat === "stream-json") {
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
      response,
      metadata,
      success: true,
      error: "",
      sessionId: extractedSessionId || sessionId || ""
    };
  } catch (error) {
    return {
      response: "",
      metadata: {},
      success: false,
      error: error.message || String(error),
      sessionId: ""
    };
  }
}
export {
  executeClaude
};
