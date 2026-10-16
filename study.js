/* study.js — Study hub: quiz (finite, scored, with weak-area analysis), flashcards (spaced repetition),
   movement finder, progress, favourites/notes, about. */
'use strict';
(() => {
  const { S, P, $, t, L, esc, name1, name2, base1 } = A;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* representative entry per L/R pair (so flashcards / progress count each structure once) */
  const repKey = (e) => e.sys + '|' + e.k + '|' + e.baseEn;
  const reps = new Map();
  for (const e of P) { const k = repKey(e), cur = reps.get(k); if (!cur) reps.set(k, e); else if (e.side === 'r' && cur.side !== 'r') reps.set(k, e); }
  const repOf = (e) => reps.get(repKey(e));
  const repList = [...reps.values()];

  /* ───────── hub ───────── */
  A.openHub = () => A.modal(() => {
    const items = [['quiz', '🎯'], ['lmq', '📍'], ['exam', '🩺'], ['cards', '🧠'], ['moves', '🏃'], ['progress', '📈'], ['favs', '⭐'], ['about', 'ℹ️']];
    return `<h2>${t('study')}</h2><p class="lead">${t('tagline')}</p><div class="hub">` +
      items.map(([k, em]) => `<button type="button" data-act="hub" data-k="${k}"><span class="em">${em}</span><span><b>${t(k)}</b><small>${t(k + 'Sub')}</small></span></button>`).join('') + '</div>';
  });
  A.acts.hub = (el) => ({ quiz: openQuizSetup, cards: openCardsSetup, moves: openMoves, progress: openProgress, favs: openFavs, about: openAbout, ...(A.hubExtra || {}) })[el.dataset.k]();

  /* scope helpers shared by quiz + flashcards */
  const scopeRow = (cfg, act) => {
    const sysOpts = ['all', ...SYSTEMS];
    return `<div class="lab">${t('scope')}</div><div class="row">` + sysOpts.map((s) => `<button class="opt ${cfg.sys === s ? 'sel' : ''}" data-act="${act}" data-k="sys" data-v="${s}">${s === 'all' ? t('allSys') : t(s)}</button>`).join('') + '</div>' +
      `<div class="lab">${t('regions')}</div><div class="row"><button class="opt ${cfg.reg === 'all' ? 'sel' : ''}" data-act="${act}" data-k="reg" data-v="all">${t('allBody')}</button>` +
      REGIONS.map((r) => `<button class="opt ${cfg.reg === r ? 'sel' : ''}" data-act="${act}" data-k="reg" data-v="${r}">${t(r)}</button>`).join('') + '</div>';
  };
  const inScope = (e, cfg) => (cfg.sys === 'all' || e.sys === cfg.sys) && (cfg.reg === 'all' || e.reg === cfg.reg);

  /* ───────── QUIZ ───────── */
  const QC = { mode: 'mix', sys: 'all', reg: 'all', n: 10 };
  function openQuizSetup() {
    A.modal(() => {
      const modes = ['tap', 'name', 'clue', 'mix'];
      const pool = quizPool(QC, QC.mode === 'mix' ? 'any' : QC.mode).length;
      return `<h2>${t('quizSetup')}</h2><p class="lead">${t('quizSub')}</p>` +
        `<div class="lab">${t('mode')}</div><div class="row">` + modes.map((m) => `<button class="opt ${QC.mode === m ? 'sel' : ''}" data-act="qcfg" data-k="mode" data-v="${m}">${t('m_' + m)}</button>`).join('') + '</div>' +
        scopeRow(QC, 'qcfg') +
        `<div class="lab">${t('length')}</div><div class="row">` + [5, 10, 20].map((n) => `<button class="opt ${QC.n === n ? 'sel' : ''}" data-act="qcfg" data-k="n" data-v="${n}">${n}</button>`).join('') + '</div>' +
        `<button class="btn primary wide" data-act="qstart" ${pool < 4 ? 'disabled' : ''}>${t('start')}</button>`;
    });
  }
  A.acts.qcfg = (el) => { const k = el.dataset.k; QC[k] = k === 'n' ? +el.dataset.v : el.dataset.v; openQuizSetup(); };
  A.acts.qstart = () => { A.closeModal(); startQuiz({ ...QC }); };

  const clueOf = (e) => {
    if (e.mu) return L([e.mu[4], e.mu[5]]);
    if (e.sum) { const s = L(e.sum); const cut = s.search(/[.。]\s|۔/); const first = cut > 20 ? s.slice(0, cut + 1) : s; const b = e.baseEn.split(' ')[0].toLowerCase(); if (b.length > 3 && first.toLowerCase().includes(b)) return null; if (S.lang === 'ar' && first.includes(e.baseAr.split(' ')[0]) && e.baseAr.split(' ')[0].length > 4) return null; return first; }
    return null;
  };
  function quizPool(cfg, type) {
    return repList.filter((e) => inScope(e, cfg) && (type === 'tap' ? e.r >= 0.014 && e.k !== 'tendon' : type === 'clue' ? !!clueOf(e) : true));
  }
  function weight(e) { const s = Store.d.srs[e.id]; if (s) return s.b <= 1 ? 3 : 1; return Store.d.learned[e.id] ? 0.5 : 1.4; }
  function sample(pool, n) {
    const out = [], items = pool.map((e) => ({ e, w: weight(e) * (0.5 + Math.random()) })).sort((a, b) => b.w - a.w);
    const seen = new Set();
    for (const it of items) { if (out.length >= n) break; if (seen.has(it.e.baseEn)) continue; seen.add(it.e.baseEn); out.push(it.e); }
    return out;
  }
  function distractors(e, n = 3) {
    const sameReg = repList.filter((x) => x.sys === e.sys && x.k === e.k && x.reg === e.reg && x.baseEn !== e.baseEn);
    const sameSys = repList.filter((x) => x.sys === e.sys && x.baseEn !== e.baseEn && !sameReg.includes(x));
    const out = shuffle(sameReg).slice(0, n); if (out.length < n) out.push(...shuffle(sameSys).slice(0, n - out.length));
    return out;
  }

  let Q = null, prevView = null;
  function startQuiz(cfg) {
    const types = cfg.mode === 'mix' ? ['tap', 'name', 'clue'] : [cfg.mode];
    // build question list
    const list = []; const used = new Set();
    const per = Math.ceil(cfg.n / types.length);
    let spare = [];
    types.forEach((ty, ti) => {
      const pool = quizPool(cfg, ty).filter((e) => !used.has(e.baseEn));
      const need = ti === types.length - 1 ? cfg.n - list.length : per;
      const picks = sample(pool, need + 3);
      picks.slice(0, need).forEach((e) => { used.add(e.baseEn); list.push({ e, type: ty }); });
      spare.push(...picks.slice(need).map((e) => ({ e, type: ty })));
    });
    while (list.length < cfg.n && spare.length) list.push(spare.shift());
    if (list.length < 3) { A.toast(S.lang === 'ar' ? 'لا توجد أسئلة كافية في هذا النطاق' : 'Not enough items in this scope'); return; }
    Q = { cfg, qs: shuffle(list), spare, idx: 0, skips: 0, t0: Date.now(), results: [], done: false, answered: false };
    prevView = { layers: { ...S.layers }, region: S.region, hidden: new Set(S.hidden), iso: S.iso, explode: S.explode, sel: S.sel, move: S.moveSet };
    S.moveSet = null; $('moveBar').hidden = true; $('explodeBar').hidden = true; S.explode = 0; S.hidden = new Set(); S.pulled.clear();
    S.sel = -1; A.deselect(); document.getElementById('app').classList.add('quiz');
    S.quiz = { onTap: onQuizTap }; $('quizBar').hidden = false;
    askQuestion();
  }
  async function askQuestion() {
    const q = Q.qs[Q.idx]; q.t0 = Date.now(); Q.answered = false; q.opts = null;
    const e = q.e;
    for (const s of SYSTEMS) S.layers[s] = s === e.sys ? 'on' : 'off';
    S.region = null; S.hl = null; S.iso = -1; S.sel = -1;
    await A.ensure(e.sys);
    // use the left/right entry nearest to what the bar says; for a pair pick the exact side
    const target = e;
    q.target = target;
    if (q.type === 'tap') { A.flyRegion(target.reg); }
    else { S.iso = target.i; S.hl = new Map([[target.i, [1, 0.78, 0.18, 0.55]]]); A.flyToPart(target); }
    if (q.type !== 'tap') {
      const opts = shuffle([e, ...distractors(e)]); q.opts = opts.map((x) => x.i); q.correctIdx = q.opts.indexOf(e.i);
    }
    A.apply(); renderQuizBar();
  }
  function renderQuizBar() {
    const bar = $('quizBar'), q = Q.qs[Q.idx], e = q.e, n = Q.qs.length;
    let h = `<div class="qtop"><span dir="ltr">${Q.idx + 1} / ${n}</span><span>${t('score')}: <b>${Q.results.filter((r) => r.ok).length}</b></span></div>
      <div class="qprog"><i style="width:${(Q.idx / n) * 100}%"></i></div>`;
    if (q.type === 'tap') {
      h += `<div class="qq">${t('qFind')} <span style="color:var(--gold)">${esc(name1(e))}</span><small>${esc(name2(e))}</small></div>`;
    } else if (q.type === 'name') {
      h += `<div class="qq">${t('qName')}</div>`;
    } else {
      h += `<div class="qq">${t('qClue')}<small>${esc(clueOf(e) || '')}</small></div>`;
    }
    if (q.opts) {
      h += '<div class="qopts">' + q.opts.map((i, k) => {
        const x = P[i]; let cls = '';
        if (Q.answered) { if (k === q.correctIdx) cls = 'ok'; else if (k === q.chosen) cls = 'no'; }
        return `<button type="button" class="${cls}" data-act="qopt" data-k="${k}" ${Q.answered ? 'disabled' : ''}>${esc(base1(x))}</button>`;
      }).join('') + '</div>';
    }
    if (Q.answered) {
      const r = Q.results[Q.results.length - 1];
      h += `<div class="qfb ${r.ok ? 'ok' : 'no'}"><span>${r.ok ? '✔ ' + t('correct') : '✘ ' + t('wrong') + ' ' + esc(base1(e)) + (r.tapped ? ` (${S.lang === 'ar' ? 'ضغطت على' : 'you tapped'}: ${esc(r.tapped)})` : '')}</span><button class="btn primary" data-act="qnext">${Q.idx + 1 >= n ? t('finish') : t('next')}</button></div>`;
    } else {
      h += `<div class="qrow">${q.type === 'tap' && Q.skips < 3 && Q.spare.length ? `<button class="opt" data-act="qskip">${t('skip')}</button>` : ''}<button class="opt" data-act="qexit">${t('exit')}</button></div>`;
    }
    bar.innerHTML = h;
    requestAnimationFrame(() => document.getElementById('app').style.setProperty('--qh', bar.offsetHeight + 'px'));
  }
  function record(ok, tapped) {
    const q = Q.qs[Q.idx], e = q.e;
    Q.results.push({ i: e.i, id: repOf(e).id, ok, type: q.type, sys: e.sys, reg: e.reg, ms: Date.now() - q.t0, tapped });
    Q.answered = true;
    // spaced repetition feedback
    const s = Store.d.srs, id = repOf(e).id, cur = s[id];
    if (!ok) s[id] = { b: 0, d: dayNo() }; else if (cur) s[id] = { b: Math.min(6, cur.b + 1), d: dayNo() + INTERVALS[Math.min(6, cur.b + 1)] };
    Store.save(); Store.touchDay();
  }
  function onQuizTap(idx) {
    if (!Q || Q.answered || Q.done) return;
    const q = Q.qs[Q.idx]; if (q.type !== 'tap') return;
    if (idx < 0) return;
    const ok = idx === q.e.i;
    if (!ok) { S.hl = new Map([[q.e.i, [1, 0.78, 0.18, 0.7]]]); A.flyToPart(q.e); }
    else { S.hl = new Map([[q.e.i, [0.25, 0.85, 0.5, 0.6]]]); }
    record(ok, ok ? null : base1(P[idx])); A.apply(); renderQuizBar();
  }
  A.acts.qopt = (el) => {
    if (!Q || Q.answered) return; const q = Q.qs[Q.idx]; q.chosen = +el.dataset.k;
    record(q.chosen === q.correctIdx, null); renderQuizBar();
  };
  A.acts.qskip = () => {
    if (!Q || Q.answered || !Q.spare.length) return; Q.skips++;
    Q.qs[Q.idx] = Q.spare.shift(); askQuestion();
  };
  A.acts.qnext = () => { if (Q.idx + 1 >= Q.qs.length) finishQuiz(); else { Q.idx++; askQuestion(); } };
  A.acts.qexit = () => { if (Q.results.length >= 3 && !confirm(S.lang === 'ar' ? 'إنهاء الاختبار الآن؟ سيتم احتساب ما أجبت عنه.' : 'End the quiz now? Answered questions will be scored.')) return; if (Q.results.length === 0) { endQuizUI(); return; } finishQuiz(); };
  function endQuizUI() {
    $('quizBar').hidden = true; document.getElementById('app').classList.remove('quiz'); S.quiz = null;
    if (prevView) { Object.assign(S.layers, prevView.layers); S.region = prevView.region; S.hidden = prevView.hidden; S.iso = prevView.iso; S.explode = prevView.explode; S.moveSet = prevView.move; }
    S.hl = null; S.sel = -1; A.apply(); A.cam.reset(); A.redraw();
  }
  function finishQuiz() {
    Q.done = true; const total = Q.results.length, correct = Q.results.filter((r) => r.ok).length;
    const secs = Math.round((Date.now() - Q.t0) / 1000);
    const area = {}; for (const r of Q.results) { const a = (area[r.reg] = area[r.reg] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const sysA = {}; for (const r of Q.results) { const a = (sysA[r.sys] = sysA[r.sys] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const typeA = {}; for (const r of Q.results) { const a = (typeA[r.type] = typeA[r.type] || { c: 0, n: 0 }); a.n++; if (r.ok) a.c++; }
    const prev = Store.d.hist[Store.d.hist.length - 1];
    const rec = { t: Date.now(), n: total, c: correct, s: pct(correct, total), secs, mode: Q.cfg.mode, sys: Q.cfg.sys, reg: Q.cfg.reg, area, sysA, typeA };
    Store.d.hist.push(rec); if (Store.d.hist.length > 60) Store.d.hist.shift(); Store.save();
    const wrongs = Q.results.filter((r) => !r.ok);
    endQuizUI();
    A.modal(() => resultHtml(rec, prev, wrongs));
  }
  function advice(rec, wrongs) {
    const ar = S.lang === 'ar';
    if (!wrongs.length) return t('perfect');
    const lows = Object.entries(rec.area).filter(([, a]) => a.c < a.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n || b[1].n - a[1].n);
    const worstReg = lows[0] && lows[0][0];
    const types = Object.entries(rec.typeA).filter(([, a]) => a.c < a.n).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
    const tip = { tap: ar ? 'تحديد المكان على المجسم (تدرّب بالدوران والتقريب)' : 'locating structures on the model (rotate and zoom more)', name: ar ? 'ربط الشكل بالاسم' : 'matching shapes to names', clue: ar ? 'الوظيفة والتعصيب والمعلومات' : 'functions, nerves and facts' };
    const parts = [];
    if (worstReg) parts.push(ar ? `أضعف منطقة: <b>${t(worstReg)}</b> (${rec.area[worstReg].c}/${rec.area[worstReg].n}).` : `Weakest area: <b>${t(worstReg)}</b> (${rec.area[worstReg].c}/${rec.area[worstReg].n}).`);
    if (types[0]) parts.push(ar ? `ركّز على: ${tip[types[0][0]]}.` : `Focus on: ${tip[types[0][0]]}.`);
    parts.push(ar ? `راجع الأجزاء الـ ${wrongs.length} التي أخطأت فيها — أضفناها لبطاقات المراجعة وستظهر لك أكثر.` : `Review the ${wrongs.length} parts you missed — they were added to your flashcards and will come back more often.`);
    return parts.join('<br>');
  }
  function resultHtml(rec, prev, wrongs) {
    const g = rec.s >= 90 ? 'g_great' : rec.s >= 70 ? 'g_good' : rec.s >= 50 ? 'g_ok' : 'g_low';
    const col = rec.s >= 70 ? 'good' : rec.s >= 50 ? 'mid' : 'bad';
    const d = prev ? rec.s - prev.s : null;
    const mm = Math.floor(rec.secs / 60), ss = rec.secs % 60;
    let h = `<h2>${t('result')}</h2><div class="score-ring"><div><div class="big">${rec.s}%</div><div>${rec.c} / ${rec.n}</div></div><div><b>${t(g)}</b>` +
      (d !== null ? `<div class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}% ${t('vsPrev')}</div>` : '') + `<div class="lab">${t('timeTaken')}: ${mm}:${String(ss).padStart(2, '0')}</div></div></div>`;
    h += `<div class="bar"><i class="${col}" style="width:${rec.s}%"></i></div>`;
    h += `<h4>${t('byArea')}</h4>` + Object.entries(rec.area).map(([r, a]) => { const p = pct(a.c, a.n); return `<div class="area"><span>${t(r)}</span><div class="bar"><i class="${p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad'}" style="width:${p}%"></i></div><span>${a.c}/${a.n}</span></div>`; }).join('');
    h += `<h4>${t('improve')}</h4><div class="advice">${advice(rec, wrongs)}</div>`;
    if (wrongs.length) {
      h += `<h4>${t('mistakes')}</h4>` + wrongs.map((r) => { const e = P[r.i]; return `<div class="mist" data-act="mistake" data-i="${r.i}"><span>${esc(name1(e))}<small>${esc(name2(e))}</small></span><small>${t(e.reg)}</small></div>`; }).join('');
    }
    h += `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="qagain">${t('retry')}</button><button class="btn" data-act="hub" data-k="progress">${t('progress')}</button></div>`;
    return h;
  }
  A.acts.mistake = (el) => { A.closeModal(); A.select(+el.dataset.i); };
  A.acts.qagain = () => openQuizSetup();

  /* ───────── FLASHCARDS ───────── */
  const CC = { sys: 'all', reg: 'all' };
  let deck = null;
  function buildDeck() {
    const today = dayNo(), srs = Store.d.srs;
    const pool = repList.filter((e) => inScope(e, CC));
    const due = pool.filter((e) => srs[e.id] && srs[e.id].d <= today);
    const fresh = shuffle(pool.filter((e) => !srs[e.id])).slice(0, 10);
    return { due, fresh };
  }
  function openCardsSetup() {
    A.modal(() => {
      const { due, fresh } = buildDeck();
      return `<h2>${t('cardsSetup')}</h2><p class="lead">${t('cardsSub')}</p>${scopeRow(CC, 'ccfg')}` +
        `<div class="stat3"><div><b>${due.length}</b><small>${t('dueNow')}</small></div><div><b>${fresh.length}</b><small>${t('newCards')}</small></div><div><b>${Object.keys(Store.d.srs).length}</b><small>${t('cards')}</small></div></div>` +
        `<button class="btn primary wide" data-act="cstart" ${due.length + fresh.length ? '' : 'disabled'}>${t('start')}</button>` + (due.length + fresh.length ? '' : `<p class="lead">${t('noCards')}</p>`);
    });
  }
  A.acts.ccfg = (el) => { CC[el.dataset.k] = el.dataset.v; openCardsSetup(); };
  A.acts.cstart = () => { const { due, fresh } = buildDeck(); deck = { q: shuffle([...due, ...fresh]), total: due.length + fresh.length, done: 0, back: false, again: 0 }; showCard(); };
  function showCard() { A.modal(cardHtml); }
  function cardHtml() {
    if (!deck.q.length) return `<h2>${t('cardDone')}</h2><div class="card3"><div class="nm">🎉</div><div>${deck.done} ${t('cards')}</div></div><div class="row" style="margin-top:14px"><button class="btn primary" data-act="hub" data-k="cards">${t('cards')}</button></div>`;
    const e = deck.q[0];
    let h = `<h2>${t('cards')}</h2><div class="qtop"><span dir="ltr">${deck.done} / ${deck.total}</span><span>${t(e.reg)} · ${t('kind_' + e.k)}</span></div><div class="qprog"><i style="width:${pct(deck.done, deck.total)}%"></i></div>`;
    h += `<div class="card3"><div class="nm">${esc(base1(e))}</div>`;
    if (!deck.back) h += `<div class="lead">${t('whatIsThis')}</div></div><button class="btn primary wide" style="margin-top:12px" data-act="cflip">${t('showAnswer')}</button>`;
    else {
      h += `<div class="nm2">${esc(S.lang === 'ar' ? e.baseEn : e.baseAr)}</div><div class="bk">`;
      if (e.mu) h += `<p><b>${t('origin')}:</b> ${esc(L([e.mu[0], e.mu[1]]))}</p><p><b>${t('insertion')}:</b> ${esc(L([e.mu[2], e.mu[3]]))}</p><p><b>${t('action')}:</b> ${esc(L([e.mu[4], e.mu[5]]))}</p><p><b>${t('nerve')}:</b> ${esc(L([e.mu[6], e.mu[7]]))}</p>`;
      else { if (e.sum) h += `<p>${esc(L(e.sum))}</p>`; if (e.facts && e.facts[0]) h += `<p>• ${esc(L(e.facts[0]))}</p>`; }
      h += `</div></div><div class="rate"><button class="btn a" data-act="crate" data-r="0">${t('again')}</button><button class="btn g" data-act="crate" data-r="1">${t('good')}</button><button class="btn e" data-act="crate" data-r="2">${t('easy')}</button></div>` +
        `<div class="row" style="margin-top:10px"><button class="opt" data-act="cshow">${t('showIn3d')}</button></div>`;
    }
    return h;
  }
  A.acts.cflip = () => { deck.back = true; showCard(); };
  A.acts.cshow = () => { const e = deck.q[0]; A.closeModal(); A.select(e.i); };
  A.acts.crate = (el) => {
    const r = +el.dataset.r, e = deck.q.shift(), s = Store.d.srs, cur = s[e.id] || { b: 0 };
    if (r === 0) { s[e.id] = { b: 0, d: dayNo() }; if (deck.again < 25) { deck.again++; deck.q.push(e); } else deck.done++; }
    else { const b = Math.min(6, cur.b + (r === 2 ? 2 : 1)); s[e.id] = { b, d: dayNo() + INTERVALS[b] }; deck.done++; Store.d.learned[e.id] = Store.d.learned[e.id] || (b >= 3 ? 1 : 0); if (!Store.d.learned[e.id]) delete Store.d.learned[e.id]; }
    Store.save(); Store.touchDay(); deck.back = false; showCard();
  };

  /* ───────── MOVEMENT FINDER ───────── */
  const GROUP_NAMES = { shoulder: ['Shoulder', 'الكتف'], scap: ['Scapula', 'اللوح'], elbow: ['Elbow', 'المرفق'], forearm: ['Forearm', 'الساعد'], wrist: ['Wrist', 'الرسغ'], finger: ['Hand', 'اليد'], thumb: ['Hand', 'اليد'], hip: ['Hip', 'الورك'], knee: ['Knee', 'الركبة'], ankle: ['Ankle & foot', 'الكاحل والقدم'], foot: ['Ankle & foot', 'الكاحل والقدم'], trunk: ['Trunk', 'الجذع'], neck: ['Neck & jaw', 'الرقبة والفك'], jaw: ['Neck & jaw', 'الرقبة والفك'], breath: ['Breathing', 'التنفس'] };
  function openMoves() {
    A.modal(() => {
      const groups = []; const idx = {};
      for (const m of MOVES) { const g = GROUP_NAMES[m.id.split('_')[0]]; const key = g[0]; if (!(key in idx)) { idx[key] = groups.length; groups.push({ g, list: [] }); } groups[idx[key]].list.push(m); }
      return `<h2>${t('moves')}</h2><p class="lead">${t('movesSub')}</p>` + groups.map((gr) => `<div class="mgroup">${S.lang === 'ar' ? gr.g[1] : gr.g[0]}</div><div class="row">` + gr.list.map((m) => `<button class="opt" data-act="mv" data-id="${m.id}">${esc(S.lang === 'ar' ? m.ar : m.en)}</button>`).join('') + '</div>').join('');
    });
  }
  let moveSaved = null;
  A.startMove = async (id) => {
    const m = MOVES.find((x) => x.id === id); if (!m) return;
    A.closeModal(); S.sel = -1; A.deselect();
    if (!moveSaved) moveSaved = { ...S.layers };
    S.layers.muscle = 'on'; S.layers.bone = 'ghost'; S.layers.vessel = 'off'; S.layers.organ = 'off';
    await A.ensure('muscle'); await A.ensure('bone');
    S.moveSet = new Set(m.m); S.moveId = id; S.region = null; S.iso = -1;
    const first = P.find((e) => e.sys === 'muscle' && m.m.includes(e.grp));
    A.apply(); if (first) A.flyRegion(first.reg);
    const bar = $('moveBar'); bar.hidden = false;
    bar.innerHTML = `<div class="t"><span>${esc(S.lang === 'ar' ? m.ar : m.en)}</span><button class="mini" data-act="moveclear">✕ ${t('clear')}</button></div><div class="pills" style="width:100%">` +
      m.m.map((g) => { const e = P.find((x) => x.sys === 'muscle' && x.grp === g && x.side !== 'l'); return e ? `<span class="pill" data-act="movepick" data-i="${e.i}">${esc(base1(e))}</span>` : ''; }).join('') + '</div>';
  };
  A.clearMove = (silent) => {
    S.moveSet = null; S.moveId = null; $('moveBar').hidden = true;
    if (moveSaved) { Object.assign(S.layers, moveSaved); moveSaved = null; }
    if (!silent) A.apply();
  };
  A.acts.mv = (el) => A.startMove(el.dataset.id);
  A.acts.moveclear = () => A.clearMove();
  A.acts.movepick = (el) => A.select(+el.dataset.i);

  /* ───────── PROGRESS ───────── */
  function learnedStats() {
    const st = Store.d, by = { sys: {}, reg: {} }; let L1 = 0;
    const learnedKeys = new Set(); for (const e of P) if (st.learned[e.id]) learnedKeys.add(repKey(e));
    for (const e of repList) {
      const got = learnedKeys.has(repKey(e)) ? 1 : 0; L1 += got;
      for (const [d, k] of [['sys', e.sys], ['reg', e.reg]]) { const o = (by[d][k] = by[d][k] || { c: 0, n: 0 }); o.n++; o.c += got; }
    }
    return { by, learned: L1, total: repList.length };
  }
  function openProgress() {
    A.modal(() => {
      const st = Store.d, ls = learnedStats(), hist = st.hist, last = hist.slice(-12);
      const avg = hist.length ? Math.round(hist.reduce((a, b) => a + b.s, 0) / hist.length) : 0;
      let h = `<h2>${t('progress')}</h2><div class="stat3"><div><b>🔥 ${Store.streak()}</b><small>${t('streak')}</small></div><div><b>${ls.learned}</b><small>${t('learnedParts')}</small></div><div><b>${hist.length}</b><small>${t('quizzes')}${hist.length ? ' · ' + avg + '%' : ''}</small></div></div>`;
      h += `<h4>${t('learnedParts')} (${ls.learned}/${ls.total})</h4>`;
      for (const s of SYSTEMS) { const o = ls.by.sys[s] || { c: 0, n: 0 }; h += `<div class="area"><span>${t(s)}</span><div class="bar"><i style="width:${pct(o.c, o.n)}%"></i></div><span>${o.c}/${o.n}</span></div>`; }
      h += `<h4>${t('byArea')}</h4>`;
      for (const r of REGIONS) { const o = ls.by.reg[r] || { c: 0, n: 0 }; h += `<div class="area"><span>${t(r)}</span><div class="bar"><i style="width:${pct(o.c, o.n)}%"></i></div><span>${o.c}/${o.n}</span></div>`; }
      h += `<h4>${t('history')}</h4>`;
      if (!hist.length) h += `<p class="lead">${t('noHistory')}</p>`;
      else {
        h += `<div class="hist">` + last.map((x) => `<i title="${x.s}%" style="height:${Math.max(4, x.s)}%;background:var(--${x.s >= 70 ? 'good' : x.s >= 50 ? 'gold' : 'bad'})"></i>`).join('') + '</div>';
        const agg = {}; for (const x of hist) for (const [r, a] of Object.entries(x.area || {})) { const o = (agg[r] = agg[r] || { c: 0, n: 0 }); o.c += a.c; o.n += a.n; }
        const weak = Object.entries(agg).filter(([, a]) => a.n >= 2).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).slice(0, 3);
        if (weak.length) h += `<div class="advice"><b>${t('focusOn')}:</b> ` + weak.map(([r, a]) => `${t(r)} (${pct(a.c, a.n)}%)`).join(' · ') + '</div>';
      }
      h += `<div class="row" style="margin-top:12px"><button class="btn primary" data-act="hub" data-k="quiz">${t('quiz')}</button><button class="btn danger" data-act="resetprog">${t('resetProgress')}</button></div>`;
      return h;
    });
  }
  A.acts.resetprog = () => { if (confirm(t('confirmReset'))) { Store.reset(); const lang = S.lang, th = S.theme; Store.d.lang = lang; Store.d.theme = th; Store.save(); A.renderPanel && S.sel >= 0 && A.renderPanel(); openProgress(); } };

  /* ───────── FAVOURITES & NOTES ───────── */
  function openFavs() {
    A.modal(() => {
      const st = Store.d, ids = new Set([...Object.keys(st.fav), ...Object.keys(st.notes)]);
      const list = P.filter((e) => ids.has(e.id));
      if (!list.length) return `<h2>${t('favs')}</h2><p class="lead">${t('noFavs')}</p>`;
      return `<h2>${t('favs')}</h2>` + list.map((e) => `<div class="mist" data-act="mistake" data-i="${e.i}"><span>${st.fav[e.id] ? '★ ' : ''}${esc(name1(e))}<small>${esc(name2(e))}${st.notes[e.id] ? ' — 📝 ' + esc(st.notes[e.id].slice(0, 60)) : ''}</small></span><small>${t(e.reg)}</small></div>`).join('');
    });
  }

  /* ───────── ABOUT ───────── */
  function openAbout() {
    A.modal(() => `<h2>${t('about')}</h2><p class="lead">${t('appName')} — ${t('tagline')}</p>` +
      `<div class="row">${A.deferredPrompt ? `<button class="btn primary" data-act="doinstall">${t('install')}</button>` : ''}<button class="btn" data-act="offline" id="offBtn">${t('offline')}</button></div><p class="lead">${t('installHelp')}</p>` +
      `<h4>${t('importantNotes')}</h4><div class="pt">${t('limits')}</div><h4>BodyParts3D</h4><p class="pn-sum">${t('credits')}</p>` +
      `<p class="lead" style="font-size:12px">${P.length} parts · v2</p>`);
  }
  A.acts.doinstall = async () => { const p = A.deferredPrompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch (e) { /* ignore */ } A.deferredPrompt = null; A.rerenderModal(); };
  A.acts.offline = async (el) => {
    el.disabled = true; el.textContent = '…';
    try { for (const s of SYSTEMS) { await A.ensure(s); } A.toast(t('offlineDone'), 4000); el.textContent = '✓ ' + t('offlineDone'); } catch (e) { el.textContent = '✕'; el.disabled = false; }
  };
  A.onLang = () => { if (Q && !Q.done && S.quiz) renderQuizBar(); };
  A.quizApi = { startQuiz, get Q() { return Q; }, finishQuiz, clueOf, repList };
  if (window.__anat) window.__anat.study = A.quizApi;
})();
