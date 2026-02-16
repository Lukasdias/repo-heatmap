import { serve } from 'bun';
import { spawn } from 'node:child_process';
import type { GraphData } from '../types.js';
import { generateHTML } from './graph.js';

interface ServerOptions {
  port: number;
  openBrowser: boolean;
}

export async function startServer(
  graphData: GraphData,
  stats: {
    totalFiles: number;
    totalChanges: number;
    dateRange: { from: string; to: string };
  },
  options: ServerOptions
): Promise<void> {
  const html = generateHTML(graphData, stats);
  
  const server = serve({
    port: options.port,
    fetch(request) {
      const url = new URL(request.url);
      
      if (url.pathname === '/') {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response('Not Found', { status: 404 });
    },
  });

  const serverUrl = `http://localhost:${options.port}`;
  
  console.log(`\n🚀 Server running at ${serverUrl}`);
  console.log('Press Ctrl+C to stop\n');

  if (options.openBrowser) {
    const platform = process.platform;
    const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    spawn(command, [serverUrl], { stdio: 'ignore', detached: true }).unref();
  }

  // Keep server running
  await new Promise(() => {});
}
