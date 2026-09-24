'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const header = $('.site-header');
  const menu = $('.menu-toggle');
  const navigation = $('.navigation');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Otwórz menu'); navigation.classList.remove('is-open'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu'); navigation.classList.toggle('is-open', open);
  });
  $$('a', navigation).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
  mobile.addEventListener('change', closeMenu);

  const scanner = $('#scanner');
  const render = $('.car-render');
  const panel = $('#scanner-panel');
  const partButtons = $$('[data-part]');
  const parts = {
    engine: { x: 34, y: 43, title: '02 / Silnik', description: 'Zaczynamy od znalezienia przyczyny.', service: 'Diagnostyka' },
    brakes: { x: 58, y: 64, title: '01 / Hamulce', description: 'Pewność przy każdym zatrzymaniu.', service: 'Hamulce' },
    suspension: { x: 83, y: 55, title: '03 / Zawieszenie', description: 'Spokojna jazda zaczyna się od sprawnego zawieszenia.', service: 'Zawieszenie' }
  };
  let locked = false, lastTrigger = null, visible = true, frame = 0;
  let x = 57, y = 61, targetX = x, targetY = y, lastTime = 0, returnHome = false;
  function paintLens() { scanner.style.setProperty('--scan-x', `${x}%`); scanner.style.setProperty('--scan-y', `${y}%`); }
  function animateLens(now) {
    frame = 0;
    if (document.hidden || !visible) return;
    const dt = Math.min(now - (lastTime || now - 16), 45); lastTime = now;
    const factor = reduced.matches ? 1 : 1 - Math.exp(-dt / (returnHome ? 64 : 32));
    x += (targetX - x) * factor; y += (targetY - y) * factor;
    paintLens();
    if (Math.abs(targetX-x) + Math.abs(targetY-y) > .03) frame = requestAnimationFrame(animateLens);
    else { x = targetX; y = targetY; paintLens(); lastTime = 0; }
  }
  let lensRadius = parseFloat(getComputedStyle(scanner).getPropertyValue('--lens-size')) / 2;
  let renderWidth = render.clientWidth, renderHeight = render.clientHeight;
  function boundLens(nx, ny) {
    const insetX = (lensRadius + 3) / Math.max(1, renderWidth) * 100;
    const insetY = (lensRadius + 3) / Math.max(1, renderHeight) * 100;
    return [Math.max(insetX, Math.min(100 - insetX, nx)), Math.max(insetY, Math.min(100 - insetY, ny))];
  }
  function moveTo(nx, ny, home = false) {
    [targetX, targetY] = boundLens(nx, ny); returnHome = home;
    if (reduced.matches) { x = targetX; y = targetY; paintLens(); return; }
    if (!frame && visible && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(animateLens); }
  }
  new ResizeObserver(() => {
    lensRadius = parseFloat(getComputedStyle(scanner).getPropertyValue('--lens-size')) / 2;
    renderWidth = render.clientWidth; renderHeight = render.clientHeight;
    [x, y] = boundLens(x, y); paintLens(); moveTo(targetX, targetY);
  }).observe(render);
  scanner.addEventListener('pointermove', e => {
    if (locked || mobile.matches || e.pointerType !== 'mouse' || reduced.matches) return;
    const rect = render.getBoundingClientRect();
    moveTo((e.clientX-rect.left)/rect.width*100, (e.clientY-rect.top)/rect.height*100);
  });
  scanner.addEventListener('pointerleave', () => { if (!locked) moveTo(57,61,true); });
  partButtons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.part, part = parts[key];
    locked = true; lastTrigger = button; moveTo(part.x,part.y);
    partButtons.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.part === key)));
    $('#part-title').textContent = part.title; $('#part-description').textContent = part.description;
    $('.service-link',panel).dataset.service = part.service;
    panel.hidden = false;
  }));
  function closePanel(restoreFocus = true) {
    panel.hidden = true; locked = false; partButtons.forEach(b => b.setAttribute('aria-expanded','false')); moveTo(57,61,true);
    if (restoreFocus && lastTrigger) lastTrigger.focus({preventScroll:true});
  }
  $('.panel-close').addEventListener('click', () => closePanel());
  $('.scan-reset').addEventListener('click', () => closePanel());
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) closePanel();
    if (menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting; if (!visible) { cancelAnimationFrame(frame); frame=0; } else moveTo(targetX,targetY); }).observe(scanner);
  document.addEventListener('visibilitychange', () => { if(document.hidden){ cancelAnimationFrame(frame); frame=0; } else { moveTo(targetX,targetY); requestScroll(); } });
  $('.car-xray').addEventListener('error', () => { $('.car-xray').hidden=true; $('.lens').hidden=true; });

  const scene = $('.brake-scene');
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame=0; header.classList.toggle('scrolled',scrollY>30);
    if (document.hidden || reduced.matches || mobile.matches) return;
    const rect=scene.getBoundingClientRect();
    if(rect.bottom<0 || rect.top>innerHeight) return;
    const p=Math.max(0,Math.min(1,(innerHeight*.9-rect.top)/(innerHeight*.62)));
    scene.style.setProperty('--spread',p.toFixed(4));
    scene.dataset.progress=p.toFixed(3);
  }
  function requestScroll(){if(!scrollFrame) scrollFrame=requestAnimationFrame(updateScroll);}
  addEventListener('scroll',requestScroll,{passive:true}); addEventListener('resize',requestScroll,{passive:true});
  reduced.addEventListener('change',()=>{requestScroll();moveTo(targetX,targetY);}); updateScroll();

  const technicalCar=$('#technical-car');
  $$('.service-item').forEach(item=>item.addEventListener('toggle',()=>{
    const active=$('.service-item[open]');
    const name=active ? $('h3',active).textContent : '';
    technicalCar.dataset.active=name;
    technicalCar.setAttribute('aria-label', name ? `Techniczny rysunek samochodu. Wyróżniona usługa: ${name}.` : 'Techniczny rysunek samochodu.');
  }));
  $$('[data-service]').forEach(link=>link.addEventListener('click',()=>{
    $('.selected-service').hidden=false; $('#selected-service').value=link.dataset.service;
    if(panel.contains(link)) closePanel(false);
    // Preserve anchor navigation and place keyboard users at the chosen service.
    setTimeout(()=>$('#selected-service').focus({preventScroll:true}),reduced.matches?0:450);
  }));

  const form=$('#contact-form'); const submit=$('.submit-button'); submit.disabled=false;
  const nameField=$('#name'), phone=$('#phone');
  function validate(field){
    let error='';
    if(field===nameField && !field.value.trim()) error='Podaj imię, żebyśmy wiedzieli, jak się do Ciebie zwracać.';
    if(field===phone){
      const count=field.value.replace(/\D/g,'').length;
      if(!field.value.trim()) error='Podaj numer telefonu, żebyśmy mogli oddzwonić.';
      else if(!/^[+\d\s().-]+$/.test(field.value) || count<9 || count>15) error='Sprawdź numer telefonu — wpisz od 9 do 15 cyfr.';
    }
    field.setAttribute('aria-invalid',String(!!error)); $(`#${field.id}-error`).textContent=error;
    return !error;
  }
  [nameField,phone].forEach(field=>{
    field.addEventListener('blur',()=>{if(field.value || field.getAttribute('aria-invalid')==='true')validate(field);});
    field.addEventListener('input',()=>{if(field.hasAttribute('aria-invalid'))validate(field);$('.form-status').hidden=true;});
  });
  form.addEventListener('submit',e=>{
    e.preventDefault(); const validName=validate(nameField),validPhone=validate(phone);
    const status=$('.form-status');
    if(!validName || !validPhone){status.hidden=true;(!validName?nameField:phone).focus();return;}
    status.textContent='To prototyp — zgłoszenie nie zostało wysłane, a termin nie został zarezerwowany. Dane pozostają tylko w tej karcie przeglądarki.';
    status.hidden=false;
  });

  $$('[data-dialog]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();$(`#${button.dataset.dialog}`).showModal();}));
  $$('dialog').forEach(dialog=>{
    $$('.dialog-close,.dialog-done',dialog).forEach(b=>b.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  });
})();
