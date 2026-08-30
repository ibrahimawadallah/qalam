const { copyFileSync, mkdirSync, cpSync, existsSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const nextDir = join(root, '.next');
const distDir = join(root, 'dist');

// Clean dist
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}

mkdirSync(distDir, { recursive: true });

// Copy static assets
const staticSrc = join(nextDir, 'static');
if (existsSync(staticSrc)) {
  cpSync(staticSrc, join(distDir, 'static'), { recursive: true });
}

// Copy chunks
const chunksSrc = join(nextDir, 'chunks');
if (existsSync(chunksSrc)) {
  cpSync(chunksSrc, join(distDir, 'chunks'), { recursive: true });
}

// Copy BUILD_ID
if (existsSync(join(nextDir, 'BUILD_ID'))) {
  copyFileSync(join(nextDir, 'BUILD_ID'), join(distDir, 'BUILD_ID'));
}

// Copy CSS
const cssDir = join(nextDir, 'static', 'css');
if (existsSync(cssDir)) {
  cpSync(cssDir, join(distDir, 'css'), { recursive: true });
}

// Copy app/[locale] pages
const locales = ['en', 'ar'];
locales.forEach(locale => {
  const localeDir = join(nextDir, 'server', 'app', locale);
  if (existsSync(localeDir)) {
    const distLocaleDir = join(distDir, locale);
    mkdirSync(distLocaleDir, { recursive: true });
    
    // Copy page.html
    const pageHtml = join(localeDir, 'page.html');
    if (existsSync(pageHtml)) {
      copyFileSync(pageHtml, join(distLocaleDir, 'index.html'));
    }
    
    // Copy other static files in locale dir
    const files = require('fs').readdirSync(localeDir);
    files.forEach(file => {
      if (file !== 'page.html') {
        copyFileSync(join(localeDir, file), join(distLocaleDir, file));
      }
    });
  }
});

// Create root index.html that redirects to locale
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0B3B2C" />
  <title>Quran Kareem</title>
  <link rel="manifest" href="/manifest.json" />
  <script>
    (function() {
      var lang = navigator.language.startsWith('ar') ? '/ar' : '/en';
      window.location.replace(lang + window.location.search + window.location.hash);
    })();
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

writeFileSync(join(distDir, 'index.html'), indexHtml);

console.log('✓ Capacitor assets prepared in dist/');
