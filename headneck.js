/* headneck.js — "Head & neck 3D" for dentistry: the whole head and neck at full resolution (Z-Anatomy original meshes), with
   layers (bones, teeth, nose & sinuses, larynx, mouth & pharynx, eye & ear, muscles, brain, other), a sagittal-section slider
   (to look into the nasal cavity and sinuses) and tap-to-identify. Self-contained WebGL1 viewer. Each layer is a separate file
   (hn3d/hn_<layer>.bin) fetched only when it is switched on. Model: Z-Anatomy (github.com/LluisV/Z-Anatomy), CC BY-SA 4.0. */
'use strict';
window.__hnLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };

  Object.assign(STR, {
    hn3d: { en: 'Head & neck 3D', ar: 'الرأس والرقبة 3D' },
    hn3dSub: { en: 'Full-detail head and neck: layers, nose & sinuses, section', ar: 'الرأس والرقبة بأعلى جودة: طبقات، الأنف والجيوب، مقطع' },
  });

  /* layer → [en, ar, colour, on by default] */
  const LAYERS = [
    ['bone', 'Bones & skull', 'العظام والجمجمة', [0.90, 0.85, 0.72], 1],
    ['teeth', 'Teeth', 'الأسنان', [0.97, 0.96, 0.90], 1],
    ['nose', 'Nose & sinuses', 'الأنف والجيوب', [0.45, 0.78, 0.92], 1],
    ['mouth', 'Mouth & pharynx', 'الفم والبلعوم', [0.92, 0.52, 0.55], 1],
    ['larynx', 'Larynx', 'الحنجرة', [0.78, 0.70, 0.95], 1],
    ['eyear', 'Eye & ear', 'العين والأذن', [0.40, 0.80, 0.60], 0],
    ['muscle', 'Muscles', 'العضلات', [0.78, 0.30, 0.28], 0],
    ['brain', 'Brain', 'المخ', [0.93, 0.74, 0.74], 0],
    ['misc', 'Other', 'تراكيب أخرى', [0.88, 0.76, 0.42], 0],
  ];
  const LKEY = LAYERS.map((l) => l[0]);

  const css = document.createElement('style');
  css.textContent = '.hnstage{position:relative;height:min(56vh,440px);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 38%,var(--surface2),var(--bg2));border:1px solid var(--line);touch-action:none}.hnstage canvas{width:100%;height:100%;display:block}' +
    '.hnmsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:var(--muted);font-size:14px;pointer-events:none}' +
    '.hnlay{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}.hnlay button{border:1px solid var(--line);background:var(--surface2);color:var(--text);border-radius:999px;padding:6px 12px;font-size:12.5px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:6px}' +
    '.hnlay button i{width:10px;height:10px;border-radius:50%;background:var(--c);opacity:.35}.hnlay button.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.hnlay button.on i{opacity:1;box-shadow:0 0 0 2px #fff6}' +
    '.hnlay button.busy{opacity:.6}.hnsec{margin:8px 0;display:flex;align-items:center;gap:10px}.hnsec input{flex:1}' +
    '.hncard{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:10px 14px;margin:6px 0;min-height:44px}.hncard b{font-size:16px;display:block}.hncard small{color:var(--muted)}';
  document.head.appendChild(css);

  /* ───────── data ───────── */
  const cache = {};
  async function loadLayer(key) {
    if (cache[key]) return cache[key];
    const r = await fetch('hn3d/hn_' + key + '.bin');
    if (!r.ok) throw new Error('http ' + r.status);
    const buf = await r.arrayBuffer(), hl = new DataView(buf).getUint32(0, true);
    const hdr = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))), base = 4 + hl;
    hdr.parts.forEach((p) => {
      const o = base + p.o;
      p.q = new Uint16Array(buf, o, p.nv * 3); p.nq = new Int8Array(buf, o + p.nv * 6, p.nv * 4); p.idx = new Uint16Array(buf, o + p.nv * 10, p.ni);
    });
    return (cache[key] = hdr);
  }

  /* ───────── shaders ───────── */
  const VS = 'attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uVP;uniform vec3 uLo;uniform vec3 uSpan;varying vec3 vN;varying vec3 vP;' +
    'void main(){vec3 p=uLo+aPos*uSpan;vN=aNor;vP=p;gl_Position=uVP*vec4(p,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec3 vP;uniform vec3 uCol;uniform vec3 uEye;uniform float uClip;uniform float uClipX;uniform float uPick;uniform float uSel;' +
    'void main(){if(uClip>0.5&&vP.x<uClipX)discard;' +
    'if(uPick>0.5){gl_FragColor=vec4(uCol,1.0);return;}' +
    'vec3 n=normalize(vN);vec3 v=normalize(uEye-vP);if(dot(n,v)<0.0)n=-n;vec3 l=normalize(v+vec3(-.25,.45,0.));' +
    'float d=max(dot(n,l),0.0);float f=max(dot(n,v),0.0);vec3 hv=normalize(l+v);float sp=pow(max(dot(n,hv),0.0),40.0)*.16;float rim=pow(1.0-f,3.0)*.08;' +
    'vec3 base=mix(uCol,vec3(1.0,.86,.2),uSel*.55);' +
    'vec3 c=base*(.46+.32*d+.26*f)+vec3(sp)+vec3(rim);gl_FragColor=vec4(pow(min(c,vec3(1.0)),vec3(.95)),1.0);}';
  const sh = (gl, type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };

  let cur = null;
  function stop() { if (cur) { cur.dead = true; try { const x = cur.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* ignore */ } cur = null; } }

  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

  function viewer(cv) {
    const gl = cv.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: false }) || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(pr);
    const loc = (n) => gl.getUniformLocation(pr, n), at = (n) => gl.getAttribLocation(pr, n);
    const U = { vp: loc('uVP'), lo: loc('uLo'), span: loc('uSpan'), col: loc('uCol'), eye: loc('uEye'), clip: loc('uClip'), clipX: loc('uClipX'), pick: loc('uPick'), sel: loc('uSel') };
    const aPos = at('aPos'), aNor = at('aNor');
    gl.enableVertexAttribArray(aPos); gl.enableVertexAttribArray(aNor);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0);
    const mk = (target, arr) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, arr, gl.STATIC_DRAW); return b; };
    const st = { gl, dead: false, yaw: 0, pitch: 0.05, dist: 0.6, tx: 0, ty: 1.53, tz: 0.08, vx: 0, vy: 0, drag: false, auto: false, layers: {}, parts: [], sel: null, clip: false, clipX: 0, nextId: 1, byId: {}, lo: [9, 9, 9], hi: [-9, -9, -9] };
    st.addLayer = (key, data) => {
      const lay = LAYERS.find((l) => l[0] === key), col = lay[3], list = [];
      data.parts.forEach((p) => {
        const id = st.nextId++, j = hash(p.en + p.side), k = 0.88 + 0.24 * j;
        const o = { id, layer: key, en: p.en, ar: p.ar, side: p.side, n: p.ni, lo: p.lo, span: [p.hi[0] - p.lo[0], p.hi[1] - p.lo[1], p.hi[2] - p.lo[2]], col: [Math.min(1, col[0] * k), Math.min(1, col[1] * k), Math.min(1, col[2] * k)],
          pcol: [(id & 255) / 255, ((id >> 8) & 255) / 255, ((id >> 16) & 255) / 255], bp: mk(gl.ARRAY_BUFFER, p.q), bn: mk(gl.ARRAY_BUFFER, p.nq), bi: mk(gl.ELEMENT_ARRAY_BUFFER, p.idx) };
        for (let a = 0; a < 3; a++) { st.lo[a] = Math.min(st.lo[a], p.lo[a]); st.hi[a] = Math.max(st.hi[a], p.hi[a]); }
        list.push(o); st.byId[id] = o;
      });
      st.layers[key] = { parts: list, on: true };
    };
    const size = () => { const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), h = Math.max(2, Math.round(cv.clientHeight * d)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } gl.viewport(0, 0, w, h); };
    const drawAll = (eye, vp, pick) => {
      gl.uniformMatrix4fv(U.vp, false, vp); gl.uniform3f(U.eye, eye[0], eye[1], eye[2]);
      gl.uniform1f(U.clip, st.clip ? 1 : 0); gl.uniform1f(U.clipX, st.clipX); gl.uniform1f(U.pick, pick ? 1 : 0);
      for (const key in st.layers) {
        const L = st.layers[key]; if (!L.on) continue;
        L.parts.forEach((p) => {
          if (st.iso && st.sel && p !== st.sel) return;
          const c = pick ? p.pcol : p.col; gl.uniform3f(U.col, c[0], c[1], c[2]); gl.uniform1f(U.sel, p === st.sel ? 1 : 0);
          gl.uniform3f(U.lo, p.lo[0], p.lo[1], p.lo[2]); gl.uniform3f(U.span, p.span[0], p.span[1], p.span[2]);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.bp); gl.vertexAttribPointer(aPos, 3, gl.UNSIGNED_SHORT, true, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.bn); gl.vertexAttribPointer(aNor, 3, gl.BYTE, true, 4, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.bi); gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
        });
      }
    };
    const camMat = () => {
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const eye = [st.tx + st.dist * cp * sy, st.ty + st.dist * sp, st.tz + st.dist * cp * cy];
      return { eye, vp: mat4Mul(mat4Perspective(0.62, cv.width / cv.height, 0.02, 8), mat4LookAt(eye, [st.tx, st.ty, st.tz], [0, 1, 0])) };
    };
    let last = performance.now();
    function frame(now) {
      if (st.dead || !cv.isConnected || cv.offsetParent === null) { stop(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; size();
      if (!st.drag) { st.yaw += st.vy; st.pitch += st.vx; st.vy *= 0.92; st.vx *= 0.92; if (st.auto) st.yaw += dt * 0.3; }
      st.pitch = Math.max(-1.5, Math.min(1.5, st.pitch));
      const { eye, vp } = camMat();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); drawAll(eye, vp, false);
      requestAnimationFrame(frame);
    }
    /* tap → identify: draw flat part-id colours to the canvas (not shown: read straight after, before the next frame) */
    st.pick = (x, y) => {
      size(); const { eye, vp } = camMat(); const d = Math.min(window.devicePixelRatio || 1, 2);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); drawAll(eye, vp, true);
      const px = new Uint8Array(4); gl.readPixels(Math.round(x * d), Math.round(cv.height - y * d), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); drawAll(eye, vp, false);
      const id = px[3] ? px[0] | (px[1] << 8) | (px[2] << 16) : 0; return id ? st.byId[id] : null;
    };
    const pts = new Map(); let pd = 0, down = null, moved = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); st.drag = true; st.auto = false; st.vx = st.vy = 0; if (pts.size === 1) { down = [e.clientX, e.clientY]; moved = 0; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pd = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; const o = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size >= 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) st.dist = Math.max(0.18, Math.min(2.4, st.dist * pd / d)); pd = d; moved = 99; return; }
      const dx = e.clientX - o[0], dy = e.clientY - o[1]; moved += Math.abs(dx) + Math.abs(dy);
      if (e.shiftKey || e.buttons === 2) { const k = st.dist * 0.0012, cy = Math.cos(st.yaw), sy = Math.sin(st.yaw); st.tx -= dx * k * cy; st.tz += dx * k * sy; st.ty += dy * k; return; }
      st.yaw -= dx * 0.008; st.pitch += dy * 0.008; st.vy = -dx * 0.002; st.vx = dy * 0.002;
    });
    const up = (e) => {
      const wasTap = pts.size === 1 && moved < 6 && down; pts.delete(e.pointerId); pd = 0; if (!pts.size) st.drag = false;
      if (wasTap && st.onpick) { const r = cv.getBoundingClientRect(); st.onpick(st.pick(e.clientX - r.left, e.clientY - r.top)); }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); pd = 0; if (!pts.size) st.drag = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); st.dist = Math.max(0.18, Math.min(2.4, st.dist * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
    st.reset = () => { st.yaw = 0; st.pitch = 0.05; st.dist = 0.6; st.tx = 0; st.ty = 1.53; st.tz = 0.08; st.vx = st.vy = 0; };
    requestAnimationFrame(frame);
    return st;
  }

  /* ───────── page ───────── */
  const on = {}; LAYERS.forEach((l) => { on[l[0]] = !!l[4]; });
  const busy = {};
  const nm = (p) => (S.lang === 'ar' && p.ar ? p.ar : p.en);
  const sideTxt = (p) => (p.side === 'l' ? T('Left', 'أيسر') : p.side === 'r' ? T('Right', 'أيمن') : '');

  function chips() {
    return LAYERS.map((l) => `<button class="${on[l[0]] ? 'on' : ''} ${busy[l[0]] ? 'busy' : ''}" data-act="hnlay" data-k="${l[0]}" style="--c:rgb(${l[3].map((v) => Math.round(v * 255)).join(',')})"><i></i>${T(l[1], l[2])}</button>`).join('');
  }
  function open() {
    stop();
    A.modal(() => `<h2>🦴 ${T('Head & neck 3D', 'الرأس والرقبة 3D')}</h2>` +
      `<div class="hnstage" id="hnstage"><canvas id="hncv"></canvas><div class="hnmsg" id="hnmsg">${T('Loading…', 'جارِ التحميل…')}</div></div>` +
      `<div class="hncard" id="hncard"><small>${T('Tap any structure to see its name. Drag to rotate, pinch or scroll to zoom.', 'اضغط على أي تركيب تعرف اسمه. اسحب للتدوير، وقرّب بإصبعين أو بالعجلة.')}</small></div>` +
      `<div class="hnlay" id="hnlay">${chips()}</div>` +
      `<div class="hnsec"><button class="btn" id="hnsecb" data-act="hnsec">✂️ ${T('Section', 'مقطع')}</button><input type="range" id="hnsecr" min="-60" max="60" value="0" aria-label="section" hidden></div>` +
      `<div class="row" style="margin-top:4px"><button class="btn" data-act="hnreset">⟲ ${T('Reset view', 'رجّع الزاوية')}</button><button class="btn" id="hniso" data-act="hniso" disabled>${T('Isolate', 'اعزله')}</button></div>` +
      `<p class="tiny">${T('Full-resolution meshes from Z-Anatomy (CC BY-SA 4.0). Names are a draft until reviewed by a specialist.', 'مجسمات بالدقة الكاملة من Z-Anatomy (CC BY-SA 4.0). الأسماء مسودة لحد ما يراجعها متخصص.')}</p>`);
    const msg = $('hnmsg'), cv = $('hncv');
    try { cur = viewer(cv); } catch (e) { msg.textContent = T('Your device could not start the 3D view.', 'جهازك مقدرش يشغّل العرض 3D.'); return; }
    const me = cur;
    me.onpick = (p) => {
      me.sel = p || null; const c = $('hncard'), b = $('hniso'); if (b) b.disabled = !p;
      if (!p) { me.iso = false; if (c) c.innerHTML = `<small>${T('Nothing here — tap a structure.', 'مفيش تركيب هنا — اضغط على تركيب.')}</small>`; return; }
      const L = LAYERS.find((l) => l[0] === p.layer);
      const alt = S.lang === 'ar' ? p.en : (p.ar || ''); if (c) c.innerHTML = `<b>${esc(nm(p))}</b><small>${alt && alt !== nm(p) ? esc(alt) + ' · ' : ''}${sideTxt(p) ? sideTxt(p) + ' · ' : ''}${T(L[1], L[2])}</small>`;
    };
    const first = LKEY.filter((k) => on[k]);
    msg.textContent = T('Loading…', 'جارِ التحميل…');
    Promise.all(first.map((k) => loadLayer(k).then((d) => { if (cur === me && !me.layers[k]) me.addLayer(k, d); })))
      .then(() => { if (cur === me && msg.isConnected) msg.remove(); })
      .catch(() => { if (msg.isConnected) msg.textContent = T('Could not load the model — it needs an internet connection the first time.', 'مقدرناش نحمّل المجسم — أول مرة بيحتاج إنترنت.'); });
  }
  A.acts.hnlay = async (el) => {
    const k = el.dataset.k; if (!cur || busy[k]) return;
    on[k] = !on[k];
    if (on[k] && !cur.layers[k]) {
      busy[k] = true; el.classList.add('busy');
      try { const d = await loadLayer(k); if (cur) cur.addLayer(k, d); } catch (e) { on[k] = false; A.toast && A.toast(T('Needs an internet connection the first time', 'محتاج إنترنت أول مرة')); }
      busy[k] = false;
    }
    if (cur && cur.layers[k]) cur.layers[k].on = on[k];
    const w = $('hnlay'); if (w) w.innerHTML = chips();
  };
  A.acts.hnsec = () => {
    if (!cur) return; cur.clip = !cur.clip; const r = $('hnsecr'), b = $('hnsecb');
    if (b) b.classList.toggle('primary', cur.clip); if (r) { r.hidden = !cur.clip; if (cur.clip) { cur.clipX = 0; r.value = 0; cur.yaw = Math.PI / 2 * 0.0 - 0.0; cur.yaw = -1.2; } }
    if (!cur.clip) cur.clipX = 0;
  };
  A.acts.hnreset = () => { if (cur) cur.reset(); };
  A.acts.hniso = () => { if (cur && cur.sel) { cur.iso = !cur.iso; const b = $('hniso'); if (b) b.classList.toggle('primary', cur.iso); } };
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'hnsecr' && cur) cur.clipX = (+e.target.value) / 1000; });

  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.hn3d = () => { stop(); open(); }; });
})();
