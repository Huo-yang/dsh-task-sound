import { build } from 'esbuild'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGE_NAME } from '../src/client/package-name.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'lib')

// DSH 按包名索引浏览器模块（`/plugins/<包名>/client.js`）与插件配置槽位，
// 所以包名只有 package.json 一个来源：这里读出来、断言常量没漂移，再写进 banner。
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (manifest.name !== PACKAGE_NAME) {
  throw new Error(`package.json name "${manifest.name}" does not match PACKAGE_NAME "${PACKAGE_NAME}"`)
}

await rm(outDir, { recursive: true, force: true }); await mkdir(outDir, { recursive: true })
await build({ entryPoints: [join(root, 'src/index.js')], outfile: join(outDir, 'index.js'), bundle: true, format: 'esm', platform: 'node', target: 'node22', external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-session', '@deepseek-ai/schemastery'], logLevel: 'info' })
await build({
  entryPoints: [join(root, 'src/client/index.js')], outfile: join(outDir, 'client.js'), bundle: true, format: 'cjs', platform: 'browser', target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
  banner: { js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_NAME)}, factory: (require, module, exports) => {\nvar module = { exports: {} }; var exports = module.exports;\nglobalThis.__dshTaskSoundRequire = require;` },
  footer: { js: 'return { apply: apply, inject: inject }; } });' }, logLevel: 'info',
})
