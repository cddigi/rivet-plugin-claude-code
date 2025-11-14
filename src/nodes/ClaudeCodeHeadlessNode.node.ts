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
    console.log("[Claude Code Plugin] Starting execution...");
    const { prompt, outputFormat, sessionId, mcpConfig } = options;

    // Validate required fields
    if (!prompt || prompt.trim() === "") {
      throw new Error("Prompt is required");
    }

    // Check if claude CLI is available
    console.log("[Claude Code Plugin] Checking for Claude CLI...");
    try {
      await execAsync("claude --version");
      console.log("[Claude Code Plugin] Claude CLI found");
    } catch (error) {
      throw new Error(
        "Claude CLI not found. Please install Claude Code CLI. Visit https://code.claude.com for installation instructions."
      );
    }

    // Build CLI command
    const args: string[] = ["claude", "--print"];

    // Use JSON format internally when session management is enabled to capture session ID
    // We'll extract the text for the user if they requested text format
    const internalFormat = options.enableResume ? "json" : outputFormat;
    args.push("--output-format", internalFormat);

    // stream-json requires --verbose when using --print
    if (internalFormat === "stream-json" && !options.verbose) {
      args.push("--verbose");
    }

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
        // Use --session-id to specify the exact session ID
        args.push("--session-id", sessionId);
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

    // Don't add prompt as argument - we'll pipe it via stdin
    const command = args.join(" ");
    console.log("[Claude Code Plugin] Executing command:", command);
    console.log("[Claude Code Plugin] With stdin:", prompt);

    // Execute the command with prompt piped via stdin
    const { stdout, stderr } = await execAsync(`echo "${prompt.replace(/"/g, '\\"')}" | ${command}`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
      timeout: 300000, // 5 minute timeout
      env: { ...process.env, CI: "true" }, // Set CI env to prevent interactive prompts
      shell: true,
    });

    console.log("[Claude Code Plugin] Command completed");
    if (stderr) {
      console.log("[Claude Code Plugin] stderr:", stderr);
    }

    // Parse output based on internal format used
    let response = "";
    let metadata: Record<string, any> = {};
    let extractedSessionId = "";

    if (internalFormat === "json") {
      try {
        const jsonOutput = JSON.parse(stdout);

        // Extract metadata
        metadata = {
          cost: jsonOutput.total_cost_usd,
          duration: jsonOutput.duration_ms,
          session_id: jsonOutput.session_id,
          model: jsonOutput.model,
          usage: jsonOutput.usage,
          modelUsage: jsonOutput.modelUsage,
        };

        extractedSessionId = jsonOutput.session_id || "";

        // If user requested text format but we used JSON internally for session management,
        // extract just the text portion
        if (outputFormat === "text") {
          response = jsonOutput.result || jsonOutput.response || jsonOutput.content || jsonOutput.text || stdout;
          console.log("[Claude Code Plugin] Converted JSON to text for user, keeping session ID:", extractedSessionId);
        } else {
          // User wants JSON format - return the full JSON object as a string
          response = JSON.stringify(jsonOutput, null, 2);
        }
      } catch (parseError) {
        console.error("[Claude Code Plugin] JSON parsing failed:", parseError);
        // If JSON parsing fails, treat as text
        response = stdout;
      }
    } else if (internalFormat === "stream-json") {
      try {
        // stream-json is JSONL (newline-delimited JSON)
        // Parse all lines and get the final result
        const lines = stdout.trim().split("\n");
        let finalResult = null;

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonLine = JSON.parse(line);
              // The last line with type "result" contains the final output
              if (jsonLine.type === "result") {
                finalResult = jsonLine;
              }
            } catch (lineError) {
              console.error("[Claude Code Plugin] Failed to parse JSONL line:", line);
            }
          }
        }

        if (finalResult) {
          // Extract metadata
          metadata = {
            cost: finalResult.total_cost_usd,
            duration: finalResult.duration_ms,
            session_id: finalResult.session_id,
            model: finalResult.model,
            usage: finalResult.usage,
            modelUsage: finalResult.modelUsage,
          };

          extractedSessionId = finalResult.session_id || "";

          // If user requested text format but we used stream-json internally,
          // extract just the text portion (though this shouldn't happen normally)
          if (outputFormat === "text") {
            response = finalResult.result || finalResult.response || finalResult.content || finalResult.text || stdout;
          } else {
            // User wants stream-json format - return the full JSONL output
            response = stdout;
          }
        } else {
          console.warn("[Claude Code Plugin] No result found in stream-json output");
          response = stdout;
        }
      } catch (parseError) {
        console.error("[Claude Code Plugin] stream-json parsing failed:", parseError);
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
