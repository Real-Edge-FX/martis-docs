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
console.log('Prerender artifacts validated.')
