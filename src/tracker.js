import { isMainSession } from './policy.js'

/**
 * Stateful turn observer. It deliberately keys state by session and turn so
 * concurrent main sessions cannot interfere with each other.
 * @param {{minimumDurationMs: number}|(() => {minimumDurationMs: number})} config
 * @param {{now?: () => number, titleFor?: (session: any) => string, notify: (details: {sessionId: string, title: string, turn: number, durationMs: number}) => void}} options
 */
export function createTurnTracker(config, options) {
  const now = options.now ?? (() => performance.now())
  /** @type {Map<string, Map<number, number>>} */
  const starts = new Map()
  /** @type {Set<string>} */
  const notified = new Set()
  /** @type {string[]} */
  const notifiedOrder = []

  return {
    /** @param {{id: string, header: {origin?: string, delegationDepth?: number}}} session @param {{type: string, data: any}} event */
    observe(session, event) {
      if (!isMainSession(session.header)) return
      const turn = event.data?.turn
      if (!Number.isSafeInteger(turn) || turn < 1) return

      if (event.type === 'turn/start') {
        let turns = starts.get(session.id)
        if (turns === undefined) {
          turns = new Map()
          starts.set(session.id, turns)
        }
        if (!turns.has(turn)) turns.set(turn, now())
        return
      }
      if (event.type !== 'turn/end') return

      const turns = starts.get(session.id)
      const startedAt = turns?.get(turn)
      turns?.delete(turn)
      if (turns?.size === 0) starts.delete(session.id)
      if (event.data?.reason?.kind !== 'completed' || startedAt === undefined) return

      const key = `${session.id}:${String(turn)}`
      if (notified.has(key)) return
      const durationMs = Math.max(0, now() - startedAt)
      const currentConfig = typeof config === 'function' ? config() : config
      if (durationMs < currentConfig.minimumDurationMs) return
      notified.add(key)
      notifiedOrder.push(key)
      if (notifiedOrder.length > 2_048) {
        const oldest = notifiedOrder.shift()
        if (oldest !== undefined) notified.delete(oldest)
      }
      const compactId = session.id.startsWith('session-') ? session.id.slice('session-'.length) : session.id
      const title = options.titleFor?.(session)?.trim() || `会话 ${compactId.slice(0, 8)}`
      options.notify({ sessionId: session.id, title, turn, durationMs })
    },
  }
}
