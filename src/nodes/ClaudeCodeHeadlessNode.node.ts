/**
 * Node.js-specific implementation for Claude Code Headless Node
 * This file contains code that uses Node.js-only APIs like child_process
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ClaudeExecutionOptions {
  prompt: string;
  outputFormat: "text" | "json" | "stream-json";
  model?: string;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  allowedTools?: string;
  disallowedTools?: string;
  enableResume?: boolean;
  sessionId?: string;
  continueLastSession?: boolean;
  mcpConfig?: string;
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  verbose?: boolean;
  fallbackModel?: string;
  additionalDirs?: string;
}

export interface ClaudeExecutionResult {
  response: string;
  metadata: Record<string, any>;
  success: boolean;
  error: string;
  sessionId: string;
}

/**
 * Execute Claude CLI with the given options
 */
export async function executeClaude(
  options: ClaudeExecutionOptions
): Promise<ClaudeExecutionResult> {
  try {
    const { prompt, outputFormat, sessionId, mcpConfig } = options;

    // Validate required fields
    if (!prompt || prompt.trim() === "") {
      throw new Error("Prompt is required");
    }

    // Check if claude CLI is available
    try {
      await execAsync("claude --version");
    } catch (error) {
      throw new Error(
        "Claude CLI not found. Please install Claude Code CLI. Visit https://code.claude.com for installation instructions."
      );
    }

    // Build CLI command
    const args: string[] = ["claude", "--print"];

    // Add output format
    args.push("--output-format", outputFormat);

    // Add model if specified
    if (options.model) {
      args.push("--model", options.model);
    }

    // Add system prompt options
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

    // Add tool controls
    if (options.allowedTools) {
      args.push("--allowedTools", options.allowedTools);
    }

    if (options.disallowedTools) {
      args.push("--disallowedTools", options.disallowedTools);
    }

    // Add session management
    if (options.enableResume) {
      if (options.continueLastSession) {
        args.push("--continue");
      } else if (sessionId) {
        // Validate UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
          throw new Error(
            `Invalid session ID format: ${sessionId}. Must be a valid UUID.`
          );
        }
        args.push("--resume", sessionId);
      }
    }

    // Add MCP config
    if (mcpConfig) {
      args.push("--mcp-config", `"${mcpConfig.replace(/"/g, '\\"')}"`);
    }

    // Add permission mode
    if (options.permissionMode && options.permissionMode !== "default") {
      const modeMap = {
        acceptEdits: "--accept-edits",
        bypassPermissions: "--dangerously-skip-permissions",
        plan: "--plan",
      };
      args.push(modeMap[options.permissionMode]);
    }

    // Add verbose flag
    if (options.verbose) {
      args.push("--verbose");
    }

    // Add fallback model
    if (options.fallbackModel) {
      args.push("--fallback-model", options.fallbackModel);
    }

    // Add additional directories
    if (options.additionalDirs) {
      const dirs = options.additionalDirs.split(",").map((d) => d.trim());
      for (const dir of dirs) {
        if (dir) {
          args.push("--add-dir", `"${dir.replace(/"/g, '\\"')}"`);
        }
      }
    }

    // Add the prompt as the final argument
    args.push(`"${prompt.replace(/"/g, '\\"')}"`);

    // Execute the command
    const command = args.join(" ");
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
    });

    // Parse output based on format
    let response = "";
    let metadata: Record<string, any> = {};
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
          ...jsonOutput.metadata,
        };
        extractedSessionId = jsonOutput.session_id || "";
      } catch (parseError) {
        // If JSON parsing fails, treat as text
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
      sessionId: extractedSessionId || sessionId || "",
    };
  } catch (error: any) {
    return {
      response: "",
      metadata: {},
      success: false,
      error: error.message || String(error),
      sessionId: "",
    };
  }
}
