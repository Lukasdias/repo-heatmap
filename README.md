# repo-heatmap

A CLI tool that visualizes repository file changes as an interactive heatmap graph. See which files have been modified most frequently and explore the codebase structure with an intuitive web-based visualization powered by Cytoscape.js.

## Features

- **Git Repository Analysis**: Analyzes git history to find the most frequently changed files
- **Interactive Graph Visualization**: Web-based heatmap showing file change frequency
- **Directory Hierarchy**: Visual representation of directory structure and relationships
- **Change Intensity**: Color-coded nodes from blue (low changes) to red (high changes)
- **Search & Filter**: Search for specific files and highlight related nodes
- **Date Range Filtering**: Analyze changes within specific time periods
- **Pattern Filtering**: Include or exclude files based on patterns
- **Interactive TUI**: User-friendly prompts powered by Clack
- **Fast Performance**: Built with Bun for rapid startup and execution

## Installation

### Global Installation

```bash
bun install -g repo-heatmap
```

### Local Usage

```bash
bun install
bun run dev -- --path /path/to/repo
```

### Compile to Binary

```bash
bun run compile
# Creates ./dist/repo-heatmap binary
```

## Usage

### Interactive Mode (Recommended)

Launch with prompts to configure all options:

```bash
repo-heatmap --interactive
```

### Command Line

```bash
# Analyze current directory
repo-heatmap

# Analyze specific repository
repo-heatmap --path /path/to/repo

# Custom port
repo-heatmap --port 8080

# Date range
repo-heatmap --since "2024-01-01" --until "2024-12-31"

# Exclude patterns
repo-heatmap --exclude "node_modules,dist,*.lock"

# Include only specific patterns
repo-heatmap --include "src/"

# Limit files displayed
repo-heatmap --max-files 50

# Don't open browser
repo-heatmap --no-open
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Repository path | `.` |
| `--port <port>` | Server port | `3000` |
| `--since <date>` | Analyze commits since date | - |
| `--until <date>` | Analyze commits until date | - |
| `--max-files <number>` | Maximum files to display | `100` |
| `--exclude <patterns>` | Comma-separated patterns to exclude | - |
| `--include <patterns>` | Comma-separated patterns to include | - |
| `--no-open` | Don't open browser | - |
| `--interactive` | Use interactive prompts | - |
| `-h, --help` | Display help | - |
| `-V, --version` | Display version | - |

## Visualization Features

The web interface provides:

- **Interactive Graph**: Drag nodes, zoom, and pan
- **Node Highlighting**: Click a node to highlight its connections
- **Search**: Find files by name with real-time filtering
- **Heatmap Legend**: Visual guide for change intensity
- **Statistics**: Total files, changes, and date range
- **Responsive Design**: Works on different screen sizes

### Graph Elements

- **Circles**: Files
- **Rounded Rectangles**: Directories
- **Color Intensity**:
  - Blue: Low changes
  - Green: Medium-low changes
  - Yellow: Medium changes
  - Orange: Medium-high changes
  - Red: High changes
- **Size**: Proportional to number of changes

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## Requirements

- [Bun](https://bun.sh/) 1.0.0 or higher
- Git repository to analyze

## Tech Stack

- **Runtime**: Bun
- **CLI Framework**: Commander.js
- **Interactive Prompts**: @clack/prompts
- **Graph Visualization**: Cytoscape.js
- **Server**: Bun.serve()
- **Styling**: Tailwind-like CSS

## License

MIT
