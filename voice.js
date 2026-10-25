/* voice.js — "Lab mode" 🧤: a hands-free conversation with the 3D model.
   The student says «فين العصب الأوسط؟» → the model flies to it and the app answers by voice; unsure matches are confirmed by voice («أيوه» / «لأ» / «الأول» / «التاني»).
   Uses the browser's Web Speech API (SpeechRecognition + speechSynthesis): Chrome / Edge, internet needed (the audio is sent to Google by the browser). */
'use strict';
if (!window.__voxLoaded) (() => {
  window.__voxLoaded = 1;
  const { S, esc, P } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const getSR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const canTalk = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const FREE_PER_DAY = 5, IDLE_MS = 180000;

  /* ───────── text helpers ───────── */
  const words = (s) => norm(String(s || '')).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const stem = (w) => (w.length > 4 && w.startsWith('ال') ? w.slice(2) : w);
  const toks = (s) => words(s).map(stem);
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let min = i;
      for (let j = 1; j <= b.length; j++) { const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); cur.push(v); if (v < min) min = v; }
      if (min > max) return max + 1; prev = cur;
    }
    return prev[b.length];
  }
  function tokScore(q, g) {            // 0..1 how well query token q matches name token g
    if (q === g) return 1;
    if (q.length >= 3 && (g.startsWith(q) || (g.length >= 3 && q.startsWith(g)))) return 0.9;
    if (q.length >= 4 && lev(q, g, 1) <= 1) return 0.85;
    if (q.length >= 7 && lev(q, g, 2) <= 2) return 0.75;
    return 0;
  }
  function setScore(q, g) {            // q, g: token arrays
    if (!q.length || !g.length) return 0;
    let sum = 0; for (const t of q) { let b = 0; for (const x of g) { const s = tokScore(t, x); if (s > b) b = s; } sum += b; }
    const base = sum / q.length, pen = Math.min(0.3, Math.max(0, g.length - q.length) * 0.03);
    return base < 0.7 ? 0 : base - pen;
  }

  /* groups = one entry per structure name (left + right merged) */
  let GROUPS = null;
  function groups() {
    if (GROUPS) return GROUPS;
    const m = new Map();
    for (const e of P) { let g = m.get(e.baseEn); if (!g) { g = { en: e.baseEn, ar: e.baseAr, items: [], tAr: toks(e.baseAr), tEn: toks(e.baseEn), sys: e.sys, grp: e.grp }; m.set(e.baseEn, g); } g.items.push(e); }
    GROUPS = [...m.values()]; return GROUPS;
  }
  function match1(q) {                  // → [{g, s}] best first (max 3, deduped)
    const out = [];
    for (const g of groups()) { let s = Math.max(setScore(q, g.tAr), setScore(q, g.tEn)); if (s > 0) { if (g.sys === 'bone' && s >= 0.85) s += 0.05; out.push({ g, s }); } }
    out.sort((a, b) => b.s - a.s || a.g.en.length - b.g.en.length);
    return out.slice(0, 3);
  }
  const TYPEW = new Set('عظمه عظم عضله عصب شريان وريد bone muscle nerve artery vein'.split(' '));
  function match(q) {                   // if nothing good, retry without generic words ("عظمة العضد" → "العضد")
    let c = match1(q);
    if (!c.length || c[0].s < 0.9) { const q2 = q.filter((x) => !TYPEW.has(x)); if (q2.length && q2.length < q.length) { const c2 = match1(q2); if (c2.length && (!c.length || c2[0].s > c[0].s)) c = c2; } }
    return c;
  }
  /* everyday names that the catalog spells differently, or that cover several structures at once */
  const ALIAS = [
    [/كوادر|رباعي|فخذ.*امام|امام.*فخذ|^quadriceps$/, ['Rectus femoris', 'Vastus lateralis', 'Vastus medialis', 'Vastus intermedius'], 'العضلة رباعية الرؤوس الفخذية', 'Quadriceps'],
    [/هامستر|فخذ.*خلف|خلف.*فخذ|^hamstrings?$/, ['Biceps femoris (Long head)', 'Biceps femoris (Short head)', 'Semitendinosus', 'Semimembranosus'], 'عضلات الفخذ الخلفية (الهامسترنج)', 'Hamstrings'],
    [/(^| )(سمان|سمانه)( |$)|ساق.*خلف|^calf$/, ['Gastrocnemius (Medial head)', 'Gastrocnemius (Lateral head)', 'Soleus'], 'عضلات السمانة', 'Calf muscles'],
    [/(^| )(ارداف|اليه|الويه|مؤخره|glutes?|gluteal)( |$)/, ['Gluteus maximus', 'Gluteus medius', 'Gluteus minimus'], 'العضلات الإلوية', 'Gluteal muscles'],
    [/بايسبس|بيسبس|^biceps$/, ['Biceps brachii (Long head)', 'Biceps brachii (Short head)'], 'العضلة ذات الرأسين العضدية', 'Biceps brachii'],
    [/ترايسبس|تريسبس|^triceps$/, ['Triceps brachii (Long head)', 'Triceps brachii (Lateral head)', 'Triceps brachii (Medial head)'], 'العضلة ثلاثية الرؤوس العضدية', 'Triceps brachii'],
    [/(^| )(كفه|cuff)( |$)|rotator cuff/, ['Supraspinatus', 'Infraspinatus', 'Teres minor', 'Subscapularis'], 'الكفة المدورة', 'Rotator cuff'],
    [/اكيليس|اخيل|achilles/, ['Calcaneal (Achilles) tendon'], 'وتر العرقوب (أخيل)', 'Achilles tendon'],
    [/(^| )(صدر|pecs?|pectorals?)( |$)/, ['Pectoralis major (Clavicular part)', 'Pectoralis major (Sternocostal part)', 'Pectoralis major (Abdominal part)'], 'العضلة الصدرية الكبرى', 'Pectoralis major'],
    [/(^| )(ضامه|ضامات|adductors)( |$)/, ['Adductor longus', 'Adductor brevis', 'Adductor magnus', 'Adductor minimus'], 'العضلات الضامة', 'Hip adductors'],
    [/لاتس|لاتيسيموس|latissimus/, ['Latissimus dorsi'], 'العضلة العريضة الظهرية', 'Latissimus dorsi'],
    [/ايليوبسواس|ايلوبسواس|حرقفيه قطنيه|iliopsoas/, ['Iliacus', 'Psoas major'], 'العضلة الحرقفية القطنية', 'Iliopsoas'],
    [/^عصب متوسط$|^متوسط عصب$/, ['Median nerve'], 'العصب الأوسط', 'Median nerve'],
  ];
  function aliasOf(q) {
    const j = q.join(' ');
    for (const [rx, names, lab, labEn] of ALIAS) if (rx.test(j)) { const gs = names.map((n) => groups().find((g) => g.en === n)).filter(Boolean); if (gs.length) return { gs, lab: ar() ? lab : labEn }; }
    return null;
  }
  const clear = (c) => {                // confident enough to act without asking?
    if (!c.length) return false;
    const t = c.filter((x) => x.s >= c[0].s - 0.045);
    if (t.length === 1) return c[0].s >= 0.92;
    return c[0].s >= 0.88 && t.every((x) => x.g.grp && x.g.grp === t[0].g.grp && x.g.sys === 'muscle');    // several parts of the same muscle
  };

  /* ───────── command parser ───────── */
  const SET = (s) => new Set(s.split(' '));
  const W = {
    stop: SET('وقف كفايه خلاص اقفل انهاء سلام stop exit quit bye'),
    quiz: SET('اختبرني امتحني كويز اختبار quiz'),
    reset: SET('رجعهم ريسيت reset'),
    hide: SET('اخفي اخفيه شيل اخفى hide remove'),
    iso: SET('اعزل اعزلها اعزله عزل isolate'),
    info: SET('وظيفه اشرح اشرحلي معلومات قولي احكيلي عرفني info explain function'),
    find: SET('فين وين وريني ورينا اعرض اظهر اشوف ابحث دلني هات show find where'),
  };
  const FILL = SET('عايز عاوز عايزه ممكن لو سمحت يا بقي بقى ده دي دا اللي هو هي علي على عن عني لي ليا انا ل لـ the me please can you to of about where is is');
  const SIDE = { r: SET('يمين اليمين ايمن يمني right'), l: SET('شمال الشمال يسار اليسار ايسر يسري left') };
  const YES = SET('ايوه ايوا ايوة اه ماشي تمام صح اكيد ياس اجل ايوه yes yeah yep ok okay correct right');
  const NO = SET('لا لأ لاء غلط لالا مش no nope wrong');
  const hasAny = (ws, set) => ws.some((w) => set.has(w));
  const isYes = (ws) => hasAny(ws, YES) && !hasAny(ws, NO);
  const isNo = (ws) => hasAny(ws, NO);

  function parse(text) {
    const ws0 = words(text); if (!ws0.length) return { act: 'none' };
    const joined = ws0.join(' ');
    if (hasAny(ws0, W.stop)) return { act: 'stop' };
    if (hasAny(ws0, W.quiz)) return { act: 'quiz' };
    if (/(رجع|اظهر|show|reset)\s*(الكل|كل|all|everything)|رجعهم|^(الكل|ريسيت|reset)$/.test(joined)) return { act: 'reset' };
    let act = 'find';
    for (const k of ['hide', 'iso', 'info', 'find']) if (hasAny(ws0, W[k])) { act = k; break; }
    let side = null; const rest = [];
    for (const w of ws0) {
      if (SIDE.r.has(w)) { side = 'r'; continue; }
      if (SIDE.l.has(w)) { side = 'l'; continue; }
      if (FILL.has(w) || Object.values(W).some((s) => s.has(w))) continue;
      rest.push(stem(w));
    }
    if (!rest.length && act === 'find') return { act: 'none' };
    return { act, q: rest, side };
  }

  /* ───────── state ───────── */
  const V = { on: false, st: 'idle', rec: null, silent: 0, bad: 0, cands: null, pend: null, idle: 0, tmr: 0, heard: '', say: '', speaking: false };
  const dayKey = () => new Date().toDateString();
  const used = () => { const c = Store.d.vc; return c && c.d === dayKey() ? c.n : 0; };
  const bump = () => { const c = Store.d.vc && Store.d.vc.d === dayKey() ? Store.d.vc : (Store.d.vc = { d: dayKey(), n: 0 }); c.n++; Store.save(); };
  const spoken = (t) => String(t || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*[–-]\s*/g, '، ').trim();
  const gname = (g) => spoken(ar() ? g.ar : g.en);
  const sideWord = (s) => (s === 'r' ? T('right', 'الأيمن') : s === 'l' ? T('left', 'الأيسر') : '');

  /* ───────── speaking ───────── */
  let voice = null;
  const pickVoice = () => { try { const v = speechSynthesis.getVoices(), want = ar() ? 'ar' : 'en'; voice = v.find((x) => x.lang.replace('_', '-').toLowerCase() === (ar() ? 'ar-eg' : 'en-us')) || v.find((x) => x.lang.toLowerCase().startsWith(want)) || null; } catch (e) { voice = null; } };
  if (canTalk()) { try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { /* ignore */ } }
  function speak(text, cb) {
    V.say = text; ui();
    if (!V.on) return;
    let done = false; const fin = () => { if (done) return; done = true; clearTimeout(guard); V.speaking = false; if (V.on && cb) cb(); };
    const guard = setTimeout(fin, Math.min(30000, 2500 + text.length * 110));
    if (!canTalk()) { setTimeout(fin, 700); return; }
    try {
      pickVoice(); speechSynthesis.cancel(); V.speaking = true;
      const u = new SpeechSynthesisUtterance(text); u.lang = ar() ? 'ar-EG' : 'en-US'; u.rate = ar() ? 0.95 : 0.9; if (voice) u.voice = voice;
      u.onend = fin; u.onerror = fin; speechSynthesis.speak(u);
    } catch (e) { fin(); }
  }

  /* ───────── listening ───────── */
  function stopRec() { try { if (V.rec) { V.rec.onresult = V.rec.onerror = V.rec.onend = null; V.rec.abort(); } } catch (e) { /* ignore */ } V.rec = null; }
  function listen() {
    if (!V.on) return; stopRec();
    const SR = getSR(); if (!SR) return stopMode(T('Voice is not supported on this browser.', 'المتصفح ده مش بيدعم الصوت.'));
    const r = new SR(); V.rec = r; r.lang = ar() ? 'ar-EG' : 'en-US'; r.interimResults = false; r.maxAlternatives = 4; r.continuous = false;
    let got = false; V.heard = ''; ui('listen');
    r.onresult = (ev) => {
      got = true; const res = ev.results[ev.results.length - 1], alts = [];
      for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
      V.silent = 0; V.heard = alts[0] || ''; ui(); handle(alts);
    };
    r.onerror = (ev) => {
      const e = ev && ev.error;
      if (e === 'not-allowed' || e === 'service-not-allowed') { got = true; return stopMode(T('Allow the microphone for this site, then try again.', 'اسمح للميكروفون من إعدادات المتصفح وجرّب تاني.')); }
      if (e === 'network') { got = true; return stopMode(T('No internet — voice needs a connection.', 'مفيش إنترنت — الصوت محتاج اتصال.')); }
      if (e === 'audio-capture') { got = true; return stopMode(T('No microphone found.', 'مفيش ميكروفون شغال.')); }
    };
    r.onend = () => {
      if (got || !V.on || V.rec !== r) return;
      if (++V.silent >= 3) return stopMode(T('I did not hear anything, so I closed Lab mode.', 'ماسمعتش كلام، فقفلت وضع المعمل.'), true);
      setTimeout(listen, 250);
    };
    try { r.start(); } catch (e) { setTimeout(listen, 500); }
  }

  /* ───────── dialogue ───────── */
  function handle(alts) {
    resetIdle();
    if (V.st === 'confirm') return handleConfirm(alts);
    // best parse among the alternatives (the first alternative that gives a confident structure wins; else the first parseable)
    let best = null;
    for (const a of alts) {
      const p = parse(a); if (p.act === 'none') continue;
      if (['stop', 'quiz', 'reset'].includes(p.act)) { best = { p, c: [] }; break; }
      const c = p.q && p.q.length ? match(p.q) : [];
      const sc = c.length ? c[0].s : 0;
      if (!best || sc > (best.c.length ? best.c[0].s : 0)) best = { p, c };
      if (sc >= 1) break;
    }
    if (!best) { if (alts.some((a) => isNo(words(a)))) return speak(T('OK, say it again.', 'تمام، قول تاني.'), listen); return unknown(); }
    V.bad = 0; run(best.p, best.c);
  }
  function unknown() {
    V.bad++;
    const hint = V.bad >= 2 ? T(' Try: where is the median nerve?', ' جرّب تقول: فين العصب الأوسط؟') : '';
    speak(T('I did not get that, say it again.', 'مافهمتش، قولها تاني.') + hint, listen);
  }
  function limitHit() {
    if (A.isPremium() || used() < FREE_PER_DAY) return false;
    stopMode(); const msg = T('You used your free voice commands for today. Premium has no limit.', 'خلصت الأوامر الصوتية المجانية النهاردة. الاشتراك بيفتحها من غير حد.');
    A.toast(msg, 4500); setTimeout(() => A.paywall('Unlimited voice commands are part of Premium (5 free per day).', 'الأوامر الصوتية من غير حد ضمن النسخة المميزة (5 مجانية في اليوم).'), 600);
    return true;
  }
  function pickItem(g, side) {
    const s = side || (g.items.some((x) => x.side === 'r') ? 'r' : null);
    return g.items.find((x) => x.side === s) || g.items[0];
  }
  async function run(p, c) {
    if (p.act === 'stop') return stopMode(T('Bye!', 'مع السلامة!'), true, true);
    if (p.act === 'reset') { A.acts.showall(); return speak(T('Everything is back.', 'رجّعت كل حاجة.'), listen); }
    if (p.act === 'quiz') { stopMode(); A.toast(T('Opening the quiz…', 'بفتحلك الاختبار…'), 2000); setTimeout(() => A.acts.hub({ dataset: { k: 'quiz' } }), 300); return; }
    // find / iso / hide / info — maybe on the current selection
    if (!(p.q && p.q.length)) {
      if (S.sel < 0) return speak(T('Which structure?', 'أنهي تركيب؟'), listen);
      return exec(p.act, P[S.sel], null, p.side);
    }
    const al = aliasOf(p.q); if (al) return exec(p.act, al.gs[0], al.gs, p.side, al.lab);
    if (!c.length) return speak(T('I could not find that. Say the name again.', 'ملقيتش التركيب ده. قول الاسم تاني.'), listen);
    if (clear(c)) return exec(p.act, c[0].g, c.filter((x) => x.s >= c[0].s - 0.045).map((x) => x.g), p.side);
    V.st = 'confirm'; V.cands = c.map((x) => x.g); V.pend = p; V.conf = 0;
    const ns = V.cands.map(gname);
    speak(ns.length === 1 ? T(`Do you mean ${ns[0]}?`, `قصدك ${ns[0]}؟`) : T(`Do you mean ${ns.join(', or ')}?`, `قصدك ${ns.join('، ولا ')}؟`), listen);
  }
  async function exec(act, target, same, side, label) {
    if (limitHit()) return;
    V.st = 'cmd'; V.cands = null;
    const e = target.items ? pickItem(target, side) : target, g = target.items ? target : null;
    if (e.lk && !A.isPremium()) return speak(T('This structure is for Premium subscribers.', 'التركيب ده للمشتركين.'), listen);
    bump();
    try {
      if (act === 'info') await A.select(e.i); else await A.select(e.i, { noPanel: true });
      if (g && same && same.length > 1) {                          // all parts of one muscle: tint the others too
        S.hl = new Map(); same.forEach((x) => x.items.forEach((it) => { if (it.i !== e.i && (!e.side || it.side === e.side)) S.hl.set(it.i, [1, 0.78, 0.18, 0.55]); })); A.apply();
      } else if (S.hl && S.hl.size) { S.hl = null; A.apply(); }
      if (act === 'iso') { if (S.hl && S.hl.size) { S.focus = new Set([e.i, ...S.hl.keys()]); } else S.iso = e.i; A.apply(); }
      if (act === 'hide') { A.acts.hide(); return speak(T('Hidden.', 'اخفيته.'), listen); }
    } catch (er) { return speak(T('Something went wrong.', 'حصلت مشكلة.'), listen); }
    const nm = (label || (g ? gname(g) : spoken(ar() ? e.baseAr : e.baseEn))) + (e.side ? ' ' + sideWord(e.side) : '');
    if (act === 'info') return speak(label ? label + '. ' + describe(e) : describe(e), listen);
    speak(act === 'iso' ? T(`Isolated: ${nm}`, `عزلت ${nm}`) : nm, listen);
  }
  function describe(e) {
    const name = spoken(ar() ? e.baseAr : e.baseEn); let t = name + '. ';
    if (e.sum) t += (ar() ? e.sum[1] : e.sum[0]) + '. ';
    if (e.mu) { const m = e.mu; t += ar() ? `الوظيفة: ${m[5]}. العصب: ${m[7]}.` : `Action: ${m[4]}. Nerve: ${m[6]}.`; }
    else if (!e.sum && e.facts && e.facts[0]) t += ar() ? e.facts[0][1] : e.facts[0][0];
    return t.length > 420 ? t.slice(0, 420) : t;
  }
  function handleConfirm(alts) {
    const cands = V.cands || [], p = V.pend;
    for (const a of alts) {
      const ws = words(a), joined = ws.join(' ');
      if (isNo(ws) && !/(الاول|اول|التاني|ثاني|التالت|ثالث)/.test(joined)) { V.st = 'cmd'; V.cands = null; return speak(T('OK, say the name again.', 'تمام، قول الاسم تاني.'), listen); }
      let k = -1;
      if (/(^| )(الاول|اول|الاولي|first|1|واحد)( |$)/.test(joined)) k = 0;
      else if (/(^| )(التاني|ثاني|الثاني|تاني|second|2|اتنين|اثنين)( |$)/.test(joined)) k = 1;
      else if (/(^| )(التالت|ثالث|الثالث|third|3|تلاته|ثلاثه)( |$)/.test(joined)) k = 2;
      else if (isYes(ws)) k = 0;
      else { const q = toks(a); let bs = 0; cands.forEach((g, i) => { const s = Math.max(setScore(q, g.tAr), setScore(q, g.tEn)); if (s > bs) { bs = s; k = i; } }); if (bs < 0.8) k = -1; }
      if (k >= 0 && cands[k]) { V.st = 'cmd'; const g = cands[k]; V.cands = null; return exec(p.act, g, null, p.side); }
    }
    if (++V.conf >= 2) { V.st = 'cmd'; V.cands = null; return speak(T('OK, say the name again.', 'تمام، قول الاسم تاني.'), listen); }
    speak(T('Say yes, no, first or second.', 'قول أيوه، أو لأ، أو الأول، أو التاني.'), listen);
  }

  /* ───────── mode on / off ───────── */
  function resetIdle() { clearTimeout(V.tmr); V.tmr = setTimeout(() => { if (V.on) stopMode(T('Closed Lab mode to save battery.', 'قفلت وضع المعمل لتوفير البطارية.'), true); }, IDLE_MS); }
  function startMode() {
    if (!getSR()) return A.toast(T('Voice is not supported on this browser (use Chrome).', 'الصوت مش مدعوم في المتصفح ده (استخدم Chrome).'), 3500);
    if (V.on) return;
    if (!navigator.onLine) return A.toast(T('Voice needs an internet connection.', 'الصوت محتاج إنترنت.'), 3000);
    if (limitHit()) return;
    V.on = true; V.st = 'cmd'; V.silent = 0; V.bad = 0; V.cands = null; V.heard = ''; V.say = ''; resetIdle(); ui();
    try { A.closeModal(); } catch (e) { /* ignore */ }
    speak(T('Lab mode is on. Say a structure name, for example: where is the median nerve?', 'وضع المعمل شغال. قول اسم تركيب، مثلًا: فين العصب الأوسط؟'), listen);
  }
  function stopMode(msg, speakIt, quiet) {
    const was = V.on; V.on = false; V.st = 'idle'; clearTimeout(V.tmr); stopRec();
    try { if (canTalk()) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (msg && !speakIt) A.toast(msg, 4000);
    if (msg && speakIt && was && canTalk() && !quiet) { try { const u = new SpeechSynthesisUtterance(msg); u.lang = ar() ? 'ar-EG' : 'en-US'; if (voice) u.voice = voice; speechSynthesis.speak(u); } catch (e) { /* ignore */ } }
    if (msg && speakIt) A.toast(msg, 3000);
    ui();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && V.on) stopMode(); });

  /* ───────── UI ───────── */
  let el = null;
  function ui(mode) {
    if (!el) { el = document.createElement('div'); el.id = 'vox'; el.hidden = true; document.body.appendChild(el); }
    if (!V.on) { el.hidden = true; return; }
    const st = mode === 'listen' || (!V.speaking && V.st !== 'idle' && !V.say) ? '🎤 ' + T('Listening…', 'بسمعك…') : V.speaking ? '🔊 ' + T('Speaking…', 'بتكلم…') : '🎤 ' + T('Listening…', 'بسمعك…');
    const c = V.st === 'confirm' && V.cands ? `<div class="vx-c">${V.cands.map((g, i) => `<button class="vx-b" data-act="voxpick" data-k="${i}">${esc(ar() ? g.ar : g.en)}</button>`).join('')}</div>` : '';
    el.innerHTML = `<div class="vx-top"><b>🧤 ${T('Lab mode', 'وضع المعمل')}</b><span class="vx-st">${st}</span><button class="vx-x" data-act="voxstop" aria-label="stop">✕</button></div>` +
      (V.heard ? `<div class="vx-h">“${esc(V.heard)}”</div>` : '') + (V.say ? `<div class="vx-s">${esc(V.say)}</div>` : '') + c +
      `<div class="vx-t">${T('Say: “where is the median nerve?” · “isolate the deltoid” · “function of biceps” · “stop”', 'قول: «فين العصب الأوسط؟» · «اعزل الدالية» · «وظيفة العضلة ذات الرأسين» · «وقف»')}</div>`;
    el.hidden = false;
  }
  A.acts.vox = () => {
    if (V.on) return stopMode();
    if (!Store.d.vxOk) {
      return A.modal(() => `<h2>🧤 ${T('Lab mode', 'وضع المعمل')}</h2><p class="lead">${T('Talk to the 3D model hands-free: ask for a structure, isolate it, hear its function — and confirm by voice (yes / no).', 'كلّم المجسم من غير ما تلمس الشاشة: اطلب تركيب، اعزله، اسمع وظيفته — وأكّد بالصوت (أيوه / لأ).')}</p>` +
        `<div class="advice">${T('Needs internet. Your voice is converted to text by your browser (Google), not stored by Anatovia. Free: 5 commands a day.', 'محتاج إنترنت. صوتك بيتحوّل لنص عن طريق المتصفح (Google) ومش بنخزّنه. مجاني: 5 أوامر في اليوم.')}</div>` +
        `<button class="btn primary wide" style="margin-top:10px" data-act="voxgo">🎤 ${T('Start', 'ابدأ')}</button>`);
    }
    startMode();
  };
  A.acts.voxgo = () => { Store.d.vxOk = 1; Store.save(); startMode(); };
  A.acts.voxstop = () => stopMode();
  A.acts.voxpick = (b) => { if (V.st !== 'confirm' || !V.cands) return; stopRec(); const g = V.cands[+b.dataset.k], p = V.pend; V.st = 'cmd'; V.cands = null; if (g) exec(p.act, g, null, p.side); };

  const prev = A.extraChips;
  A.extraChips = () => (prev ? prev() : '') + (getSR() ? `<button class="chip ${V.on ? 'active' : ''}" data-act="vox">🧤 ${T('Lab mode', 'وضع المعمل')}</button>` : '');
  if (A.renderChips) A.renderChips();
  A.vox = { parse, match, clear, aliasOf, words, toks, V, handle, setScore };   // for tests
})();
