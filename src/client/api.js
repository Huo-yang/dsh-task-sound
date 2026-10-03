const BASE = '/task-sound'

async function call(endpoint, body = null) {
  const response = await fetch(`${BASE}/${endpoint}`, body === null ? {
    method: 'GET', credentials: 'same-origin',
  } : {
    method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  const payload = await response.json()
  if (payload?.ok !== true) throw new Error(payload?.error?.message ?? `请求失败（HTTP ${String(response.status)}）`)
  return payload.value
}

export const readState = () => call('state')
export const saveConfig = config => call('config', { config })
export const testNotification = config => call('test', { config })
