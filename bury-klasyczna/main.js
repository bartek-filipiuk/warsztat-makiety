(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');

  // Menu mobilne: otwiera się po kliknięciu, zamyka po wyborze sekcji albo Esc.
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  // Niższy pasek po scrollu (200 ms, bez skoku treści: pasek jest sticky, nie fixed).
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { nav.classList.toggle('is-scrolled', scrollY > 24); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Akordeony: <details> działa bez JS; tu tylko aria-expanded na summary.
  document.querySelectorAll('.qa').forEach((d) => {
    const s = d.querySelector('summary');
    const sync = () => s.setAttribute('aria-expanded', String(d.open));
    sync();
    d.addEventListener('toggle', sync);
  });

  // Jednorazowe wejścia (fade). Bez IntersectionObserver wszystko od razu widoczne.
  const items = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => io.observe(el));
})();
