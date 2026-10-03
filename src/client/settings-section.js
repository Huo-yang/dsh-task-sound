import { discard, getSnapshot, load, save, stage, subscribe, test } from './store.js'

const ARM_INTERVAL_MS = 200
const ARM_TIMEOUT_MS = 30_000

function moduleRequire() {
  const requireFunction = globalThis.__dshTaskSoundRequire
  if (typeof requireFunction !== 'function') throw new Error('dsh-task-sound: module-table require is not available')
  return requireFunction
}
const React = () => moduleRequire()('react')

function Row({ title, hint, control }) {
  const R = React()
  return R.createElement('div', { className: 'dts-row' },
    R.createElement('div', { className: 'dts-text' }, R.createElement('div', { className: 'dts-title' }, title), R.createElement('div', { className: 'dts-hint' }, hint)),
    R.createElement('div', { className: 'dts-control' }, control))
}

function Switch(props) {
  const R = React(); const { Switch: NativeSwitch } = moduleRequire()('@deepseek-ai/dsh-client-ui-primitives')
  return R.createElement(NativeSwitch, props)
}

function SettingsPage() {
  const R = React(); const { useEffect, useSyncExternalStore } = R
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  useEffect(() => { void load() }, [])
  const draft = state.draft
  if (draft === null) return R.createElement('div', { className: 'dts-hint' }, state.error ?? '正在加载任务提醒设置…')
  return R.createElement('div', { className: 'dts-page' },
    state.dirty && R.createElement('div', { className: 'dts-pending' }, '有未保存的修改'),
    state.error && R.createElement('div', { className: 'dts-error' }, state.error),
    R.createElement(Row, { title: '启用任务完成提醒', hint: '只提醒主会话成功完成；子代理、失败和取消的回合不会提醒。', control: R.createElement(Switch, { label: '启用任务完成提醒', checked: draft.enabled !== false, disabled: state.busy, onChange: checked => stage({ enabled: checked }) }) }),
    R.createElement(Row, { title: '最短任务时长', hint: '短于该时长的主会话不提醒；设为 0 表示每次成功完成都提醒。', control: R.createElement(R.Fragment, null, R.createElement('input', { className: 'dts-input', type: 'number', min: 0, max: 86400, step: 1, value: String(Math.round((draft.minimumDurationMs ?? 10000) / 1000)), disabled: state.busy, onChange: event => stage({ minimumDurationMs: Math.max(0, Number.parseInt(event.target.value || '0', 10)) * 1000 }) }), R.createElement('span', { className: 'dts-unit' }, '秒')) }),
    R.createElement('div', { className: 'dts-footer' },
      R.createElement('button', { type: 'button', className: 'dts-button', disabled: state.testing || state.busy, onClick: () => { void test() } }, state.testing ? '测试中…' : '测试提醒'),
      R.createElement('button', { type: 'button', className: 'dts-button', disabled: !state.dirty || state.busy, onClick: discard }, '放弃'),
      R.createElement('button', { type: 'button', className: 'dts-button dts-button-primary', disabled: !state.dirty || state.busy, onClick: () => { void save() } }, state.busy ? '保存中…' : '保存')))
}

const SUMMARY = {
  en: 'Configure Windows notifications when main sessions complete',
  zh: '配置主会话完成后的 Windows 通知'
}

export function TaskSoundSettingsSection({ view, locale } = {}) {
  const R = React()
  const { useSyncExternalStore } = R
  useSyncExternalStore(
    locale === undefined ? () => () => {} : listener => locale.subscribe(listener),
    locale === undefined ? () => undefined : () => locale.getSnapshot(),
    () => undefined
  )
  if (view !== 'summary') return R.createElement(SettingsPage)
  const summary = locale === undefined ? SUMMARY.zh : locale.resolveText(SUMMARY)
  return R.createElement('span', null, summary)
}

export function armSettingsSection(ctx) {
  const startedAt = Date.now(); let timer; let done = false; let dispose = null
  const attempt = () => {
    if (done) return
    const slots = ctx.get('slots'); const locale = ctx.get('locale')
    if (slots === undefined || locale === undefined) {
      if (Date.now() - startedAt <= ARM_TIMEOUT_MS) timer = window.setTimeout(attempt, ARM_INTERVAL_MS)
      return
    }
    done = true
    const Section = props => React().createElement(TaskSoundSettingsSection, { ...props, locale })
    dispose = slots.inject('plugins.bundle.config', () => slots.register({ name: 'plugins.bundle.config', key: 'dsh-task-sound' }, Section))
  }
  timer = window.setTimeout(attempt, ARM_INTERVAL_MS)
  return () => { done = true; if (timer !== undefined) window.clearTimeout(timer); if (typeof dispose === 'function') dispose() }
}
