/* WARSZTAT — interakcje strony (bez zależności). Treść działa bez tego pliku. */
(() => {
  'use strict';
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const mq = q => matchMedia(q);
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const finePointer = mq('(hover: hover) and (pointer: fine)');
  const narrow = mq('(max-width: 767px)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const PHONE_HREF = 'tel:+48000000000', PHONE_TEXT = '[telefon]';
  root.classList.add('js', 'acc-init');

  /* ---------- header: compact bar after scrolling ---------- */
  const header = $('.site-header');
  let compact = null;
  const headerState = () => {
    const c = scrollY > 24;
    if (c !== compact) { compact = c; header.classList.toggle('is-compact', c); }
  };
  addEventListener('scroll', headerState, {passive: true});
  headerState();

  /* ---------- mobile menu ---------- */
  const toggle = $('.nav__toggle'), menu = $('#nav-menu');
  const menuOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    if (open) root.style.setProperty('--menu-top', Math.round(header.getBoundingClientRect().bottom) + 'px');
    menu.classList.toggle('is-open', open);
    dockUpdate();
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('click', e => { if (menuOpen() && !e.target.closest('.nav')) setMenu(false); });
  mq('(min-width: 900px)').addEventListener('change', () => menuOpen() && setMenu(false));

  /* ---------- hero scanner ---------- */
  const scan = $('#scanner');
  const stage = $('.scan__stage', scan);
  const panel = $('#scan-panel');
  const ASPECT = 820 / 1880;
  const PARTS = {
    hamulce: {num: '01', name: 'Hamulce', text: 'Pewność przy każdym zatrzymaniu.', service: 'Hamulce'},
    silnik: {num: '02', name: 'Silnik', text: 'Świeci kontrolka albo brakuje mocy? Najpierw znajdziemy przyczynę.', service: 'Silnik'},
    zawieszenie: {num: '03', name: 'Zawieszenie', text: 'Stuki i luzy sprawdzimy, zanim cokolwiek wymienimy.', service: 'Zawieszenie'},
    kola: {num: '04', name: 'Koła', text: 'Opony i geometria, żeby auto jechało prosto.', service: 'Opony i geometria'}
  };
  const spots = {};
  $$('.hs', scan).forEach(b => {
    const cs = b.style;
    spots[b.dataset.part] = {x: parseFloat(cs.getPropertyValue('--x')) / 100, y: parseFloat(cs.getPropertyValue('--y')) / 100, btn: b};
  });
  const REST = {x: spots.hamulce.x, y: spots.hamulce.y - 0.03};
  let cur = {...REST}, tgt = {...REST}, tau = 40, raf = 0, last = 0, locked = null, opener = null;

  const applyLens = () => {
    scan.style.setProperty('--lx', (cur.x * 100).toFixed(3) + 'cqw');
    scan.style.setProperty('--ly', (cur.y * ASPECT * 100).toFixed(3) + 'cqw');
  };
  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    const k = 1 - Math.exp(-dt / tau);
    cur.x += (tgt.x - cur.x) * k;
    cur.y += (tgt.y - cur.y) * k;
    if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) < 0.0006) { cur = {...tgt}; raf = 0; last = 0; }
    else raf = requestAnimationFrame(frame);
    applyLens();
  }
  function lensTo(x, y, time) {
    tgt = {x: clamp(x, 0, 1), y: clamp(y, 0, 1)};
    tau = time;
    if (reduce.matches) { cur = {...tgt}; applyLens(); return; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  const parallaxOn = () => finePointer.matches && !reduce.matches && !narrow.matches;
  const setParallax = (px, py) => { stage.style.setProperty('--px', px.toFixed(2) + 'px'); stage.style.setProperty('--py', py.toFixed(2) + 'px'); };

  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;          // touch: no drag-scanning, scrolling stays free
    const r = stage.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    if (!locked) lensTo(u, v, 36);                  // ~100 ms follow, no spring
    if (parallaxOn()) setParallax((u - 0.5) * 10, (v - 0.5) * 6);
  });
  stage.addEventListener('pointerleave', e => {
    if (e.pointerType === 'touch') return;
    if (!locked) lensTo(REST.x, REST.y, 85);        // ~300 ms back over the front wheel
    setParallax(0, 0);
  });

  function selectPart(part, from) {
    const p = PARTS[part], s = spots[part];
    if (!p) return;
    locked = part;
    opener = from || s.btn;
    lensTo(s.x, s.y, 80);
    $('[data-panel="num"]', panel).textContent = p.num;
    $('[data-panel="name"]', panel).textContent = p.name;
    $('[data-panel="text"]', panel).textContent = p.text;
    $('[data-panel="link"]', panel).dataset.service = p.service;
    panel.hidden = false;
    panel.setAttribute('aria-label', p.name);
    $$('.hs', scan).forEach(b => b.setAttribute('aria-expanded', String(b.dataset.part === part)));
    $$('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === part)));
  }
  function releasePart(focusBack) {
    if (!locked) return;
    locked = null;
    panel.hidden = true;
    $$('.hs', scan).forEach(b => b.setAttribute('aria-expanded', 'false'));
    $$('.chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (focusBack && opener && d.contains(opener)) opener.focus({preventScroll: true});
  }
  const onPick = e => {
    const b = e.target.closest('[data-part]');
    if (!b) return;
    if (locked === b.dataset.part) releasePart(false); else selectPart(b.dataset.part, b);
  };
  $('.hotspots', scan).addEventListener('click', onPick);
  $('.scan-chips').addEventListener('click', onPick);
  $('.scan-panel__close', panel).addEventListener('click', () => releasePart(true));
  applyLens();

  /* ---------- brake: parts separate with scroll progress (desktop, motion allowed) ---------- */
  const brake = $('#brake');
  let brakeRaf = 0, brakeVisible = false;
  const brakeActive = () => !reduce.matches && !narrow.matches;
  function brakeUpdate() {
    brakeRaf = 0;
    if (!brakeActive()) { brake.style.setProperty('--p', '1'); return; }
    const r = brake.getBoundingClientRect(), vh = innerHeight;
    const c = r.top + r.height / 2;
    let p = clamp((vh * 0.88 - c) / (vh * 0.88 - vh * 0.42), 0, 1);
    p = p * p * (3 - 2 * p);
    brake.style.setProperty('--p', p.toFixed(4));
  }
  const brakeQueue = () => { if (brakeVisible && !brakeRaf) brakeRaf = requestAnimationFrame(brakeUpdate); };
  new IntersectionObserver(([en]) => { brakeVisible = en.isIntersecting; brakeQueue(); }, {rootMargin: '10% 0px'}).observe(brake);
  addEventListener('scroll', brakeQueue, {passive: true});
  addEventListener('resize', () => { brakeRaf || (brakeRaf = requestAnimationFrame(brakeUpdate)); });
  reduce.addEventListener('change', brakeUpdate);
  narrow.addEventListener('change', brakeUpdate);
  brakeUpdate();

  /* ---------- accordions (services: one open; FAQ: independent) ---------- */
  function accordion(list, sel, exclusive, onChange) {
    const btns = $$(sel, list);
    const set = (b, open) => {
      b.setAttribute('aria-expanded', String(open));
      d.getElementById(b.getAttribute('aria-controls')).classList.toggle('is-closed', !open);
      b.closest('.svc__item, .faq__item').classList.toggle('is-open', open);
    };
    btns.forEach(b => set(b, b.getAttribute('aria-expanded') === 'true'));
    list.addEventListener('click', e => {
      const b = e.target.closest(sel);
      if (!b) return;
      const open = b.getAttribute('aria-expanded') !== 'true';
      if (exclusive && open) btns.forEach(o => o !== b && set(o, false));
      set(b, open);
      onChange && onChange(b, open);
    });
  }
  const profile = $('#profile');
  accordion($('#svc-list'), '.svc__btn', true, (b, open) => {
    profile.dataset.active = open ? b.closest('.svc__item').dataset.svc : '';
  });
  accordion($('#faq-list'), '.faq__btn', false);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('acc-init')));

  /* ---------- "Zapytaj o tę usługę" -> form with the service preselected ---------- */
  const serviceField = $('#service-field'), serviceSelect = $('#f-service');
  d.addEventListener('click', e => {
    const a = e.target.closest('a[data-service]');
    if (!a) return;
    const name = a.dataset.service;
    if ([...serviceSelect.options].some(o => o.value === name || o.text === name)) {
      serviceSelect.value = name;
      serviceField.hidden = false;
    }
  });

  /* ---------- form (static prototype: validates, never pretends to send) ---------- */
  const form = $('#contact-form'), status = $('#form-status');
  form.noValidate = true;
  const rules = {
    'f-name': v => {
      const t = v.trim();
      if (!t) return 'Podaj imię, żebyśmy wiedzieli, jak się do ciebie zwracać.';
      if (t.length < 2) return 'Imię powinno mieć co najmniej 2 znaki.';
      return '';
    },
    'f-phone': v => {
      const t = v.trim();
      if (!t) return 'Podaj numer telefonu, żebyśmy mogli oddzwonić.';
      if (!/^\+?\d+$/.test(t.replace(/[\s().\-]/g, ''))) return 'Numer może zawierać cyfry, spacje i prefiks kraju, np. +48 600 100 200.';
      const n = t.replace(/\D/g, '').replace(/^00/, '').length;
      if (n < 9 || n > 15) return 'Sprawdź numer: potrzebujemy 9 cyfr (prefiks kraju jest opcjonalny).';
      return '';
    }
  };
  let tried = false;
  function check(el) {
    const msg = rules[el.id](el.value), err = d.getElementById(el.getAttribute('aria-describedby'));
    el.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg;
    err.hidden = !msg;
    return !msg;
  }
  Object.keys(rules).forEach(id => {
    const el = d.getElementById(id);
    el.addEventListener('input', () => { if (tried || el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('blur', () => { if (tried) check(el); });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    tried = true;
    const bad = Object.keys(rules).map(id => d.getElementById(id)).filter(el => !check(el));
    status.classList.remove('is-error');
    if (bad.length) {
      status.classList.add('is-error');
      status.innerHTML = `<strong>Uzupełnij ${bad.length === 1 ? 'zaznaczone pole' : 'zaznaczone pola'}.</strong>Wpisane dane zostały w formularzu.`;
      bad[0].focus();
      return;
    }
    status.innerHTML = `<strong>To wersja demonstracyjna. Zgłoszenie nie zostało wysłane.</strong>`
      + `Po podłączeniu systemu tutaj pojawi się potwierdzenie, a warsztat oddzwoni, żeby ustalić termin. `
      + `Twoje dane zostały w polach. Najszybciej: <a href="${PHONE_HREF}">${PHONE_TEXT}</a>.`;
  });

  /* ---------- mobile dock: hidden near hero CTA, form and while typing ---------- */
  const dock = $('#dock');
  const seen = {hero: true, form: false};
  let typing = false;
  function dockUpdate() {
    if (!dock) return;
    dock.classList.toggle('is-away', seen.hero || seen.form || typing || menuOpen());
  }
  dock.hidden = false;
  const dockIO = new IntersectionObserver(ens => ens.forEach(en => { seen[en.target === form.closest('section') ? 'form' : 'hero'] = en.isIntersecting; }) || dockUpdate());
  dockIO.observe($('.hero__actions'));
  dockIO.observe(form.closest('section'));
  d.addEventListener('focusin', e => { typing = !!e.target.closest('input, textarea, select'); dockUpdate(); });
  d.addEventListener('focusout', () => { typing = false; requestAnimationFrame(dockUpdate); });
  dockUpdate();

  /* ---------- Escape closes open layers ---------- */
  d.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (menuOpen()) { setMenu(false); toggle.focus(); return; }
    if (locked) releasePart(true);
  });

  /* ---------- one-time reveal for blocks that start below the fold ---------- */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(ens => ens.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('shown');
      en.target.classList.remove('pending');
      io.unobserve(en.target);
    }), {rootMargin: '0px 0px -8% 0px'});
    $$('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pending'); io.observe(el); }
    });
  }
})();
