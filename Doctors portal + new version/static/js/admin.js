const listEl = document.getElementById('list');
const form = document.getElementById('form');
const photoForm = document.getElementById('photo-form');
const resetBtn = document.getElementById('formResetBtn') || document.getElementById('reset');
const deleteBtn = document.getElementById('delete');
const searchEl = document.getElementById('search');
const filterSpec = document.getElementById('filter-spec');
const themeToggle = document.getElementById('themeToggle');
const addDoctorBtn = document.getElementById('addDoctorBtn');
const manageSpecBtn = document.getElementById('manageSpecBtn');
const tglogEl = document.getElementById('tglog');
const openLogBtn = document.getElementById('openLog');
const logModal = document.getElementById('tglogModal');
const logModalBody = document.getElementById('tglogModalBody');
const doctorModal = document.getElementById('doctorModal');
const doctorModalTitle = document.getElementById('doctorModalTitle');
const specSelect = document.getElementById('specSelect');
const openSpecManagerBtn = document.getElementById('openSpecManager');
const specModal = document.getElementById('specModal');
const specListModal = document.getElementById('specListModal');
const newSpecName = document.getElementById('newSpecName');
const addSpecBtn = document.getElementById('addSpecBtn');
const newSpecDesignation = document.getElementById('newSpecDesignation');
// New: branding elements
const logoFile = document.getElementById('logo-file');
const logoFileName = document.getElementById('logo-file-name');
const logoPreview = document.getElementById('logoPreview');
const logoPreviewImgGlobal = document.getElementById('logoPreviewImg');
const brandLogoSmall = document.getElementById('brandLogoSmall');
const openScheduleUpload = document.getElementById('openScheduleUpload');
const scheduleUploadModal = document.getElementById('scheduleUploadModal');
const scheduleUploadForm = document.getElementById('schedule-upload-form');
const scheduleFile = document.getElementById('scheduleFile');
const scheduleFileName = document.getElementById('scheduleFileName');
const bulkUploadResult = document.getElementById('bulkUploadResult');
// New template generation inputs
const tmplStart = document.getElementById('tmplStart');
const tmplEnd = document.getElementById('tmplEnd');
const genTemplateBtn = document.getElementById('genTemplateBtn');
const downloadRangeTemplate = document.getElementById('downloadRangeTemplate');
const tmplGrouped = document.getElementById('tmplGrouped');
const holidayModal = document.getElementById('holidayModal');
const openHolidayModal = document.getElementById('openHolidayModal');
const holidayList = document.getElementById('holidayList');
const holidayReason = document.getElementById('holidayReason');
const holidaySaveBtn = document.getElementById('holidaySaveBtn');
const dayPickerGrid = document.getElementById('dayPickerGrid');
const refreshHolidaysBtn = document.getElementById('refreshHolidaysBtn');
// Added missing element references
const scheduleList = document.getElementById('scheduleList');
const bulkAddBtn = document.getElementById('bulkAddBtn');
const bulkReopenBtn = document.getElementById('bulkReopenBtn');
// Quick closed-day form
const quickClosedForm = document.getElementById('quickClosedForm');
const quickClosedDate = document.getElementById('quickClosedDate');
const quickClosedReason = document.getElementById('quickClosedReason');
const quickClosedApply = document.getElementById('quickClosedApply');
const quickClosedList = document.getElementById('quickClosedList');
const quickClosedStatus = document.getElementById('quickClosedStatus');
let pendingClosedDates = [];
// Track holiday selections locally to avoid cross-day bleed
let holidaySelection = new Set();

// Shift Knowledge UI - Now handled by shift_knowledge_categorized.js

/* OLD CODE - COMMENTED OUT TO PREVENT CONFLICTS
async function fetchShiftKnowledge(){
  const r = await fetch('/api/shift_knowledge');
  const j = await r.json();
  return j && j.ok ? (j.data||{}) : {};
}

function renderShiftRow(spec, shName, vals, onChange){
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:120px 120px repeat(7,1fr);gap:8px;align-items:center;background:var(--card);border:1px solid var(--border);padding:10px;border-radius:12px';
  const specEl = document.createElement('input'); specEl.value = spec; specEl.placeholder='Specialty'; specEl.style.cssText='padding:6px 8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:700';
  const shiftEl = document.createElement('select'); shiftEl.style.cssText='padding:6px 8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:700'; ['Shift 1','Shift 2'].forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===shName) op.selected=true; shiftEl.appendChild(op); });
  const start = document.createElement('input'); start.placeholder='Start 08:00'; start.value = vals.start||'';
  const bt = document.createElement('input'); bt.placeholder='Before timing 08:00-12:00'; bt.value = vals.before_timing||'';
  const bp = document.createElement('input'); bp.placeholder='Before pts'; bp.type='number'; bp.value = vals.before_patients||'';
  const br = document.createElement('input'); br.placeholder='Breaks 12:00-13:00'; br.value = vals.breaks||'';
  const at = document.createElement('input'); at.placeholder='After timing 13:00-16:00'; at.value = vals.after_timing||'';
  const ap = document.createElement('input'); ap.placeholder='After pts'; ap.type='number'; ap.value = vals.after_patients||'';
  const tp = document.createElement('input'); tp.placeholder='Total patients'; tp.type='number'; tp.value = vals.total_patients||'';
  [start,bt,bp,br,at,ap,tp].forEach(i=> i.style.cssText='padding:6px 8px;background:var(--panel);border:1px solid var(--border);border-radius:6px;font-size:12px');
  wrap.append(specEl, shiftEl, start, bt, bp, br, at, ap, tp);
  const onSave = async ()=>{
    const specV = specEl.value.trim()||'Unknown'; const shV = shiftEl.value;
    const payload = {}; payload[specV] = {}; payload[specV][shV] = {
      start: start.value.trim(), before_timing: bt.value.trim(), before_patients: bp.value?Number(bp.value):'', breaks: br.value.trim(), after_timing: at.value.trim(), after_patients: ap.value?Number(ap.value):'', total_patients: tp.value?Number(tp.value):''
    };
    shiftKnowledgeStatus.textContent = 'Saving…';
    try{
      const r = await fetch('/api/shift_knowledge', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({data: payload})});
      const j = await r.json();
      if(!j.ok) throw new Error(j.error||'Save failed');
      shiftKnowledgeStatus.textContent = 'Saved'; setTimeout(()=>{ if(shiftKnowledgeStatus.textContent==='Saved') shiftKnowledgeStatus.textContent=''; }, 1500);
      if(onChange) onChange(specV, shV);
    }catch(e){ shiftKnowledgeStatus.textContent = e.message||'Save failed'; }
  };
  [specEl, shiftEl, start, bt, bp, br, at, ap, tp].forEach(el=> el.addEventListener('change', onSave));
  return wrap;
}

async function openShiftKnowledge(){
  if(!shiftKnowledgeModal) return;
  shiftKnowledgeContainer.innerHTML = '<div style="font-size:12px;color:var(--muted)">Loading…</div>';
  shiftKnowledgeModal.style.display = 'flex';
  const data = await fetchShiftKnowledge();
  shiftKnowledgeContainer.innerHTML = '';
  const specs = Object.keys(data).sort();
  if(!specs.length){
    const hint = document.createElement('div');
    hint.style.cssText='font-size:12px;color:var(--muted)';
    hint.textContent='No knowledge yet. Use “Add Specialty” to start.';
    shiftKnowledgeContainer.appendChild(hint);
  }
  specs.forEach(spec=>{
    const shifts = data[spec]||{};
    const row1 = renderShiftRow(spec, 'Shift 1', shifts['Shift 1']||{}, (s)=>{});
    const row2 = renderShiftRow(spec, 'Shift 2', shifts['Shift 2']||{}, (s)=>{});
    const box = document.createElement('div'); box.style.cssText='display:flex;flex-direction:column;gap:8px';
    const title = document.createElement('div'); title.textContent = spec; title.style.cssText='font-weight:800;font-size:13px;letter-spacing:.4px;color:var(--primary)';
    box.append(title, row1, row2);
    shiftKnowledgeContainer.appendChild(box);
  });
}

openShiftKnowledgeBtn && openShiftKnowledgeBtn.addEventListener('click', openShiftKnowledge);
closeShiftKnowledgeBtn && closeShiftKnowledgeBtn.addEventListener('click', ()=>{ shiftKnowledgeModal.style.display='none'; });
addNewSpecialtyShiftBtn && addNewSpecialtyShiftBtn.addEventListener('click', ()=>{
  const box = document.createElement('div'); box.style.cssText='display:flex;flex-direction:column;gap:8px';
  const row1 = renderShiftRow('', 'Shift 1', {}, ()=>{});
  const row2 = renderShiftRow('', 'Shift 2', {}, ()=>{});
  box.append(row1, row2);
  shiftKnowledgeContainer.appendChild(box);
});
END OF OLD CODE COMMENTED OUT */

// Sidebar nav
const closedDaysNav = document.querySelector('.sidenav .nav-item[data-target="closed-days"]');
const logsNavBtn = document.getElementById('logsNavBtn');
(function(){ window.userRole = (window.userRole||'PR'); })();
const ROLE = (window.userRole||'PR').toUpperCase();

// Show Telegram Logs only for ADMIN
(function(){
  const isAdmin = ROLE === 'ADMIN';
  if(logsNavBtn) logsNavBtn.style.display = isAdmin ? '' : 'none';
  const logsContent = document.getElementById('content-logs');
  if(logsContent && !isAdmin) logsContent.style.display = 'none';
})();
(function(){
  const items = document.querySelectorAll('.sidenav .nav-item:not(.nav-parent)');
  const views = {
    doctors: document.getElementById('content-doctors'),
    schedule: document.getElementById('content-schedule'),
    holidays: document.getElementById('content-holidays'),
    'doctor-opd': document.getElementById('content-doctor-opd'),
    logs: document.getElementById('content-logs'),
    'closed-days': document.getElementById('content-closed-days'),
    'patient-display': document.getElementById('content-patient-display'),
    'media': document.getElementById('content-media'),
    'user-mgmt': document.getElementById('content-user-mgmt')
  };

  // Navigation state & transition helpers (previously missing, causing menu breakage)
  let currentView = null;
  let isNavigating = false;
  let veilEl = null;

  function ensureVeil(){
    if(!veilEl){
      veilEl = document.createElement('div');
      veilEl.id = 'nav-transition-veil';
      veilEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .18s ease;background:rgba(0,0,0,0.04);backdrop-filter:blur(2px);z-index:999;';
      document.body.appendChild(veilEl);
    }
  }
  function showVeil(){ ensureVeil(); veilEl.style.opacity = '1'; }
  function hideVeil(){ if(veilEl) veilEl.style.opacity = '0'; }

  function initInitialView(){
    if(currentView) return;
    const activeBtn = document.querySelector('.sidenav .nav-item.active');
    let key = activeBtn ? activeBtn.getAttribute('data-target') : Object.keys(views).find(k => views[k]);
    if(key && views[key]){
      currentView = key;
      for(const k in views){
        const v = views[k];
        if(!v) continue;
        v.style.display = (k === key) ? 'block' : 'none';
        v.classList.toggle('active', k === key);
      }
    }
  }
  initInitialView();
  // Role gating & section locking
  const canDoctors = ['ADMIN','PR','MEDICAL_ADMIN'].includes(ROLE);
  const canSchedule = ['ADMIN','MEDICAL_ADMIN'].includes(ROLE);
  const canClosed = ['ADMIN','MEDICAL_ADMIN'].includes(ROLE);
  const canLogs = ['ADMIN','MEDICAL_ADMIN'].includes(ROLE);
  const navButtons = new Map();
  document.querySelectorAll('.sidenav .nav-item').forEach(b=> navButtons.set(b.getAttribute('data-target'), b));
  function addBarrier(section){
    if(!section) return;
    const ov = document.createElement('div'); ov.className='locked-overlay';
    ov.innerHTML = '<div class="lock">🛡️</div><div class="txt">Locked for your role</div>';
    section.appendChild(ov);
  }
  // Removed: earlier duplicate renderOpdShiftForm definition


  // Run post-view initialization logic based on the view key
  function afterShown(t){
    if(t==='user-mgmt' && typeof initUsersPanel==='function'){
      initUsersPanel();
    }
    if(t==='media' && typeof initMediaPanel==='function'){
      initMediaPanel();
    }
  }

  function switchView(t, btn){
    if(isNavigating || !views[t]) return;
    if(currentView === t) return;
    isNavigating = true;

    // Update nav active state immediately (no reflow-heavy transforms)
    items.forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    // Use a two-RAF sequence with a tiny overlay to avoid white blips
    showVeil();
    requestAnimationFrame(()=>{
      for(const k in views){ 
        const v = views[k];
        if(!v) continue;
        v.classList.remove('active');
        v.style.display = 'none';
      }
      const next = views[t];
      next.style.display = 'block';
      // Wait one frame so styles apply, then mark active for opacity transition
      requestAnimationFrame(()=>{
        next.classList.add('active');
        currentView = t;
        afterShown(t);
        // Give the browser ~90ms to paint then hide veil
        setTimeout(()=>{ hideVeil(); isNavigating = false; }, 120);
      });
    });
  }

  items.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.getAttribute('data-target');
      switchView(t, btn);
    });
  });
})();

// =============================
// Shift Knowledge (Schedule Tab)
// =============================

