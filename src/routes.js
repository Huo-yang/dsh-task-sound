const MAX_BODY_BYTES = 64 * 1024

/** @param {{webServer: any, handlers: Record<string, {method: string, run: (payload: any) => Promise<any>}>}} options */
export function registerRoutes({ webServer, handlers }) {
  return webServer.register({
    kind: 'prefix', path: '/task-sound',
    handler: (request, response) => {
      void handle(request, response, handlers).catch(error => writeJson(response, 500, { ok: false, error: { message: error instanceof Error ? error.message : String(error) } }))
    },
  })
}

async function handle(request, response, handlers) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const endpoint = url.pathname.slice('/task-sound'.length).replace(/^\/+|\/+$/g, '')
  const target = handlers[endpoint]
  if (target === undefined) return writeJson(response, 404, { ok: false, error: { message: '未知端点' } })
  const method = request.method ?? 'GET'
  if (method !== target.method) return writeJson(response, 405, { ok: false, error: { message: '请求方法不正确' } })
  let payload = {}
  if (method === 'POST') {
    const raw = await readBody(request)
    if (raw === null) return writeJson(response, 413, { ok: false, error: { message: '请求体过大' } })
    if (raw.trim() !== '') payload = JSON.parse(raw)
  }
  writeJson(response, 200, { ok: true, value: await target.run(payload) })
}

async function readBody(request) {
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) return null
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function writeJson(response, status, body) {
  const text = JSON.stringify(body)
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(text) })
  response.end(text)
}
