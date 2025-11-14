# Claude Code Headless Plugin - Implementation Plan

## Overview
Implement a Rivet plugin node that integrates Claude Code's headless mode, enabling programmatic execution of Claude within Rivet workflows.

## Reference Materials
- **Example Plugins**:
  - https://github.com/cddigi/rivet-plugin-orama (complex plugin with multiple nodes)
  - https://github.com/cddigi/rivet-plugin-guid (simple single-node plugin)
- **Claude Code Headless Docs**: https://code.claude.com/docs/en/headless
- **Claude CLI Help**: Available via `claude --help`
- **Current Project**: /Users/lawls/Development/github/rivet-plugin-claude-code

---

## Stage 1: Core Node Type Definition
**Goal**: Define the TypeScript types for ClaudeCodeHeadlessNode
**Status**: Complete

### Tasks:
1. Create `src/nodes/ClaudeCodeHeadlessNode.ts`
2. Define `ClaudeCodeHeadlessNode` type extending `ChartNode`
3. Define `ClaudeCodeHeadlessNodeData` interface with fields:
   - `prompt: string` - The prompt/query to send
   - `usePromptInput?: boolean` - Toggle for prompt input port
   - `outputFormat: 'text' | 'json' | 'stream-json'` - Output format selection
   - `model?: string` - Model override (sonnet/opus/haiku or full name)
   - `systemPrompt?: string` - Optional system prompt
   - `useSystemPromptInput?: boolean` - Toggle for system prompt input
   - `appendSystemPrompt?: string` - Additional system prompt to append
   - `allowedTools?: string` - Comma-separated list of allowed tools
   - `disallowedTools?: string` - Comma-separated list of disallowed tools
   - `enableResume?: boolean` - Enable session resumption
   - `sessionId?: string` - Session ID for resume/continue
   - `useSessionIdInput?: boolean` - Toggle for session ID input
   - `continueLastSession?: boolean` - Continue most recent conversation
   - `mcpConfig?: string` - Path to MCP config file or JSON string
   - `useMcpConfigInput?: boolean` - Toggle for MCP config input
   - `permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'`
   - `verbose?: boolean` - Enable verbose logging
   - `fallbackModel?: string` - Fallback model when default is overloaded

### Success Criteria:
- [ ] Type definitions compile without errors
- [ ] All data fields are properly typed
- [ ] Follows pattern from ExamplePluginNode.ts

### Documentation References:
- CLI flags from `claude --help` output
- ExamplePluginNode.ts lines 24-36 for type structure
- Headless docs for available options

---

## Stage 2: Basic Node Structure Implementation
**Goal**: Implement create(), getUIData(), getBody(), and getEditors() methods
**Status**: Complete

### Tasks:
1. Implement `create()` method:
   - Set default values for all data fields
   - Use `rivet.newId<NodeId>()` for ID generation
   - Set reasonable default title and visualData
2. Implement `getUIData()`:
   - Set contextMenuTitle to "Claude Code Headless"
   - Set group to "Claude" or "AI"
   - Write clear infoBoxBody and infoBoxTitle
3. Implement `getBody()`:
   - Display current prompt (or "(Using Input)" if toggled)
   - Show output format and model if set
   - Show session info if resume is enabled
4. Implement `getEditors()`:
   - String editor for prompt with input toggle
   - Dropdown for outputFormat (text/json/stream-json)
   - String editor for model (optional)
   - String editor for systemPrompt with input toggle
   - String editor for appendSystemPrompt
   - String editor for allowedTools
   - String editor for disallowedTools
   - Toggle for enableResume
   - String editor for sessionId with input toggle (visible when enableResume)
   - Toggle for continueLastSession (visible when enableResume)
   - String editor for mcpConfig with input toggle
   - Dropdown for permissionMode
   - Toggle for verbose
   - String editor for fallbackModel

### Success Criteria:
- [ ] Node can be created and appears in Rivet UI
- [ ] All editors are accessible and functional
- [ ] Node body displays current configuration clearly
- [ ] UI follows Rivet conventions

### Documentation References:
- ExamplePluginNode.ts lines 44-141 for implementation patterns
- Rivet editor types: string, dropdown, toggle, number

---

## Stage 3: Input/Output Port Definitions
**Goal**: Define all input and output ports for the node
**Status**: Complete

### Tasks:
1. Implement `getInputDefinitions()`:
   - Conditional input port for `prompt` (string) if `usePromptInput` is true
   - Conditional input port for `systemPrompt` (string) if `useSystemPromptInput` is true
   - Conditional input port for `sessionId` (string) if `useSessionIdInput` is true
   - Conditional input port for `mcpConfig` (string) if `useMcpConfigInput` is true

