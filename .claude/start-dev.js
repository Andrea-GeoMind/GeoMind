const { spawn } = require('child_process');
const path = require('path');

const ROOT = '/Users/hophophop/Desktop/GeoMind 2.0';
const PORT = process.env.PORT || '3000';

process.chdir(ROOT);

// ─── Inngest dev server (port 8288) ──────────────────────────────────────────
// Pointe vers l'app Next.js pour qu'il enregistre les fonctions
const inngest = spawn(
  'npx',
  ['inngest-cli@latest', 'dev', '-u', `http://localhost:${PORT}/api/inngest`],
  {
    stdio: 'inherit',
    shell: true,
    cwd: ROOT,
  }
);

inngest.on('error', (err) => {
  console.error('[Inngest] Impossible de démarrer le dev server:', err.message);
});

const cleanup = () => { try { inngest.kill(); } catch (_) {} };
process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// ─── Next.js dev server ───────────────────────────────────────────────────────
// Utilise spawn plutôt que require() pour que --port soit bien transmis
const next = spawn(
  'node',
  [path.join(ROOT, 'node_modules/next/dist/bin/next'), 'dev', '--port', PORT],
  {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, PORT },
  }
);

next.on('error', (err) => {
  console.error('[Next.js] Impossible de démarrer:', err.message);
});

next.on('exit', (code) => {
  inngest.kill();
  process.exit(code ?? 0);
});
