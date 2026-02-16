import { spawn } from 'node:child_process';
import { dirname, basename, relative } from 'node:path';
import type { FileChange, DirectoryStats, HeatmapData } from '../types.js';

interface GitLogEntry {
  path: string;
  insertions: number;
  deletions: number;
  author: string;
  date: string;
}

export async function analyzeRepository(
  repoPath: string,
  options: {
    since?: string;
    until?: string;
    exclude?: string[];
    include?: string[];
  }
): Promise<HeatmapData> {
  const entries = await getGitLog(repoPath, options);
  const files = aggregateFileChanges(entries);
  const filteredFiles = filterFiles(files, options);
  const directories = buildDirectoryTree(filteredFiles);

  const maxChanges = Math.max(...filteredFiles.map(f => f.changes), 0);
  const dates = entries.map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));
  
  return {
    files: filteredFiles,
    directories,
    maxChanges,
    totalCommits: entries.length,
    dateRange: {
      from: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : new Date().toISOString(),
      to: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : new Date().toISOString(),
    },
  };
}

async function getGitLog(
  repoPath: string,
  options: { since?: string; until?: string }
): Promise<GitLogEntry[]> {
  return new Promise((resolve, reject) => {
    const args = ['log', '--format=%H|%an|%aI', '--numstat'];
    
    if (options.since) args.push(`--since=${options.since}`);
    if (options.until) args.push(`--until=${options.until}`);
    
    const git = spawn('git', args, { cwd: repoPath });
    let output = '';
    let errorOutput = '';

    git.stdout.on('data', (data) => {
      output += data.toString();
    });

    git.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    git.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Git command failed: ${errorOutput || 'Unknown error'}`));
        return;
      }

      const entries = parseGitLog(output);
      resolve(entries);
    });
  });
}

function parseGitLog(logOutput: string): GitLogEntry[] {
  const entries: GitLogEntry[] = [];
  const lines = logOutput.split('\n');
  let currentAuthor = '';
  let currentDate = '';

  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length >= 3) {
        currentAuthor = parts[1];
        currentDate = parts[2];
      }
    } else if (line.trim()) {
      const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (match) {
        entries.push({
          insertions: parseInt(match[1], 10) || 0,
          deletions: parseInt(match[2], 10) || 0,
          path: match[3].trim(),
          author: currentAuthor,
          date: currentDate,
        });
      }
    }
  }

  return entries;
}

function aggregateFileChanges(entries: GitLogEntry[]): FileChange[] {
  const fileMap = new Map<string, FileChange>();

  for (const entry of entries) {
    const existing = fileMap.get(entry.path);
    if (existing) {
      existing.changes++;
      existing.insertions += entry.insertions;
      existing.deletions += entry.deletions;
      if (!existing.authors.includes(entry.author)) {
        existing.authors.push(entry.author);
      }
      if (new Date(entry.date) > new Date(existing.lastModified)) {
        existing.lastModified = entry.date;
      }
    } else {
      fileMap.set(entry.path, {
        path: entry.path,
        changes: 1,
        insertions: entry.insertions,
        deletions: entry.deletions,
        lastModified: entry.date,
        authors: [entry.author],
      });
    }
  }

  return Array.from(fileMap.values()).sort((a, b) => b.changes - a.changes);
}

function filterFiles(
  files: FileChange[],
  options: { exclude?: string[]; include?: string[] }
): FileChange[] {
  let filtered = files;

  if (options.include && options.include.length > 0) {
    filtered = filtered.filter(file =>
      options.include!.some(pattern => file.path.includes(pattern))
    );
  }

  if (options.exclude && options.exclude.length > 0) {
    filtered = filtered.filter(file =>
      !options.exclude!.some(pattern => file.path.includes(pattern))
    );
  }

  return filtered;
}

function buildDirectoryTree(files: FileChange[]): DirectoryStats {
  const root: DirectoryStats = {
    path: '.',
    totalChanges: 0,
    fileCount: 0,
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      let dir = current.children.find(
        c => 'children' in c && c.path === parts.slice(0, i + 1).join('/')
      ) as DirectoryStats | undefined;
      
      if (!dir) {
        dir = {
          path: parts.slice(0, i + 1).join('/'),
          totalChanges: 0,
          fileCount: 0,
          children: [],
        };
        current.children.push(dir);
      }
      
      current = dir;
    }

    current.children.push(file);
    current.totalChanges += file.changes;
    current.fileCount++;
    
    let parent = current;
    while (parent !== root) {
      parent.totalChanges += file.changes;
      parent.fileCount++;
      const parentPath = dirname(parent.path);
      parent = root.children.find(
        c => 'children' in c && c.path === parentPath
      ) as DirectoryStats || root;
    }
  }

  root.totalChanges = files.reduce((sum, f) => sum + f.changes, 0);
  root.fileCount = files.length;

  return root;
}

export function validateRepository(repoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const git = spawn('git', ['rev-parse', '--git-dir'], { cwd: repoPath });
    git.on('close', (code) => resolve(code === 0));
  });
}