2. Implement `getOutputDefinitions()`:
   - Output port `response` (string) - The text response from Claude
   - Output port `metadata` (object) - JSON metadata (cost, duration, session_id, etc.)
   - Output port `success` (boolean) - Whether execution succeeded
   - Output port `error` (string) - Error message if execution failed
   - Output port `sessionId` (string) - The session ID used/created

### Success Criteria:
- [ ] Input ports appear/disappear based on toggle states
- [ ] All output ports are properly typed
- [ ] Port IDs are unique and consistent

### Documentation References:
- ExamplePluginNode.ts lines 72-106 for port definition patterns
- Claude CLI output formats (text/json/stream-json) from docs

---

## Stage 4: Core Process Method - Basic Execution
**Goal**: Implement the process() method with basic Claude CLI execution
**Status**: Complete

### Tasks:
1. Setup input data extraction:
   - Use `rivet.getInputOrData()` for prompt, systemPrompt, sessionId, mcpConfig
   - Extract all configuration values from node data

2. Build Claude CLI command:
   - Start with base: `claude --print`
   - Add prompt as argument (properly escaped/quoted)
   - Add `--output-format` based on outputFormat value
   - Add `--model` if model is set
   - Add `--system-prompt` if systemPrompt is set
   - Add `--append-system-prompt` if appendSystemPrompt is set
   - Add `--verbose` if verbose is true

3. Execute command using Node.js child_process:
   - Use `exec` or `spawn` to run the command
   - Capture stdout and stderr
   - Handle command execution errors
   - Parse exit codes

4. Parse output:
   - If outputFormat is 'text': return raw stdout
   - If outputFormat is 'json': parse JSON response
   - Extract metadata (cost, duration, session_id) from JSON

5. Return outputs:
   - Map response to output ports
   - Set success/error based on execution result
   - Include session ID if available

### Success Criteria:
- [ ] Can execute basic Claude CLI command with prompt
- [ ] Text output format works correctly
- [ ] JSON output format works and is parsed
- [ ] Error handling captures CLI errors
- [ ] Exit codes are properly handled

### Tests:
- Basic text prompt execution
- JSON output parsing
- Error when claude CLI not available
- Error with invalid prompt

### Documentation References:
- Node.js child_process documentation
- ExamplePluginNode.ts lines 143-164 for process method pattern
- Claude CLI --output-format from docs

---

## Stage 5: Advanced CLI Options Implementation
**Goal**: Add support for tools control, fallback model, and permission modes
**Status**: Complete

### Tasks:
1. Add tools control to CLI command builder:
   - Add `--allowedTools` if allowedTools is set
   - Add `--disallowedTools` if disallowedTools is set
   - Properly format comma/space-separated lists

2. Add fallback model support:
   - Add `--fallback-model` if fallbackModel is set

3. Add permission mode support:
   - Add `--permission-mode` based on permissionMode value
   - Handle 'default' by not adding the flag

4. Add debug/verbose support:
   - Already implemented in Stage 4, validate it works

### Success Criteria:
- [ ] allowedTools/disallowedTools properly filter available tools
- [ ] fallbackModel is used when specified
- [ ] permissionMode changes Claude's behavior appropriately
- [ ] All flags are properly formatted in CLI command

### Tests:
- Execution with allowedTools="Bash,Read"
- Execution with disallowedTools="WebFetch"
- Execution with fallback model
- Execution with different permission modes

### Documentation References:
- CLI flags: --allowedTools, --disallowedTools, --fallback-model, --permission-mode
- Claude docs on tool control and permission modes

---

## Stage 6: Session Management Implementation
**Goal**: Implement resume/continue functionality for multi-turn conversations
**Status**: Complete

### Tasks:
1. Add session management to CLI command builder:
   - Add `--resume [sessionId]` if enableResume and sessionId is provided
   - Add `--continue` if enableResume and continueLastSession is true
   - Handle mutual exclusivity (continue takes precedence)

2. Extract session ID from response:
   - Parse session_id from JSON metadata
   - Store for output port

3. Add session ID validation:
   - Validate UUID format for sessionId input
   - Provide clear error if invalid

4. Handle fork-session option (future enhancement):
   - Document --fork-session flag for consideration
   - Not implemented in Stage 6, but noted for future

### Success Criteria:
- [ ] Can resume a previous session by ID
- [ ] Can continue most recent session
- [ ] Session ID is extracted and returned
- [ ] Session ID validation works
- [ ] Multi-turn conversations maintain context

### Tests:
- Execute initial prompt, capture session ID
- Resume with captured session ID
- Continue last session (multiple times)
- Error with invalid session ID format

### Documentation References:
- CLI flags: --resume, --continue, --fork-session
- Session ID format (UUID) from docs
- Multi-turn conversation examples from headless docs

