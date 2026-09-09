import { mkdir, readFile, writeFile } from 'node:fs/promises'
const sources = await Promise.all(['src/data/products.js','src/pages/Home.jsx','src/pages/Projects.jsx'].map(path => readFile(path, 'utf8')))
const ids = [...new Set(sources.join('\n').match(/photo-\d+-[a-z0-9]+/g))]
await mkdir('public/images', { recursive: true })
let cursor = 0
const failed = []
async function worker() {
  while (cursor < ids.length) {
    const id = ids[cursor++]
    try {
      const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`, { signal: AbortSignal.timeout(25000) })
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(String(response.status))
      await writeFile(`public/images/${id}.jpg`, Buffer.from(await response.arrayBuffer()))
      console.log('Saved', id)
    } catch (error) { failed.push(id); console.error('Failed', id, error.message) }
  }
}
await Promise.all([worker(),worker(),worker()])
console.log(JSON.stringify({ total: ids.length, failed }))
if (failed.length) process.exitCode = 1
