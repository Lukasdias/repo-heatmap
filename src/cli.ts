import { intro, outro, text, confirm, isCancel, spinner, select, multiselect } from '@clack/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { analyzeRepository, validateRepository } from './utils/git.js';
import { generateGraphData } from './utils/graph.js';
import { startServer } from './utils/server.js';
import type { CliOptions } from './types.js';

const program = new Command();

program
  .name('repo-heatmap')
  .description('Visualize repository file changes as an interactive heatmap graph')
  .version('1.0.0');

program
  .command('visualize', { isDefault: true })
  .description('Generate and serve repository heatmap visualization')
  .option('-p, --path <path>', 'Repository path', '.')
  .option('--port <port>', 'Server port', '3000')
  .option('--since <date>', 'Analyze commits since date')
  .option('--until <date>', 'Analyze commits until date')
  .option('--max-files <number>', 'Maximum files to display', '100')
  .option('--exclude <patterns>', 'Comma-separated patterns to exclude')
  .option('--include <patterns>', 'Comma-separated patterns to include')
  .option('--no-open', 'Do not open browser automatically')
  .option('--interactive', 'Use interactive prompts')
  .action(async (options) => {
    try {
      const cliOptions = await parseOptions(options);
      
      if (cliOptions.interactive || (!options.path && !process.argv.includes('--path'))) {
        await runInteractive(cliOptions);
      } else {
        await runDirect(cliOptions);
      }
    } catch (error) {
      handleError(error);
    }
  });

async function parseOptions(options: any): Promise<CliOptions> {
  return {
    path: options.path,
    port: parseInt(options.port, 10),
    since: options.since,
    until: options.until,
    maxFiles: parseInt(options.maxFiles, 10),
    exclude: options.exclude?.split(',').map((s: string) => s.trim()),
    include: options.include?.split(',').map((s: string) => s.trim()),
    open: options.open,
  };
}

async function runInteractive(options: CliOptions): Promise<void> {
  intro(pc.bgCyan(pc.black(' repo-heatmap ')));

  // Repository path
  const repoPath = await text({
    message: 'Repository path?',
    placeholder: './my-repo',
    defaultValue: options.path || '.',
    validate(value) {
      if (value.length === 0) return 'Path is required';
    },
  });

  if (isCancel(repoPath)) {
    outro(pc.yellow('Cancelled'));
    return;
  }

  options.path = repoPath as string;

  // Validate repository
  const isValid = await validateRepository(options.path);
  if (!isValid) {
    outro(pc.red(`Not a valid git repository: ${options.path}`));
    process.exit(1);
  }

  // Port
  const port = await text({
    message: 'Server port?',
    placeholder: '3000',
    defaultValue: String(options.port || 3000),
    validate(value) {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1 || num > 65535) return 'Invalid port number';
    },
  });

  if (isCancel(port)) {
    outro(pc.yellow('Cancelled'));
    return;
  }

  options.port = parseInt(port as string, 10);

  // Date range
  const useDateRange = await confirm({
    message: 'Filter by date range?',
    initialValue: false,
  });

  if (isCancel(useDateRange)) {
    outro(pc.yellow('Cancelled'));
    return;
  }

  if (useDateRange) {
    const since = await text({
      message: 'Since date? (e.g., 2024-01-01, 1 month ago)',
      placeholder: 'optional',
    });

    if (!isCancel(since) && since) {
      options.since = since as string;
    }

    const until = await text({
      message: 'Until date? (e.g., 2024-12-31)',
      placeholder: 'optional',
    });

    if (!isCancel(until) && until) {
      options.until = until as string;
    }
  }

  // Max files
  const maxFiles = await text({
    message: 'Maximum files to display?',
    placeholder: '100',
    defaultValue: String(options.maxFiles || 100),
    validate(value) {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) return 'Invalid number';
    },
  });

  if (isCancel(maxFiles)) {
    outro(pc.yellow('Cancelled'));
    return;
  }

  options.maxFiles = parseInt(maxFiles as string, 10);

  // Open browser
  const openBrowser = await confirm({
    message: 'Open browser automatically?',
    initialValue: true,
  });

  if (isCancel(openBrowser)) {
    outro(pc.yellow('Cancelled'));
    return;
  }

  options.open = openBrowser as boolean;

  await runDirect(options);
}

async function runDirect(options: CliOptions): Promise<void> {
  const repoPath = options.path || '.';
  
  // Validate repository
  const isValid = await validateRepository(repoPath);
  if (!isValid) {
    console.error(pc.red(`Error: ${repoPath} is not a valid git repository`));
    process.exit(1);
  }

  const s = spinner();
  s.start('Analyzing repository...');

  try {
    const heatmapData = await analyzeRepository(repoPath, {
      since: options.since,
      until: options.until,
      exclude: options.exclude,
      include: options.include,
    });

    s.stop('Analysis complete!');

    const graphData = generateGraphData(
      heatmapData.directories,
      heatmapData.files,
      heatmapData.maxChanges,
      options.maxFiles
    );

    console.log(pc.dim(`\n📁 Repository: ${repoPath}`));
    console.log(pc.dim(`📊 Files analyzed: ${heatmapData.files.length}`));
    console.log(pc.dim(`📝 Total changes: ${heatmapData.totalCommits.toLocaleString()}`));
    
    if (options.since || options.until) {
      console.log(pc.dim(`📅 Period: ${new Date(heatmapData.dateRange.from).toLocaleDateString()} - ${new Date(heatmapData.dateRange.to).toLocaleDateString()}`));
    }

    await startServer(
      graphData,
      {
        totalFiles: heatmapData.files.length,
        totalChanges: heatmapData.totalCommits,
        dateRange: heatmapData.dateRange,
      },
      {
        port: options.port || 3000,
        openBrowser: options.open !== false,
      }
    );
  } catch (error) {
    s.stop('Analysis failed!');
    throw error;
  }
}

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`\n❌ Error: ${message}`));
  
  if (process.env.DEBUG) {
    console.error(error);
  } else {
    console.error(pc.dim('\nRun with DEBUG=1 for full stack trace'));
  }
  
  process.exit(1);
}

program.parse();
