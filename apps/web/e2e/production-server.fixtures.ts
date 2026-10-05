import { appendFile, cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export type ProductionServer = {
  url: string;
  artifactDirectory: string;
  stageUpdate: () => Promise<void>;
  close: () => Promise<void>;
};

export async function startProductionServer(directory: string): Promise<ProductionServer> {
  const artifactDirectory = resolve(directory);
  for (const name of ['index.html', 'sw.js', 'manifest.webmanifest']) {
    const file = join(artifactDirectory, name);
    if (!(await stat(file).catch(() => null))?.isFile()) {
      throw new Error(`Missing production artifact ${file}. Run vp run test:e2e or supply E2E_ARTIFACT_DIR.`);
    }
  }

  let servedDirectory = artifactDirectory;
  const updates: string[] = [];
  const server = createServer((request, response) => {
    // Capture the current artifact before an update switches the directory.
    const currentDirectory = servedDirectory;
    void serve().catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end('Production artifact could not be read');
    });

    async function serve() {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }
      let pathname: string;
      try {
        pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
      } catch {
        response.writeHead(400);
        response.end();
        return;
      }
      const file = resolve(currentDirectory, `.${pathname === '/' ? '/index.html' : pathname}`);
      const pathWithinArtifact = relative(currentDirectory, file);
      if (pathWithinArtifact.startsWith('..') || isAbsolute(pathWithinArtifact)) {
        response.writeHead(403);
        response.end();
        return;
      }
      const body = await readFile(file).catch((error: unknown) => {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
        throw error;
      });
      if (body !== null) {
        send(response, file, body, request.method);
      } else if (!extname(pathname) && request.headers.accept?.includes('text/html')) {
        send(response, 'index.html', await readFile(join(currentDirectory, 'index.html')), request.method);
      } else {
        response.writeHead(404);
        response.end();
      }
    }
  });

  await new Promise<void>((ready, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      ready();
    });
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Production server has no TCP address');

  return {
    url: `http://127.0.0.1:${address.port}`,
    artifactDirectory,
    async stageUpdate() {
      const update = await mkdtemp(join(tmpdir(), 'rick-and-morty-pwa-update-'));
      updates.push(update);
      await cp(artifactDirectory, update, { recursive: true });
      await appendFile(join(update, 'sw.js'), `\n// E2E worker update ${updates.length}\n`);
      servedDirectory = update;
    },
    async close() {
      try {
        await new Promise<void>((done, reject) => {
          server.close((error) => (error ? reject(error) : done()));
          server.closeAllConnections();
        });
      } finally {
        await Promise.all(updates.map((update) => rm(update, { recursive: true, force: true })));
      }
    },
  };
}

function send(response: ServerResponse, file: string, body: Buffer, method: string) {
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  response.end(method === 'HEAD' ? undefined : body);
}
