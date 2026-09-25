import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globals = readFileSync(`${process.cwd()}/src/styles/globals.css`, 'utf8')
const prose = readFileSync(`${process.cwd()}/src/styles/prose.css`, 'utf8')

describe('documentation light theme', () => {
  it('replaces dark chrome surfaces with light-theme colours', () => {
    expect(globals).toMatch(/html\[data-theme="light"\]:has\(\.site-shell\[data-surface="docs"\]\)::?-webkit-scrollbar-track[^}]*background: #ebe8e1;/s)
    expect(globals).toMatch(/\.docs-nav-badge[^}]*background: #e2dfd7;/s)
    expect(globals).toMatch(/\.docs-pagination__title[^}]*color: #24252b;/s)
    expect(globals).toMatch(/\.docs-breadcrumbs__current[^}]*color: #24252b;/s)
    expect(globals).toMatch(/\.site-shell\[data-surface="docs"\] \.mobile-menu-button[^}]*color: #24252b;/s)
    expect(globals).toMatch(/\.site-shell\[data-surface="docs"\] \.mobile-nav[^}]*background: #ebe8e1;/s)
  })

  it('gives prose tables and callouts readable light-theme colours', () => {
    expect(prose).toMatch(/\[data-theme="light"\][^{]*\.prose-martis th[^}]*color: #24252b;/s)
    expect(prose).toMatch(/\[data-theme="light"\][^{]*\.prose-martis td[^}]*color: #5e6068;/s)
    expect(prose).toMatch(/\[data-theme="light"\][^{]*\.prose-martis blockquote[^}]*color: #51545d;/s)
  })
})
