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

function WorkspacePicker({ workspaces, selectedIds, disabled, onChange }) {
  const R = React()
  const selected = new Set(selectedIds)
  if (workspaces.length === 0) return R.createElement('div', { className: 'dts-workspace-empty' }, '当前没有已登记的工作区。')
  return R.createElement('div', { className: 'dts-workspaces' }, workspaces.map(workspace =>
    R.createElement('label', { className: 'dts-workspace', key: workspace.id },
      R.createElement('input', {
        type: 'checkbox',
        checked: selected.has(workspace.id),
        disabled,
        onChange: event => onChange(event.target.checked
          ? [...selectedIds, workspace.id]
          : selectedIds.filter(id => id !== workspace.id)),
      }),
      R.createElement('span', { className: 'dts-workspace-text' },
        R.createElement('span', { className: 'dts-workspace-title' }, workspace.title),
        R.createElement('span', { className: 'dts-workspace-path' }, workspace.path)))))
}

function SettingsPage() {
  const R = React(); const { useEffect, useSyncExternalStore } = R
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  useEffect(() => { void load() }, [])
  const draft = state.draft
  if (draft === null) return R.createElement('div', { className: 'dts-hint' }, state.error ?? '正在加载任务提醒设置…')
  const workspaceOnly = draft.notificationScope === 'workspaces'
  return R.createElement('div', { className: 'dts-page' },
    state.dirty && R.createElement('div', { className: 'dts-pending' }, '有未保存的修改'),
    state.missingWorkspaceIds.length > 0 && R.createElement('div', { className: 'dts-warning' }, `检测到 ${String(state.missingWorkspaceIds.length)} 个已删除的工作区配置，保存后会自动清理。`),
    state.error && R.createElement('div', { className: 'dts-error' }, state.error),
    R.createElement(Row, { title: '启用任务完成提醒', hint: '只提醒主会话成功完成；子代理、失败和取消的回合不会提醒。', control: R.createElement(Switch, { label: '启用任务完成提醒', checked: draft.enabled !== false, disabled: state.busy, onChange: checked => stage({ enabled: checked }) }) }),
    R.createElement(Row, { title: '最短任务时长', hint: '短于该时长的主会话不提醒；设为 0 表示每次成功完成都提醒。', control: R.createElement(R.Fragment, null, R.createElement('input', { className: 'dts-input', type: 'number', min: 0, max: 86400, step: 1, value: String(Math.round((draft.minimumDurationMs ?? 10000) / 1000)), disabled: state.busy, onChange: event => stage({ minimumDurationMs: Math.max(0, Number.parseInt(event.target.value || '0', 10)) * 1000 }) }), R.createElement('span', { className: 'dts-unit' }, '秒')) }),
    R.createElement(Row, { title: '提醒范围', hint: '可以提醒全部主会话，或只提醒选中工作区中的主会话。', control: R.createElement('select', { className: 'dts-select', value: draft.notificationScope ?? 'all', disabled: state.busy, onChange: event => stage({ notificationScope: event.target.value }) },
      R.createElement('option', { value: 'all' }, '全部主会话'),
      R.createElement('option', { value: 'workspaces' }, '仅选中的工作区')) }),
    workspaceOnly && R.createElement('div', { className: 'dts-workspace-section' },
      R.createElement('div', { className: 'dts-workspace-heading' }, '提醒的工作区'),
      R.createElement('div', { className: 'dts-hint' }, '未分组会话以及未选中工作区中的会话不会提醒；定时任务按其任务会话所属工作区判断。'),
      R.createElement(WorkspacePicker, { workspaces: state.workspaces, selectedIds: draft.workspaceIds ?? [], disabled: state.busy, onChange: workspaceIds => stage({ workspaceIds }) }),
      (draft.workspaceIds?.length ?? 0) === 0 && R.createElement('div', { className: 'dts-warning dts-workspace-warning' }, '尚未选择工作区，当前范围不会产生完成提醒。')),
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
