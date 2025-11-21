// URL toggle: add ?showHidden=1 to show LEAVE/SICK
const params = new URLSearchParams(location.search);
const SHOW_HIDDEN = params.get('showHidden') === '1';

let lastDoctorSnapshot = new Map(); // id -> serialized subset for change detection

// --- Name length helper (added / extended) ---
function applyNameLengthClasses(el, name){
  if(!el) return;
  el.classList.remove('long-name','very-long-name','extreme-name','ultra-name','auto-shrink','clamped');
  if(!name) return;
  const len = name.trim().length;
  if(len > 48) el.classList.add('ultra-name');
  else if(len > 38) el.classList.add('extreme-name');
  else if(len > 28) el.classList.add('very-long-name');
  else if(len > 18) el.classList.add('long-name');
  // After font size decision, clamp check executed later
}

// Normalize any HH:MM(:SS) occurrences in free text to HH:MM and pad hour to 2 digits
function normalizeTimeText(str){
  if(str == null) return '';
  const s = String(str);
  return s.replace(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/g, (_m, h, m)=> `${String(h).padStart(2,'0')}:${m}`);
}

function setOrToggle(el, visible){
  if(!el) return;
  el.style.display = visible ? '' : 'none';
}

function ensureScheduleContainer(el){
  let blk = el.querySelector('.schedule-block');
  if(!blk){
    blk = document.createElement('div');
    blk.className = 'schedule-block';
    blk.innerHTML = '<div class="groups" data-field="schedule_groups"></div>';
    const textCol = el.querySelector('.text-col');
    textCol && textCol.appendChild(blk);
  }
  return blk.querySelector('[data-field="schedule_groups"]');
}

function hasSchedule(d){
  return (typeof d.patient_count === 'number') ||
         (Array.isArray(d.opd) && d.opd.length > 0) ||
         (Array.isArray(d.breaks) && d.breaks.length > 0) ||
         (Array.isArray(d.before_break_opd) && d.before_break_opd.length>0) ||
         (Array.isArray(d.after_break_opd) && d.after_break_opd.length>0) ||
         !!d.after_break_note;
}

// Helper: statuses that remove the doctor until a schedule is posted
function isHideStatus(st){
  // No longer hide leave/sick/off_duty; only hide if explicitly hidden status (none currently)
  return false;
}

function toMinutes(t){
  // t: "HH:MM" string
  if(!t) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(String(t).trim());
  if(!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1],10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2],10)));
  return h*60+mm;
}

function splitRange(rng){
  // returns [a,b] mins
  const m = /^\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*$/.exec(String(rng));
  if(!m) return [null,null];
  return [toMinutes(m[1]), toMinutes(m[2])];
}

