// Builds the profile from profile.config.json → assets/*.svg + README.md.
// Run: node build.mjs   (no dependencies)
//
// GitHub strips all CSS from READMEs, so every coloured surface is an SVG image.
// Links can't live inside an SVG on GitHub, so each project card and link is its own
// image wrapped in <a>. Optional: drop Urbanist .woff2 files into fonts/ (see FONT below)
// and they get embedded, otherwise the SVGs fall back to Helvetica/Arial.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs'

const c = JSON.parse(readFileSync('profile.config.json', 'utf8'))
const { cream, ink, accent } = c.colors
const W = 900 // canvas width; README shows it at 100%

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
/** Naive word wrap by character count (SVG has no text wrapping). */
const wrap = (text, max) => {
  const lines = []; let line = ''
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line); line = w } else line = (line + ' ' + w).trim()
  }
  return line ? [...lines, line] : lines
}
const t = (x, y, s, { size = 11, ls = 3, fill = ink, anchor = 'start', weight = 700, upper = true } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" letter-spacing="${ls}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(upper ? String(s).toUpperCase() : s)}</text>`

// Embedded font (optional): fonts/Urbanist-*.woff2 → @font-face with data URIs.
const FONT = existsSync('fonts')
  ? readdirSync('fonts').filter((f) => f.endsWith('.woff2')).map((f) => {
      const weight = /bold|700/i.test(f) ? 700 : /semi|600/i.test(f) ? 600 : /medium|500/i.test(f) ? 500 : 400
      return `@font-face{font-family:Urbanist;font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync('fonts/' + f).toString('base64')}) format('woff2')}`
    }).join('')
  : ''
const GRAIN = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0"/></filter>`
const svg = (w, h, body, { grain = true, bg = cream } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>${FONT}text{font-family:${c.font}}</style>${grain ? GRAIN : ''}
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
${grain ? `<rect width="${w}" height="${h}" filter="url(#grain)"/>` : ''}
</svg>
`
/** Section title: a solid ink band with the index in accent (the site's "ink spine"). */
const band = (y, n, title) => `<rect y="${y}" width="${W}" height="56" fill="${ink}"/>
${t(40, y + 33, String(n).padStart(2, '0'), { fill: accent })}
${t(W / 2, y + 36, title, { size: 20, ls: 10, fill: cream, anchor: 'middle' })}`

// ---------- main profile image ----------
let y = 0; const parts = []
// Hero: name crossing an ink slab, labels above and below.
parts.push(
  t(40, 52, c.role),
  `<circle cx="${W - 40 - c.status.length * 10.4 - 14}" cy="48" r="5" fill="${accent}"/>`,
  t(W - 40, 52, c.status, { anchor: 'end' }),
  `<rect y="86" width="${W}" height="128" fill="${ink}"/>`,
  t(W / 2 + 18, 185, c.name, { size: 100, ls: 36, fill: cream, anchor: 'middle' }),
  `<line x1="40" y1="250" x2="${W - 40}" y2="250" stroke="${ink}"/>`,
  `<circle cx="45" cy="272" r="5" fill="${accent}"/>`,
  t(W - 40, 276, c.statement, { anchor: 'end' }),
)
y = 316

// About
parts.push(band(y, 1, 'About')); y += 56 + 44
for (const line of wrap(c.about, 64)) { parts.push(t(40, y, line, { size: 22, ls: 0, weight: 500, upper: false })); y += 32 }
y += 28

// Software: one column per pipeline stage, joined by a rule with accent dots.
parts.push(band(y, 2, 'Software')); y += 56 + 48
const colW = (W - 80) / c.software.length
parts.push(`<line x1="40" y1="${y}" x2="${W - 40}" y2="${y}" stroke="${ink}"/>`)
let deepest = 0
c.software.forEach((s, i) => {
  const x = 40 + i * colW
  parts.push(`<circle cx="${x + 5}" cy="${y}" r="5" fill="${accent}"/>`)
  parts.push(t(x, y + 32, s.stage, { size: 13 }))
  wrap(s.caption, 22).forEach((l, j) => parts.push(t(x, y + 54 + j * 16, l, { size: 12, ls: 0, weight: 400, upper: false })))
  s.tools.forEach((tool, j) => {
    const ty = y + 100 + j * 30
    parts.push(`<rect x="${x}" y="${ty - 17}" width="${colW - 24}" height="24" fill="none" stroke="${ink}"/>`)
    parts.push(t(x + 10, ty, tool, { size: 10, ls: 2 }))
    deepest = Math.max(deepest, ty)
  })
})
y = deepest + 52

// Skillset: numbered rows with hairline rules.
parts.push(band(y, 3, 'Skillset')); y += 56
c.skills.forEach((s, i) => {
  y += 48
  parts.push(t(40, y, String(i + 1).padStart(2, '0'), { fill: accent }))
  parts.push(t(96, y + 2, s, { size: 22, ls: 6 }))
  parts.push(t(W - 40, y, `${i + 1} / ${c.skills.length}`, { anchor: 'end', size: 10 }))
  parts.push(`<line x1="40" y1="${y + 18}" x2="${W - 40}" y2="${y + 18}" stroke="${ink}" stroke-opacity=".25"/>`)
})
y += 56

// Projects title band closes the main image; the cards follow as linked images.
parts.push(band(y, 4, 'Projects')); y += 56

mkdirSync('assets', { recursive: true })
for (const f of readdirSync('assets')) if (f.endsWith('.svg')) rmSync('assets/' + f) // clear old builds
writeFileSync('assets/profile.svg', svg(W, y, parts.join('\n')))

// ---------- project cards (each its own link) ----------
// Cream card, ink hairline box and the site's hard 10px ink shadow for floating media.
const CW = 440, CH = 230
const card = (p, i) => {
  const desc = wrap(p.description, 40).slice(0, 3)
  return svg(CW, CH, `
<rect x="10" y="10" width="${CW - 20}" height="${CH - 20}" fill="${ink}"/>
<rect x="0" y="0" width="${CW - 20}" height="${CH - 20}" fill="${cream}" stroke="${ink}" stroke-width="2"/>
<rect x="1" y="1" width="${CW - 22}" height="44" fill="${ink}"/>
${t(20, 28, String(i + 1).padStart(2, '0'), { fill: accent })}
${t(56, 29, p.title, { size: 15, ls: 5, fill: cream })}
${t(CW - 40, 28, p.tag, { size: 10, fill: cream, anchor: 'end' })}
${desc.map((l, j) => t(20, 84 + j * 22, l, { size: 16, ls: 0, weight: 500, upper: false })).join('\n')}
<line x1="20" y1="${CH - 60}" x2="${CW - 40}" y2="${CH - 60}" stroke="${ink}" stroke-opacity=".25"/>
${t(20, CH - 36, p.tools, { size: 10, ls: 2 })}
${t(CW - 40, CH - 36, 'View →', { size: 10, ls: 2, fill: accent, anchor: 'end' })}`, { bg: 'transparent', grain: false })
}
c.projects.forEach((p, i) => writeFileSync(`assets/project-${slug(p.repo)}.svg`, card(p, i)))

// ---------- link buttons ----------
const button = (label) => {
  const w = label.length * 13 + 56
  // Cream face + ink hairline + hard ink shadow, so it reads on GitHub's light and dark themes.
  return [w, svg(w, 48, `<rect x="5" y="5" width="${w - 5}" height="43" fill="${ink}"/>
<rect x="1" y="1" width="${w - 7}" height="41" fill="${cream}" stroke="${ink}" stroke-width="2"/>
<circle cx="20" cy="22" r="4" fill="${accent}"/>
${t(34, 26, label, { size: 11 })}`, { grain: false, bg: 'transparent' })]
}
const links = c.links.map((l) => { const [w, s] = button(l.label); writeFileSync(`assets/link-${slug(l.label)}.svg`, s); return { ...l, w } })

// ---------- README ----------
const cards = c.projects.map((p) =>
  `<a href="https://github.com/0skrrr/${p.repo}"><img src="assets/project-${slug(p.repo)}.svg" width="49%" alt="${esc(p.title)} — ${esc(p.description)}"></a>`)
const rows = []
for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2).join('\n'))

writeFileSync('README.md', `<!-- Generated by build.mjs from profile.config.json. Edit the config, then run: node build.mjs -->
<p align="center">
<img src="assets/profile.svg" width="100%" alt="${esc(c.name)} — ${esc(c.role)} ${esc(c.about)}">
</p>

<p align="center">
${rows.join('\n<br>\n')}
</p>

<p align="center">
${links.map((l) => `<a href="${l.href}"><img src="assets/link-${slug(l.label)}.svg" height="48" alt="${esc(l.label)}"></a>`).join('\n')}
</p>
`)
console.log(`Built profile.svg (${W}×${y}), ${c.projects.length} project cards, ${links.length} links → README.md`)
