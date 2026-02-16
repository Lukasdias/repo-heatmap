export interface FileChange {
  path: string;
  changes: number;
  insertions: number;
  deletions: number;
  lastModified: string;
  authors: string[];
}

export interface DirectoryStats {
  path: string;
  totalChanges: number;
  fileCount: number;
  children: (DirectoryStats | FileChange)[];
}

export interface HeatmapData {
  files: FileChange[];
  directories: DirectoryStats;
  maxChanges: number;
  totalCommits: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface CliOptions {
  path?: string;
  port?: number;
  since?: string;
  until?: string;
  maxFiles?: number;
  exclude?: string[];
  include?: string[];
  open?: boolean;
  interactive?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  changes: number;
  type: 'file' | 'directory';
  size: number;
  color: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
