/* practical.js — "Practical exam": a spot-test (anatomy stations). A structure is pinned (highlighted) on the 3D model, the student names it
   before the time runs out; no feedback until the end, then a score + review list. Sets can be filtered by region / system / length / seconds. */
'use strict';
(() => {
  if (window.__pracLoaded) return; window.__pracLoaded = 1;
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const X = () => window.__anat || {};
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  Object.assign(STR, {
    prac: { en: 'Practical exam', ar: 'الامتحان العملي' },
    pracSub: { en: 'A pin on a structure – name it before the time runs out', ar: 'دبوس على تركيب – سمّيه قبل ما الوقت يخلص' },
  });
  const REGS = [['head', 'Head', 'الرأس'], ['neck', 'Neck', 'الرقبة'], ['upper', 'Upper limb', 'الطرف العلوي'], ['thorax', 'Thorax', 'الصدر'], ['abdomen', 'Abdomen', 'البطن'], ['pelvis', 'Pelvis', 'الحوض'], ['lower', 'Lower limb', 'الطرف السفلي'], ['spine', 'Spine', 'العمود الفقري']];
  const SYSS = [['bone', 'Bones', 'عظام'], ['muscle', 'Muscles', 'عضلات'], ['nerve', 'Nerves', 'أعصاب'], ['vessel', 'Vessels', 'أوعية'], ['organ', 'Organs', 'أعضاء'], ['ligament', 'Ligaments', 'أربطة'], ['brain', 'Brain', 'مخ']];
  const MINR = { bone: 0.02, muscle: 0.03, nerve: 0.03, vessel: 0.035, organ: 0.03, ligament: 0.02, brain: 0.02 };
  const PRE = {   /* default filters by faculty (the student can change them) */
    pt: { sys: ['muscle', 'bone', 'nerve', 'ligament'], reg: ['upper', 'lower', 'spine'] }, nurs: { sys: ['vessel', 'organ', 'muscle', 'bone'], reg: ['upper', 'thorax', 'abdomen'] },
    dent: { sys: [], reg: ['head', 'neck'] }, pharm: { sys: ['organ', 'vessel'], reg: [] }, med: { sys: [], reg: [] },
  };
  const SIDE_EN = /\s[–-]\s(left|right)$/i, SIDE_AR = /\s*(\(?(يمين|يسار)\)?|اليمنى|اليسرى|اليمين|اليسار)$/;
  const nmOf = (e, ar) => (ar ? e.ar.replace(SIDE_AR, '') : (e.baseEn || e.en).replace(SIDE_EN, '')).trim();
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const D = () => { const d = Store.d; return d.prac || (d.prac = { best: 0, runs: 0, miss: {} }); };
  const prem = () => !!(A.isPremium && A.isPremium());
  const CFG = { sys: new Set(), reg: new Set(), n: 20, sec: 45, redo: false, init: false };
  let EX = null, tmr = null;

  const poolOf = () => {
    const seen = new Set(), miss = D().miss || {};
    return P.filter((e) => {
      if (e.side === 'l' || (e.lk && !prem())) return false;
      if (CFG.redo) return !!miss[e.id];
      if (CFG.sys.size && !CFG.sys.has(e.sys)) return false;
      if (CFG.reg.size && !CFG.reg.has(e.reg)) return false;
      if ((e.r || 0) < (MINR[e.sys] || 0.03)) return false;
      const k = e.sys + nmOf(e, false); if (seen.has(k)) return false; seen.add(k); return true;
    });
  };
  const dist2 = (a, b) => (a.c[0] - b.c[0]) ** 2 + (a.c[1] - b.c[1]) ** 2 + (a.c[2] - b.c[2]) ** 2;
  function buildStation(e) {
    const own = nmOf(e, false), same = P.filter((q) => q.sys === e.sys && q.side !== 'l' && !(q.lk && !prem()) && q.i !== e.i && (q.r || 0) >= (MINR[e.sys] || 0.03) * 0.7);
    same.sort((a, b) => dist2(a, e) - dist2(b, e));
    const near = same.filter((q) => q.reg === e.reg).slice(0, 24);
    const cand = [], seen = new Set([own]);
    for (const q of (near.length >= 8 ? near : same).slice(0, 14)) { const n = nmOf(q, false); if (!seen.has(n)) { seen.add(n); cand.push(q); } }
    const dis = shuffle(cand.slice(0, 8)).slice(0, 3);
    for (const q of shuffle(same.slice())) { if (dis.length >= 3) break; const n = nmOf(q, false); if (!seen.has(n)) { seen.add(n); dis.push(q); } }
    return { e, near: [e, ...near], opts: shuffle([e, ...dis]).map((q) => ({ en: nmOf(q, false), ar: nmOf(q, true), ok: q === e })) };
  }
  const stopT = () => { if (tmr) { clearInterval(tmr); tmr = null; } };
  const css = document.createElement('style');
  css.textContent = '#pxbar{position:absolute;left:50%;transform:translateX(-50%);top:104px;z-index:31;display:flex;flex-direction:column;gap:8px;padding:10px 14px;border-radius:16px;background:var(--surface);border:1px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:calc(100vw - 24px);width:440px;font-size:13px}#pxbar .ph{display:flex;justify-content:space-between;align-items:center;font-weight:700}#pxbar .po{display:grid;grid-template-columns:1fr 1fr;gap:6px}#pxbar button{border:0;background:var(--surface2);color:inherit;min-height:38px;padding:6px 10px;border-radius:12px;font-size:13px;cursor:pointer;line-height:1.35}#pxbar button.p{background:var(--accent,#e9b949);color:#1a1a1a;font-weight:700}#pxbar .px{min-width:34px;border-radius:17px}';
  document.head.appendChild(css);
  const rmBar = () => { const b = $('pxbar'); if (b) b.remove(); };
  const clearView = () => { S.hl = null; S.focus = null; try { A.apply(); } catch (e) { /* ignore */ } };

  async function pin(st) {
    const e = st.e; await A.ensure(e.sys); if (e.sys !== 'bone') { try { await A.ensure('bone'); } catch (x) { /* ignore */ } }
    S.layers[e.sys] = 'on'; if (e.sys !== 'bone') S.layers.bone = 'ghost'; S.region = null; S.iso = -1; S.hidden = new Set(); S.sel = -1; A.deselect();
    /* muscles overlap each other, so a deep muscle would be hidden: show only the pinned muscle over the ghosted skeleton; other systems keep their neighbours in neutral grey */
    const ctx = e.sys === 'muscle' ? [] : st.near.filter((q) => q !== e), hl = new Map(); ctx.forEach((q) => hl.set(q.i, [0.72, 0.72, 0.74, 0.92])); hl.set(e.i, [1, 0.84, 0.1, 1]);
    S.hl = hl; S.focus = new Set([e.i, ...ctx.map((q) => q.i)]); A.apply();
    try { X().cam.flyTo([e.c[0], Math.max(0.05, e.c[1]), e.c[2]], Math.max(0.6, Math.min(2.6, e.r * 5 + 0.7)), null, 0.1); } catch (x) { /* ignore */ }
  }
  const barHtml = () => {
    const st = EX.qs[EX.i], ar = S.lang === 'ar';
    return `<div class="ph"><span>${T('Station', 'محطة')} ${EX.i + 1} / ${EX.qs.length}</span><span>⏱ <b id="pxt" dir="ltr"></b></span><button class="px" data-act="pxquit" aria-label="exit">✕</button></div><div>${T('Name the YELLOW structure', 'سمّي التركيب الأصفر')}</div><div class="po">` +
      st.opts.map((o, k) => `<button data-act="pxans" data-k="${k}">${esc(ar ? o.ar : o.en)}</button>`).join('') + '</div>';
  };
  async function station() {
    const st = EX.qs[EX.i]; await pin(st); if (!EX) return;
    let b = $('pxbar'); if (!b) { b = document.createElement('div'); b.id = 'pxbar'; $('app').appendChild(b); }
    b.innerHTML = barHtml(); stopT();
    const dl = Date.now() + CFG.sec * 1000;
    tmr = setInterval(() => { const el = $('pxt'); if (!el || !EX) { stopT(); return; } const r = Math.max(0, Math.ceil((dl - Date.now()) / 1000)); el.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); el.style.color = r <= 10 ? '#ff6b6b' : ''; if (r <= 0) { stopT(); answer(-1); } }, 250);
  }
  function answer(k) {
    if (!EX) return; stopT(); const st = EX.qs[EX.i], ok = k >= 0 && st.opts[k].ok;
    EX.res.push({ st, k, ok }); const m = D().miss = D().miss || {};
    if (ok) { if (m[st.e.id]) { m[st.e.id]--; if (m[st.e.id] <= 0) delete m[st.e.id]; } } else m[st.e.id] = (m[st.e.id] || 0) + 1;
    EX.i++; if (EX.i >= EX.qs.length) return finish(); station();
  }
  function finish() {
    rmBar(); clearView(); const n = EX.res.length, ok = EX.res.filter((r) => r.ok).length, d = D(); d.runs++; d.best = Math.max(d.best || 0, Math.round(ok / n * 100));
    d.hist = (d.hist || []).concat([{ t: Date.now(), n, ok }]).slice(-30); Store.save(); try { if (A.logAct) A.logAct(n, ok); if (A.checkBadges) A.checkBadges(); } catch (e) { /* ignore */ }
    EX.done = true; A.modal(resHtml);
  }
  const resHtml = () => {
    const n = EX.res.length, ok = EX.res.filter((r) => r.ok).length, pc = Math.round(ok / n * 100), ar = S.lang === 'ar';
    const rows = EX.res.map((r, j) => `<div class="mist" data-act="pxview" data-j="${j}"><span>${r.ok ? '✅' : r.k < 0 ? '⌛' : '❌'} ${j + 1}. ${esc(ar ? r.st.opts.find((o) => o.ok).ar : r.st.opts.find((o) => o.ok).en)}${r.ok || r.k < 0 ? '' : `<small style="display:block;opacity:.75">${T('You said', 'جاوبت')}: ${esc(ar ? r.st.opts[r.k].ar : r.st.opts[r.k].en)}</small>`}</span><small>👁 ${T('View', 'اعرض')}</small></div>`).join('');
    return `<h2>🧪 ${T('Practical exam result', 'نتيجة الامتحان العملي')}</h2><div class="pjcurve" style="text-align:center;padding:16px 12px"><div dir="ltr" style="font-size:36px;font-weight:800">${ok} / ${n}</div><div dir="ltr" style="opacity:.8">${pc}% · ${T('best', 'أحسن نتيجة')} ${D().best}%</div><p>${pc >= 85 ? T('Excellent – exam ready!', 'ممتاز – جاهز للامتحان!') : pc >= 60 ? T('Good – review the missed stations.', 'كويس – راجع المحطات اللي غلطت فيها.') : T('Keep practising – use “my missed stations”.', 'كمّل تدريب – استخدم «المحطات اللي غلطت فيها».')}</p></div>` +
      `<div class="row" style="flex-wrap:wrap"><button class="btn primary" data-act="pxagain">🔁 ${T('New exam', 'امتحان جديد')}</button><button class="btn" data-act="pxsetup">⚙️ ${T('Settings', 'الإعدادات')}</button></div><p class="tiny">${T('Tap a station to see it again on the model.', 'دوس على أي محطة تشوفها تاني على المجسم.')}</p><div class="mists">${rows}</div>`;
  };
  A.acts.pxview = async (el) => {
    const r = EX && EX.res[+el.dataset.j]; if (!r) return; A.closeModal(); await pin(r.st);
    const ar = S.lang === 'ar', c = r.st.opts.find((o) => o.ok); let b = $('pxbar'); if (!b) { b = document.createElement('div'); b.id = 'pxbar'; $('app').appendChild(b); }
    b.innerHTML = `<div class="ph"><span>🟡 ${esc(ar ? c.ar : c.en)}</span><button class="px" data-act="pxback" aria-label="back">✕</button></div><button class="p" data-act="pxback">⬅ ${T('Back to the result', 'رجوع للنتيجة')}</button>`;
  };
  A.acts.pxback = () => { rmBar(); clearView(); if (EX) A.modal(resHtml); };
  A.acts.pxquit = () => { if (!confirm(T('End the exam now? Answered stations are scored.', 'تنهي الامتحان دلوقتي؟ المحطات اللي جاوبتها هتتحسب.'))) return; stopT(); if (EX && EX.res.length) { finish(); } else { EX = null; rmBar(); clearView(); } };
  A.acts.pxans = (el) => answer(+el.dataset.k);

  function start() {
    const pool = poolOf(); if (pool.length < 8) return;
    const picks = shuffle(pool.slice()).slice(0, CFG.redo ? Math.min(CFG.n, pool.length) : CFG.n);
    EX = { qs: [], i: 0, res: [] }; A.closeModal();
    EX.qs = picks.map(buildStation); station();
  }
  A.acts.pxstart = start;
  A.acts.pxagain = () => { CFG.redo = false; start(); };
  const chip = (act, k, label, on) => `<button class="opt ${on ? 'sel' : ''}" data-act="${act}" data-k="${k}">${label}</button>`;
  const setupHtml = () => {
    const pool = poolOf(), nMiss = Object.keys(D().miss || {}).length, ar = S.lang === 'ar', lockedOnly = !prem() && CFG.sys.size && ![...CFG.sys].some((s) => s === 'bone' || s === 'muscle');
    return `<h2>🧪 ${T('Practical exam', 'الامتحان العملي')}</h2><p class="lead">${T('Stations like the real practical exam: a yellow pin on the 3D model, choose the name before the time ends. No feedback until the end.', 'محطات زي الامتحان العملي الحقيقي: دبوس أصفر على المجسم، اختار الاسم قبل ما الوقت يخلص. مفيش إجابات لحد النهاية.')}</p>` +
      `<div class="lab">${T('Regions (none = all)', 'المناطق (من غير اختيار = الكل)')}</div><div class="row" style="flex-wrap:wrap">${REGS.map((r) => chip('pxcfg', 'reg:' + r[0], ar ? r[2] : r[1], CFG.reg.has(r[0]))).join('')}</div>` +
      `<div class="lab">${T('Systems (none = all)', 'الأنظمة (من غير اختيار = الكل)')}</div><div class="row" style="flex-wrap:wrap">${SYSS.map((r) => chip('pxcfg', 'sys:' + r[0], (ar ? r[2] : r[1]) + (!prem() && r[0] !== 'bone' && r[0] !== 'muscle' ? ' 🔒' : ''), CFG.sys.has(r[0]))).join('')}</div>` +
      `<div class="lab">${T('Stations', 'عدد المحطات')}</div><div class="row">${[10, 20, 30].map((n) => chip('pxcfg', 'n:' + n, n, CFG.n === n)).join('')}</div>` +
      `<div class="lab">${T('Seconds per station', 'ثواني كل محطة')}</div><div class="row">${[30, 45, 60].map((n) => chip('pxcfg', 'sec:' + n, n, CFG.sec === n)).join('')}</div>` +
      `<p class="tiny">${T('Structures in this set', 'عدد التراكيب في المجموعة')}: <b>${pool.length}</b>${lockedOnly ? ' · ' + T('these systems need Premium', 'الأنظمة دي محتاجة Premium') : ''}${pool.length < 8 && !CFG.redo ? ' · ' + T('choose a wider set', 'وسّع الاختيار') : ''}</p>` +
      `<button class="btn primary wide" data-act="pxstart" ${pool.length < 8 ? 'disabled' : ''}>▶ ${T('Start', 'ابدأ')} ${CFG.redo ? '(' + T('my missed', 'اللي غلطت فيه') + ')' : ''}</button>` +
      `<button class="btn wide" style="margin-top:8px" data-act="pxredo" ${nMiss ? '' : 'disabled'}>🔁 ${T('My missed stations', 'المحطات اللي غلطت فيها')} (${nMiss})</button>` +
      `<p class="tiny">${T('Best score', 'أحسن نتيجة')}: ${D().best || 0}% · ${T('exams taken', 'امتحانات')}: ${D().runs || 0}</p>`;
  };
  A.acts.pxcfg = (el) => {
    const [t, v] = el.dataset.k.split(':'); CFG.redo = false;
    if (t === 'n' || t === 'sec') CFG[t] = +v; else { const s = CFG[t]; if (s.has(v)) s.delete(v); else s.add(v); }
    A.modal(setupHtml);
  };
  A.acts.pxredo = () => { CFG.redo = true; start(); CFG.redo = false; };
  A.acts.pxsetup = () => { CFG.redo = false; A.modal(setupHtml); };
  const open = () => {
    if (!CFG.init) { CFG.init = true; const f = (A.acct && A.acct.fac) || '', p = PRE[f]; if (p) { CFG.sys = new Set(p.sys); CFG.reg = new Set(p.reg); if (poolOf().length < 8) { CFG.sys = new Set(); } } }
    CFG.redo = false; EX = null; A.modal(setupHtml);
  };
  waitFor(() => A.hubExtra && A.modal && window.__anat, () => { A.hubExtra.prac = open; });
})();
