/* WARSZTAT — main.js (bez zależności). Treść działa bez tego pliku; tu tylko ruch i stany. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px)');
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- nagłówek: niski pasek po przewinięciu ---------- */
  const header = $('.site-header');
  let scrolled = false;
  function onScrollHeader() {
    const s = scrollY > 24;
    if (s !== scrolled) { scrolled = s; header.classList.toggle('is-scrolled', s); }
  }
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- menu mobilne ---------- */
  const toggle = $('.menu-toggle'), panel = $('#menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  addEventListener('click', e => { if (panel.classList.contains('is-open') && !e.target.closest('.site-nav')) setMenu(false); });

  /* ---------- wejścia (jednorazowe) ---------- */
  const reveals = $$('.reveal');
  const show = el => el.classList.add('is-in');
  if ('IntersectionObserver' in window && !reduced.matches) {
    let pending = reveals.slice();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting || en.boundingClientRect.top < 0) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    pending.forEach(el => io.observe(el));
    $$('.hero .reveal').forEach(show);
    // zabezpieczenie: elementy przeskoczone jednym skokiem (kotwica, szybki scroll) też mają się pokazać
    let rr = 0;
    addEventListener('scroll', () => { if (rr) return; rr = requestAnimationFrame(() => { rr = 0; pending = pending.filter(el => { if (el.classList.contains('is-in')) return false; if (el.getBoundingClientRect().top < innerHeight * 0.92) { show(el); io.unobserve(el); return false; } return true; }); }); }, { passive: true });
  } else {
    reveals.forEach(show);
  }

  /* ---------- skaner ---------- */
  const scanner = $('#scanner');
  const stage = $('.scanner__stage', scanner);
  const hotspots = $$('.hotspot', scanner);
  const hpanel = $('#hotspot-panel');
  const tabs = $$('.scanner-tabs .chip');
  const REST = { x: 0.595, y: 0.63 };
  let W = 0, H = 0, cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, raf = 0, locked = false, factor = 0.22, pointerIn = false;

  function measure() {
    const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
    if (!cur.x) { cur.x = tgt.x = REST.x * W; cur.y = tgt.y = REST.y * H; paint(); }
  }
  function paint() {
    scanner.style.setProperty('--x', cur.x.toFixed(1) + 'px');
    scanner.style.setProperty('--y', cur.y.toFixed(1) + 'px');
  }
  function tick() {
    const dx = tgt.x - cur.x, dy = tgt.y - cur.y;
    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) { cur.x = tgt.x; cur.y = tgt.y; paint(); raf = 0; return; }
    cur.x += dx * factor; cur.y += dy * factor; paint();
    raf = requestAnimationFrame(tick);
  }
  function moveTo(x, y, f) {
    tgt.x = clamp(x, 0, W); tgt.y = clamp(y, 0, H); factor = f;
    if (reduced.matches) { cur.x = tgt.x; cur.y = tgt.y; paint(); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function toRest() { moveTo(REST.x * W, REST.y * H, 0.12); }

  hotspots.forEach(b => { b.style.setProperty('--hx', b.dataset.x + '%'); b.style.setProperty('--hy', b.dataset.y + '%'); });

  if (hoverable.matches) {
    let px = 0, py = 0, parRaf = 0;
    scanner.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      pointerIn = true;
      if (!locked) moveTo(x, y, 0.22);
      if (!reduced.matches && desktop.matches) {
        px = ((x / W) - 0.5) * 10; py = ((y / H) - 0.5) * 8; // maks. 4–5 px
        if (!parRaf) parRaf = requestAnimationFrame(() => {
          parRaf = 0;
          scanner.style.setProperty('--px', px.toFixed(2) + 'px');
          scanner.style.setProperty('--py', py.toFixed(2) + 'px');
        });
      }
    });
    scanner.addEventListener('pointerleave', () => {
      pointerIn = false;
      if (!locked) toRest();
      scanner.style.setProperty('--px', '0px'); scanner.style.setProperty('--py', '0px');
    });
  }

  let activeBtn = null;
  function openHotspot(btn) {
    activeBtn = btn; locked = true; scanner.dataset.locked = 'true';
    hotspots.forEach(b => b.setAttribute('aria-expanded', String(b === btn)));
    tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tab === btn.dataset.service)));
    $('[data-role="num"]', hpanel).textContent = btn.dataset.num + ' / ' + btn.dataset.title.toUpperCase();
    $('[data-role="text"]', hpanel).textContent = btn.dataset.text;
    $('[data-ask]', hpanel).dataset.service = btn.dataset.service;
    hpanel.hidden = false;
    requestAnimationFrame(() => hpanel.classList.add('is-open'));
    moveTo(parseFloat(btn.dataset.x) / 100 * W, parseFloat(btn.dataset.y) / 100 * H, 0.16);
  }
  function closeHotspot(focusBack) {
    locked = false; scanner.dataset.locked = 'false';
    hotspots.forEach(b => b.setAttribute('aria-expanded', 'false'));
    tabs.forEach(t => t.setAttribute('aria-pressed', 'false'));
    hpanel.classList.remove('is-open');
    const done = () => { if (!locked) hpanel.hidden = true; };
    reduced.matches ? done() : setTimeout(done, 240);
    if (!pointerIn) toRest();
    if (focusBack && activeBtn) activeBtn.focus();
    activeBtn = null;
  }
  hotspots.forEach(b => b.addEventListener('click', () => (activeBtn === b ? closeHotspot(false) : openHotspot(b))));
  tabs.forEach(t => t.addEventListener('click', () => {
    const b = hotspots.find(h => h.dataset.service === t.dataset.tab);
    activeBtn === b ? closeHotspot(false) : openHotspot(b);
  }));
  $('[data-scan-back]', hpanel).addEventListener('click', () => closeHotspot(true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && locked) closeHotspot(true); });

  if ('ResizeObserver' in window) new ResizeObserver(() => { const ox = W, oy = H; measure(); if (ox && (ox !== W || oy !== H)) { cur.x = cur.x / ox * W; cur.y = cur.y / oy * H; if (!locked) { tgt.x = REST.x * W; tgt.y = REST.y * H; } paint(); } }).observe(stage);
  measure();
  // gdy rentgen się nie wczyta, zostaje pełne auto i lista usług
  $('.scanner__xray img').addEventListener('error', () => { $('.scanner__xray').style.display = 'none'; $('.scanner__lens').style.display = 'none'; });

  /* ---------- hamulec: postęp przewijania ---------- */
  const brake = $('#brake');
  let brakeRaf = 0;
  function brakeUpdate() {
    brakeRaf = 0;
    const r = brake.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -50 || r.top > vh + 50) return; // poza widokiem: nic nie liczymy
    // 0 gdy góra sceny na dole ekranu, 1 gdy środek sceny mija środek ekranu
    let p = clamp((vh - r.top) / (vh / 2 + r.height / 2), 0, 1);
    p = 1 - Math.pow(1 - p, 3);
    brake.style.setProperty('--p', p.toFixed(4));
  }
  function brakeMode() {
    if (reduced.matches || !desktop.matches) {
      brake.style.setProperty('--p', '1');
      removeEventListener('scroll', onBrakeScroll);
    } else {
      addEventListener('scroll', onBrakeScroll, { passive: true });
      brakeUpdate();
    }
  }
  function onBrakeScroll() { if (!brakeRaf) brakeRaf = requestAnimationFrame(brakeUpdate); }
  brakeMode();
  desktop.addEventListener('change', brakeMode);
  reduced.addEventListener('change', brakeMode);
  addEventListener('resize', onBrakeScroll);

  /* ---------- akordeony: animacja wysokości, wykluczanie w usługach ---------- */
  $$('details.acc').forEach(d => {
    const summary = $('summary', d), body = $('.acc__body', d);
    d.addEventListener('click', e => {
      if (!e.target.closest('summary') || reduced.matches) return;
      e.preventDefault();
      if (d.dataset.busy) return;
      if (d.open) collapse(d, body);
      else {
        // wykluczanie: zamknij inne z tej samej grupy (name="uslugi" wspiera to natywnie, ale animujemy sami)
        if (d.name) $$('details[name="' + d.name + '"][open]').forEach(o => o !== d && collapse(o, $('.acc__body', o)));
        expand(d, body);
      }
    });
    summary.setAttribute('role', 'button');
  });
  function expand(d, body) {
    d.dataset.busy = '1'; d.open = true;
    const h = body.scrollHeight;
    body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' })
      .onfinish = () => { delete d.dataset.busy; };
  }
  function collapse(d, body) {
    d.dataset.busy = '1';
    const h = body.scrollHeight;
    body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' })
      .onfinish = () => { d.open = false; delete d.dataset.busy; };
  }

  /* ---------- „Zapytaj o tę usługę” → formularz z ustawioną usługą ---------- */
  const form = $('#contact'), svcRow = $('#f-service-row'), svcSel = $('#f-service');
  $$('[data-ask]').forEach(a => a.addEventListener('click', () => {
    svcRow.hidden = false; svcSel.value = a.dataset.service || '';
  }));

  /* ---------- formularz: walidacja i komunikat prototypu ---------- */
  form.setAttribute('novalidate', '');
  const status = $('#f-status'), submit = $('#f-submit'), label = $('[data-role="label"]', submit);
  const fields = [
    { el: $('#f-name'), err: $('#f-name-err'), ok: v => v.trim().length > 0 },
    { el: $('#f-phone'), err: $('#f-phone-err'), ok: v => (v.match(/\d/g) || []).length >= 7 && /^[\d\s+()\-]+$/.test(v.trim()) }
  ];
  function validate(f) {
    const good = f.ok(f.el.value);
    f.el.setAttribute('aria-invalid', String(!good)); f.err.hidden = good;
    return good;
  }
  fields.forEach(f => { f.el.addEventListener('blur', () => { if (f.el.value) validate(f); }); f.el.addEventListener('input', () => { if (f.el.getAttribute('aria-invalid') === 'true') validate(f); }); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    status.className = 'form__status'; status.textContent = '';
    const bad = fields.filter(f => !validate(f));
    if (bad.length) {
      status.className = 'form__status is-error';
      status.textContent = 'Sprawdź zaznaczone pola.';
      bad[0].el.focus();
      return;
    }
    submit.disabled = true; label.textContent = 'Wysyłanie…';
    setTimeout(() => {
      submit.disabled = false; label.textContent = 'Poproś o kontakt';
      status.className = 'form__status is-info';
      status.textContent = 'To prototyp: formularz nie wysyła danych i nie rezerwuje terminu. W docelowej wersji oddzwonimy, żeby ustalić termin. Do tego czasu zadzwoń — numer znajdziesz w sekcji Kontakt.';
    }, reduced.matches ? 200 : 700);
  });
})();
