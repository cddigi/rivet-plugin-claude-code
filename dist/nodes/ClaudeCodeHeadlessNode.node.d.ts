/**
 * Node.js-specific implementation for Claude Code Headless Node
 * This file contains code that uses Node.js-only APIs like child_process
 */
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
export declare function executeClaude(options: ClaudeExecutionOptions): Promise<ClaudeExecutionResult>;