(function(){
  const openBtn = document.getElementById('openShiftKnowledgeBtn');
  const closeBtn = document.getElementById('closeShiftKnowledgeBtn');
  const modal = document.getElementById('shiftKnowledgeModal');
  const container = document.getElementById('shiftKnowledgeContainer');
  const statusEl = document.getElementById('shiftKnowledgeStatus');
  const addSpecBtn = document.getElementById('addNewSpecialtyShiftBtn');

  if(!openBtn || !modal || !container) return;

  let knowledge = {};

  function render(){
    const specs = Object.keys(knowledge).sort();
    if(!specs.length){
      container.innerHTML = '<div style="font-size:12px;color:var(--muted)">No specialties defined yet. Click "Add Specialty" to begin.</div>';
      return;
    }
    container.innerHTML = specs.map(spec => {
      const row = knowledge[spec] || {};
      const s1 = row.shift1 || {};
      const s2 = row.shift2 || {};
      return `
        <div class="sk-row" data-spec="${spec}">
          <div style="font-weight:700;margin-bottom:4px">${spec}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:6px">
            <div class="sk-col">
              <div style="font-size:12px;font-weight:600;margin-bottom:4px">Shift 1</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px">
                <label>Start <input type="time" data-field="s1_start" value="${s1.start||''}"></label>
                <label>End <input type="time" data-field="s1_end" value="${s1.end||''}"></label>
                <label>Patients <input type="number" min="0" data-field="s1_pts" value="${s1.patients||''}" style="width:80px"></label>
              </div>
            </div>
            <div class="sk-col">
              <div style="font-size:12px;font-weight:600;margin-bottom:4px">Shift 2</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px">
                <label>Start <input type="time" data-field="s2_start" value="${s2.start||''}"></label>
                <label>End <input type="time" data-field="s2_end" value="${s2.end||''}"></label>
                <label>Patients <input type="number" min="0" data-field="s2_pts" value="${s2.patients||''}" style="width:80px"></label>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function load(){
    statusEl.textContent = 'Loading…';
    try{
      const r = await fetch('/api/shift-knowledge');
      const j = await r.json();
      if(j.ok){
        knowledge = j.knowledge || {};
        render();
        statusEl.textContent = '';
      }else{
        statusEl.textContent = j.error || 'Failed to load';
      }
    }catch(e){
      statusEl.textContent = 'Failed to load';
    }
  }

  async function save(){
    statusEl.textContent = 'Saving…';
    const rows = Array.from(container.querySelectorAll('.sk-row'));
    const updated = {};
    rows.forEach(row => {
      const spec = row.getAttribute('data-spec');
      const s1_start = row.querySelector('input[data-field="s1_start"]').value;
      const s1_end = row.querySelector('input[data-field="s1_end"]').value;
      const s1_pts = parseInt(row.querySelector('input[data-field="s1_pts"]').value||'0',10) || 0;
      const s2_start = row.querySelector('input[data-field="s2_start"]').value;
      const s2_end = row.querySelector('input[data-field="s2_end"]').value;
      const s2_pts = parseInt(row.querySelector('input[data-field="s2_pts"]').value||'0',10) || 0;
      updated[spec] = {
        shift1: { start: s1_start, end: s1_end, patients: s1_pts },
        shift2: { start: s2_start, end: s2_end, patients: s2_pts }
      };
    });
    try{
      const r = await fetch('/api/shift-knowledge', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ knowledge: updated })
      });
      const j = await r.json();
      if(j.ok){
        knowledge = updated;
        statusEl.textContent = 'Saved';
        setTimeout(()=>{ if(statusEl.textContent==='Saved') statusEl.textContent=''; }, 2000);
      }else{
        statusEl.textContent = j.error || 'Save failed';
      }
    }catch(e){
      statusEl.textContent = 'Save failed';
    }
  }

  function open(){
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    load();
  }
  function close(){ 
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
  }

  openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e=>{ if(e.target === modal) close(); });

  addSpecBtn && addSpecBtn.addEventListener('click', ()=>{
    const name = prompt('Enter specialty name (e.g. Internal Medicine):');
    if(!name) return;
    if(!knowledge[name]) knowledge[name] = { shift1:{}, shift2:{} };
    render();
  });

  // Auto-save on input blur
  container.addEventListener('focusout', e=>{
    if(e.target.tagName === 'INPUT'){
      save();
    }
  });
})();

// Patient Display Settings logic
const pdRotate = document.getElementById('pdRotate');
const pdForm = document.getElementById('patientDisplayForm');
const pdStatus = document.getElementById('pdStatus');
const pdShowRoom = document.getElementById('pdShowRoom');
const pdShowBreaks = document.getElementById('pdShowBreaks');
const pdShowStart = document.getElementById('pdShowStart');
const pdResolution = document.getElementById('pdResolution');
const pdFillMode = document.getElementById('pdFillMode');

async function loadPatientDisplaySettings(){
  if(!pdRotate) return;
  try{
    const r = await fetch('/api/patient_display/settings');
    const j = await r.json();
    if(j && j.settings){
      if(typeof j.settings.rotate_ms === 'number') pdRotate.value = Math.round(j.settings.rotate_ms/1000);
      if(pdShowRoom) pdShowRoom.checked = j.settings.show_room !== false;
      if(pdShowBreaks) pdShowBreaks.checked = j.settings.show_breaks !== false;
      if(pdShowStart) pdShowStart.checked = j.settings.show_start_time !== false;
      if(pdResolution && j.settings.display_resolution) pdResolution.value = j.settings.display_resolution;
      if(pdFillMode && j.settings.fill_mode) pdFillMode.value = j.settings.fill_mode;
    }
  }catch(e){
    if(pdStatus) pdStatus.textContent = 'Failed to load settings';
  }
}

// Doctor poster manager
const posterManager = document.getElementById('posterManager');
async function loadPosterManager(){
  if(!posterManager) return;
  posterManager.innerHTML = '<div style="font-size:12px;color:var(--muted)">Loading…</div>';
  try{
    const r = await fetch('/api/doctors');
    const j = await r.json();
    const docs = (j.doctors||[]).slice().sort((a,b)=> a.name.localeCompare(b.name));
    if(!docs.length){ posterManager.innerHTML = '<div style="font-size:12px;color:var(--muted)">No doctors found</div>'; return; }
    posterManager.innerHTML = '';
    docs.forEach(d=>{
      const row = document.createElement('div');
      row.className='poster-row';
      row.style.cssText='display:flex;align-items:center;gap:14px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--card);flex-wrap:wrap';
      const thumb = document.createElement('div');
      thumb.style.cssText='width:90px;height:120px;border:1px solid var(--border);background:#0d2230;position:relative;overflow:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center';
      const img = document.createElement('img'); img.alt=d.name; img.style.cssText='width:100%;height:100%;object-fit:cover';
      img.src = `/doctor-promo/${d.id}?v=${d.promo_version||d.image_version||1}`;
      img.onerror=()=>{ img.onerror=null; img.src='/static/img/default-doctor.png'; };
      thumb.appendChild(img);
      const meta = document.createElement('div'); meta.style.cssText='flex:1 1 260px;min-width:200px;font-size:12px;display:flex;flex-direction:column;gap:4px';
      meta.innerHTML = `<div style="font-weight:700;font-size:13px">${d.name}</div><div style="opacity:.65">${d.specialty||''}</div>`;
      if(!d.promo_version){
        const warn = document.createElement('div');
        warn.textContent = 'No poster uploaded';
        warn.style.cssText='font-size:11px;color:#ffb347;font-weight:600';
        meta.appendChild(warn);
      }
      const controls = document.createElement('div'); controls.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      const file = document.createElement('input'); file.type='file'; file.accept='image/*'; file.style.display='none';
      const choose = document.createElement('button'); choose.type='button'; choose.textContent='Choose'; choose.addEventListener('click',()=>file.click());
      const upload = document.createElement('button'); upload.type='button'; upload.textContent='Upload';
      const nameSpan = document.createElement('span'); nameSpan.style.cssText='font-size:11px;opacity:.7;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'; nameSpan.textContent='No file';
      file.addEventListener('change', ()=>{ nameSpan.textContent = file.files && file.files[0] ? file.files[0].name : 'No file'; });
      const inlineMsg = document.createElement('div');
      inlineMsg.style.cssText='flex-basis:100%;font-size:11px;min-height:14px;color:#ffb347;font-weight:600';
      controls.appendChild(inlineMsg);
      upload.addEventListener('click', async ()=>{
        inlineMsg.textContent='';
        if(!file.files || !file.files[0]){ inlineMsg.textContent='Choose an image first'; return; }
        const chosen = file.files[0];
        const ext = (chosen.name.split('.').pop()||'').toLowerCase();
        const allowed = ['jpg','jpeg','png','webp','gif'];
        if(!allowed.includes(ext)){
          inlineMsg.textContent = 'Unsupported file type. Allowed: '+allowed.join(', ');
          return;
        }
        const fd = new FormData(); fd.append('file', chosen);
        upload.disabled=true; upload.textContent='Uploading…';
        try{
          const token = window.token||'';
          const resp = await fetch(`/api/doctors/${d.id}/promo?token=${encodeURIComponent(token)}`, {method:'POST', headers:{'X-Admin-Token': token}, body: fd});
          const jr = await resp.json().catch(async()=>{ try { return JSON.parse(await resp.text()); } catch { return {}; }});
          if(!resp.ok || !jr.ok){
            const allowedList = jr.allowed ? (' Allowed: '+jr.allowed.join(', ')) : '';
            throw new Error(jr.error || ('Upload failed.'+allowedList));
          }
          if(jr.promo_version) d.promo_version = jr.promo_version;
          img.src = `/doctor-promo/${d.id}?v=${d.promo_version||Date.now()}`;
          file.value=''; nameSpan.textContent='No file';
          inlineMsg.style.color = '#4cc28a';
          inlineMsg.textContent='Poster uploaded';
          upload.textContent='Uploaded';
          setTimeout(()=>{ upload.textContent='Upload'; upload.disabled=false; inlineMsg.textContent=''; inlineMsg.style.color='#ffb347'; }, 1800);
        }catch(err){
          inlineMsg.style.color='#ff6d6d';
          inlineMsg.textContent = err.message;
          upload.textContent='Upload'; upload.disabled=false;
        }
      });
      controls.append(choose, upload, nameSpan, file);
      row.append(thumb, meta, controls);
      posterManager.appendChild(row);
    });
  }catch(err){
    posterManager.innerHTML = '<div style="font-size:12px;color:var(--danger)">Failed to load doctor list</div>';
  }
}

pdForm && pdForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!pdRotate) return;
  let secs = parseInt(pdRotate.value,10);
  if(isNaN(secs)) secs = 12;
  secs = Math.min(300, Math.max(3, secs));
  pdRotate.value = secs;
  const ms = secs * 1000;
  pdStatus.textContent = 'Saving...';
  try{
    const payload = {
      rotate_ms: ms,
      show_room: pdShowRoom ? pdShowRoom.checked : true,
      show_breaks: pdShowBreaks ? pdShowBreaks.checked : true,
      show_start_time: pdShowStart ? pdShowStart.checked : true
    };
    if(pdResolution) payload.display_resolution = pdResolution.value || 'auto';
    if(pdFillMode) payload.fill_mode = pdFillMode.value || 'auto';
    const r = await fetch('/api/patient_display/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const j = await r.json();
    if(j.ok){
      pdStatus.textContent = 'Saved';
      setTimeout(()=>{ if(pdStatus.textContent==='Saved') pdStatus.textContent=''; }, 2500);
    }else{
      pdStatus.textContent = j.error || 'Error';
    }
  }catch(err){
    pdStatus.textContent = 'Save failed';
  }
});

// Theme toggle
(function(){
  const mode = localStorage.getItem('adminTheme') || 'dark';
  if(mode === 'light') {
    document.documentElement.classList.add('light');
    // Update button to show dark mode option
    const toggle = document.getElementById('themeToggle');
    if(toggle){
      const icon = toggle.querySelector('.btn-icon');
      const text = toggle.querySelector('.btn-text');
      if(icon) icon.textContent = '🌙';
      if(text) text.textContent = 'Dark Mode';
    }
  } else {
    // In dark mode, update button to show light mode option
    const toggle = document.getElementById('themeToggle');
    if(toggle){
      const icon = toggle.querySelector('.btn-icon');
      const text = toggle.querySelector('.btn-text');
      if(icon) icon.textContent = '☀️';
      if(text) text.textContent = 'Light Mode';
    }
  }
})();

themeToggle && (themeToggle.onclick = ()=>{
  const root = document.documentElement;
  const isLight = root.classList.toggle('light');
  localStorage.setItem('adminTheme', isLight ? 'light' : 'dark');
  // Update button text to show opposite mode
  const icon = themeToggle.querySelector('.btn-icon');
  const text = themeToggle.querySelector('.btn-text');
  if(isLight){
    // Currently in light mode, show dark mode option
    icon.textContent = '🌙';
    text.textContent = 'Dark Mode';
  } else {
    // Currently in dark mode, show light mode option
    icon.textContent = '☀️';
    text.textContent = 'Light Mode';
  }
});

// Helpers for modal show/hide
function showModal(el){ if(!el) return; el.style.display='flex'; el.setAttribute('aria-hidden','false'); }
function hideModal(el){ if(!el) return; el.style.display='none'; el.setAttribute('aria-hidden','true'); }

// Open edit/add modal
function openDoctorModal(title){
  if(doctorModalTitle){
    doctorModalTitle.textContent = title;
    // Use title attribute for full hover tooltip when long
    doctorModalTitle.title = title;
  }
  showModal(doctorModal);
}

// Add button -> open empty form in modal
if(addDoctorBtn){
  addDoctorBtn.onclick = ()=>{
    if(!form) return;
    form.reset();
    form.id.value='';
    if(form.name) form.name.focus();
    ensureFilterOptions();
    openDoctorModal('Add Doctor');
  };
}

// Log modal wiring
if(openLogBtn && logModal){
  const open = ()=>{ showModal(logModal); refreshLog(true); };
  const close = ()=> hideModal(logModal);
  openLogBtn.onclick = open;
  logModal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) close(); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
}

// Doctor modal close on backdrop
if(doctorModal){
  doctorModal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) hideModal(doctorModal); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideModal(doctorModal); });
}

// Specialty manager modal
if(manageSpecBtn && specModal){
  manageSpecBtn.onclick = ()=>{ renderSpecialtiesModal(); showModal(specModal); };
  specModal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) hideModal(specModal); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideModal(specModal); });
}
if(openSpecManagerBtn){ openSpecManagerBtn.onclick = ()=>{ renderSpecialtiesModal(); showModal(specModal); }; }
// Sub-modal for adding a specialty with default designation
const specAddModal = document.getElementById('specAddModal');
const openAddSpecPopup = document.getElementById('openAddSpecPopup');
openAddSpecPopup && (openAddSpecPopup.onclick = ()=>{ showModal(specAddModal); });
specAddModal && specAddModal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) hideModal(specAddModal); });
if(addSpecBtn){
  addSpecBtn.onclick = async ()=>{
    const name = (newSpecName.value||'').trim();
    const designation = (newSpecDesignation?.value||'').trim();
    if(!name) return;
    try{
      await api('/api/specialties', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, designation})});
      newSpecName.value='';
      if(newSpecDesignation) newSpecDesignation.value='';
      await load();
      renderSpecialtiesModal();
    }catch(err){ alert('Failed to add specialty: '+err.message); }
  };
}

// Auto-assign designation when specialty changes if empty
if(specSelect && form){
  specSelect.addEventListener('change', ()=>{
    try{
      const spec = specSelect.value;
      const map = (cache && cache.specialty_designations) || {};
      const suggested = map[spec] || '';
      // Only fill if empty or was previously auto-filled to another value
      if((form.designation.value||'').trim() === ''){
        form.designation.value = suggested;
      }
    }catch{}
  });
}

function renderSpecialtiesModal(){
  if(!specListModal || !cache) return;
  specListModal.innerHTML='';
  for(const s of cache.specialty_order){
    const li = document.createElement('li');
  li.style.display='flex'; li.style.alignItems='center'; li.style.gap='6px'; li.style.margin='4px 0';
  li.setAttribute('draggable','true');
  li.dataset.spec = s;
    const count = cache.doctors.filter(d=>d.specialty===s).length;
    const defDesig = (cache.specialty_designations && cache.specialty_designations[s]) || '';
    const nameSpan = document.createElement('span'); nameSpan.textContent = `${s} (${count})` + (defDesig? ` — ${defDesig}`:''); nameSpan.style.flex='1';
    // Move Up/Down buttons for visibility of reordering feature
    const upBtn = document.createElement('button'); upBtn.textContent='↑'; upBtn.style.padding='4px 8px'; upBtn.title='Move up';
    const downBtn = document.createElement('button'); downBtn.textContent='↓'; downBtn.style.padding='4px 8px'; downBtn.title='Move down';
    const editBtn = document.createElement('button'); editBtn.textContent='✎'; editBtn.style.padding='4px 8px'; editBtn.title='Rename';
    const delBtn = document.createElement('button'); delBtn.textContent='✕'; delBtn.style.padding='4px 8px'; delBtn.title='Delete';
    delBtn.style.background='var(--card)'; delBtn.style.border='1px solid var(--border)'; delBtn.style.color='var(--text)';
    upBtn.onclick = ()=>{
      const order = cache.specialty_order.slice();
      const idx = order.indexOf(s);
      if(idx>0){
        [order[idx-1], order[idx]] = [order[idx], order[idx-1]];
        cache.specialty_order = order;
        renderSpecialtiesModal();
        // Persist
        saveReorder();
      }
    };
    downBtn.onclick = ()=>{
      const order = cache.specialty_order.slice();
      const idx = order.indexOf(s);
      if(idx>=0 && idx<order.length-1){
        [order[idx+1], order[idx]] = [order[idx], order[idx+1]];
        cache.specialty_order = order;
        renderSpecialtiesModal();
        // Persist
        saveReorder();
      }
    };
    editBtn.onclick = async ()=>{
      const nv = prompt('New name for specialty', s); if(!nv) return;
      const nd = prompt('Default designation for this specialty (leave blank to keep current)', defDesig||'');
      const body = { name: nv.trim() };
      if(nd !== null){ body.designation = (nd||'').trim(); }
      try{ await api(`/api/specialties/${encodeURIComponent(s)}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}); await load(); renderSpecialtiesModal(); }catch(e){ alert('Rename/update failed: '+e.message); }
    };
    delBtn.onclick = async ()=>{
      if(count===0){
        if(!confirm('Delete specialty '+s+'?')) return;
        try{ await api(`/api/specialties/${encodeURIComponent(s)}`, {method:'DELETE'}); await load(); renderSpecialtiesModal(); }catch(e){ alert('Delete failed: '+e.message); }
      }else{
        // Advanced delete/migrate flow
        const mode = prompt(`Specialty '${s}' is used by ${count} doctor(s). Type:\n  'delete' to delete ALL those doctors, OR\n  enter a target specialty name to MIGRATE them.\nLeave blank to cancel.`,'')
        if(!mode) return;
        if(mode.toLowerCase()==='delete'){
          if(!confirm(`Really delete specialty '${s}' and ALL its doctors? This cannot be undone.`)) return;
          try{ await api(`/api/specialties/${encodeURIComponent(s)}/advanced_delete`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mode:'delete_all'})}); await load(); renderSpecialtiesModal(); }
          catch(e){ alert('Advanced delete failed: '+e.message); }
        }else{
          const target = mode.trim();
            if(target===s) return alert('Target must differ from source');
            if(!confirm(`Migrate ${count} doctor(s) from '${s}' to '${target}' and remove '${s}'?`)) return;
            try{ await api(`/api/specialties/${encodeURIComponent(s)}/advanced_delete`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mode:'migrate', target})}); await load(); renderSpecialtiesModal(); }
            catch(e){ alert('Migration failed: '+e.message); }
        }
      }
    };
    li.appendChild(nameSpan); li.appendChild(upBtn); li.appendChild(downBtn); li.appendChild(editBtn); li.appendChild(delBtn);
    specListModal.appendChild(li);
  }
  // Drag & drop handlers
  let dragEl = null;
  specListModal.querySelectorAll('li[draggable]')?.forEach(li=>{
    li.addEventListener('dragstart', e=>{ dragEl = li; li.style.opacity='0.4'; e.dataTransfer.effectAllowed='move'; });
    li.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; dragEl=null; } });
    li.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; });
    li.addEventListener('drop', e=>{
      e.preventDefault(); if(!dragEl || dragEl===li) return;
      const rect = li.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      specListModal.insertBefore(dragEl, before? li : li.nextSibling);
      queueReorderSave();
    });
  });
}

let reorderSaveTimer = null;
function queueReorderSave(){
  if(reorderSaveTimer) clearTimeout(reorderSaveTimer);
  reorderSaveTimer = setTimeout(saveReorder, 600); // debounce
}
async function saveReorder(){
  const order = Array.from(specListModal.querySelectorAll('li')).map(li=> li.dataset.spec);
  try{
    await api('/api/specialties/reorder', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order})});
    // update local cache & re-render doctor list
    cache.specialty_order = order;
    renderList();
  }catch(e){ console.warn('Failed to save reorder', e); }
}

// Populate specialty filter dropdown and modal select
function ensureFilterOptions(){
  const curr = new Set(Array.from(filterSpec.options).map(o=>o.value));
  const seen = new Set();
  for(const s of cache.specialty_order){
    seen.add(s);
    if(!curr.has(s)){
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s; filterSpec.appendChild(opt);
    }
  }
  // Update specialty select in doctor modal
  if(specSelect){
    const sel = specSelect; const existing = new Set(Array.from(sel.options).map(o=>o.value));
    // Preserve current selection if possible
    const cur = sel.value;
    sel.innerHTML = '';
    cache.specialty_order.forEach(s=>{ const o = document.createElement('option'); o.value=s; o.textContent=s; sel.appendChild(o); });
    if(cur && Array.from(sel.options).some(o=>o.value===cur)) sel.value = cur;
  }
}

document.getElementById('refresh') && (document.getElementById('refresh').onclick = load);

async function api(path, options={}){
  options.headers = Object.assign({'Accept':'application/json'}, options.headers||{});
  if(window.token){
    // Add both header and query fallback for compatibility
    options.headers['X-Admin-Token'] = window.token;
    if(!path.includes('token=')){
      const join = path.includes('?') ? '&' : '?';
      path = path + join + 'token=' + encodeURIComponent(window.token);
    }
    // If JSON body, merge token field too (some endpoints may only inspect JSON)
    const ct = (options.headers['Content-Type']||options.headers['content-type']||'').toLowerCase();
    if(ct.includes('application/json') && typeof options.body === 'string'){
      try{
        const obj = JSON.parse(options.body);
        if(!obj.token) obj.token = window.token;
        options.body = JSON.stringify(obj);
      }catch{/* ignore parse errors */}
    }
  }
  const res = await fetch(path, options);
  if(!res.ok){ const t = await res.text().catch(()=> ''); throw new Error('Request failed: '+res.status+' '+t); }
  const ct = res.headers.get('content-type')||''; return ct.includes('application/json')? res.json() : res.text();
}

let cache = null;
async function load(){
  cache = await (await fetch('/api/doctors')).json();
  renderList();
  ensureFilterOptions();
}