function renderScheduleLines(container, d){
  if(!container) return;
  const chip = (range, count)=> `<span class="chip">${normalizeTimeText(range)}${(typeof count==='number' && !isNaN(count))?` • ${count} pts`:''}</span>`;
  const chipCountOnly = (count)=> `<span class="chip">${count} pts</span>`;
  // Breaks list
  const breakRanges = Array.isArray(d.breaks) ? d.breaks.map(x=>String(x).trim()).filter(Boolean) : [];
  let groups = [];
  if(typeof d.patient_count === 'number'){
    groups.push(`<div class="group" data-type="patients"><div class="group-title">PATIENTS</div><div>${chip(d.patient_count + ' pts')}</div></div>`);
  }
  const explicitBefore = Array.isArray(d.before_break_opd) ? d.before_break_opd : null;
  const explicitAfter  = Array.isArray(d.after_break_opd) ? d.after_break_opd : null;
  if(explicitBefore || explicitAfter){
    const norm = arr => (arr||[]).map(o=>({range: o.range || o.r || '', count: typeof o.count==='number'?o.count: (typeof o.c==='number'?o.c: undefined)})).filter(x=>x.range);
    const before = norm(explicitBefore);
    const after = norm(explicitAfter);
    const beforeHasCounts = before.some(s=> typeof s.count === 'number');
    const afterHasCounts  = after.some(s=> typeof s.count === 'number');
    if(before.length){
      groups.push(`<div class="group" data-type="opd-pre"><div class="group-title">BEFORE BREAK OPD</div><div>${before.map(s=>chip(s.range,s.count)).join('')}</div></div>`);
      if(!beforeHasCounts && typeof d.before_break_opd_patients === 'number'){
        groups.push(`<div class="group" data-type="patients"><div class="group-title">BEFORE BREAK PATIENTS</div><div>${chip(d.before_break_opd_patients + ' pts')}</div></div>`);
      }
    }
    if(breakRanges.length){
      groups.push(`<div class="group" data-type="break"><div class="group-title">BREAK</div><div>${breakRanges.map(b=>chip(b)).join('')}</div></div>`);
    }
    if(after.length || d.after_break_note){
      const chips = after.length ? after.map(s=>chip(s.range,s.count)).join('') : chip(d.after_break_note);
      groups.push(`<div class="group" data-type="opd-post"><div class="group-title">AFTER BREAK OPD</div><div>${chips}</div></div>`);
      if(after.length && !afterHasCounts && typeof d.after_break_opd_patients === 'number'){
        groups.push(`<div class="group" data-type="patients"><div class="group-title">AFTER BREAK PATIENTS</div><div>${chip(d.after_break_opd_patients + ' pts')}</div></div>`);
      }
    }
  } else {
    // Fallback to old logic using d.opd and break split
    // Read OPD source (can be strings or {range,count})
    const src = Array.isArray(d.opd) ? d.opd : [];
    const withCount = [];
    const withoutCount = [];
    for(const s of src){
      let rng = '';
      let cnt = null;
      if(typeof s === 'string') rng = s.trim();
      else if(s && typeof s === 'object' && s.range){ rng = String(s.range).trim(); cnt = (typeof s.count === 'number') ? s.count : null; }
      if(!rng) continue;
      if(typeof cnt === 'number') withCount.push({range:rng,count:cnt}); else withoutCount.push(rng);
    }
    // Build break intervals/split point
    const breakIntervals = breakRanges.map(r => splitRange(r)).filter(([a,b])=> a!=null && b!=null);
    let splitAt = null; if(breakRanges.length){ const [bStart] = splitRange(breakRanges[0]); if(bStart!=null) splitAt = bStart; }
    const slots = [];
    for(const s of withCount){
      const [a,b] = splitRange(s.range); let overlapsBreak=false; if(a!=null&&b!=null){ for(const [ba,bb] of breakIntervals){ if(a<bb && b>ba){ overlapsBreak=true; break; } } }
      if(!overlapsBreak) slots.push({range:s.range,count:s.count,start:a});
    }
    for(const rng of withoutCount){
      const [a,b] = splitRange(rng); let overlapsBreak=false; if(a!=null&&b!=null){ for(const [ba,bb] of breakIntervals){ if(a<bb && b>ba){ overlapsBreak=true; break; } } }
      if(!overlapsBreak) slots.push({range:rng,count:undefined,start:a});
    }
    let before = [], after = [];
    for(const sl of slots){ if(splitAt==null || sl.start==null) before.push(sl); else (sl.start < splitAt ? before : after).push(sl); }
    const beforeHasCounts = before.some(s=> typeof s.count === 'number');
    const afterHasCounts  = after.some(s=> typeof s.count === 'number');
    if(breakRanges.length === 0){
      if(slots.length){ groups.push(`<div class="group" data-type="opd"><div class="group-title">OPD</div><div>${slots.map(s=>chip(s.range,s.count)).join('')}</div></div>`); }
    } else {
      if(before.length){
        groups.push(`<div class="group" data-type="opd-pre"><div class="group-title">BEFORE BREAK OPD</div><div>${before.map(s=>chip(s.range,s.count)).join('')}</div></div>`);
        if(!beforeHasCounts && typeof d.before_break_opd_patients === 'number'){
          groups.push(`<div class="group" data-type="patients"><div class="group-title">BEFORE BREAK PATIENTS</div><div>${chip(d.before_break_opd_patients + ' pts')}</div></div>`);
        }
      } else if(typeof d.before_break_opd_patients === 'number'){
        // Fallback: show group with count only when no explicit slots are present
        groups.push(`<div class="group" data-type="opd-pre"><div class="group-title">BEFORE BREAK OPD</div><div>${chipCountOnly(d.before_break_opd_patients)}</div></div>`);
      }
      groups.push(`<div class="group" data-type="break"><div class="group-title">BREAK</div><div>${breakRanges.map(b=>chip(b)).join('')}</div></div>`);
      if(after.length){
        groups.push(`<div class="group" data-type="opd-post"><div class="group-title">AFTER BREAK OPD</div><div>${after.map(s=>chip(s.range,s.count)).join('')}</div></div>`);
        if(!afterHasCounts && typeof d.after_break_opd_patients === 'number'){
          groups.push(`<div class="group" data-type="patients"><div class="group-title">AFTER BREAK PATIENTS</div><div>${chip(d.after_break_opd_patients + ' pts')}</div></div>`);
        }
      } else if(typeof d.after_break_opd_patients === 'number' || d.after_break_note){
        // Fallback: show group using count-only chip or note when no explicit slots are present
        const content = (typeof d.after_break_opd_patients === 'number') ? chipCountOnly(d.after_break_opd_patients) : chip(d.after_break_note);
        groups.push(`<div class="group" data-type="opd-post"><div class="group-title">AFTER BREAK OPD</div><div>${content}</div></div>`);
      }
    }
  }
  const html = groups.join('');
  container.innerHTML = html;
  container.parentElement.style.display = html ? '' : 'none';
}

function formatWarn(status, reason){
  const base = (status||'').replace('_',' ');
  let dur = '';
  if(reason){
    const m1 = /\(([^)]+)\)/.exec(reason);
    const m2 = /\bfor\s+([^.;,]+)/i.exec(reason);
    dur = (m1 && m1[1]) || (m2 && m2[1]) || '';
  }
  const prefix = '⚠️ ';
  const body = reason ? `${base}: ${reason}` : base;
  return dur ? `${prefix}${body} • Duration: ${dur}` : `${prefix}${body}`;
}

function diffKey(d){
  return JSON.stringify({
    s:d.status,
    st:d.start_time,
    pc:d.patient_count,
    opd:d.opd,
    br:d.breaks,
    rm:d.room,
    rv:d.image_version,
    rs:d.status_reason
  });
}

function formatTimeAgo(iso){
  if(!iso) return '';
  try {
    const ts = Date.parse(iso);
    if(isNaN(ts)) return '';
    const now = Date.now();
    const diff = Math.max(0, now - ts);
    const mins = Math.floor(diff/60000);
    if(mins < 1) return 'just now';
    if(mins < 60) return mins+'m ago';
    const hrs = Math.floor(mins/60);
    if(hrs < 24) return hrs+'h ago';
    const days = Math.floor(hrs/24);
    return days+'d ago';
  } catch { return ''; }
}

function ensureMetaSide(el){
  let side = el.querySelector('.meta-side');
  if(!side){
    side = document.createElement('div');
    side.className = 'meta-side';
    el.appendChild(side);
  }
  return side;
}

function updateLastUpdate(el, d){
  // Removed display of relative 'x ago' per request
  const side = ensureMetaSide(el);
  const lu = side.querySelector('.last-update');
  if(lu) lu.remove();
}

function markEmptySpecialties(){
  document.querySelectorAll('.specialty').forEach(sec=>{
    const rowsDiv = sec.querySelector('.rows');
    if(!rowsDiv) return;
    const visible = Array.from(rowsDiv.children).some(ch=>ch.style.display !== 'none');
    if(!visible){
      sec.classList.add('empty');
      if(!rowsDiv.querySelector('.empty-msg')){
        const div = document.createElement('div');
        div.className='empty-msg';
        div.textContent='No doctors on duty';
        rowsDiv.appendChild(div);
      }
    } else {
      sec.classList.remove('empty');
      const em = rowsDiv.querySelector('.empty-msg');
      if(em) em.remove();
    }
  });
}

