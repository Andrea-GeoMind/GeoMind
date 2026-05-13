const { spawn } = require('child_process');

process.chdir('/Users/hophophop/Desktop/GeoMind 2.0');

// Démarre le serveur Inngest dev en arrière-plan (port 8288)
// Il se connecte à Next.js sur 3001 pour enregistrer les fonctions
const inngest = spawn(
  'npx',
  ['inngest-cli@latest', 'dev', '-u', 'http://localhost:3001/api/inngest'],
  {
    stdio: 'inherit',
    shell: true,
    cwd: '/Users/hophophop/Desktop/GeoMind 2.0',
  }
);

inngest.on('error', (err) => {
  console.error('[Inngest] Impossible de démarrer le dev server:', err.message);
});

const cleanup = () => {
  inngest.kill();
};
process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Démarre Next.js sur le port 3001
process.argv = [process.argv[0], process.argv[1], 'dev', '--port', process.env.PORT || '3001'];
require('/Users/hophophop/Desktop/GeoMind 2.0/node_modules/next/dist/bin/next');