function renderList(){
  const q = (searchEl?.value||'').toLowerCase();
  const spec = filterSpec?.value || '';
  if(!listEl) return;
  
  // Use DocumentFragment for batch DOM updates (much faster)
  const fragment = document.createDocumentFragment();

  // Group by specialty preserving specialty_order
  const bySpec = new Map();
  for(const s of cache.specialty_order){ bySpec.set(s, []); }
  for(const d of cache.doctors){
    if(q && !(`${d.name} ${d.specialty}`.toLowerCase().includes(q))) continue;
    if(spec && d.specialty !== spec) continue;
    if(!bySpec.has(d.specialty)) bySpec.set(d.specialty, []);
    bySpec.get(d.specialty).push(d);
  }

  // Render as vertical list rows inside each specialty (list-form)
  for(const [s, docs] of bySpec){
    if(!docs.length) continue;
    const section = document.createElement('div');
    section.className = 'spec-section';
    const heading = document.createElement('h3'); 
    heading.className='spec-heading'; 
    heading.textContent = s;
    section.appendChild(heading);
    const ul = document.createElement('ul'); ul.className='doc-rows';
    docs.sort((a,b)=> a.name.localeCompare(b.name)).forEach(d=>{
      const li = document.createElement('li'); li.className='doc-row'; li.dataset.id=d.id;
      li.innerHTML = `
        <button data-remove="${d.id}" class="doc-delete-btn" title="Delete doctor">✕</button>
        <div class="doc-row-content">
          <div class="nm">${d.name}</div>
          <div class="sub">${d.specialty}</div>
        </div>
        <div class="acts">
          <button data-edit="${d.id}" class="doc-edit-btn" title="Edit doctor details">Edit Doctor</button>
        </div>`;
      li.querySelector('[data-edit]').onclick = ()=> {
        fillForm(d);
        // Show doctor name in modal header for clarity
        openDoctorModal('Edit Doctor — ' + d.name);
      };
      li.querySelector('[data-remove]').onclick = ()=> {
        if(confirm(`Are you sure you want to remove ${d.name}?`)) {
          removeDoctor(d.id);
        }
      };
      ul.appendChild(li);
    });
    section.appendChild(ul);
    fragment.appendChild(section);
  }
  
  // Single DOM update - much faster than appending repeatedly
  listEl.innerHTML = '';
  listEl.appendChild(fragment);
}

async function quickStatus(id, status, reason){
  const dateIso = new Date().toISOString().slice(0,10);
  try{
    await api(`/api/doctors/${id}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({for_date: dateIso, status, status_reason: reason})});
    await load();
  }catch(e){ alert('Failed to set status: '+e.message); }
}

// Live search & specialty filter events with debouncing for smooth performance
let searchDebounceTimer = null;
if(searchEl){ 
  searchEl.addEventListener('input', ()=> {
    // Debounce search to avoid lag during rapid typing
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(()=> {
      requestAnimationFrame(()=> renderList());
    }, 150);
  }); 
}
if(filterSpec){ filterSpec.addEventListener('change', ()=> requestAnimationFrame(()=> renderList())); }

async function removeDoctor(id){
  if(!confirm('Remove this doctor?')) return;
  await api(`/api/doctors/${id}`, {method:'DELETE'});
  await load();
}

function parseOpdField(val){
  // Supports "08:30-11:00-10 pts" or simple "08:00-10:00"
  if(!val) return undefined;
  const parts = val.split(',').map(s=>s.trim()).filter(Boolean);
  const out = [];
  for(const p of parts){
    const m = p.match(/^(.*?)(?:\s*[-–—]\s*(\d{1,3})\s*(?:pts|patients?)\b)?$/i);
    const rng = m ? m[1].trim() : p;
    const cnt = m && m[2] ? Number(m[2]) : undefined;
    out.push(cnt ? { range: rng, count: cnt } : rng);
  }
  return out;
}

function fillForm(d){
  form.id.value = d.id;
  form.name.value = d.name;
  if(specSelect){ ensureFilterOptions(); specSelect.value = d.specialty || ''; }
  else { form.specialty.value = d.specialty; }
  form.notes.value = d.notes||'';
  form.designation.value = d.designation || '';
}

form && (form.onsubmit = async (e)=>{
  e.preventDefault();
  const id = form.id.value;
  const payload = {
    name: form.name.value,
    specialty: specSelect? specSelect.value : form.specialty.value,
    notes: form.notes.value,
    designation: form.designation.value || undefined,
  };

  if(id){
    await api(`/api/doctors/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  }else{
    await api('/api/doctors', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  }
  hideModal(doctorModal);
  await load();
});

resetBtn && (resetBtn.onclick = ()=>{ form.reset(); form.id.value=''; });

deleteBtn && (deleteBtn.onclick = async ()=>{
  const id = form.id.value; if(!id) return;
  if(!confirm('Delete this doctor?')) return;
  await api(`/api/doctors/${id}`, {method:'DELETE'});
  await load(); form.reset(); form.id.value=''; hideModal(doctorModal);
});

// Enhance photo input UX
const fileInput = document.getElementById('file-input');
const fileNameEl = document.getElementById('file-name');
if(fileInput && fileNameEl){
  fileInput.addEventListener('change', ()=>{
    const f = fileInput.files && fileInput.files[0];
    fileNameEl.textContent = f ? f.name : 'No file chosen';
  });
}

photoForm && (photoForm.onsubmit = async (e)=>{
  e.preventDefault();
  const id = form.id.value; if(!id) return alert('Select a doctor first');
  const fd = new FormData(photoForm);
  // Include token in body as well as header/query for maximum compatibility
  fd.append('token', token);
  const url = `/api/doctors/${id}/photo?token=${encodeURIComponent(token)}`;
  try{
    const res = await fetch(url, { method:'POST', headers:{ 'X-Admin-Token': token }, body: fd });
    if(!res.ok){
      const t = await res.text();
      alert('Upload failed: '+res.status+' '+t);
      return;
    }
    await res.json().catch(()=>({}));
    photoForm.reset();
    if(fileNameEl) fileNameEl.textContent = 'No file chosen';
    alert('Photo uploaded');
  }catch(err){
    alert('Upload error: '+err.message);
  }
});

// Promo image upload wiring
const promoForm = document.getElementById('promo-form');
const promoFileInput = document.getElementById('promo-file-input');
const promoFileName = document.getElementById('promo-file-name');
if(promoFileInput && promoFileName){
  promoFileInput.addEventListener('change', ()=>{
    const f = promoFileInput.files && promoFileInput.files[0];
    promoFileName.textContent = f ? f.name : 'No file chosen';
  });
}
promoForm && (promoForm.onsubmit = async (e)=>{
  e.preventDefault();
  const id = form?.id?.value;
  if(!id) return alert('Save doctor first');
  if(!promoFileInput?.files?.length) return alert('Choose an image');
  const fd = new FormData();
  fd.append('file', promoFileInput.files[0]);
  const token = window.token || '';
  const url = `/api/doctors/${id}/promo?token=${encodeURIComponent(token)}`;
  try{
    const res = await fetch(url, { method:'POST', headers:{ 'X-Admin-Token': token }, body: fd });
    if(!res.ok){
      const t = await res.text();
      alert('Promo upload failed: '+res.status+' '+t);
      return;
    }
    await res.json().catch(()=>({}));
    promoForm.reset();
    if(promoFileName) promoFileName.textContent = 'No file chosen';
    alert('Promotional poster uploaded');
  }catch(err){
    alert('Promo upload error: '+err.message);
  }
});

// Basic logo file-name indicator (media panel handles full preview)
if(logoFile && logoFileName){
  logoFile.addEventListener('change', ()=>{
    const f = logoFile.files && logoFile.files[0];
    logoFileName.textContent = f ? f.name : 'No file chosen';
  });
}

if(openScheduleUpload && scheduleUploadModal){
  openScheduleUpload.onclick = ()=>{ bulkUploadResult && (bulkUploadResult.textContent=''); showModal(scheduleUploadModal); };
  scheduleUploadModal.addEventListener('click', e=>{ if(e.target.hasAttribute('data-close')) hideModal(scheduleUploadModal); });
}
// Generate range-based template link
if(genTemplateBtn){
  genTemplateBtn.addEventListener('click', ()=>{
    const s = tmplStart?.value; const e = tmplEnd?.value;
    if(!s || !e) { alert('Select start and end dates'); return; }
    if(e < s){ alert('End date must be after start date'); return; }
    // Build URL
  const grouped = tmplGrouped && tmplGrouped.checked ? '&group=1' : '';
  const url = `/api/schedule/template.xlsx?start=${encodeURIComponent(s)}&end=${encodeURIComponent(e)}${grouped}`;
    if(downloadRangeTemplate){
      downloadRangeTemplate.href = url;
      downloadRangeTemplate.style.display='inline-block';
      // Do NOT auto-trigger download; require explicit user click to avoid double downloads
      // Provide a quick visual cue by updating label briefly
      try{
        downloadRangeTemplate.textContent = '⬇ Download Template';
      }catch{}
    } else {
      window.open(url, '_blank');
    }
  });
}

// Guard against accidental double-download by disabling the link briefly after click
if(downloadRangeTemplate){
  downloadRangeTemplate.addEventListener('click', (e)=>{
    if(downloadRangeTemplate.dataset.downloading === '1'){
      // Already downloading, block rapid second click
      e.preventDefault();
      return;
    }
    // Mark as downloading and temporarily disable pointer events
    downloadRangeTemplate.dataset.downloading = '1';
    const prevText = downloadRangeTemplate.textContent;
    downloadRangeTemplate.textContent = '⬇ Downloading…';
    downloadRangeTemplate.style.pointerEvents = 'none';
    setTimeout(()=>{
      downloadRangeTemplate.dataset.downloading = '0';
      downloadRangeTemplate.textContent = prevText || '⬇ Download Template';
      downloadRangeTemplate.style.pointerEvents = '';
    }, 2500);
  });
}

// Improve visibility of date inputs if present
function enhanceDateInputs(){
  [tmplStart, tmplEnd].forEach(inp=>{
    if(!inp) return;
    inp.style.padding='8px 10px';
    inp.style.fontSize='13px';
    inp.style.height='38px';
    inp.style.border='1px solid var(--border)';
    inp.style.borderRadius='8px';
    inp.style.background='var(--panel)';
  });
}
enhanceDateInputs();

// ==================== NEW 2-STAGE EXCEL UPLOAD SYSTEM ====================
// Stage 1: Upload Excel files
const uploadExcelForm = document.getElementById('uploadExcelForm');
const uploadExcelMsg = document.getElementById('uploadExcelMsg');
const uploadedFileSelect = document.getElementById('uploadedFileSelect');
const uploadedFilesList = document.getElementById('uploadedFilesList');
const refreshFileListBtn = document.getElementById('refreshFileListBtn');
// File explorer controls
const filesPathLabel = document.getElementById('filesPathLabel');
const filesUpBtn = document.getElementById('filesUpBtn');
const filesNewFolderBtn = document.getElementById('filesNewFolderBtn');
let currentSchedPath = '';
const previewFileBtn = document.getElementById('previewFileBtn');
const previewSection = document.getElementById('previewSection');
const previewStats = document.getElementById('previewStats');
const cancelProcessBtn = document.getElementById('cancelProcessBtn');
const confirmProcessBtn = document.getElementById('confirmProcessBtn');
const openTemplateGen = document.getElementById('openTemplateGen');
const templateGenModal = document.getElementById('templateGenModal');

// Template Generator button
if(openTemplateGen && templateGenModal){
  openTemplateGen.onclick = ()=> showModal(templateGenModal);
  templateGenModal.addEventListener('click', e=>{ if(e.target.hasAttribute('data-close')) hideModal(templateGenModal); });
}

// Stage 1: Upload form
if(scheduleFile && scheduleFileName){
  scheduleFile.addEventListener('change', ()=>{
    const f = scheduleFile.files && scheduleFile.files[0];
    scheduleFileName.textContent = f? f.name : 'No file chosen';
  });
}

if(uploadExcelForm){
  uploadExcelForm.onsubmit = async e=>{
    e.preventDefault();
    if(!scheduleFile.files?.length){
      uploadExcelMsg.textContent = 'Please choose a file first';
      uploadExcelMsg.style.color = 'red';
      return;
    }
    const fd = new FormData();
    fd.append('file', scheduleFile.files[0]);
    uploadExcelMsg.textContent = 'Uploading...';
    uploadExcelMsg.style.color = 'var(--muted)';
    try{
      const r = await fetch('/api/schedule/store_excel?path=' + encodeURIComponent(currentSchedPath||''), {method:'POST', body: fd});
      const j = await r.json();
      if(!r.ok || !j.ok){
        throw new Error(j.error || 'Upload failed');
      }
      uploadExcelMsg.textContent = '✓ ' + (j.message || 'File uploaded successfully!');
      uploadExcelMsg.style.color = '#10b981';
      scheduleFile.value = '';
      scheduleFileName.textContent = 'No file chosen';
      // Refresh file list after a brief delay to ensure file is written
      setTimeout(() => {
        if(refreshFileListBtn) refreshFileListBtn.click();
      }, 300);
    }catch(err){
      uploadExcelMsg.textContent = '✖ ' + err.message;
      uploadExcelMsg.style.color = 'red';
    }
  };
}

// Stage 2: Load file list
function setFilesPathLabel(){
  if(filesPathLabel){ filesPathLabel.textContent = '/' + (currentSchedPath||''); if(filesPathLabel.textContent==='//') filesPathLabel.textContent='/'; }
}

function upOne(){
  if(!currentSchedPath) return;
  const parts = currentSchedPath.split('/').filter(Boolean);
  parts.pop();
  currentSchedPath = parts.join('/');
  setFilesPathLabel();
  loadUploadedFiles();
}

filesUpBtn && (filesUpBtn.onclick = upOne);
filesNewFolderBtn && (filesNewFolderBtn.onclick = async ()=>{
  const name = prompt('New folder name');
  if(!name) return;
  let rel = (currentSchedPath? currentSchedPath + '/' : '') + name.replace(/\\/g,'/');
  try{
    const r = await fetch('/api/files/mkdir', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({path: rel})});
    const j = await r.json(); if(!r.ok || !j.ok) throw new Error(j.error||'Failed');
    loadUploadedFiles();
  }catch(e){ alert('Create folder failed: '+e.message); }
});

async function loadUploadedFiles(){
  if(!uploadedFileSelect) return;
  uploadedFileSelect.innerHTML = '<option value="">-- Select a file --</option>';
  try{
    // Use new explorer API
    const r = await fetch('/api/files/list?path=' + encodeURIComponent(currentSchedPath||''));
    const j = await r.json();
    if(!r.ok || !j.ok) throw new Error(j.error||'Load failed');
    setFilesPathLabel();
    // Rebuild header
    if(uploadedFilesList){
      uploadedFilesList.innerHTML = '';
      const headers = [ {txt:'Name'}, {txt:'Type'}, {txt:'Size'}, {txt:'Modified'}, {txt:'Actions', align:'right'} ];
      headers.forEach(h=>{ const d=document.createElement('div'); d.style.fontSize='12px'; d.style.color='var(--muted)'; d.style.fontWeight='700'; if(h.align==='right') d.style.textAlign='right'; d.textContent=h.txt; uploadedFilesList.appendChild(d); });
    }
    // Populate dropdown with only Excel files from current folder
    const r2 = await fetch('/api/schedule/list_excel?path=' + encodeURIComponent(currentSchedPath||''));
    const j2 = await r2.json();
    if(j2.ok && j2.files){
      j2.files.forEach(file=>{
        const opt = document.createElement('option');
        const rel = (currentSchedPath? currentSchedPath + '/' : '') + file.filename;
        opt.value = rel;
        opt.textContent = `${rel} (${file.uploaded_at}, ${file.size_kb} KB)`;
        uploadedFileSelect.appendChild(opt);
      });
    }
    // Render items
    if(uploadedFilesList){
      (j.items||[]).forEach(it=>{
        const nameCell = document.createElement('div');
        nameCell.style.whiteSpace='nowrap'; nameCell.style.overflow='hidden'; nameCell.style.textOverflow='ellipsis';
        nameCell.title = it.name;
        nameCell.textContent = it.name;
        if(it.type==='dir'){
          nameCell.style.cursor='pointer';
          nameCell.onclick = ()=>{ currentSchedPath = (currentSchedPath? currentSchedPath + '/' : '') + it.name; loadUploadedFiles(); };
        }
        uploadedFilesList.appendChild(nameCell);
        const typeCell = document.createElement('div'); typeCell.textContent = it.type; uploadedFilesList.appendChild(typeCell);
        const sizeCell = document.createElement('div'); sizeCell.textContent = it.type==='file' ? (Math.round((it.size||0)/1024*100)/100)+' KB' : ''; uploadedFilesList.appendChild(sizeCell);
        const modCell = document.createElement('div'); try{ const d=new Date(it.modified*1000); modCell.textContent = isNaN(d.getTime())?'':d.toISOString().slice(0,16).replace('T',' ');}catch{modCell.textContent='';} uploadedFilesList.appendChild(modCell);
        const actionsDiv = document.createElement('div'); actionsDiv.style.display='flex'; actionsDiv.style.gap='8px'; actionsDiv.style.justifyContent='flex-end';
        if(it.type==='dir'){
          const openBtn = document.createElement('button'); openBtn.textContent='Open'; openBtn.onclick=()=>{ currentSchedPath = (currentSchedPath? currentSchedPath + '/' : '') + it.name; loadUploadedFiles(); };
          const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.onclick=async()=>{ if(!confirm('Delete folder '+it.name+'?')) return; const rel=(currentSchedPath? currentSchedPath + '/' : '') + it.name; const dr=await fetch('/api/files/delete',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({path: rel, recursive:true})}); const dj=await dr.json(); if(!dr.ok || !dj.ok) return alert(dj.error||'Delete failed'); loadUploadedFiles(); };
          actionsDiv.append(openBtn, delBtn);
        } else {
          const rel = (currentSchedPath? currentSchedPath + '/' : '') + it.name;
          const btnSelect = document.createElement('button'); btnSelect.textContent='Select'; btnSelect.onclick=()=>{ uploadedFileSelect.value = rel; };
          const btnPreview = document.createElement('button'); btnPreview.textContent='Preview'; btnPreview.onclick=()=>{ uploadedFileSelect.value = rel; if(previewFileBtn) previewFileBtn.click(); };
          const btnDownload = document.createElement('button'); btnDownload.textContent='Download'; btnDownload.onclick=()=>{ window.open('/api/files/download?path=' + encodeURIComponent(rel), '_blank'); };
          const btnDelete = document.createElement('button'); btnDelete.textContent='Delete'; btnDelete.onclick=async()=>{ if(!confirm('Delete '+it.name+'?')) return; const dr=await fetch('/api/schedule/delete_excel', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({filename: rel})}); const dj=await dr.json(); if(!dr.ok || !dj.ok) return alert(dj.error||'Delete failed'); loadUploadedFiles(); };
          actionsDiv.append(btnSelect, btnPreview, btnDownload, btnDelete);
        }
        uploadedFilesList.appendChild(actionsDiv);
      });
    }
  }catch(err){
    console.error('Failed to load file list:', err);
  }
}

if(refreshFileListBtn){
  refreshFileListBtn.onclick = ()=> loadUploadedFiles();
}

