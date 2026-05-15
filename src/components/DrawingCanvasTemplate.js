// DrawingCanvas Template — CSS + HTML
export const CANVAS_STYLES = `
:host { position:fixed; inset:0; z-index:10000; pointer-events:auto; font-family:var(--font-body,Inter,sans-serif); }
.co { position:absolute; inset:0; background:rgba(8,8,12,0.75); backdrop-filter:blur(14px) saturate(120%); -webkit-backdrop-filter:blur(14px) saturate(120%); opacity:0; transition:opacity .5s ease; display:flex; flex-direction:column; }
.co.visible { opacity:1; }
canvas { flex:1; width:100%; height:100%; cursor:crosshair; touch-action:none; }
.co.locked canvas { cursor:not-allowed; }
.ph { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:rgba(255,255,255,.25); font-size:1.15rem; letter-spacing:.12em; pointer-events:none; transition:opacity .5s,filter .5s; text-align:center; font-style:italic; }
.ph.hid { opacity:0; filter:blur(4px); }
.close-btn { position:absolute; top:max(16px,env(safe-area-inset-top,16px)); right:16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.6); cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .2s; z-index:2; }
.close-btn:hover { color:#fff; background:rgba(255,255,255,.12); }
.close-btn svg { width:20px; height:20px; fill:currentColor; }

/* STATUS BAR */
.status { position:absolute; top:max(18px,env(safe-area-inset-top,18px)); left:50%; transform:translateX(-50%); display:flex; gap:10px; align-items:center; padding:6px 14px; background:rgba(20,20,25,.5); border:1px solid rgba(255,255,255,.06); border-radius:20px; backdrop-filter:blur(12px); font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.45); z-index:2; transition:opacity .3s; }
.status .zoom-label { font-variant-numeric:tabular-nums; min-width:32px; text-align:center; }

/* TOOLBAR */
.tb { position:absolute; bottom:max(24px,env(safe-area-inset-bottom,24px)); left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:4px; padding:8px 10px; background:rgba(16,16,20,.65); border:1px solid rgba(255,255,255,.08); border-radius:28px; backdrop-filter:blur(18px); box-shadow:0 8px 32px rgba(0,0,0,.35); z-index:2; }
.sep { width:1px; height:22px; background:rgba(255,255,255,.1); margin:0 4px; flex-shrink:0; }
.tb-btn { background:transparent; border:none; color:rgba(255,255,255,.5); cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .15s; padding:0; position:relative; }
.tb-btn:hover { color:rgba(255,255,255,.85); background:rgba(255,255,255,.06); }
.tb-btn.active { color:#fff; background:rgba(255,255,255,.14); box-shadow:0 0 8px rgba(255,255,255,.08); }
.tb-btn.disabled { opacity:.25; pointer-events:none; }
.tb-btn svg { width:18px; height:18px; fill:currentColor; }
.tb-btn .badge { position:absolute; top:2px; right:2px; width:7px; height:7px; border-radius:50%; }

/* COLOR SWATCH in button */
.swatch { width:18px; height:18px; border-radius:50%; border:2px solid rgba(255,255,255,.25); transition:border-color .2s,transform .2s; }
.tb-btn.active .swatch { border-color:#fff; transform:scale(1.1); }

/* COLOR PICKER POPUP */
.cpop { position:absolute; bottom:calc(100% + 10px); left:50%; transform:translateX(-50%) scale(.9); opacity:0; pointer-events:none; transition:all .2s cubic-bezier(.16,1,.3,1); display:flex; gap:6px; padding:8px 10px; background:rgba(16,16,20,.8); border:1px solid rgba(255,255,255,.1); border-radius:20px; backdrop-filter:blur(14px); box-shadow:0 8px 24px rgba(0,0,0,.4); }
.cpop.open { opacity:1; transform:translateX(-50%) scale(1); pointer-events:auto; }
.cpop-color { width:24px; height:24px; border-radius:50%; border:2px solid transparent; cursor:pointer; transition:all .15s; }
.cpop-color:hover { transform:scale(1.15); }
.cpop-color.sel { border-color:#fff; box-shadow:0 0 10px currentColor; }

/* SIZE POPUP */
.spop { position:absolute; bottom:calc(100% + 10px); left:50%; transform:translateX(-50%) scale(.9); opacity:0; pointer-events:none; transition:all .2s cubic-bezier(.16,1,.3,1); display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 14px; background:rgba(16,16,20,.8); border:1px solid rgba(255,255,255,.1); border-radius:16px; backdrop-filter:blur(14px); box-shadow:0 8px 24px rgba(0,0,0,.4); }
.spop.open { opacity:1; transform:translateX(-50%) scale(1); pointer-events:auto; }
.spop input[type=range] { width:100px; accent-color:rgba(255,255,255,.7); }
.spop .size-preview { width:40px; height:40px; display:flex; align-items:center; justify-content:center; }
.spop .size-dot { border-radius:50%; background:#fff; transition:width .1s,height .1s; }
.spop .size-val { font-size:.65rem; color:rgba(255,255,255,.4); font-variant-numeric:tabular-nums; }

/* LOCK INDICATOR */
.lock-ind { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:rgba(255,255,255,.15); font-size:3rem; pointer-events:none; opacity:0; transition:opacity .3s; }
.co.locked .lock-ind { opacity:1; }

/* TOAST */
.toast { position:absolute; bottom:90px; left:50%; transform:translateX(-50%) translateY(10px); padding:8px 18px; background:rgba(20,20,25,.75); border:1px solid rgba(255,255,255,.1); border-radius:20px; backdrop-filter:blur(12px); color:rgba(255,255,255,.8); font-size:.78rem; letter-spacing:.04em; opacity:0; transition:all .3s; pointer-events:none; z-index:3; white-space:nowrap; }
.toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

@media(max-width:480px){
  .tb { gap:2px; padding:6px 8px; }
  .tb-btn { width:32px; height:32px; }
  .tb-btn svg { width:16px; height:16px; }
  .status { font-size:.6rem; padding:4px 10px; }
}
`;

