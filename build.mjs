// Builds the profile README: every block is an SVG card in the OSKAR. design, in the light (cream) theme.
// Edit profile.config.json, then run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'

const config = JSON.parse(readFileSync('profile.config.json', 'utf8'))
const WIDTH = 840
const THEMES = {
  light: { ground: '#ebe3d0', ink: '#130918', rule: 'rgba(19,9,24,0.22)' },
}
const ACCENT = '#b84a39'
const FONT_FILES = ['fonts/urbanist-latin.woff2', 'fonts/urbanist-latin-ext.woff2']
const fontFaces = FONT_FILES.map((file) => `@font-face{font-family:U;font-weight:100 900;src:url(data:font/woff2;base64,${readFileSync(file).toString('base64')}) format('woff2')}`).join('')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const textWidth = (text, size, tracking = 0) => [...text].reduce((w, ch) => w + (/[A-Z0-9]/.test(ch) ? 0.66 : /[ il.,·|]/.test(ch) ? 0.28 : 0.54) * size + tracking * size, 0)

function svg(width, height, theme, body, title) {
  const t = THEMES[theme]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<style>${fontFaces}text{font-family:U,Urbanist,system-ui,sans-serif;fill:${t.ink}}.ink{fill:${t.ink}}.ground{fill:${t.ground}}.accent{fill:${ACCENT}}.rule{stroke:${t.rule}}.line{stroke:${t.ink}}.on-ink{fill:${t.ground}}.cap{font-size:11px;font-weight:700;letter-spacing:2.4px}</style>
<rect width="100%" height="100%" class="ground"/>
${body(t)}
</svg>`
}

const cards = []
const card = (id, height, title, href, body, width = WIDTH) => cards.push({ id, height, title, href, body, width })

const NAME_X = 40, NAME_SIZE = 118, NAME_W = 430, SLAB = 420
card('header', 300, `OSKAR. — ${config.role} ${config.statement}`, config.site, () => `
<defs><clipPath id="slab"><rect width="${SLAB}" height="300"/></clipPath><clipPath id="off"><rect x="${SLAB}" width="${WIDTH - SLAB}" height="300"/></clipPath></defs>
<rect width="${SLAB}" height="300" class="ink"/>
<text x="${NAME_X}" y="190" font-size="${NAME_SIZE}" font-weight="700" textLength="${NAME_W}" lengthAdjust="spacing" class="on-ink" clip-path="url(#slab)">OSKAR</text>
<text x="${NAME_X}" y="190" font-size="${NAME_SIZE}" font-weight="700" textLength="${NAME_W}" lengthAdjust="spacing" clip-path="url(#off)">OSKAR</text>
<circle cx="${NAME_X + NAME_W + 12}" cy="182" r="8" class="accent"/>
<text x="${SLAB + 92}" y="214" class="cap">${esc(config.role.toUpperCase())}</text>
<text x="${SLAB + 92}" y="242" font-size="19" font-weight="500">${esc(config.statement)}</text>
<circle cx="${SLAB + 96}" cy="262" r="4" class="accent"/><text x="${SLAB + 108}" y="266" class="cap">OSKRRR.DEV</text>`)

card('intro', 170, `Hi, I'm ${config.name} (${config.nickname}). ${config.intro.join(' ')}`, null, () => `
<text x="40" y="44" class="cap">HI, I'M</text>
<text x="40" y="84" font-size="30" font-weight="700" letter-spacing="1.5">${esc(config.name)}<tspan class="accent" dx="2">.</tspan><tspan font-size="16" font-weight="500" dx="12" opacity="0.7">aka ${esc(config.nickname)}</tspan></text>
${config.intro.map((line, i) => `<text x="40" y="${116 + i * 22}" font-size="15.5">${esc(line)}</text>`).join('')}`)

const LINK_W = WIDTH / 3
for (const [i, link] of config.links.entries()) {
  const x = i === 0 ? 40 : 6, w = LINK_W - (i === 1 ? 12 : 46)
  card(`link-${link.id}`, 76, `${link.kicker}: ${link.label}`, link.href, () => `
<rect x="${x}" y="10.5" width="${w}" height="56" fill="none" class="line" stroke-width="1"/>
<text x="${x + 16}" y="33" class="cap" opacity="0.6">${esc(link.kicker.toUpperCase())}</text>
<text x="${x + 16}" y="55" font-size="17" font-weight="700">${esc(link.label)}<tspan dx="6" class="accent">↗</tspan></text>`, LINK_W)
}

const band = (no, label) => card(`band-${no}`, 64, `${no} ${label}`, null, () => `
<rect x="0" y="12" width="${WIDTH}" height="52" class="ink"/>
<text x="40" y="45" font-size="13" font-weight="700" class="accent">${no}</text>
<text x="74" y="45" font-size="15" font-weight="700" letter-spacing="5" class="on-ink">${esc(label.toUpperCase())}</text>`)

band('01', 'Selected work')
for (const [i, p] of config.projects.entries()) {
  card(`project-${p.id}`, 118, `${p.title} — ${p.lines.join(' ')}`, p.href, (t) => `
<line x1="40" x2="${WIDTH - 40}" y1="117.5" y2="117.5" class="line" stroke-width="1"/>
<text x="40" y="46" font-size="18" font-weight="700" class="accent">0${i + 1}</text>
<text x="84" y="48" font-size="30" font-weight="600" letter-spacing="0.5">${esc(p.title)}</text>
<text x="${WIDTH - 40}" y="44" class="cap" text-anchor="end" opacity="0.7">${esc(p.meta.toUpperCase())} <tspan class="accent">→</tspan></text>
${p.lines.map((line, j) => `<text x="84" y="${76 + j * 21}" font-size="14.5" opacity="0.85">${esc(line)}</text>`).join('')}`)
}

for (const [i, m] of config.more.entries()) {
  const left = i % 2 === 0
  card(`more-${m.id}`, 74, `${m.title} — ${m.line}`, m.href, () => `
<rect x="${left ? 40 : 6}" y="10.5" width="${WIDTH / 2 - 46}" height="54" fill="none" class="line" stroke-width="1"/>
<text x="${left ? 56 : 22}" y="33" font-size="16" font-weight="700">${esc(m.title)}</text>
<text x="${left ? 56 : 22}" y="52" font-size="12.5" opacity="0.75">${esc(m.line)}</text>`, WIDTH / 2)
}

band('02', 'Toolbox')
const toolRows = Math.ceil((config.tools.daily.length + config.tools.also.length) / 3)
const tools = [...config.tools.daily.map((name) => ({ name, core: true })), ...config.tools.also.map((name) => ({ name, core: false }))]
const COL_W = (WIDTH - 80 - 40) / 3
card('tools', 44 + toolRows * 30 + 34, `Daily drivers: ${config.tools.daily.join(', ')}. Also: ${config.tools.also.join(', ')}.`, null, () => `
${tools.map((tool, i) => {
  const col = Math.floor(i / toolRows), row = i % toolRows
  const x = 40 + col * (COL_W + 20), y = 40 + row * 30
  return `<line x1="${x}" x2="${x + COL_W}" y1="${y + 9}" y2="${y + 9}" class="rule" stroke-width="1"/><text x="${x}" y="${y}" font-size="14.5" font-weight="${tool.core ? 700 : 500}">${esc(tool.name)}</text>${tool.core ? `<circle cx="${x + COL_W - 4}" cy="${y - 5}" r="3.5" class="accent"/>` : ''}`
}).join('')}
<circle cx="44" cy="${40 + toolRows * 30 + 6}" r="3.5" class="accent"/><text x="54" y="${40 + toolRows * 30 + 10}" class="cap" opacity="0.75">DAILY DRIVERS</text>`)

band('03', 'Skills')
let skillX = 40, skillY = 28
const skillBoxes = config.skills.map((skill) => {
  const w = textWidth(skill, 17) + 28
  if (skillX + w > WIDTH - 40) { skillX = 40; skillY += 50 }
  const box = { skill, x: skillX, y: skillY, w }
  skillX += w + 10
  return box
})
card('skills', skillY + 66, `Skills: ${config.skills.join(', ')}`, null, () => skillBoxes.map(({ skill, x, y, w }) => `
<rect x="${x}" y="${y}" width="${w}" height="38" class="ground line" stroke-width="1"/>
<text x="${x + 14}" y="${y + 25}" font-size="17" font-weight="600" textLength="${w - 28}" lengthAdjust="spacingAndGlyphs">${esc(skill)}</text>`).join(''))

card('footer', 110, `Full portfolio with case studies at oskrrr.dev`, config.site, () => `
<line x1="40" x2="${WIDTH - 40}" y1="20.5" y2="20.5" class="line" stroke-width="1"/>
<text x="40" y="74" font-size="34" font-weight="700" letter-spacing="1.5">oskrrr.dev<tspan class="accent">.</tspan></text>
<text x="${WIDTH - 40}" y="70" font-size="14" text-anchor="end" opacity="0.75">The full portfolio, with case studies <tspan class="accent">→</tspan></text>`)

rmSync('assets', { recursive: true, force: true })
mkdirSync('assets')
const tags = cards.map((c) => {
  const files = {}
  for (const theme of Object.keys(THEMES)) {
    const content = svg(c.width, c.height, theme, c.body, c.title)
    files[theme] = `assets/${c.id}-${theme}.svg?v=${createHash('sha1').update(content).digest('hex').slice(0, 8)}`
    writeFileSync(`assets/${c.id}-${theme}.svg`, content)
  }
  const picture = `<img align="top" src="${files.light}" width="${+(c.width / WIDTH * 100).toFixed(2)}%" alt="${esc(c.title)}">`
  return c.href ? `<a href="${esc(c.href)}">${picture}</a>` : picture
})
writeFileSync('README.md', `<!-- Generated by build.mjs from profile.config.json. Edit the config, then run: node build.mjs -->\n<p>${tags.join('')}</p>\n`)
console.log(`${cards.length} cards, ${cards.length * 2} SVGs`)