// Preview button
if(previewFileBtn){
  previewFileBtn.onclick = async ()=>{
    const filename = uploadedFileSelect.value;
    if(!filename){
      alert('Please select a file first');
      return;
    }
    previewStats.innerHTML = '<div style="text-align:center;padding:20px">Loading preview...</div>';
    previewSection.style.display = 'block';
    try{
      const r = await fetch('/api/schedule/preview_excel', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({filename})
      });
      const j = await r.json();
      if(!r.ok || !j.ok){
        throw new Error(j.error || 'Preview failed');
      }
      // Display statistics
      let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">
          <div style="background:rgba(16,185,129,0.1);border:2px solid rgba(16,185,129,0.3);border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:var(--primary)">${j.total_schedules}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px">Total Schedules</div>
          </div>
          <div style="background:rgba(59,130,246,0.1);border:2px solid rgba(59,130,246,0.3);border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#3b82f6">${j.unique_doctors}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px">Unique Doctors</div>
          </div>
          <div style="background:rgba(168,85,247,0.1);border:2px solid rgba(168,85,247,0.3);border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#a855f7">${j.dates_count}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px">Date Range Days</div>
          </div>
        </div>
        <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:14px;margin-bottom:20px">
          <strong style="color:var(--primary)">📅 Date Range:</strong> <span style="color:var(--text);font-weight:700">${j.date_range}</span>
        </div>
      `;
      // Doctor coverage matrix (show all doctors and state per date)
      if(j.doctor_matrix && j.doctor_matrix.length && j.dates && j.dates.length){
        const fmt = d=>{ try{ const [y,m,dd]=d.split('-'); return `${dd}/${m}`;}catch{return d;} };
        const stateChip = (s)=>{
          const map={ADDED:'#16a34a',OFF:'#64748b',EMPTY:'#f59e0b',MISSING:'#ef4444'};
          const bg = map[s]||'#94a3b8';
          const fg = '#fff';
          const label = s;
          return `<span style="display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:800;background:${bg};color:${fg}">${label}</span>`;
        };
        html += `
          <div style="margin-top:18px">
            <h4 style="margin:0 0 8px;font-size:15px;font-weight:900;color:var(--text)">👨‍⚕️ Coverage by Doctor and Date</h4>
            <div style="overflow:auto;max-height:420px;border:1px solid rgba(0,0,0,0.08);border-radius:10px">
              <table style="width:max(600px,100%);border-collapse:collapse;font-size:12px">
                <thead>
                  <tr style="background:rgba(0,0,0,0.04);position:sticky;top:0">
                    <th style="text-align:left;padding:8px 10px">Doctor</th>
                    ${j.dates.map(d=>`<th style=\"padding:8px 6px;text-align:center\">${fmt(d)}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${j.doctor_matrix.map(row=>`
                    <tr style="border-top:1px solid rgba(0,0,0,0.06)">
                      <td style="padding:8px 10px;font-weight:700;white-space:nowrap">${row.name}</td>
                      ${row.states.map(st=>`<td style=\"padding:6px 6px;text-align:center\">${stateChip(st)}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--muted)">Legend: <b style="color:#16a34a">Added</b>, <b style="color:#64748b">Off</b>, <b style="color:#f59e0b">Empty row</b>, <b style="color:#ef4444">Missing</b></div>
          </div>`;
      }
      if(j.doctor_breakdown && j.doctor_breakdown.length){
        html += `
          <div style="margin-top:16px">
            <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text)">👨‍⚕️ Schedule Breakdown by Doctor:</h4>
            <div style="max-height:300px;overflow-y:auto;background:rgba(0,0,0,0.1);border-radius:10px;padding:12px">
              <table style="width:100%;font-size:13px;border-collapse:collapse">
                <thead>
                  <tr style="background:rgba(16,185,129,0.15);text-align:left">
                    <th style="padding:8px;font-weight:800">Doctor Name</th>
                    <th style="padding:8px;font-weight:800;text-align:right">Schedules</th>
                  </tr>
                </thead>
                <tbody>
                  ${j.doctor_breakdown.map(d=>`
                    <tr style="border-bottom:1px solid rgba(16,185,129,0.1)">
                      <td style="padding:8px">${d.doctor}</td>
                      <td style="padding:8px;text-align:right;font-weight:700">${d.schedules}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      previewStats.innerHTML = html;
    }catch(err){
      previewStats.innerHTML = `<div style="color:red;padding:20px;text-align:center">✖ ${err.message}</div>`;
    }
  };
}

// Cancel button
if(cancelProcessBtn){
  cancelProcessBtn.onclick = ()=>{
    previewSection.style.display = 'none';
    previewStats.innerHTML = '';
  };
}

// Confirm & Apply button
if(confirmProcessBtn){
  confirmProcessBtn.onclick = async ()=>{
    const filename = uploadedFileSelect.value;
    if(!filename){
      alert('No file selected');
      return;
    }
    if(!confirm('⚠️ Are you sure you want to apply these schedules to the database? This will update doctor schedules for the dates in the file.')){
      return;
    }
    previewStats.innerHTML = '<div style="text-align:center;padding:20px;font-size:16px;font-weight:700;color:var(--primary)">⏳ Processing schedules...</div>';
    confirmProcessBtn.disabled = true;
    try{
      const r = await fetch('/api/schedule/apply_excel', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({filename})
      });
      const j = await r.json();
      if(!r.ok || !j.ok){
        throw new Error(j.error || 'Failed to apply schedules');
      }
      let resultHtml = `
        <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,232,158,0.1));border:3px solid #10b981;border-radius:16px;padding:24px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">✅</div>
          <div style="font-size:20px;font-weight:900;color:var(--primary);margin-bottom:8px">Success!</div>
          <div style="font-size:16px;color:var(--text)">${j.message || `Applied ${j.applied} schedules`}</div>
        </div>
      `;
      if(j.errors && j.errors.length){
        resultHtml += `
          <div style="margin-top:16px;background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px">
            <strong style="color:#ef4444">${j.errors.length} issue(s):</strong>
            <ul style="margin:8px 0 0 20px;font-size:12px;color:var(--text)">
              ${j.errors.slice(0,10).map(e=>`<li>${e}</li>`).join('')}
              ${j.errors.length>10?`<li style="font-style:italic">... and ${j.errors.length-10} more</li>`:''}
            </ul>
          </div>
        `;
      }
      previewStats.innerHTML = resultHtml;
      // Refresh data
      setTimeout(()=>{
        previewSection.style.display = 'none';
        uploadedFileSelect.value = '';
        load();
        loadScheduleEditor();
        loadScheduleWindow();
      }, 3000);
    }catch(err){
      previewStats.innerHTML = `<div style="color:red;padding:20px;text-align:center;font-size:16px;font-weight:700">✖ ${err.message}</div>`;
    }finally{
      confirmProcessBtn.disabled = false;
    }
  };
}

// Load file list on page load
loadUploadedFiles();

// Template generation form still uses old modal - keep for backward compatibility
if(scheduleUploadForm){
  scheduleUploadForm.onsubmit = async e=>{
    e.preventDefault();
    if(!scheduleFile.files?.length) return alert('Choose a .xlsx file first');
    const fd = new FormData(); fd.append('file', scheduleFile.files[0]);
    bulkUploadResult.textContent = 'Uploading…';
    try{
      const r = await fetch('/api/schedule/bulk_excel', {method:'POST', body: fd});
      const j = await r.json().catch(()=>({}));
      if(!r.ok || !j.ok){ throw new Error(j.error || ('Upload failed '+r.status)); }
      const applied = j.applied || 0;
      const errs = j.errors || [];
      bulkUploadResult.innerHTML = `<div style="color:#16c784;font-weight:600">Applied ${applied} change(s)</div>` + (errs.length? `<div style="margin-top:8px;color:#ffab40">${errs.length} issue(s):<ul style=\"margin:4px 0 0 18px;font-size:11px\">${errs.slice(0,25).map(e=>`<li>Row ${e.row||'?'}: ${e.error||'error'} ${e.doctor?'- '+e.doctor:''}</li>`).join('')}</ul>${errs.length>25?'<div style=\"margin-top:4px\">(More omitted)</div>':''}</div>`:'' );
      // Refresh caches/UI
      try{ await load(); loadScheduleEditor(); loadScheduleWindow(); }catch{}
      brokerFlash('doctors_updated');
    }catch(err){ bulkUploadResult.innerHTML = `<div style="color:#e74c3c;font-weight:600">${err.message}</div>`; }
  };
}
function brokerFlash(evt){ /* lightweight visual cue could be added later */ }

// Load schedule window (multi-day snapshot) implementation
async function loadScheduleWindow(){
  if(!scheduleList) return;
  scheduleList.textContent = 'Loading…';
  try{
    const start = new Date().toISOString().slice(0,10);
    const days = 14;
    const win = await fetch(`/api/window?start=${start}&days=${days}`, {cache:'no-store'}).then(r=>r.json());
    const windowArr = win.window || win;
    // Fetch closures to annotate
    let closures = {};
    try{ const c = await fetch('/api/closures').then(r=>r.json()); closures = c.dates||c||{}; }catch{}
    const frag = document.createDocumentFragment();
    windowArr.forEach(day => {
      const iso = day.date;
      const closed = !!closures[iso];
      // Build specialty summary counts (ON_DUTY) and total
      const bySpec = {};
      (day.doctors||[]).forEach(d=>{
        const spec = d.specialty || 'General';
        if(!bySpec[spec]) bySpec[spec] = {total:0,on:0};
        bySpec[spec].total++;
        if(d.status==='ON_DUTY') bySpec[spec].on++;
      });
      const specSummary = Object.entries(bySpec).sort((a,b)=>a[0].localeCompare(b[0]))
        .map(([s,v])=>`${s}: ${v.on}/${v.total}`).join(' • ');
      const div = document.createElement('div');
      div.className = 'schedule-day';
      div.innerHTML = `
        <div class="day-head">
          <span>${iso}</span>
          ${closed?'<span class="badge-pill" style="background:#5e1d1d;color:#ffcece">CLOSED</span>':''}
          <span class="count">${(day.doctors||[]).length} doctor(s)</span>
        </div>
        <div class="spec-summary">${specSummary||'No doctors listed'}</div>
        <details>
          <summary style="cursor:pointer">View list</summary>
          <div class="mini-list"></div>
        </details>`;
      const list = div.querySelector('.mini-list');
      (day.doctors||[]).slice().sort((a,b)=> (a.specialty||'').localeCompare(b.specialty||'') || a.name.localeCompare(b.name)).forEach(d=>{
        const row = document.createElement('div');
        row.className = 'mini-row';
        row.innerHTML = `<span class="nm">${d.name}</span><span>${d.specialty||''}</span><span class="st ${d.status}">${d.status||''}</span>` +
          (d.patient_count!=null?`<span>#${d.patient_count}</span>`:'') + (d.room?`<span>Rm ${d.room}</span>`:'');
        list.appendChild(row);
      });
      frag.appendChild(div);
    });
    scheduleList.innerHTML=''; scheduleList.appendChild(frag);
  }catch(e){ scheduleList.textContent = 'Failed to load window: '+e.message; }
}

// Minor CSS hook classes injection (if CSS not yet updated)
const styleHook = document.createElement('style');
styleHook.textContent = `.schedule-day{border:1px solid var(--border);padding:8px 10px;margin:8px 0;border-radius:10px;background:var(--panel)}
.schedule-day .day-head{display:flex;gap:10px;align-items:center;font-size:14px;margin-bottom:4px}
.schedule-day .day-head .count{margin-left:auto;opacity:.7;font-size:12px}
.schedule-day .spec-summary{font-size:12px;color:var(--muted);margin-bottom:6px}
.schedule-day details{background:var(--card);padding:6px 8px;border-radius:8px}
.schedule-day .mini-row{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;padding:2px 0;border-bottom:1px dotted var(--border)}
.schedule-day .mini-row:last-child{border-bottom:none}
.schedule-day .mini-row .nm{font-weight:600}
.schedule-day .mini-row .st{font-weight:700}
.schedule-day .mini-row .st.OFF_DUTY{color:#d66}
.schedule.day .mini-row .st.ON_DUTY{color:#4bb543}
.schedule-day .mini-row .st.LEAVE,.schedule-day .mini-row .st.SICK{color:#ff9800}
.schedule-day .mini-row .st.ON_CALL{color:#00bcd4}`;
try{ document.head.appendChild(styleHook); }catch{}

// Subscribe to live updates via SSE (with polling fallback)
let pollTimer = null;
function startPolling(){
  if(pollTimer) return;
  pollTimer = setInterval(()=>{
    fetch('/api/doctors', {cache:'no-store'}).then(r=>r.json()).then(r=>{ cache=r; renderList(); ensureFilterOptions(); }).catch(()=>{});
  }, 5000);
}
// ======= Bulk clear/set status tools =======
const clrDate = document.getElementById('clearStatusDate');
const clr14 = document.getElementById('clearStatus14');
const clrSetBtn = document.getElementById('clearStatusSetBtn');
const clrRemoveBtn = document.getElementById('clearStatusRemoveBtn');
const clrMsg = document.getElementById('clearStatusMsg');

if(clrDate && !clrDate.value){ clrDate.value = isoToday(); }

async function callClearAPI(payload){
  if(!clrMsg) return;
  clrMsg.textContent = 'Working…';
  clrMsg.style.color = '#3b82f6';
  try{
    const r = await api('/api/schedule/clear_status', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const j = r || {};
    if(j.ok === false){ throw new Error(j.error || 'Request failed'); }
    clrMsg.textContent = `✓ Done: ${j.changed} change(s) affected`;
    clrMsg.style.color = '#10b981';
    // Refresh schedule views
    setTimeout(async ()=>{
      try{ await load(); }catch{}
      try{ await loadScheduleEditor(); }catch{}
      try{ await loadScheduleWindow(); }catch{}
    }, 100);
  }catch(e){ 
    clrMsg.textContent = '✖ Error: '+e.message;
    clrMsg.style.color = '#ef4444';
  }
}

if(clrSetBtn){
  clrSetBtn.onclick = async (e)=>{
    e.preventDefault();
    e.stopPropagation();
    const forWindow = !!clr14?.checked;
    const dateVal = clrDate?.value || isoToday();
    const base = { action:'set', set:'OFF_DUTY' };
    if(forWindow){ 
      base.start = dateVal; 
      base.days = 14; 
    } else { 
      base.date = dateVal; 
    }
    
    const msg = forWindow 
      ? `⚠️ SET OFF_DUTY FOR ALL DOCTORS\n\nThis will mark ALL doctors as OFF_DUTY for the next 14 days starting from ${dateVal}.\n\n⚠️ WARNING: This will override any existing schedules!\n\nAre you absolutely sure you want to continue?`
      : `⚠️ SET OFF_DUTY FOR ALL DOCTORS\n\nThis will mark ALL doctors as OFF_DUTY on ${dateVal}.\n\n⚠️ WARNING: This will override existing schedules for that day!\n\nAre you sure you want to continue?`;
    
    if(confirm(msg)){
      await callClearAPI(base);
    }
  };
}

if(clrRemoveBtn){
  clrRemoveBtn.onclick = async (e)=>{
    e.preventDefault();
    e.stopPropagation();
    const forWindow = !!clr14?.checked;
    const dateVal = clrDate?.value || isoToday();
    const base = { action:'remove' };
    if(forWindow){ 
      base.start = dateVal; 
      base.days = 14; 
    } else { 
      base.date = dateVal; 
    }
    
    const msg = forWindow 
      ? `⚠️ REMOVE ALL SCHEDULE OVERRIDES\n\nThis will DELETE all per-date schedule entries for the next 14 days starting from ${dateVal}.\n\n⚠️ WARNING: All custom schedules, statuses, room assignments, and patient counts will be permanently removed!\n\nAre you absolutely sure you want to continue?`
      : `⚠️ REMOVE ALL SCHEDULE OVERRIDES\n\nThis will DELETE all per-date schedule entries on ${dateVal}.\n\n⚠️ WARNING: All custom schedules for that day will be permanently removed!\n\nAre you sure you want to continue?`;
    
    if(confirm(msg)){
      await callClearAPI(base);
    }
  };
}

try{
  const es = new EventSource('/events');
  es.addEventListener('doctors_updated', e=>{ try{ cache = JSON.parse(e.data); renderList(); ensureFilterOptions(); }catch{} });
  es.addEventListener('specialty_order_updated', e=>{ try{ const d=JSON.parse(e.data); if(Array.isArray(d.order)){ cache.specialty_order=d.order; renderList(); ensureFilterOptions(); } }catch{} });
  // Listen for branding updates to refresh logo preview
  es.addEventListener('branding_updated', e=>{ try{ const d = JSON.parse(e.data); const v = d.logo_version || (Date.now()/1000|0); if(logoPreviewImgGlobal){ const u = new URL(logoPreviewImgGlobal.src||'/static/img/hulhumale-logo.png', location.origin); u.searchParams.set('v', v); logoPreviewImgGlobal.src = u.href; } if(brandLogoSmall){ fetch('/api/branding').then(r=>r.json()).then(x=>{ if(x.logo){ brandLogoSmall.src = x.logo + '?t=' + Date.now(); brandLogoSmall.style.display='block'; } }); } }catch{} });
  es.onerror = ()=>{ if(tglogEl){ tglogEl.textContent = (tglogEl.textContent||'') + "\n[SSE] connection error. Falling back to polling…"; } startPolling(); };
}catch{
  startPolling();
}

// Telegram log polling (also feeds modal)
async function refreshLog(toModal=false){
  try{
    const txt = await (await fetch('/debug/telegram_status', {cache:'no-store'})).text();
    if(tglogEl){ tglogEl.textContent = txt || 'No data'; tglogEl.scrollTop = tglogEl.scrollHeight; }
    if(toModal && logModalBody){ logModalBody.textContent = txt || 'No data'; logModalBody.scrollTop = logModalBody.scrollHeight; }
  }catch{}
}
if(document.getElementById('tglog')){
  refreshLog();
  setInterval(()=>refreshLog(logModal && logModal.style.display!=='none'), 5000);
}

load();

openHolidayModal && (openHolidayModal.onclick=()=>{ holidaySelection = new Set(); showModal(holidayModal); loadClosures(); });
holidayModal && holidayModal.addEventListener('click', e=>{ if(e.target.hasAttribute('data-close')) hideModal(holidayModal); });
holidaySaveBtn && (holidaySaveBtn.onclick=async()=>{
  const selected = Array.from(holidaySelection);
  if(!selected.length) return alert('Select at least one date');
  const reason = (holidayReason.value||'TODAY IS A OPD CLOSED DAY').trim();
  try{ 
    await api('/api/closures',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({dates: selected, reason})}); 
    // Clear selection after save
    holidaySelection.clear();
    hideModal(holidayModal); holidayReason.value=''; loadClosures(); 
  }
  catch(e){ alert('Failed: '+e.message); }
});
bulkReopenBtn && (bulkReopenBtn.onclick=async()=>{
  const toReopen = Array.from(holidayList.querySelectorAll('li input[type="checkbox"]:checked')).map(cb=>cb.value);
  if(!toReopen.length) return alert('Select closed days via checkboxes first');
  if(!confirm('Reopen selected '+toReopen.length+' day(s)?')) return;
  try{ await api('/api/closures',{method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({dates: toReopen})}); loadClosures(); }
  catch(e){ alert('Bulk reopen failed: '+e.message); }
});
bulkAddBtn && (bulkAddBtn.onclick=()=>{ showModal(holidayModal); loadClosures(); });

// Quick closed-day accumulate logic
if(quickClosedForm){
  quickClosedForm.addEventListener('submit', e=>{
    e.preventDefault();
    const iso = quickClosedDate?.value; const rsn = (quickClosedReason?.value||'OPD CLOSED DAY').trim();
    if(!iso){ quickClosedStatus.textContent='Pick a date'; return; }
    if(pendingClosedDates.find(x=>x.date===iso)) { quickClosedStatus.textContent='Already added'; return; }
    pendingClosedDates.push({date:iso, reason: rsn});
    renderQuickClosedList(); quickClosedDate.value=''; quickClosedStatus.textContent='Added';
  });
  quickClosedApply && quickClosedApply.addEventListener('click', async ()=>{
    if(!pendingClosedDates.length){ quickClosedStatus.textContent='Nothing to save'; return; }
    console.log('[QUICK ADD DEBUG] Pending dates to save:', JSON.parse(JSON.stringify(pendingClosedDates)));
    quickClosedStatus.textContent='Saving…';
    try{
      // Group by reason
      const groups = {};
      pendingClosedDates.forEach(r=>{ (groups[r.reason] = groups[r.reason]||[]).push(r.date); });
      console.log('[QUICK ADD DEBUG] Grouped by reason:', groups);
      for(const [reason, dates] of Object.entries(groups)){
        console.log('[QUICK ADD DEBUG] Sending to API:', {dates, reason});
        await api('/api/closures',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({dates, reason})});
      }
      pendingClosedDates = []; renderQuickClosedList(); quickClosedStatus.textContent='Saved';
      loadClosures();
    }catch(err){ quickClosedStatus.textContent='Error: '+err.message; console.error('[QUICK ADD DEBUG] Error:', err); }
  });
}

function renderQuickClosedList(){
  if(!quickClosedList) return;
  quickClosedList.innerHTML = pendingClosedDates.map((r,i)=>`<span class="chip" style="background:#0d3347">${r.date}<button data-x='${i}' style='margin-left:6px;background:none;border:none;color:#ffb4b4;cursor:pointer' title='Remove'>&times;</button></span>`).join('');
  quickClosedList.querySelectorAll('button[data-x]').forEach(btn=> btn.addEventListener('click', ()=>{ const idx = Number(btn.dataset.x); pendingClosedDates.splice(idx,1); renderQuickClosedList(); }));
}

async function loadClosures(){
  try{
    const r = await api('/api/closures');
    const dates = r.dates||{};
    // Only show today and future dates
    const todayIso = new Date().toISOString().slice(0,10);
    const keys = Object.keys(dates).filter(k=>k>=todayIso).sort();
    if(holidayList){
      holidayList.innerHTML='';
      if(!keys.length){ holidayList.innerHTML='<li class="muted">No closed days</li>'; }
      keys.forEach(k=>{
        const li=document.createElement('li'); li.className='holiday-row';
        const reason = dates[k].reason||''; const btn=document.createElement('button'); btn.textContent='Reopen';
        btn.onclick=async()=>{ if(!confirm('Reopen '+k+'?')) return; try{ await api('/api/closures/'+k,{method:'DELETE'}); loadClosures(); }catch(e){ alert('Reopen failed: '+e.message);} };
        const cb = document.createElement('input'); cb.type='checkbox'; cb.value=k; cb.style.marginRight='6px';
        li.appendChild(cb); li.innerHTML += `<span class="date">${k}</span><span class="rsn">${reason}</span>`; li.appendChild(btn); holidayList.appendChild(li);
      });
    }
    renderHolidayPicker(keys, dates);
  }catch(e){ if(holidayList) holidayList.innerHTML='<li class="error">Failed to load</li>'; }
}
function renderHolidayPicker(closedKeys=[], datesObj={}){
  if(!dayPickerGrid) return;
  dayPickerGrid.innerHTML='';
  
  // Get today's date at midnight local time to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for(let i=0;i<60;i++){
    // Create date by adding days properly
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    // Format as ISO string manually to avoid timezone conversion
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    
    // Get correct day name using getDay() which returns 0-6 (Sunday-Saturday)
    const dayIndex = d.getDay();
    const dayName = dayNames[dayIndex];
    
    // Check if Friday (getDay() === 5)
    const isFriday = dayIndex === 5;
    
    // Format date as DD/MM/YYYY
    const formattedDate = `${day}/${month}/${year}`;
    
    const btn = document.createElement('button');
    btn.type='button';
    btn.className='day-btn';
    btn.dataset.iso=iso;
    
    // Friday styling and locking
    if(isFriday){
      btn.classList.add('friday-locked');
      btn.disabled = true;
      btn.title = 'Fridays are automatically closed';
      btn.innerHTML = `<div class="btn-date">${formattedDate}</div><div class="btn-day">${dayName}</div><div class="friday-badge">🕌 Auto-Closed</div>`;
    } else {
      // Create inner HTML with date and day name
      btn.innerHTML = `<div class="btn-date">${formattedDate}</div><div class="btn-day">${dayName}</div>`;
      
      if(closedKeys.includes(iso)) btn.classList.add('closed');
      // Reflect current selection state from Set
      if(holidaySelection.has(iso)) btn.classList.add('selected');
      btn.addEventListener('click', ()=>{
        if(holidaySelection.has(iso)){
          holidaySelection.delete(iso);
          btn.classList.remove('selected');
        } else {
          holidaySelection.add(iso);
          btn.classList.add('selected');
        }
        btn.classList.add('pulse');
        setTimeout(()=> btn.classList.remove('pulse'), 380);
      });
    }
    
    dayPickerGrid.appendChild(btn);
  }
}