function updateCards(data){
  for(const d of data.doctors){
    const el = document.querySelector(`[data-id="${d.id}"]`);
    if(!el) continue;
    const prevKey = lastDoctorSnapshot.get(d.id);
    const curKey = diffKey(d);
    const changed = prevKey && prevKey !== curKey;
    lastDoctorSnapshot.set(d.id, curKey);
    if(changed){
      el.classList.add('status-changed');
      setTimeout(()=> el.classList.remove('status-changed'), 2600);
    }
  updateLastUpdate(el, d);
    const hideByStatus = isHideStatus(d.status);
    el.style.display = hideByStatus ? 'none' : '';
    
    // Check if PENDING status - if so, hide start time display
    const doctorIsPending = !d.status || d.status.toUpperCase() === 'PENDING' || d.status === '';
    
    // Hide the entire start-line element for PENDING doctors
    const startLineEl = el.querySelector('.start-line');
    if(startLineEl) {
      startLineEl.style.display = doctorIsPending ? 'none' : '';
    }
    
    const st = el.querySelector('[data-field="start_time"]'); 
    if(st) {
      if(doctorIsPending) {
        st.textContent = '';  // Clear start time for PENDING
      } else {
        st.textContent = normalizeTimeText(d.start_time || '');
      }
    }
    
    const stEl = el.querySelector('[data-field="status"]'); if(stEl) stEl.textContent = (d.status || '').replace('_',' ');
    el.classList.remove('on_duty','off_duty','sick','leave','on_call','hidden','pending','status-flag','status-cancel');
    if(d.status) el.classList.add(d.status.toLowerCase());
    else el.classList.add('pending');  // Add pending class if no status
    const img = el.querySelector('img');
    if(img){ const u = new URL(img.src, location.origin); u.searchParams.set('v', d.image_version); img.src = u.href; }
    const des = el.querySelector('[data-field="designation"]');
    if(des){ des.textContent = d.designation || d.specialty || ''; setOrToggle(des, !!(d.designation || d.specialty)); }
    const namePill = el.querySelector('.name-pill');
    if(namePill){
      let displayName = d.name || ''; const originalName = displayName;
      if(displayName.length > 34) displayName = displayName.replace(/^Dr[.\s]+/i,'');
      if(displayName.length > 48){
        const parts = displayName.split(/\s+/).filter(Boolean);
        if(parts.length > 3){
          const first = parts[0], last = parts[parts.length-1];
          const middleInitials = parts.slice(1,-1).map(p=>p[0].toUpperCase()+'.').join(' ');
          const compressed = `${first} ${middleInitials} ${last}`;
          if(compressed.length + 3 < displayName.length) displayName = compressed;
        }
      }
      namePill.textContent = displayName; namePill.title = originalName;
      applyNameLengthClasses(namePill, displayName);
    }
    const roomChip = el.querySelector('[data-field="room"]');
    if(roomChip){
      // Hide room for PENDING doctors regardless of data
      if(doctorIsPending || !d.room){
        roomChip.style.display = 'none';
      } else {
        roomChip.textContent = 'Room: ' + String(d.room);
        roomChip.style.display = '';
      }
    }
    // Ensure overlay element
    let overlay = el.querySelector('[data-status-overlay]');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'status-cover';
      overlay.setAttribute('data-status-overlay','');
      el.appendChild(overlay);
    }
    // Determine badge
    const upper = (d.status||'').toUpperCase();
    let badge='';
    overlay.className='status-cover';
    
    // CRITICAL: Check for PENDING status FIRST - if status is PENDING or empty, always show PENDING badge
    // This prevents any schedule data from appearing for PENDING doctors
    const isPending = !d.status || upper === 'PENDING' || upper === '';
    
    if(isPending) {
      // PENDING state - show awaiting schedule regardless of any other fields
      badge='PENDING: AWAITING SCHEDULE';
      overlay.classList.add('pending');
    }
    // Map only explicit statuses we want to visibly show (only if NOT pending)
    else if(upper==='SICK' || upper==='SICK LEAVE') { badge='SICK LEAVE'; overlay.classList.add('sick'); }
    else if(upper==='LEAVE' || upper==='ANNUAL LEAVE') { badge='ON LEAVE'; overlay.classList.add('leave'); }
    else if(['OPD CANCELLED','CANCELLED','CANCELED'].includes(upper)) { badge='OPD CANCELLED'; overlay.classList.add('cancel'); }
    else if(upper==='OFF_DUTY' && /cancelled|canceled/i.test(d.status_reason||'')) { badge='OPD CANCELLED'; overlay.classList.add('cancel'); }
    else if(upper==='ON_CALL') { badge='ON CALL'; overlay.classList.add('oncall'); }
    else {
      // For ON_DUTY or other active statuses, check if schedule exists
      const scheduleExists = hasSchedule(d);
      if(!scheduleExists) {
        // Active status but no schedule data yet - show pending
        badge='PENDING: AWAITING SCHEDULE';
        overlay.classList.add('pending');
      }
    }
    // If we have a reason (e.g., 'Medical leave (23/09/2025 till 26/09/2025)'), display it under the badge
    // BUT: Don't show reason for PENDING status
    const reasonText = (d.status_reason||'').trim();
    if(badge){
      const esc = s=> String(s).replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
      // Only show reason if NOT pending
      const showReason = !isPending && reasonText;
      overlay.innerHTML = esc(badge) + (showReason? `<div class="small">${esc(reasonText)}</div>` : '');
      overlay.style.display='block';
    } else {
      overlay.style.display='none'; overlay.textContent='';
    }
    // Render schedule only if not inactive, not pending, and schedule exists
    const groupsEl = ensureScheduleContainer(el);
    const inactive = ['SICK','SICK LEAVE','LEAVE','ANNUAL LEAVE','OPD CANCELLED','CANCELLED','CANCELED'].includes(upper);
    // CRITICAL: Don't show schedule for PENDING doctors even if they have schedule data
    if(hasSchedule(d) && !inactive && !isPending){
      renderScheduleLines(groupsEl, d);
    } else {
      if(groupsEl){ groupsEl.innerHTML=''; groupsEl.parentElement && (groupsEl.parentElement.style.display='none'); }
    }
  }
  markEmptySpecialties();
}

