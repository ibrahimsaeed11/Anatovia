/* pjourney.js — "Drug journey" (nursing pharmacology): follow an oral drug through the 3D body (ADME) with a plasma-concentration curve.
   v1: oral route only. Uses the app's own organ / vessel meshes. DRAFT: the path is approximate and the texts are pending review by a pharmacist / nursing instructor.
   Educational only — not for dose calculation. */
'use strict';
window.__pjourneyLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  Object.assign(STR, {
    pjourney: { en: 'Drug journey', ar: 'رحلة الدوا' },
    pjourneySub: { en: 'Follow a drug through the body, step by step', ar: 'تابع الدوا في الجسم خطوة بخطوة' },
  });
  const COL = { Z_or_oesophagus: [.9, .55, .5], Z_or_stomach: [.95, .6, .55], Z_or_duodenum: [.95, .72, .5], Z_or_jejunum: [.95, .72, .55], Z_or_liver: [.6, .28, .22], Z_or_gallbladder: [.5, .7, .3], Z_or_pancreas: [.9, .78, .45], Z_or_kidney_l: [.72, .3, .3], Z_or_kidney_r: [.72, .3, .3], Z_or_ureter_l: [.95, .85, .4], Z_or_ureter_r: [.95, .85, .4], Z_or_urinary_bladder: [.95, .85, .5], Z_or_right_atrium: [.85, .25, .3], Z_or_right_ventricle: [.8, .2, .28], Z_or_left_atrium: [.9, .3, .32], Z_or_left_ventricle: [.9, .25, .3], Z_ve_hepatic_portal_vein: [.4, .5, 1], Z_ve_hepatic_veins: [.35, .5, 1], Z_ve_superior_mesenteric_vein: [.4, .5, 1], Z_ve_inferior_vena_cava_abdominal_part: [.35, .5, 1], Z_ve_inferior_vena_cava_thoracic_part: [.35, .5, 1], Z_ve_thoracic_aorta: [1, .3, .3], Z_ve_abdominal_aorta: [1, .3, .3], Z_or_ascending_colon: [.8, .65, .55], Z_or_transverse_colon: [.8, .65, .55], Z_or_descending_colon: [.8, .65, .55], Z_or_sigmoid_colon: [.8, .65, .55] };
  /* approximate path (body coords: y up, face +z) */
  const WP = [['mouth', [0, 1.47, .165]], ['throat', [0, 1.415, .105]], ['eso', [.0045, 1.30, .09]], ['eso2', [.015, 1.19, .108]], ['stomach', [.0391, 1.1147, .133]], ['duod', [-.0161, 1.0448, .1285]], ['jej', [.0093, .9395, .1483]], ['smv', [-.029, 1.011, .1301]], ['portal', [-.0055, 1.1221, .1274]], ['liver', [-.035, 1.125, .118]], ['hv', [-.0093, 1.1863, .1225]], ['ivc', [-.0131, 1.21, .1142]], ['ra', [-.0152, 1.2396, .1262]], ['rv', [.0188, 1.2295, .1441]], ['la', [.0203, 1.2444, .109]], ['lv', [.0424, 1.2244, .1258]], ['aorta', [.0147, 1.20, .0736]], ['aorta2', [.0074, 1.0686, .109]], ['kidney', [.0596, 1.0623, .0804]], ['ureter', [.0333, .9459, .0912]], ['bladder', [.0004, .8135, .0981]]];
  const ST = [
    { k: 'swallow', to: 'stomach', off: -0.03, org: ['Z_or_oesophagus'], t: ['Swallowing', 'البلع'], d: ['The tablet travels from the mouth down the oesophagus to the stomach in seconds.', 'الحبة بتنزل من الفم للمريء وبتوصل المعدة في ثواني.'] },
    { k: 'stomach', from: 'stomach', off0: -0.03, to: 'duod', org: ['Z_or_stomach'], t: ['Stomach', 'المعدة'], d: ['The tablet breaks up and dissolves in stomach acid. Food can delay how fast it moves on.', 'الحبة بتتفتت وتذوب في حمض المعدة. الأكل ممكن يبطّأ الوصول.'] },
    { k: 'gut', from: 'duod', to: 'smv', org: ['Z_or_duodenum', 'Z_or_jejunum'], t: ['Small intestine: absorption', 'الأمعاء: الامتصاص'], d: ['Most of the drug is absorbed here, through the intestinal wall into the blood.', 'هنا أغلب الدوا بيتمتص من جدار الأمعاء الدقيقة للدم.'] },
    { k: 'liver', from: 'smv', to: 'hv', org: ['Z_or_liver', 'Z_ve_hepatic_portal_vein'], t: ['Liver: first-pass', 'الكبد: أول مرور'], d: ['Blood from the gut reaches the liver through the portal vein, and the liver breaks down part of the drug before it reaches the rest of the body.', 'الدم بيروح من الأمعاء للكبد عن طريق الوريد البابي، والكبد بيكسّر جزء من الدوا قبل ما يوصل باقي الجسم.'] },
    { k: 'circ', from: 'hv', to: 'aorta', org: ['Z_or_right_atrium', 'Z_or_right_ventricle', 'Z_or_left_atrium', 'Z_or_left_ventricle'], t: ['Circulation', 'الدورة الدموية'], d: ['The drug passes through the heart and is pumped through the arteries to the whole body.', 'الدوا بيعدّي القلب ويتضخ في الشرايين لكل الجسم.'] },
    { k: 'target', from: 'aorta', to: 'kidney', off1: -0.01, org: ['Z_ve_thoracic_aorta', 'Z_ve_abdominal_aorta'], t: ['Distribution and effect', 'التوزيع والتأثير'], d: ['The drug reaches the target tissue, binds to its receptors and produces its effect.', 'الدوا بيوصل الأنسجة المستهدفة ويرتبط بالمستقبلات ويعمل مفعوله.'] },
    { k: 'excr', from: 'kidney', off0: -0.01, to: null, org: ['Z_or_kidney_l', 'Z_or_ureter_l', 'Z_or_urinary_bladder'], t: ['Excretion', 'الإخراج'], d: ['The kidneys filter the drug out of the blood and it leaves in the urine.', 'الكلى بتصفّي الدوا من الدم وبيخرج مع البول.'] },
  ];
  const css = document.createElement('style');
  css.textContent = '.pjstage{position:relative;height:min(54vh,430px);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 40%,var(--surface2),var(--bg2));border:1px solid var(--line);touch-action:none}.pjstage canvas{width:100%;height:100%;display:block}' +
    '.pjmsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:var(--muted);font-size:14px;pointer-events:none}.pjtag{position:absolute;inset-inline:10px;top:10px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:8px 12px;box-shadow:0 6px 18px rgba(0,0,0,.3);pointer-events:none}' +
    '.pjtag small{color:var(--accent);font-weight:800;font-size:11px}.pjtag b{display:block;font-size:15px}.pjtag p{margin:3px 0 0;font-size:12.5px;line-height:1.55;color:var(--muted)}.pjsteps{display:flex;gap:4px;margin:8px 0}.pjsteps button{flex:1;height:22px;border:0;padding:0;background:none;cursor:pointer}.pjsteps button i{display:block;height:5px;margin-top:8px;border-radius:4px;background:var(--surface2)}.pjsteps button.on i{background:var(--accent)}.pjsteps button.cur i{height:7px;margin-top:7px}' +
    '.pjroutes{display:flex;gap:6px;margin:6px 0}.pjroutes span{flex:1;text-align:center;padding:7px 2px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);font-size:12.5px;font-weight:700;color:var(--muted)}.pjroutes span.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pjroutes small{display:block;font-size:9.5px;font-weight:600;opacity:.8}' +
    '.pjcurve{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:6px 8px 4px}.pjcurve small{color:var(--muted);font-size:11px;display:flex;justify-content:space-between}.pjcurve canvas{width:100%;height:92px;display:block}.pjctl{display:flex;gap:6px;margin:8px 0 2px}.pjctl .btn{flex:1}';
  document.head.appendChild(css);

  const VS = 'attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform vec3 uT;varying vec3 vN;varying vec3 vW;void main(){vec3 p=aP+uT;vN=aN;vW=p;gl_Position=uVP*vec4(p,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform float uA;uniform vec3 uE;uniform vec3 uEye;void main(){vec3 n=normalize(vN);vec3 v=normalize(uEye-vW);if(dot(n,v)<0.0)n=-n;vec3 l=normalize(vec3(.3,.7,.8));float d=max(dot(n,l),0.0)*.6+.4;float rim=pow(1.0-max(dot(n,v),0.0),2.2)*.45;gl_FragColor=vec4(uC*d+uE+vec3(rim)*uC*.8,uA);}';
  const sh = (gl, t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
  const persp = (f, a, n, fa) => { const t = 1 / Math.tan(f / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]); };
  const look = (e, c, u) => { const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]); };
  function sphData(r, n) { const P = [], N = [], I = []; for (let i = 0; i <= n; i++) { const p = i / n * Math.PI; for (let j = 0; j <= n; j++) { const t = j / n * 2 * Math.PI, x = Math.sin(p) * Math.cos(t), y = Math.cos(p), z = Math.sin(p) * Math.sin(t); P.push(r * x, r * y, r * z); N.push(x, y, z); } } for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; I.push(a, b, a + 1, b, b + 1, a + 1); } return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) }; }
  function tubeData(pts, r, seg) { const P = [], N = [], I = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], z = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), t = Math.abs(z[1]) < .9 ? [0, 1, 0] : [1, 0, 0], x = norm(cross(t, z)), y = cross(z, x); for (let k = 0; k <= seg; k++) { const th = k / seg * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th); P.push(pts[i][0] + r * (c * x[0] + s * y[0]), pts[i][1] + r * (c * x[1] + s * y[1]), pts[i][2] + r * (c * x[2] + s * y[2])); N.push(c * x[0] + s * y[0], c * x[1] + s * y[1], c * x[2] + s * y[2]); } } for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); } return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) }; }
  const cr = (p0, p1, p2, p3, t) => [0, 1, 2].map((k) => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));

  /* path */
  const pts = [], idxAt = {};
  for (let i = 0; i < WP.length - 1; i++) { const p0 = WP[Math.max(0, i - 1)][1], p1 = WP[i][1], p2 = WP[i + 1][1], p3 = WP[Math.min(WP.length - 1, i + 2)][1]; idxAt[WP[i][0]] = pts.length; for (let s = 0; s < 24; s++) pts.push(cr(p0, p1, p2, p3, s / 24)); }
  idxAt[WP[WP.length - 1][0]] = pts.length; pts.push(WP[WP.length - 1][1]);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const TOT = cum[cum.length - 1], frac = (n) => cum[idxAt[n]] / TOT;
  const posAt = (f) => { const d = Math.max(0, Math.min(1, f)) * TOT; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [0, 1, 2].map((k) => pts[i - 1][k] + (pts[i][k] - pts[i - 1][k]) * t); };
  ST.forEach((s, i) => { s.a = (s.from ? frac(s.from) : 0) + (s.off0 || 0); s.b = (s.to ? frac(s.to) : 1) + (s.off || s.off1 || 0); if (i === 0) s.a = 0; });
  const DUR = 24; // seconds per full loop

  let cur = null;
  function stop() { if (cur) { cur.dead = true; try { const x = cur.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* ignore */ } cur = null; } }
  async function loadMeshes() {
    const C = window.CATALOG || [], packs = {}, M = {};
    for (const id of Object.keys(COL)) { const c = C.find((x) => x.id === id); if (!c) continue; if (!packs[c.pk]) packs[c.pk] = await Packs.load(c.pk); const d = Packs.part(packs[c.pk], c.o), n = d.pos.length / 3, P = new Float32Array(n * 3), N = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { P[i * 3 + k] = d.lo[k] + d.pos[i * 3 + k] / 65535 * d.span[k]; N[i * 3 + k] = d.nor[i * 3 + k] / 127; }
      M[id] = { P, N, I: d.idx }; }
    if (Object.keys(M).length < 8) throw new Error('models missing');
    return M;
  }

  function start(cv, M) {
    const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const U = {}; ['uVP', 'uT', 'uC', 'uA', 'uE', 'uEye'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const aP = gl.getAttribLocation(pr, 'aP'), aN = gl.getAttribLocation(pr, 'aN');
    const buf = (t, d) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, gl.STATIC_DRAW); return b; };
    const mk = (d) => ({ bp: buf(gl.ARRAY_BUFFER, d.P), bn: buf(gl.ARRAY_BUFFER, d.N), bi: buf(gl.ELEMENT_ARRAY_BUFFER, d.I), n: d.I.length });
    const G = {}; Object.keys(M).forEach((k) => { G[k] = mk(M[k]); });
    const tube = mk(tubeData(pts, .0022, 8)), dot = mk(sphData(.0055, 12)), halo = mk(sphData(.011, 12));
    const draw = (m, col, a, em, off) => { gl.uniform3fv(U.uC, col); gl.uniform1f(U.uA, a); gl.uniform3fv(U.uE, em || [0, 0, 0]); gl.uniform3fv(U.uT, off || [0, 0, 0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bp); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, m.bn); gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.bi); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0); };
    const st = { gl, dead: false, p: 0, playing: true, speed: 1, yaw: 0, last: 0, si: 0, onStage: null };
    const TC = [0, 1.13, 0.1];
    function frame(now) {
      if (st.dead || !cv.isConnected || cv.offsetParent === null) { stop(); return; }
      const dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0; st.last = now;
      if (st.playing) st.p = (st.p + dt * st.speed / DUR) % 1;
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), h = Math.max(2, Math.round(cv.clientHeight * d));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
      const R = 1.15, eye = [TC[0] + R * Math.sin(st.yaw), 1.13, TC[2] + R * Math.cos(st.yaw)];
      gl.uniformMatrix4fv(U.uVP, false, mul(persp(.62, w / h, .05, 5), look(eye, TC, [0, 1, 0]))); gl.uniform3fv(U.uEye, eye); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      let si = ST.findIndex((s) => st.p >= s.a && st.p < s.b); if (si < 0) si = ST.length - 1;
      if (si !== st.si || !st.shown) { st.si = si; st.shown = true; if (st.onStage) st.onStage(si); }
      const s = ST[si];
      draw(tube, [1, .85, .3], 1, [.25, .18, 0]);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      for (const id in G) { const act = s.org.includes(id); draw(G[id], COL[id], act ? .72 : .26, act ? [.2, .14, .05] : null); }
      gl.disable(gl.DEPTH_TEST);
      const lv = frac('liver');
      for (let k = 0; k < 9; k++) { const pp = st.p - k * .012; if (pp < 0) continue; if (k % 4 === 3 && pp > lv) continue; const pos = posAt(pp); if (k === 0) { draw(halo, [1, .82, .25], .35, [.4, .28, 0], pos); draw(dot, [1, .9, .5], 1, [.6, .5, .1], pos); } else draw(dot, [1, .82, .25], Math.max(.25, .95 - k * .09), [.5, .36, 0], pos); }
      if (st.onTick) st.onTick(st.p);
      requestAnimationFrame(frame);
    }
    let dx = null; cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); dx = e.clientX; });
    cv.addEventListener('pointermove', (e) => { if (dx === null) return; st.yaw = Math.max(-1.2, Math.min(1.2, st.yaw + (e.clientX - dx) * 0.008)); dx = e.clientX; });
    const up = () => { dx = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    requestAnimationFrame(frame);
    return st;
  }

  /* concentration curve (one-compartment, first-order absorption) */
  const KA = 1.6, KE = 0.28, TM = Math.log(KA / KE) / (KA - KE), CF = (t) => (Math.exp(-KE * t) - Math.exp(-KA * t)) / (KA - KE) * KA, FM = CF(TM);
  function curve(cc, p) {
    const c = cc.getContext('2d'), d = Math.min(window.devicePixelRatio || 1, 2), W = Math.max(2, Math.round(cc.clientWidth * d)), H = Math.max(2, Math.round(92 * d)); if (cc.width !== W || cc.height !== H) { cc.width = W; cc.height = H; }
    c.clearRect(0, 0, W, H); const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--accent').trim() || '#E3B95B', mut = css.getPropertyValue('--muted').trim() || '#999', line = css.getPropertyValue('--line').trim() || '#444';
    const X = (t) => 20 * d / 2 + t / 14 * (W - 30 * d / 2 * 1.2), Y = (v) => H - 16 * d / 2 - (v / FM) * (H - 34 * d / 2), tt = Math.min(14, p * 14);
    c.strokeStyle = line; c.lineWidth = d; c.beginPath(); c.moveTo(X(0), H - 16 * d / 2); c.lineTo(W - 6, H - 16 * d / 2); c.moveTo(X(0), 6); c.lineTo(X(0), H - 16 * d / 2); c.stroke();
    c.fillStyle = mut; c.font = (10 * d) + 'px Cairo,sans-serif'; c.textAlign = 'end'; c.fillText(T('Time', 'الوقت'), W - 6, H - 2);
    c.strokeStyle = acc; c.lineWidth = 2 * d; c.beginPath(); for (let t = 0; t <= 14; t += .1) { const x = X(t), y = Y(CF(t)); t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = acc; c.globalAlpha = .18; c.beginPath(); c.moveTo(X(0), H - 16 * d / 2); for (let t = 0; t <= tt; t += .1) c.lineTo(X(t), Y(CF(t))); c.lineTo(X(tt), H - 16 * d / 2); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(X(tt), Y(CF(tt)), 4.5 * d, 0, 7); c.fill();
  }

  const nm = (s) => T(s.t[0], s.t[1]);
  function page() {
    return `<h2>💊 ${T('Drug journey', 'رحلة الدوا في الجسم')}</h2><p class="lead">${T('Follow the drug from the moment you swallow it until it leaves the body. Drag the body to rotate it.', 'تابع الدوا من أول ما تبلعه لحد ما يخرج. اسحب الجسم عشان تلفّه.')}</p>` +
      `<div class="pjroutes"><span class="on">${T('Oral', 'بالفم')}</span><span>${T('IV', 'وريدي')}<small>${T('soon', 'قريبًا')}</small></span><span>${T('IM', 'عضلي')}<small>${T('soon', 'قريبًا')}</small></span><span>${T('Sublingual', 'تحت اللسان')}<small>${T('soon', 'قريبًا')}</small></span></div>` +
      `<div class="pjstage" id="pjstage"><canvas id="pjcv"></canvas><div class="pjmsg" id="pjmsg">${T('Loading the body…', 'جارِ تحميل الجسم…')}</div><div class="pjtag" id="pjtag" style="display:none"><small id="pjn"></small><b id="pjt"></b><p id="pjd"></p></div></div>` +
      `<div class="pjsteps" id="pjsteps">${ST.map((s, i) => `<button data-act="pjgo" data-i="${i}" aria-label="${esc(nm(s))}"><i></i></button>`).join('')}</div>` +
      `<div class="pjcurve"><small><span>${T('Drug level in the blood', 'تركيز الدوا في الدم')}</span><span id="pjci"></span></small><canvas id="pjcc"></canvas></div>` +
      `<div class="pjctl"><button class="btn" data-act="pjrestart">⏮ ${T('Restart', 'من الأول')}</button><button class="btn primary" data-act="pjplay" id="pjplay">⏸ ${T('Pause', 'إيقاف')}</button><button class="btn" data-act="pjspeed" id="pjspeed">${T('Speed', 'سرعة')} ×1</button></div>` +
      `<p class="tiny" style="text-align:center;margin-top:8px">${T('For learning only — not for calculating patient doses. Draft content, pending review by a pharmacist or nursing instructor.', 'للتعلّم فقط — مش لحساب الجرعات للمرضى. المحتوى مبدئي ولسه بيتراجع من صيدلي أو مدرّس تمريض.')}</p>`;
  }
  function paintStage(i) {
    const s = ST[i], n = $('pjn'), tt = $('pjt'), dd = $('pjd'); if (!n) return;
    n.textContent = T('Stop ', 'المحطة ') + (i + 1) + ' / ' + ST.length; tt.textContent = nm(s); dd.textContent = T(s.d[0], s.d[1]);
    document.querySelectorAll('#pjsteps button').forEach((b, k) => { b.classList.toggle('on', k <= i); b.classList.toggle('cur', k === i); });
  }
  function open() {
    stop(); A.modal(page);
    const cv = $('pjcv'), msg = $('pjmsg');
    loadMeshes().then((M) => {
      if (!cv.isConnected) return;
      try {
        cur = start(cv, M); msg.remove(); $('pjtag').style.display = '';
        cur.onStage = paintStage;
        cur.onTick = (p) => { const cc = $('pjcc'); if (cc) curve(cc, p); const ci = $('pjci'); if (ci) ci.textContent = p < .35 ? T('Not in the blood yet', 'الدوا لسه ماوصلش الدم') : p < .9 ? T('Rising to the peak', 'التركيز بيزيد ويوصل الذروة') : T('Falling as it is excreted', 'بيقل مع الإخراج'); };
      } catch (e) { msg.textContent = T('Your device could not start the 3D view.', 'جهازك مقدرش يشغّل العرض 3D.'); }
    }).catch(() => { if (msg.isConnected) msg.textContent = T('Could not load the models — they need an internet connection the first time.', 'مقدرناش نحمّل المجسمات — أول مرة بتحتاج إنترنت.'); });
  }
  const SP = [1, 0.5, 2];
  A.acts.pjgo = (el) => { if (cur) cur.p = ST[+el.dataset.i].a + 0.002; };
  A.acts.pjrestart = () => { if (cur) { cur.p = 0; cur.playing = true; const b = $('pjplay'); if (b) b.innerHTML = '⏸ ' + T('Pause', 'إيقاف'); } };
  A.acts.pjplay = () => { if (!cur) return; cur.playing = !cur.playing; const b = $('pjplay'); if (b) b.innerHTML = cur.playing ? '⏸ ' + T('Pause', 'إيقاف') : '▶ ' + T('Play', 'شغّل'); };
  A.acts.pjspeed = () => { if (!cur) return; const i = (SP.indexOf(cur.speed) + 1) % SP.length; cur.speed = SP[i]; const b = $('pjspeed'); if (b) b.textContent = T('Speed', 'سرعة') + ' ×' + SP[i]; };
  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.pjourney = open; });
})();
