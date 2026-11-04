/* pjourney.js — "Drug journey" (nursing pharmacology): follow an oral drug through the 3D body (ADME) with a plasma-concentration curve.
   v2: oral / IV / IM / sublingual routes + mechanism-of-action animations + mini quiz. Uses the app's own organ / vessel meshes. DRAFT: the path is approximate and the texts are pending review by a pharmacist / nursing instructor.
   Educational only — not for dose calculation. */
'use strict';
window.__pjourneyLoaded = true;
(function () {
  const T = (en, ar) => (S.lang === 'ar' ? ar : en);
  const $ = (id) => document.getElementById(id);
  const waitFor = (fn, cb) => { const t0 = setInterval(() => { if (fn()) { clearInterval(t0); cb(); } }, 200); setTimeout(() => clearInterval(t0), 20000); };
  Object.assign(STR, {
    pjourney: { en: 'Drug journey & action', ar: 'رحلة الدوا وآلية عمله' },
    pjourneySub: { en: 'Follow a drug through the body and see how it works', ar: 'تابع الدوا في الجسم وشوف بيشتغل إزاي' },
  });
  const V = [.4, .5, 1], AR = [1, .3, .3], HC = [.85, .25, .3];
  const COL = { Z_or_oesophagus: [.9, .55, .5], Z_or_stomach: [.95, .6, .55], Z_or_duodenum: [.95, .72, .5], Z_or_jejunum: [.95, .72, .55], Z_or_liver: [.6, .28, .22], Z_or_gallbladder: [.5, .7, .3], Z_or_pancreas: [.9, .78, .45], Z_or_kidney_l: [.72, .3, .3], Z_or_kidney_r: [.72, .3, .3], Z_or_ureter_l: [.95, .85, .4], Z_or_ureter_r: [.95, .85, .4], Z_or_urinary_bladder: [.95, .85, .5], Z_or_right_atrium: [.85, .25, .3], Z_or_right_ventricle: [.8, .2, .28], Z_or_left_atrium: [.9, .3, .32], Z_or_left_ventricle: [.9, .25, .3], Z_ve_hepatic_portal_vein: V, Z_ve_hepatic_veins: V, Z_ve_superior_mesenteric_vein: V, Z_ve_inferior_vena_cava_abdominal_part: V, Z_ve_inferior_vena_cava_thoracic_part: V, Z_ve_thoracic_aorta: AR, Z_ve_abdominal_aorta: AR, Z_or_ascending_colon: [.8, .65, .55], Z_or_transverse_colon: [.8, .65, .55], Z_or_descending_colon: [.8, .65, .55], Z_or_sigmoid_colon: [.8, .65, .55],
    Z_ve_superior_vena_cava: V, Z_ve_left_brachiocephalic_vein: V, Z_ve_axillary_vein_l: V, Z_ve_brachial_veins_l: V, Z_ve_median_cubital_vein_l: V, Z_ve_cephalic_vein_l: V, Z_ve_basilic_vein_l: V, Z_ve_lingual_vein_l: V, Z_ve_internal_jugular_vein_l: V,
    Z_ve_pulmonary_trunk: [.6, .4, .9], Z_ve_left_pulmonary_artery: [.6, .4, .9], Z_ve_superior_vein_of_left_lung: [.9, .4, .5], Z_ve_inferior_basal_vein_of_left_lung: [.9, .4, .5], Z_ve_anterior_vein_of_left_lung: [.9, .4, .5], Z_ve_superior_basal_vein_of_left_lung: [.9, .4, .5] };
  const HEART = ['Z_or_right_atrium', 'Z_or_right_ventricle', 'Z_or_left_atrium', 'Z_or_left_ventricle'], LUNG = ['Z_ve_pulmonary_trunk', 'Z_ve_left_pulmonary_artery', 'Z_ve_superior_vein_of_left_lung', 'Z_ve_inferior_basal_vein_of_left_lung', 'Z_ve_anterior_vein_of_left_lung', 'Z_ve_superior_basal_vein_of_left_lung'];
  const TAIL = [['ra', [-.0152, 1.2396, .1262]], ['rv', [.0188, 1.2295, .1441]], ['pt', [.027, 1.283, .141]], ['lpa', [.055, 1.259, .077]], ['lungv', [.08, 1.216, .079]], ['la', [.0203, 1.2444, .109]], ['lv', [.0424, 1.2244, .1258]], ['aorta', [.0147, 1.20, .0736]], ['aorta2', [.0074, 1.0686, .109]], ['kidney', [.0596, 1.0623, .0804]], ['ureter', [.0333, .9459, .0912]], ['bladder', [.0004, .8135, .0981]]];
  const SVC = [['bcv', [.002, 1.333, .122]], ['svc', [-.016, 1.301, .116]]];
  const TG_ST = { k: 'target', from: 'aorta', to: 'kidney', off1: -0.01, org: ['Z_ve_thoracic_aorta', 'Z_ve_abdominal_aorta'], t: ['Distribution and effect', 'التوزيع والتأثير'], d: ['The drug reaches the target tissue, binds to its receptors and produces its effect.', 'الدوا بيوصل الأنسجة المستهدفة ويرتبط بالمستقبلات ويعمل مفعوله.'] };
  const EX_ST = { k: 'excr', from: 'kidney', off0: -0.01, to: null, org: ['Z_or_kidney_l', 'Z_or_ureter_l', 'Z_or_urinary_bladder'], t: ['Excretion', 'الإخراج'], d: ['The liver breaks down part of the drug, and the kidneys filter the rest out of the blood into the urine.', 'الكبد بيكسّر جزء من الدوا، والكلى بتصفّي الباقي من الدم وبيخرج مع البول.'] };
  const CIRC = (from) => ({ k: 'circ', from, to: 'aorta', org: HEART.concat(LUNG), t: ['Heart and lungs', 'القلب والرئتين'], d: ['The drug passes through the right heart, the lungs, then the left heart, and is pumped through the arteries to the whole body.', 'الدوا بيعدّي القلب اليمين ثم الرئتين ثم القلب الشمال، وبعدين بيتضخ في الشرايين لكل الجسم.'] });
  const ROUTES = {
    oral: { n: ['Oral', 'بالفم'], ka: 1.0, firstPass: true, onset: ['Slow', 'بطيء'], info: (p) => (p < .35 ? ['Not in the blood yet', 'الدوا لسه ماوصلش الدم'] : p < .9 ? ['Rising to the peak', 'التركيز بيزيد ويوصل الذروة'] : ['Falling as it is excreted', 'بيقل مع الإخراج']),
      wp: [['mouth', [0, 1.47, .165]], ['throat', [0, 1.415, .105]], ['eso', [.0045, 1.30, .09]], ['eso2', [.015, 1.19, .108]], ['stomach', [.0391, 1.1147, .133]], ['duod', [-.0161, 1.0448, .1285]], ['jej', [.0093, .9395, .1483]], ['smv', [-.029, 1.011, .1301]], ['portal', [-.0055, 1.1221, .1274]], ['liver', [-.035, 1.125, .118]], ['hv', [-.0093, 1.1863, .1225]], ['ivc', [-.0131, 1.21, .1142]]].concat(TAIL),
      st: [
        { k: 'swallow', to: 'stomach', off: -0.03, org: ['Z_or_oesophagus'], t: ['Swallowing', 'البلع'], d: ['The tablet travels from the mouth down the oesophagus to the stomach in seconds.', 'الحبة بتنزل من الفم للمريء وبتوصل المعدة في ثواني.'] },
        { k: 'stomach', from: 'stomach', off0: -0.03, to: 'duod', org: ['Z_or_stomach'], t: ['Stomach', 'المعدة'], d: ['The tablet breaks up and dissolves in stomach acid. Food can delay how fast it moves on.', 'الحبة بتتفتت وتذوب في حمض المعدة. الأكل ممكن يبطّأ الوصول.'] },
        { k: 'gut', from: 'duod', to: 'smv', org: ['Z_or_duodenum', 'Z_or_jejunum'], t: ['Small intestine: absorption', 'الأمعاء: الامتصاص'], d: ['Most of the drug is absorbed here, through the intestinal wall into the blood.', 'هنا أغلب الدوا بيتمتص من جدار الأمعاء الدقيقة للدم.'] },
        { k: 'liver', from: 'smv', to: 'hv', org: ['Z_or_liver', 'Z_ve_hepatic_portal_vein'], t: ['Liver: first-pass', 'الكبد: أول مرور'], d: ['Blood from the gut reaches the liver through the portal vein, and the liver breaks down part of the drug before it reaches the rest of the body.', 'الدم بيروح من الأمعاء للكبد عن طريق الوريد البابي، والكبد بيكسّر جزء من الدوا قبل ما يوصل باقي الجسم.'] },
        CIRC('hv'), TG_ST, EX_ST] },
    iv: { n: ['IV', 'وريدي'], ka: 0, firstPass: false, onset: ['Immediate', 'فوري'], info: (p) => (p < .6 ? ['Highest level right from the start — no absorption step', 'أعلى تركيز من أول لحظة — مفيش مرحلة امتصاص'] : ['Falling as it is cleared', 'بيقل تدريجيًا مع التخلص منه']),
      wp: [['inj', [.212, 1.021, .096]], ['brv', [.185, 1.139, .084]], ['axv', [.121, 1.3, .098]]].concat(SVC, TAIL),
      st: [
        { k: 'inj', to: 'axv', org: ['Z_ve_median_cubital_vein_l', 'Z_ve_cephalic_vein_l', 'Z_ve_basilic_vein_l', 'Z_ve_brachial_veins_l'], t: ['Injection into the vein', 'الحقن في الوريد'], d: ['The drug goes straight into the blood — 100% available, with no absorption step.', 'الدوا بيدخل الدم على طول — بيوصل بالكامل ومفيش مرحلة امتصاص.'] },
        { k: 'back', from: 'axv', to: 'ra', org: ['Z_ve_axillary_vein_l', 'Z_ve_left_brachiocephalic_vein', 'Z_ve_superior_vena_cava'], t: ['Back to the heart', 'الرجوع للقلب'], d: ['Venous blood carries the drug up the arm to the superior vena cava and the right atrium.', 'الدم الوريدي بيشيل الدوا من الدراع لحد الوريد الأجوف العلوي والأذين اليمين.'] },
        CIRC('ra'), TG_ST, EX_ST] },
    im: { n: ['IM', 'عضلي'], ka: 1.3, firstPass: false, onset: ['Moderate', 'متوسط'], site: true, info: (p) => (p < .35 ? ['Slowly absorbed from the muscle', 'بيتمتص تدريجيًا من العضلة'] : p < .85 ? ['Rising to the peak', 'التركيز بيزيد ويوصل الذروة'] : ['Falling as it is cleared', 'بيقل تدريجيًا']),
      wp: [['site', [.2, 1.29, .07]], ['m2', [.16, 1.30, .085]], ['axv', [.121, 1.3, .098]]].concat(SVC, TAIL),
      st: [
        { k: 'depot', to: 'm2', org: [], t: ['Injection into the muscle', 'الحقن في العضلة'], d: ['The drug is deposited in the muscle (for example the deltoid) as a small depot.', 'الدوا بيتحط في العضلة (زي الدالية في الكتف) وبيتخزن فيها مؤقتًا.'] },
        { k: 'abs', from: 'm2', to: 'ra', org: ['Z_ve_axillary_vein_l', 'Z_ve_left_brachiocephalic_vein', 'Z_ve_superior_vena_cava'], t: ['Absorption and return', 'الامتصاص والرجوع للقلب'], d: ['Muscle has a rich blood supply, so the drug is absorbed gradually — faster than oral, slower than IV — and skips the liver.', 'العضلة فيها دم كتير فالدوا بيتمتص تدريجيًا — أسرع من الفم وأبطأ من الوريد — ومش بيعدّي على الكبد الأول.'] },
        CIRC('ra'), TG_ST, EX_ST] },
    sl: { n: ['Sublingual', 'تحت اللسان'], ka: 3, firstPass: false, onset: ['Fast', 'سريع'], site: true, info: (p) => (p < .3 ? ['Enters the blood quickly, skipping the liver', 'بيدخل الدم بسرعة من غير ما يمر على الكبد'] : p < .85 ? ['Rising to the peak', 'التركيز بيزيد ويوصل الذروة'] : ['Falling as it is cleared', 'بيقل تدريجيًا']),
      wp: [['tongue', [0, 1.465, .15]], ['lingv', [.024, 1.472, .127]], ['ijv', [.03, 1.439, .1]]].concat(SVC, TAIL),
      st: [
        { k: 'sl', to: 'ijv', org: ['Z_ve_lingual_vein_l'], t: ['Under the tongue', 'تحت اللسان'], d: ['The thin membrane under the tongue lets the drug pass straight into the veins — no swallowing needed.', 'الغشاء الرقيق تحت اللسان بيسمح للدوا يعدّي على الأوردة مباشرة — من غير بلع.'] },
        { k: 'veins', from: 'ijv', to: 'ra', org: ['Z_ve_internal_jugular_vein_l', 'Z_ve_left_brachiocephalic_vein', 'Z_ve_superior_vena_cava'], t: ['Veins of the neck', 'أوردة الرقبة'], d: ['The blood goes to the heart without passing through the liver, so there is no first-pass loss.', 'الدم بيروح للقلب من غير ما يعدّي على الكبد، فمفيش فقد من أول مرور.'] },
        CIRC('ra'), TG_ST, EX_ST] },
  };
  const RK = ['oral', 'iv', 'im', 'sl'];
  function buildRoute(r) {
    if (r.pts) return r;
    const pts = [], idxAt = {}, WP = r.wp;
    for (let i = 0; i < WP.length - 1; i++) { const p0 = WP[Math.max(0, i - 1)][1], p1 = WP[i][1], p2 = WP[i + 1][1], p3 = WP[Math.min(WP.length - 1, i + 2)][1]; idxAt[WP[i][0]] = pts.length; for (let s = 0; s < 24; s++) pts.push(cr(p0, p1, p2, p3, s / 24)); }
    idxAt[WP[WP.length - 1][0]] = pts.length; pts.push(WP[WP.length - 1][1]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    r.pts = pts; r.cum = cum; r.TOT = cum[cum.length - 1]; r.frac = (n) => cum[idxAt[n]] / r.TOT;
    r.st.forEach((s, i) => { s.a = i === 0 ? 0 : r.frac(s.from) + (s.off0 || 0); s.b = (s.to ? r.frac(s.to) : 1) + (s.off || s.off1 || 0); });
    return r;
  }
  const posAt = (r, f) => { const d = Math.max(0, Math.min(1, f)) * r.TOT, cum = r.cum, pts = r.pts; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [0, 1, 2].map((k) => pts[i - 1][k] + (pts[i][k] - pts[i - 1][k]) * t); };
  const DUR = 24; // seconds per full loop
  const css = document.createElement('style');
  css.textContent = '.pjstage{position:relative;height:min(46vh,380px);border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 40%,var(--surface2),var(--bg2));border:1px solid var(--line);touch-action:none}.pjstage canvas{width:100%;height:100%;display:block}' +
    '.pjmsg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:var(--muted);font-size:14px;pointer-events:none}.pjtag{margin-top:8px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:8px 12px}' +
    '.pjtag small{color:var(--accent);font-weight:800;font-size:11px}.pjtag b{display:block;font-size:15px}.pjtag p{margin:3px 0 0;font-size:12.5px;line-height:1.55;color:var(--muted)}.pjsteps{display:flex;gap:4px;margin:8px 0}.pjsteps button{flex:1;height:22px;border:0;padding:0;background:none;cursor:pointer}.pjsteps button i{display:block;height:5px;margin-top:8px;border-radius:4px;background:var(--surface2)}.pjsteps button.on i{background:var(--accent)}.pjsteps button.cur i{height:7px;margin-top:7px}' +
    '.pjroutes{display:flex;gap:6px;margin:6px 0}.pjroutes span{flex:1;text-align:center;padding:7px 2px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);font-size:12.5px;font-weight:700;color:var(--muted)}.pjroutes span.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pjroutes small{display:block;font-size:9.5px;font-weight:600;opacity:.8}' +
    '.pjcurve{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:6px 8px 4px}.pjcurve small{color:var(--muted);font-size:11px;display:flex;justify-content:space-between}.pjcurve canvas{width:100%;height:92px;display:block}.pjctl{display:flex;gap:6px;margin:8px 0 2px}.pjctl .btn{flex:1}';
  css.textContent += '.pjscroll{display:flex;gap:6px;overflow-x:auto;margin:6px 0;padding-bottom:4px;scrollbar-width:thin}.pjscroll span{flex:none;padding:7px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer;white-space:nowrap}.pjscroll span.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.pjsearch{flex:1;min-width:0;padding:9px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit;font-size:13.5px}';
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


  let cur = null, mtok = 0;
  function stop() { mtok++; if (cur) { cur.dead = true; try { const x = cur.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { /* ignore */ } cur = null; } }
  async function loadMeshes() {
    const C = window.CATALOG || [], packs = {}, M = {};
    for (const id of Object.keys(COL)) { const c = C.find((x) => x.id === id); if (!c) continue; if (!packs[c.pk]) packs[c.pk] = await Packs.load(c.pk); const d = Packs.part(packs[c.pk], c.o), n = d.pos.length / 3, P = new Float32Array(n * 3), N = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { P[i * 3 + k] = d.lo[k] + d.pos[i * 3 + k] / 65535 * d.span[k]; N[i * 3 + k] = d.nor[i * 3 + k] / 127; }
      M[id] = { P, N, I: d.idx }; }
    if (Object.keys(M).length < 8) throw new Error('models missing');
    return M;
  }

  function start(cv, M, routeKey) {
    const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const U = {}; ['uVP', 'uT', 'uC', 'uA', 'uE', 'uEye'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const aP = gl.getAttribLocation(pr, 'aP'), aN = gl.getAttribLocation(pr, 'aN');
    const buf = (t, d) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, gl.STATIC_DRAW); return b; };
    const mk = (d) => ({ bp: buf(gl.ARRAY_BUFFER, d.P), bn: buf(gl.ARRAY_BUFFER, d.N), bi: buf(gl.ELEMENT_ARRAY_BUFFER, d.I), n: d.I.length });
    const G = {}; Object.keys(M).forEach((k) => { G[k] = mk(M[k]); });
    const tubes = {}; RK.forEach((k) => { tubes[k] = mk(tubeData(buildRoute(ROUTES[k]).pts, .0022, 8)); });
    const dot = mk(sphData(.0055, 12)), halo = mk(sphData(.011, 12)), site = mk(sphData(.02, 14));
    const draw = (m, col, a, em, off) => { gl.uniform3fv(U.uC, col); gl.uniform1f(U.uA, a); gl.uniform3fv(U.uE, em || [0, 0, 0]); gl.uniform3fv(U.uT, off || [0, 0, 0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bp); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, m.bn); gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.bi); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0); };
    const st = { gl, dead: false, p: 0, playing: true, speed: 1, yaw: 0, last: 0, si: -1, rk: routeKey, onStage: null };
    st.setRoute = (k) => { st.rk = k; st.p = 0; st.si = -1; };
    const TC = [0, 1.13, 0.1];
    function frame(now) {
      if (st.dead || !cv.isConnected || cv.offsetParent === null) { if (cur === st) stop(); return; }
      const dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0; st.last = now;
      if (st.playing) st.p = (st.p + dt * st.speed / DUR) % 1;
      const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(2, Math.round(cv.clientWidth * d)), h = Math.max(2, Math.round(cv.clientHeight * d));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
      const R = 1.15, eye = [TC[0] + R * Math.sin(st.yaw), 1.13, TC[2] + R * Math.cos(st.yaw)];
      gl.uniformMatrix4fv(U.uVP, false, mul(persp(.62, w / h, .05, 5), look(eye, TC, [0, 1, 0]))); gl.uniform3fv(U.uEye, eye); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const r = ROUTES[st.rk];
      let si = r.st.findIndex((s) => st.p >= s.a && st.p < s.b); if (si < 0) si = r.st.length - 1;
      if (si !== st.si) { st.si = si; if (st.onStage) st.onStage(si); }
      const s = r.st[si];
      draw(tubes[st.rk], [1, .85, .3], 1, [.25, .18, 0]);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      for (const id in G) { const act = s.org.includes(id); draw(G[id], COL[id], act ? .78 : .22, act ? [.2, .14, .05] : null); }
      gl.disable(gl.DEPTH_TEST);
      if (r.site) draw(site, [1, .82, .25], si === 0 ? .4 + .15 * Math.sin(now / 250) : .15, [.4, .28, 0], r.pts[0]);
      const lv = r.firstPass ? r.frac('liver') : 2;
      for (let k = 0; k < 9; k++) { const pp = st.p - k * .012; if (pp < 0) continue; if (k % 4 === 3 && pp > lv) continue; const pos = posAt(r, pp); if (k === 0) { draw(halo, [1, .82, .25], .35, [.4, .28, 0], pos); draw(dot, [1, .9, .5], 1, [.6, .5, .1], pos); } else draw(dot, [1, .82, .25], Math.max(.25, .95 - k * .09), [.5, .36, 0], pos); }
      if (st.onTick) st.onTick(st.p);
      requestAnimationFrame(frame);
    }
    let dx = null; cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); dx = e.clientX; });
    cv.addEventListener('pointermove', (e) => { if (dx === null) return; st.yaw = Math.max(-1.2, Math.min(1.2, st.yaw + (e.clientX - dx) * 0.008)); dx = e.clientX; });
    const up = () => { dx = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    requestAnimationFrame(frame);
    return st;
  }

  /* concentration curve (one-compartment; ka = absorption rate, 0 = IV bolus) */
  const KE = 0.28;
  const cf = (ka, t) => (ka ? (Math.exp(-KE * t) - Math.exp(-ka * t)) / (ka - KE) * ka : Math.exp(-KE * t));
  function curve(cc, p, ka) {
    const tm = ka ? Math.log(ka / KE) / (ka - KE) : 0, FM = cf(ka, tm), f = (t) => cf(ka, t);
    const c = cc.getContext('2d'), d = Math.min(window.devicePixelRatio || 1, 2), W = Math.max(2, Math.round(cc.clientWidth * d)), H = Math.max(2, Math.round(92 * d)); if (cc.width !== W || cc.height !== H) { cc.width = W; cc.height = H; }
    c.clearRect(0, 0, W, H); const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--accent').trim() || '#E3B95B', mut = css.getPropertyValue('--muted').trim() || '#999', line = css.getPropertyValue('--line').trim() || '#444';
    const x0 = 10 * d, y0 = H - 10 * d, X = (t) => x0 + t / 14 * (W - x0 - 8 * d), Y = (v) => y0 - (v / FM) * (y0 - 10 * d), tt = Math.min(14, p * 14);
    c.strokeStyle = line; c.lineWidth = d; c.beginPath(); c.moveTo(x0, y0); c.lineTo(W - 6, y0); c.moveTo(x0, 6); c.lineTo(x0, y0); c.stroke();
    c.fillStyle = mut; c.font = (10 * d) + 'px Cairo,sans-serif'; c.textAlign = 'end'; c.fillText(T('Time →', 'الوقت ←'), W - 6, H - 1);
    c.strokeStyle = acc; c.lineWidth = 2 * d; c.beginPath(); for (let t = 0; t <= 14; t += .1) { const x = X(t), y = Y(f(t)); t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = acc; c.globalAlpha = .18; c.beginPath(); c.moveTo(X(0), y0); for (let t = 0; t <= tt; t += .1) c.lineTo(X(t), Y(f(t))); c.lineTo(X(tt), y0); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(X(tt), Y(f(tt)), 4.5 * d, 0, 7); c.fill();
  }

  /* ───────── mechanism of action (DRAFT texts — pending review) ───────── */
  const CATS = [['cv', 'Heart & BP', 'قلب وضغط'], ['resp', 'Chest & allergy', 'صدر وحساسية'], ['gi', 'Stomach & gut', 'معدة وهضم'], ['endo', 'Diabetes', 'سكر'], ['pain', 'Pain & fever', 'مسكنات'], ['abx', 'Anti-infectives', 'مضادات عدوى']];
  /* D(category, key, name, class, kind, target, natural ligand, effect, how it works, [nursing point 1, nursing point 2]) — every pair is [English, Arabic] */
  const D = (c, k, n, cls, kind, tgt, nat, eff, mech, nu) => ({ c, k, n, cls, kind, tgt, nat, eff, mech, nurse: [nu[0][0], nu[0][1], nu[1][0], nu[1][1]] });
  const DRUGS = [
    D('cv', 'pro', ['Propranolol', 'بروبرانولول'], ['β-blocker', 'حاصر بيتا'], 'block', ['β receptors (heart)', 'مستقبلات β في القلب'], ['Adrenaline', 'الأدرينالين'], ['Slower heart rate, lower blood pressure', 'نبض أبطأ وضغط أقل'], ['It occupies β receptors so adrenaline cannot activate them, and the heart beats slower and weaker.', 'بيحتل مستقبلات β فالأدرينالين مش بيقدر ينشّطها، والقلب بيدق أبطأ وأضعف.'], [['Check pulse and blood pressure before giving it.', 'قيس النبض والضغط قبل ما تدّيه.'], ['Use caution in asthma; do not stop suddenly.', 'حذر مع الربو، ومتوقفوش فجأة.']]),
    D('cv', 'fur', ['Furosemide', 'فيوروسيميد'], ['Loop diuretic', 'مدرّ عروة'], 'block', ['Na⁺/K⁺/2Cl⁻ transporter (kidney)', 'ناقل Na⁺/K⁺/2Cl⁻ في الكلية'], ['Na⁺ / Cl⁻', 'صوديوم / كلوريد'], ['More salt and water lost in the urine', 'ملح وماء أكتر بيخرجوا مع البول'], ['It blocks the transporter in the loop of Henle, so salt and water stay in the tubule and leave as urine.', 'بيقفل الناقل في عروة هنلي، فالملح والماء بيفضلوا في الأنبوبة وبيخرجوا مع البول.'], [['Monitor fluid balance, weight, blood pressure and potassium.', 'تابع السوائل والوزن والضغط والبوتاسيوم.'], ['Expect increased urination.', 'متوقّع زيادة التبول.']]),
    D('cv', 'ena', ['Enalapril', 'إنالابريل'], ['ACE inhibitor', 'مثبّط ACE'], 'block', ['ACE enzyme', 'إنزيم ACE'], ['Angiotensin I', 'أنجيوتنسين I'], ['Less angiotensin II: vessels relax, lower blood pressure', 'أنجيوتنسين II أقل: الأوعية بترتخي والضغط بيقل'], ['It blocks the enzyme that makes angiotensin II, so blood vessels widen and the kidneys keep less salt and water.', 'بيقفل الإنزيم اللي بيعمل أنجيوتنسين II، فالأوعية بتتسع والكلى بتحتفظ بملح وماء أقل.'], [['A dry cough is common; monitor blood pressure and potassium.', 'كحة ناشفة شائعة؛ تابع الضغط والبوتاسيوم.'], ['Not for use in pregnancy.', 'مش بيتاخد في الحمل.']]),
    D('cv', 'aml', ['Amlodipine', 'أملوديبين'], ['Calcium channel blocker', 'حاصر قنوات الكالسيوم'], 'block', ['L-type Ca²⁺ channel', 'قناة كالسيوم نوع L'], ['Ca²⁺', 'كالسيوم Ca²⁺'], ['Vessel muscle relaxes: lower blood pressure', 'عضلة الأوعية بترتخي والضغط بيقل'], ['It blocks calcium channels in the muscle of blood vessels, so the muscle relaxes and the vessels widen.', 'بيقفل قنوات الكالسيوم في عضلة الأوعية، فالعضلة بترتخي والأوعية بتتسع.'], [['Ankle swelling and dizziness can happen.', 'ممكن يحصل ورم في الكعبين ودوخة.'], ['Check blood pressure and pulse.', 'قيس الضغط والنبض.']]),
    D('cv', 'ato', ['Atorvastatin', 'أتورفاستاتين'], ['Statin', 'ستاتين'], 'block', ['HMG-CoA reductase', 'إنزيم HMG-CoA ريدكتاز'], ['HMG-CoA', 'HMG-CoA'], ['Less cholesterol made in the liver', 'كوليسترول أقل بيتصنّع في الكبد'], ['It blocks the liver enzyme that makes cholesterol, so LDL in the blood falls.', 'بيقفل إنزيم الكبد اللي بيصنّع الكوليسترول، فـ LDL في الدم بيقل.'], [['Report unexplained muscle pain or weakness.', 'بلّغ عن أي ألم أو ضعف عضلات غير مفهوم.'], ['Liver tests may be checked.', 'ممكن يتطلب تحاليل وظائف كبد.']]),
    D('cv', 'war', ['Warfarin', 'وارفارين'], ['Anticoagulant', 'مضاد تجلّط'], 'block', ['Vitamin K enzyme (VKORC1)', 'إنزيم فيتامين K (VKORC1)'], ['Vitamin K', 'فيتامين K'], ['Fewer clotting factors: blood clots more slowly', 'عوامل تجلّط أقل: الدم بيتجلّط أبطأ'], ['It blocks the enzyme that recycles vitamin K, so the liver makes fewer clotting factors.', 'بيقفل الإنزيم اللي بيجدّد فيتامين K، فالكبد بيعمل عوامل تجلّط أقل.'], [['Monitor INR regularly and watch for bleeding.', 'تابع INR باستمرار وراقب أي نزيف.'], ['Keep vitamin K intake (leafy greens) steady.', 'خلّي أكل فيتامين K (الخضار الورقي) ثابت.']]),
    D('resp', 'sal', ['Salbutamol', 'سالبيوتامول'], ['β2 agonist (bronchodilator)', 'منشّط β2 (موسّع شعب)'], 'agonist', ['β2 receptor (airway muscle)', 'مستقبل β2 في عضلة الشعب'], ['', ''], ['Airway muscle relaxes: easier breathing', 'عضلة الشعب بترتخي: تنفّس أسهل'], ['It binds to β2 receptors and activates them, so the muscle around the airways relaxes.', 'بيرتبط بمستقبلات β2 وينشّطها، فالعضلة اللي حوالين الشعب بترتخي.'], [['May cause tremor and a fast heartbeat.', 'ممكن يسبب رعشة وسرعة في النبض.'], ['Check the patient’s inhaler technique.', 'اتأكد من طريقة استخدام المريض للبخاخ.']]),
    D('resp', 'ipr', ['Ipratropium', 'إبراتروبيوم'], ['Anticholinergic bronchodilator', 'موسّع شعب مضاد كولين'], 'block', ['Muscarinic receptor (airway)', 'مستقبل مسكاريني في الشعب'], ['Acetylcholine', 'أستيل كولين'], ['Airway muscle relaxes: easier breathing', 'عضلة الشعب بترتخي: تنفّس أسهل'], ['It blocks muscarinic receptors so acetylcholine cannot tighten the airways.', 'بيحتل مستقبلات مسكاريني فالأستيل كولين مش بيقدر يشدّ الشعب.'], [['Dry mouth is common; rinse the mouth afterwards.', 'جفاف الفم شائع؛ يتمضمض بعد الاستخدام.'], ['Avoid getting the spray in the eyes.', 'متدخلش البخاخ في العين.']]),
    D('resp', 'mon', ['Montelukast', 'مونتيلوكاست'], ['Leukotriene receptor antagonist', 'مضاد مستقبل اللوكوترين'], 'block', ['Leukotriene receptor', 'مستقبل اللوكوترين'], ['Leukotrienes', 'لوكوترينات'], ['Less airway inflammation and tightening', 'التهاب وتضيّق أقل في الشعب'], ['It blocks leukotriene receptors, so there is less inflammation and airway narrowing in asthma and allergy.', 'بيحتل مستقبلات اللوكوترين، فالتهاب وتضيّق الشعب في الربو والحساسية بيقل.'], [['It is preventive — not for a sudden attack.', 'للوقاية — مش لنوبة الربو الحادة.'], ['Report mood or sleep changes.', 'بلّغ عن أي تغيّر في المزاج أو النوم.']]),
    D('resp', 'lor', ['Loratadine', 'لوراتادين'], ['Antihistamine', 'مضاد هيستامين'], 'block', ['H1 receptor', 'مستقبل H1'], ['Histamine', 'هيستامين'], ['Less itching, sneezing and runny nose', 'هرش وعطس وسيلان أنف أقل'], ['It blocks H1 receptors so histamine cannot cause allergy symptoms.', 'بيحتل مستقبلات H1 فالهيستامين مش بيقدر يعمل أعراض الحساسية.'], [['Usually causes little drowsiness.', 'نعاسه قليل غالبًا.'], ['Check for other allergy medicines to avoid doubling up.', 'اتأكد إنه مش بياخد دوا حساسية تاني عشان ميتكررش.']]),
    D('gi', 'ome', ['Omeprazole', 'أوميبرازول'], ['Proton pump inhibitor', 'مثبّط مضخة البروتون'], 'block', ['H⁺/K⁺ pump (parietal cell)', 'مضخة H⁺/K⁺ في خلية المعدة'], ['H⁺ ions', 'أيونات H⁺'], ['Less stomach acid', 'حمض معدة أقل'], ['It blocks the proton pump that pushes acid into the stomach, so much less acid is made.', 'بيقفل مضخة البروتون اللي بتطلّع الحمض في المعدة، فالحمض بيقل جدًا.'], [['Best taken before a meal.', 'الأفضل ياخده قبل الأكل.'], ['Delayed-release capsules should not be crushed or chewed.', 'الكبسولات بطيئة التحرر متتفتحش ولا تتمضغ.']]),
    D('gi', 'fam', ['Famotidine', 'فاموتيدين'], ['H2 blocker', 'حاصر H2'], 'block', ['H2 receptor (stomach)', 'مستقبل H2 في المعدة'], ['Histamine', 'هيستامين'], ['Less stomach acid', 'حمض معدة أقل'], ['It blocks H2 receptors on the acid-making cells, so less acid is released.', 'بيحتل مستقبلات H2 على الخلايا المفرزة للحمض، فالحمض بيقل.'], [['The dose may need lowering in kidney disease.', 'ممكن الجرعة تتخفض مع مرضى الكلى.'], ['Can be taken with or without food.', 'ممكن يتاخد مع الأكل أو من غيره.']]),
    D('gi', 'ond', ['Ondansetron', 'أوندانسيترون'], ['Antiemetic', 'مضاد قيء'], 'block', ['5-HT3 receptor', 'مستقبل 5-HT3'], ['Serotonin', 'سيروتونين'], ['Less nausea and vomiting', 'غثيان وقيء أقل'], ['It blocks serotonin 5-HT3 receptors in the gut and brain that trigger vomiting.', 'بيحتل مستقبلات السيروتونين 5-HT3 في الأمعاء والمخ اللي بتحفّز القيء.'], [['Constipation and headache are common.', 'إمساك وصداع شائعين.'], ['It can affect heart rhythm — use caution in heart disease.', 'ممكن يأثر على ضربات القلب — حذر مع مرضى القلب.']]),
    D('gi', 'lop', ['Loperamide', 'لوبيراميد'], ['Antidiarrheal', 'مضاد إسهال'], 'agonist', ['Opioid receptor (gut wall)', 'مستقبل أفيوني في جدار الأمعاء'], ['', ''], ['Slower gut movement: less diarrhea', 'حركة الأمعاء أبطأ: إسهال أقل'], ['It activates opioid receptors in the gut wall, which slows movement so more water is absorbed.', 'بينشّط المستقبلات الأفيونية في جدار الأمعاء، فالحركة بتبطأ وبيتمتص ماء أكتر.'], [['Not for diarrhea with fever or blood.', 'مش لإسهال معاه حرارة أو دم.'], ['Replace fluids.', 'عوّض السوائل.']]),
    D('endo', 'ins', ['Insulin', 'الإنسولين'], ['Hormone (antidiabetic)', 'هرمون (للسكر)'], 'agonist', ['Insulin receptor', 'مستقبل الإنسولين'], ['', ''], ['Glucose enters the cells: blood sugar falls', 'الجلوكوز بيدخل الخلايا: السكر في الدم بيقل'], ['It binds the insulin receptor, which opens the way for glucose to enter muscle and fat cells.', 'بيرتبط بمستقبل الإنسولين، فبيفتح الطريق للجلوكوز يدخل خلايا العضلات والدهون.'], [['Risk of low blood sugar — watch for sweating, shaking, confusion.', 'خطر هبوط السكر — خلّي بالك من العرق والرعشة والتشوّش.'], ['Link the dose with meals and monitor blood glucose.', 'اربط الجرعة بالأكل وتابع سكر الدم.']]),
    D('endo', 'glb', ['Glibenclamide', 'جليبنكلاميد'], ['Sulfonylurea', 'سلفونيل يوريا'], 'block', ['K⁺ channel (pancreatic β-cell)', 'قناة بوتاسيوم في خلية بيتا بالبنكرياس'], ['K⁺', 'بوتاسيوم K⁺'], ['More insulin released: blood sugar falls', 'إنسولين أكتر بيتفرز: السكر بيقل'], ['It closes potassium channels in pancreatic β-cells, which triggers the release of insulin.', 'بيقفل قنوات البوتاسيوم في خلايا بيتا بالبنكرياس، فبيحفّز إفراز الإنسولين.'], [['Risk of low blood sugar — do not skip meals.', 'خطر هبوط السكر — متفوّتش الأكل.'], ['Teach the signs: sweating, shaking, confusion.', 'عرّف المريض العلامات: عرق، رعشة، تشوّش.']]),
    D('endo', 'sit', ['Sitagliptin', 'سيتاجليبتين'], ['DPP-4 inhibitor', 'مثبّط DPP-4'], 'block', ['DPP-4 enzyme', 'إنزيم DPP-4'], ['GLP-1', 'GLP-1'], ['More active GLP-1: more insulin after meals', 'GLP-1 فعّال أكتر: إنسولين أكتر بعد الأكل'], ['It blocks the enzyme that breaks down GLP-1, so this hormone lasts longer and helps release insulin after meals.', 'بيقفل الإنزيم اللي بيكسّر هرمون GLP-1، فالهرمون بيفضل أطول ويساعد على إفراز الإنسولين بعد الأكل.'], [['Low risk of low blood sugar when used alone.', 'خطر هبوط السكر قليل لو بيتاخد لوحده.'], ['Report severe stomach pain (possible pancreatitis).', 'بلّغ عن ألم شديد في البطن (احتمال التهاب بنكرياس).']]),
    D('pain', 'asp', ['Aspirin', 'أسبرين'], ['NSAID / antiplatelet', 'مضاد التهاب / مضاد تجلّط'], 'block', ['COX enzyme', 'إنزيم COX'], ['Arachidonic acid', 'حمض الأراكيدونيك'], ['Fewer prostaglandins: less pain, fever and clotting', 'بروستاجلاندين أقل: ألم وحرارة وتجلّط أقل'], ['Aspirin permanently blocks the COX enzyme, so the body makes fewer prostaglandins and thromboxane.', 'الأسبرين بيعطّل إنزيم COX بشكل دائم، فالجسم بيعمل بروستاجلاندين وثرومبوكسان أقل.'], [['Can irritate the stomach and raise bleeding risk — usually given with or after food.', 'ممكن يهيّج المعدة ويزوّد خطر النزيف — غالبًا بيتاخد مع الأكل أو بعده.'], ['Avoid in children with viral illness (Reye syndrome).', 'بلاش للأطفال المصابين بعدوى فيروسية (متلازمة راي).']]),
    D('pain', 'ibu', ['Ibuprofen', 'إيبوبروفين'], ['NSAID', 'مضاد التهاب غير ستيرويدي'], 'block', ['COX enzyme', 'إنزيم COX'], ['Arachidonic acid', 'حمض الأراكيدونيك'], ['Less pain, fever and inflammation', 'ألم وحرارة والتهاب أقل'], ['It temporarily blocks COX enzymes, so fewer prostaglandins are made.', 'بيعطّل إنزيمات COX بشكل مؤقت، فبروستاجلاندين أقل.'], [['Take with food; use caution with stomach ulcers and kidney disease.', 'يتاخد مع الأكل؛ حذر مع القرحة وأمراض الكلى.'], ['Can raise blood pressure in some patients.', 'ممكن يرفع الضغط عند بعض المرضى.']]),
    D('pain', 'par', ['Paracetamol', 'باراسيتامول'], ['Analgesic / antipyretic', 'مسكّن وخافض حرارة'], 'block', ['COX (mainly in the brain)', 'COX (في المخ غالبًا)'], ['Prostaglandins', 'بروستاجلاندين'], ['Less pain and fever (little anti-inflammatory effect)', 'ألم وحرارة أقل (تأثير ضعيف على الالتهاب)'], ['Its exact mechanism is not fully known; it seems to reduce prostaglandins mainly in the brain.', 'آلية عمله مش معروفة بالكامل؛ غالبًا بيقلل البروستاجلاندين في المخ أساسًا.'], [['Do not exceed the daily maximum — an overdose damages the liver.', 'متعدّيش الحد الأقصى اليومي — الجرعة الزيادة بتضر الكبد.'], ['Check other products that also contain paracetamol.', 'راجع الأدوية التانية اللي ممكن فيها باراسيتامول.']]),
    D('pain', 'mor', ['Morphine', 'مورفين'], ['Opioid analgesic', 'مسكّن أفيوني'], 'agonist', ['μ-opioid receptor (nervous system)', 'مستقبل μ الأفيوني في الجهاز العصبي'], ['', ''], ['Strong pain relief; slower breathing', 'تسكين قوي للألم؛ تنفّس أبطأ'], ['It activates μ-opioid receptors in the brain and spinal cord, so pain signals are dampened.', 'بينشّط مستقبلات μ الأفيونية في المخ والنخاع، فإشارات الألم بتتخمد.'], [['Check breathing rate and sedation before and after giving it.', 'قيس معدل التنفس ودرجة النعاس قبل وبعد الإعطاء.'], ['Expect constipation; follow the controlled-drug rules.', 'متوقع إمساك؛ واتبع قواعد الأدوية المخدرة.']]),
    D('abx', 'amx', ['Amoxicillin', 'أموكسيسيلين'], ['Penicillin antibiotic', 'مضاد حيوي بنسلين'], 'block', ['Penicillin-binding proteins (bacteria)', 'بروتينات PBP في البكتيريا'], ['Cell-wall building blocks', 'مكوّنات بناء الجدار'], ['The bacterial wall breaks down: bacteria die', 'جدار البكتيريا بيتهدم: البكتيريا بتموت'], ['It blocks the proteins bacteria use to build their cell wall, so the wall weakens and the bacteria burst.', 'بيقفل البروتينات اللي بتبني بيها البكتيريا جدارها، فالجدار بيضعف والبكتيريا بتنفجر.'], [['Ask about penicillin allergy before giving it.', 'اسأل عن حساسية البنسلين قبل ما تديه.'], ['Finish the course as prescribed.', 'كمّل الكورس زي ما اتكتب.']]),
    D('abx', 'cip', ['Ciprofloxacin', 'سيبروفلوكساسين'], ['Fluoroquinolone', 'فلوروكينولون'], 'block', ['DNA gyrase (bacteria)', 'إنزيم DNA gyrase في البكتيريا'], ['Bacterial DNA copying', 'نسخ DNA البكتيريا'], ['Bacteria cannot copy their DNA: they die', 'البكتيريا مش بتقدر تنسخ DNA: بتموت'], ['It blocks the bacterial enzyme DNA gyrase, so the bacteria cannot copy or repair their DNA.', 'بيقفل إنزيم DNA gyrase في البكتيريا، فمش بتقدر تنسخ أو تصلّح DNA.'], [['Separate it from milk, antacids and iron by about 2 hours.', 'ابعده عن اللبن ومضادات الحموضة والحديد بحوالي ساعتين.'], ['Report tendon pain.', 'بلّغ عن أي ألم في الوتر.']]),
    D('abx', 'azi', ['Azithromycin', 'أزيثرومايسين'], ['Macrolide', 'ماكروليد'], 'block', ['Bacterial ribosome (50S)', 'ريبوسوم البكتيريا (50S)'], ['Bacterial protein making', 'تصنيع بروتين البكتيريا'], ['Bacteria cannot make proteins: growth stops', 'البكتيريا مش بتقدر تصنّع بروتين: النمو بيقف'], ['It binds the bacterial ribosome and stops it from making proteins.', 'بيرتبط بريبوسوم البكتيريا ويمنعه من تصنيع البروتين.'], [['Can cause stomach upset and may affect heart rhythm.', 'ممكن يسبب اضطراب معدة، وممكن يأثر على نظم القلب.'], ['Check allergy history and drug interactions.', 'راجع تاريخ الحساسية والتداخلات الدوائية.']]),
    D('abx', 'flu', ['Fluconazole', 'فلوكونازول'], ['Antifungal', 'مضاد فطريات'], 'block', ['Fungal CYP51 enzyme', 'إنزيم CYP51 في الفطر'], ['Ergosterol making', 'تصنيع الإرجوستيرول'], ['The fungal membrane is damaged: fungus stops growing', 'غشاء الفطر بيتضرر: الفطر بيوقف نمو'], ['It blocks a fungal enzyme needed to make ergosterol, so the fungal cell membrane fails.', 'بيقفل إنزيم في الفطر لازم لصنع الإرجوستيرول، فغشاء الخلية الفطرية بيفشل.'], [['It interacts with many drugs (such as warfarin) — check the list.', 'بيتداخل مع أدوية كتير (زي الوارفارين) — راجع القايمة.'], ['Liver tests may be checked with long courses.', 'ممكن تتطلب تحاليل كبد مع الكورسات الطويلة.']]),
  ];
  let drug = 0, withDrug = true, mmode = 'learn', qi = 0, qscore = 0, qasked = 0, qans = null, qopts = [];
  function drawMech(cvs, token, dr) {
    const c = cvs.getContext('2d');
    const tick = (now) => {
      if (token !== mtok || !cvs.isConnected) return;
      const dd = Math.min(window.devicePixelRatio || 1, 2), W = Math.max(2, Math.round(cvs.clientWidth * dd)), H = Math.max(2, Math.round(cvs.clientHeight * dd)); if (cvs.width !== W || cvs.height !== H) { cvs.width = W; cvs.height = H; }
      const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--accent').trim() || '#E3B95B', txt = css.getPropertyValue('--text').trim() || '#fff', mut = css.getPropertyValue('--muted').trim() || '#999', sf = css.getPropertyValue('--surface2').trim() || '#223';
      const s = W / 360, t = now / 1000, cx = 180, my = 100, on = withDrug;
      const fit = (txt, max, fs, wt) => { let f = fs; c.font = wt + ' ' + f + 'px Cairo,sans-serif'; while (c.measureText(txt).width > max && f > 7) { f -= 0.5; c.font = wt + ' ' + f + 'px Cairo,sans-serif'; } return txt; };
      c.setTransform(s, 0, 0, s, 0, 0); c.clearRect(0, 0, 360, H / s); c.textAlign = 'center'; c.font = '11px Cairo,sans-serif';
      c.fillStyle = mut; c.fillText(T('Outside the cell / blood', 'برّه الخلية / الدم'), 62, 14); c.fillText(T('Inside the cell', 'جوّه الخلية'), 52, my + 30);
      // membrane with pocket
      c.fillStyle = sf; c.fillRect(0, my - 8, cx - 30, 16); c.fillRect(cx + 30, my - 8, 360 - cx - 30, 16);
      c.beginPath(); c.moveTo(cx - 30, my - 8); c.lineTo(cx - 30, my + 8); c.lineTo(cx + 30, my + 8); c.lineTo(cx + 30, my - 8); c.lineTo(cx + 16, my - 8); c.lineTo(cx + 12, my + 0); c.lineTo(cx - 12, my + 0); c.lineTo(cx - 16, my - 8); c.closePath(); c.fill();
      c.fillStyle = txt; c.fillText(fit(T(dr.tgt[0], dr.tgt[1]), 300, 10, '400'), cx, my + 24);
      // effect box
      const ey = 172; c.fillStyle = on ? acc : sf; c.globalAlpha = on ? .92 : .6; c.beginPath(); c.roundRect ? c.roundRect(20, ey, 320, 36, 10) : c.rect(20, ey, 320, 36); c.fill(); c.globalAlpha = 1;
      c.fillStyle = on ? (css.getPropertyValue('--accent-ink').trim() || '#000') : mut; c.fillText(fit(on ? T(dr.eff[0], dr.eff[1]) : T('Normal — no drug', 'الوضع الطبيعي — من غير الدوا'), 300, 11.5, '700'), 180, ey + 22);
      // particles
      const ligand = (u, k, gold, passes) => { const x0 = 40 + ((k * 97) % 280), x = x0 + (cx - x0) * Math.min(1, u / .6), y = 24 + (my - 14 - 24) * Math.min(1, u / .6); let px = x, py = y;
        if (u > .6) { const v = (u - .6) / .4; if (passes) { px = cx; py = my - 14 + (ey - 6 - (my - 14)) * v; } else { const b = Math.sin(v * Math.PI); px = x + (k % 2 ? 1 : -1) * 26 * v; py = y - 22 * b; } }
        c.fillStyle = gold ? acc : txt; c.globalAlpha = gold ? 1 : .85; c.beginPath(); c.arc(px, py, gold ? 6 : 5, 0, 7); c.fill(); c.globalAlpha = 1; };
      if (dr.kind === 'agonist') { if (withDrug) for (let k = 0; k < 3; k++) ligand((t * .3 + k / 3) % 1, k, true, true); }
      else { for (let k = 0; k < 3; k++) ligand((t * .3 + k / 3) % 1, k, false, !withDrug); if (withDrug) { c.fillStyle = acc; c.globalAlpha = .9 + .1 * Math.sin(t * 4); c.beginPath(); c.arc(cx, my - 6, 8, 0, 7); c.fill(); c.globalAlpha = 1; } }
      c.fillStyle = mut; c.font = '10px Cairo,sans-serif';
      const lg = dr.kind === 'agonist' ? (withDrug ? T(dr.n[0], dr.n[1]) : '') : T(dr.nat[0], dr.nat[1]); if (lg) c.fillText(lg, 300, 40);
      c.fillStyle = acc; c.font = '700 10px Cairo,sans-serif'; if (withDrug) c.fillText('● ' + T(dr.n[0], dr.n[1]), 300, 56);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const dn = (d) => T(d.n[0], d.n[1]);
  let cat = 'cv', qsearch = '', qcat = 'all';
  const catName = (c) => (c === 'all' ? T('All', 'الكل') : T(CATS.find((x) => x[0] === c)[1], CATS.find((x) => x[0] === c)[2]));
  const chipRow = (id, act, cur) => `<div class="pjscroll" id="${id}">${['all'].concat(CATS.map((x) => x[0])).map((c) => `<span class="${cur === c ? 'on' : ''}" data-act="${act}" data-c="${c}">${esc(catName(c))}</span>`).join('')}</div>`;
  function drugList() { const q = qsearch.trim().toLowerCase(); return DRUGS.map((d, i) => [d, i]).filter(([d]) => (q ? d.n[0].toLowerCase().includes(q) || d.n[1].includes(qsearch.trim()) : cat === 'all' || d.c === cat)); }
  function drugRowHtml() { const l = drugList(); return l.length ? l.map(([d, i]) => `<span class="${i === drug ? 'on' : ''}" data-act="pjdrug" data-i="${i}">${esc(dn(d))}</span>`).join('') : `<small style="padding:8px;color:var(--muted)">${T('No match', 'مفيش نتيجة')}</small>`; }
  function mechHtml() {
    const d = DRUGS[drug];
    return chipRow('pjcats', 'pjcat', qsearch.trim() ? '' : cat) +
      `<div style="display:flex;gap:6px;align-items:center"><input id="pjq" class="pjsearch" type="search" placeholder="${T('Search a drug…', 'ابحث باسم الدوا…')}" value="${esc(qsearch)}"><button class="btn" data-act="pjrand" aria-label="${T('Random', 'عشوائي')}">🎲</button></div>` +
      `<div class="pjscroll" id="pjdrugs">${drugRowHtml()}</div>` +
      `<div class="pjcurve" style="margin-top:2px"><b style="font-size:15px">${esc(dn(d))}</b> <small style="display:inline">· ${esc(T(d.cls[0], d.cls[1]))}</small>` +
      `<div class="pjroutes" style="margin:8px 0 4px"><span class="${withDrug ? '' : 'on'}" data-act="pjwith" data-w="0" style="cursor:pointer">${T('Without the drug', 'من غير الدوا')}</span><span class="${withDrug ? 'on' : ''}" data-act="pjwith" data-w="1" style="cursor:pointer">${T('With the drug', 'مع الدوا')}</span></div>` +
      `<canvas id="pjmc" style="width:100%;height:215px;display:block"></canvas></div>` +
      `<div class="pjcurve" style="margin-top:8px"><small style="display:block;margin-bottom:3px">${T('How it works', 'بيشتغل إزاي')}</small><p style="margin:0;font-size:13.5px;line-height:1.7">${esc(T(d.mech[0], d.mech[1]))}</p></div>` +
      `<div class="pjcurve" style="margin-top:8px"><small style="display:block;margin-bottom:3px">${T('Nursing points', 'نقاط للتمريض')}</small><p style="margin:0 0 4px;font-size:13px;line-height:1.7">• ${esc(T(d.nurse[0], d.nurse[1]))}</p><p style="margin:0;font-size:13px;line-height:1.7">• ${esc(T(d.nurse[2], d.nurse[3]))}</p></div>`;
  }
  function mechMount() {
    const root = $('pjroot'); if (!root) return; const t = ++mtok; root.innerHTML = mechHtml(); drawMech($('pjmc'), t, DRUGS[drug]);
    const inp = $('pjq'); if (inp) inp.addEventListener('input', () => { qsearch = inp.value; const r = $('pjdrugs'); if (r) r.innerHTML = drugRowHtml(); const cr = $('pjcats'); if (cr) cr.outerHTML = chipRow('pjcats', 'pjcat', qsearch.trim() ? '' : cat); });
    const on = document.querySelector('#pjdrugs .on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  let deck = [], qt = 0;
  function quizHtml() {
    if (!deck.length) newDeck();
    const head = `<small style="color:var(--muted)">${T('Quiz topic', 'موضوع الاختبار')}</small>` + chipRow('pjqcats', 'pjqcat', qcat);
    if (qasked >= deck.length) {
      const pc = Math.round(qscore / deck.length * 100), msg = pc >= 80 ? T('Excellent!', 'ممتاز!') : pc >= 50 ? T('Good — review the ones you missed.', 'كويس — راجع اللي غلطت فيه.') : T('Go back to the Mechanism tab and try again.', 'ارجع لتبويب آلية العمل وجرّب تاني.');
      return head + `<div class="pjcurve" style="text-align:center;padding:18px 12px"><small>${T('Finished', 'خلّصت الاختبار')}</small><div style="font-size:34px;font-weight:800;margin:6px 0">${qscore} / ${deck.length}</div><p style="margin:0 0 12px">${msg}</p><button class="btn primary" data-act="pjrestartq">${T('Try again', 'جرّب تاني')}</button></div>`;
    }
    const d = DRUGS[qi], byEff = qt === 1;
    const qtxt = byEff ? T('Which drug is this? “' + d.eff[0] + '”', 'أنهي دوا ده؟ «' + d.eff[1] + '»') : T('What does ' + d.n[0] + ' act on?', 'الدوا ' + d.n[1] + ' بيشتغل على إيه؟');
    const q = `<div class="pjcurve"><small><span>${T('Question', 'سؤال')} ${qasked + 1} / ${deck.length}</span><span>${T('Score', 'النتيجة')} ${qscore}</span></small><b style="display:block;margin:6px 0;font-size:15px">${esc(qtxt)}</b>` +
      qopts.map((i) => { const x = DRUGS[i], ok = i === qi, st = qans === null ? '' : ok ? 'border-color:#3fd67a;background:rgba(63,214,122,.15)' : qans === i ? 'border-color:#ff6b6b;background:rgba(255,107,107,.15)' : ''; return `<button class="btn" style="display:block;width:100%;margin:5px 0;text-align:start;${st}" data-act="pjans" data-i="${i}">${esc(byEff ? dn(x) : T(x.tgt[0], x.tgt[1]))}</button>`; }).join('') + '</div>';
    const fb = qans === null ? '' : `<div class="pjcurve" style="margin-top:8px"><b>${qans === qi ? T('Correct!', 'تمام!') : T('Not quite.', 'مش بالظبط.')}</b><p style="margin:4px 0 8px;font-size:13px;line-height:1.7">${esc(T(d.mech[0], d.mech[1]))}</p><button class="btn primary" data-act="pjnext">${qasked + 1 >= deck.length ? T('See result', 'شوف النتيجة') : T('Next', 'التالي')}</button></div>`;
    return head + q + fb;
  }
  function newDeck() {
    deck = []; DRUGS.forEach((d, i) => { if (qcat === 'all' || d.c === qcat) deck.push([i, 0], [i, 1]); });
    deck.sort(() => Math.random() - .5); if (qcat === 'all') deck = deck.slice(0, 12);
    qscore = 0; qasked = 0; setQ();
  }
  function setQ() {
    if (qasked >= deck.length) return; qi = deck[qasked][0]; qt = deck[qasked][1]; const c = DRUGS[qi], o = [qi], used = [c.tgt[0]];
    const pool = DRUGS.map((d, i) => i).filter((i) => i !== qi && (qt === 1 ? DRUGS[i].c !== c.c : DRUGS[i].tgt[0] !== c.tgt[0])).sort(() => Math.random() - .5);
    for (const i of pool) { if (o.length >= 4) break; if (qt === 0 && used.includes(DRUGS[i].tgt[0])) continue; used.push(DRUGS[i].tgt[0]); o.push(i); }
    qopts = o.sort(() => Math.random() - .5); qans = null;
  }

  /* ───────── UI ───────── */
  let rk = 'oral', tab = 'journey';
  const nm = (s) => T(s.t[0], s.t[1]);
  function tabsHtml() { return `<div class="pjroutes">${[['journey', 'رحلة الدوا', 'Journey'], ['mech', 'آلية العمل', 'Mechanism'], ['quiz', 'اختبار', 'Quiz']].map((x) => `<span class="${tab === x[0] ? 'on' : ''}" data-act="pjtab" data-t="${x[0]}" style="cursor:pointer">${T(x[2], x[1])}</span>`).join('')}</div>`; }
  function routesHtml() { return `<div class="pjroutes">${RK.map((k) => `<span class="${rk === k ? 'on' : ''}" data-act="pjroute" data-r="${k}" style="cursor:pointer">${T(ROUTES[k].n[0], ROUTES[k].n[1])}</span>`).join('')}</div>`; }
  function stepsInner() { return ROUTES[rk].st.map((s, i) => `<button data-act="pjgo" data-i="${i}" aria-label="${esc(nm(s))}"><i></i></button>`).join(''); }
  function footInner() { const r = ROUTES[rk]; return `<span>${T('Onset: ', 'بداية المفعول: ')}${T(r.onset[0], r.onset[1])}</span><span>${T('First-pass in the liver: ', 'أول مرور بالكبد: ')}${r.firstPass ? T('yes', 'أيوه') : T('no', 'لأ')}</span>`; }
  function journeyHtml() {
    const r = ROUTES[rk];
    return routesHtml() +
      `<div class="pjstage" id="pjstage"><canvas id="pjcv"></canvas><div class="pjmsg" id="pjmsg">${T('Loading the body…', 'جارِ تحميل الجسم…')}</div></div><div class="pjtag" id="pjtag" style="display:none"><small id="pjn"></small><b id="pjt"></b><p id="pjd"></p></div>` +
      `<div class="pjsteps" id="pjsteps">${stepsInner()}</div>` +
      `<div class="pjcurve"><small><span>${T('Drug level in the blood', 'تركيز الدوا في الدم')}</span><span id="pjci"></span></small><canvas id="pjcc"></canvas><small id="pjfoot">${footInner()}</small></div>` +
      `<div class="pjctl"><button class="btn" data-act="pjrestart">⏮ ${T('Restart', 'من الأول')}</button><button class="btn primary" data-act="pjplay" id="pjplay">⏸ ${T('Pause', 'إيقاف')}</button><button class="btn" data-act="pjspeed" id="pjspeed">${T('Speed', 'سرعة')} ×1</button></div>`;
  }
  function page() {
    return `<h2>💊 ${T('Drug journey & action', 'رحلة الدوا وآلية عمله')}</h2>${tabsHtml()}<div id="pjroot"></div>` +
      `<p class="tiny" style="text-align:center;margin-top:8px">${T('For learning only — not for calculating patient doses. Draft content, pending review by a pharmacist or nursing instructor.', 'للتعلّم فقط — مش لحساب الجرعات للمرضى. المحتوى مبدئي ولسه بيتراجع من صيدلي أو مدرّس تمريض.')}</p>`;
  }
  function paintStage(i) {
    const s = ROUTES[rk].st[i], n = $('pjn'), tt = $('pjt'), dd = $('pjd'); if (!n) return;
    n.textContent = T('Stop ', 'المحطة ') + (i + 1) + ' / ' + ROUTES[rk].st.length; tt.textContent = nm(s); dd.textContent = T(s.d[0], s.d[1]);
    document.querySelectorAll('#pjsteps button').forEach((b, k) => { b.classList.toggle('on', k <= i); b.classList.toggle('cur', k === i); });
  }
  let meshes = null;
  function render() {
    const root = $('pjroot'); if (!root) return; stop();
    const tabs = document.querySelector('.pjroutes'); if (tabs) tabs.outerHTML = tabsHtml();
    if (tab === 'journey') { root.innerHTML = journeyHtml(); initGL(); }
    else if (tab === 'mech') { mechMount(); }
    else { root.innerHTML = quizHtml(); }
  }
  function initGL() {
    const cv = $('pjcv'), msg = $('pjmsg'); if (!cv) return;
    const go = (M) => { if (!cv.isConnected) return; try {
      cur = start(cv, M, rk); msg.remove(); $('pjtag').style.display = '';
      cur.onStage = paintStage;
      cur.onTick = (p) => { const cc = $('pjcc'); if (cc) curve(cc, p, ROUTES[rk].ka); const ci = $('pjci'); if (ci) { const x = ROUTES[rk].info(p); ci.textContent = T(x[0], x[1]); } };
    } catch (e) { msg.textContent = T('Your device could not start the 3D view.', 'جهازك مقدرش يشغّل العرض 3D.'); } };
    if (meshes) return go(meshes);
    loadMeshes().then((M) => { meshes = M; go(M); }).catch(() => { if (msg.isConnected) msg.textContent = T('Could not load the models — they need an internet connection the first time.', 'مقدرناش نحمّل المجسمات — أول مرة بتحتاج إنترنت.'); });
  }
  function open() { stop(); rk = 'oral'; tab = 'journey'; drug = 0; cat = 'cv'; qsearch = ''; qcat = 'all'; withDrug = true; deck = []; A.modal(page); render(); }
  const SP = [1, 0.5, 2];
  A.acts.pjtab = (el) => { tab = el.dataset.t; render(); };
  A.acts.pjroute = (el) => { rk = el.dataset.r; if (!cur) { render(); return; } cur.setRoute(rk); const rr = document.querySelector('#pjroot .pjroutes'); if (rr) rr.outerHTML = routesHtml(); const ss = $('pjsteps'); if (ss) ss.innerHTML = stepsInner(); const ff = $('pjfoot'); if (ff) ff.innerHTML = footInner(); };
  A.acts.pjdrug = (el) => { drug = +el.dataset.i; withDrug = true; mechMount(); };
  A.acts.pjcat = (el) => { cat = el.dataset.c; qsearch = ''; const l = drugList(); if (l.length && !l.some((x) => x[1] === drug)) drug = l[0][1]; withDrug = true; mechMount(); };
  A.acts.pjrand = () => { const l = drugList(), p = (l.length > 1 ? l : DRUGS.map((d, i) => [d, i])).filter((x) => x[1] !== drug); drug = p[Math.floor(Math.random() * p.length)][1]; withDrug = true; mechMount(); };
  A.acts.pjqcat = (el) => { qcat = el.dataset.c; deck = []; const root = $('pjroot'); if (root) root.innerHTML = quizHtml(); };
  A.acts.pjwith = (el) => { withDrug = el.dataset.w === '1'; mechMount(); };
  A.acts.pjans = (el) => { if (qans !== null) return; qans = +el.dataset.i; if (qans === qi) qscore++; const root = $('pjroot'); if (root) root.innerHTML = quizHtml(); };
  A.acts.pjrestartq = () => { newDeck(); const root = $('pjroot'); if (root) root.innerHTML = quizHtml(); };
  A.acts.pjnext = () => { qasked++; setQ(); const root = $('pjroot'); if (root) root.innerHTML = quizHtml(); };
  A.acts.pjgo = (el) => { if (cur) cur.p = ROUTES[rk].st[+el.dataset.i].a + 0.002; };
  A.acts.pjrestart = () => { if (cur) { cur.p = 0; cur.playing = true; const b = $('pjplay'); if (b) b.innerHTML = '⏸ ' + T('Pause', 'إيقاف'); } };
  A.acts.pjplay = () => { if (!cur) return; cur.playing = !cur.playing; const b = $('pjplay'); if (b) b.innerHTML = cur.playing ? '⏸ ' + T('Pause', 'إيقاف') : '▶ ' + T('Play', 'شغّل'); };
  A.acts.pjspeed = () => { if (!cur) return; const i = (SP.indexOf(cur.speed) + 1) % SP.length; cur.speed = SP[i]; const b = $('pjspeed'); if (b) b.textContent = T('Speed', 'سرعة') + ' ×' + SP[i]; };
  waitFor(() => A.hubExtra && A.modal, () => { A.hubExtra.pjourney = open; });
})();