---

## Stage 7: MCP and System Prompt Advanced Features
**Goal**: Implement MCP config support and advanced system prompt handling
**Status**: Complete

### Tasks:
1. Add MCP config support:
   - Add `--mcp-config` if mcpConfig is provided
   - Support both file paths and JSON strings
   - Handle validation errors from Claude CLI

2. Validate system prompt handling:
   - Ensure --system-prompt works correctly
   - Ensure --append-system-prompt appends to default
   - Test precedence rules

3. Add input format support (future consideration):
   - Document --input-format stream-json
   - Not implemented in Stage 7, but noted for future

4. Add additional directory support:
   - Consider adding `--add-dir` support
   - Add as optional field in node data
   - Add to CLI command builder

### Success Criteria:
- [ ] MCP config file path works
- [ ] MCP config JSON string works
- [ ] System prompts customize behavior
- [ ] append-system-prompt extends default prompt
- [ ] Error handling for invalid MCP configs

### Tests:
- Execution with MCP config file
- Execution with MCP config JSON
- Execution with system prompt override
- Execution with append-system-prompt
- Error with invalid MCP config

### Documentation References:
- CLI flags: --mcp-config, --system-prompt, --append-system-prompt, --add-dir
- MCP configuration from Claude docs
- System prompt customization examples

---

## Stage 8: Streaming Output Support (Optional/Future)
**Goal**: Implement stream-json output format with real-time updates
**Status**: Not Started

### Tasks:
1. Research streaming implementation options:
   - Rivet's async processing model
   - Whether Rivet supports streaming/progressive outputs
   - Child process streaming with spawn

2. If streaming is feasible in Rivet:
   - Modify process() to handle streaming
   - Parse JSONL stream from CLI
   - Update output ports progressively
   - Add streaming-specific output ports

3. If streaming is not feasible:
   - Document limitation
   - Keep stream-json format but treat as buffered
   - Update implementation plan

### Success Criteria:
- [ ] Stream-json format is supported (buffered or streaming)
- [ ] JSONL parsing works correctly
- [ ] Documentation explains streaming limitations if any

### Tests:
- Execution with --output-format stream-json
- Parse multiple JSONL messages
- Handle partial messages

### Documentation References:
- CLI flags: --output-format stream-json, --include-partial-messages
- Rivet async processing documentation
- Node.js spawn streaming

---

## Stage 9: Error Handling and Validation
**Goal**: Comprehensive error handling for all execution paths
**Status**: Complete

### Tasks:
1. Add pre-execution validation:
   - Check if `claude` CLI is available in PATH
   - Validate required fields (prompt)
   - Validate format of optional fields (sessionId UUID)
   - Validate mutual exclusivity (resume vs continue)

2. Add execution error handling:
   - Capture stderr output
   - Parse CLI error messages
   - Map exit codes to error types
   - Handle timeout scenarios

3. Add post-execution validation:
   - Validate JSON parsing for json/stream-json formats
   - Handle malformed responses
   - Validate expected metadata fields

4. Improve error messages:
   - Provide actionable error messages
   - Include CLI command in error output for debugging
   - Suggest fixes for common errors

### Success Criteria:
- [ ] Clear error when claude CLI not found
- [ ] Validation errors before execution
- [ ] CLI errors are captured and reported
- [ ] All error outputs use the error port
- [ ] Error messages are actionable

### Tests:
- Error when claude not in PATH
- Error with empty prompt
- Error with invalid session ID
- Error with invalid MCP config
- CLI execution error handling

### Documentation References:
- Claude CLI error messages and exit codes
- Child process error handling in Node.js

---

## Stage 10: Testing and Quality Assurance
**Goal**: Write comprehensive tests for the node
**Status**: Not Started

### Tasks:
1. Setup test infrastructure:
   - Determine test framework (Jest, Vitest, etc.)
   - Create test file structure
   - Mock Rivet library functions

2. Write unit tests:
   - Test create() method
   - Test input/output definitions
   - Test CLI command building logic
   - Test output parsing logic
   - Test error handling

3. Write integration tests (if feasible):
   - Test actual CLI execution (requires claude CLI)
   - Test with real prompts
   - Test session management flow
   - Test MCP integration (if MCP servers available)

4. Manual testing checklist:
   - Test in actual Rivet application
   - Test all configuration combinations
   - Test error scenarios
   - Test with different models

### Success Criteria:
- [ ] All unit tests pass
- [ ] Integration tests pass (if implemented)
- [ ] Test coverage > 80% for core logic
- [ ] Manual testing checklist completed

### Tests:
- All functionality from previous stages
- Edge cases and error conditions
- Integration with Rivet workflow

### Documentation References:
- Example plugin test patterns (if available)
- Rivet testing documentation