// --- Per-Date Schedule Editor ---
const schedDateInput = document.getElementById('schedDate');
const schedTable = document.getElementById('schedTable');
const schedTbody = schedTable ? schedTable.querySelector('tbody') : null;
const reloadScheduleBtn = document.getElementById('reloadScheduleBtn');
const saveScheduleBtn = document.getElementById('saveScheduleBtn');
const schedStatus = document.getElementById('schedStatus');
// New: search and specialty filter for schedule editor
const schedSearch = document.getElementById('schedSearch');
const schedSpecFilter = document.getElementById('schedSpecFilter');

function isoToday(){ return new Date().toISOString().slice(0,10); }
if(schedDateInput && !schedDateInput.value) schedDateInput.value = isoToday();

function rowOpdToText(opd){
  if(!Array.isArray(opd)) return '';
  return opd.map(x=> typeof x==='string'? x : (x.range + (typeof x.count==='number'?`-${x.count} pts`:'')) ).join(', ');
}

function parseBreaksField(val){
  if(!val) return undefined;
  const arr = val.split(',').map(s=>s.trim()).filter(Boolean);
  return arr.length? arr: undefined;
}

function collectRowData(tr){
  const id = Number(tr.dataset.id);
  const data = JSON.parse(tr.dataset.orig || '{}');
  const get = sel=> tr.querySelector(sel);
  data.start_time = get('input[data-f=start]')?.value || '';
  data.status = get('select[data-f=status]')?.value || 'PENDING';
  data.room = (get('input[data-f=room]')?.value || '').trim() || undefined;
  const pc = get('input[data-f=patients]')?.value;
  data.patient_count = (pc === '' ? undefined : Number(pc));
  const bb = get('input[data-f=bb]')?.value;
  data.before_break_opd_patients = (bb === '' ? undefined : Number(bb));
  // Breaks now before After-break column
  data.breaks = parseBreaksField(get('input[data-f=breaks]')?.value || '');
  const ab = get('input[data-f=ab]')?.value;
  data.after_break_opd_patients = (ab === '' ? undefined : Number(ab));
  data.designation = (get('input[data-f=designation]')?.value || '').trim() || undefined;
  data.status_reason = (get('input[data-f=reason]')?.value || '').trim() || undefined;
  return {id, data};
}

function diffRow(tr){
  if(!tr.dataset || !tr.dataset.id) return false; // skip specialty header rows
  const orig = JSON.parse(tr.dataset.orig || '{}');
  const {data} = collectRowData(tr);
  const fields = ['start_time','status','room','patient_count','before_break_opd_patients','breaks','after_break_opd_patients','designation','status_reason'];
  for(const f of fields){
    const a = JSON.stringify(orig[f]===undefined? null: orig[f]);
    const b = JSON.stringify(data[f]===undefined? null: data[f]);
    if(a!==b) return true;
  }
  return false;
}

function buildSchedRow(doc){
  const tr = document.createElement('tr');
  tr.dataset.id = doc.id;
  tr.dataset.spec = doc.specialty || '';
  tr.dataset.name = (doc.name || '').toLowerCase();
  tr.dataset.orig = JSON.stringify(doc);
  tr.innerHTML = `
    <td><div style="font-weight:600">${doc.name}</div><div style="font-size:11px;color:var(--muted)">${doc.specialty}</div></td>
    <td><input data-f="start" type="time" value="${doc.start_time||''}" /></td>
    <td><select data-f="status">
      ${['PENDING','ON_DUTY','OFF_DUTY','LEAVE','SICK','ON_CALL'].map(s=>`<option ${s===doc.status?'selected':''}>${s}</option>`).join('')}
    </select></td>
    <td><input data-f="room" value="${doc.room||''}" placeholder="Room" /></td>
    <td><input data-f="patients" type="number" min="0" step="1" value="${typeof doc.patient_count==='number'?doc.patient_count:''}" style="width:72px" placeholder="Total" /></td>
    <td><input data-f="bb" type="number" min="0" step="1" value="${typeof doc.before_break_opd_patients==='number'?doc.before_break_opd_patients:''}" style="width:72px" placeholder="Before" /></td>
    <td><input data-f="breaks" value="${Array.isArray(doc.breaks)?doc.breaks.join(', '):''}" placeholder="11:00-11:30" /></td>
    <td><input data-f="ab" type="number" min="0" step="1" value="${typeof doc.after_break_opd_patients==='number'?doc.after_break_opd_patients:''}" style="width:72px" placeholder="After" /></td>
    <td><input data-f="designation" value="${doc.designation||''}" placeholder="Designation" /></td>
    <td><input data-f="reason" value="${doc.status_reason||''}" placeholder="Reason" /></td>
    <td style="text-align:center;width:26px"><span class="row-state" style="font-size:12px;font-weight:700;color:var(--accent)"></span></td>`;
  tr.querySelectorAll('input,select').forEach(inp=>{
    inp.addEventListener('input', ()=> markRowState(tr));
    inp.addEventListener('change', ()=> markRowState(tr));
  });
  return tr;
}

async function loadScheduleEditor(){
  if(!schedTbody) return;
  schedStatus && (schedStatus.textContent = 'Loading…');
  try{
    const dateIso = schedDateInput?.value || isoToday();
    // Base doctor master list
    const base = await fetch('/api/doctors',{cache:'no-store'}).then(r=>r.json());
    // Per-day schedule (may include only subset / changed fields)
    let dayData = null;
    try { dayData = await fetch('/api/day?date='+encodeURIComponent(dateIso), {cache:'no-store'}).then(r=>r.json()); } catch { dayData = null; }
    const dayIndex = new Map();
    if(dayData && Array.isArray(dayData.doctors)){
      dayData.doctors.forEach(doc=>{ dayIndex.set(String(doc.id), doc); });
    }
    const list = base.doctors.slice().sort((a,b)=> (a.specialty||'').localeCompare(b.specialty||'') || a.name.localeCompare(b.name));
    schedTbody.innerHTML='';
    let currentSpec = null;
    list.forEach(doc=>{
      const spec = doc.specialty || 'General';
      if(spec !== currentSpec){
        currentSpec = spec;
        const hdr = document.createElement('tr');
        hdr.className = 'sched-spec-row';
        hdr.innerHTML = `<td colspan="11">${spec}</td>`;
        schedTbody.appendChild(hdr);
      }
      // Merge base doctor with any per-date override
      const override = dayIndex.get(String(doc.id));
      const clone = JSON.parse(JSON.stringify(doc));
      if(override){
        ['start_time','room','patient_count','before_break_opd_patients','breaks','after_break_opd_patients','status','status_reason','designation'].forEach(f=>{
          if(override[f] !== undefined) clone[f] = override[f];
        });
        clone.for_date = dateIso;
      } else {
        // No schedule entry for this date -> treat as pending baseline
        clone.status = 'PENDING';
        delete clone.start_time;
        delete clone.room;
        delete clone.patient_count;
        delete clone.before_break_opd_patients;
        delete clone.after_break_opd_patients;
        delete clone.breaks;
        delete clone.status_reason;
        delete clone.for_date;
      }
      const tr = buildSchedRow(clone);
      schedTbody.appendChild(tr);
      markRowState(tr);
    });
    const applied = dayIndex.size;
    schedStatus && (schedStatus.textContent = `Loaded ${list.length} doctors for ${dateIso} (${applied || 'no'} specific schedule entr${applied===1?'y':'ies'})`);
    // Populate specialty filter and apply any active filters
    try{ populateSchedSpecFilter(); filterScheduleRows(); }catch{}
  }catch(e){ schedStatus && (schedStatus.textContent = 'Load failed: '+e.message); }
}

