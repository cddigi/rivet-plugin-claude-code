import type { ChartNode, Rivet } from "@ironclad/rivet-core";
/**
 * Claude Code Headless Node
 *
 * This node integrates Claude Code's headless mode, enabling programmatic execution
 * of Claude within Rivet workflows.
 */
export type ClaudeCodeHeadlessNode = ChartNode<"claudeCodeHeadless", ClaudeCodeHeadlessNodeData>;
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
export declare function claudeCodeHeadlessNode(rivet: typeof Rivet): import("@ironclad/rivet-core").PluginNodeDefinition<ClaudeCodeHeadlessNode>;
