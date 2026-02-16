# Agent Instructions

## Project Overview

TypeScript CLI tool for visualizing git repository file changes as interactive heatmap graphs. Built with Bun, featuring Commander.js for CLI parsing, @clack/prompts for TUI, and Cytoscape.js for web visualization.

## Commands

### Development
- `bun run dev` - Run CLI in development mode
- `bun run build` - Build to ./dist/cli.js
- `bun run compile` - Compile to standalone binary at ./dist/repo-heatmap

### Code Quality
- `bun run lint` - TypeScript type checking (alias for typecheck)
- `bun run typecheck` - Run tsc --noEmit
- **No test suite currently configured**

### General
- `bun install` - Install dependencies

## Code Style

### TypeScript
- **Target**: ES2022, ESNext modules
- **Strict mode**: Enabled
- Use `import type` for type-only imports
- Always use `.js` extension in imports (e.g., `import { foo } from './bar.js'`)
- Prefer interfaces over type aliases for object shapes

### Naming Conventions
- **Interfaces**: PascalCase (e.g., `FileChange`, `CliOptions`)
- **Functions**: camelCase (e.g., `analyzeRepository`, `validateRepository`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: camelCase for utilities, descriptive names for modules

### Imports
```typescript
// External dependencies first
import { Command } from 'commander';
import pc from 'picocolors';

// Node.js built-ins with node: prefix
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';

// Internal imports with .js extension
import { analyzeRepository } from './utils/git.js';
import type { CliOptions } from './types.js';
```

### Error Handling
- Use try/catch for async operations
- Provide actionable error messages via console.error()
- Exit with process.exit(1) on fatal errors
- Support DEBUG=1 environment variable for stack traces

### Function Patterns
- Prefer async/await over callbacks
- Use Promises for child_process operations
- Return early pattern for validation
- Explicit return types on exported functions

### Formatting
- 2-space indentation
- No trailing semicolons (follow existing style)
- Single quotes for strings
- Max line length: reasonable (follow existing patterns)

### Git
- **Always use SSH for remotes**: `git@github.com:owner/repo.git`
- Never HTTPS URLs

## Project Structure

```
src/
├── cli.ts           # Entry point, CLI setup
├── types.ts         # TypeScript interfaces
├── utils/
│   ├── git.ts       # Git analysis logic
│   ├── graph.ts     # Graph data generation
│   └── server.ts    # Bun HTTP server
└── commands/        # (empty - for future commands)
```

## Dependencies

- **Runtime**: Bun 1.0.0+
- **CLI**: commander, @clack/prompts
- **Styling**: picocolors
- **External**: Cytoscape.js (loaded via CDN in HTML)

## Environment

- WSL/Linux environment
- Never use sudo in commands
- Bun as package manager and runtime

## Additional Guidelines

### CLI Design Patterns
- Use Commander.js for argument parsing and subcommands
- Use @clack/prompts for interactive TUI flows
- Provide both CLI flags and interactive modes
- Validate inputs early with clear error messages
- Use picocolors for terminal colors (lightweight)

### Git Operations
- Spawn git commands via node:child_process
- Parse git output carefully with regex
- Handle edge cases (empty repos, invalid paths)
- Support git date formats (ISO 8601, relative)

### Web Server
- Use Bun.serve() for HTTP server
- Serve generated HTML with embedded Cytoscape
- Auto-open browser with platform-specific commands
- Keep server running until interrupted (Ctrl+C)

### Visualization
- Generate Cytoscape-compatible JSON data
- Color-code nodes by change intensity
- Size nodes proportionally to change count
- Support search and filtering in UI

### Performance Considerations
- Lazy load heavy operations
- Stream large git logs if needed
- Limit max files displayed (default 100)
- Use Map/Set for O(1) lookups

### Security
- Never execute user input directly
- Sanitize file paths
- Don't log sensitive git data
- Validate repository path before operations
