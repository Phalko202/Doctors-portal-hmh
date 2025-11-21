(function(){
  const root = document.getElementById('patientList');
  const boot = (window.__PATIENT_BOOTSTRAP__) || {specialty_order:[], doctors:[]};
  const datePill = document.getElementById('datePill');
  const slideMeta = document.getElementById('slideMeta');

  let sections = []; // [{title, docs}]
  // slides: [{blocks:[{title, doctors:[] }]}]
  let slides = [];
  let slideIdx = 0;  // index of slide
  let timer = null;
  let settings = boot.patient_display || {};
  let rotateMs = settings.rotate_ms || 12000; // dynamic slide interval
  let lastSnapshot = boot; // keep last merged snapshot for rebuilds
  // Updated layout: 4 columns x up to 4 rows (16 doctors max per slide)
  const ROWS = 4;
  const COLS = 4;
  const MAX_PER_SLIDE = ROWS * COLS; // 16

  function toAmPm(hhmm){
    if(!hhmm) return '';
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if(!m) return hhmm;
    let h = parseInt(m[1],10); const min = m[2];
    const am = h < 12; if(h === 0) h = 12; if(h > 12) h -= 12;
    return `${h}:${min} ${am? 'AM':'PM'}`;
  }

  // Format a single break entry like "11:00-12:00" to "11:00 AM–12:00 PM"
  function formatBreakEntry(entry){
    if(!entry || typeof entry !== 'string') return entry || '';
    // Normalize dashes and trim
    const norm = entry.replace(/\s*[-–—]\s*/, '-').trim();
    const parts = norm.split('-');
    if(parts.length === 2){
      const left = parts[0].trim();
      const right = parts[1].trim();
      // Only convert plain HH:MM; otherwise leave as-is
      const L = /^(\d{1,2}):(\d{2})$/.test(left) ? toAmPm(left) : left;
      const R = /^(\d{1,2}):(\d{2})$/.test(right) ? toAmPm(right) : right;
      return `${L}–${R}`; // en dash
    }
    // If comma-separated, map each segment
    if(norm.includes(',')){
      return norm.split(',').map(s=>formatBreakEntry(s.trim())).join(', ');
    }
    return norm;
  }

  // Accept string or array and return user-friendly AM/PM breaks
  function formatBreaks(value){
    if(Array.isArray(value)) return value.map(formatBreakEntry).join(', ');
    if(typeof value === 'string') return formatBreakEntry(value);
    return '';
  }

  function cardHTML(d){
    const breaks = formatBreaks(d.breaks);
    const subtitle = d.designation || d.specialty || '';
    const showStart = settings.show_start_time !== false;
    const showRoom = settings.show_room !== false;
    const showBreaks = settings.show_breaks !== false;
  // Starting time pill: force two-line layout (label then time) for better fitting
  const start = (showStart && d.start_time) ? `<div class="time-pill"><small style="display:block">STARTING TIME:</small><span class="time">${toAmPm(d.start_time)}</span></div>` : '';
    const room = (showRoom && d.room) ? `<span class="chip">Room: ${d.room.toString().toUpperCase()}</span>` : '';
    const brk = (showBreaks && breaks) ? `<span class="chip">Breaks: ${breaks}</span>` : '';
    return `
      <div class="doc-card">
        <img class="avatar" src="/doctor-photo/${d.id}?v=${d.image_version||1}" onerror="this.onerror=null;this.src='/static/img/default-doctor.png'" alt="${d.name}" />
        <div>
          <div class="nm">${d.name}</div>
          <div class="muted">${subtitle}</div>
          ${start}
          <div style="margin-top:12px">${room}${brk}</div>
        </div>
      </div>`;
  }

  function buildSections(snapshot){
    const specOrder = snapshot.specialty_order || [];
    const docs = (snapshot.doctors || [])
      .filter(d => (d.status || 'PENDING') === 'ON_DUTY'); // Only show ON_DUTY today

    const bySpec = new Map();
    specOrder.forEach(s=>bySpec.set(s, []));
    docs.forEach(d=>{
      const s = d.specialty || 'General';
      if(!bySpec.has(s)) bySpec.set(s, []);
      bySpec.get(s).push(d);
    });
    const out = [];
    bySpec.forEach((list, spec)=>{ if(list.length) out.push({title: spec, docs: list}); });
    return out;
  }

  function renderSlide(){
    // Fade old
    const old = root.firstElementChild;
    if(old){
      old.classList.add('fade-exit','fade-exit-active');
      setTimeout(()=>{ if(old && old.parentNode===root) root.removeChild(old); }, 380);
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-enter';
    root.appendChild(wrapper);
    const mount = wrapper; // render inside wrapper
    mount.innerHTML = '';
    if(!slides.length){
      const msg = document.createElement('div');
      msg.className = 'muted';
      msg.style.padding = '20px';
      msg.textContent = 'No doctors on duty today.';
      mount.appendChild(msg);
      return;
    }
    slideIdx = (slideIdx % slides.length + slides.length) % slides.length;
    const slide = slides[slideIdx];
    slide.blocks.forEach(block => {
      if(!block.doctors.length) return;
      if(block.profile){
        const d = block.doctors[0];
        const profile = document.createElement('div');
        profile.className = 'profile-slide';
        const breaks = formatBreaks(d.breaks);
        profile.innerHTML = `
          <img class="profile-photo" src="/doctor-photo/${d.id}?v=${d.image_version||1}" onerror="this.onerror=null;this.src='/static/img/default-doctor.png'" alt="${d.name}">
          <div class="profile-right">
            <div class="profile-desig">${(d.designation||d.specialty||'').toUpperCase()}</div>
            <div class="profile-name">${d.name}</div>
            <div class="profile-lines">
              ${settings.show_start_time !== false && d.start_time? `<div class='profile-line'><span class='lbl'>START</span> ${toAmPm(d.start_time)}</div>`:''}
              ${settings.show_room !== false && d.room? `<div class='profile-line'><span class='lbl'>ROOM</span> ${String(d.room).toUpperCase()}</div>`:''}
              ${settings.show_breaks !== false && breaks? `<div class='profile-line'><span class='lbl'>BREAKS</span> ${breaks}</div>`:''}
            </div>
          </div>`;
        mount.appendChild(profile);
      } else {
        const heading = document.createElement('div');
        heading.className = 'spec-heading';
        heading.textContent = block.title;
        mount.appendChild(heading);
        const container = document.createElement('div');
        container.className = 'doctor-list four-col-grid';
        block.doctors.forEach(doc => {
          const wrap = document.createElement('div');
          wrap.className = 'card';
          wrap.innerHTML = cardHTML(doc);
          container.appendChild(wrap);
        });
        mount.appendChild(container);
      }
    });
    // page indicator
    if(slideMeta){ slideMeta.textContent = `Slide ${slideIdx+1} / ${slides.length}`; }
    requestAnimationFrame(()=> wrapper.classList.add('fade-enter-active'));
  }

  function startSlideshow(){
    if(timer){ clearInterval(timer); timer = null; }
    if(slides.length <= 1){
      renderSlide();
      return;
    }
    renderSlide();
    timer = setInterval(() => { slideIdx = (slideIdx + 1) % slides.length; renderSlide(); }, rotateMs);
  }

  function mergeToday(base, today){
    const idx = new Map(base.doctors.map(d=>[String(d.id), d]));
    (today.doctors||[]).forEach(d=>{
      const k = String(d.id);
      const t = idx.get(k) || d;
      // update relevant fields
      ['designation','start_time','room','breaks','status','image_version','specialty','name'].forEach(f=>{
        if(d[f] !== undefined) t[f] = d[f];
      });
      idx.set(k, t);
    });
    return {specialty_order: today.specialty_order && today.specialty_order.length? today.specialty_order : base.specialty_order, doctors: Array.from(idx.values())};
  }

  function refreshView(snapshot){
    lastSnapshot = snapshot;
    sections = buildSections(snapshot);
    slides = [];
    const mode = settings.mode || (settings.flat_mode ? 'flat':'flat');
    if(mode === 'profile'){
      const allDocs = sections.flatMap(s=>s.docs);
      allDocs.forEach(d=> slides.push({blocks:[{title:'', doctors:[d], profile:true}]}));
    } else {
      const exclusive = settings.exclusive_multirow_specialty === true;
      const perSpec = settings.per_specialty_slides === true;
      const flat = settings.flat_mode === true;
      if(flat){
        const allDocs = sections.flatMap(s=>s.docs);
        for(let i=0;i<allDocs.length;i+=MAX_PER_SLIDE){
          const slice = allDocs.slice(i, i+MAX_PER_SLIDE);
          slides.push({blocks:[{title:'', doctors:slice}]});
        }
      } else if(perSpec){
        sections.forEach(sec => {
          const docs = [...sec.docs];
          for(let i=0;i<docs.length;i+=MAX_PER_SLIDE){
            slides.push({blocks:[{title: sec.title, doctors: docs.slice(i,i+MAX_PER_SLIDE)}]});
          }
        });
      } else if(exclusive){
        sections.forEach(sec => {
          const docs = [...sec.docs];
          if(docs.length>4){
            for(let i=0;i<docs.length;i+=MAX_PER_SLIDE){
              slides.push({blocks:[{title: sec.title, doctors: docs.slice(i,i+MAX_PER_SLIDE)}]});
            }
          } else {
            // merge small later
          }
        });
        const smalls = sections.filter(s=>s.docs.length<=4 && s.docs.length>0);
        let current = {blocks:[], used:0};
        const finalize = () => { if(current.used>0){ slides.push({blocks: current.blocks}); } };
        smalls.forEach(sec => {
          let remaining = [...sec.docs];
          while(remaining.length){
            if(current.used === MAX_PER_SLIDE){ finalize(); current = {blocks:[], used:0}; }
            const space = MAX_PER_SLIDE - current.used;
            const slice = remaining.slice(0, space);
            remaining = remaining.slice(slice.length);
            current.blocks.push({title: sec.title, doctors: slice});
            current.used += slice.length;
          }
        });
        finalize();
      } else {
        let current = {blocks:[], used:0};
        const finalize = () => { if(current.used>0){ slides.push({blocks: current.blocks}); } };
        sections.forEach(sec => {
          let remaining = [...sec.docs];
          while(remaining.length){
            if(current.used === MAX_PER_SLIDE){ finalize(); current = {blocks:[], used:0}; }
            const space = MAX_PER_SLIDE - current.used;
            const slice = remaining.slice(0, space);
            remaining = remaining.slice(slice.length);
            current.blocks.push({title: sec.title, doctors: slice});
            current.used += slice.length;
          }
        });
        finalize();
      }
    }
    slideIdx = 0;
    startSlideshow();
  }

  async function load(){
    try{
      const j = await fetch('/api/doctors',{cache:'no-store'}).then(r=>r.json());
      refreshView(mergeToday(boot, j));
    }catch(e){
      refreshView(boot);
    }
  }

  // First paint from boot snapshot
  refreshView(boot);
  // Fetch live
  load();
  // Refresh every 2 minutes
  setInterval(load, 120000);

  // Set date pill to today's friendly date if available
  try{
    if(datePill){
      const now = new Date();
      const fmt = now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      datePill.textContent = fmt;
    }
  }catch{}

  // Live updates via SSE (same channel used by PR display), refresh on doctor_update/closure_update
  try{
    const es = new EventSource('/events');
    es.addEventListener('doctor_update', ()=> load());
    es.addEventListener('specialty_order_updated', ()=> load());
    es.addEventListener('closure_update', ()=> load());
    es.addEventListener('patient_display_settings', (ev)=>{
      try{
        const data = JSON.parse(ev.data||'{}');
        if(data){
          settings = {...settings, ...data};
          if(data.rotate_ms){
            const newMs = parseInt(data.rotate_ms);
            if(!isNaN(newMs) && newMs !== rotateMs){ rotateMs = newMs; }
          }
          // Rebuild slides using lastSnapshot so live data persists
          refreshView(lastSnapshot);
        }
      }catch{}
    });
  }catch{ /* SSE not critical */ }
})();
