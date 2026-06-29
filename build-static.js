// Custom static builder using esbuild (Vite hangs on this machine)
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('� Building webapp with esbuild...');

  // Clean dist
  fs.rmSync('/tmp/webapp/dist', { recursive: true, force: true });
  fs.mkdirSync('/tmp/webapp/dist', { recursive: true });

  // 1. Bundle JS/CSS with esbuild
  const result = await esbuild.build({
    entryPoints: ['/tmp/webapp/src/main.tsx'],
    bundle: true,
    outdir: '/tmp/webapp/dist/assets',
    format: 'esm',
    target: ['es2020', 'chrome90', 'firefox90', 'safari15'],
    jsx: 'automatic',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
      '.svg': 'dataurl',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.webp': 'dataurl',
      '.woff2': 'dataurl',
      '.woff': 'dataurl',
      '.ico': 'dataurl',
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    splitting: true,
    minify: true,
    sourcemap: false,
    write: true,
    metafile: true,
    alias: {
      '@': '/tmp/webapp/src'
    },
    logLevel: 'info',
    legalComments: 'none',
  });

  // 2. Get output file names
  const outFiles = Object.keys(result.metafile.outputs);
  const jsFiles = outFiles.filter(f => f.endsWith('.js') && f.includes('/assets/'));
  const cssFiles = outFiles.filter(f => f.endsWith('.css') && f.includes('/assets/'));

  console.log('Output files:', { jsFiles, cssFiles });

  // 3. Generate index.html with correct asset paths
  const mainJs = jsFiles.find(f => f.includes('main.')) || jsFiles[0];
  const mainCss = cssFiles[0];
  const jsPath = '/assets/' + path.basename(mainJs);
  const cssPath = mainCss ? '/assets/' + path.basename(mainCss) : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#000000" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>ZniWatch</title>
  ${cssPath ? `<link rel="stylesheet" href="${cssPath}" />` : ''}
  <style>
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${jsPath}"></script>
</body>
</html>`;

  fs.writeFileSync('/tmp/webapp/dist/index.html', html);
  console.log('✅ index.html created');

  // 4. Copy public assets
  if (fs.existsSync('/tmp/webapp/public')) {
    const pubFiles = fs.readdirSync('/tmp/webapp/public');
    for (const f of pubFiles) {
      try {
        fs.copyFileSync(
          path.join('/tmp/webapp/public', f),
          path.join('/tmp/webapp/dist', f)
        );
      } catch(e) {}
    }
    console.log('✅ Static assets copied from public/');
  }

  console.log('\n🎉 Build complete! Files in dist/:');
  let totalSize = 0;
  function listDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        listDir(full);
      } else {
        const sz = fs.statSync(full).size;
        totalSize += sz;
        console.log(`  ${full.replace('/tmp/webapp/', '')} (${(sz/1024).toFixed(1)}KB)`);
      }
    }
  }
  listDir('/tmp/webapp/dist');
  console.log(`\nTotal: ${(totalSize/1024/1024).toFixed(2)}MB`);
}

run().catch(e => { console.error('❌ Build failed:', e.message); process.exit(1); });
