# repo-heatmap

CLI tool for generating interactive heatmap visualizations of git repository file changes. Analyzes commit history and displays results in a web-based graph using Cytoscape.js.

## Features

- Parses git log to aggregate file change statistics
- Generates force-directed graph visualization
- Color-codes nodes by change frequency (blue to red gradient)
- Supports date range and pattern filtering
- Provides interactive TUI prompts via Clack

## Installation

```bash
bun install -g repo-heatmap
```

Or use locally:

```bash
bun install
bun run dev -- --path /path/to/repo
```

### Binary Compilation

```bash
bun run compile
# Output: ./dist/repo-heatmap
```

## Usage

### Interactive Mode

```bash
repo-heatmap --interactive
```

### Command Line

```bash
# Current directory
repo-heatmap

# Specific path
repo-heatmap --path /path/to/repo

# Custom port
repo-heatmap --port 8080

# Date range filtering
repo-heatmap --since "2024-01-01" --until "2024-12-31"

# Exclude patterns
repo-heatmap --exclude "node_modules,dist,*.lock"

# Include patterns
repo-heatmap --include "src/"

# Limit displayed files
repo-heatmap --max-files 50

# Disable browser opening
repo-heatmap --no-open
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Repository path | `.` |
| `--port <port>` | Server port | `3000` |
| `--since <date>` | Start date for analysis | - |
| `--until <date>` | End date for analysis | - |
| `--max-files <number>` | Maximum files to render | `100` |
| `--exclude <patterns>` | Comma-separated exclusion patterns | - |
| `--include <patterns>` | Comma-separated inclusion patterns | - |
| `--no-open` | Skip browser auto-open | - |
| `--interactive` | Use interactive prompts | - |

## Visualization

### Graph Elements

- **Circles**: Files
- **Rounded Rectangles**: Directories
- **Edge**: Parent-child relationship

### Color Scale

| Color | Change Frequency |
|-------|-----------------|
| Blue | Low |
| Green | Medium-low |
| Yellow | Medium |
| Orange | Medium-high |
| Red | High |

### Interactions

- Drag nodes to reposition
- Click node to highlight connections
- Search input for file filtering
- Zoom/pan controls

## Development

```bash
bun install        # Install dependencies
bun run dev        # Development mode
bun run build      # Build to ./dist
bun run typecheck  # TypeScript check
bun run lint       # Lint code
```

## Requirements

- Bun 1.0.0+
- Git repository

## Dependencies

- Bun (runtime)
- Commander.js (CLI)
- @clack/prompts (TUI)
- Cytoscape.js (visualization)

## License

MIT
