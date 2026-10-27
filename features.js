/* features.js — bone landmarks (callout arrows), nerve↔muscle links, clinical nerve-injury cases,
   brain function map, cross-section slider.  Draft clinical texts: need physician / physiotherapist review. */
'use strict';
(() => {
  const { S, P, $, t, L, esc, name1 } = A;
  const X = () => window.__anat || {};
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);

  Object.assign(STR, {
    lmBtn: { en: 'Labels', ar: 'التسميات' },
    lmColBtn: { en: 'Landmark colors', ar: 'ألوان المعالم' },
    lmHint: { en: 'Labels on: zoom in on a bone and tap a label', ar: 'التسميات شغالة: قرّب على عظمة واضغط على أي اسم' },
    casesBtn: { en: 'Clinical cases', ar: 'حالات سريرية' },
    fnBtn: { en: 'Brain functions', ar: 'وظائف المخ' },
    cutBtn: { en: 'Cross-section', ar: 'مقطع' },
  });

  /* ───────────────────────────── helpers ───────────────────────────── */
  const dark = () => document.documentElement.dataset.theme !== 'light';
  const refresh = () => { if (A.apply) A.apply(); else A.redraw(); };
  function flyToSet(set, minD = 0.5) {
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const i of set) { const e = P[i]; for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], e.c[k] - e.r * 0.6); hi[k] = Math.max(hi[k], e.c[k] + e.r * 0.6); } }
    const c = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2), ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    X().cam.flyTo([c[0], Math.max(0.05, c[1]), c[2]], Math.max(minD, ext * 1.7 + 0.35), null, Math.max(X().cam.pitch, 0.1)); A.redraw();
  }
  async function needLayers(sys) { for (const s of sys) { if (S.layers[s] === 'off') S.layers[s] = 'on'; await A.ensure(s); } }

  /* ───────────────────────────── 1. bone landmarks ───────────────────────────── */
  const LM = (window.LANDMARKS || []).map((l) => ({ ...l, bi: P.findIndex((e) => e.id === l.bn) })).filter((l) => l.bi >= 0);
  const lmByBone = new Map();
  LM.forEach((l) => { if (!lmByBone.has(l.bi)) lmByBone.set(l.bi, []); lmByBone.get(l.bi).push(l); });
  S.lm = false; S.lmSel = -1; S.lmCol = false; S.att = false; S.mov = null;
  const swapped = new Set();
  /* landmark colours: each landmark of the selected bone gets its own hue (golden-angle spacing so neighbours differ) */
  const hsl = (h, sa, l) => { const f = (n) => { const k = (n + h * 12) % 12, a = sa * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
  const lmRgb = (bi, l) => { const arr = lmByBone.get(bi) || []; const k = arr.indexOf(l); return hsl(((k < 0 ? 0 : k) * 0.381966 + 0.02) % 1, 0.82, 0.55); };
  const css = (rgb) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`;
  let spotKey = '';
  function syncSpots() {
    const x = X(), R = x.R || A.R; if (!x.itemOf || !R || !R.nsp) return;
    const bi = S.lmCol && S.sel >= 0 && P[S.sel].k === 'bone' && lmByBone.has(S.sel) ? S.sel : -1;
    const am = S.att && S.sel >= 0 && P[S.sel].k === 'muscle' ? S.sel : -1;
    const key = bi + '|' + S.lmSel + '|' + am + '|' + [...swapped].join(',') + '|' + (S.mov ? 1 : 0); if (key === spotKey) return; spotKey = key;
    R.items.forEach((it) => { it.spots = null; });
    if (am >= 0) attSpots(am, R);
    if (bi < 0) { A.redraw(); return; }
    const it = x.itemOf[bi]; if (!it) return;
    const arr = lmByBone.get(bi).slice(0, R.nsp), N = R.nsp, pos = new Float32Array(N * 4), col = new Float32Array(N * 3);
    arr.forEach((l, k) => {
      const o = it.offset, r = Math.min(0.03, Math.max(0.011, (l.d || 0.01) * 1.6)), c = lmRgb(bi, l);
      pos.set([l.p[0] + o[0], l.p[1] + o[1], l.p[2] + o[2], l.i === S.lmSel ? r * 1.35 : r], k * 4); col.set(c, k * 3);
    });
    it.spots = { n: arr.length, pos, col }; A.redraw();
  }
  let hits = [];
  const cvLm = () => $('lm');

  function project(p, vp, W, H) {
    const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13],
      w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    if (w <= 0.01) return null;
    return [(x / w * 0.5 + 0.5) * W, (1 - (y / w * 0.5 + 0.5)) * H];
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function arrow(c, x0, y0, x1, y1, col, dashed) {
    const a = Math.atan2(y1 - y0, x1 - x0), s = 9;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.6; c.setLineDash(dashed ? [5, 4] : []);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * s * 0.8, y1 - Math.sin(a) * s * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.42) * s, y1 - Math.sin(a - 0.42) * s); c.lineTo(x1 - Math.cos(a + 0.42) * s, y1 - Math.sin(a + 0.42) * s); c.closePath(); c.fill(); c.setLineDash([]);
  }


  /* ───────────── muscle ends (origin / insertion) from the mesh itself — approximate, no hand-made attachment data ───────────── */
  const vworld = (it, step, withOff) => {
    const p = it.vpos, n = p.length / 3, out = [], k = Math.max(1, Math.floor(n / step)), o = withOff ? it.offset : [0, 0, 0];
    for (let i = 0; i < n; i += k) out.push([it.lo[0] + p[i * 3] / 65535 * it.span[0] + o[0], it.lo[1] + p[i * 3 + 1] / 65535 * it.span[1] + o[1], it.lo[2] + p[i * 3 + 2] / 65535 * it.span[2] + o[2]]);
    return out;
  };
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vlen = (a) => Math.hypot(a[0], a[1], a[2]), vnorm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  function endsOf(e) {
    const it = X().itemOf[e.i]; if (!it || !it.vpos) return null;
    if (!it._ends) {
      const V = vworld(it, 2500, false); const n = V.length; if (n < 8) return null;
      const m = [0, 0, 0]; V.forEach((v) => { m[0] += v[0]; m[1] += v[1]; m[2] += v[2]; }); m[0] /= n; m[1] /= n; m[2] /= n;
      let ax = vnorm([0.3, 1, 0.2]);
      for (let k = 0; k < 14; k++) { const nx = [0, 0, 0]; V.forEach((v) => { const d = vsub(v, m), pr = vdot(d, ax); nx[0] += d[0] * pr; nx[1] += d[1] * pr; nx[2] += d[2] * pr; }); ax = vnorm(nx); }
      const pr = V.map((v) => vdot(vsub(v, m), ax)); const lo = Math.min(...pr), hi = Math.max(...pr), L = hi - lo || 0.01;
      const cen = (test) => { const c = [0, 0, 0]; let q = 0; V.forEach((v, i) => { if (test(pr[i])) { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; q++; } }); return q ? vmul(c, 1 / q) : m; };
      it._ends = { a: cen((t) => t <= lo + L * 0.16), b: cen((t) => t >= hi - L * 0.16), len: L };
    }
    const E = it._ends, o = it.offset;
    let a = vadd(E.a, o), b = vadd(E.b, o);
    const REF = [0, e.c[1] >= 1.05 ? 1.35 : 0.95, 0.02];
    let org = a, ins = b; if (vlen(vsub(b, REF)) < vlen(vsub(a, REF))) { org = b; ins = a; }
    if (swapped.has(e.i)) { const t = org; org = ins; ins = t; }
    return { org, ins, len: E.len };
  }
  const ORG_COL = [0.16, 0.82, 0.36], INS_COL = [0.2, 0.5, 1.0];
  const groupItems = (e) => P.filter((q) => q.sys === 'muscle' && q.grp === e.grp && Math.sign(q.c[0]) === Math.sign(e.c[0]) && X().itemOf[q.i] && X().itemOf[q.i].visible);
  function attSpots(am, R) {
    groupItems(P[am]).forEach((q) => {
      const E = endsOf(q), it = X().itemOf[q.i]; if (!E) return;
      const r = Math.max(0.018, E.len * 0.30), pos = new Float32Array(R.nsp * 4), col = new Float32Array(R.nsp * 3);
      pos.set([...E.org, r], 0); pos.set([...E.ins, r], 4); col.set(ORG_COL, 0); col.set(INS_COL, 3);
      it.spots = { n: 2, pos, col };
    });
  }
  function drawAtt(c, W, H) {
    if (!(S.att && S.sel >= 0 && P[S.sel].k === 'muscle')) return;
    const cm = X().cam, { vp } = cm.matrices(); const E = endsOf(P[S.sel]); if (!E) return;
    const o = project(E.org, vp, W, H), i = project(E.ins, vp, W, H); if (!o || !i) return;
    const dot = (p, col, txt) => { c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 7, 0, 6.3); c.fill(); c.stroke();
      c.font = '700 12px system-ui,"Noto Naskh Arabic",sans-serif'; c.textAlign = 'center'; const w = c.measureText(txt).width + 12; c.fillStyle = 'rgba(10,16,40,.85)'; rrect(c, p[0] - w / 2, p[1] - 30, w, 20, 7); c.fill(); c.fillStyle = col; c.textBaseline = 'middle'; c.fillText(txt, p[0], p[1] - 20); };
    // line of pull: from the insertion toward the origin
    const dx = o[0] - i[0], dy = o[1] - i[1], L = Math.hypot(dx, dy);
    if (L > 30) { const k = Math.min(60, L * 0.5) / L; arrow(c, i[0], i[1], i[0] + dx * k, i[1] + dy * k, '#ffd23f', false); }
    dot(o, '#2ad45c', T('Origin', 'البداية')); dot(i, '#4d8dff', T('Insertion', 'النهاية'));
  }
  A.acts.att = () => {
    S.att = !S.att; spotKey = '';
    if (S.att && !(S.sel >= 0 && P[S.sel].k === 'muscle')) A.toast(T('Select a muscle to see its origin (green) and insertion (blue)', 'اختار عضلة عشان تشوف بدايتها (أخضر) ونهايتها (أزرق)'), 4200);
    if (S.att && S.layers.muscle === 'off') { S.layers.muscle = 'on'; A.ensure('muscle').then(refresh); }
    refresh(); if (A.renderChips) A.renderChips(); if (S.sel >= 0 && A.renderPanel) A.renderPanel(); A.redraw();
  };
  A.acts.attswap = () => { if (S.sel < 0) return; groupItems(P[S.sel]).forEach((q) => { if (swapped.has(q.i)) swapped.delete(q.i); else swapped.add(q.i); }); spotKey = ''; if (S.mov) stopMove(); A.redraw(); };

  /* nearest bones to each end → isolate muscle + its bones */
  const boneItems = () => P.filter((q) => q.k === 'bone' && X().itemOf[q.i] && X().itemOf[q.i].vpos);
  const bverts = (q) => { const it = X().itemOf[q.i]; if (!it._bv) it._bv = vworld(it, 160, false); return it._bv.map((v) => vadd(v, it.offset)); };
  const mind = (V, p) => { let m = 9; V.forEach((v) => { const d = vlen(vsub(v, p)); if (d < m) m = d; }); return m; };
  function nearBones(p, n) { return boneItems().map((q) => ({ q, d: mind(bverts(q), p) })).sort((a, b) => a.d - b.d).slice(0, n); }
  A.acts.attiso = async () => {
    const e = P[S.sel]; if (!e || e.k !== 'muscle') return;
    await A.ensure('bone'); const E = endsOf(e); if (!E) return;
    const bs = new Set([...nearBones(E.org, 2).filter((r, k) => k === 0 || r.d < 0.035).map((r) => r.q.i), ...nearBones(E.ins, 2).filter((r, k) => k === 0 || r.d < 0.035).map((r) => r.q.i)]);
    S.focus = new Set([...groupItems(e).map((q) => q.i), ...bs]); S.att = true; spotKey = '';
    refresh(); if (A.renderChips) A.renderChips();
    $('app').classList.remove('psel'); $('panel').classList.add('closed'); $('panel').classList.remove('peek');
    const mid = vmul(vadd(E.org, E.ins), 0.5); X().cam.flyTo(mid, Math.max(0.5, E.len * 2.6), null, 0.15); A.redraw();
  };

  /* ───────────── movement view: the insertion bone rotates about the joint, the muscle follows and shortens ───────────── */
  const rotM = (k, th) => { const c = Math.cos(th), s = Math.sin(th), t = 1 - c, [x, y, z] = k;
    return new Float32Array([t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c]); };
  const rotV = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  let movRaf = 0;
  function stopMove(keep) {
    if (movRaf) cancelAnimationFrame(movRaf); movRaf = 0;
    X().R.items.forEach((it) => { it.anim = null; });
    if (!keep) { S.mov = null; const b = $('movbar'); if (b) b.remove(); }
    A.redraw();
  }
  function applyMove(th) {
    const M = S.mov; if (!M) return; const R = X().R, m = rotM(M.axis, th * M.sign);
    M.bones.forEach((i) => { const it = X().itemOf[i]; if (it) it.anim = { mode: 1, rot: m, piv: M.piv, a: [0, 0, 0], dl: [0, 0, 1, 1] }; });
    M.muscles.forEach((q) => { const it = X().itemOf[q.i], E = q.E; if (!it) return; const d = vsub(E.ins, E.org);
      it.anim = { mode: 2, rot: m, piv: M.piv, a: E.org, dl: [...vnorm(d), Math.max(0.01, vlen(d))] }; });
    M.th = th; const rd = $('movdeg'); if (rd) rd.textContent = Math.round(th * 180 / Math.PI) + '°';
    const sl = $('movsl'); if (sl && document.activeElement !== sl) sl.value = Math.round(th / M.max * 100);
    A.redraw();
  }
  A.acts.mov = async () => {
    const e = P[S.sel]; if (!e || e.k !== 'muscle') return;
    if (S.mov) return stopMove();
    A.toast(T('Preparing the movement…', 'بجهّز الحركة…'), 1500);
    await A.ensure('bone'); S.explode = 0; if (A.apply) A.apply(); await new Promise((r) => setTimeout(r, 60));
    const mus = groupItems(e).map((q) => ({ q, E: endsOf(q) })).filter((r) => r.E);
    const E = endsOf(e); if (!E) { A.toast(T('Cannot animate this muscle', 'مش قادر أحرّك العضلة دي'), 3000); return; }
    let insB = nearBones(E.ins, 1)[0]; const orgB = nearBones(E.org, 1)[0];
    if (insB && orgB && insB.q.i === orgB.q.i) {   // both ends touch the same bone (e.g. biceps ends just above the radius): take the next bone further from the origin
      const cc = (q) => { const V = bverts(q), c = [0, 0, 0]; V.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; }); return vmul(c, 1 / V.length); };
      const far = vlen(vsub(cc(orgB.q), E.org)), alt = nearBones(E.ins, 8).filter((r) => r.q.i !== orgB.q.i && r.d < 0.08 && vlen(vsub(cc(r.q), E.org)) > far)[0];
      if (alt) insB = alt;
    }
    if (window.__dbgMov) console.log('MOV', JSON.stringify({o: E.org, i: E.ins, ib: insB && insB.q.en, ob: orgB && orgB.q.en, id: insB && insB.d, od: orgB && orgB.d}));
    if (!insB || !orgB || insB.q.i === orgB.q.i) { A.toast(T('This muscle does not cross a joint I can detect', 'العضلة دي مش بتعدّي مفصل أقدر أحدده'), 3500); return; }
    const insV = bverts(insB.q), cen = (V) => { const c = [0, 0, 0]; V.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; }); return vmul(c, 1 / V.length); };
    const cIns = cen(insV), dIns = vlen(vsub(cIns, E.org));
    // joint = closest pair between the insertion bone and its proximal neighbour (a bone lying nearer to the origin)
    let best = null;
    boneItems().forEach((q) => { if (q.i === insB.q.i) return; const V = bverts(q), c = cen(V); if (vlen(vsub(c, E.org)) >= dIns) return;
      let m = 9, pa = null, pb = null; insV.forEach((a) => V.forEach((b) => { const d = vlen(vsub(a, b)); if (d < m) { m = d; pa = a; pb = b; } }));
      if (m < 0.04 && (!best || m < best.m)) best = { q, m, p: vmul(vadd(pa, pb), 0.5) }; });
    if (!best) { A.toast(T('Could not find the joint for this muscle', 'ملقيتش المفصل بتاع العضلة دي'), 3500); return; }
    const piv = best.p; let axis = vcross(vsub(E.ins, piv), vsub(E.org, piv));
    if (vlen(axis) < 1e-5) axis = [1, 0, 0]; axis = vnorm(axis);
    // sign + range: rotate until the muscle has shortened by ~30 % (25°–80°)
    const L0 = vlen(vsub(E.ins, E.org)); let sign = 1, max = 0.45;
    { const t = (th, sg) => vlen(vsub(vadd(piv, rotV(rotM(axis, th * sg), vsub(E.ins, piv))), E.org)); if (t(0.2, -1) < t(0.2, 1)) sign = -1;
      for (let th = 0.1; th <= 1.4; th += 0.02) { max = th; if (t(th, sign) < L0 * 0.7) break; } max = Math.max(0.44, Math.min(1.4, max)); }
    // followers: bones beyond the joint that touch the moving bone (hand follows the forearm, etc.)
    const mv = new Set([insB.q.i]), fr = [insB.q], u = vnorm(vsub(cIns, piv));
    for (let h = 0; h < 3; h++) { const nx = []; fr.forEach((fq) => { const fv = bverts(fq); boneItems().forEach((q) => { if (mv.has(q.i) || q.i === best.q.i || q.i === orgB.q.i) return; const V = bverts(q), c = cen(V);
      if (vdot(vsub(c, piv), u) <= 0 || vlen(vsub(c, piv)) > 0.7 || vlen(vsub(c, E.org)) < vlen(vsub(piv, E.org)) + 0.02) return; if (mind(V, cen(fv)) > 0.25 && mind(fv, c) > 0.12) return; let m = 9; fv.forEach((a) => { m = Math.min(m, mind(V, a)); }); if (m < 0.02) { mv.add(q.i); nx.push(q); } }); }); fr.length = 0; fr.push(...nx); }
    const grp = new Set(mus.map((r) => r.q.i));
    S.focus = new Set([...grp, ...mv, best.q.i, orgB.q.i]); S.att = true; spotKey = '';
    S.mov = { axis, sign, max, piv, bones: [...mv], muscles: mus.map((r) => ({ q: r.q, E: r.E })), th: 0, t0: performance.now(), play: true, name: T('Movement', 'الحركة'), joint: T(best.q.en, best.q.ar) };
    refresh(); if (A.renderChips) A.renderChips();
    X().cam.flyTo(vadd(piv, vmul(vsub(E.org, piv), 0.3)), Math.max(0.7, L0 * 3.3), null, 0.12);
    $('app').classList.remove('psel'); $('panel').classList.add('closed'); $('panel').classList.remove('peek');
    const bar = document.createElement('div'); bar.id = 'movbar';
    bar.innerHTML = `<button data-act="movplay" id="movpl">⏸</button><input id="movsl" type="range" min="0" max="100" value="0"><b id="movdeg">0°</b><button data-act="movend">✕</button>`;
    $('app').appendChild(bar);
    $('movsl').addEventListener('input', (ev) => { S.mov.play = false; $('movpl').textContent = '▶'; applyMove(S.mov.max * (+ev.target.value) / 100); });
    const tick = (now) => { if (!S.mov) return; if (S.mov.play) { const ph = ((now - S.mov.t0) / 2600) % 2, k = ph < 1 ? ph : 2 - ph; applyMove(S.mov.max * (k * k * (3 - 2 * k))); } movRaf = requestAnimationFrame(tick); };
    movRaf = requestAnimationFrame(tick);
  };
  A.acts.movplay = () => { if (!S.mov) return; S.mov.play = !S.mov.play; if (S.mov.play) S.mov.t0 = performance.now() - 1300 * (S.mov.th / S.mov.max); $('movpl').textContent = S.mov.play ? '⏸' : '▶'; };
  A.acts.movend = () => { stopMove(); S.focus = null; spotKey = ''; refresh(); if (A.renderChips) A.renderChips(); };

  /* Labels are laid out calmly: a stable side per label (with hysteresis), a small fixed number of callouts (rest are quiet dots),
     thin lines (bold only for the selected one), slots that glide instead of jump, and labels fade while the model is being rotated. */
  const LSX = { set: [], side: new Map(), y: new Map(), a: 1, idleAt: 0, sig: '', key: '' };
  const lmTimer = { t: 0 };
  A.afterDraw = () => {
    syncSpots();
    const cv = cvLm(); if (!cv) return;
    const x = X(); if (!x.cam || !x.itemOf) return;
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); hits = []; drawAtt(c, W, H);
    const selBone = S.lm && S.sel >= 0 && P[S.sel].k === 'bone' ? S.sel : -1;
    if (selBone < 0 && !S.lm && S.lmSel < 0) { LSX.set = []; LSX.key = ''; return; }
    const cm = x.cam, { vp, eye } = cm.matrices(), now = performance.now();
    // ── is the model moving? (camera or explode) ──
    const sig = [cm.yaw, cm.pitch, cm.dist, cm.target[0], cm.target[1], cm.target[2], S.explode].map((v) => Math.round(v * 2000)).join(',');
    const moving = sig !== LSX.sig && LSX.sig !== ''; LSX.sig = sig; if (moving) LSX.idleAt = now + 380;
    const quiet = now >= LSX.idleAt;
    const tgtA = quiet ? 1 : 0.1; LSX.a += (tgtA - LSX.a) * (quiet ? 0.2 : 0.55); if (Math.abs(LSX.a - tgtA) < 0.015) LSX.a = tgtA;
    const consider = (l, forced) => {
      const it = x.itemOf[l.bi]; if (!it || !it.visible || it.alpha < 0.3) return null;
      const p = [l.p[0] + it.offset[0], l.p[1] + it.offset[1], l.p[2] + it.offset[2]];
      const ex = eye[0] - p[0], ey = eye[1] - p[1], ez = eye[2] - p[2], dl = Math.hypot(ex, ey, ez) || 1;
      const back = (l.n[0] * ex + l.n[1] * ey + l.n[2] * ez) / dl < 0.08;           // facing away
      if (back && !forced) return null;
      if (S.cutOn && S.clipTest && S.clipTest(p)) return null;
      const sc = project(p, vp, W, H); if (!sc) return null;
      if (sc[0] < 6 || sc[0] > W - 6 || sc[1] < 100 || sc[1] > H - 14) return null;
      return { l, back, sx: sc[0], sy: sc[1], forced, d: Math.hypot(sc[0] - W / 2, sc[1] - H / 2) };
    };
    // ── candidates ──
    let pool = [];
    if (selBone >= 0) (lmByBone.get(selBone) || []).forEach((l) => { const q = consider(l, true); if (q) pool.push(q); });
    if (S.lm && cm.dist < 1.6 && selBone < 0) { const ex = []; LM.forEach((l) => { const q = consider(l, false); if (q) ex.push(q); }); ex.sort((a, b) => a.d - b.d); pool.push(...ex.slice(0, 14)); }
    let sel = null;
    if (S.lmSel >= 0) { sel = pool.find((q) => q.l.i === S.lmSel); if (!sel) { const l = LM.find((q) => q.i === S.lmSel); if (l) { sel = consider(l, true); if (sel) pool.push(sel); } } }
    if (!pool.length) return;
    // ── which ones get a callout: re-chosen only when the view is calm (so the set doesn't flicker while rotating) ──
    const MAXL = W > 700 ? 11 : 7, kind = selBone + '|' + (S.lm ? 1 : 0);
    const score = (q) => (q.back ? 4000 : 0) + q.d - Math.min(0.04, q.l.d || 0.01) * 3500 - (q.l.i === S.lmSel ? 9999 : 0);
    if (quiet || LSX.key !== kind || !LSX.set.length) { LSX.key = kind; LSX.set = pool.slice().sort((a, b) => score(a) - score(b)).slice(0, MAXL).map((q) => q.l.i); }
    if (sel && !LSX.set.includes(sel.l.i)) LSX.set.push(sel.l.i);
    const labeled = [], dots = [];
    pool.forEach((q) => (LSX.set.includes(q.l.i) ? labeled : dots).push(q));
    // ── callout layout (stable sides, gliding slots) ──
    const fs = 13; c.font = `600 ${fs}px system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Naskh Arabic",Arial,sans-serif`; c.textBaseline = 'middle';
    const dk = dark(), cols = { l: [], r: [] }, m = W * 0.12;
    labeled.forEach((q) => {
      q.txt = T(q.l.en, q.l.ar); q.w = Math.min(W * 0.46, c.measureText(q.txt).width + 18);
      let sd = LSX.side.get(q.l.i); if (!sd || (sd === 'l' && q.sx > W / 2 + m) || (sd === 'r' && q.sx < W / 2 - m)) sd = q.sx < W / 2 ? 'l' : 'r';
      LSX.side.set(q.l.i, sd); q.sd = sd; cols[sd].push(q);
    });
    let animating = false;
    const place = (arr, right) => {
      arr.sort((a, b) => (quiet ? a.sy - b.sy : (LSX.y.get(a.l.i) ?? a.sy) - (LSX.y.get(b.l.i) ?? b.sy))); let y = 108;
      arr.forEach((q, i) => { y = Math.max(y, Math.min(q.sy - 12, H - 30 - (arr.length - i) * 26)); q.ty = y; y += 26; });
      arr.forEach((q) => {
        const cur = LSX.y.get(q.l.i); q.ly = cur === undefined ? q.ty : cur + (q.ty - cur) * 0.3;
        if (Math.abs(q.ly - q.ty) < 0.6) q.ly = q.ty; else animating = true; LSX.y.set(q.l.i, q.ly);
        q.lx = right ? W - 8 - q.w : 8;
      });
    };
    place(cols.l, false); place(cols.r, true);
    const A0 = LSX.a;
    // ── quiet dots for the rest (no lines) ──
    if (selBone >= 0) for (const q of dots) {
      if (q.back) continue; const on = q.l.i === S.lmSel;
      c.globalAlpha = A0 * 0.9; c.fillStyle = dk ? 'rgba(255,255,255,.9)' : 'rgba(20,30,70,.85)'; c.strokeStyle = dk ? 'rgba(10,16,40,.9)' : 'rgba(255,255,255,.9)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(q.sx, q.sy, on ? 6 : 3.6, 0, 6.3); c.fill(); c.stroke(); c.globalAlpha = 1;
      hits.push({ i: q.l.i, rect: [q.sx - 9, q.sy - 9, 18, 18], px: q.sx, py: q.sy });
    }
    // ── callouts: thin line for all, bold for the selected one ──
    for (const q of labeled) {
      const on = q.l.i === S.lmSel, right = q.sd === 'r';
      const ax = right ? q.lx : q.lx + q.w, ay = q.ly + 11;
      const col = on ? '#19e3f2' : (dk ? 'rgba(255,255,255,.55)' : 'rgba(20,30,70,.5)');
      c.globalAlpha = A0 * (q.back ? 0.55 : 1);
      if (on) arrow(c, ax, ay, q.sx, q.sy, col, q.back);
      else { c.strokeStyle = col; c.lineWidth = 1; c.setLineDash(q.back ? [4, 4] : []); c.beginPath(); c.moveTo(ax, ay); c.lineTo(q.sx, q.sy); c.stroke(); c.setLineDash([]); c.fillStyle = col; c.beginPath(); c.arc(q.sx, q.sy, 2.6, 0, 6.3); c.fill(); }
      c.fillStyle = on ? 'rgba(10,60,80,.96)' : (dk ? 'rgba(14,20,44,.88)' : 'rgba(255,255,255,.94)');
      c.strokeStyle = on ? '#19e3f2' : (dk ? 'rgba(255,255,255,.28)' : 'rgba(20,30,70,.25)'); c.lineWidth = on ? 2 : 1;
      rrect(c, q.lx, q.ly, q.w, 22, 8); c.fill(); c.stroke();
      c.fillStyle = on ? '#fff' : (dk ? '#eef1ff' : '#18204a'); c.textAlign = 'center';
      c.fillText(q.txt, q.lx + q.w / 2, q.ly + 11.5, q.w - 10);
      if (on) { c.strokeStyle = '#19e3f2'; c.lineWidth = 2; c.beginPath(); c.arc(q.sx, q.sy, 9, 0, 6.3); c.stroke(); }
      c.globalAlpha = 1;
      hits.push({ i: q.l.i, rect: [q.lx, q.ly, q.w, 22], px: q.sx, py: q.sy });
    }
    // keep animating (fade-in after rotation / sliding slots) without needing the user to touch anything
    if ((animating || LSX.a !== tgtA || !quiet) && !lmTimer.t) lmTimer.t = setTimeout(() => { lmTimer.t = 0; A.redraw(); }, 24);
  };

  A.onTap = (x, y) => {
    for (const h of hits) {
      const [rx, ry, rw, rh] = h.rect;
      if ((x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) || Math.hypot(x - h.px, y - h.py) < 15) {
        S.lmSel = S.lmSel === h.i ? -1 : h.i;
        const l = LM.find((q) => q.i === h.i);
        if (S.lmSel >= 0 && l) A.toast(l.ar + '  —  ' + l.en, 4200);
        A.redraw(); return true;
      }
    }
    return false;
  };
  A.acts.lmgo = (el) => {
    const l = LM.find((q) => q.i === +el.dataset.i); if (!l) return;
    S.lmSel = l.i; const x = X();
    if (S.sel !== l.bi && A.select) A.select(l.bi, { fly: false });
    const it = x.itemOf[l.bi], o = it ? it.offset : [0, 0, 0];
    const n = l.n; x.cam.flyTo([l.p[0] + o[0], l.p[1] + o[1], l.p[2] + o[2]], 0.34, Math.atan2(n[0], n[2]), 0.15); A.toast(l.ar + '  —  ' + l.en, 4200); A.redraw();
  };
  A.acts.lmcol = () => {
    S.lmCol = !S.lmCol; spotKey = '';
    if (S.lmCol) {
      if (S.layers.bone === 'off') S.layers.bone = 'on';
      if (!(S.sel >= 0 && P[S.sel].k === 'bone')) A.toast(T('Select a bone to see its landmarks in colors', 'اختار عضمة عشان تشوف معالمها بألوان'), 3800);
      else if (!R_ok()) A.toast(T('Your device does not support landmark colors', 'جهازك مش بيدعم ألوان المعالم'), 3800);
    }
    refresh(); if (A.renderChips) A.renderChips(); if (S.sel >= 0 && A.renderPanel) A.renderPanel(); A.redraw();
  };
  const R_ok = () => { const R = X().R || A.R; return !!(R && R.nsp); };
  A.acts.lmtoggle = () => {
    S.lm = !S.lm; S.lmSel = -1;
    if (S.lm) { if (S.layers.bone === 'off') S.layers.bone = 'on'; A.ensure('bone').then(refresh); A.toast(T('Labels on: zoom in on a bone and tap a label', 'التسميات شغالة: قرّب على عظمة واضغط على أي اسم'), 4200); }
    refresh();
  };

  /* ───────────────────────────── 2. nerve ↔ muscle links ───────────────────────────── */
  const RULES = [
    [/posterior interosseous/, ['Posterior interosseous nerve', 'Radial nerve – deep branch', 'Radial nerve']],
    [/lateral plantar/, ['Lateral plantar nerve', 'Tibial nerve']], [/medial plantar/, ['Medial plantar nerve', 'Tibial nerve']],
    [/deep branch of the ulnar/, ['Ulnar nerve – deep branch', 'Ulnar nerve']], [/ulnar nerve|and ulnar/, ['Ulnar nerve']],
    [/deep fibular/, ['Deep fibular nerve', 'Deep fibular nerve – muscular branches', 'Common fibular (peroneal) nerve']],
    [/superficial fibular/, ['Superficial fibular nerve', 'Common fibular (peroneal) nerve']], [/common fibular/, ['Common fibular (peroneal) nerve']],
    [/tibial nerve/, ['Tibial nerve', 'Sciatic nerve']], [/axillary/, ['Axillary nerve', 'Axillary nerve – muscular branches']],
    [/femoral nerve|femoral and/, ['Femoral nerve']], [/superior gluteal/, ['Superior gluteal nerve']],
    [/deep branch of the radial/, ['Radial nerve – deep branch', 'Radial nerve']], [/radial nerve/, ['Radial nerve', 'Radial nerve – muscular branches']],
    [/anterior interosseous/, ['Anterior interosseous nerve', 'Median nerve']], [/median/, ['Median nerve', 'Median nerve – muscular branches']],
    [/musculocutaneous/, ['Musculocutaneous nerve']], [/suprascapular/, ['Suprascapular nerve']], [/dorsal scapular/, ['Dorsal scapular nerve']],
    [/long thoracic/, ['Long thoracic nerve']], [/thoracodorsal/, ['Thoracodorsal nerve']], [/subclavius/, ['Nerve to subclavius']],
    [/upper and lower subscapular|upper subscapular/, ['Upper subscapular nerve', 'Lower subscapular nerve']], [/lower subscapular/, ['Lower subscapular nerve']],
    [/pectoral/, ['Lateral pectoral nerve', 'Medial pectoral nerve']],
    [/obturator nerve|and obturator/, ['Obturator nerve']], [/piriformis/, ['Nerve to piriformis']], [/quadratus femoris/, ['Nerve to quadratus femoris']],
    [/pudendal/, ['Pudendal nerve']], [/intercostal/, ['Intercostal nerves']], [/iliohypogastric/, ['Iliohypogastric nerve']], [/ilioinguinal/, ['Ilio-inguinal nerve']],
    [/facial/, ['Facial nerve (VII)']], [/accessory nerve/, ['Accessory nerve (XI)']], [/hypoglossal/, ['Hypoglossal nerve (XII)']],
    [/v3\) – nerve to|masseteric|deep temporal|mandibular nerve/, ['Mandibular nerve (V3) – anterior division']], [/nerve to mylohyoid/, ['Nerve to mylohyoid']],
    [/dorsal rami|ventral rami/, ['Spinal cord']],
  ];
  const nerveEntries = P.filter((e) => e.sys === 'nerve');
  const nerveBy = new Map(); nerveEntries.forEach((e) => { const k = e.baseEn.toLowerCase(); if (!nerveBy.has(k)) nerveBy.set(k, []); nerveBy.get(k).push(e); });
  const muscleNerves = new Map();
  function nervesOfMuscle(m) {
    if (muscleNerves.has(m.i)) return muscleNerves.get(m.i);
    const txt = ((m.mu && m.mu[6]) || '').toLowerCase(), out = new Set();
    for (const [re, names] of RULES) if (re.test(txt)) names.forEach((nm) => (nerveBy.get(nm.toLowerCase()) || []).forEach((n) => { if (!n.side || !m.side || n.side === m.side) out.add(n.i); }));
    const r = [...out]; muscleNerves.set(m.i, r); return r;
  }
  const musclesOfNerveBase = new Map();
  function musclesOfNerve(n) {
    const key = n.baseEn.toLowerCase() + '|' + (n.side || '');
    if (musclesOfNerveBase.has(key)) return musclesOfNerveBase.get(key);
    const r = P.filter((m) => m.sys === 'muscle' && m.k === 'muscle' && m.mu && (!n.side || !m.side || m.side === n.side) && nervesOfMuscle(m).some((i) => P[i].baseEn === n.baseEn));
    musclesOfNerveBase.set(key, r); return r;
  }
  const pill = (act, e, extra = '') => `<span class="pill2" data-act="${act}" data-i="${e.i}" ${extra}>${esc(name1(e))}</span>`;
  const uniqBase = (arr) => { const seen = new Set(); return arr.filter((e) => (seen.has(e.baseEn) ? false : (seen.add(e.baseEn), true))); };

  A.panelExtra = (e) => {
    let h = '';
    if (e.sys === 'nerve') {
      const ms = musclesOfNerve(e);
      if (ms.length) {
        h += `<h4>${T('Muscles supplied', 'العضلات اللي بيغذّيها')}</h4><div class="pills">${uniqBase(ms).slice(0, 40).map((m) => pill('goto', m)).join('')}</div>`;
        h += `<div class="actions" style="margin-top:10px"><button class="act on" data-act="nmshow" data-i="${e.i}">⚡ ${T('Show nerve + its muscles', 'اعرض العصب وعضلاته')}</button></div>`;
      }
    } else if (e.k === 'muscle' && e.mu) {
      const ns = nervesOfMuscle(e);
      if (ns.length) {
        h += `<h4>${T('Nerve supply (tap to see)', 'التعصيب (اضغط لعرضه)')}</h4><div class="pills">${ns.map((i) => pill('goto', P[i])).join('')}</div>`;
        h += `<div class="actions" style="margin-top:10px"><button class="act on" data-act="nmshow" data-i="${e.i}">⚡ ${T('Show muscle + its nerve', 'اعرض العضلة وعصبها')}</button></div>`;
      }
    }
    if (e.k === 'muscle' && e.mu) {
      h += `<h4>${T('Origin & insertion on the model (approximate)', 'البداية والنهاية على المجسم (تقريبي)')}</h4>
        <div class="legend2"><div><i style="background:#2ad45c"></i><b>${T('Origin', 'البداية')}</b> ${esc(T(e.mu[0], e.mu[1]) || '')}</div><div><i style="background:#4d8dff"></i><b>${T('Insertion', 'النهاية')}</b> ${esc(T(e.mu[2], e.mu[3]) || '')}</div></div>
        <div class="actions" style="margin-top:8px"><button class="act ${S.att ? 'on' : ''}" data-act="att">🟢🔵 ${T('Color origin / insertion', 'لوّن البداية والنهاية')}</button><button class="act" data-act="attiso">🦴 ${T('Isolate with its bones', 'اعزلها مع عظامها')}</button><button class="act" data-act="mov">▶ ${T('Movement view', 'شوف الحركة')}</button><button class="act" data-act="attswap">⇄ ${T('Swap ends', 'اعكس البداية/النهاية')}</button></div>`;
    }
    if (e.k === 'bone' && lmByBone.has(e.i)) {
      const ls = lmByBone.get(e.i).slice().sort((a, b) => a.en.localeCompare(b.en));
      h += `<h4>${T('Bone landmarks – tap to point to it', 'معالم العظمة – اضغط لتوجيه السهم')} (${ls.length})</h4><div class="pills">${ls.map((l) => `<span class="pill2" data-act="lmgo" data-i="${l.i}">${S.lmCol ? `<i style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:5px;background:${css(lmRgb(e.i, l))}"></i>` : ''}${esc(T(l.en, l.ar).replace(/ – (left|right)$| \((يسار|يمين)\)$/, ''))}</span>`).join('')}</div>`;
    }
    return h;
  };

  A.acts.nmshow = async (el) => {
    const e = P[+el.dataset.i]; let nerves, muscles;
    if (e.sys === 'nerve') { nerves = [e]; muscles = musclesOfNerve(e); } else { muscles = [e]; nerves = nervesOfMuscle(e).map((i) => P[i]); }
    await needLayers(['nerve', 'muscle']); S.layers.bone = 'ghost';
    S.focus = new Set([...nerves, ...muscles].map((q) => q.i));
    S.hl = new Map(); muscles.forEach((m) => S.hl.set(m.i, [1, 0.35, 0.25, 0.6])); nerves.forEach((n) => S.hl.set(n.i, [0, 0.95, 1, 0.92]));
    S.sel = -1; A.closePanelUI && A.closePanelUI();
    refresh(); flyToSet(S.focus);
    A.toast(T('Showing nerve and muscles – tap "Show all" to restore', 'العصب والعضلات معروضين – اضغط «إظهار الكل» للرجوع'), 3800);
  };
  const oldShowAll = A.onShowAll;
  A.onShowAll = () => { S.focus = null; S.hl = null; if (S.fnOn) { S.fnOn = false; S.fnSel = null; recolorBrain(); } fnBar(); closeCase(); setCut(null); if (oldShowAll) oldShowAll(); };

  /* ───────────────────────────── 3. clinical cases ───────────────────────────── */
  const CASES = [
    { id: 'radial', ic: '🖐', nerves: ['Radial nerve', 'Radial nerve – muscular branches', 'Radial nerve – deep branch', 'Posterior interosseous nerve', 'Radial nerve – superficial branch'],
      mus: ['brachioradialis', 'extensor carpi radialis', 'extensor digitorum', 'extensor carpi ulnaris', 'extensor digiti minimi', 'extensor indicis', 'extensor pollicis', 'abductor pollicis longus', 'supinator'],
      en: 'Radial nerve injury – wrist drop', ar: 'إصابة العصب الكعبري – سقوط الرسغ',
      mech: ['Fracture of the humeral shaft (radial groove), prolonged pressure in the armpit/arm ("Saturday-night palsy"), crutch misuse.', 'كسر في جسم عظمة العضد (الميزاب الكعبري)، أو ضغط طويل على الإبط/الذراع («شلل ليلة السبت»)، أو الاستخدام الخاطئ للعكاز.'],
      signs: [['Wrist drop: cannot extend wrist and fingers at the MCP joints.', 'سقوط الرسغ: لا يستطيع بسط الرسغ ولا بسط الأصابع عند مفاصل المشط السلامي.'], ['Weak grip because the wrist cannot stay extended.', 'ضعف القبضة لأن الرسغ لا يثبت في وضع البسط.'], ['Sensory loss over the dorsum of the hand (lateral part) and first web space.', 'فقدان الإحساس على ظهر اليد (الجهة الوحشية) وبين الإبهام والسبابة.'], ['Triceps is spared if the injury is below the radial groove.', 'العضلة ثلاثية الرؤوس تسلم إذا كانت الإصابة أسفل الميزاب الكعبري.']],
      test: ['Ask the patient to extend the wrist and fingers against gravity/resistance.', 'اطلب من المريض بسط الرسغ والأصابع ضد الجاذبية/المقاومة.'],
      rehab: ['Wrist-extension splint (cock-up) to prevent overstretching, passive range of motion, then progressive strengthening of the extensors and electrical stimulation as indicated.', 'جبيرة تثبّت الرسغ في البسط لمنع الشد الزائد، حركات سلبية للحفاظ على المدى، ثم تقوية تدريجية للباسطات وتنبيه كهربائي حسب الحالة.'] },
    { id: 'median', ic: '✋', nerves: ['Median nerve', 'Median nerve – palmar branch'],
      mus: ['abductor pollicis brevis', 'opponens pollicis', 'flexor pollicis brevis (superficial', 'lumbricals of hand'],
      en: 'Median nerve at the wrist – carpal tunnel syndrome', ar: 'العصب الأوسط عند الرسغ – متلازمة النفق الرسغي',
      mech: ['Compression under the flexor retinaculum: repetitive wrist use, pregnancy, diabetes, hypothyroidism, wrist fracture.', 'انضغاط أسفل الرباط المعترض الرسغي: الاستخدام المتكرر للرسغ، الحمل، السكري، قصور الدرقية، كسور الرسغ.'],
      signs: [['Tingling and numbness in the thumb, index, middle and half of the ring finger – worse at night.', 'تنميل وخدر في الإبهام والسبابة والوسطى ونصف البنصر، ويزيد ليلاً.'], ['Weak thumb abduction and opposition; wasting of the thenar eminence ("ape hand") in late cases.', 'ضعف تبعيد ومقابلة الإبهام، وضمور الأرنبة («يد القرد») في الحالات المتأخرة.'], ['Palm sensation is spared (palmar cutaneous branch leaves before the tunnel).', 'إحساس راحة اليد سليم (الفرع الجلدي الراحي يخرج قبل النفق).']],
      test: ['Phalen\'s test, Tinel\'s sign at the wrist, thumb opposition strength.', 'اختبار فالن، علامة تينيل عند الرسغ، قوة مقابلة الإبهام.'],
      rehab: ['Neutral wrist night splint, tendon/nerve gliding exercises, activity modification, ergonomic advice; surgery if severe or no response.', 'جبيرة ليلية بوضع الرسغ المحايد، تمارين انزلاق العصب والأوتار، تعديل النشاط ونصائح بيئة العمل؛ جراحة في الحالات الشديدة أو عند عدم الاستجابة.'] },
    { id: 'ulnar', ic: '🤙', nerves: ['Ulnar nerve', 'Ulnar nerve – deep branch', 'Ulnar nerve – muscular branches', 'Ulnar nerve – superficial branch', 'Ulnar nerve – dorsal branch', 'Ulnar nerve – palmar branch'],
      mus: ['flexor carpi ulnaris', 'flexor digitorum profundus', 'abductor digiti minimi of hand', 'opponens digiti minimi of hand', 'flexor digiti minimi brevis of hand', 'adductor pollicis', 'palmar interossei', 'dorsal interossei of hand', 'lumbricals of hand'],
      en: 'Ulnar nerve injury – claw hand', ar: 'إصابة العصب الزندي – اليد المخلبية',
      mech: ['Pressure or trauma behind the medial epicondyle (funny bone) or in the cubital tunnel; Guyon\'s canal at the wrist.', 'ضغط أو رض خلف اللقيمة الإنسية (عظمة الضحك) أو في النفق المرفقي، أو في قناة غيون عند الرسغ.'],
      signs: [['Claw hand: ring and little fingers hyperextended at MCP and flexed at IP joints.', 'اليد المخلبية: البنصر والخنصر في بسط عند المشطي السلامي وانثناء عند المفاصل بين السلاميات.'], ['Weak finger abduction/adduction and weak pinch (Froment\'s sign).', 'ضعف تبعيد وتقريب الأصابع وضعف القبضة الدقيقة (علامة فرومنت).'], ['Numbness of the little finger and the medial half of the ring finger.', 'خدر الخنصر ونصف البنصر الإنسي.']],
      test: ['Froment\'s sign, cross-finger test, Tinel\'s sign at the elbow.', 'علامة فرومنت، اختبار تقاطع الأصابع، علامة تينيل عند المرفق.'],
      rehab: ['Avoid prolonged elbow flexion/pressure, night extension splint, nerve gliding, intrinsic-muscle strengthening; surgical decompression if progressive.', 'تجنّب ثني المرفق الطويل والضغط عليه، جبيرة ليلية للبسط، تمارين انزلاق العصب، تقوية العضلات الداخلية لليد؛ تحرير جراحي إذا تقدّمت الحالة.'] },
    { id: 'axillary', ic: '💪', nerves: ['Axillary nerve', 'Axillary nerve – muscular branches'], mus: ['deltoid', 'teres minor'],
      en: 'Axillary nerve injury', ar: 'إصابة العصب الإبطي',
      mech: ['Fracture of the surgical neck of the humerus, anterior shoulder dislocation, deep injection into the deltoid.', 'كسر العنق الجراحي للعضد، خلع الكتف الأمامي، حقن عميق في العضلة الدالية.'],
      signs: [['Cannot abduct the arm from about 15° to 90°.', 'لا يستطيع تبعيد الذراع من نحو 15° حتى 90°.'], ['Flattened shoulder contour as the deltoid wastes.', 'تسطّح محيط الكتف مع ضمور الدالية.'], ['Loss of sensation over the "regimental badge" area of the lateral upper arm.', 'فقدان الإحساس على منطقة «شارة الجندي» في الجزء الوحشي من أعلى الذراع.']],
      test: ['Resisted abduction at 90° and sensation over the lateral arm.', 'مقاومة التبعيد عند 90° والإحساس على الجهة الوحشية للذراع.'],
      rehab: ['Protect the joint, passive and assisted range of motion, rotator-cuff stabilisation exercises, deltoid re-education and electrical stimulation.', 'حماية المفصل، حركات سلبية ومساعَدة، تمارين تثبيت الكفّة المدوّرة، إعادة تأهيل الدالية والتنبيه الكهربائي.'] },
    { id: 'longthoracic', ic: '🪽', nerves: ['Long thoracic nerve'], mus: ['serratus anterior'],
      en: 'Long thoracic nerve injury – winged scapula', ar: 'إصابة العصب الصدري الطويل – الكتف المجنّحة',
      mech: ['Stab wound or surgery (mastectomy, axillary dissection), heavy backpack, prolonged traction.', 'جرح طعني أو جراحة (استئصال الثدي، تشريح الإبط)، حقيبة ثقيلة، شدّ مطوّل.'],
      signs: [['Medial border of the scapula lifts off the chest wall, especially when pushing against a wall.', 'الحافة الإنسية للوح الكتف ترتفع عن جدار الصدر خاصة عند الدفع على الحائط.'], ['Difficulty raising the arm above 90°.', 'صعوبة رفع الذراع فوق 90°.']],
      test: ['Wall push-up test and observing the scapula from behind.', 'اختبار الضغط على الحائط ومراقبة لوح الكتف من الخلف.'],
      rehab: ['Scapular stabilisation, serratus anterior strengthening (wall slides, punch-plus) once reinnervation begins; avoid overhead loading early.', 'تثبيت لوح الكتف وتقوية المسننة الأمامية (الانزلاق على الحائط، اللكمة الإضافية) عند بدء عودة التعصيب؛ تجنّب الأحمال فوق الرأس مبكراً.'] },
    { id: 'fibular', ic: '🦶', nerves: ['Common fibular (peroneal) nerve', 'Deep fibular nerve', 'Deep fibular nerve – muscular branches', 'Superficial fibular nerve'],
      mus: ['tibialis anterior', 'extensor digitorum longus', 'extensor hallucis longus', 'fibularis', 'extensor digitorum brevis'],
      en: 'Common fibular nerve injury – foot drop', ar: 'إصابة العصب الشظوي المشترك – سقوط القدم',
      mech: ['Fracture or pressure at the neck of the fibula, tight casts/braces, crossing the legs for long periods, knee dislocation.', 'كسر أو ضغط على عنق الشظية، جبائر ضيقة، وضع رجل على رجل لفترات طويلة، خلع الركبة.'],
      signs: [['Foot drop: cannot dorsiflex the ankle or extend the toes.', 'سقوط القدم: لا يستطيع ثني الكاحل للأعلى ولا بسط أصابع القدم.'], ['High-stepping (steppage) gait.', 'مشية الرفع العالي للركبة (steppage).'], ['Sensory loss on the lateral leg and dorsum of the foot.', 'فقدان الإحساس على الجهة الوحشية للساق وظهر القدم.'], ['Eversion lost as well (superficial branch).', 'يضيع أيضاً التقليب للخارج (الفرع السطحي).']],
      test: ['Heel walking, ankle dorsiflexion and eversion strength.', 'المشي على الكعبين، قوة ثني الكاحل للأعلى وتقليب القدم.'],
      rehab: ['Ankle-foot orthosis (AFO), stretching of the calf to prevent contracture, gait training, strengthening of the dorsiflexors, electrical stimulation.', 'جبيرة كاحل-قدم (AFO)، إطالة عضلات السمانة لمنع التقفّع، تدريب المشي، تقوية رافعات القدم، تنبيه كهربائي.'] },
    { id: 'femoral', ic: '🦵', nerves: ['Femoral nerve'], mus: ['rectus femoris', 'vastus', 'sartorius', 'iliacus', 'pectineus'],
      en: 'Femoral nerve injury', ar: 'إصابة العصب الفخذي',
      mech: ['Pelvic or hip surgery, retroperitoneal haematoma (psoas), stretch during hip hyperextension, diabetic neuropathy.', 'جراحة الحوض أو الورك، ورم دموي خلف الصفاق (الحرقفية القطنية)، شدّ أثناء بسط الورك المفرط، اعتلال أعصاب السكري.'],
      signs: [['Weak knee extension – the knee "gives way" on stairs.', 'ضعف بسط الركبة – تنهار الركبة عند صعود السلم.'], ['Absent knee-jerk reflex.', 'غياب منعكس الركبة.'], ['Numbness over the front of the thigh and medial leg (saphenous nerve).', 'خدر في أمام الفخذ والجهة الإنسية للساق (العصب الصافن).']],
      test: ['Resisted knee extension, patellar reflex, sensation of anterior thigh.', 'مقاومة بسط الركبة، منعكس الرضفة، الإحساس في أمام الفخذ.'],
      rehab: ['Quadriceps strengthening and neuromuscular stimulation, knee brace for stability, gait training with assistive device if needed.', 'تقوية الرباعية والتنبيه العصبي العضلي، دعامة ركبة للثبات، تدريب مشي بوسيلة مساعدة عند الحاجة.'] },
    { id: 'sciatic', ic: '⚡', nerves: ['Sciatic nerve', 'Tibial nerve', 'Common fibular (peroneal) nerve', 'Deep fibular nerve', 'Superficial fibular nerve', 'Medial plantar nerve', 'Lateral plantar nerve'],
      mus: ['semitendinosus', 'semimembranosus', 'biceps femoris', 'gastrocnemius', 'soleus', 'tibialis', 'flexor digitorum longus', 'flexor hallucis longus', 'fibularis', 'extensor digitorum longus', 'extensor hallucis longus'],
      en: 'Sciatic nerve injury', ar: 'إصابة العصب الوركي',
      mech: ['Posterior hip dislocation or acetabular fracture, wrongly placed gluteal injection, piriformis compression, disc prolapse (sciatica).', 'خلع الورك الخلفي أو كسر الحُق، حقنة ألوية في مكان خاطئ، انضغاط من العضلة الكمثرية، انزلاق غضروفي (عرق النسا).'],
      signs: [['Weak knee flexion and almost total paralysis below the knee.', 'ضعف ثني الركبة وشلل شبه كامل ما تحت الركبة.'], ['Foot drop plus loss of plantar flexion.', 'سقوط القدم مع فقدان ثني القدم للأسفل.'], ['Sensory loss over most of the leg and foot except the medial side (saphenous).', 'فقدان الإحساس في معظم الساق والقدم عدا الجهة الإنسية (الصافن).'], ['Pain radiating from the buttock down the back of the thigh.', 'ألم ينتشر من الألية خلف الفخذ إلى الأسفل.']],
      test: ['Straight-leg raise (for radicular pain), ankle reflex, hamstring and calf strength.', 'اختبار رفع الساق المستقيمة (للألم الجذري)، منعكس الكاحل، قوة أوتار المأبض والسمانة.'],
      rehab: ['Treat the cause; neural mobilisation, core and hip stabilisation, AFO if foot drop, graded strengthening.', 'علاج السبب؛ تحريك العصب، تثبيت الجذع والورك، جبيرة AFO عند سقوط القدم، تقوية متدرجة.'] },
    { id: 'gluteal', ic: '🚶', nerves: ['Superior gluteal nerve'], mus: ['gluteus medius', 'gluteus minimus', 'tensor fasciae latae'],
      en: 'Superior gluteal nerve injury – Trendelenburg sign', ar: 'إصابة العصب الألوي العلوي – علامة ترندلنبرغ',
      mech: ['Misplaced intramuscular injection in the upper-inner gluteal region, hip surgery (lateral approach), pelvic fracture.', 'حقن عضلي في الجزء العلوي الإنسي من الألية، جراحة الورك (المدخل الوحشي)، كسور الحوض.'],
      signs: [['Pelvis drops on the side opposite the lesion when standing on the affected leg (positive Trendelenburg).', 'ينخفض الحوض في الجهة المقابلة للإصابة عند الوقوف على الرجل المصابة (ترندلنبرغ إيجابي).'], ['Waddling (Trendelenburg) gait; the trunk leans over the affected side.', 'مشية متمايلة، ويميل الجذع نحو الجهة المصابة.']],
      test: ['Single-leg stance for 30 seconds while watching the pelvis from behind.', 'الوقوف على رجل واحدة 30 ثانية مع مراقبة الحوض من الخلف.'],
      rehab: ['Gluteus medius strengthening (side-lying abduction, bridging, step-ups), gait re-education, cane in the opposite hand.', 'تقوية الألوية المتوسطة (تبعيد جانبي، جسر، صعود درجة)، إعادة تدريب المشي، عكاز في اليد المقابلة.'] },
    { id: 'musculocutaneous', ic: '💪', nerves: ['Musculocutaneous nerve', 'Lateral antebrachial cutaneous nerve'], mus: ['biceps brachii', 'brachialis', 'coracobrachialis'],
      en: 'Musculocutaneous nerve injury', ar: 'إصابة العصب العضلي الجلدي',
      mech: ['Shoulder dislocation or surgery, penetrating injury of the arm, compression by coracobrachialis.', 'خلع أو جراحة الكتف، جروح نافذة بالذراع، انضغاط عبر العضلة الغرابية العضدية.'],
      signs: [['Weak elbow flexion and weak supination with the forearm supinated.', 'ضعف ثني المرفق وضعف التسبيل.'], ['Loss of biceps reflex.', 'غياب منعكس العضلة ذات الرأسين.'], ['Numbness of the lateral forearm.', 'خدر في الجهة الوحشية من الساعد.']],
      test: ['Resisted elbow flexion with forearm supinated, biceps reflex.', 'مقاومة ثني المرفق والساعد في وضع التسبيل، منعكس ذات الرأسين.'],
      rehab: ['Brachialis/biceps strengthening, brachioradialis compensates; elbow range of motion and stimulation.', 'تقوية العضدية وذات الرأسين مع تعويض العضدية الكعبرية؛ مدى حركة المرفق وتنبيه كهربائي.'] },
    { id: 'erb', ic: '🧍', nerves: ['Brachial plexus – superior trunk', 'Brachial plexus – roots', 'Suprascapular nerve', 'Axillary nerve', 'Musculocutaneous nerve'],
      mus: ['deltoid', 'supraspinatus', 'infraspinatus', 'biceps brachii', 'brachialis', 'teres minor'],
      en: "Erb's palsy – upper trunk (C5–C6)", ar: 'شلل إرب – الجذع العلوي (C5–C6)',
      mech: ['Traction of the neck away from the shoulder: difficult birth (shoulder dystocia) or a fall from a motorbike.', 'شدّ العنق بعيداً عن الكتف: ولادة متعسرة (عسر ولادة الكتف) أو سقوط من دراجة نارية.'],
      signs: [['"Waiter\'s tip" posture: arm adducted and internally rotated, elbow extended, forearm pronated.', 'وضعية «يد النادل»: الذراع مقرّبة ومدوّرة للداخل، المرفق مبسوط، الساعد في كبّ.'], ['Hand grip is preserved.', 'قبضة اليد تبقى سليمة.']],
      test: ['Shoulder abduction/external rotation and elbow flexion strength; Moro reflex in infants.', 'قوة تبعيد وتدوير الكتف للخارج وثني المرفق؛ منعكس مورو عند الرضّع.'],
      rehab: ['Early passive range of motion to prevent contractures, positioning, then active strengthening; nerve repair if no recovery by 3–6 months.', 'حركات سلبية مبكرة لمنع التقفّعات، وضعيات صحيحة، ثم تقوية نشطة؛ إصلاح العصب إذا لم يحدث تحسن خلال 3–6 أشهر.'] },
    { id: 'accessory', ic: '🙆', nerves: ['Accessory nerve (XI)'], mus: ['trapezius', 'sternocleidomastoid'],
      en: 'Accessory nerve (XI) injury', ar: 'إصابة العصب الإضافي (XI)',
      mech: ['Neck lymph-node biopsy or surgery in the posterior triangle (very superficial), penetrating injury.', 'خزعة عقدة لمفاوية أو جراحة في المثلث الخلفي للعنق (سطحي جداً)، جروح نافذة.'],
      signs: [['Drooping shoulder, difficulty raising the arm above the horizontal.', 'تدلّي الكتف وصعوبة رفع الذراع فوق الأفقي.'], ['Weak shoulder shrug; weak head rotation to the opposite side if SCM is involved.', 'ضعف رفع الكتفين، وضعف إدارة الرأس للجهة المقابلة إذا أُصيبت القترائية.']],
      test: ['Shoulder shrug against resistance and resisted head rotation.', 'رفع الكتف ضد المقاومة وإدارة الرأس ضد المقاومة.'],
      rehab: ['Scapular stabiliser strengthening (rhomboids, serratus), posture correction and shoulder range of motion.', 'تقوية مثبّتات لوح الكتف (المعينيان والمسننة)، تصحيح الوضعية ومدى حركة الكتف.'] },
    { id: 'facial', ic: '🙂', nerves: ['Facial nerve (VII)'],
      mus: ['frontalis', 'orbicularis', 'zygomaticus', 'buccinator', 'mentalis', 'depressor', 'risorius', 'platysma', 'levator labii', 'levator anguli', 'nasalis', 'procerus', 'corrugator'],
      en: "Facial nerve palsy – Bell's palsy", ar: 'شلل العصب الوجهي – شلل بِل',
      mech: ['Usually a viral inflammation of the nerve in the facial canal (idiopathic); also trauma, tumours of the parotid, middle-ear infection.', 'غالباً التهاب فيروسي للعصب داخل القناة الوجهية (مجهول السبب)، وقد يحدث بسبب رضوض أو أورام النكفية أو التهاب الأذن الوسطى.'],
      signs: [['Weakness of the whole half of the face – including the forehead (lower motor neuron).', 'ضعف نصف الوجه كله بما في ذلك الجبهة (إصابة عصبون حركي سفلي).'], ['Cannot close the eye, drooping mouth corner, drooling.', 'لا يستطيع إغلاق العين، وتدلّي زاوية الفم وسيلان اللعاب.'], ['In a central (stroke) lesion the forehead is spared.', 'في الإصابة المركزية (السكتة) تسلم الجبهة.']],
      test: ['Raise eyebrows, close eyes tightly, smile and puff the cheeks.', 'رفع الحاجبين، إغلاق العينين بقوة، الابتسام ونفخ الخدّين.'],
      rehab: ['Eye protection (drops, taping at night), facial massage and gentle mirror exercises, avoid over-exercising; most recover within weeks to months.', 'حماية العين (قطرات وتغطية ليلاً)، تدليك الوجه وتمارين خفيفة أمام المرآة وتجنّب الإفراط؛ يتحسن معظم المرضى خلال أسابيع إلى أشهر.'] },
    { id: 'suprascapular', ic: '🏐', nerves: ['Suprascapular nerve'], mus: ['supraspinatus', 'infraspinatus'],
      en: 'Suprascapular nerve entrapment', ar: 'انحباس العصب فوق الكتف',
      mech: ['Compression at the suprascapular notch or spinoglenoid notch: overhead athletes (volleyball, tennis), ganglion cyst.', 'انضغاط عند الثلمة فوق الكتفية أو الثلمة الشوكية الحقانية: رياضيو الحركات فوق الرأس (الكرة الطائرة، التنس) أو كيس عقدي.'],
      signs: [['Deep, dull shoulder pain and weak shoulder abduction (initiation) and external rotation.', 'ألم عميق في الكتف مع ضعف بدء التبعيد وضعف التدوير الخارجي.'], ['Wasting in the supraspinous/infraspinous fossae.', 'ضمور في الحفرتين فوق وتحت الشوكة.']],
      test: ['Resisted external rotation, palpation for wasting, EMG.', 'مقاومة التدوير الخارجي، فحص الضمور باللمس، رسم عضلات (EMG).'],
      rehab: ['Relative rest from overhead work, scapular and rotator-cuff stabilisation, posture training; decompression if resistant.', 'راحة نسبية من الأعمال فوق الرأس، تثبيت اللوح والكفّة المدوّرة، تدريب الوضعية؛ تحرير جراحي إذا لم يستجب.'] },
  ];

  const matches = (m, subs) => { const b = m.baseEn.toLowerCase(); return subs.some((s) => b.includes(s)); };
  function caseSets(c) {
    const nerves = nerveEntries.filter((n) => c.nerves.includes(n.baseEn));
    const muscles = P.filter((m) => m.sys === 'muscle' && m.k === 'muscle' && matches(m, c.mus));
    return { nerves, muscles };
  }
  let activeCase = null;
  function closeCase() { activeCase = null; const b = $('caseBar'); if (b) b.hidden = true; }
  A.openCases = () => A.modal(() => {
    let h = `<h2>🩺 ${T('Clinical nerve cases', 'حالات إصابات الأعصاب')}</h2><p class="lead">${T('Pick a case: the model shows the injured nerve (cyan) and the muscles that become weak (red).', 'اختار حالة: المجسم هيعرض العصب المصاب (سماوي) والعضلات اللي بتضعف (أحمر).')}</p><div class="cases">`;
    for (const c of CASES) h += `<button class="case" data-act="caseopen" data-id="${c.id}"><span class="ci">${c.ic}</span><span>${esc(T(c.en, c.ar))}</span></button>`;
    return h + '</div>';
  });
  A.acts.caseopen = (el) => {
    const c = CASES.find((q) => q.id === el.dataset.id);
    A.modal(() => {
      const { muscles } = caseSets(c);
      const li = (a) => a.map((s) => `<li>${esc(T(s[0], s[1]))}</li>`).join('');
      return `<button class="mini" data-act="cases" style="margin-bottom:10px">‹ ${T('All cases', 'كل الحالات')}</button>
        <h2>${c.ic} ${esc(T(c.en, c.ar))}</h2>
        <h4>${T('Cause', 'السبب')}</h4><p>${esc(T(c.mech[0], c.mech[1]))}</p>
        <h4>${T('What you see', 'العلامات')}</h4><ul class="facts">${li(c.signs)}</ul>
        <h4>${T('Quick test', 'فحص سريع')}</h4><p>${esc(T(c.test[0], c.test[1]))}</p>
        <h4>${T('Physiotherapy note', 'ملاحظة علاج طبيعي')}</h4><div class="pt">${esc(T(c.rehab[0], c.rehab[1]))}</div>
        <h4>${T('Muscles affected', 'العضلات المتأثرة')} (${uniqBase(muscles).length})</h4><div class="pills">${uniqBase(muscles).map((m) => `<span class="pill2">${esc(T(m.baseEn, m.baseAr))}</span>`).join('')}</div>
        <div class="actions" style="margin-top:14px"><button class="act on" data-act="caseshow" data-id="${c.id}">▶ ${T('Show on the model', 'اعرضها على المجسم')}</button></div>
        <p class="tiny">${T('Educational draft – to be reviewed by a physician/physiotherapist.', 'مسودة تعليمية – تحتاج مراجعة طبيب/أخصائي علاج طبيعي.')}</p>`;
    });
  };
  A.acts.cases = () => (A.isPremium() ? A.openCases() : A.paywall('Clinical cases are part of Premium.', 'الحالات السريرية ضمن النسخة المميزة.'));
  A.acts.caseshow = async (el) => {
    const c = CASES.find((q) => q.id === el.dataset.id); A.closeModal();
    await needLayers(['nerve', 'muscle']); S.layers.bone = 'ghost';
    const side = 'r'; const sets = caseSets(c);
    const nerves = sets.nerves.filter((n) => !n.side || n.side === side), muscles = sets.muscles.filter((m) => !m.side || m.side === side);
    S.focus = new Set([...nerves, ...muscles].map((q) => q.i));
    S.hl = new Map(); muscles.forEach((m) => S.hl.set(m.i, [1, 0.28, 0.22, 0.72])); nerves.forEach((n) => S.hl.set(n.i, [0, 0.95, 1, 0.95]));
    S.sel = -1; closePanelSafe();
    activeCase = c; let bar = $('caseBar');
    if (!bar) { bar = document.createElement('div'); bar.id = 'caseBar'; bar.className = 'move-bar'; $('stage').appendChild(bar); }
    bar.hidden = false; bar.innerHTML = `<div class="t"><span>${c.ic} ${esc(T(c.en, c.ar))}</span><button class="mini" data-act="caseclose">✕</button></div><div class="tiny">${T('Cyan = injured nerve · Red = weakened muscles', 'سماوي = العصب المصاب · أحمر = العضلات الضعيفة')}</div>`;
    refresh(); if (S.focus.size) flyToSet(S.focus, 0.9);
  };
  A.acts.caseclose = () => { closeCase(); S.focus = null; S.hl = null; refresh(); };
  function closePanelSafe() { const p = $('panel'); if (p) { p.classList.add('closed'); p.classList.remove('peek'); document.getElementById('app').classList.remove('psel'); } }

  /* ───────────────────────────── 4. brain function map ───────────────────────────── */
  const FN = {
    motor: { c: [1.0, 0.48, 0.35], en: 'Movement (motor cortex)', ar: 'الحركة (القشرة الحركية)', re: /precentral|paracentral/i },
    sensory: { c: [1.0, 0.80, 0.30], en: 'Body sensation', ar: 'الإحساس بالجسم', re: /postcentral/i },
    plan: { c: [0.50, 0.72, 1.0], en: 'Planning & decisions (frontal)', ar: 'التخطيط واتخاذ القرار (الجبهي)', re: /superior frontal|middle frontal|frontopolar|orbital gyri|straight gyrus|frontomarginal/i },
    lang: { c: [0.71, 0.55, 1.0], en: 'Language (Broca, Wernicke areas)', ar: 'اللغة (منطقتا بروكا وفيرنيكه)', re: /inferior frontal|supramarginal|angular|middle temporal/i },
    vision: { c: [0.33, 0.84, 0.55], en: 'Vision', ar: 'الإبصار', re: /cuneus|lingual|occipital|optic|inferior temporal|fusiform/i },
    hearing: { c: [0.25, 0.82, 0.83], en: 'Hearing', ar: 'السمع', re: /transverse temporal|temporal plane|superior temporal|medial geniculate|inferior colliculus/i },
    limbic: { c: [1.0, 0.49, 0.71], en: 'Memory & emotion (limbic)', ar: 'الذاكرة والانفعال (الحوفي)', re: /cingulate|parahippocampal|hippocampus|amygdal|fornix|mamillary|septal|stria|habenula|temporal pole|insula/i },
    assoc: { c: [0.75, 0.64, 0.42], en: 'Spatial awareness (parietal)', ar: 'الإدراك المكاني (الجداري)', re: /superior parietal|precuneus/i },
    cereb: { c: [0.91, 0.58, 0.29], en: 'Balance & coordination (cerebellum)', ar: 'التوازن والتناسق (المخيخ)', re: /lobule|vermis|culmen|declive|folium|lingula|flocculus|tonsil of cerebellum|cerebellar|wing of central/i },
    stem: { c: [0.56, 0.63, 0.72], en: 'Vital functions (brainstem)', ar: 'الوظائف الحيوية (جذع الدماغ)', re: /midbrain|pons|medulla|olive|pyramid|peduncle|red nucleus|colliculus/i },
    basal: { c: [0.83, 0.42, 0.42], en: 'Movement control (basal nuclei)', ar: 'ضبط الحركة (النوى القاعدية)', re: /caudate|putamen|globus|lentiform/i },
    relay: { c: [0.94, 0.84, 0.54], en: 'Relay & homeostasis (thalamus, hypothalamus)', ar: 'المحطة والاتزان (المهاد وتحت المهاد)', re: /thalamus|hypothalamus|lateral geniculate/i },
    csf: { c: [0.35, 0.55, 0.93], en: 'CSF spaces (ventricles)', ar: 'مسارات السائل الدماغي (البطينات)', re: /ventricle|choroid|septum pellucidum/i },
    tract: { c: [0.95, 0.92, 0.86], en: 'Connecting fibres', ar: 'ألياف الاتصال', re: /callosum|commissure/i },
  };
  const fnOf = (e) => { for (const k of ['stem', 'cereb', 'relay', 'basal', 'csf', 'tract', 'limbic', 'hearing', 'vision', 'motor', 'sensory', 'assoc', 'lang', 'plan']) if (FN[k].re.test(e.baseEn)) return k; return null; };
  A.brainColor = (e) => { if (!S.fnOn) return null; const k = fnOf(e); return k ? FN[k].c : [0.6, 0.6, 0.6]; };
  function recolorBrain() {
    const x = X();
    P.forEach((e) => { if (e.sys === 'brain' && x.itemOf[e.i]) x.itemOf[e.i].color = colorFor(e); });
  }
  function fnBar() {
    let b = $('fnBar');
    if (!b) { b = document.createElement('div'); b.id = 'fnBar'; b.className = 'fn-bar'; $('stage').appendChild(b); }
    b.hidden = !S.fnOn;
    if (S.fnOn) b.innerHTML = Object.entries(FN).map(([k, f]) => `<button class="fn ${S.fnSel === k ? 'on' : ''}" data-act="fnpick" data-k="${k}"><i style="background:rgb(${f.c.map((v) => Math.round(v * 255)).join(',')})"></i>${esc(T(f.en, f.ar))}</button>`).join('') + `<button class="fn x" data-act="fnoff">✕</button>`;
  }
  A.acts.fn = async () => {
    if (!A.isPremium() && !S.fnOn) return A.paywall('The brain function map is part of Premium.', 'خريطة وظائف المخ ضمن النسخة المميزة.');
    S.fnOn = !S.fnOn; S.fnSel = null; S.focus = null;
    if (S.fnOn) { S.layers.brain = 'on'; await A.ensure('brain'); Object.assign(S.layers, { bone: 'ghost', muscle: 'off', vessel: 'off', nerve: 'off', organ: 'off', ligament: 'off' }); const x = X(); x.cam.flyTo([0, 1.55, 0.08], 0.95, 0.9, 0.15); }
    recolorBrain(); fnBar(); refresh(); A.redraw();
  };
  A.acts.fnoff = () => { S.fnOn = false; S.fnSel = null; S.focus = null; recolorBrain(); fnBar(); refresh(); };
  A.acts.fnpick = (el) => {
    const k = el.dataset.k;
    if (S.fnSel === k) { S.fnSel = null; S.focus = null; } else { S.fnSel = k; S.focus = new Set(P.filter((e) => e.sys === 'brain' && fnOf(e) === k).map((e) => e.i)); }
    fnBar(); refresh(); if (S.focus) flyToSet(S.focus, 0.6);
    if (S.fnSel) A.toast(T(FN[k].en, FN[k].ar), 2200);
  };

  /* ───────────────────────────── 5. cross-section ───────────────────────────── */
  const AX = { y: { n: [0, 1, 0], lo: 0.0, hi: 1.8, v: [1.0, 0.1, 0.0, 1.0] }, z: { n: [0, 0, 1], lo: -0.25, hi: 0.3, v: [1.0, 0.1, 0.0, 1.0] }, x: { n: [1, 0, 0], lo: -0.35, hi: 0.35, v: [0.1, 0.1, 0.0, 1.0] } };
  S.cutOn = false; S.cutAxis = 'y'; S.cutPos = 100;
  function applyCut() {
    const R = X().R; if (!R) return;
    if (!S.cutOn) { R.clip = [0, 0, 0, 0]; S.clipTest = null; return; }
    const a = AX[S.cutAxis], d = a.lo + (a.hi - a.lo) * (S.cutPos / 100);
    R.clip = [a.n[0], a.n[1], a.n[2], d];
    S.clipTest = (p) => p[0] * a.n[0] + p[1] * a.n[1] + p[2] * a.n[2] > d;
  }
  function cutBar() {
    let b = $('cutBar');
    if (!b) { b = document.createElement('div'); b.id = 'cutBar'; b.className = 'cut-bar'; $('stage').appendChild(b); }
    b.hidden = !S.cutOn; if (!S.cutOn) return;
    const lab = { y: T('Horizontal', 'أفقي'), z: T('Front–back', 'أمامي-خلفي'), x: T('Side', 'جانبي') };
    b.innerHTML = `<div class="ct">${['y', 'z', 'x'].map((k) => `<button class="opt ${S.cutAxis === k ? 'sel' : ''}" data-act="cutaxis" data-k="${k}">${lab[k]}</button>`).join('')}<button class="mini" data-act="cutoff">✕</button></div>
      <input id="cutRange" type="range" min="0" max="100" value="${S.cutPos}" aria-label="section">`;
    $('cutRange').addEventListener('input', (ev) => { S.cutPos = +ev.target.value; applyCut(); A.redraw(); });
  }
  function setCut(on) {
    if (on === null) { S.cutOn = false; } else S.cutOn = on;
    applyCut(); cutBar(); A.redraw();
  }
  A.acts.cut = async () => {
    if (S.cutOn) return setCut(false);
    for (const s of ['bone', 'muscle', 'vessel', 'organ', 'brain']) { if (S.layers[s] === 'off') S.layers[s] = 'on'; await A.ensure(s); }
    S.layers.nerve = 'off';
    S.cutAxis = 'y'; S.cutPos = 70; setCut(true); refresh();
    const x = X(); x.cam.flyTo([0, 1.1, 0], 2.6, null, 1.0); A.toast(T('Slide to cut. Orbit to look at the cut face.', 'حرّك الشريط للقص، ولف المجسم لتشوف سطح المقطع.'), 4000);
  };
  A.acts.cutaxis = (el) => {
    S.cutAxis = el.dataset.k; S.cutPos = 55; applyCut(); cutBar(); const x = X();
    if (S.cutAxis === 'y') x.cam.flyTo([0, 1.1, 0], 2.6, null, 1.1);
    if (S.cutAxis === 'z') x.cam.flyTo([0, 1.1, 0], 2.8, 0, 0.1);
    if (S.cutAxis === 'x') x.cam.flyTo([0, 1.1, 0], 2.8, 1.5708, 0.1);
    A.redraw();
  };
  A.acts.cutoff = () => setCut(false);

  /* ───────────────────────────── chips ───────────────────────────── */
  A.extraChips = () => {
    const ic = { lm: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 20l9-9M13 11l-1 5 5-1M14 3h7v5M21 3l-8 8" /></svg>', ca: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 3v18M3 12h18"/></svg>', fn: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/></svg>', cut: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 12h18M6 7l-3 5 3 5M18 7l3 5-3 5"/></svg>' };
    return `<span class="chip sep"></span>
      <button class="chip ${S.lm ? 'active' : ''}" data-act="lmtoggle">${ic.lm}${t('lmBtn')}</button>
      <button class="chip ${S.lmCol ? 'active' : ''}" data-act="lmcol">🎨 ${t('lmColBtn')}</button>
      <button class="chip ${S.att ? 'active' : ''}" data-act="att">🟢🔵 ${t('attBtn')}</button>
      <button class="chip" data-act="cases">${ic.ca}${t('casesBtn')}</button>
      <button class="chip ${S.fnOn ? 'active' : ''}" data-act="fn">${ic.fn}${t('fnBtn')}</button>
      <button class="chip ${S.cutOn ? 'active' : ''}" data-act="cut">${ic.cut}${t('cutBtn')}</button>`;
  };
  const oldLang = A.onLang;
  A.onLang = () => { fnBar(); cutBar(); if (oldLang) oldLang(); };
})();
