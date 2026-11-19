import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PACKAGE_NAME } from '../src/client/package-name.js'

test('client identity matches the npm manifest', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(PACKAGE_NAME, manifest.name)
})

/**
 * DSH 用 Loader 行里的模块名反查包清单，并要求清单 `name` 与它完全相等；
 * 不相等时该包不会被 `dsh.client` 扫描进浏览器模块图（宿主半边照常能加载，
 * 所以这个错误只在“配置页整块消失”时暴露）。
 */
test('bundle patch mounts the row by package name', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  const mounted = [...patch.matchAll(/^\s*-?\s*name:\s*["']?([^"'\s]+)["']?\s*$/gm)].map(match => match[1])
  assert.deepEqual(mounted, [PACKAGE_NAME])
})
