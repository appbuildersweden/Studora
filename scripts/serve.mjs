// Genererar web/config.js från .env och startar en statisk testserver.
// Kör: npm run web   (inga secrets skrivs ut – bara publishable-nyckeln, som är publik)
import http from 'node:http';
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webDir = join(root, 'web');

// 1) Läs .env (nycklar utan värden skrivs aldrig ut)
const env = {};
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.error('Fel: SUPABASE_URL och SUPABASE_PUBLISHABLE_URL saknas i .env');
  process.exit(1);
}

// 2) Skriv web/config.js (endast publika värden)
writeFileSync(
  join(webDir, 'config.js'),
  '// Genererad fil – kör "npm run web" för att uppdatera från .env\n' +
    'window.STUDORA_CONFIG = ' +
    JSON.stringify({ supabaseUrl: env.SUPABASE_URL, supabaseKey: env.SUPABASE_PUBLISHABLE_KEY }, null, 2) +
    ';\n',
);

// 3) Statisk server
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const port = Number(process.env.PORT) || 4173;

http
  .createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') path = '/login.html';
    const file = join(webDir, path);
    if (!file.startsWith(webDir) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404');
    }
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(readFileSync(file));
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Studora testserver: http://localhost:${port}/  (login)`);
  });
