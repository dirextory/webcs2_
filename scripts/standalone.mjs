import fs from 'node:fs';
import path from 'node:path';

// Bundle the built module and styles into a double-clickable, server-free HTML file.
const root = 'dist';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, url) => {
  const file = path.join(root, url.replace(/^.*?assets\//, 'assets/'));
  const js = fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, url) => {
  const file = path.join(root, url.replace(/^.*?assets\//, 'assets/'));
  return `<style>${fs.readFileSync(file, 'utf8')}</style>`;
});
fs.writeFileSync(path.join(root, 'standalone.html'), html);
console.log('Created dist/standalone.html — upload to any static host or open directly');