// Initial snapshot is driven by the window data renderer to avoid partial/early states

// --- Live updating: SSE with robust auto-reconnect + background poll safety net ---
let pollTimer = null;
function ensurePolling(){
  if(pollTimer) return;
  pollTimer = setInterval(()=>{
    syncCurrentDay();
  }, 8000); // slower safety net; SSE drives fast updates
}
function syncCurrentDay(){
  const viewedIso = (windowData && windowData[currentDayOffset] && windowData[currentDayOffset].date) || todayIso;
  const url = '/api/day?date='+encodeURIComponent(viewedIso);
  fetch(url, {cache:'no-store'}).then(r=>r.json()).then(d=>{ if(d && (d.doctors||d.doctors===0)) updateCards(d); }).catch(()=>{});
}
let es = null;
let esRetryDelay = 1000;
function startSSE(){
  try{
    es = new EventSource('/events');
    esRetryDelay = 1000; // reset on successful open
    ensurePolling();
  es.onopen = ()=>{ /* connection established */ };
    es.addEventListener('doctor_update', e => { try {
      const payload = JSON.parse(e.data);
  const viewedIso = (windowData && windowData[currentDayOffset] && windowData[currentDayOffset].date) || todayIso;
      if(payload.date && payload.date !== viewedIso){ return; }
      // If doctor data included, patch it directly for instant UI update
      if(payload.doctor && payload.doctor.id && windowData){
        updateCards({doctors:[payload.doctor]});
      }
  // Then fetch the exact day to keep consistency
  const url = '/api/day?date='+encodeURIComponent(viewedIso);
      fetch(url, {cache:'no-store'}).then(r=>r.json()).then(d=>{ if(d && d.doctors) updateCards(d); }).catch(()=>{});
    } catch {} });
  es.addEventListener('closure_update', ()=>{ 
    console.log('[SSE] Closure update received, reloading closures...');
    fetch('/api/closures',{cache:'no-store'}).then(r=>r.json()).then(c=>{ 
      closuresCache = c && c.dates ? c.dates : {}; 
      console.log('[SSE] Closures reloaded:', closuresCache);
      if(windowData && windowData[currentDayOffset]){
        const currentDate = windowData[currentDayOffset].date;
        console.log('[SSE] Updating banner for:', currentDate);
        updateClosureBanner(currentDate);
        // Force display update to show/hide closure overlay
        updateDisplayForDay(currentDayOffset);
      }
    }); 
  });
    es.addEventListener('branding_updated', ()=>{ const logo=document.getElementById('logoImg'); if(logo){ const u=new URL(logo.src, location.origin); u.searchParams.set('v', Date.now()); logo.src=u.href; } });
  es.addEventListener('specialty_order_updated', e=>{ try { const d=JSON.parse(e.data); if(Array.isArray(d.order)){ applySpecialtyOrder(d.order); } }catch{} });
  es.addEventListener('schedule_cleared', e=>{ 
    try { 
      const payload=JSON.parse(e.data); 
      const viewedIso=(windowData&&windowData[currentDayOffset]&&windowData[currentDayOffset].date)||todayIso;
      if(payload.date===viewedIso){ 
        // Force full reload of the current day to reflect cleared schedules
        loadWindowData(todayIso); 
      }
    }catch{} 
  });
    es.onerror = ()=>{
      // Will trigger readyState==2 (closed). Close and schedule reconnect.
      try{ es.close(); }catch{}
      setTimeout(()=>{ es = null; startSSE(); }, esRetryDelay);
      esRetryDelay = Math.min(30000, esRetryDelay * 1.7);
    };
  }catch{
    ensurePolling();
  }
}
startSSE();
ensurePolling();

