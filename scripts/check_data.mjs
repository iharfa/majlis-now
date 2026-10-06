// Data integrity checks run in CI. Fails if the committed data contradicts itself.
//   node scripts/check_data.mjs            -> run checks (exit 1 on failure)
//   node scripts/check_data.mjs --list-missing -> also list bills/sittings without an AI summary
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(p, 'utf-8').replace(/\r\n/g, '\n')
const works = JSON.parse(read('src/data/works.json'))
const sittings = JSON.parse(read('src/data/sittings.json'))
const rollcalls = read('src/data/realRollcalls.ts')
const roster = read('src/data/roster.ts')
const errors = []

// Every roll call: tally fields agree with counted rows, result agrees with tally, workId exists.
const blocks = rollcalls.split(/\n  \{\n/).slice(1)
for (const b of blocks) {
  const id = b.match(/id: "([^"]+)"/)?.[1]
  const workId = b.match(/workId: "(\d+)"/)?.[1]
  const result = b.match(/result: "(\w+)"/)?.[1]
  const [yes, no] = ['yes', 'no'].map((k) => Number(b.match(new RegExp(`${k}: (\\d+)`))?.[1]))
  const rows = { Yes: 0, No: 0, Abstain: 0, Absent: 0 }
  for (const m of b.matchAll(/choice: "(\w+)"/g)) rows[m[1]]++
  if (rows.Yes !== yes || rows.No !== no) errors.push(`${id}: tally ${yes}/${no} != rows ${rows.Yes}/${rows.No}`)
  if ((yes > no) !== (result === 'Passed')) errors.push(`${id}: result ${result} contradicts ${yes}-${no}`)
  if (!works.some((w) => w.id === workId)) errors.push(`${id}: workId ${workId} not in works.json`)
  const cons = [...b.matchAll(/constituencyId: "([^"]+)"/g)].map((m) => m[1])
  if (new Set(cons).size !== cons.length) errors.push(`${id}: duplicate constituency rows`)
}

// Every rollcall constituency must exist in the roster.
const rosterCons = new Set(
  [...roster.matchAll(/^\s*\[\s*'[^']*',\s*(['"])(.*?)\1/gm)].map((m) =>
    m[2].toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  ),
)
for (const m of rollcalls.matchAll(/constituencyId: "([^"]+)"/g))
  if (!rosterCons.has(m[1])) errors.push(`unknown constituency ${m[1]}`)

// works.json sanity
for (const w of works) {
  if (!w.title) errors.push(`work ${w.id}: no title`)
  if (!w.status) errors.push(`work ${w.id}: no status`)
  if (!w.documents.length) errors.push(`work ${w.id}: no documents`)
}
for (const s of sittings) if (!s.date) errors.push(`sitting ${s.id}: no date`)

if (process.argv.includes('--list-missing')) {
  const have = (dir) => (existsSync(dir) ? new Set(readdirSync(dir).map((f) => f.replace('.json', ''))) : new Set())
  const ms = works.filter((w) => !have('src/data/summaries').has(w.id)).map((w) => w.id)
  const ma = sittings.filter((s) => !have('src/data/agendas').has(s.id)).map((s) => s.id)
  console.log(`bills without AI summary: ${ms.join(', ') || 'none'}`)
  console.log(`sittings without agenda translation: ${ma.join(', ') || 'none'}`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`ok: ${blocks.length} roll calls, ${works.length} bills, ${sittings.length} sittings`)
