// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.join(import.meta.dirname, '../..')
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

const tokens = read('src/styles/tokens.css')
const motion = read('src/styles/motion.css')
const globals = read('src/styles/globals.css')
const indexHtml = read('index.html')

/** Every `@font-face { ... }` block in tokens.css, as raw text. */
const fontFaces = Array.from(tokens.matchAll(/@font-face\s*{([^}]*)}/g), (m) => m[1])

describe('palette', () => {
  it.each([
    ['night', '#080A10'],
    ['surface', '#10131C'],
    ['elevated', '#171B27'],
    ['line', '#2B3245'],
    ['primary', '#F4F5FA'],
    ['muted', '#A5ADBD'],
    ['cobalt', '#7187FF'],
    ['violet', '#A674FF'],
    ['proof', '#56C98B'],
    ['paper', '#F2F0E9'],
    ['editorial-ink', '#14151A'],
  ])('defines --color-%s as %s', (name, value) => {
    expect(tokens).toMatch(new RegExp(`--color-${name}:\\s*${value};`, 'i'))
  })
})

describe('self-hosted fonts', () => {
  it('no longer loads anything from Google Fonts', () => {
    expect(indexHtml).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
  })

  it.each([
    ['Geist', 'normal', '/fonts/geist-latin.woff2'],
    ['Geist Mono', 'normal', '/fonts/geist-mono-latin.woff2'],
    ['Instrument Serif', 'normal', '/fonts/instrument-serif-latin.woff2'],
    ['Instrument Serif', 'italic', '/fonts/instrument-serif-latin-italic.woff2'],
  ])('declares %s (%s) from %s with font-display: swap', (family, style, url) => {
    const face = fontFaces.find((f) => f.includes(`font-family: "${family}";`) && f.includes(`font-style: ${style};`))
    expect(face, `${family} ${style}`).toBeDefined()
    expect(face).toContain(`url("${url}") format("woff2")`)
    expect(face).toContain('font-display: swap;')
    const file = path.join(ROOT, 'public', url)
    expect(existsSync(file), file).toBe(true)
    // A real woff2 file (magic "wOF2"), not an empty placeholder.
    expect(readFileSync(file).subarray(0, 4).toString('latin1')).toBe('wOF2')
    expect(statSync(file).size).toBeGreaterThan(10_000)
  })

  it('ships the OFL license next to the font files', () => {
    expect(read('public/fonts/OFL.txt')).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('preloads only the Geist file', () => {
    const preloads = Array.from(indexHtml.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g), (m) => m[0])
    expect(preloads).toHaveLength(1)
    expect(preloads[0]).toContain('href="/fonts/geist-latin.woff2"')
    expect(preloads[0]).toContain('as="font"')
    expect(preloads[0]).toContain('type="font/woff2"')
    // Font preloads are CORS requests: without crossorigin the browser
    // downloads the file twice.
    expect(preloads[0]).toMatch(/\scrossorigin(\s|=|\/?>)/)
  })

  it.each(['Geist Fallback', 'Geist Mono Fallback', 'Instrument Serif Fallback'])(
    'defines the metric-compatible %s face and lists it in the family stack',
    (fallback) => {
      const face = fontFaces.find((f) => f.includes(`font-family: "${fallback}";`))
      expect(face, fallback).toBeDefined()
      expect(face).toMatch(/src: local\(/)
      expect(face).toMatch(/size-adjust: [\d.]+%;/)
      expect(face).toMatch(/ascent-override: [\d.]+%;/)
      expect(tokens).toMatch(new RegExp(`--font-(sans|mono|serif): "${fallback.replace(' Fallback', '')}", "${fallback}",`))
    },
  )
})

describe('stylesheets', () => {
  it('globals.css pulls in the tokens and motion layers', () => {
    expect(globals).toMatch(/@import "\.\/tokens\.css";/)
    expect(globals).toMatch(/@import "\.\/motion\.css";/)
  })

  it('keeps every motion duration between 180 and 700 ms', () => {
    const durations = Array.from(motion.matchAll(/--motion-duration-[\w-]+:\s*(\d+)ms;/g), (m) => Number(m[1]))
    expect(durations.length).toBeGreaterThan(0)
    // The 0ms values live only inside the reduced-motion block.
    const outside = durations.filter((d) => d !== 0)
    for (const d of outside) expect(d).toBeGreaterThanOrEqual(180)
    for (const d of outside) expect(d).toBeLessThanOrEqual(700)
  })

  it('switches non-essential motion off for prefers-reduced-motion', () => {
    expect(motion).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
