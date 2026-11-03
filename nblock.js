/* nblock.js — "Local anesthesia simulator" (dentistry): aim a needle at the inferior alveolar nerve on a 3D mandible and see what goes numb.
   v1: left inferior alveolar nerve block (IANB). Uses the app's own bone / nerve / tooth meshes. DRAFT: target position is estimated from the nerve mesh
   and the texts have not yet been reviewed by a dentist. */
'use strict';
window.__nblockLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  Object.assign(STR, {
    dentnb: { en: 'Local anesthesia simulator', ar: 'محاكي التخدير الموضعي' },
    dentnbSub: { en: 'Aim the needle at the nerve and see what goes numb', ar: 'وجّه الإبرة للعصب وشوف إيه اللي بيتخدّر' },
  });

  const IDS = {
    bone: 'FMA52748', ian: 'Z_ne_inferior_alveolar_nerve_l', lingual: 'Z_ne_lingual_nerve_l', mental: 'Z_ne_mental_nerve_l', buccal: 'Z_ne_buccal_nerve_l',
    teeth: ['Z_te_lower_medial_incisor_l', 'Z_te_lower_lateral_incisor_l', 'Z_te_lower_canine_l', 'Z_te_lower_first_premolar_l', 'Z_te_lower_second_premolar_l', 'Z_te_lower_first_molar_tooth_l', 'Z_te_lower_second_molar_tooth_l', 'Z_te_lower_third_molar_l'],
  };
  const VIEWS = { side: { yaw: 1.05, pit: 0.32 }, back: { yaw: 2.3, pit: 0.25 }, top: { yaw: 1.1, pit: 1.2 }, front: { yaw: 0.45, pit: 0.2 } };
  /* the injections: where the needle comes from, default view, and what the result says (DRAFT texts) */
  const INJ = {
    ianb: { en: 'Inferior alveolar (IANB)', ar: 'العصب السنخي السفلي (IANB)', src: [-0.02, 1.4585, 0.16], view: 'side',
      ok: ['All lower teeth on this side (31–38) up to the midline; the lower lip and chin (mental nerve).', 'كل أسنان الفك السفلي في الجهة دي (31–38) لحد خط الوسط، والشفة السفلية والذقن (العصب الذقني).'],
      no: ['The buccal gum around the molars (needs a long buccal nerve block). The tongue goes numb if the lingual nerve was reached too.', 'لثة الدهليزي عند الأضراس (محتاجة حقنة العصب الشدقي الطويل). واللسان بيتخدّر لو العصب اللساني اتأثر كمان.'],
      hint: ['Aim at the nerve just before it enters the mandibular foramen, on the inner side of the ramus.', 'وجّه ناحية العصب قبل ما يدخل ثقبة الفك السفلي مباشرةً، على السطح الداخلي للرامس.'] },
    buccal: { en: 'Long buccal', ar: 'العصب الشدقي الطويل', src: [0.05, 1.476, 0.2], view: 'side',
      ok: ['The buccal gum and cheek lining of the lower molars (36–38) — soft tissue only; the teeth stay sensitive.', 'لثة الدهليزي وبطانة الخد عند الأضراس السفلية (36–38) — أنسجة رخوة بس، والأسنان نفسها لسه حاسّة.'],
      no: ['The teeth themselves (needs an inferior alveolar block) and the tongue side.', 'الأسنان نفسها (محتاجة حقنة السنخي السفلي) وناحية اللسان.'],
      hint: ['Aim at the buccal nerve where it crosses the front of the ramus, level with the last molar.', 'وجّه ناحية العصب الشدقي وهو بيعدّي قدّام الرامس، على مستوى آخر ضرس.'] },
    mental: { en: 'Mental nerve', ar: 'العصب الذقني', src: [0.04, 1.446, 0.225], view: 'front',
      ok: ['The lower lip, chin and the buccal gum in front of the mental foramen (premolars to midline) — soft tissue.', 'الشفة السفلية والذقن ولثة الدهليزي قدّام الثقبة الذقنية (من الضواحك لخط الوسط) — أنسجة رخوة.'],
      no: ['Pulpal anesthesia of the teeth (unless the incisive nerve is blocked too) and the lingual tissues.', 'تخدير لب الأسنان (إلا لو العصب القاطع اتخدّر كمان) وأنسجة ناحية اللسان.'],
      hint: ['Aim at the mental foramen, between the two premolars, near the root apices.', 'وجّه ناحية الثقبة الذقنية، بين الضاحكين قريب من قمم الجذور.'] },
  };
  const SCEN = [
    { k: 'ianb', en: 'You need to treat the lower first molar (36). Which block numbs the tooth?', ar: 'عايز تعالج الضرس السفلي الأول (36). أنهي حقنة تخدّر السنّة؟' },
    { k: 'buccal', en: 'The tooth is numb but the patient still feels pain at the buccal gum of 37 while you place a clamp. Which block completes it?', ar: 'السنّة اتخدّرت بس المريض لسه حاسس بألم في لثة الدهليزي عند 37 وإنت بتركّب المشبك. أنهي حقنة تكمّل بيها؟' },
    { k: 'mental', en: 'The patient needs stitches in the lower lip on this side, with no need to numb the teeth. Which block is enough?', ar: 'المريض محتاج غُرز في الشفة السفلية الناحية دي ومش محتاج تخدّر الأسنان. أنهي حقنة تكفي؟' },
  ];
  const TC = [0.022, 1.472, 0.14], DIST = 0.27;
  const SRC = [-0.02, 1.4585, 0.16]; // syringe comes from the opposite premolar region

  const css = document.createElement('style');
  css.textContent = '.nbstage{position:relative;height:min(50vh,400px);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 40%,var(--surface2),var(--bg2));border:1px solid var(--line);touch-action:none}.nbstage canvas{width:100%;height:100%;display:block;cursor:grab}' +
    '.nbmsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:var(--muted);font-size:14px;pointer-events:none}.nbhud{position:absolute;inset-inline:10px;top:8px;display:flex;justify-content:space-between;gap:8px;pointer-events:none}' +
    '.nbhud span{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:11.5px;color:var(--text)}.nbmeter{height:8px;border-radius:6px;background:var(--surface2);border:1px solid var(--line);margin:8px 2px 2px;overflow:hidden}.nbmeter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#E5534B,#E3B95B,#3DBE7A);transition:width .12s}' +
    '.nbbtns{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.nbbtns .btn{flex:1;min-width:76px}.nbres{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px 14px;margin:8px 0}.nbres b{font-size:16px;display:block}.nbres p{margin:6px 0 0;font-size:13.5px;line-height:1.7}.nbres.ok{border-color:#3DBE7A}.nbres.no{border-color:#E5534B}.nbstars{font-size:22px;letter-spacing:3px;color:var(--gold)}.seg2{display:flex;gap:6px;margin:6px 0}.seg2 .btn{flex:1}.nbchips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.nbchips::-webkit-scrollbar{display:none}.nbchips button{flex:none;border:1px solid var(--line);background:var(--surface2);color:var(--text);border-radius:999px;padding:7px 13px;font-size:13px;font-family:inherit;cursor:pointer}.nbchips button.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}';
  document.head.appendChild(css);

  /* ───────── mesh helpers ───────── */
  const VS = 'attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform vec3 uT;varying vec3 vN;varying vec3 vW;void main(){vec3 p=aP+uT;vN=aN;vW=p;gl_Position=uVP*vec4(p,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform float uA;uniform vec3 uE;uniform vec3 uEye;void main(){vec3 n=normalize(vN);vec3 v=normalize(uEye-vW);if(dot(n,v)<0.0)n=-n;vec3 l=normalize(vec3(.4,.8,.6));float d=max(dot(n,l),0.0)*.7+.35+.15*max(dot(n,normalize(vec3(-.6,.1,.5))),0.0);float rim=pow(1.0-max(dot(n,v),0.0),2.5)*.25;gl_FragColor=vec4(uC*d+uE+vec3(rim)*.6,uA);}';
  function sh(gl, t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
  const persp = (f, a, n, fa) => { const t = 1 / Math.tan(f / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]); };
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function look(e, c, u) { const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]); }

  function cylData(a, b, r0, r1, seg) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], z = norm(d), t = Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], x = norm(cross(t, z)), y = cross(z, x);
    const P = [], N = [], I = [];
    for (let i = 0; i <= seg; i++) { const th = i / seg * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th); for (let k = 0; k < 2; k++) { const r = k ? r1 : r0, o = k ? b : a; P.push(o[0] + r * (c * x[0] + s * y[0]), o[1] + r * (c * x[1] + s * y[1]), o[2] + r * (c * x[2] + s * y[2])); N.push(c * x[0] + s * y[0], c * x[1] + s * y[1], c * x[2] + s * y[2]); } }
    for (let i = 0; i < seg; i++) { const a0 = i * 2; I.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) };
  }
  function sphData(r, n) {
    const P = [], N = [], I = [];
    for (let i = 0; i <= n; i++) { const p = i / n * Math.PI; for (let j = 0; j <= n; j++) { const t = j / n * 2 * Math.PI, x = Math.sin(p) * Math.cos(t), y = Math.cos(p), z = Math.sin(p) * Math.sin(t); P.push(r * x, r * y, r * z); N.push(x, y, z); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) };
  }

  let cur = null;
  function stop() { if (cur) { cur.dead = true; try { const x = cur.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* ignore */ } cur = null; } }

  async function loadMeshes() {
    const C = window.CATALOG || [], want = [IDS.bone, IDS.ian, IDS.lingual, IDS.mental, IDS.buccal].concat(IDS.teeth), packs = {}, M = {};
    for (const id of want) { const c = C.find((x) => x.id === id); if (!c) throw new Error('missing ' + id); if (!packs[c.pk]) packs[c.pk] = await Packs.load(c.pk); const d = Packs.part(packs[c.pk], c.o), n = d.pos.length / 3, P = new Float32Array(n * 3), N = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { P[i * 3 + k] = d.lo[k] + d.pos[i * 3 + k] / 65535 * d.span[k]; N[i * 3 + k] = d.nor[i * 3 + k] / 127; }
      M[id] = { P, N, I: d.idx }; }
    return M;
  }

  function start(cv, M, ui) {
    const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const U = {}; ['uVP', 'uT', 'uC', 'uA', 'uE', 'uEye'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const aP = gl.getAttribLocation(pr, 'aP'), aN = gl.getAttribLocation(pr, 'aN');
    const buf = (t, d, u) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, u || gl.STATIC_DRAW); return b; };
    const mk = (d, dyn) => ({ bp: buf(gl.ARRAY_BUFFER, d.P, dyn ? gl.DYNAMIC_DRAW : 0), bn: buf(gl.ARRAY_BUFFER, d.N, dyn ? gl.DYNAMIC_DRAW : 0), bi: buf(gl.ELEMENT_ARRAY_BUFFER, d.I), n: d.I.length });
    const upd = (m, d) => { gl.bindBuffer(gl.ARRAY_BUFFER, m.bp); gl.bufferData(gl.ARRAY_BUFFER, d.P, gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, m.bn); gl.bufferData(gl.ARRAY_BUFFER, d.N, gl.DYNAMIC_DRAW); };
    const G = {}; Object.keys(M).forEach((k) => { G[k] = mk(M[k]); });
    const needle = mk(cylData([0, 0, 0], [0, 0, 1], 1, 1, 8), true), hub = mk(cylData([0, 0, 0], [0, 0, 1], 1, 1, 10), true), barrel = mk(cylData([0, 0, 0], [0, 0, 1], 1, 1, 16), true), flange = mk(cylData([0, 0, 0], [0, 0, 1], 1, 1, 16), true), plunger = mk(cylData([0, 0, 0], [0, 0, 1], 1, 1, 10), true);
    const dotS = mk(sphData(0.0026, 12)), ringS = mk(sphData(0.0065, 14));
    // target: most posterior / superior end of the inferior alveolar nerve (≈ where it enters the mandibular foramen)
    const ian = M[IDS.ian].P; let best = -1e9, bi = 0;
    for (let i = 0; i < ian.length / 3; i++) { const s = -ian[i * 3 + 2] + ian[i * 3 + 1] * 0.5; if (s > best) { best = s; bi = i; } }
    const TG = { ianb: [ian[bi * 3], ian[bi * 3 + 1], ian[bi * 3 + 2]] };
    const near = (arr, ref, skipMin) => { let bd = 1e9, bj = 0; for (let i = 0; i < arr.length / 3; i++) { const d = Math.hypot(arr[i * 3] - ref[0], arr[i * 3 + 1] - ref[1], arr[i * 3 + 2] - ref[2]); if (d < bd) { bd = d; bj = i; } } return [arr[bj * 3], arr[bj * 3 + 1], arr[bj * 3 + 2]]; };
    TG.buccal = near(M[IDS.buccal].P, [0.0292 + 0.012, 1.4679 + 0.004, 0.1332 + 0.002]);
    { const mp = M[IDS.mental].P, ip = M[IDS.ian].P; let bd = 1e9, bj = 0; for (let i = 0; i < mp.length / 3; i++) for (let j = 0; j < ip.length / 3; j += 3) { const d = Math.hypot(mp[i * 3] - ip[j * 3], mp[i * 3 + 1] - ip[j * 3 + 1], mp[i * 3 + 2] - ip[j * 3 + 2]); if (d < bd) { bd = d; bj = i; } } TG.mental = [mp[bj * 3], mp[bj * 3 + 1], mp[bj * 3 + 2]]; }
    const st = { gl, dead: false, tip: [0, 0, 0], view: 'side', result: null, hint: false, sel: 'ianb', T0: TG.ianb, src: INJ.ianb.src };
    st.pick = (k) => { st.sel = k; st.T0 = TG[k]; st.src = INJ[k].src; st.view = INJ[k].view; st.tip = [st.T0[0] - 0.012, st.T0[1] + 0.012, st.T0[2] + 0.03]; st.result = null; };
    st.pick('ianb');
    const draw = (m, col, a, em, off) => {
      gl.uniform3fv(U.uC, col); gl.uniform1f(U.uA, a); gl.uniform3fv(U.uE, em || [0, 0, 0]); gl.uniform3fv(U.uT, off || [0, 0, 0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bp); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bn); gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.bi); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
    };
    const cam = () => { const v = VIEWS[st.view], cp = Math.cos(v.pit); const eye = [TC[0] + DIST * cp * Math.sin(v.yaw), TC[1] + DIST * Math.sin(v.pit), TC[2] + DIST * cp * Math.cos(v.yaw)]; return { eye, f: norm([TC[0] - eye[0], TC[1] - eye[1], TC[2] - eye[2]]) }; };
    const FOV = 0.62;
    function frame() {
      if (st.dead || !cv.isConnected || cv.offsetParent === null) { stop(); return; }
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), h = Math.max(2, Math.round(cv.clientHeight * d));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
      const { eye } = cam(), up = st.view === 'top' ? [0, 0, -1] : [0, 1, 0], vp = mul(persp(FOV, w / h, 0.01, 3), look(eye, TC, up));
      gl.uniformMatrix4fv(U.uVP, false, vp); gl.uniform3fv(U.uEye, eye); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const ok = st.result && st.result.stars >= 2, gl1 = [0.55, 0.4, 0], dim = [0.12, 0.08, 0], isI = st.sel === 'ianb';
      IDS.teeth.forEach((id) => draw(G[id], ok && isI ? [0.35, 0.95, 0.6] : [0.97, 0.95, 0.9], 1, ok && isI ? [0, 0.28, 0.12] : [0, 0, 0]));
      draw(G[IDS.ian], [1, 0.82, 0.25], 1, ok && isI ? gl1 : dim); draw(G[IDS.mental], [1, 0.82, 0.25], 1, ok && (isI || st.sel === 'mental') ? gl1 : dim); draw(G[IDS.lingual], [0.55, 0.8, 1], 1, [0, 0.05, 0.12]); draw(G[IDS.buccal], [0.9, 0.55, 0.9], 1, ok && st.sel === 'buccal' ? [0.6, 0.15, 0.6] : [0.06, 0, 0.06]);
      // syringe
      const SRC = st.src, tip = st.tip, dir = norm([tip[0] - SRC[0], tip[1] - SRC[1], tip[2] - SRC[2]]), back = (k) => [SRC[0] - dir[0] * k, SRC[1] - dir[1] * k, SRC[2] - dir[2] * k], O = [0, 0, 0];
      upd(needle, cylData(tip, SRC, 0.00035, 0.0004, 8)); upd(hub, cylData(SRC, back(0.006), 0.0012, 0.0018, 10)); upd(barrel, cylData(back(0.006), back(0.06), 0.0045, 0.0045, 16)); upd(flange, cylData(back(0.058), back(0.061), 0.0085, 0.0085, 16)); upd(plunger, cylData(back(0.06), back(0.078), 0.0016, 0.0016, 10));
      draw(needle, [0.9, 0.9, 0.95], 1, [0.1, 0.1, 0.12], O); draw(hub, [0.3, 0.55, 0.95], 1, [0, 0.05, 0.15], O); draw(barrel, [0.8, 0.9, 1], 1, [0.02, 0.05, 0.1], O); draw(flange, [0.3, 0.55, 0.95], 1, null, O); draw(plunger, [0.9, 0.9, 0.95], 1, null, O);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      draw(G[IDS.bone], [0.92, 0.86, 0.74], 0.42, [0.03, 0.025, 0.02]);
      if (st.result) { const c = ok ? [0.3, 0.9, 0.5] : [0.95, 0.3, 0.3]; draw(ringS, c, 0.28, ok ? [0, 0.25, 0.1] : [0.3, 0, 0], st.T0); draw(dotS, c, 1, ok ? [0, 0.3, 0.12] : [0.35, 0, 0], st.T0); }
      gl.disable(gl.DEPTH_TEST); draw(dotS, [1, 0.85, 0.3], 1, [0.5, 0.35, 0], tip);
      if (ui.onFrame) ui.onFrame(st);
      requestAnimationFrame(frame);
    }
    // finger follows in the plane perpendicular to the view direction (depth stays; change the view to adjust the other axis)
    const ray = (cx, cy) => { const r = cv.getBoundingClientRect(), nx = ((cx - r.left) / r.width) * 2 - 1, ny = 1 - ((cy - r.top) / r.height) * 2, { eye, f } = cam(), up = st.view === 'top' ? [0, 0, -1] : [0, 1, 0], rt = norm(cross(f, up)), uu = cross(rt, f), th = Math.tan(FOV / 2), asp = r.width / r.height;
      return { eye, f, dir: norm([f[0] + nx * th * asp * rt[0] + ny * th * uu[0], f[1] + nx * th * asp * rt[1] + ny * th * uu[1], f[2] + nx * th * asp * rt[2] + ny * th * uu[2]]) }; };
    const hit = (cx, cy) => { const { eye, f, dir } = ray(cx, cy), den = dir[0] * f[0] + dir[1] * f[1] + dir[2] * f[2], t = ((st.tip[0] - eye[0]) * f[0] + (st.tip[1] - eye[1]) * f[1] + (st.tip[2] - eye[2]) * f[2]) / (den || 1); return [eye[0] + dir[0] * t, eye[1] + dir[1] * t, eye[2] + dir[2] * t]; };
    let off = null;
    cv.addEventListener('pointerdown', (e) => { if (st.result && st.result.stars >= 2) return; cv.setPointerCapture(e.pointerId); const h = hit(e.clientX, e.clientY); off = [st.tip[0] - h[0], st.tip[1] - h[1], st.tip[2] - h[2]]; });
    cv.addEventListener('pointermove', (e) => { if (!off) return; const h = hit(e.clientX, e.clientY); st.tip = [Math.max(-0.03, Math.min(0.07, h[0] + off[0])), Math.max(1.42, Math.min(1.52, h[1] + off[1])), Math.max(0.08, Math.min(0.2, h[2] + off[2]))]; st.result = null; if (ui.onMove) ui.onMove(st); });
    const up = () => { off = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    st.dist = () => Math.hypot(st.tip[0] - st.T0[0], st.tip[1] - st.T0[1], st.tip[2] - st.T0[2]);
    requestAnimationFrame(frame);
    return st;
  }

  /* ───────── UI ───────── */
  const STARS = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const VN = { side: ['Side view', 'منظر جانبي'], back: ['Behind view', 'منظر من ورا'], top: ['Top view', 'منظر من فوق'], front: ['Front view', 'منظر من قدام'] };
  let tries = 0, mode = 'free', scen = 0, score = 0, asked = 0;
  const nm = (k) => T(INJ[k].en, INJ[k].ar);
  function topHtml() {
    const sel = cur ? cur.sel : 'ianb';
    const seg = `<div class="seg2"><button class="btn ${mode === 'free' ? 'primary' : ''}" data-act="nbmode" data-m="free">${T('Free practice', 'تدريب حر')}</button><button class="btn ${mode === 'quiz' ? 'primary' : ''}" data-act="nbmode" data-m="quiz">${T('Quiz', 'اختبار')}</button></div>`;
    const chips = `<div class="nbchips">${Object.keys(INJ).map((k) => `<button data-act="nbsel" data-k="${k}" class="${sel === k ? 'on' : ''}">${esc(nm(k))}</button>`).join('')}</div>`;
    const sc = mode === 'quiz' ? `<div class="nbres"><small>${T('Case', 'حالة')} ${asked + 1} · ${T('Score', 'النتيجة')} ${score}/${asked}</small><b>${T(SCEN[scen].en, SCEN[scen].ar)}</b><p class="tiny">${T('Choose the right injection below, then aim the needle and inject.', 'اختار الحقنة الصح من تحت، وبعدين وجّه الإبرة واحقن.')}</p></div>`
      : `<p class="lead">${T(INJ[sel].hint[0], INJ[sel].hint[1])}</p>`;
    return seg + sc + chips;
  }
  const renderTop = () => { const el = $('nbtop'); if (el) el.innerHTML = topHtml(); };
  function page() {
    return `<h2>💉 ${T('Local anesthesia simulator', 'محاكي التخدير الموضعي')}</h2><div id="nbtop">${topHtml()}</div>` +
      `<div class="nbstage" id="nbstage"><canvas id="nbcv"></canvas><div class="nbmsg" id="nbmsg">${T('Loading the jaw…', 'جارِ تحميل الفك…')}</div><div class="nbhud"><span id="nbview"></span><span id="nbtry">${T('Tries: ', 'محاولات: ')}0</span></div></div>` +
      `<div class="nbmeter" id="nbmeterw" style="display:none"><i id="nbmeter"></i></div>` +
      `<div class="nbbtns"><button class="btn" data-act="nbview" data-v="side">${T('Side', 'جانبي')}</button><button class="btn" data-act="nbview" data-v="front">${T('Front', 'من قدام')}</button><button class="btn" data-act="nbview" data-v="back">${T('Behind', 'من ورا')}</button><button class="btn" data-act="nbview" data-v="top">${T('Top', 'من فوق')}</button></div>` +
      `<div class="nbbtns"><button class="btn primary" data-act="nbinject">💉 ${T('Inject', 'احقن')}</button><button class="btn" data-act="nbhint">${T('Hint', 'تلميح')}</button><button class="btn" data-act="nbreset">${T('Restart', 'من الأول')}</button></div>` +
      `<div id="nbres"></div><p class="tiny" style="text-align:center;margin-top:8px">${T('Draft — target positions and texts are pending review by a dentist.', 'مبدئي — أماكن الأهداف والنصوص لسه بتتراجع من طبيب أسنان.')}</p>`;
  }
  function open() {
    stop(); tries = 0; mode = 'free'; scen = 0; score = 0; asked = 0;
    A.modal(page);
    const cv = $('nbcv'), msg = $('nbmsg');
    loadMeshes().then((M) => {
      if (!cv.isConnected) return;
      try {
        cur = start(cv, M, { onMove: () => { const r = $('nbres'); if (r) r.innerHTML = ''; }, onFrame: (s) => { if (s.hint) { const d = s.dist(), m = $('nbmeter'); if (m) m.style.width = Math.max(4, Math.min(100, 100 - d * 4000)) + '%'; } } });
        cur.setView = () => { const el = $('nbview'); if (el) el.textContent = T(VN[cur.view][0], VN[cur.view][1]); };
        msg.remove(); cur.setView(); renderTop();
      } catch (e) { msg.textContent = T('Your device could not start the 3D view.', 'جهازك مقدرش يشغّل العرض 3D.'); }
    }).catch(() => { if (msg.isConnected) msg.textContent = T('Could not load the models — they need an internet connection the first time.', 'مقدرناش نحمّل المجسمات — أول مرة بتحتاج إنترنت.'); });
  }
  A.acts.nbview = (el) => { if (cur) { cur.view = el.dataset.v; cur.setView(); } };
  A.acts.nbhint = () => { if (!cur) return; cur.hint = !cur.hint; const w = $('nbmeterw'); if (w) w.style.display = cur.hint ? '' : 'none'; };
  A.acts.nbreset = () => { if (!cur) return; cur.pick(cur.sel); cur.setView(); $('nbres').innerHTML = ''; };
  A.acts.nbsel = (el) => { if (!cur) return; cur.pick(el.dataset.k); cur.setView(); $('nbres').innerHTML = ''; renderTop(); };
  A.acts.nbmode = (el) => { mode = el.dataset.m; scen = Math.floor(Math.random() * SCEN.length); score = 0; asked = 0; if (cur) { $('nbres').innerHTML = ''; } renderTop(); };
  A.acts.nbnext = () => { scen = (scen + 1 + Math.floor(Math.random() * (SCEN.length - 1))) % SCEN.length; if (cur) cur.pick(cur.sel); $('nbres').innerHTML = ''; renderTop(); };
  A.acts.nbinject = () => {
    if (!cur) return; const d = cur.dist(), stars = d <= 0.0045 ? 3 : d <= 0.009 ? 2 : d <= 0.014 ? 1 : 0, k = cur.sel, I = INJ[k]; tries++; cur.result = { stars, d };
    const tr = $('nbtry'); if (tr) tr.textContent = T('Tries: ', 'محاولات: ') + tries;
    const ok = stars >= 2;
    let h = '';
    if (mode === 'quiz') {
      const right = k === SCEN[scen].k; asked++; if (right && ok) score++;
      h = right && ok ? `<div class="nbres ok"><div class="nbstars">${STARS(stars)}</div><b>${T('Correct injection and good aim.', 'حقنة صح وتصويب كويس.')}</b></div>`
        : right ? `<div class="nbres no"><b>${T('Right injection, but the aim missed.', 'الحقنة صح بس التصويب غلط.')}</b><p>${T(I.hint[0], I.hint[1])}</p></div>`
          : `<div class="nbres no"><b>${T('Wrong injection for this case.', 'الحقنة دي غلط للحالة دي.')}</b><p>${T('Correct: ', 'الصح: ')}${esc(nm(SCEN[scen].k))}</p></div>`;
      h += `<div class="nbbtns"><button class="btn primary" data-act="nbnext">${T('Next case', 'الحالة اللي بعدها')}</button></div>`;
      renderTop();
    }
    if (ok && (mode === 'free' || k === SCEN[scen].k)) h += `<div class="nbres ok"><b>${stars === 3 ? T('Excellent — the needle is at the nerve.', 'ممتاز — الإبرة عند العصب بالظبط.') : T('Good — close enough for a working block.', 'كويس — قريب كفاية والتخدير هيشتغل.')} ${mode === 'free' ? '<span class="nbstars">' + STARS(stars) + '</span>' : ''}</b>` +
      `<p><b>${T('Numb now:', 'اتخدّر دلوقتي:')}</b> ${T(I.ok[0], I.ok[1])}</p><p><b>${T('Not numb:', 'لسه مش متخدّر:')}</b> ${T(I.no[0], I.no[1])}</p></div>`;
    else if (mode === 'free') h = `<div class="nbres no"><b>${stars === 1 ? T('Too far — only a weak effect.', 'بعيد شوية — تأثير ضعيف.') : T('Missed — no numbness.', 'غلط — مفيش تخدير.')}</b><p>${T('Use “Hint”, rotate the view and move the tip again. ', 'جرّب «تلميح»، وغيّر الزاوية وحرّك الطرف تاني. ')}${T(I.hint[0], I.hint[1])}</p></div>`;
    $('nbres').innerHTML = h;
  };
  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.dentnb = open; });
})();