let currentDayOffset = 0;
let windowData = null;
let closuresCache = null; // {dateIso: {reason:'', reasons:[...]}}
const DISALLOW_BACK_NAV = false; // allow navigation back to index 0 (today) only
let todayIso = (window.displayConfig && window.displayConfig.todayIso) || (new Date().toISOString().slice(0,10)); // changed const->let to allow midnight roll
const totalDays = (window.displayConfig && window.displayConfig.days) || 14;
const prevBtn = document.getElementById('prevDateBtn');
const nextBtn = document.getElementById('nextDateBtn');
function isoAddDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
}
async function loadClosures(){
  try{ const r = await fetch('/api/closures').then(r=>r.json()); closuresCache = r && r.dates ? r.dates : {}; }catch{ closuresCache = {}; }
}
function updateClosureBanner(dateIso){
  const banner = document.getElementById('closureBanner');
  const serverBanner = document.getElementById('todayServerClosure');
  if(!banner) return;
  if(!closuresCache){ banner.style.display='none'; return; }
  const rec = closuresCache[dateIso];
  if(rec){
    if(serverBanner) serverBanner.style.display='none';
    const txt = rec.reason || (rec.reasons && rec.reasons[rec.reasons.length-1]) || 'TODAY IS A OPD CLOSED DAY';
    banner.textContent = txt;
    banner.style.display='block';
  } else {
    banner.style.display='none';
    if(serverBanner && dateIso === todayIso){ serverBanner.style.display='block'; }
  }
}
function clearAllDoctorRows(){
  document.querySelectorAll('.spec-grid .specialty .rows').forEach(r=>{ r.innerHTML=''; });
}
function setNavDisabled(){
  if(!windowData) return;
  if(prevBtn){
    prevBtn.disabled = currentDayOffset <= 0; // index 0 is today (can't go earlier)
    prevBtn.style.visibility='';
  }
  if(nextBtn) nextBtn.disabled = currentDayOffset >= windowData.length-1;
}
async function loadWindowData(startOverride){
  const start = startOverride || 'auto';
  const url = `/api/window?start=${encodeURIComponent(start)}&days=${totalDays}`;
  windowData = await fetch(url).then(r=>r.json()).then(r=>r.window||r);
  if(closuresCache===null) await loadClosures();
  // Find index of today in returned window (should be 0 after backend skip of past days)
  currentDayOffset = 0;
  updateDisplayForDay(currentDayOffset);
  // After building DOM for the day, hydrate with the exact snapshot for that date to avoid any gaps
  try{
    const dayIso = windowData[currentDayOffset]?.date;
    if(dayIso){
      const d = await fetch('/api/day?date='+encodeURIComponent(dayIso), {cache:'no-store'}).then(r=>r.json());
      if(d && d.doctors) updateCards(d);
    }
  }catch{}
  setNavDisabled();
}
// Midnight roll / prevent navigating before real today
function maybeRollToday(){
  const realToday = new Date().toISOString().slice(0,10);
  if(realToday !== todayIso){
    // If the actual date advanced, replace base window so user cannot go to past day
    todayIso = realToday;
    loadWindowData(realToday);
  }
}
// Call periodically (every 5 min) to ensure date rolls if display left open overnight
setInterval(maybeRollToday, 5*60*1000);
// Also check before navigation attempts
if(prevBtn) prevBtn.addEventListener('click', ()=>{ 
  console.log('[NAV] Prev clicked, current offset:', currentDayOffset);
  maybeRollToday();
  if(currentDayOffset>0){ 
    console.log('[NAV] Moving to offset:', currentDayOffset-1);
    updateDisplayForDay(currentDayOffset-1);
  } 
});
if(nextBtn) nextBtn.addEventListener('click', ()=>{ 
  console.log('[NAV] Next clicked, current offset:', currentDayOffset);
  maybeRollToday();
  if(windowData && currentDayOffset < windowData.length-1){ 
    console.log('[NAV] Moving to offset:', currentDayOffset+1);
    updateDisplayForDay(currentDayOffset+1);
  } 
});
loadWindowData();
// --- periodic relative time refresh ---
setInterval(()=>{
  document.querySelectorAll('.last-update').forEach(el=>{
    const ts = el.getAttribute('data-ts');
    if(ts) el.textContent = formatTimeAgo(ts);
  });
}, 60000);