async function saveScheduleEdits(){
  if(!schedTbody) return;
  const dateIso = schedDateInput?.value || isoToday();
  const rows = Array.from(schedTbody.querySelectorAll('tr'));
  const changedRows = rows.filter(r=> diffRow(r));
  if(!changedRows.length){ schedStatus && (schedStatus.textContent='No changes'); return; }
  schedStatus && (schedStatus.textContent = 'Saving '+changedRows.length+'…');
  let ok=0, fail=0;
  for(const tr of changedRows){
    const {id, data} = collectRowData(tr);
    const payload = Object.assign({}, data, {for_date: dateIso});
    try{
      const res = await fetch(`/api/doctors/${id}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      if(!res.ok) throw new Error((await res.text()).slice(0,120));
      const j = await res.json().catch(()=>({}));
      // Update orig snapshot to new state
      tr.dataset.orig = JSON.stringify(j.doctor || payload);
      ok++;
      markRowState(tr);
    }catch(err){ fail++; tr.classList.add('save-error'); }
  }
  schedStatus && (schedStatus.textContent = `Saved: ${ok} ok, ${fail} failed for ${dateIso}`);
  if(fail){ alert('Some rows failed to save.'); }
  // Refresh main doctors cache
  try{ await load(); }catch{}
}

reloadScheduleBtn && (reloadScheduleBtn.onclick=loadScheduleEditor);
saveScheduleBtn && (saveScheduleBtn.onclick=saveScheduleEdits);
if(schedDateInput){ schedDateInput.addEventListener('change', ()=> loadScheduleEditor()); }

// -------- Filtering (client-side) for the schedule editor --------
function populateSchedSpecFilter(){
  if(!schedSpecFilter || !cache) return;
  const keep = schedSpecFilter.value || '';
  const seen = new Set(['']);
  // Reset options
  schedSpecFilter.innerHTML = '';
  const allOpt = document.createElement('option'); allOpt.value=''; allOpt.textContent='All specialties';
  schedSpecFilter.appendChild(allOpt);
  (cache.specialty_order||[]).forEach(s=>{
    if(seen.has(s)) return; seen.add(s);
    const o = document.createElement('option'); o.value=s; o.textContent=s; schedSpecFilter.appendChild(o);
  });
  // Restore previous selection if still present
  if(keep && Array.from(schedSpecFilter.options).some(o=>o.value===keep)) schedSpecFilter.value = keep;
}

let schedSearchTimer = null;
function filterScheduleRows(){
  if(!schedTbody) return;
  const q = (schedSearch?.value||'').trim().toLowerCase();
  const spec = schedSpecFilter?.value || '';
  const rows = Array.from(schedTbody.querySelectorAll('tr'));
  // First, show/hide doctor rows based on criteria
  rows.forEach(tr=>{
    if(!tr.dataset || !tr.dataset.id){ return; }
    const matchesText = !q || (tr.dataset.name||'').includes(q);
    const matchesSpec = !spec || (tr.dataset.spec||'') === spec;
    tr.style.display = (matchesText && matchesSpec) ? '' : 'none';
  });
  // Then toggle specialty headers if their group has no visible rows
  let buffer = [];
  let header = null;
  const flush = ()=>{
    if(!header) return;
    const anyVisible = buffer.some(r=> r.style.display !== 'none');
    header.style.display = anyVisible ? '' : 'none';
    buffer = []; header = null;
  };
  rows.forEach(tr=>{
    const isHeader = !tr.dataset || !tr.dataset.id;
    if(isHeader){ flush(); header = tr; }
    else { buffer.push(tr); }
  });
  flush();
}

if(schedSearch){
  schedSearch.addEventListener('input', ()=>{
    clearTimeout(schedSearchTimer);
    schedSearchTimer = setTimeout(filterScheduleRows, 120);
  });
}
if(schedSpecFilter){
  schedSpecFilter.addEventListener('change', filterScheduleRows);
}

// Clear Selected Date functionality
const clearSelectedDateBtn = document.getElementById('clearSelectedDateBtn');
const clearDateModal = document.getElementById('clearDateModal');
const clearDateDisplay = document.getElementById('clearDateDisplay');
const clearDatePreview = document.getElementById('clearDatePreview');
const confirmClearDateBtn = document.getElementById('confirmClearDateBtn');

async function showClearDateConfirmation(){
  const dateIso = schedDateInput?.value || isoToday();
  if(!dateIso){ alert('Please select a date first'); return; }
  
  // Format date for display
  const dateObj = new Date(dateIso + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  clearDateDisplay.textContent = dateFormatted;
  
  // Fetch schedules for this date
  try{
    clearDatePreview.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Loading schedules...</div>';
    clearDateModal.style.display = 'flex';
    
    const dayData = await fetch(`/api/day?date=${encodeURIComponent(dateIso)}`, {cache:'no-store'}).then(r=>r.json());
    
    if(!dayData || !dayData.doctors || dayData.doctors.length === 0){
      clearDatePreview.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:12px">📭</div>
          <div style="font-size:16px;font-weight:600">No schedules found for this date</div>
          <div style="font-size:13px;margin-top:8px">There are no schedule entries to clear.</div>
        </div>
      `;
      confirmClearDateBtn.disabled = true;
      confirmClearDateBtn.style.opacity = '0.5';
      confirmClearDateBtn.style.cursor = 'not-allowed';
      return;
    }
    
    // Group by specialty
    const bySpecialty = {};
    dayData.doctors.forEach(doc => {
      const spec = doc.specialty || 'General';
      if(!bySpecialty[spec]) bySpecialty[spec] = [];
      bySpecialty[spec].push(doc);
    });
    
    // Build preview HTML
    let html = '';
    const specialties = Object.keys(bySpecialty).sort();
    
    specialties.forEach(spec => {
      const doctors = bySpecialty[spec];
      html += `
        <div style="margin-bottom:20px">
          <div style="font-size:14px;font-weight:800;color:#10b981;background:rgba(16,185,129,0.1);padding:10px 14px;border-radius:8px;margin-bottom:10px;border-left:4px solid #10b981">
            ${spec} <span style="color:var(--muted);font-weight:600;font-size:12px">(${doctors.length} doctor${doctors.length===1?'':'s'})</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;padding-left:12px">
      `;
      
      doctors.forEach(doc => {
        const hasSchedule = doc.start_time || doc.room || (typeof doc.patient_count === 'number');
        const scheduleDetails = [];
        
        if(doc.start_time) scheduleDetails.push(`🕐 ${doc.start_time}`);
        if(doc.room) scheduleDetails.push(`🚪 ${doc.room}`);
        if(typeof doc.patient_count === 'number') scheduleDetails.push(`👥 ${doc.patient_count} pts`);
        if(typeof doc.before_break_opd_patients === 'number') scheduleDetails.push(`📋 Before: ${doc.before_break_opd_patients}`);
        if(typeof doc.after_break_opd_patients === 'number') scheduleDetails.push(`📋 After: ${doc.after_break_opd_patients}`);
        
        const statusBadge = doc.status ? `<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;margin-left:8px">${doc.status.replace('_',' ')}</span>` : '';
        
        html += `
          <div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">
              ${doc.name}${statusBadge}
            </div>
            ${scheduleDetails.length > 0 ? `<div style="font-size:11px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px">${scheduleDetails.join(' • ')}</div>` : '<div style="font-size:11px;color:var(--muted);font-style:italic">Status only (no detailed schedule)</div>'}
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += `
      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:12px;margin-top:16px">
        <div style="font-size:12px;font-weight:700;color:#3b82f6;margin-bottom:6px">📊 Summary</div>
        <div style="font-size:11px;color:var(--muted)">
          <strong>${dayData.doctors.length}</strong> doctor schedule${dayData.doctors.length===1?'':'s'} across <strong>${specialties.length}</strong> specialt${specialties.length===1?'y':'ies'} will be removed
        </div>
      </div>
    `;
    
    clearDatePreview.innerHTML = html;
    confirmClearDateBtn.disabled = false;
    confirmClearDateBtn.style.opacity = '1';
    confirmClearDateBtn.style.cursor = 'pointer';
    
  }catch(e){
    clearDatePreview.innerHTML = `
      <div style="text-align:center;padding:30px;color:#ef4444">
        <div style="font-size:48px;margin-bottom:12px">❌</div>
        <div style="font-size:16px;font-weight:600">Failed to load schedules</div>
        <div style="font-size:13px;margin-top:8px">${e.message}</div>
      </div>
    `;
    confirmClearDateBtn.disabled = true;
    confirmClearDateBtn.style.opacity = '0.5';
  }
}

async function executeClearDate(){
  const dateIso = schedDateInput?.value || isoToday();
  if(!dateIso) return;
  
  confirmClearDateBtn.disabled = true;
  confirmClearDateBtn.textContent = '⏳ Clearing...';
  
  try{
    // Use the new dedicated clear-date endpoint
    const res = await fetch('/api/schedule/clear-date', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ date: dateIso })
    });
    
    if(!res.ok){
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to clear date');
    }
    
    const result = await res.json();
    
    clearDateModal.style.display = 'none';
    
    if(result.cleared === 0){
      alert('ℹ️ No schedules found for this date');
    } else {
      alert(`✅ Successfully cleared ${result.cleared} schedule${result.cleared===1?'':'s'} for ${dateIso}`);
    }
    
    // Force reload the schedule editor to show PENDING state
    await loadScheduleEditor();
    
    // Refresh main doctors cache to update the admin list
    try{ await load(); }catch{}
    
    // Give SSE a moment to propagate, then force a manual refresh if needed
    setTimeout(async () => {
      try{
        // Force a background refresh to ensure PR display gets updated
        await fetch('/api/doctors', {cache:'reload'});
      }catch{}
    }, 500);
    
  }catch(e){
    alert('❌ Failed to clear schedules: ' + e.message);
  }finally{
    confirmClearDateBtn.disabled = false;
    confirmClearDateBtn.textContent = '🗑️ Yes, Clear Date';
  }
}

if(clearSelectedDateBtn){
  clearSelectedDateBtn.onclick = showClearDateConfirmation;
}

if(confirmClearDateBtn){
  confirmClearDateBtn.onclick = executeClearDate;
}

// Initial lazy load only when schedule tab first activated OR immediately if already visible
if(document.getElementById('content-schedule')?.classList.contains('active')){ loadScheduleEditor(); }
else {
  const scheduleNavBtn = document.querySelector('.sidenav .nav-item[data-target="schedule"]');
  scheduleNavBtn && scheduleNavBtn.addEventListener('click', ()=>{ if(!schedTbody.hasChildNodes()) loadScheduleEditor(); });
}

function markRowState(tr){
  if(!tr || !tr.dataset || !tr.dataset.id) return; // ignore specialty header rows
  const span = tr.querySelector('.row-state');
  if(!span) return;
  span.textContent = diffRow(tr) ? '*' : '';
}

// ============ MEDIA ============
function initMediaPanel() {
  const logoFileInput = document.getElementById('logo-file');
  const logoFileName = document.getElementById('logo-file-name');
  const logoForm = document.getElementById('logoUploadForm');
  const logoMsg = document.getElementById('logoMsg');
  const logoPreviewImg = document.getElementById('logoPreviewImg');

  const bgFileInput = document.getElementById('bg-file');
  const bgFileName = document.getElementById('bg-file-name');
  const bgForm = document.getElementById('bgUploadForm');
  const bgMsg = document.getElementById('bgMsg');
  const bgPreviewImg = document.getElementById('bgPreviewImg');

  if (!logoFileInput || !bgFileInput) return;

  // Load current branding
  fetch('/api/branding').then(r => r.json()).then(data => {
    if (data.logo) {
      logoPreviewImg.src = data.logo + '?t=' + Date.now();
    }
    if (data.background) {
      bgPreviewImg.src = data.background + '?t=' + Date.now();
    }
  }).catch(() => {});

  // Logo file selection
  logoFileInput.addEventListener('change', () => {
    if (logoFileInput.files.length > 0) {
      logoFileName.textContent = logoFileInput.files[0].name;
      const reader = new FileReader();
      reader.onload = e => { logoPreviewImg.src = e.target.result; };
      reader.readAsDataURL(logoFileInput.files[0]);
    } else {
      logoFileName.textContent = 'No file chosen';
    }
  });

  // Logo upload
  logoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (logoFileInput.files.length === 0) {
      logoMsg.textContent = 'Please select a file first.';
      logoMsg.style.color = 'red';
      return;
    }
    const fd = new FormData();
    fd.append('file', logoFileInput.files[0]);
    logoMsg.textContent = 'Uploading...';
    logoMsg.style.color = 'var(--muted)';
    try {
      const res = await fetch('/api/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        logoMsg.textContent = '✔ Logo uploaded successfully!';
        logoMsg.style.color = 'var(--primary)';
        setTimeout(() => { logoMsg.textContent = ''; }, 3000);
      } else {
        logoMsg.textContent = '✖ ' + (data.error || 'Upload failed');
        logoMsg.style.color = 'red';
      }
    } catch (err) {
      logoMsg.textContent = '✖ Network error';
      logoMsg.style.color = 'red';
    }
  });

  // Background file selection
  bgFileInput.addEventListener('change', () => {
    if (bgFileInput.files.length > 0) {
      bgFileName.textContent = bgFileInput.files[0].name;
      const reader = new FileReader();
      reader.onload = e => { bgPreviewImg.src = e.target.result; };
      reader.readAsDataURL(bgFileInput.files[0]);
    } else {
      bgFileName.textContent = 'No file chosen';
    }
  });

  // Background upload
  bgForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (bgFileInput.files.length === 0) {
      bgMsg.textContent = 'Please select a file first.';
      bgMsg.style.color = 'red';
      return;
    }
    const fd = new FormData();
    fd.append('file', bgFileInput.files[0]);
    bgMsg.textContent = 'Uploading...';
    bgMsg.style.color = 'var(--muted)';
    try {
      const res = await fetch('/api/login_background', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        bgMsg.textContent = '✔ Background uploaded successfully!';
        bgMsg.style.color = 'var(--primary)';
        setTimeout(() => { bgMsg.textContent = ''; }, 3000);
      } else {
        bgMsg.textContent = '✖ ' + (data.error || 'Upload failed');
        bgMsg.style.color = 'red';
      }
    } catch (err) {
      bgMsg.textContent = '✖ Network error';
      bgMsg.style.color = 'red';
    }
  });

  // PR Display Logo handlers
  const displayLogoFileInput = document.getElementById('display-logo-file');
  const displayLogoFileName = document.getElementById('display-logo-file-name');
  const displayLogoForm = document.getElementById('displayLogoUploadForm');
  const displayLogoMsg = document.getElementById('displayLogoMsg');
  const displayLogoPreviewImg = document.getElementById('displayLogoPreviewImg');

  if (displayLogoFileInput && displayLogoForm) {
    // Load current display logo
    fetch('/api/branding').then(r => r.json()).then(data => {
      if (data.display_logo) {
        displayLogoPreviewImg.src = data.display_logo + '?t=' + Date.now();
      }
    }).catch(() => {});

    // Display logo file selection
    displayLogoFileInput.addEventListener('change', () => {
      if (displayLogoFileInput.files.length > 0) {
        displayLogoFileName.textContent = displayLogoFileInput.files[0].name;
        const reader = new FileReader();
        reader.onload = e => { displayLogoPreviewImg.src = e.target.result; };
        reader.readAsDataURL(displayLogoFileInput.files[0]);
      } else {
        displayLogoFileName.textContent = 'No file chosen';
      }
    });

    // Display logo upload
    displayLogoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (displayLogoFileInput.files.length === 0) {
        displayLogoMsg.textContent = 'Please select a file first.';
        displayLogoMsg.style.color = 'red';
        return;
      }
      const fd = new FormData();
      fd.append('file', displayLogoFileInput.files[0]);
      displayLogoMsg.textContent = 'Uploading...';
      displayLogoMsg.style.color = 'var(--muted)';
      try {
        const res = await fetch('/api/display_logo', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok) {
          displayLogoMsg.textContent = '✔ Display logo uploaded successfully!';
          displayLogoMsg.style.color = '#3b82f6';
          setTimeout(() => { displayLogoMsg.textContent = ''; }, 3000);
        } else {
          displayLogoMsg.textContent = '✖ ' + (data.error || 'Upload failed');
          displayLogoMsg.style.color = 'red';
        }
      } catch (err) {
        displayLogoMsg.textContent = '✖ Network error';
        displayLogoMsg.style.color = 'red';
      }
    });
  }
}

// --- Users panel (ADMIN only) ---
const usersPanel = document.getElementById('usersPanel');
const usersList = document.getElementById('usersList');
const addUserForm = document.getElementById('addUserForm');
const nuName = document.getElementById('nuName');
const nuPass = document.getElementById('nuPass');
const nuRole = document.getElementById('nuRole');
const userMsg = document.getElementById('userMsg');

async function initUsersPanel(){
  const isAdmin = (ROLE||'').toUpperCase()==='ADMIN';
  if(!usersPanel) return;
  usersPanel.style.display = isAdmin ? '' : 'none';
  if(isAdmin) await loadUsers();
}

async function loadUsers(){
  if(!usersList) return;
  try{
    const r = await fetch('/api/users');
    if(!r.ok){ usersList.innerHTML='<div style="color:red;font-size:12px">Failed to load users</div>'; return; }
    const data = await r.json();
    const users = data.users || [];
    if(users.length === 0){
      usersList.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px">No users yet. Create one above.</div>';
      return;
    }
    const roleColors = {
      'ADMIN': '#e74c3c',
      'MEDICAL ADMIN': '#3b82f6',
      'PR': '#10b981',
      'VIEW ONLY': '#f59e0b'
    };
    const roleIcons = {
      'ADMIN': '🔴',
      'MEDICAL ADMIN': '🔵',
      'PR': '🟢',
      'VIEW ONLY': '🟡'
    };
    usersList.innerHTML = users.map(u => {
      const roleDisplay = u.role || 'PR';
      const color = roleColors[roleDisplay] || '#6b7280';
      const icon = roleIcons[roleDisplay] || '⚪';
      return `
        <div style="background:var(--card);border:2px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:24px">${icon}</div>
            <div>
              <div style="font-weight:800;font-size:14px;color:var(--text)">${u.username}</div>
              <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px">${roleDisplay}</div>
            </div>
          </div>
          <button onclick="deleteUser('${u.username}')" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-size:11px">🗑️ Delete</button>
        </div>
      `;
    }).join('');
  }catch{
    usersList.innerHTML='<div style="color:red;font-size:12px">Network error</div>';
  }
}

async function deleteUser(username){
  if(!confirm(`Delete user "${username}"?`)) return;
  try{
    const r = await fetch(`/api/users/${username}`, {method:'DELETE'});
    if(r.ok){
      await loadUsers();
    } else {
      alert('Failed to delete user');
    }
  }catch{
    alert('Network error');
  }
}
window.deleteUser = deleteUser;

if(addUserForm){
  addUserForm.addEventListener('submit', async e=>{
    e.preventDefault();
    if(!nuName.value || !nuPass.value){ userMsg.textContent='✖ Enter username and password'; userMsg.style.color='red'; return; }
    userMsg.textContent = 'Saving…';
    userMsg.style.color='var(--muted)';
    try{
      const r = await fetch('/api/users', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username: nuName.value.trim(), password: nuPass.value, role: nuRole.value})});
      if(!r.ok){ 
        const errData = await r.json();
        userMsg.textContent='✖ '+(errData.error||'Failed to add user'); 
        userMsg.style.color='red';
        return; 
      }
      nuName.value=''; 
      nuPass.value=''; 
      userMsg.textContent='✔ User added successfully!'; 
      userMsg.style.color='var(--primary)';
      setTimeout(()=> {userMsg.textContent=''; userMsg.style.color='var(--muted)';}, 3000);
      // Reload user list
      await loadUsers();
    }catch{ 
      userMsg.textContent='✖ Network error'; 
      userMsg.style.color='red';
    }
  });
}

// Initialize when entering Settings tab or on first load
initUsersPanel();

// Initialize Media panel
initMediaPanel();

// Load branding on first paint for topbar logo
(function(){
  if(!brandLogoSmall) return;
  try{
    fetch('/api/branding').then(r=>r.json()).then(d=>{ if(d && d.logo){ brandLogoSmall.src = d.logo + '?t=' + Date.now(); brandLogoSmall.style.display='block'; } });
  }catch{}
})();

// ============ WINDOWS EXPLORER-STYLE FILE MANAGER ============
// Global state storage
window.fileManagerState = {
  initialized: false,
  elements: {},
  currentPath: '',
  currentViewMode: 'list',
  allItems: [],
  selectedFile: null
};

// Define global functions FIRST (before DOM check)
window.openFileManager = function(){
  console.log('openFileManager called!');
  const fmModal = document.getElementById('fileManagerModal');
  if(!fmModal) {
    console.error('File Manager modal not found!');
    alert('File Manager not loaded yet. Please refresh the page.');
    return;
  }
  console.log('Opening file manager modal...');
  fmModal.classList.add('active');
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
  // Mark as initialized
  window.fileManagerState.initialized = true;
  // Load files if function exists
  if(window.fileManagerLoadFiles) {
    console.log('Calling fileManagerLoadFiles...');
    setTimeout(() => {
      window.fileManagerLoadFiles();
    }, 100); // Small delay to ensure modal is rendered
  } else {
    console.error('fileManagerLoadFiles not available yet - waiting for init');
    // Retry after a short delay
    setTimeout(() => {
      if(window.fileManagerLoadFiles) {
        console.log('Retry: calling fileManagerLoadFiles...');
        window.fileManagerLoadFiles();
      } else {
        console.error('Still not available - File Manager not initialized');
        alert('File Manager failed to initialize. Please refresh the page.');
      }
    }, 500);
  }
};

window.toggleViewMenu = function(e){
  console.log('toggleViewMenu called!');
  if(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const fmViewMenu = document.getElementById('fmViewMenu');
  if(!fmViewMenu){
    console.error('View menu not found!');
    return;
  }
  const isVisible = fmViewMenu.style.display === 'block';
  fmViewMenu.style.display = isVisible ? 'none' : 'block';
  console.log('View menu now:', isVisible ? 'hidden' : 'visible');
};

// Global wrapper functions for button clicks (delegate to internal functions when available)
window.fmGoUp = function(){
  console.log('fmGoUp called!');
  if(window.fileManagerGoUp){
    window.fileManagerGoUp();
  } else {
    console.error('fileManagerGoUp not initialized yet');
  }
};

window.fmNewFolder = function(){
  console.log('fmNewFolder called!');
  if(window.fileManagerCreateFolder){
    window.fileManagerCreateFolder();
  } else {
    console.error('fileManagerCreateFolder not initialized yet');
  }
};

window.fmUpload = function(){
  console.log('fmUpload called!');
  if(window.fileManagerTriggerUpload){
    window.fileManagerTriggerUpload();
  } else {
    console.error('fileManagerTriggerUpload not initialized yet');
  }
};

window.fmHandleUpload = function(){
  console.log('fmHandleUpload called!');
  if(window.fileManagerHandleUpload){
    window.fileManagerHandleUpload();
  } else {
    console.error('fileManagerHandleUpload not initialized yet');
  }
};

window.fmClose = function(){
  console.log('fmClose called!');
  if(window.fileManagerCloseModal){
    window.fileManagerCloseModal();
  } else {
    console.error('fileManagerCloseModal not initialized yet');
  }
};

window.fmSelectFile = function(){
  console.log('fmSelectFile called!');
  if(window.fileManagerSelectAndClose){
    window.fileManagerSelectAndClose();
  } else {
    console.error('fileManagerSelectAndClose not initialized yet');
  }
};

window.fmMinimize = function(){
  console.log('fmMinimize called!');
  const fmModal = document.getElementById('fileManagerModal');
  if(fmModal){
    fmModal.style.display = 'none';
  }
};

window.fmMaximize = function(){
  console.log('fmMaximize called!');
  const fmModal = document.getElementById('fileManagerModal');
  if(fmModal){
    if(fmModal.style.width === '95vw'){
      fmModal.style.width = '80vw';
      fmModal.style.height = '80vh';
    } else {
      fmModal.style.width = '95vw';
      fmModal.style.height = '95vh';
    }
  }
};

// Initialize File Manager when DOM is ready
(function(){
  // Wait for DOM to be fully loaded
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initFileManager);
  } else {
    initFileManager();
  }
  
  function initFileManager(){
    console.log('Initializing File Manager...');
    
    // Get all DOM elements
    const fmModal = document.getElementById('fileManagerModal');
    const fmCloseBtn = document.getElementById('fmCloseBtn');
    const fmCancelBtn = document.getElementById('fmCancelBtn');
    const fmSelectBtn = document.getElementById('fmSelectBtn');
    const fmContentArea = document.getElementById('fmContentArea');
    const fmBreadcrumb = document.getElementById('fmBreadcrumb');
    const fmStatusText = document.getElementById('fmStatusText');
    const fmItemCount = document.getElementById('fmItemCount');
    const fmUpBtn = document.getElementById('fmUpBtn');
    const fmNewFolderBtn = document.getElementById('fmNewFolderBtn');
    const fmUploadBtn = document.getElementById('fmUploadBtn');
    const fmFileInput = document.getElementById('fmFileInput');
    const fmSearch = document.getElementById('fmSearch');
    const fmViewBtn = document.getElementById('fmViewBtn');
    const fmViewMenu = document.getElementById('fmViewMenu');
    const fmRefreshBtn = document.getElementById('fmRefreshBtn');
    const fmContextMenu = document.getElementById('fmContextMenu');
    
    if(!fmModal){
      console.error('File Manager modal not found in DOM!');
      return;
    }
    
    console.log('File Manager elements found:', {
      modal: !!fmModal,
      closeBtn: !!fmCloseBtn,
      contentArea: !!fmContentArea,
      viewBtn: !!fmViewBtn,
      viewMenu: !!fmViewMenu
    });
    
    // Store elements in global state
    window.fileManagerState.elements = {
      fmModal,
      fmCloseBtn,
      fmCancelBtn,
      fmSelectBtn,
      fmContentArea,
      fmBreadcrumb,
      fmStatusText,
      fmItemCount,
      fmUpBtn,
      fmNewFolderBtn,
      fmUploadBtn,
      fmFileInput,
      fmSearch,
      fmViewBtn,
      fmViewMenu,
      fmRefreshBtn,
      fmContextMenu
    };
  
  let currentPath = '';
  let currentViewMode = 'list'; // Default to list view to match HTML
  let allItems = [];
  let selectedFile = null;
  let contextTarget = null;
  
  // Sync local variables with global state
  function syncState(){
    window.fileManagerState.currentPath = currentPath;
    window.fileManagerState.currentViewMode = currentViewMode;
    window.fileManagerState.allItems = allItems;
    window.fileManagerState.selectedFile = selectedFile;
  }
  
  // Close modal
  function closeFileManager(){
    if(!fmModal) return;
    console.log('Closing file manager modal...');
    fmModal.classList.remove('active');
    // Re-enable body scrolling
    document.body.style.overflow = '';
    selectedFile = null;
  }
  
  // Update breadcrumb
  function updateBreadcrumb(){
    if(fmBreadcrumb) fmBreadcrumb.textContent = '/' + (currentPath || '');
  }
  
  // Update status
  function updateStatus(text, count = null){
    if(fmStatusText) fmStatusText.textContent = text;
    if(fmItemCount && count !== null) fmItemCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
  
  // Load files from API
  async function loadFiles(){
    // Use global state if local elements not available
    const contentArea = fmContentArea || window.fileManagerState.elements?.fmContentArea;
    if(!contentArea){
      console.error('Content area not found!');
      return;
    }
    try{
      console.log('Loading files from path:', currentPath);
      updateStatus('Loading...', 0);
      const url = '/api/files/list?path=' + encodeURIComponent(currentPath||'');
      console.log('Fetching:', url);
      
      const r = await fetch(url);
      const j = await r.json();
      console.log('API response:', j);
      
      if(!r.ok || !j.ok) throw new Error(j.error || 'Load failed');
      
      allItems = j.items || [];
      console.log('Items received:', allItems);
      syncState(); // Update global state
      updateBreadcrumb();
      renderFiles(allItems);
      updateStatus('Ready', allItems.length);
      console.log('Files loaded successfully:', allItems.length, 'items');
    }catch(err){
      console.error('Error loading files:', err);
      updateStatus('Error: ' + err.message, 0);
      renderEmpty('Failed to load files: ' + err.message);
    }
  }
  
  // Expose functions globally for onclick handlers
  window.fileManagerLoadFiles = loadFiles;
  window.fileManagerGoUp = goUp;
  window.fileManagerCreateFolder = createNewFolder;
  window.fileManagerTriggerUpload = triggerUpload;
  window.fileManagerHandleUpload = handleFileUpload;
  window.fileManagerCloseModal = closeFileManager;
  window.fileManagerSelectAndClose = selectAndClose;
  
  // Render files
  function renderFiles(items){
    if(!fmContentArea){
      console.error('fmContentArea not found in renderFiles!');
      return;
    }
    console.log('Rendering', items.length, 'items in', currentViewMode, 'mode');
    fmContentArea.innerHTML = '';
    
    if(items.length === 0){
      renderEmpty('No files or folders');
      return;
    }
    
    if(currentViewMode === 'list'){
      // Table header
      const header = document.createElement('div');
      header.className = 'fm-list-header';
      header.innerHTML = `
        <div class="fm-header-cell" style="width:40%">Name</div>
        <div class="fm-header-cell" style="width:15%">Type</div>
        <div class="fm-header-cell" style="width:15%">Size</div>
        <div class="fm-header-cell" style="width:30%">Modified</div>
      `;
      fmContentArea.appendChild(header);
    }
    
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'fm-item';
      el.dataset.name = item.name;
      el.dataset.type = item.type;
      el.draggable = true;
      
      const icon = item.type === 'dir' ? '📁' : '📄';
      const size = item.type === 'file' ? formatSize(item.size) : '';
      const modified = formatDate(item.modified);
      const typeText = item.type === 'dir' ? 'Folder' : 'File';
      
      // Render based on view mode
      if(['extra-large', 'large', 'medium', 'small', 'grid'].includes(currentViewMode)){
        // Icon views
        el.innerHTML = `
          <div class="fm-icon">${icon}</div>
          <div class="fm-name">${escapeHtml(item.name)}</div>
        `;
      } else if(currentViewMode === 'tiles'){
        // Tiles view - horizontal with metadata
        el.innerHTML = `
          <div class="fm-icon">${icon}</div>
          <div style="flex:1">
            <div class="fm-name">${escapeHtml(item.name)}</div>
            <div class="fm-meta">${typeText}${size ? ' • ' + size : ''}</div>
          </div>
        `;
      } else if(currentViewMode === 'content'){
        // Content view - detailed list
        el.innerHTML = `
          <div class="fm-icon">${icon}</div>
          <div class="fm-item-details">
            <div class="fm-name">${escapeHtml(item.name)}</div>
            <div class="fm-meta">${typeText}${size ? ' • ' + size : ''} • ${modified}</div>
          </div>
        `;
      } else if(currentViewMode === 'details' || currentViewMode === 'list'){
        // Details/List view - table format
        el.innerHTML = `
          <div class="fm-item-cell" style="width:40%">
            <div class="fm-item-name">
              <span class="fm-icon">${icon}</span>
              <span class="fm-name">${escapeHtml(item.name)}</span>
            </div>
          </div>
          <div class="fm-item-cell" style="width:15%">${typeText}</div>
          <div class="fm-item-cell" style="width:15%">${size}</div>
          <div class="fm-item-cell" style="width:30%">${modified}</div>
        `;
      }
      
      // Single click to highlight
      el.addEventListener('click', (e) => handleSingleClick(item, el, e));
      
      // Double click to select/open
      el.addEventListener('dblclick', () => handleDoubleClick(item, el));
      
      // Right click for context menu
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, item, el);
      });
      
      // Drag events
      el.addEventListener('dragstart', (e) => handleDragStart(e, item, el));
      el.addEventListener('dragend', (e) => handleDragEnd(e, el));
      el.addEventListener('dragover', (e) => handleDragOver(e, item, el));
      el.addEventListener('dragleave', (e) => handleDragLeave(e, el));
      el.addEventListener('drop', (e) => handleDrop(e, item, el));
      
      fmContentArea.appendChild(el);
    });
  }
  
  // Render empty state
  function renderEmpty(message){
    if(!fmContentArea) return;
    fmContentArea.innerHTML = `
      <div class="fm-empty">
        <div class="fm-empty-icon">📂</div>
        <div class="fm-empty-text">${message}</div>
      </div>
    `;
  }
  
  // Single click - highlight item
  function handleSingleClick(item, el, e){
    if(!e.ctrlKey && !e.shiftKey){
      document.querySelectorAll('.fm-item').forEach(i => i.classList.remove('highlighted', 'selected'));
    }
    el.classList.add('highlighted');
    
    // Update selection info
    const fileName = item.name;
    if(document.getElementById('fmSelectedFileName')){
      document.getElementById('fmSelectedFileName').textContent = fileName;
    }
  }
  
  // Double click - select file or open folder
  function handleDoubleClick(item, el){
    if(item.type === 'dir'){
      // Navigate into folder
      currentPath = (currentPath ? currentPath + '/' : '') + item.name;
      loadFiles();
    } else {
      // Select file
      document.querySelectorAll('.fm-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      selectedFile = (currentPath ? currentPath + '/' : '') + item.name;
      
      // Update UI
      if(document.getElementById('fmSelectedFileName')){
        document.getElementById('fmSelectedFileName').textContent = item.name;
      }
      
      // Auto-close and apply selection
      selectAndClose();
    }
  }
  
  // Drag and drop handlers
  let draggedItem = null;
  const dragOverlay = document.getElementById('fmDragOverlay');
  
  function handleDragStart(e, item, el){
    draggedItem = item;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.name);
  }
  
  function handleDragEnd(e, el){
    el.classList.remove('dragging');
    draggedItem = null;
    if(dragOverlay) dragOverlay.style.display = 'none';
  }
  
  function handleDragOver(e, item, el){
    if(!draggedItem || draggedItem.name === item.name) return;
    e.preventDefault();
    
    // Only allow drop on folders
    if(item.type === 'dir'){
      e.dataTransfer.dropEffect = 'move';
      el.classList.add('drag-over');
      if(dragOverlay) dragOverlay.style.display = 'flex';
    }
  }
  
  function handleDragLeave(e, el){
    el.classList.remove('drag-over');
  }
  
  function handleDrop(e, item, el){
    e.preventDefault();
    el.classList.remove('drag-over');
    if(dragOverlay) dragOverlay.style.display = 'none';
    
    if(!draggedItem || draggedItem.name === item.name) return;
    
    // Only allow drop on folders
    if(item.type === 'dir'){
      moveItemToFolder(draggedItem, item);
    }
  }
  
  async function moveItemToFolder(sourceItem, targetFolder){
    const sourcePath = (currentPath ? currentPath + '/' : '') + sourceItem.name;
    const destFolder = (currentPath ? currentPath + '/' : '') + targetFolder.name;
    
    if(!confirm(`Move "${sourceItem.name}" to "${targetFolder.name}"?`)) return;
    
    try{
      console.log('Moving item:', {source: sourcePath, destination: destFolder});
      updateStatus('Moving...', null);
      
      const r = await fetch('/api/files/move', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          source: sourcePath,
          destination: destFolder
        })
      });
      
      const j = await r.json();
      console.log('Move response:', j);
      
      if(!r.ok || !j.ok){
        throw new Error(j.error || 'Move failed');
      }
      
      updateStatus('Moved successfully!', null);
      setTimeout(() => loadFiles(), 300);
    }catch(err){
      console.error('Move error:', err);
      alert('Failed to move: ' + err.message);
      updateStatus('Move failed', null);
    }
  }
  
  // Show context menu
  function showContextMenu(e, item, el){
    if(!fmContextMenu) return;
    contextTarget = {item, el};
    fmContextMenu.style.display = 'block';
    fmContextMenu.style.left = e.pageX + 'px';
    fmContextMenu.style.top = e.pageY + 'px';
  }
  
  // Hide context menu
  function hideContextMenu(){
    if(fmContextMenu) fmContextMenu.style.display = 'none';
    contextTarget = null;
  }
  
  // Handle context menu actions
  function handleContextAction(action){
    if(!contextTarget) return;
    const {item, el} = contextTarget;
    
    switch(action){
      case 'open':
        if(item.type === 'dir') handleItemClick(item, el);
        break;
      case 'select':
        if(item.type === 'file') handleItemClick(item, el);
        break;
      case 'preview':
        if(item.type === 'file') previewFile(item);
        break;
      case 'download':
        if(item.type === 'file') downloadFile(item);
        break;
      case 'rename':
        renameItem(item);
        break;
      case 'move':
        moveItem(item);
        break;
      case 'delete':
        deleteItem(item);
        break;
    }
    
    hideContextMenu();
  }
  
  // Go up one level
  function goUp(){
    if(!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    currentPath = parts.join('/');
    loadFiles();
  }
  
  // Create new folder
  async function createNewFolder(){
    const name = prompt('Enter folder name:');
    if(!name) return;
    
    try{
      const rel = (currentPath ? currentPath + '/' : '') + name;
      const r = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path: rel})
      });
      const j = await r.json();
      if(!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      updateStatus('Folder created', null);
      loadFiles();
    }catch(err){
      alert('Failed to create folder: ' + err.message);
    }
  }
  
  // Upload files
  function triggerUpload(){
    if(fmFileInput) fmFileInput.click();
  }
  
  async function handleFileUpload(){
    if(!fmFileInput || !fmFileInput.files.length) return;
    
    updateStatus('Uploading...', null);
    
    for(const file of fmFileInput.files){
      try{
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/schedule/store_excel?path=' + encodeURIComponent(currentPath||''), {
          method: 'POST',
          body: fd
        });
        const j = await r.json();
        if(!r.ok || !j.ok) throw new Error(j.error || 'Upload failed');
      }catch(err){
        alert('Failed to upload ' + file.name + ': ' + err.message);
      }
    }
    
    fmFileInput.value = '';
    updateStatus('Upload complete', null);
    setTimeout(() => loadFiles(), 300);
  }
  
  // Rename item
  async function renameItem(item){
    const newName = prompt('Enter new name:', item.name);
    if(!newName || newName === item.name) return;
    
    try{
      const oldPath = (currentPath ? currentPath + '/' : '') + item.name;
      const r = await fetch('/api/files/rename', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path: oldPath, new_name: newName})
      });
      const j = await r.json();
      if(!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      updateStatus('Renamed', null);
      loadFiles();
    }catch(err){
      alert('Failed to rename: ' + err.message);
    }
  }
  
  // Move item (simple prompt-based)
  async function moveItem(item){
    const dest = prompt('Enter destination path (relative to /schedules):', currentPath || '/');
    if(!dest) return;
    
    alert('Move functionality coming soon! Drag & drop support in next update.');
  }
  
  // Delete item
  async function deleteItem(item){
    if(!confirm(`Delete ${item.name}?`)) return;
    
    try{
      const rel = (currentPath ? currentPath + '/' : '') + item.name;
      const r = await fetch('/api/schedule/delete_excel', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename: rel})
      });
      const j = await r.json();
      if(!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      updateStatus('Deleted', null);
      loadFiles();
    }catch(err){
      alert('Failed to delete: ' + err.message);
    }
  }
  
  // Preview file
  function previewFile(item){
    const rel = (currentPath ? currentPath + '/' : '') + item.name;
    if(uploadedFileSelect) uploadedFileSelect.value = rel;
    if(previewFileBtn) previewFileBtn.click();
    closeFileManager();
  }
  
  // Download file
  function downloadFile(item){
    const rel = (currentPath ? currentPath + '/' : '') + item.name;
    window.open('/api/files/download?path=' + encodeURIComponent(rel), '_blank');
  }
  
  // Search files
  let searchTimer = null;
  function handleSearch(){
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = (fmSearch?.value || '').toLowerCase().trim();
      if(!query){
        renderFiles(allItems);
        updateStatus('Ready', allItems.length);
        return;
      }
      
      const filtered = allItems.filter(item => item.name.toLowerCase().includes(query));
      renderFiles(filtered);
      updateStatus(`Found ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`, filtered.length);
    }, 200);
  }
  
  // Switch view mode
  function setViewMode(mode){
    currentViewMode = mode;
    if(!fmContentArea) return;
    
    console.log('Switching view mode to:', mode);
    fmContentArea.className = 'fm-content-area fm-view-' + mode;
    
    renderFiles(allItems);
  }
  
  // Make setViewMode global
  window.changeViewMode = function(mode){
    console.log('changeViewMode called with:', mode);
    setViewMode(mode);
    if(fmViewMenu) fmViewMenu.style.display = 'none';
    // Update active state
    const items = document.querySelectorAll('.fm-view-menu-item');
    items.forEach(item => {
      if(item.dataset.view === mode){
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  };
  
  // Select file and close
  function selectAndClose(){
    if(!selectedFile){
      alert('Please select a file first');
      return;
    }
    
    if(uploadedFileSelect) uploadedFileSelect.value = selectedFile;
    updateStatus('File selected', null);
    closeFileManager();
  }
  
  // Utility functions
  function formatSize(bytes){
    if(!bytes) return '';
    return (bytes / 1024).toFixed(2) + ' KB';
  }
  
  function formatDate(timestamp){
    if(!timestamp) return '';
    try{
      const d = new Date(timestamp * 1000);
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }catch{
      return '';
    }
  }
  
  function escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Event listeners
  console.log('Attaching event listeners...');
  
  if(fmCloseBtn){
    console.log('Attaching close button listener');
    fmCloseBtn.addEventListener('click', (e) => {
      console.log('Close button clicked!');
      e.preventDefault();
      e.stopPropagation();
      closeFileManager();
    });
  } else {
    console.error('fmCloseBtn not found!');
  }
  
  if(fmCancelBtn){
    fmCancelBtn.addEventListener('click', (e) => {
      console.log('Cancel button clicked!');
      e.preventDefault();
      e.stopPropagation();
      closeFileManager();
    });
  }
  
  if(fmSelectBtn){
    fmSelectBtn.addEventListener('click', (e) => {
      console.log('Select button clicked!');
      e.preventDefault();
      e.stopPropagation();
      selectAndClose();
    });
  }
  
  if(fmUpBtn){
    fmUpBtn.addEventListener('click', (e) => {
      console.log('Up button clicked!');
      e.preventDefault();
      e.stopPropagation();
      goUp();
    });
  }
  
  if(fmNewFolderBtn){
    fmNewFolderBtn.addEventListener('click', (e) => {
      console.log('New Folder button clicked!');
      e.preventDefault();
      e.stopPropagation();
      createNewFolder();
    });
  }
  
  if(fmUploadBtn){
    fmUploadBtn.addEventListener('click', (e) => {
      console.log('Upload button clicked!');
      e.preventDefault();
      e.stopPropagation();
      triggerUpload();
    });
  }
  
  if(fmFileInput) fmFileInput.addEventListener('change', handleFileUpload);
  if(fmSearch) fmSearch.addEventListener('input', handleSearch);
  
  // View Menu Dropdown - Now handled by onclick in HTML
  // Close menu when clicking outside (only when modal is active)
  document.addEventListener('click', (e) => {
    if(fmModal && fmModal.classList.contains('active')){
      const fmViewMenu = document.getElementById('fmViewMenu');
      const fmViewBtn = document.getElementById('fmViewBtn');
      if(fmViewMenu && fmViewBtn && !fmViewBtn.contains(e.target) && !fmViewMenu.contains(e.target)){
        fmViewMenu.style.display = 'none';
      }
    }
  });
  
  if(fmRefreshBtn){
    fmRefreshBtn.addEventListener('click', (e) => {
      console.log('Refresh button clicked!');
      e.preventDefault();
      e.stopPropagation();
      loadFiles();
    });
  }
  
  console.log('Event listeners attached successfully');
  
  // ========== KEYBOARD SHORTCUTS ==========
  let clipboard = null;
  let clipboardAction = null; // 'copy' or 'cut'
  
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when modal is active
    if(!fmModal || !fmModal.classList.contains('active')) return;
    
    const highlighted = document.querySelectorAll('.fm-item.highlighted');
    const selected = document.querySelectorAll('.fm-item.selected');
    const activeItems = highlighted.length > 0 ? highlighted : selected;
    
    // ESC - Close modal
    if(e.key === 'Escape'){
      e.preventDefault();
      closeFileManager();
      return;
    }
    
    // DELETE - Delete selected items
    if(e.key === 'Delete'){
      e.preventDefault();
      if(activeItems.length > 0){
        const items = Array.from(activeItems).map(el => ({
          name: el.dataset.name,
          type: el.dataset.type
        }));
        deleteMultipleItems(items);
      }
      return;
    }
    
    // ENTER - Open folder or select file
    if(e.key === 'Enter'){
      e.preventDefault();
      if(activeItems.length === 1){
        const el = activeItems[0];
        const item = allItems.find(i => i.name === el.dataset.name);
        if(item) handleDoubleClick(item, el);
      }
      return;
    }
    
    // F2 - Rename
    if(e.key === 'F2'){
      e.preventDefault();
      if(activeItems.length === 1){
        const el = activeItems[0];
        const item = allItems.find(i => i.name === el.dataset.name);
        if(item) renameItem(item);
      }
      return;
    }
    
    // F5 - Refresh
    if(e.key === 'F5'){
      e.preventDefault();
      loadFiles();
      return;
    }
    
    // CTRL/CMD + A - Select all
    if((e.ctrlKey || e.metaKey) && e.key === 'a'){
      e.preventDefault();
      document.querySelectorAll('.fm-item').forEach(el => el.classList.add('highlighted'));
      console.log('Selected all items');
      return;
    }
    
    // CTRL/CMD + C - Copy
    if((e.ctrlKey || e.metaKey) && e.key === 'c'){
      e.preventDefault();
      if(activeItems.length > 0){
        clipboard = Array.from(activeItems).map(el => ({
          name: el.dataset.name,
          type: el.dataset.type,
          path: (currentPath ? currentPath + '/' : '') + el.dataset.name
        }));
        clipboardAction = 'copy';
        console.log('Copied', clipboard.length, 'items to clipboard');
        updateStatus(`Copied ${clipboard.length} item(s)`, null);
      }
      return;
    }
    
    // CTRL/CMD + X - Cut
    if((e.ctrlKey || e.metaKey) && e.key === 'x'){
      e.preventDefault();
      if(activeItems.length > 0){
        clipboard = Array.from(activeItems).map(el => ({
          name: el.dataset.name,
          type: el.dataset.type,
          path: (currentPath ? currentPath + '/' : '') + el.dataset.name
        }));
        clipboardAction = 'cut';
        // Visual feedback for cut items
        activeItems.forEach(el => el.style.opacity = '0.5');
        console.log('Cut', clipboard.length, 'items to clipboard');
        updateStatus(`Cut ${clipboard.length} item(s)`, null);
      }
      return;
    }
    
    // CTRL/CMD + V - Paste
    if((e.ctrlKey || e.metaKey) && e.key === 'v'){
      e.preventDefault();
      if(clipboard && clipboard.length > 0){
        pasteItems();
      }
      return;
    }
    
    // Arrow keys - Navigate items
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)){
      e.preventDefault();
      navigateWithArrows(e.key, activeItems);
      return;
    }
  });
  
  // Paste function
  async function pasteItems(){
    if(!clipboard || clipboard.length === 0) return;
    
    try{
      updateStatus('Pasting...', null);
      
      for(const item of clipboard){
        if(clipboardAction === 'copy'){
          // Copy operation - would need backend API
          console.log('Copy operation not yet implemented for:', item);
        } else if(clipboardAction === 'cut'){
          // Move to current directory
          const sourcePath = item.path;
          const destFolder = currentPath || '';
          
          const r = await fetch('/api/files/move', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({source: sourcePath, destination: destFolder})
          });
          
          if(!r.ok) throw new Error('Move failed');
        }
      }
      
      clipboard = null;
      clipboardAction = null;
      updateStatus('Paste complete', null);
      setTimeout(() => loadFiles(), 300);
    }catch(err){
      console.error('Paste error:', err);
      alert('Failed to paste: ' + err.message);
    }
  }
  
  // Navigate with arrow keys
  function navigateWithArrows(key, activeItems){
    const items = Array.from(document.querySelectorAll('.fm-item'));
    if(items.length === 0) return;
    
    let currentIndex = activeItems.length > 0 ? items.indexOf(activeItems[0]) : -1;
    let newIndex = currentIndex;
    
    if(key === 'ArrowDown') newIndex = Math.min(items.length - 1, currentIndex + 1);
    if(key === 'ArrowUp') newIndex = Math.max(0, currentIndex - 1);
    if(key === 'ArrowRight') newIndex = Math.min(items.length - 1, currentIndex + 1);
    if(key === 'ArrowLeft') newIndex = Math.max(0, currentIndex - 1);
    
    if(newIndex !== currentIndex && items[newIndex]){
      items.forEach(el => el.classList.remove('highlighted', 'selected'));
      items[newIndex].classList.add('highlighted');
      items[newIndex].scrollIntoView({block: 'nearest', behavior: 'smooth'});
    }
  }
  
  // Delete multiple items
  async function deleteMultipleItems(items){
    if(!confirm(`Delete ${items.length} item(s)?`)) return;
    
    try{
      updateStatus('Deleting...', null);
      for(const item of items){
        const path = (currentPath ? currentPath + '/' : '') + item.name;
        const r = await fetch('/api/files/delete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({path: path, recursive: item.type === 'dir'})
        });
        if(!r.ok) throw new Error('Delete failed');
      }
      updateStatus('Deleted successfully', null);
      setTimeout(() => loadFiles(), 300);
    }catch(err){
      alert('Failed to delete: ' + err.message);
    }
  }
  
  // Close modal on outside click
  if(fmModal){
    fmModal.addEventListener('click', (e) => {
      if(e.target === fmModal) closeFileManager();
    });
  }
  
  // Close context menu on any click
  document.addEventListener('click', hideContextMenu);
  
  // Context menu item clicks
  if(fmContextMenu){
    fmContextMenu.querySelectorAll('.fm-context-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if(action) handleContextAction(action);
      });
    });
  }
  
  console.log('File Manager initialized successfully!');
  } // End initFileManager
})(); // End IIFE

// ============================================================================
// DOCTOR OPD INFORMATION MANAGEMENT
// ============================================================================

let opdData = {};
let activeOpdSpecialty = null;

function getAllOpdSpecialtiesFromDoctors(){
  try{
    const source = window.doctorsData || window.DOCTORS_DATA;
    if(!source) return [];
    const docs = Array.isArray(source.doctors) ? source.doctors : [];
    const seen = new Set();
    docs.forEach(d=>{
      if(d && d.specialty){ seen.add(d.specialty); }
    });
    const ordered = Array.isArray(source.specialty_order)
      ? source.specialty_order.filter(s=>seen.has(s))
      : [];
    const remaining = Array.from(seen).filter(s=>!ordered.includes(s)).sort();
    return [...ordered, ...remaining];
  }catch(e){
    console.error('getAllOpdSpecialtiesFromDoctors failed', e);
    return [];
  }
}

async function loadOpdData() {
  try {
    const res = await fetch('/api/opdinfo');
    const data = await res.json();
    opdData = data.data || {};

    // Ensure doctor specialties are available for OPD tabs
    if(!window.DOCTORS_DATA){
      try {
        const doctorsRes = await fetch('/api/doctors');
        const doctorsJson = await doctorsRes.json();
        window.DOCTORS_DATA = doctorsJson || {};
      } catch(e){
        console.error('Failed to preload doctors for OPD view', e);
      }
    }
    renderOpdSpecialtyTabs();
    if (Object.keys(opdData).length > 0) {
      activeOpdSpecialty = Object.keys(opdData)[0];
      renderOpdContent();
    }
  } catch (err) {
    console.error('Failed to load OPD data:', err);
  }
}

function renderOpdSpecialtyTabs() {
  const container = document.getElementById('opdSpecialtyTabs');
  if (!container) return;

  const fromDoctors = getAllOpdSpecialtiesFromDoctors();
  const specialties = fromDoctors.length ? fromDoctors : Object.keys(opdData).sort();
  if (specialties.length === 0) {
    container.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:13px">No specialties found from doctors list</div>';
    return;
  }
  
  container.innerHTML = specialties.map(spec => `
    <button 
      class="opd-tab ${spec === activeOpdSpecialty ? 'active' : ''}" 
      onclick="switchOpdSpecialty('${spec.replace(/'/g, "\\'")}')">
      ${escapeHtml(spec)}
    </button>
  `).join('');
}

function switchOpdSpecialty(specialty) {
  activeOpdSpecialty = specialty;
  renderOpdSpecialtyTabs();
  renderOpdContent();
}

function renderOpdContent() {
  const container = document.getElementById('opdSpecialtyContent');
  if (!container || !activeOpdSpecialty) return;
  
  const data = opdData[activeOpdSpecialty] || { morning: {}, evening: {} };
  
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Morning Shift -->
      <div style="background:linear-gradient(135deg, rgba(251,191,36,0.08), rgba(252,211,77,0.05));border:2px solid rgba(251,191,36,0.2);border-radius:16px;padding:20px">
        <h3 style="margin:0 0 16px;font-size:18px;color:#f59e0b;font-weight:800;display:flex;align-items:center;gap:8px">
          <span style="font-size:24px">🌅</span> Morning Shift
        </h3>
        ${renderOpdShiftForm('morning', data.morning)}
      </div>
      
      <!-- Evening Shift -->
      <div style="background:linear-gradient(135deg, rgba(139,92,246,0.08), rgba(167,139,250,0.05));border:2px solid rgba(139,92,246,0.2);border-radius:16px;padding:20px">
        <h3 style="margin:0 0 16px;font-size:18px;color:#8b5cf6;font-weight:800;display:flex;align-items:center;gap:8px">
          <span style="font-size:24px">🌆</span> Evening Shift
        </h3>
        ${renderOpdShiftForm('evening', data.evening)}
      </div>
    </div>
    
    <div style="margin-top:24px;display:flex;gap:12px">
      <button onclick="deleteOpdSpecialty()" class="toggle" style="background:linear-gradient(135deg, #ef4444, #dc2626);color:white;font-weight:600">
        🗑️ Delete ${escapeHtml(activeOpdSpecialty)}
      </button>
    </div>
  `;
}

function renderOpdShiftForm(shiftType, data) {
  const prefix = `opd_${shiftType}`;
  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Start Time
          <input type="time" id="${prefix}_start" value="${data.start || ''}" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Total Appointments
          <input type="number" id="${prefix}_total" value="${data.total_appointments || ''}" min="0" placeholder="e.g., 25" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Break (range or NO BREAK)
          <input type="text" id="${prefix}_break" value="${data.break_time || ''}" placeholder="e.g., 12:00-13:00" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Walk-in Till
          <input type="time" id="${prefix}_walkin" value="${data.walk_in_till || ''}" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
      </div>
      <div style="display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--panel)">
        <div style="font-size:12px;font-weight:700;color:var(--primary)">Before Break Session</div>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          OPD Duration (range)
          <input type="text" id="${prefix}_before_duration" value="${data.before_duration || ''}" placeholder="e.g., 09:30-11:30" maxlength="25" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Patients
          <input type="number" id="${prefix}_before" value="${data.before_break || ''}" min="0" placeholder="e.g., 15" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Informed To Come Before
          <input type="time" id="${prefix}_informed_before" value="${data.informed_before_break || ''}" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
      </div>
      <div style="display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--panel)">
        <div style="font-size:12px;font-weight:700;color:var(--accent)">After Break Session</div>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          OPD Duration (range)
          <input type="text" id="${prefix}_after_duration" value="${data.after_duration || ''}" placeholder="e.g., 12:30-15:00" maxlength="25" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Patients
          <input type="number" id="${prefix}_after" value="${data.after_break || ''}" min="0" placeholder="e.g., 10" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
        <label style="font-size:11px;display:flex;flex-direction:column;gap:4px">
          Informed To Come After
          <input type="time" id="${prefix}_informed_after" value="${data.informed_after_break || ''}" style="padding:8px;border:2px solid var(--border);border-radius:8px;background:var(--panel);font-size:13px" />
        </label>
      </div>
    </div>
  `;
}

async function saveAllOpd() {
  if (!activeOpdSpecialty) return;
  
  const msgEl = document.getElementById('opdSaveMsg');
  if (msgEl) msgEl.textContent = 'Saving...';
  
  // Collect morning data
  const morning = {
    start: document.getElementById('opd_morning_start').value,
    total_appointments: parseInt(document.getElementById('opd_morning_total').value) || null,
    before_duration: document.getElementById('opd_morning_before_duration')?.value || null,
    before_break: parseInt(document.getElementById('opd_morning_before').value) || null,
    break_time: document.getElementById('opd_morning_break').value || null,
    after_duration: document.getElementById('opd_morning_after_duration')?.value || null,
    after_break: parseInt(document.getElementById('opd_morning_after').value) || null,
    informed_before_break: document.getElementById('opd_morning_informed_before').value || null,
    informed_after_break: document.getElementById('opd_morning_informed_after').value || null,
    walk_in_till: document.getElementById('opd_morning_walkin').value || null
  };
  
  // Collect evening data
  const evening = {
    start: document.getElementById('opd_evening_start').value,
    total_appointments: parseInt(document.getElementById('opd_evening_total').value) || null,
    before_duration: document.getElementById('opd_evening_before_duration')?.value || null,
    before_break: parseInt(document.getElementById('opd_evening_before').value) || null,
    break_time: document.getElementById('opd_evening_break').value || null,
    after_duration: document.getElementById('opd_evening_after_duration')?.value || null,
    after_break: parseInt(document.getElementById('opd_evening_after').value) || null,
    informed_before_break: document.getElementById('opd_evening_informed_before').value || null,
    informed_after_break: document.getElementById('opd_evening_informed_after').value || null,
    walk_in_till: document.getElementById('opd_evening_walkin').value || null
  };
  
  opdData[activeOpdSpecialty] = { morning, evening };
  
  try {
    const res = await fetch('/api/opdinfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: opdData })
    });
    const result = await res.json();
    if (msgEl) msgEl.textContent = result.ok ? '✓ Saved successfully!' : '✗ Save failed';
    setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
  } catch (err) {
    console.error('Save failed:', err);
    if (msgEl) msgEl.textContent = '✗ Error saving';
  }
}

function addOpdSpecialty() {
  alert('Specialties are automatically loaded from the Doctors list. To add a new specialty here, first add a doctor with that specialty in the Doctors menu.');
}

function deleteOpdSpecialty() {
  if (!activeOpdSpecialty) return;
  if (!confirm(`Delete ${activeOpdSpecialty}?`)) return;
  
  delete opdData[activeOpdSpecialty];
  
  const remaining = Object.keys(opdData);
  activeOpdSpecialty = remaining.length > 0 ? remaining[0] : null;
  
  renderOpdSpecialtyTabs();
  if (activeOpdSpecialty) {
    renderOpdContent();
  } else {
    const container = document.getElementById('opdSpecialtyContent');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">📋</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">No Specialties Configured</div>
          <div style="font-size:13px">Click "Add Specialty" to create your first OPD template</div>
        </div>
      `;
    }
  }
  
  saveAllOpd();
}

// Initialize OPD section when clicked
document.querySelector('[data-target="doctor-opd"]')?.addEventListener('click', loadOpdData);
document.getElementById('addOpdSpecialtyBtn')?.addEventListener('click', addOpdSpecialty);
document.getElementById('saveAllOpdBtn')?.addEventListener('click', saveAllOpd);

// Helper function for escaping HTML (if not already defined)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add styles for OPD tabs
const opdStyles = document.createElement('style');
opdStyles.textContent = `
  .opd-tab {
    padding: 12px 20px;
    border: none;
    background: var(--panel);
    color: var(--text);
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    border-bottom: 3px solid transparent;
  }
  .opd-tab:hover {
    background: var(--card);
    transform: translateY(-2px);
  }
  .opd-tab.active {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: #06202e;
    border-bottom: 3px solid var(--primary);
    font-weight: 800;
  }
`;
document.head.appendChild(opdStyles);