export const CANVAS_HTML = `
<div class="co">
  <div class="ph">El vacío espera tu trazo...</div>
  <canvas></canvas>
  <div class="lock-ind">🔒</div>
  <button class="close-btn" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
  <div class="status">
    <span class="zoom-label">100%</span>
  </div>
  <div class="tb">
    <button class="tb-btn active" data-tool="brush" title="Pincel"><svg viewBox="0 0 24 24"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg></button>
    <button class="tb-btn" data-tool="eraser" title="Borrador"><svg viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4 4 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.37-3.54 3.54c-.39.39-.39 1.02 0 1.41zM22 22H2v-2h20v2z"/></svg></button>
    <div class="sep"></div>
    <button class="tb-btn" data-action="color" title="Color"><div class="swatch" style="background:rgba(235,235,245,.85)"></div>
      <div class="cpop" id="cpop"></div>
    </button>
    <button class="tb-btn" data-action="size" title="Tamaño"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4"/></svg>
      <div class="spop" id="spop">
        <div class="size-preview"><div class="size-dot"></div></div>
        <input type="range" min="1" max="30" value="3">
        <span class="size-val">3px</span>
      </div>
    </button>
    <div class="sep"></div>
    <button class="tb-btn" data-action="undo" title="Deshacer (Ctrl+Z)"><svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg></button>
    <button class="tb-btn" data-action="redo" title="Rehacer (Ctrl+Y)"><svg viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg></button>
    <div class="sep"></div>
    <button class="tb-btn" data-action="lock" title="Bloquear lienzo"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg></button>
    <button class="tb-btn" data-action="clear" title="Limpiar todo"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
    <div class="sep"></div>
    <button class="tb-btn" data-action="save" title="Guardar"><svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg></button>
  </div>
  <div class="toast"></div>
</div>
`;

export const COLORS = [
    { name:'Hueso', value:'rgba(235,235,245,.85)' },
    { name:'Blanco', value:'#ffffff' },
    { name:'Ámbar', value:'rgba(220,180,120,.9)' },
    { name:'Rosa', value:'rgba(220,130,160,.85)' },
    { name:'Lavanda', value:'rgba(170,140,220,.85)' },
    { name:'Cyan', value:'rgba(120,200,220,.85)' },
    { name:'Esmeralda', value:'rgba(120,200,160,.85)' },
    { name:'Rojo', value:'rgba(220,80,80,.85)' },
];