// --- Added: date navigation day renderer (previously missing -> console error) ---
function formatDisplayDate(iso){
  if(!iso) return '';
  const d = new Date(iso+'T00:00:00');
  const opts = {weekday:'short', day:'2-digit', month:'short', year:'numeric'};
  try{ return d.toLocaleDateString(undefined, opts).toUpperCase(); }catch{ return iso; }
}
function buildDoctorRow(d){
  const row = document.createElement('div');
  row.className = `doc-row ${(d.status||'').toLowerCase()}`;
  row.setAttribute('data-id', d.id);
  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '0');
  row.setAttribute('aria-label', `View details for ${d.name || 'doctor'}`);
  
  // Add direct onclick as ultimate fallback
  row.onclick = function(e){
    if(e.target.closest('.status-modal')) return;
    e.preventDefault();
    e.stopPropagation();
    showDoctorModal(d.id);
  };
  
  // Also handle keyboard enter key
  row.onkeydown = function(e){
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      showDoctorModal(d.id);
    }
  };
  
  // Check if doctor is PENDING - if so, don't show start time or room
  const isPendingDoctor = !d.status || d.status.toUpperCase() === 'PENDING' || d.status === '';
  const showStart = !isPendingDoctor;
  
  let html = `
    <div class="text-col">
      <div class="doc-head">
        <div class="avatar-wrap">
          <img class="avatar" src="/doctor-photo/${d.id}?v=${d.image_version||1}" alt="Avatar" onerror="this.onerror=null;this.src='/static/img/default-doctor.png';this.alt='Avatar';" />
          <span class="status-dot" aria-hidden="true"></span>
        </div>
        <div class="title-wrap">
          <div class="name-pill"></div>
          <div class="sub" data-field="designation"></div>
        </div>
      </div>`;
  if(showStart){
    html += `<div class="start-line">STARTING TIME: <span class="time" data-field="start_time">${normalizeTimeText(d.start_time||'')}</span></div>`;
    html += `<div class="mini"><span class="chip" data-field="room" style="display:none"></span></div>`;
  }
  html += `<div class="warn" data-field="status_warn" style="display:none"></div>`;
  html += `</div>`;
  html += `<div class="status-cover" data-status-overlay style="display:none"></div>`;
  row.innerHTML = html;
  return row;
}
function updateDisplayForDay(offset){
  if(!windowData) return;
  if(offset < 0 || offset >= windowData.length) return;
  currentDayOffset = offset;
  const day = windowData[offset];
  const dateDisp = document.getElementById('dateDisplay');
  if(dateDisp) dateDisp.textContent = formatDisplayDate(day.date);
  
  const grid = document.getElementById('specGrid');
  // Ensure a dedicated closure overlay container exists so we don't destroy the grid structure
  let closedOverlay = grid && grid.querySelector('.closure-overlay');
  if(grid && !closedOverlay){
    closedOverlay = document.createElement('div');
    closedOverlay.className = 'closure-overlay';
    closedOverlay.style.display = 'none';
    closedOverlay.style.margin = '20px auto';
    closedOverlay.style.maxWidth = '800px';
    grid.prepend(closedOverlay);
  }
  
  // DEBUG: Log current date and closure status
  console.log('[CLOSURE CHECK]', 'Checking date:', day.date);
  console.log('[CLOSURE CHECK]', 'Closures cache:', closuresCache);
  console.log('[CLOSURE CHECK]', 'Is closed?:', !!(closuresCache && closuresCache[day.date]));
  
  // CLOSED DAYS CHECK: Show custom closure overlay for closed public holidays
  // CRITICAL: Must check exact date match in cache
  const isClosed = closuresCache && Object.prototype.hasOwnProperty.call(closuresCache, day.date);
  if(isClosed){
    const closureInfo = closuresCache[day.date];
    const customMessage = closureInfo.reason || 'TODAY IS A PUBLIC HOLIDAY';
    if(grid && closedOverlay){
      closedOverlay.innerHTML = `
        <div style="text-align:center;padding:60px 20px;background:linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.08));border:3px dashed rgba(239,68,68,0.3);border-radius:24px;">
          <div style="font-size:72px;margin-bottom:20px">🏥</div>
          <h2 style="font-size:32px;font-weight:900;color:#dc2626;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">${customMessage}</h2>
          <p style="font-size:18px;color:#7f1d1d;font-weight:600;margin-bottom:8px">Hospital Closed for Regular OPD</p>
          <p style="font-size:14px;color:#991b1b;opacity:0.9">Emergency services remain available 24/7</p>
        </div>`;
      closedOverlay.style.display = 'block';
      // Hide all specialty sections but keep them in the DOM so they can be restored on navigation
      grid.querySelectorAll('.specialty').forEach(sec=> sec.style.display='none');
    }
    // Ensure per-day banner reflects closure too
    updateClosureBanner(day.date);
    setNavDisabled();
    return;
  } else {
    // Not closed: ensure overlay is hidden and sections are visible
    if(closedOverlay){ closedOverlay.style.display='none'; closedOverlay.innerHTML=''; }
    if(grid){ grid.querySelectorAll('.specialty').forEach(sec=> sec.style.display=''); }
  }
  // Re-group doctors by specialty with optimized DOM updates
  const bySpec = {};
  day.doctors.forEach(d=>{ (bySpec[d.specialty] = bySpec[d.specialty]||[]).push(d); });
  
  // Use DocumentFragment for batch DOM updates (better performance)
  document.querySelectorAll('.specialty').forEach(sec=>{
    const spec = sec.querySelector('.spec-title')?.textContent?.trim();
    const rows = sec.querySelector('.rows'); if(!rows) return;
    
    // Create fragment to batch all row insertions
    const fragment = document.createDocumentFragment();
    (bySpec[spec]||[]).forEach(d=> fragment.appendChild(buildDoctorRow(d)) );
    
    // Single DOM update instead of multiple appendChild calls
    rows.innerHTML = '';
    rows.appendChild(fragment);
  });
  
  // After constructing DOM, run standard update pipeline for statuses/schedules
  updateCards(day);
  setNavDisabled();
  updateClosureBanner(day.date);
}
function applySpecialtyOrder(order){
  // Reorder specialty sections in DOM to match new order
  const grid = document.getElementById('specGrid'); if(!grid) return;
  const sections = Array.from(grid.querySelectorAll('.specialty'));
  const byName = new Map(sections.map(sec=>[sec.querySelector('.spec-title')?.textContent?.trim(), sec]));
  order.forEach(name=>{ const sec = byName.get(name); if(sec) grid.appendChild(sec); });
}
// expose for debugging
window.updateDisplayForDay = updateDisplayForDay;

// ============ DOCTOR STATUS MODAL FUNCTIONALITY ============
let currentModalDoctor = null;

