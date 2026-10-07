// Genererar web/config.js från miljövariabler och kopierar web/ till dist/ för Netlify-deploy.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const webDir = join(root, 'web');
const distDir = join(root, 'dist');

// 1) Läs Supabase-konfiguration från miljövariabler (sätts av Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Fel: SUPABASE_URL och SUPABASE_PUBLISHABLE_KEY måste vara satta som miljövariabler i Netlify.');
  console.error('Genererar config.js utan värden – sidan kommer att misslyckas vid inloggning.');
}

// 2) Generera config.js i web-katalogen (sedan kopieras till dist/)
const configPath = join(webDir, 'config.js');
writeFileSync(
  configPath,
  '// Genererad fil – ändra inte manuellt. Genereras av build-skriptet från miljövariabler.\n' +
    'window.STUDORA_CONFIG = ' +
    JSON.stringify(
      {
        supabaseUrl: supabaseUrl || 'https://placeholder.supabase.co',
        supabaseKey: supabaseKey || ' ReplaceWithRealKeyInNetlifySettings'
      },
      null,
      2
    ) +
    ';\n',
);

console.log('Generated config.js with supabaseUrl:', supabaseUrl ? supabaseUrl.replace(/\.(com|co)\/.*$/, '.SUPABASE.CO/...') : 'NOT SET');
console.log('Generated config.js with supabaseKey:', supabaseKey ? supabaseKey.substring(0, 8) + '...' : 'NOT SET');

// 3) Se till att dist/ finns och kopiera alla filer från web/
mkdirSync(distDir, { recursive: true });
const files = readdirSync(webDir);
for (const file of files) {
  const src = join(webDir, file);
  const dst = join(distDir, file);
  copyFileSync(src, dst);
}

console.log('Copied web/ to dist/');
console.log('Build complete. dist/ innehåller:', files.join(', '));
