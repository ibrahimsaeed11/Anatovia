/* tooth-parts.js — names + short descriptions of each tooth part (dots on the 3D tooth) and a "tap the part" quiz.
   Data: tooth-lm.js (window.TOOTH_LM). DRAFT content — must be reviewed by a dentist before release. */
'use strict';
window.__toothPartsLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const GN = { cusp: ['Cusps & edges', 'الحدبات والحواف'], ridge: ['Ridges & fossa', 'الأعراف والحفرة'], groove: ['Grooves & pits', 'الأخاديد والحفر'], neck: ['Neck', 'العنق'], root: ['Roots', 'الجذور'], surf: ['Surfaces', 'الأسطح'] };
  const GC = { cusp: '#E3B95B', ridge: '#7FD1AE', groove: '#4FC3D9', neck: '#E58AA0', root: '#8FB4F0', surf: '#C9A0F0' };
  const css = document.createElement('style');
  css.textContent = '.tpd{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border:0;background:none;padding:0;display:grid;place-items:center;cursor:pointer;z-index:3;-webkit-tap-highlight-color:transparent}' +
    '.tpd i{width:13px;height:13px;border-radius:50%;background:var(--c);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.4);transition:transform .15s}' +
    '.tpd.on i{transform:scale(1.5);box-shadow:0 0 0 3px var(--c),0 0 14px var(--c)}.tpd.ok i{background:#3DBE7A;transform:scale(1.5)}.tpd.no i{background:#E5534B;transform:scale(1.5)}' +
    '.tpl{position:absolute;z-index:4;transform:translate(-50%,-190%);background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:3px 9px;font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
    '.tpm{display:flex;gap:6px;margin:10px 0 6px}.tpm button{flex:1}.tpch{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none}.tpch::-webkit-scrollbar{display:none}' +
    '.tpch button{flex:none;border:1px solid var(--line);background:var(--surface2);color:var(--text);border-radius:999px;padding:6px 12px;font-size:12.5px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:6px}' +
    '.tpch button i{width:9px;height:9px;border-radius:50%;background:var(--c)}.tpch button.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}' +
    '.tpcard{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px 14px;margin:2px 0 6px}.tpcard b{font-size:16px;display:block}.tpcard em{font-style:normal;font-size:11px;color:var(--muted)}.tpcard p{margin:6px 0 0;font-size:14px;line-height:1.6}' +
    '.tpdraft{font-size:11px;color:var(--muted);margin:6px 0 0;text-align:center}.tpq{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px 14px;text-align:center;margin:2px 0 6px}.tpq small{color:var(--muted);display:block}.tpq b{font-size:18px;color:var(--gold)}.tpq .res{min-height:20px;font-size:13px;margin-top:4px}';
  css.textContent += '.t3stage{height:min(46vh,380px)!important}';
  document.head.appendChild(css);

  let ctx = null;
  function detach() { if (ctx) { ctx.dead = true; ctx = null; } }

  function attach(key, v, mir, stage, panel) {
    detach();
    const LM = (window.TOOTH_LM || {})[key];
    if (!LM || !panel) { if (panel) panel.innerHTML = ''; return; }
    const m = mir ? -1 : 1, c = (ctx = { dead: false, mode: 'learn', sel: null, quiz: null, tgt: null });
    const dots = {}, lay = document.createElement('div'); lay.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    stage.appendChild(lay);
    LM.forEach((p) => { const b = document.createElement('button'); b.className = 'tpd'; b.style.setProperty('--c', GC[p.g]); b.style.pointerEvents = 'auto'; b.dataset.id = p.id; b.innerHTML = '<i></i>'; b.setAttribute('aria-label', S.lang === 'ar' ? p.ar : p.en); lay.appendChild(b); dots[p.id] = b; });
    const lab = document.createElement('div'); lab.className = 'tpl'; lab.style.display = 'none'; lay.appendChild(lab);
    const nm = (p) => (S.lang === 'ar' ? p.ar : p.en), by = (id) => LM.find((p) => p.id === id);

    function face(p) { const nx = p.n[0] * m, ny = p.n[1], nz = p.n[2]; c.tgt = { yaw: Math.atan2(nx, nz), pitch: Math.max(-0.8, Math.min(0.9, Math.asin(Math.max(-1, Math.min(1, ny))) * 0.8)) }; v.auto = false; v.vx = v.vy = 0; }
    const ang = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

    v.after = (vp, eye) => {
      if (c.dead) { lay.remove(); v.after = null; return; }
      if (c.tgt && !v.drag) { const dy = ang(v.yaw, c.tgt.yaw), dp = c.tgt.pitch - v.pitch; v.yaw += dy * 0.18; v.pitch += dp * 0.18; if (Math.abs(dy) + Math.abs(dp) < 0.01) c.tgt = null; } else if (v.drag) c.tgt = null;
      const w = stage.clientWidth, h = stage.clientHeight;
      LM.forEach((p) => {
        const X = p.p[0] * m, Y = p.p[1], Z = p.p[2], nx = p.n[0] * m, ny = p.n[1], nz = p.n[2];
        const cx = vp[0] * X + vp[4] * Y + vp[8] * Z + vp[12], cy = vp[1] * X + vp[5] * Y + vp[9] * Z + vp[13], cw = vp[3] * X + vp[7] * Y + vp[11] * Z + vp[15];
        const ex = eye[0] - X, ey = eye[1] - Y, ez = eye[2] - Z, el = Math.hypot(ex, ey, ez) || 1;
        const vis = cw > 0 && (nx * ex + ny * ey + nz * ez) / el > 0.12;
        const d = dots[p.id]; d.style.display = vis ? '' : 'none';
        if (vis) { d.style.left = ((cx / cw) * 0.5 + 0.5) * w + 'px'; d.style.top = (0.5 - (cy / cw) * 0.5) * h + 'px'; }
        if (c.mode === 'learn' && c.sel === p.id) { lab.textContent = nm(p); lab.style.display = vis ? '' : 'none'; lab.style.left = d.style.left; lab.style.top = d.style.top; }
      });
      if (c.mode !== 'learn' || !c.sel) lab.style.display = 'none';
    };

    function render() {
      const mode = `<div class="tpm"><button class="btn ${c.mode === 'learn' ? 'primary' : ''}" data-tp="learn">${T('Parts', 'الأجزاء')}</button><button class="btn ${c.mode === 'quiz' ? 'primary' : ''}" data-tp="quiz">${T('Quiz', 'اختبار')}</button></div>`;
      let body = '';
      if (c.mode === 'learn') {
        const chips = LM.map((p) => `<button data-tp-sel="${p.id}" class="${c.sel === p.id ? 'on' : ''}" style="--c:${GC[p.g]}"><i></i>${esc(nm(p))}</button>`).join('');
        const p = c.sel && by(c.sel);
        body = `<div class="tpch">${chips}</div>` + (p ? `<div class="tpcard"><b>${esc(nm(p))}</b><em>${S.lang === 'ar' ? esc(p.en) : esc(p.ar)} · ${T(GN[p.g][0], GN[p.g][1])}</em><p>${esc(S.lang === 'ar' ? p.da : p.de)}</p></div>` : `<div class="tpcard"><p>${T('Tap a dot on the tooth or a name below to see what it is.', 'اضغط على نقطة في السنّة أو على اسم من فوق علشان تعرف إيه هو.')}</p></div>`);
      } else {
        const q = c.quiz;
        if (!q || q.i >= q.ids.length) {
          const done = q && q.i >= q.ids.length;
          body = `<div class="tpq">${done ? `<b>${q.score} / ${q.ids.length}</b><small>${q.score === q.ids.length ? T('Perfect!', 'ممتاز! كله صح') : T('Good — try again to improve.', 'حلو — جرّب تاني تحسّن.')}</small>` : `<small>${T('Tap the part that is asked, directly on the tooth. Rotate it to find hidden parts.', 'اضغط على الجزء المطلوب مباشرةً على السنّة. لفّها تلاقي الأجزاء المخفية.')}</small>`}<div style="margin-top:8px"><button class="btn primary" data-tp="start">${done ? T('Again', 'تاني') : T('Start (8 questions)', 'ابدأ (٨ أسئلة)')}</button></div></div>`;
        } else {
          const p = by(q.ids[q.i]);
          body = `<div class="tpq"><small>${T('Question', 'سؤال')} ${q.i + 1} / ${q.ids.length}</small><b>${T('Tap:', 'اضغط على:')} ${esc(nm(p))}</b><div class="res" id="tpres"></div></div>`;
        }
      }
      panel.innerHTML = mode + body + `<p class="tpdraft">${T('Draft — positions and texts are being reviewed by a dentist.', 'مبدئي — الأماكن والشروحات لسه بتتراجع من طبيب أسنان.')}</p>`;
      Object.keys(dots).forEach((id) => { dots[id].classList.toggle('on', c.mode === 'learn' && c.sel === id); });
    }
    function pick(id) {
      if (c.mode === 'learn') { c.sel = id; face(by(id)); render(); return; }
      const q = c.quiz; if (!q || q.i >= q.ids.length || q.lock) return;
      const want = q.ids[q.i], ok = id === want; q.lock = true; if (ok) q.score++;
      dots[id].classList.add(ok ? 'ok' : 'no'); if (!ok) { dots[want].classList.add('ok'); face(by(want)); }
      const r = $('tpres'); if (r) r.textContent = ok ? T('Correct ✓', 'صح ✓') : T('It was the green one.', 'كان الأخضر.');
      setTimeout(() => { if (c.dead) return; Object.values(dots).forEach((d) => d.classList.remove('ok', 'no')); q.i++; q.lock = false; render(); }, ok ? 650 : 1500);
    }
    lay.addEventListener('click', (e) => { const b = e.target.closest('.tpd'); if (b) pick(b.dataset.id); });
    panel.addEventListener('click', (e) => {
      const s = e.target.closest('[data-tp-sel]'); if (s) { pick(s.dataset.tpSel); return; }
      const b = e.target.closest('[data-tp]'); if (!b) return; const a = b.dataset.tp;
      if (a === 'learn' || a === 'quiz') { c.mode = a; c.sel = null; render(); }
      if (a === 'start') { const ids = LM.map((p) => p.id).filter((id) => by(id).g !== 'surf' || Math.random() < 0.5).sort(() => Math.random() - 0.5).slice(0, 8); c.quiz = { ids, i: 0, score: 0, lock: false }; render(); }
    });
    render();
  }
  window.ToothParts = { attach, detach };
})();