function createModalHTML(){
  const modalDiv = document.createElement('div');
  modalDiv.id = 'doctorModal';
  modalDiv.className = 'status-modal';
  modalDiv.style.display = 'none';
  modalDiv.innerHTML = `
    <div class="status-modal-backdrop" onclick="closeDoctorModal()"></div>
    <div class="status-modal-card">
      <div class="status-modal-header">
        <h3>Doctor Details</h3>
        <button class="status-modal-close" onclick="closeDoctorModal()" aria-label="Close">×</button>
      </div>
      <div class="status-modal-body">
        <div class="modal-doctor-photo">
          <img id="modalDoctorPhoto" src="" alt="Doctor Photo">
        </div>
        <div class="modal-doctor-name" id="modalDoctorName"></div>
        <div class="modal-doctor-specialty" id="modalDoctorSpecialty"></div>
        
        <div id="modalStatusBadge" class="status-badge-large">
          <span class="status-icon">✓</span>
          <span id="modalStatusText">ON DUTY</span>
        </div>
        
        <div id="modalStatusNote" class="status-note" style="display:none">
          <div class="note-icon">ℹ️</div>
          <div class="note-text" id="modalNoteText"></div>
        </div>
        
        <div class="status-info-grid" id="modalInfoGrid"></div>
        
        <div id="modalScheduleDetails" style="margin-top:20px"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);
  return modalDiv;
}

function getStatusInfo(status){
  const statusMap = {
    'ON_DUTY': { icon: '✓', text: 'ON DUTY', class: 'status-on' },
    'LEAVE': { icon: '🏖️', text: 'ON LEAVE', class: 'status-leave' },
    'SICK': { icon: '🏥', text: 'SICK LEAVE', class: 'status-sick' },
    'OFF_DUTY': { icon: '⊗', text: 'OFF DUTY', class: 'status-offduty' },
    'ON_CALL': { icon: '📞', text: 'ON CALL', class: 'status-oncall' },
    'PENDING': { icon: '⏳', text: 'AWAITING SCHEDULE', class: 'status-pending' }
  };
  return statusMap[status] || { icon: '?', text: status || 'UNKNOWN', class: 'status-pending' };
}

function showDoctorModal(doctorId){
  const modal = document.getElementById('doctorModal') || createModalHTML();
  
  // Find doctor data from current display
  let doctor = null;
  if(windowData && windowData[currentDayOffset]){
    doctor = windowData[currentDayOffset].doctors.find(d => d.id === doctorId);
  }
  
  if(!doctor){
    // Coerce id type and retry lookup
    if(windowData && windowData[currentDayOffset]){
      doctor = windowData[currentDayOffset].doctors.find(d => String(d.id) === String(doctorId));
    }
    if(!doctor) return;
  }
  
  currentModalDoctor = doctor;
  
  // Populate modal
  const photoImg = document.getElementById('modalDoctorPhoto');
  // Hint browser to decode asynchronously for smoother opening
  try{ photoImg.decoding = 'async'; }catch{}
  try{ photoImg.loading = 'eager'; }catch{}
  photoImg.src = `/doctor-photo/${doctor.id}?v=${doctor.image_version||1}`;
  photoImg.onerror = function(){ this.src = '/static/img/default-doctor.png'; };
  
  const docNameText = doctor.name || 'Unknown';
  document.getElementById('modalDoctorName').textContent = docNameText;
  // Also append a small name caption under the photo for extra visibility
  try{
    const photoWrap = document.getElementById('modalDoctorPhoto')?.parentElement;
    if(photoWrap && !photoWrap.querySelector('.modal-name-caption')){
      const cap = document.createElement('div');
      cap.className = 'modal-name-caption';
      cap.textContent = docNameText;
      photoWrap.appendChild(cap);
    } else if(photoWrap){
      const cap = photoWrap.querySelector('.modal-name-caption');
      if(cap) cap.textContent = docNameText;
    }
  }catch{}
  // Keep header static to reduce jitter; show name only inside content
  try{
    const hdr = document.querySelector('#doctorModal .status-modal-header h3');
    if(hdr){ hdr.textContent = 'Doctor Details'; }
  }catch{}
  document.getElementById('modalDoctorSpecialty').textContent = (doctor.designation || doctor.specialty || '');
  
  // Status badge
  const statusInfo = getStatusInfo(doctor.status);
  const statusBadge = document.getElementById('modalStatusBadge');
  statusBadge.className = 'status-badge-large ' + statusInfo.class;
  statusBadge.querySelector('.status-icon').textContent = statusInfo.icon;
  document.getElementById('modalStatusText').textContent = statusInfo.text;
  
  // Status note
  const statusNote = document.getElementById('modalStatusNote');
  const isPendingModal = !doctor.status || doctor.status.toUpperCase() === 'PENDING';
  if(doctor.status_reason && !isPendingModal){
    document.getElementById('modalNoteText').textContent = doctor.status_reason;
    statusNote.style.display = 'flex';
  } else {
    statusNote.style.display = 'none';
  }
  
  // Info grid - show schedule details when available
  const infoGrid = document.getElementById('modalInfoGrid');
  infoGrid.innerHTML = '';
  
  // Check if doctor has actual per-date schedule entry
  const hasActualSchedule = hasSchedule(doctor);
  
  // IMPORTANT: Don't show schedule for PENDING status - treat like other pending doctors
  const isPending = !doctor.status || doctor.status.toUpperCase() === 'PENDING';
  
  // Show schedule info if available (including for ON_CALL status) BUT NOT for PENDING
  // Always show starting time if present (bug fix), even if other schedule details are missing
  const showScheduleInfo = (!isPending && (hasActualSchedule || (doctor.status && ['ON_DUTY', 'ON_CALL'].includes(doctor.status.toUpperCase())))) || !!doctor.start_time;
  
  if(showScheduleInfo && doctor.start_time){
    infoGrid.innerHTML += `
      <div class="status-info-item">
        <div class="info-icon">🕐</div>
        <div class="info-label">Starting Time</div>
        <div class="info-value">${doctor.start_time}</div>
      </div>
    `;
  }
  
  if(showScheduleInfo && doctor.room){
    infoGrid.innerHTML += `
      <div class="status-info-item">
        <div class="info-icon">🚪</div>
        <div class="info-label">Room</div>
        <div class="info-value">${doctor.room}</div>
      </div>
    `;
  }
  
  // Schedule details
  const scheduleDiv = document.getElementById('modalScheduleDetails');
  scheduleDiv.innerHTML = '';
  
  // Only show schedule sections if NOT pending and has actual schedule
  if(!isPending && hasSchedule(doctor)){
    // Helper to convert 08:00-11:00 => [08:00 TO 11:00]
    const toBracketTo = (rng)=>{
      if(!rng) return '';
      const m = /\b(\d{1,2}:?\d{0,2})\s*-\s*(\d{1,2}:?\d{0,2})\b/.exec(rng);
      if(!m) return `[${rng}]`;
      const a = m[1].replace(/(\d{1,2})(\d{2})$/, '$1:$2');
      const b = m[2].replace(/(\d{1,2})(\d{2})$/, '$1:$2');
      return `[${a} TO ${b}]`;
    };
    const sumCounts = (arr)=> Array.isArray(arr) ? arr.reduce((acc,s)=> acc + (typeof s.count==='number'?s.count:(typeof s.c==='number'?s.c:0)), 0) : 0;
    const hasAnyRange = (arr)=> Array.isArray(arr) && arr.some(s=> (s.range||s.r));

    // Determine values for template
    const dayIso = (windowData && windowData[currentDayOffset] && windowData[currentDayOffset].date) || '';
    const dparts = dayIso ? dayIso.split('-') : null; // yyyy-mm-dd
    const dateDisp = dparts ? `${dparts[2]}/${dparts[1]}/${dparts[0]}` : '';
    const nameLine = doctor.name || '';
    const startLine = doctor.start_time || '';
    const roomLine = doctor.room || '';
    const totalPts = (typeof doctor.patient_count==='number') ? doctor.patient_count : '';

    const beforeRanges = (Array.isArray(doctor.before_break_opd)? doctor.before_break_opd: []).map(s=> toBracketTo(s.range||s.r)).filter(Boolean);
    const afterRanges  = (Array.isArray(doctor.after_break_opd)? doctor.after_break_opd: []).map(s=> toBracketTo(s.range||s.r)).filter(Boolean);
    const beforePts = (typeof doctor.before_break_opd_patients==='number') ? doctor.before_break_opd_patients : (hasAnyRange(doctor.before_break_opd) ? sumCounts(doctor.before_break_opd) : '');
    const afterPts  = (typeof doctor.after_break_opd_patients==='number') ? doctor.after_break_opd_patients : (hasAnyRange(doctor.after_break_opd) ? sumCounts(doctor.after_break_opd) : '');
    const breaksLine = Array.isArray(doctor.breaks) && doctor.breaks.length ? doctor.breaks.map(b=> `[${b}]`).join(', ') : '[NO BREAK]';

    // No/zero handling for clarity
    const afterOpdText = afterRanges.length ? afterRanges.join(', ') : (doctor.after_break_note ? doctor.after_break_note : 'No after break');
    const afterPtsText = (afterRanges.length || typeof afterPts==='number') ? (typeof afterPts==='number' ? `${afterPts} pts` : '') : '';
    const beforeOpdText = beforeRanges.length ? beforeRanges.join(', ') : 'No before break';
    const beforePtsText = (beforeRanges.length || typeof beforePts==='number') ? (typeof beforePts==='number' ? `${beforePts} pts` : '') : '';

    // Build improved layout with sections
    scheduleDiv.innerHTML = `
      <div class="schedule-section-header">📋 Schedule Details</div>
      
      <div class="schedule-total-highlight">
        <div class="total-icon">👥</div>
        <div class="total-label">TOTAL NO OF PATIENTS</div>
        <div class="total-value">${totalPts || 'N/A'}</div>
      </div>
      
      <div class="schedule-sections">
        <div class="schedule-card before-break">
          <div class="schedule-card-header">
            <span class="schedule-emoji">🌅</span>
            <span class="schedule-title">BEFORE BREAK OPD</span>
          </div>
          <div class="schedule-card-body">
            <div class="schedule-time">${beforeOpdText}</div>
            ${beforePtsText ? `<div class="schedule-count">Before break patients: <strong>${beforePtsText}</strong></div>` : ''}
          </div>
        </div>
        
        <div class="schedule-card break-time">
          <div class="schedule-card-header">
            <span class="schedule-emoji">☕</span>
            <span class="schedule-title">BREAK</span>
          </div>
          <div class="schedule-card-body">
            <div class="schedule-time">${Array.isArray(doctor.breaks) && doctor.breaks.length ? doctor.breaks.join(', ') : 'NO BREAK'}</div>
          </div>
        </div>
        
        <div class="schedule-card after-break">
          <div class="schedule-card-header">
            <span class="schedule-emoji">🌆</span>
            <span class="schedule-title">AFTER BREAK OPD</span>
          </div>
          <div class="schedule-card-body">
            <div class="schedule-time">${afterOpdText}</div>
            ${afterPtsText ? `<div class="schedule-count">After break patients: <strong>${afterPtsText}</strong></div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="copy-ready-section">
        <div class="copy-header">📄 Copy-Ready Format</div>
        <pre class="format-block">Date: ${dateDisp}
Name: ${nameLine}
Starting time: ${startLine}
Room: ${roomLine}
Total no of patients: ${totalPts}
Before break OPD: ${beforeOpdText}
Before break patients: ${beforePtsText}
Break: ${Array.isArray(doctor.breaks) && doctor.breaks.length ? doctor.breaks.join(', ') : 'NO BREAK'}
After break OPD: ${afterOpdText}
After break patients: ${afterPtsText}</pre>
      </div>
    `;
  }
  
  // Show modal with smooth animation
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.style.opacity = '0';
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 0.2s ease-out';
      modal.style.opacity = '1';
    });
  });
  document.body.style.overflow = 'hidden';
}

