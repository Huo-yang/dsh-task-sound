const STYLE_ID = 'dsh-task-sound-styles'
const CSS = `
.dts-page { display:flex; flex-direction:column; width:100%; }
.dts-row { display:flex; align-items:center; justify-content:space-between; gap:24px; min-height:62px; padding:12px 0; border-bottom:.5px solid var(--dsw-alias-border-l2); }
.dts-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.dts-title { font-size:14px; line-height:22px; color:var(--dsw-alias-label-primary); }
.dts-hint { font-size:12px; line-height:18px; color:var(--dsw-alias-label-caption); }
.dts-control { flex:none; display:flex; align-items:center; gap:8px; }
.dts-input,.dts-select { box-sizing:border-box; height:32px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); padding:0 9px; font:inherit; font-size:13px; }
.dts-input[type=number] { width:100px; text-align:right; }
.dts-input[type=text] { width:220px; }
.dts-select { min-width:160px; }
.dts-unit { font-size:12px; color:var(--dsw-alias-label-caption); }
.dts-workspace-section { display:flex; flex-direction:column; gap:4px; padding:14px 0; border-bottom:.5px solid var(--dsw-alias-border-l2); }
.dts-workspace-heading { font-size:14px; line-height:22px; color:var(--dsw-alias-label-primary); }
.dts-workspaces { display:flex; flex-direction:column; gap:6px; margin-top:8px; max-height:240px; overflow:auto; }
.dts-workspace { display:flex; align-items:flex-start; gap:9px; padding:8px 10px; border-radius:8px; background:var(--dsw-alias-bg-layer-2); cursor:pointer; }
.dts-workspace input { margin-top:3px; }
.dts-workspace-text { min-width:0; display:flex; flex-direction:column; gap:1px; }
.dts-workspace-title { font-size:13px; line-height:20px; color:var(--dsw-alias-label-primary); }
.dts-workspace-path { font-size:11px; line-height:17px; color:var(--dsw-alias-label-caption); overflow-wrap:anywhere; }
.dts-workspace-empty { margin-top:8px; padding:10px; border-radius:8px; background:var(--dsw-alias-bg-layer-2); font-size:12px; color:var(--dsw-alias-label-caption); }
.dts-workspace-warning { margin-top:6px; }
.dts-footer { display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:12px 0 4px; }
.dts-button { appearance:none; padding:5px 14px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:13px; cursor:pointer; }
.dts-button-primary { border-color:transparent; background:var(--dsw-alias-label-primary); color:var(--dsw-alias-bg-layer-3); }
.dts-button:disabled { opacity:.4; cursor:default; }
.dts-pending { color:var(--dsw-alias-label-secondary); font-size:12px; padding-top:8px; }
.dts-error { color:var(--dsw-alias-state-error-primary); font-size:12px; padding-top:8px; }
.dts-warning { color:var(--dsw-alias-state-warning-primary, #b26a00); font-size:12px; padding-top:8px; }
`
export function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = CSS; document.head.appendChild(style)
}
