import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function outputPath(root, pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  const file = relative === ''
    ? 'index.html'
    : relative.endsWith('/')
      ? `${relative}index.html`
      : extname(relative)
        ? relative
        : `${relative}/index.html`;
  const candidate = resolve(root, file);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;
  return candidate;
}

export async function startStaticPreview({ root, host, port }) {
  const resolvedRoot = resolve(root);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}:${port}`);
      const file = outputPath(resolvedRoot, url.pathname);
      if (!file) {
        response.writeHead(400).end('Bad request');
        return;
      }
      const body = await readFile(file);
      const contentType = file.endsWith(`${sep}rss.xml`)
        ? 'application/rss+xml; charset=utf-8'
        : contentTypes.get(extname(file).toLowerCase()) ?? 'application/octet-stream';
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': contentType,
      });
      response.end(body);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Preview server error');
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, host, resolveListen);
  });

  return {
    origin: `http://${host}:${port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    }),
  };
}
