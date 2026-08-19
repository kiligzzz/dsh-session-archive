// Build @dsh-external/dsh-session-archive.
//
// Host  : bundle src/index.ts  -> lib/index.js  (ESM, harness deps external)
// Client: bundle src/client/index.tsx -> lib/client.js as a
//          window.__ModuleLoader__.load({ id, factory }) classic script,
//          harness/client deps left external for the browser module table.
import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url).pathname

const external = [
  'cordis',
  '@deepseek-ai/*',
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
]

async function host() {
  await build({
    entryPoints: [root + 'src/index.ts'],
    outfile: root + 'lib/index.js',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    external,
    sourcemap: true,
    logLevel: 'info',
  })
}

async function client() {
  const outfile = root + 'lib/client.js'
  const buildResult = await build({
    entryPoints: [root + 'src/client/index.tsx'],
    outfile,
    bundle: true,
    platform: 'browser',
    format: 'cjs',
    write: false,
    target: 'es2020',
    external,
    jsx: 'automatic',
    sourcemap: false,
    logLevel: 'info',
  })
  const code = buildResult.outputFiles.find((f) => f.path === outfile)?.text ?? ''
  const wrapped = [
    'window.__ModuleLoader__.load({ id: "@dsh-external/dsh-session-archive", factory: (require) => {',
    'var module = { exports: {} }; var exports = module.exports;',
    code,
    'return module.exports; } });',
    '',
  ].join('\n')
  await mkdir(root + 'lib', { recursive: true })
  await writeFile(outfile, wrapped)
}

await mkdir(root + 'lib', { recursive: true })
await host()
await client()
console.log('build complete')
