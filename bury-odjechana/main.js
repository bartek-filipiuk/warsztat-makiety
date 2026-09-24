(() => {
  const root = document.documentElement;
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');

  /* Menu mobilne */
  const setMenu = (open) => { toggle.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open); };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* Akordeony: <details> działa bez JS, tu tylko aria-expanded */
  document.querySelectorAll('.qa').forEach((d) => {
    const s = d.querySelector('summary');
    const sync = () => s.setAttribute('aria-expanded', String(d.open));
    sync(); d.addEventListener('toggle', sync);
  });

  const hasIO = 'IntersectionObserver' in window;

  /* Wejścia fade */
  const rv = document.querySelectorAll('.rv');
  if (hasIO) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  /* Nawigacja: kolor sekcji pod paskiem (obserwator), przezroczysta na samej górze */
  const sections = [...document.querySelectorAll('[data-nav]')];
  let under = 'dark';
  const paintNav = () => { nav.dataset.theme = scrollY < 8 ? 'clear' : under; };
  if (hasIO) {
    const navIO = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) under = en.target.dataset.nav; });
      paintNav();
    }, { rootMargin: '0px 0px -94% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }
  addEventListener('scroll', paintNav, { passive: true });
  paintNav();

  /* Scena: brzytwa otwiera się ze scrollem */
  const hero = document.querySelector('.hero');
  const frame = hero.querySelector('.razor');
  const blade = hero.querySelector('.razor__blade');
  const glint = hero.querySelector('.razor__glint');
  const h1 = hero.querySelector('.hero__h');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px)');
  const CLOSED = -195; // stopnie (ostrze wraca przez lewą stronę, z dala od tekstu); 0 = otwarta (stan bez JS i przy ograniczonym ruchu)
  const OPEN = -6; // lekko poza linią rękojeści, ostrze dalej od tekstu
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  let target = 0, cur = 0, raf = 0, last = 0, active = true, vh = innerHeight, mobileMax = 0;

  const readTarget = () => {
    if (desktop.matches) return clamp(scrollY / (0.7 * vh));
    // telefon: bez przypięcia, otwiera się gdy kadr przechodzi przez ekran i zostaje otwarta
    const top = frame.getBoundingClientRect().top;
    mobileMax = Math.max(mobileMax, clamp((0.6 * vh - top) / (0.45 * vh)));
    return mobileMax;
  };

  const apply = (p) => {
    blade.style.transform = `rotate(${(CLOSED + (OPEN - CLOSED) * p).toFixed(2)}deg)`;
    blade.style.opacity = Math.min(1, p / 0.08).toFixed(3);
    glint.style.setProperty('--s', (50 + 44 * p).toFixed(2) + '%');
    if (desktop.matches) {
      const h = clamp((p - 0.35) / 0.35);
      h1.style.setProperty('--h-o', (0.6 + 0.4 * h).toFixed(3));
      h1.style.setProperty('--h-y', (8 * (1 - h)).toFixed(2) + 'px');
    } else { h1.style.setProperty('--h-o', '1'); h1.style.setProperty('--h-y', '0px'); }
  };

  const frameFn = (t) => {
    const dt = last ? Math.min(64, t - last) : 16; last = t;
    target = readTarget();
    cur += (target - cur) * (1 - Math.exp(-dt / 100)); // lerp ~100 ms
    if (Math.abs(target - cur) < 0.0005) cur = target;
    apply(cur);
    if (cur !== target && active) raf = requestAnimationFrame(frameFn);
    else { raf = 0; last = 0; blade.style.willChange = 'auto'; }
  };
  let on = false;
  const kick = () => { if (on && !raf && active) { blade.style.willChange = 'transform'; raf = requestAnimationFrame(frameFn); } };

  const enable = () => {
    root.classList.add('razor-on');
    blade.classList.remove('is-open');
    vh = innerHeight;
    cur = target = readTarget();
    apply(cur);
  };
  const disable = () => {
    root.classList.remove('razor-on');
    blade.classList.add('is-open');
    blade.style.transform = blade.style.opacity = '';
    glint.style.removeProperty('--s');
    h1.style.removeProperty('--h-o'); h1.style.removeProperty('--h-y');
  };

  const setup = () => {
    if (reduced.matches) { if (on) { removeEventListener('scroll', kick); on = false; } disable(); return; }
    enable();
    if (!on) { addEventListener('scroll', kick, { passive: true }); on = true; }
  };
  setup();
  reduced.addEventListener('change', setup);
  desktop.addEventListener('change', () => { mobileMax = 0; setup(); });
  addEventListener('resize', () => { vh = innerHeight; kick(); }, { passive: true });

  // Poza widokiem i w nieaktywnej karcie scena stoi
  if (hasIO) new IntersectionObserver(([en]) => { active = en.isIntersecting; if (active) kick(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { active = !document.hidden; if (active) kick(); });
})();
