import assert from 'node:assert/strict'
import fs from 'node:fs'

for (const file of [
  'dist/index.html',
  'dist/product/index.html',
  'dist/docs/index.html',
  'dist/404.html',
  'dist/sitemap.xml',
  'dist/robots.txt',
]) {
  assert.equal(fs.existsSync(file), true, `${file} must exist`)
}
const product = fs.readFileSync('dist/product/index.html', 'utf8')
assert.match(product, /<main/)
assert.match(product, /rel="canonical" href="https:\/\/getmartis\.com\/product"/)

// The SSR build is only the module scripts/prerender.mjs imports: the
// public/ files (.htaccess, brand images, the search index) belong to the
// client build alone.
for (const file of ['.htaccess', 'search-index.json', 'brand']) {
  assert.equal(fs.existsSync(`dist-ssr/${file}`), false, `dist-ssr/${file} must not exist (public/ copied into the SSR build)`)
}
console.log('Prerender artifacts validated.')