---

## Stage 11: Plugin Integration and Configuration
**Goal**: Integrate the new node into the plugin and update configuration
**Status**: Complete

### Tasks:
1. Update `src/index.ts`:
   - Import the new ClaudeCodeHeadlessNode
   - Initialize node in plugin initializer
   - Register node with plugin
   - Update plugin metadata (id, name)

2. Update `package.json`:
   - Change name to "rivet-plugin-claude-code" or similar
   - Update description
   - Update version to 1.0.0
   - Add any new dependencies (if needed)
   - Update repository and author info

3. Update plugin config:
   - Add any plugin-level configuration settings
   - Consider adding default model setting
   - Consider adding default tools setting

4. Add context menu group:
   - Add "Claude Code" context menu group
   - Assign node to this group

### Success Criteria:
- [ ] Plugin registers successfully
- [ ] Node appears in Rivet context menu under correct group
- [ ] Plugin metadata is accurate
- [ ] No import/bundle errors

### Tests:
- Plugin loads in Rivet
- Node is accessible from context menu
- Build process completes successfully

### Documentation References:
- src/index.ts lines 6-52 for plugin structure
- package.json configuration
- Rivet plugin schema documentation

---

## Stage 12: Documentation and Examples
**Goal**: Create comprehensive documentation for the plugin
**Status**: Not Started

### Tasks:
1. Update README.md:
   - Overview of the plugin
   - Installation instructions
   - Usage examples (basic, advanced, session management)
   - Configuration options reference
   - Troubleshooting section
   - Claude CLI requirements

2. Create example workflows:
   - Basic prompt execution example
   - Multi-turn conversation example
   - Tool-restricted execution example
   - MCP integration example

3. Add inline documentation:
   - JSDoc comments for all types
   - JSDoc comments for all methods
   - Explain complex logic with comments

4. Create CHANGELOG.md:
   - Version 1.0.0 initial release notes
   - List all features implemented

5. Update LICENSE if needed:
   - Ensure proper license is set
   - Match project requirements

### Success Criteria:
- [ ] README is clear and comprehensive
- [ ] Examples are tested and work
- [ ] Code is well-documented
- [ ] CHANGELOG is accurate

### Documentation References:
- Example plugin READMEs for structure
- Claude Code headless docs for feature explanations
- Rivet documentation for workflow examples

---

## Stage 13: Build, Bundle, and Release Preparation
**Goal**: Prepare the plugin for distribution
**Status**: Complete

### Tasks:
1. Run build process:
   - Execute `yarn build`
   - Verify TypeScript compilation
   - Verify bundle creation
   - Check bundle size

2. Test bundled plugin:
   - Install bundled plugin in Rivet
   - Test all functionality with bundled version
   - Verify no runtime errors

3. Validate package structure:
   - Verify dist/ contains all necessary files
   - Verify type definitions are generated
   - Check exports in package.json

4. Prepare for publishing (if applicable):
   - Update version to 1.0.0
   - Review package.json metadata
   - Create git tag
   - Prepare release notes

### Success Criteria:
- [ ] Build completes without errors
- [ ] Bundle works in Rivet
- [ ] Package structure is correct
- [ ] Ready for distribution

### Tests:
- Build process
- Bundle installation
- All features in production bundle

### Documentation References:
- package.json scripts
- bundle.ts configuration
- Rivet plugin distribution guidelines

---

## Additional Considerations

### Security
- Validate all user inputs before passing to CLI
- Be careful with shell injection (use proper escaping)
- Consider sandboxing CLI execution
- Warn about --dangerously-skip-permissions usage

### Performance
- Consider timeout configuration for long-running prompts
- Handle large responses efficiently
- Consider streaming for better UX (if Rivet supports)

### Future Enhancements
- Support for --input-format stream-json (guided conversations)
- Support for --fork-session
- Support for --agents custom agent definitions
- Support for --plugin-dir for loading Rivet plugins into Claude
- Interactive session management UI
- Cost tracking and display
- Response caching
- Batch execution support

### Dependencies to Consider
- Child process execution (built-in Node.js)
- JSON parsing (built-in)
- UUID validation library (optional)
- Shell escaping library (e.g., shell-quote)

---

## Development Workflow

1. Start with Stage 1, implement incrementally
2. After each stage, run build and test
3. Use GitButler MCP tool to record progress
4. Update this plan's status as stages complete
5. Remove this file when all stages are complete

## Definition of Done

- [ ] All stages marked as Complete
- [ ] All tests passing
- [ ] Build succeeds without warnings
- [ ] Documentation complete
- [ ] Manual testing successful
- [ ] Plugin works in production Rivet application
- [ ] Code follows project conventions
- [ ] GitButler has recorded all changes with proper context