function closeDoctorModal(){
  const modal = document.getElementById('doctorModal');
  if(modal){
    modal.style.transition = 'opacity 0.15s ease-in';
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 150);
  }
  currentModalDoctor = null;
}

// Add click event listener to all doctor cards using event delegation
// Multiple listeners to ensure clicks are always captured
document.addEventListener('click', function(e){
  // Don't trigger if clicking inside modal
  if(e.target.closest('.status-modal')) return;
  
  const docRow = e.target.closest('.doc-row');
  if(docRow){
    const doctorId = docRow.getAttribute('data-id');
    if(doctorId){
      e.preventDefault();
      e.stopPropagation();
      showDoctorModal(doctorId);
    }
  }
}, true); // Use capture phase

// Also add in bubble phase as fallback
document.addEventListener('click', function(e){
  if(e.target.closest('.status-modal')) return;
  if(e.defaultPrevented) return; // Already handled
  
  const docRow = e.target.closest('.doc-row');
  if(docRow){
    const doctorId = docRow.getAttribute('data-id');
    if(doctorId){
      e.preventDefault();
      e.stopPropagation();
      showDoctorModal(doctorId);
    }
  }
}, false); // Bubble phase

// Close modal on escape key
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    closeDoctorModal();
  }
});

// Keyboard activation for server-rendered rows (Enter/Space)
document.addEventListener('keydown', function(e){
  if(e.defaultPrevented) return;
  const isActivationKey = (e.key === 'Enter' || e.key === ' ');
  if(!isActivationKey) return;
  const docRow = e.target && e.target.classList && e.target.classList.contains('doc-row') ? e.target : (e.target && e.target.closest && e.target.closest('.doc-row'));
  if(docRow){
    const doctorId = docRow.getAttribute('data-id');
    if(doctorId){
      e.preventDefault();
      showDoctorModal(doctorId);
    }
  }
});

// Expose functions globally
window.showDoctorModal = showDoctorModal;
window.closeDoctorModal = closeDoctorModal;

// Log to confirm modal code is loaded
console.log('Doctor modal functionality loaded');

