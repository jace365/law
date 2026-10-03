/* 법과사회 내신 대비 앱 — 서버 없이 동작, 기록은 localStorage('las.v1') */
(function () {
  'use strict';
  var KEY = 'las.v1';
  var store = load();
  function load() {
    var d = { wrong: {}, wrongB: {}, solved: {}, mock: {}, real: [], last: '' };
    try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in s) d[k] = s[k]; } catch (e) {}
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var view = $('#view');
  var QBY = {}; LAS.qs.forEach(function (q) { QBY[q.id] = q; });
  var BBY = {}; LAS.blanks.forEach(function (b) { BBY[b.id] = b; });
  var NUM = ['①', '②', '③', '④', '⑤'];
  function unitName(u) { var x = LAS.units[u - 1]; return x ? x.short : ''; }

  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* 보기 섞기: 문제 id로 고정된 순서(모의고사·오답노트에서 늘 같은 번호) */
  function seeded(id) { var h = 2166136261; for (var i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  function order(q) {
    if (order.c[q.id]) return order.c[q.id];
    var o = [0, 1, 2, 3, 4];
    if (!q.ns) { var r = seeded(q.id); for (var i = 4; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; } }
    return (order.c[q.id] = o);
  }
  order.c = {};
  function correctPos(q) { return order(q).indexOf(q.a - 1); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* 오답노트 담기/해제 */
  function isW(id) { return id.charAt(0) === 'b' ? !!store.wrongB[id] : !!store.wrong[id]; }
  function setW(id, on) { var o = id.charAt(0) === 'b' ? store.wrongB : store.wrong; if (on) o[id] = Date.now(); else delete o[id]; save(); nav(); }
  function wrBtn(id) { var on = isW(id); return '<button class="wr' + (on ? ' on' : '') + '" data-wr="' + id + '">' + (on ? '✔ 오답노트 해제' : '＋ 오답노트 담기') + '</button>'; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-wr]'); if (!b) return;
    var id = b.getAttribute('data-wr'), on = !isW(id); setW(id, on);
    document.querySelectorAll('[data-wr="' + id + '"]').forEach(function (x) { x.outerHTML = wrBtn(id); });
    toast(on ? '오답노트에 담았어요' : '오답노트에서 뺐어요');
  });

  /* ── 내비게이션 ── */
  var TABS = [['home', '🏛', '홈'], ['theory', '📖', '이론'], ['blank', '✏️', '빈칸'], ['quiz', '❓', '문제'], ['mock', '📝', '시험'], ['note', '📕', '오답노트']];
  function nav() {
    var cur = (location.hash.slice(1).split('/')[0]) || 'home'; if (cur === 'real') cur = 'mock';
    var n = Object.keys(store.wrong).length + Object.keys(store.wrongB).length;
    var h = TABS.map(function (t) {
      return '<a href="#' + t[0] + '" class="' + (cur === t[0] ? 'on' : '') + '"><i>' + t[1] + '</i>' + t[2] +
        (t[0] === 'note' && n ? '<span class="badge">' + n + '</span>' : '') + '</a>';
    }).join('');
    $('#tabbar').innerHTML = h; $('#sidenav').innerHTML = h;
  }
  function route() {
    var p = location.hash.slice(1).split('/'), r = p[0] || 'home';
    nav(); window.scrollTo(0, 0); view.onclick = null;
    ({ home: home, theory: theory, blank: blankView, quiz: quizView, mock: mockView, real: realView, note: noteView }[r] || home)(p[1], p[2]);
    view.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  function chips(cur, all, attr) {
    return '<div class="chips">' + (all ? '<button class="chip' + (!cur ? ' on' : '') + '" data-' + attr + '="0">전체</button>' : '') +
      LAS.units.map(function (u) { return '<button class="chip' + (+cur === u.u ? ' on' : '') + '" data-' + attr + '="' + u.u + '">' + u.u + '. ' + u.short + '</button>'; }).join('') + '</div>';
  }

  /* ── 홈 ── */
  function home() {
    var solved = Object.keys(store.solved), ok = solved.filter(function (k) { return store.solved[k]; }).length;
    var best = 0; for (var k in store.mock) best = Math.max(best, store.mock[k].best || 0);
    var b = LAS.blanks[Math.floor(Math.random() * LAS.blanks.length)];
    view.innerHTML =
      '<section class="hero"><div class="stamp">내신<br>대비</div><h1>법과사회,<br><em>판례처럼</em> 정리한다</h1>' +
      '<p>Ⅰ. 개인 생활과 법 · Ⅱ. 국가 생활과 법 — ' + LAS.qs.length + '문항 · 빈칸 ' + LAS.blanks.length + '개 · 모의고사 5회</p></section>' +
      '<div class="stats"><div class="stat"><b>' + solved.length + '</b><span>푼 문제</span></div>' +
      '<div class="stat"><b>' + (solved.length ? Math.round(ok / solved.length * 100) : 0) + '%</b><span>정답률</span></div>' +
      '<div class="stat"><b>' + (Object.keys(store.wrong).length + Object.keys(store.wrongB).length) + '</b><span>오답노트</span></div>' +
      '<div class="stat"><b>' + (store.real.length ? store.real[store.real.length - 1].score : '-') + '</b><span>최근 실전시험</span></div></div>' +
      '<div class="card"><div class="qhead"><span class="no">오늘의 한 줄</span><span>' + unitName(b.u) + '</span><span class="sp"></span>' + wrBtn(b.id) + '</div>' +
      '<div class="bl">' + blankHTML(b.s) + '</div><div class="prog">밑줄을 눌러 정답 확인</div></div>' +
      '<div class="grid2"><a class="go" href="#theory/1"><b>📖 이론 정리</b><span>단원별 핵심 표, 핵심어 가리기</span></a>' +
      '<a class="go" href="#blank"><b>✏️ 빈칸 암기</b><span>학습지 빈칸 그대로</span></a>' +
      '<a class="go" href="#quiz"><b>❓ 단원별 문제</b><span>바로 채점 + 해설</span></a>' +
      '<a class="go red" href="#real/start"><b>🎯 실전시험</b><span>매번 랜덤 20문항 · 회차별 점수</span></a>' +
      '<a class="go" href="#mock"><b>📝 모의고사 5회</b><span>고정 5회분 반복 연습</span></a></div>' +
      installCard();
    bindBlanks(view); bindInstall();
  }

  /* ── 앱 설치(PWA) ── */
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; if (/^#?(home)?$/.test(location.hash)) home(); });
  function standalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone; }
  function installCard() {
    if (standalone()) return '';
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return '<div class="card install"><b>📲 휴대폰에 앱으로 설치하기</b><p>' +
      (deferred ? '아래 버튼을 누르면 홈 화면에 앱 아이콘이 생기고, 인터넷 없이도 열립니다.' :
        ios ? '사파리 아래쪽 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>를 누르세요.' :
        '크롬 메뉴(⋮) → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르세요. (https 주소에서 열어야 설치됩니다)') + '</p>' +
      (deferred ? '<button class="btn pri" id="inst">앱 설치</button>' : '') + '</div>';
  }
  function bindInstall() {
    var b = $('#inst'); if (b) b.onclick = function () { deferred.prompt(); deferred.userChoice.then(function (c) { if (c.outcome === 'accepted') toast('설치했어요! 홈 화면을 확인하세요'); deferred = null; home(); }); };
  }

  /* ── 이론 ── */
  function theory(u) {
    u = +u || 1;
    var hide = theory.hide;
    view.innerHTML = '<h2 class="pt">이론 정리</h2><p class="lead">' + LAS.units[u - 1].big + ' · ' + LAS.units[u - 1].name + '</p>' +
      chips(u, false, 'tu') +
      '<div class="row" style="margin:0 0 12px"><button class="btn sm' + (hide ? ' pri' : '') + '" id="hidek">' + (hide ? '핵심어 보이기' : '핵심어 가리기') + '</button>' +
      '<button class="btn sm" id="openall">모두 펼치기</button><a class="btn sm" href="#blank/' + u + '">이 단원 빈칸</a><a class="btn sm" href="#quiz/' + u + '">이 단원 문제</a></div>' +
      '<div class="th' + (hide ? ' hide' : '') + '">' + (LAS.theory[u] || []).map(function (s, i) {
        return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(s.h) + '</summary><div class="body">' + s.html + '</div></details>';
      }).join('') + '</div>';
    view.querySelectorAll('[data-tu]').forEach(function (b) { b.onclick = function () { location.hash = 'theory/' + b.dataset.tu; }; });
    $('#hidek').onclick = function () { theory.hide = !theory.hide; theory(u); };
    $('#openall').onclick = function () { view.querySelectorAll('details').forEach(function (d) { d.open = true; }); };
    view.querySelector('.th').addEventListener('click', function (e) { if (theory.hide && e.target.tagName === 'B') e.target.classList.toggle('rv'); });
  }

  /* ── 빈칸 ── */
  function blankHTML(s) { return esc(s).replace(/\{([^}]+)\}/g, '<span class="bk">$1</span>'); }
  function bindBlanks(root) { root.querySelectorAll('.bk').forEach(function (k) { k.onclick = function () { k.classList.toggle('rv'); }; }); }
  function blankView(u, mode) {
    u = +u || 0;
    var pool = mode === 'note' ? LAS.blanks.filter(function (b) { return store.wrongB[b.id] && (!u || b.u === u); })
      : LAS.blanks.filter(function (b) { return !u || b.u === u; });
    var st = { i: 0, list: pool };
    function draw() {
      if (!st.list.length) { view.innerHTML = head() + '<div class="empty"><b>표시할 빈칸이 없어요</b>' + (mode === 'note' ? '빈칸 오답노트가 비어 있습니다.' : '') + '</div>'; bindHead(); return; }
      var b = st.list[st.i];
      view.innerHTML = head() +
        '<div class="prog">' + (st.i + 1) + ' / ' + st.list.length + '</div><div class="pbar"><i style="width:' + ((st.i + 1) / st.list.length * 100) + '%"></i></div>' +
        '<div class="card"><div class="qhead"><span class="no">' + b.id.toUpperCase() + '</span><span>' + unitName(b.u) + '</span><span class="sp"></span>' + wrBtn(b.id) + '</div>' +
        '<div class="bl">' + blankHTML(b.s) + '</div>' +
        '<div class="row"><button class="btn sm" id="rvall">정답 모두 보기</button></div>' +
        '<div class="row"><button class="btn" id="prev"' + (st.i ? '' : ' disabled') + '>← 이전</button>' +
        '<button class="btn red" id="dk">몰라요 · 오답노트</button><button class="btn pri" id="nx">알아요 →</button></div></div>';
      bindHead(); bindBlanks(view);
      $('#rvall').onclick = function () { view.querySelectorAll('.bk').forEach(function (k) { k.classList.add('rv'); }); };
      $('#prev').onclick = function () { st.i--; draw(); };
      $('#dk').onclick = function () { view.querySelectorAll('.bk').forEach(function (k) { k.classList.add('rv'); }); if (!isW(b.id)) { setW(b.id, true); toast('오답노트에 담았어요'); } view.querySelector('[data-wr]').outerHTML = wrBtn(b.id); $('#dk').disabled = true; };
      $('#nx').onclick = function () { if (st.i < st.list.length - 1) { st.i++; draw(); } else { toast('끝까지 다 봤어요! 처음부터 다시 시작합니다'); st.i = 0; draw(); } };
    }
    function head() {
      return '<h2 class="pt">' + (mode === 'note' ? '빈칸 오답 다시 외우기' : '빈칸 암기') + '</h2><p class="lead">밑줄을 눌러 하나씩 확인하세요. 모르면 “몰라요”로 오답노트에 담깁니다.</p>' +
        chips(u, true, 'bu') + '<div class="row" style="margin:0 0 10px"><button class="btn sm" id="shuf">🔀 섞기</button></div>';
    }
    function bindHead() {
      view.querySelectorAll('[data-bu]').forEach(function (x) { x.onclick = function () { location.hash = 'blank/' + x.dataset.bu + (mode ? '/' + mode : ''); }; });
      var s = $('#shuf'); if (s) s.onclick = function () { st.list = shuffle(st.list); st.i = 0; draw(); };
    }
    draw();
  }

  /* ── 문제 카드(공통) ── */
  function qCard(q, no, opt) {
    var o = order(q);
    return '<div class="card" id="c-' + q.id + '"><div class="qhead"><span class="no">' + no + '</span><span>' + unitName(q.u) + '</span>' +
      (q.m ? '<span>· 모의 ' + q.m + '회</span>' : '') + '<span class="sp"></span>' + (opt.noWr ? '' : wrBtn(q.id)) + '</div>' +
      '<p class="qtext">' + esc(q.q) + '</p>' + (q.bx ? '<div class="bx">' + esc(q.bx) + '</div>' : '') +
      '<div class="choices">' + o.map(function (k, i) {
        return '<button class="ch" data-q="' + q.id + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span>' + esc(q.c[k]) + '</span></button>';
      }).join('') + '</div><div class="expw"></div></div>';
  }
  function showExp(card, q, picked) {
    var cp = correctPos(q), ok = picked === cp;
    card.querySelectorAll('.ch').forEach(function (b, i) { b.disabled = true; b.classList.remove('sel'); if (i === cp) b.classList.add('ok'); else if (i === picked) b.classList.add('no'); });
    card.querySelector('.expw').innerHTML = '<div class="exp"><span class="v ' + (ok ? 'ok' : 'no') + '">' + (picked == null ? '정답 ' : ok ? '정답! ' : '오답 · 정답은 ') + NUM[cp] + '</span><br>' + esc(q.e) + '</div>';
    return ok;
  }

  /* ── 단원별 문제 ── */
  function quizView(u, mode) {
    u = +u || 0;
    var pool = LAS.qs.filter(function (q) { return (!u || q.u === u) && (mode !== 'note' || store.wrong[q.id]); });
    var st = { i: 0, list: pool, done: {} };
    function head() {
      return '<h2 class="pt">' + (mode === 'note' ? '오답 다시 풀기' : '단원별 문제') + '</h2><p class="lead">보기를 누르면 바로 채점하고 해설을 보여 줍니다. 틀린 문제는 자동으로 오답노트에 담겨요.</p>' +
        chips(u, true, 'qu') + '<div class="row" style="margin:0 0 10px"><button class="btn sm" id="shuf">🔀 무작위 순서</button></div>';
    }
    function draw() {
      if (!st.list.length) { view.innerHTML = head() + '<div class="empty"><b>' + (mode === 'note' ? '다시 풀 오답이 없어요' : '문제가 없어요') + '</b>' + (mode === 'note' ? '오답노트가 깨끗합니다 👏' : '') + '</div>'; bindHead(); return; }
      var q = st.list[st.i];
      view.innerHTML = head() + '<div class="prog">' + (st.i + 1) + ' / ' + st.list.length + '</div><div class="pbar"><i style="width:' + ((st.i + 1) / st.list.length * 100) + '%"></i></div>' +
        qCard(q, q.id.toUpperCase(), {}) +
        '<div class="row"><button class="btn" id="prev"' + (st.i ? '' : ' disabled') + '>← 이전</button><button class="btn pri" id="nx">다음 →</button></div>';
      bindHead();
      var card = $('#c-' + q.id);
      if (st.done[q.id] != null) showExp(card, q, st.done[q.id]);
      card.querySelectorAll('.ch').forEach(function (b) {
        b.onclick = function () {
          var i = +b.dataset.i; st.done[q.id] = i;
          var ok = showExp(card, q, i);
          store.solved[q.id] = ok; save();
          if (!ok && !store.wrong[q.id]) { setW(q.id, true); card.querySelector('[data-wr]').outerHTML = wrBtn(q.id); toast('틀린 문제를 오답노트에 담았어요'); }
          if (ok && mode === 'note') card.querySelector('.expw').insertAdjacentHTML('beforeend', '<div class="row"><span class="prog">맞혔어요! 이해했다면 오답노트에서 빼세요 →</span>' + wrBtn(q.id) + '</div>');
        };
      });
      $('#prev').onclick = function () { st.i--; draw(); };
      $('#nx').onclick = function () { if (st.i < st.list.length - 1) { st.i++; draw(); } else toast('마지막 문제입니다'); };
    }
    function bindHead() {
      view.querySelectorAll('[data-qu]').forEach(function (x) { x.onclick = function () { location.hash = 'quiz/' + x.dataset.qu + (mode ? '/' + mode : ''); }; });
      var s = $('#shuf'); if (s) s.onclick = function () { st.list = shuffle(st.list); st.i = 0; st.done = {}; draw(); };
    }
    draw();
  }

  /* ── 시험(모의고사·실전시험 공통 엔진) ── */
  function mockQs(n) { var a = []; for (var u = 1; u <= 5; u++) LAS.qs.forEach(function (q) { if (q.u === u && q.m === n) a.push(q); }); return a; }
  /* 실전시험: 매번 단원별 4문항씩 무작위 → 20문항, 단원 순서대로 배치 */
  function realQs() { var a = []; for (var u = 1; u <= 5; u++) a = a.concat(shuffle(LAS.qs.filter(function (q) { return q.u === u; })).slice(0, 4)); return a; }
  function fmtSec(s) { return Math.floor(s / 60) + '분 ' + ('0' + s % 60).slice(-2) + '초'; }
  function fmtDate(t) { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function level(sc) {
    return sc >= 90 ? ['최상', '1등급권 실력'] : sc >= 80 ? ['상', '2등급권 실력'] : sc >= 70 ? ['중상', '조금만 더!'] : sc >= 60 ? ['중', '약점 단원 복습 필요'] : ['기초', '이론·빈칸부터 다시'];
  }
  /* opt: {title, list, back, review(ans), onDone(result) } */
  function runExam(opt) {
    var list = opt.list, ans = opt.review ? opt.review.ans : {}, t0 = Date.now(), done = !!opt.review;
    function omr() {
      return '<div class="omr">' + list.map(function (q, i) {
        var c = ''; if (done) c = ans[q.id] === correctPos(q) ? 'ok' : 'no'; else if (ans[q.id] != null) c = 'd';
        return '<a href="#" data-go="' + q.id + '" class="' + c + '">' + (i + 1) + '</a>';
      }).join('') + '</div>';
    }
    view.innerHTML = '<div class="examhead"><b class="et">' + opt.title + '</b><span class="prog" id="tm">' + (done ? '' : '00:00') + '</span><span style="flex:1"></span>' +
      (done ? '<a class="btn sm" href="' + opt.back + '">목록</a>' : '<button class="btn pri sm" id="sub">제출·채점</button>') + '</div>' +
      '<div id="omrw">' + omr() + '</div><div id="res"></div>' + list.map(function (q, i) { return qCard(q, (i + 1) + '.', { noWr: true }); }).join('') +
      '<div class="row">' + (done ? '' : '<button class="btn pri" id="sub2">제출·채점</button>') + '<a class="btn" href="' + opt.back + '">목록으로</a></div>';
    if (!done) {
      var tick = setInterval(function () { var el = $('#tm'); if (!el || done) return clearInterval(tick); var s = Math.floor((Date.now() - t0) / 1000); el.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); }, 1000);
    }
    view.onclick = function (e) {
      var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); var c = $('#c-' + g.dataset.go); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - 130, behavior: 'smooth' }); return; }
      var b = e.target.closest('.ch'); if (!b || done) return;
      var id = b.dataset.q; ans[id] = +b.dataset.i;
      $('#c-' + id).querySelectorAll('.ch').forEach(function (x) { x.classList.toggle('sel', x === b); });
      $('#omrw').innerHTML = omr();
    };
    function grade(record) {
      var right = 0, byU = {}, added = 0;
      list.forEach(function (q) {
        var card = $('#c-' + q.id), ok = showExp(card, q, ans[q.id] == null ? null : ans[q.id]);
        byU[q.u] = byU[q.u] || [0, 0]; byU[q.u][1]++;
        if (ok) { right++; byU[q.u][0]++; } else if (record && !store.wrong[q.id]) { store.wrong[q.id] = Date.now(); added++; }
        if (record) store.solved[q.id] = ok;
        card.querySelector('.qhead').insertAdjacentHTML('beforeend', wrBtn(q.id));
      });
      return { right: right, byU: byU, added: added, score: Math.round(right / list.length * 100) };
    }
    function resultCard(r, sec, extra) {
      var lv = level(r.score);
      return '<div class="card"><div class="scorerow"><div class="score">' + r.score + '<small> / 100점</small></div><div class="lv lv' + lv[0] + '"><b>' + lv[0] + '</b><span>' + lv[1] + '</span></div></div>' +
        '<p class="prog">' + r.right + ' / ' + list.length + '문항 정답' + (sec != null ? ' · 소요 ' + fmtSec(sec) : '') + (r.added ? ' · 틀린 ' + r.added + '문항을 오답노트에 담았어요' : '') + '</p>' +
        Object.keys(r.byU).map(function (u) { var v = r.byU[u]; return '<div class="ubar"><span>' + u + '. ' + unitName(+u) + '</span><span class="b"><i style="width:' + v[0] / v[1] * 100 + '%"></i></span><span>' + v[0] + '/' + v[1] + '</span></div>'; }).join('') +
        (extra || '') + '</div>';
    }
    if (done) { var rr = grade(false); $('#res').innerHTML = resultCard(rr, opt.review.sec, ''); return; }
    function submit() {
      var miss = list.length - Object.keys(ans).length;
      if (miss && !confirm('안 푼 문제가 ' + miss + '개 있어요. 그래도 제출할까요?')) return;
      done = true;
      var r = grade(true), sec = Math.floor((Date.now() - t0) / 1000);
      var extra = opt.onDone(r, sec, ans) || '';
      save(); nav();
      $('#res').innerHTML = resultCard(r, sec, extra);
      $('#omrw').innerHTML = omr();
      $('#sub').disabled = $('#sub2').disabled = true;
      var ag = $('#again'); if (ag) ag.onclick = function () { opt.again(); window.scrollTo(0, 0); };
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast(r.score + '점! 수고했어요');
    }
    $('#sub').onclick = submit; $('#sub2').onclick = submit;
  }

  /* 시험 탭 첫 화면: 실전시험 + 모의고사 */
  function mockView(n) {
    n = +n || 0;
    if (n) {
      runExam({ title: '모의고사 ' + n + '회', list: mockQs(n), back: '#mock',
        again: function () { mockView(n); },
        onDone: function (r) {
          var p = store.mock[n] || { best: 0 };
          store.mock[n] = { best: Math.max(p.best || 0, r.score), last: r.score, at: Date.now(), cnt: (p.cnt || 0) + 1 };
          return '<div class="row"><a class="btn pri" href="#note">오답노트 보기</a><button class="btn" id="again">다시 풀기</button></div>';
        } });
      return;
    }
    var R = store.real, last = R[R.length - 1], best = R.reduce(function (m, x) { return Math.max(m, x.score); }, 0);
    view.innerHTML = '<h2 class="pt">시험</h2><p class="lead">실전시험은 매번 새로 뽑은 20문항으로 지금 실력을 재고, 모의고사는 고정된 5회분으로 반복 연습합니다.</p>' +
      '<div class="realcard"><div><span class="tag">실전시험</span><h3>매번 랜덤 20문항</h3><p>' + LAS.qs.length + '문항 중 단원별 4문항씩 무작위 · 문항당 5점</p>' +
      '<p class="mini">' + (R.length ? '응시 ' + R.length + '회 · 최근 ' + last.score + '점 · 최고 ' + best + '점' : '아직 응시 기록이 없어요') + '</p></div>' +
      '<div class="rbtns"><a class="btn pri" href="#real/start">시험 시작</a><a class="btn inv" href="#real">회차별 점수</a></div></div>' +
      '<h3 class="sub">모의고사 5회</h3><div class="mocks">' + [1, 2, 3, 4, 5].map(function (i) {
        var r = store.mock[i];
        return '<a class="mk" href="#mock/' + i + '"><b>' + i + '회</b><span>' + (r ? '최고 ' + r.best + '점 · 최근 ' + r.last + '점' : '아직 응시 전') + '</span></a>';
      }).join('') + '</div>';
  }

  /* ── 실전시험 ── #real(기록) / #real/start / #real/review/회차 */
  function realView(a, b) {
    if (a === 'start') {
      var no = (store.real.length ? store.real[store.real.length - 1].no : 0) + 1;
      runExam({ title: '실전시험 ' + no + '회차', list: realQs(), back: '#real',
        again: function () { location.hash = 'real/start'; realView('start'); },
        onDone: function (r, sec, ans) {
          var prev = store.real[store.real.length - 1];
          store.real.push({ no: no, at: Date.now(), score: r.score, right: r.right, n: 20, sec: sec, byU: r.byU,
            ids: Array.prototype.map.call(view.querySelectorAll('.card[id^="c-"]'), function (c) { return c.id.slice(2); }), ans: ans });
          var diff = prev ? r.score - prev.score : null;
          return '<p class="prog">' + no + '회차 기록 저장' + (diff != null ? ' · 지난 회차보다 <b class="' + (diff >= 0 ? 'up' : 'down') + '">' + (diff >= 0 ? '+' : '') + diff + '점</b>' : '') + '</p>' +
            '<div class="row"><a class="btn pri" href="#real">회차별 점수 보기</a><button class="btn" id="again">새 실전시험</button><a class="btn" href="#note">오답노트</a></div>';
        } });
      return;
    }
    if (a === 'review') {
      var rec = store.real.filter(function (x) { return x.no === +b; })[0];
      if (!rec) { location.hash = 'real'; return; }
      runExam({ title: '실전시험 ' + rec.no + '회차 다시 보기', list: rec.ids.map(function (id) { return QBY[id]; }).filter(Boolean), back: '#real', review: { ans: rec.ans || {}, sec: rec.sec } });
      return;
    }
    var R = store.real;
    if (!R.length) {
      view.innerHTML = '<h2 class="pt">실전시험 기록</h2><div class="empty"><b>아직 기록이 없어요</b>첫 실전시험으로 지금 실력을 재 보세요.<div class="row" style="justify-content:center"><a class="btn pri" href="#real/start">실전시험 시작</a></div></div>';
      return;
    }
    var sum = 0, best = 0, tot = {}; R.forEach(function (x) { sum += x.score; best = Math.max(best, x.score); for (var u in x.byU) { tot[u] = tot[u] || [0, 0]; tot[u][0] += x.byU[u][0]; tot[u][1] += x.byU[u][1]; } });
    var recent = R.slice(-5), ravg = Math.round(recent.reduce(function (s, x) { return s + x.score; }, 0) / recent.length);
    var lv = level(ravg), weak = Object.keys(tot).sort(function (x, y) { return tot[x][0] / tot[x][1] - tot[y][0] / tot[y][1]; })[0];
    view.innerHTML = '<h2 class="pt">실전시험 회차별 점수</h2><p class="lead">수준은 최근 5회 평균으로 판단합니다(학교 등급과 다를 수 있는 참고용).</p>' +
      '<div class="stats"><div class="stat"><b>' + R.length + '</b><span>응시 횟수</span></div><div class="stat"><b>' + Math.round(sum / R.length) + '</b><span>전체 평균</span></div>' +
      '<div class="stat"><b>' + best + '</b><span>최고 점수</span></div><div class="stat"><b>' + ravg + '</b><span>최근 5회 평균</span></div></div>' +
      '<div class="card"><div class="scorerow"><div><div class="prog">현재 수준</div><div class="lv lv' + lv[0] + '"><b>' + lv[0] + '</b><span>' + lv[1] + '</span></div></div>' +
      '<div class="weak">약점 단원<br><b>' + weak + '. ' + unitName(+weak) + '</b> ' + Math.round(tot[weak][0] / tot[weak][1] * 100) + '%<br><a class="btn sm" href="#quiz/' + weak + '">이 단원 문제 풀기</a></div></div>' +
      chart(R.slice(-15)) +
      Object.keys(tot).map(function (u) { var v = tot[u]; return '<div class="ubar"><span>' + u + '. ' + unitName(+u) + '</span><span class="b"><i style="width:' + v[0] / v[1] * 100 + '%"></i></span><span>' + Math.round(v[0] / v[1] * 100) + '%</span></div>'; }).join('') + '</div>' +
      '<div class="row" style="margin:0 0 10px"><a class="btn pri" href="#real/start">새 실전시험</a><button class="btn red sm" id="delall">기록 전체 삭제</button></div>' +
      '<div class="card tblw"><table class="rt"><tr><th>회차</th><th>날짜</th><th>점수</th><th>시간</th><th></th></tr>' +
      R.slice().reverse().map(function (x) {
        return '<tr><td><b>' + x.no + '회</b></td><td>' + fmtDate(x.at) + '</td><td><b class="sc">' + x.score + '</b></td><td>' + fmtSec(x.sec) + '</td>' +
          '<td class="act"><a class="btn sm" href="#real/review/' + x.no + '">보기</a><button class="btn sm red" data-del="' + x.no + '" title="삭제" aria-label="' + x.no + '회차 삭제">✕</button></td></tr>';
      }).join('') + '</table></div>';
    view.querySelectorAll('[data-del]').forEach(function (d) {
      d.onclick = function () { if (!confirm(d.dataset.del + '회차 기록을 삭제할까요?')) return; store.real = store.real.filter(function (x) { return x.no !== +d.dataset.del; }); save(); realView(); };
    });
    $('#delall').onclick = function () { if (!confirm('실전시험 기록을 모두 삭제할까요?')) return; store.real = []; save(); realView(); };
  }
  function chart(R) {
    if (R.length < 2) return '<p class="prog">2회 이상 응시하면 점수 추이 그래프가 보여요.</p>';
    var W = 320, H = 130, px = function (i) { return 24 + i * (W - 40) / (R.length - 1); }, py = function (s) { return 10 + (100 - s) * (H - 30) / 100; };
    var pts = R.map(function (x, i) { return px(i) + ',' + py(x.score); }).join(' ');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="점수 추이">' +
      [0, 50, 100].map(function (s) { return '<line x1="20" x2="' + (W - 10) + '" y1="' + py(s) + '" y2="' + py(s) + '" class="gl"/><text x="2" y="' + (py(s) + 4) + '">' + s + '</text>'; }).join('') +
      '<polyline points="' + pts + '" class="ln"/>' +
      R.map(function (x, i) { return '<circle cx="' + px(i) + '" cy="' + py(x.score) + '" r="4"/><text x="' + px(i) + '" y="' + (H - 4) + '" text-anchor="middle">' + x.no + '</text>'; }).join('') + '</svg>';
  }

  /* ── 오답노트 ── */
  function noteView(tab, u) {
    tab = tab === 'b' ? 'b' : 'q'; u = +u || 0;
    var qs = LAS.qs.filter(function (q) { return store.wrong[q.id] && (!u || q.u === u); });
    var bs = LAS.blanks.filter(function (b) { return store.wrongB[b.id] && (!u || b.u === u); });
    var items = tab === 'q' ? qs : bs;
    view.innerHTML = '<h2 class="pt">오답노트</h2><p class="lead">틀린 문제는 자동으로 담기고, 어디서든 “＋ 오답노트”로 직접 담거나 “✔ 오답노트”를 눌러 뺄 수 있어요.</p>' +
      '<div class="chips"><button class="chip' + (tab === 'q' ? ' on' : '') + '" data-tab="q">문제 ' + Object.keys(store.wrong).length + '</button>' +
      '<button class="chip' + (tab === 'b' ? ' on' : '') + '" data-tab="b">빈칸 ' + Object.keys(store.wrongB).length + '</button></div>' +
      chips(u, true, 'nu') +
      '<div class="row" style="margin:0 0 12px">' + (tab === 'q' ? '<a class="btn pri" href="#quiz/' + u + '/note">오답만 다시 풀기</a>' : '<a class="btn pri" href="#blank/' + u + '/note">빈칸 다시 외우기</a>') +
      '<button class="btn red sm" id="clr">' + (u ? '이 단원 ' : '') + '전체 해제</button></div>' +
      (items.length ? items.map(function (x) {
        if (tab === 'b') return '<div class="card nitem"><div class="t"><small>' + unitName(x.u) + '</small><div class="bl" style="font-size:17px">' + blankHTML(x.s) + '</div></div>' + wrBtn(x.id) + '</div>';
        return '<div class="card"><div class="nitem"><div class="t" data-open="' + x.id + '"><small>' + x.id.toUpperCase() + ' · ' + unitName(x.u) + (x.m ? ' · 모의 ' + x.m + '회' : '') + '</small><div><b>' + esc(x.q) + '</b></div><small>▼ 눌러서 정답·해설 보기</small></div>' + wrBtn(x.id) + '</div><div class="op" hidden></div></div>';
      }).join('') : '<div class="empty"><b>비어 있어요</b>' + (tab === 'q' ? '문제를 풀다 틀리면 자동으로 여기에 모여요.' : '빈칸에서 “몰라요”를 누르면 여기에 모여요.') + '</div>');
    bindBlanks(view);
    view.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { location.hash = 'note/' + b.dataset.tab + '/' + u; }; });
    view.querySelectorAll('[data-nu]').forEach(function (b) { b.onclick = function () { location.hash = 'note/' + tab + '/' + b.dataset.nu; }; });
    view.querySelectorAll('[data-open]').forEach(function (t) {
      t.onclick = function () {
        var q = QBY[t.dataset.open], op = t.closest('.card').querySelector('.op');
        if (!op.hidden) { op.hidden = true; return; }
        var o = order(q);
        op.innerHTML = (q.bx ? '<div class="bx" style="margin-top:10px">' + esc(q.bx) + '</div>' : '') +
          '<div class="choices" style="margin-top:8px">' + o.map(function (k, i) { return '<div class="ch' + (k === q.a - 1 ? ' ok' : '') + '"><span class="n">' + (i + 1) + '</span><span>' + esc(q.c[k]) + '</span></div>'; }).join('') + '</div>' +
          '<div class="exp">' + esc(q.e) + '</div>';
        op.hidden = false;
      };
    });
    $('#clr').onclick = function () {
      if (!items.length || !confirm('표시된 ' + items.length + '개를 오답노트에서 모두 뺄까요?')) return;
      items.forEach(function (x) { if (tab === 'b') delete store.wrongB[x.id]; else delete store.wrong[x.id]; });
      save(); noteView(tab, u); nav(); toast('오답노트를 비웠어요');
    };
  }

  /* 오답노트 목록에서 해제하면 목록에서도 빠지도록 다시 그리기 */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-wr]') && location.hash.indexOf('#note') === 0) setTimeout(function () { var p = location.hash.slice(1).split('/'); noteView(p[1], p[2]); }, 250);
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
  route();
})();
