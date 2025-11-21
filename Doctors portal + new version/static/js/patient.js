(function(){
  const root = document.getElementById('patientList');
  const boot = (window.__PATIENT_BOOTSTRAP__) || {specialty_order:[], doctors:[]};

  let allDoctors = []; // All doctors (for slideshow)
  let slideIdx = 0;
  let timer = null;
  let settings = boot.patient_display || {};
  let rotateMs = settings.rotate_ms || 12000;
  let lastSnapshot = boot;
  // Apply any initial display prefs
  if(settings.fill_mode){
    document.body.dataset.pdFill = settings.fill_mode;
  }
  if(settings.display_resolution){
    document.body.dataset.pdRes = settings.display_resolution;
  }

  // Format time to AM/PM
  function toAmPm(hhmm){
    if(!hhmm) return '';
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if(!m) return hhmm;
    let h = parseInt(m[1],10); const min = m[2];
    const am = h < 12; if(h === 0) h = 12; if(h > 12) h -= 12;
    return `${h}:${min} ${am? 'AM':'PM'}`;
  }

  // Format breaks range
  function formatBreakEntry(entry){
    if(!entry || typeof entry !== 'string') return entry || '';
    const norm = entry.replace(/\s*[-–—]\s*/, '-').trim();
    const parts = norm.split('-');
    if(parts.length === 2){
      const left = parts[0].trim();
      const right = parts[1].trim();
      const L = /^(\d{1,2}):(\d{2})$/.test(left) ? toAmPm(left) : left;
      const R = /^(\d{1,2}):(\d{2})$/.test(right) ? toAmPm(right) : right;
      return `${L}–${R}`;
    }
    if(norm.includes(',')){
      return norm.split(',').map(s=>formatBreakEntry(s.trim())).join(', ');
    }
    return norm;
  }

  function formatBreaks(value){
    if(Array.isArray(value)) return value.map(formatBreakEntry).join(', ');
    if(typeof value === 'string') return formatBreakEntry(value);
    return '';
  }

  // Build doctor list: include only doctors (sorted) – posters preferred
  function buildDoctorList(snapshot){
    const docs = (snapshot.doctors || []).slice().sort((a,b)=> a.name.localeCompare(b.name));
    return docs;
  }

  // Render one slide
  function renderSlide(){
    const old = root.firstElementChild;
    if(old){
      old.classList.add('fade-exit','fade-exit-active');
      setTimeout(()=>{ if(old && old.parentNode===root) root.removeChild(old); }, 650);
    }

    if(!allDoctors.length){
      const msg = document.createElement('div');
      msg.style.cssText = 'color:#fff;text-align:center;padding:50px;font-size:24px;font-weight:700';
      msg.textContent = 'No doctors available';
      root.appendChild(msg);
      return;
    }

    slideIdx = (slideIdx % allDoctors.length + allDoctors.length) % allDoctors.length;
    const d = allDoctors[slideIdx];

  const slide = document.createElement('div');
  slide.className = 'promo-slide active fade-enter';

    if(d.promo_version){
      const imgUrl = `/doctor-promo/${d.id}?v=${d.promo_version}`;
      // Foreground poster image only (no blurred background layer)
      const img = document.createElement('img');
      img.className='promo-bg';
      img.alt=d.name;
      img.src = imgUrl;
      img.onload = ()=>{
        const ar = img.naturalWidth / img.naturalHeight; // poster aspect
        const vw = window.innerWidth, vh = window.innerHeight;
        const vr = vw / Math.max(1, vh); // viewport aspect
        document.body.classList.remove('fit-contain','fit-cover-centered','fit-top');
        // Prefer explicit fill_mode from admin if provided
        const explicitFill = document.body.dataset.pdFill || 'auto';
        if(explicitFill === 'cover'){
          document.body.classList.add('fit-cover-centered');
        } else if(explicitFill === 'contain'){
          document.body.classList.add('fit-contain');
        } else {
          // Auto: choose best fit. If poster is very tall vs a wide screen, use contain to avoid cropping; otherwise cover.
          const veryTallPoster = ar < 0.75; // e.g., phone-shot portrait
          const wideScreen = vr >= 1.6;
          if(veryTallPoster && wideScreen){
            document.body.classList.add('fit-contain');
          } else {
            document.body.classList.add('fit-cover-centered');
          }
        }
        // After layout, compute overlay anchor
        requestAnimationFrame(()=>{
          const overlayEl = slide.querySelector('.schedule-overlay');
          if(overlayEl){
            const rect = img.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const gap = 28; // space between poster and overlay
            // Only reposition next to poster on LANDSCAPE screens; keep planned layout on portrait
            if(vw > vh && rect.width < vw * 0.9){
              const leftEdge = rect.left + rect.width + gap;
              if(leftEdge < vw - 200){
                overlayEl.classList.add('dynamic-pos');
                overlayEl.style.left = leftEdge + 'px';
                overlayEl.style.right = 'auto';
                overlayEl.style.transform = 'translateY(-50%)';
              }
            }
          }
        });
      };
      img.onerror = ()=>{ img.remove(); document.body.classList.remove('fit-contain','fit-cover-centered','fit-top'); };
      slide.appendChild(img);
    } else {
      // No promotional image yet: neutral gradient background
      slide.style.background = 'linear-gradient(135deg,#071c26,#0d2d3b)';
      slide.classList.add('no-promo');
    }

  // Schedule overlay: show ONLY if doctor has explicit per-date schedule (_has_today set)
    const hasSchedule = d._has_today === true;
    const overlay = document.createElement('div');
    overlay.className = 'schedule-overlay';
    if(hasSchedule){
      const today = new Date();
      const dateStr = today.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      let html = `<div class="date-header">${dateStr}</div>`;
      html += `<div class="info-row"><span class="lbl">DOCTOR</span><span class="val">${d.name}</span></div>`;
      if(d.specialty) html += `<div class="info-row"><span class="lbl">SPECIALTY</span><span class="val">${d.specialty}</span></div>`;
      if(d.start_time) html += `<div class="info-row"><span class="lbl">OPD START TIME</span><span class="val">${toAmPm(d.start_time)}</span></div>`;
      const breaks = formatBreaks(d.breaks);
      if(breaks) html += `<div class="info-row"><span class="lbl">BREAK TIME</span><span class="val">${breaks}</span></div>`;
      if(d.room) html += `<div class="info-row"><span class="lbl">ROOM NO</span><span class="val">${String(d.room).toUpperCase()}</span></div>`;
      overlay.innerHTML = html;
    } else {
      overlay.classList.add('empty');
      overlay.innerHTML = '<div class="placeholder">NO OPD SCHEDULE TODAY</div>';
    }
    slide.appendChild(overlay);

    root.appendChild(slide);
    requestAnimationFrame(()=> slide.classList.add('fade-enter-active'));
  }

  function startSlideshow(){
    if(timer){ clearInterval(timer); timer = null; }
    renderSlide();
    if(allDoctors.length > 1){
      timer = setInterval(() => { slideIdx++; renderSlide(); }, rotateMs);
    }
  }

  function mergeToday(base, today){
    const idx = new Map(base.doctors.map(d=>[String(d.id), d]));
    (today.doctors||[]).forEach(d=>{
      const k = String(d.id);
      const t = idx.get(k) || d;
      ['designation','start_time','room','breaks','status','image_version','promo_version','specialty','name','_has_today'].forEach(f=>{
        if(d[f] !== undefined) t[f] = d[f];
      });
      idx.set(k, t);
    });
    return {specialty_order: today.specialty_order && today.specialty_order.length? today.specialty_order : base.specialty_order, doctors: Array.from(idx.values())};
  }

  function refreshView(snapshot){
    lastSnapshot = snapshot;
    allDoctors = buildDoctorList(snapshot).filter(d=> true); // keep all; backend fallback handles missing
    slideIdx = 0;
    startSlideshow();
  }

  function todayISO(){
    // Prefer server-provided ISO (Maldives TZ) from bootstrap if present
    return (boot && (boot.today_iso || (boot.patient_display && boot.patient_display.today_iso))) || (new Date().toISOString().slice(0,10));
  }

  async function load(){
    try{
      // Base doctor list
      const base = await fetch('/api/doctors',{cache:'no-store'}).then(r=>r.json());
      // Per-date overrides
      let perDate = { doctors: [] };
      try{
        perDate = await fetch(`/api/day?date=${todayISO()}`, {cache:'no-store'}).then(r=> r.ok ? r.json() : {doctors:[]});
      }catch(_){ /* ignore */ }
      // Build a map of base doctors
      const baseMap = new Map();
      (base.doctors||[]).forEach(d=> baseMap.set(String(d.id), {...d}));
      const scheduleSet = new Set();
      // Apply per-date overrides and mark _has_today flag
      (perDate.doctors||[]).forEach(d=>{
        const id = String(d.id);
        scheduleSet.add(id);
        const target = baseMap.get(id) || {};
        ['designation','start_time','room','breaks','status','image_version','promo_version','specialty','name'].forEach(f=>{
          if(d[f] !== undefined && d[f] !== null) target[f] = d[f];
        });
        target._has_today = true;
        baseMap.set(id, target);
      });
      // For doctors without a per-date entry, clear schedule related fields to avoid stale display
      baseMap.forEach((doc, id)=>{
        if(!scheduleSet.has(id)){
          doc._has_today = false;
          delete doc.start_time;
          delete doc.breaks;
          delete doc.room;
          // keep status but overlay logic will require _has_today
        }
      });
      const merged = { specialty_order: perDate.specialty_order && perDate.specialty_order.length ? perDate.specialty_order : (base.specialty_order||[]), doctors: Array.from(baseMap.values()) };
      // Merge with boot (startup snapshot) for any static meta, then refresh
      const finalSnap = mergeToday(boot, merged);
      refreshView(finalSnap);
    }catch(e){
      refreshView(boot);
    }
  }

  // Initial render
  refreshView(boot);
  load();
  setInterval(load, 120000); // Refresh every 2 minutes

  // Live updates via SSE
  try{
    const es = new EventSource('/events');
    es.addEventListener('doctor_update', ()=> setTimeout(load, 200));
    es.addEventListener('specialty_order_updated', ()=> load());
    es.addEventListener('closure_update', ()=> load());
    es.addEventListener('patient_display_settings', (ev)=>{
      try{
        const data = JSON.parse(ev.data||'{}');
        if(data){
          settings = {...settings, ...data};
          if(data.fill_mode){ document.body.dataset.pdFill = data.fill_mode; }
          if(data.display_resolution){ document.body.dataset.pdRes = data.display_resolution; }
          if(data.rotate_ms){
            const newMs = parseInt(data.rotate_ms);
            if(!isNaN(newMs) && newMs !== rotateMs){ rotateMs = newMs; }
          }
          refreshView(lastSnapshot);
        }
      }catch{}
    });
  }catch{}
})();
