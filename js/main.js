(() => {
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);
if (!hasGsap || reduce) root.classList.remove('js');

// ─── LENIS + GSAP ─────────────────────────
let lenis = null;
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -100 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

// ─── NAV ─────────────────────────────────
const nav = $('#nav');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 20);
  nav.classList.toggle('is-hidden', y > 300 && y > lastY && !root.classList.contains('menu-open'));
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = $('.menu-btn');
const setMenu = open => {
  root.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  lenis && (open ? lenis.stop() : lenis.start());
  if (open && hasGsap && !reduce) gsap.from('.mobile-menu li', { yPercent: 60, opacity: 0, stagger: .06, duration: .8, delay: .2, ease: 'expo.out' });
};
menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
document.addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

// ─── LIQUID TEXT ─────────────────────────
const lqEms = $$('.display em,.h1 em,.h2 em');
lqEms.forEach(em => {
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 1) return walk(c);
    if (c.nodeType !== 3 || !c.data.trim()) return;
    const f = document.createDocumentFragment();
    c.data.split(/(\s+)/).forEach(t => {
      if (!t) return;
      if (/^\s+$/.test(t)) return f.appendChild(document.createTextNode(t));
      const s = document.createElement('span'); s.className = 'lq'; s.dataset.t = t; s.textContent = t; f.appendChild(s);
    });
    c.replaceWith(f);
  });
  walk(em);
});
const lqHeads = [...new Set(lqEms.map(e => e.parentElement.closest('h1,h2,h3,.display,.h1,.h2') || e.parentElement))];
if ('IntersectionObserver' in window) {
  const lqIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('lq-run', e.isIntersecting)));
  lqHeads.forEach(h => lqIO.observe(h));
} else lqHeads.forEach(h => h.classList.add('lq-run'));

// ─── ANIMATIONS ──────────────────────────
if (hasGsap && !reduce) {
  const splitAll = () => $$('[data-split]').forEach(el => {
    gsap.set(el, { visibility: 'visible' });
    if (!window.SplitText) return gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: s => { if (el.dataset.splitDone) return; el.dataset.splitDone = 1; return gsap.from(s.lines, { yPercent: 110, duration: 1.1, stagger: .09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); }
    });
  });
  document.fonts ? document.fonts.ready.then(splitAll) : splitAll();

  lqHeads.forEach(h =>
    h.closest('.hero,.page-head')
      ? gsap.fromTo(h, { '--y': '-0.2em' }, { '--y': '-0.55em', ease: 'none', scrollTrigger: { trigger: h, start: 0, end: 'bottom top', scrub: .5 } })
      : gsap.fromTo(h, { '--y': '0.5em' }, { '--y': '-0.55em', ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: .5 } }));

  gsap.set('[data-reveal]', { y: 40 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'expo.out', overwrite: true })
  });

  $$('[data-count]').forEach(el => {
    const o = { v: 0 }, end = +el.dataset.count;
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onUpdate: () => el.textContent = Math.round(o.v) });
  });

  $$('[data-parallax]').forEach(img => {
    gsap.set(img, { scale: 1.15 });
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // FAQ smooth open
  $$('.faq details').forEach(d => {
    const s = $('summary', d), a = $('.ans', d);
    s.addEventListener('click', e => {
      e.preventDefault();
      if (d.open) gsap.to(a, { height: 0, duration: .5, ease: 'expo.out', onComplete: () => { d.open = false; gsap.set(a, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      else { d.open = true; gsap.from(a, { height: 0, duration: .6, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() }); }
    });
  });

  // footer wordmark
  const wm = $('.wordmark');
  wm && gsap.from(wm.children, { yPercent: 60, opacity: 0, stagger: .1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: wm, start: 'top 95%', once: true } });
}

// ─── CURSOR ──────────────────────────────
const cur = $('.cursor');
if (cur && hasGsap && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const x = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), y = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
  window.addEventListener('mousemove', e => { x(e.clientX); y(e.clientY); cur.classList.add('on'); }, { passive: true });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor],[data-lightbox],a,button,label,summary');
    cur.classList.remove('grow', 'link'); cur.textContent = '';
    if (!t) return;
    if (t.matches('[data-cursor],[data-lightbox]')) { cur.classList.add('grow'); cur.textContent = t.dataset.cursor || 'Apri'; }
    else cur.classList.add('link');
  });
}

// ─── SWIPER ──────────────────────────────
$$('.work-swiper').forEach(el => {
  if (!window.Swiper) return;
  const sec = el.closest('.carousel');
  new Swiper(el, {
    slidesPerView: 'auto', spaceBetween: 14, loop: true, grabCursor: true, speed: 800,
    autoplay: reduce ? false : { delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true },
    navigation: { prevEl: $('.sw-prev', sec), nextEl: $('.sw-next', sec) },
    pagination: { el: $('.swiper-pagination', el), type: 'progressbar' },
    keyboard: { enabled: true },
    a11y: { prevSlideMessage: 'Precedente', nextSlideMessage: 'Successivo' }
  });
});

// ─── PORTFOLIO FILTER ────────────────────
const fBtns = $$('.filter-btn');
fBtns.forEach(btn => btn.addEventListener('click', () => {
  fBtns.forEach(b => b.classList.toggle('active', b === btn));
  const f = btn.dataset.filter;
  const items = $$('#work [data-cat]');
  const show = i => f === 'all' || i.dataset.cat === f || i.dataset.cat === 'all';
  items.forEach(i => i.classList.toggle('is-hidden', !show(i)));
  if (hasGsap && !reduce) gsap.fromTo(items.filter(show), { opacity: 0, y: 30, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .7, stagger: .06, ease: 'expo.out' });
  $$('.swiper').forEach(w => w.swiper && w.swiper.update());
  hasGsap && ScrollTrigger.refresh();
}));

// ─── LIGHTBOX ────────────────────────────
const lb = document.createElement('div');
lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Anteprima immagine');
lb.innerHTML = '<button class="lb-close" aria-label="Chiudi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button><img alt="">';
document.body.appendChild(lb);
const lbImg = $('img', lb);
let lastFocus = null;
const openLb = (src, alt) => { lastFocus = document.activeElement; lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('open'); lenis && lenis.stop(); $('.lb-close', lb).focus(); };
const closeLb = () => { lb.classList.remove('open'); lenis && lenis.start(); lastFocus && lastFocus.focus(); };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lightbox]');
  if (!t) return;
  const img = t.tagName === 'IMG' ? t : $('img', t);
  if (img) { e.preventDefault(); openLb(t.dataset.full || img.currentSrc || img.src, img.alt); }
});
lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) closeLb(); });
document.addEventListener('keydown', e => e.key === 'Escape' && lb.classList.contains('open') && closeLb());


// ─── SITE SHOWCASE ───────────────────────
// live: iframe reale scalato · scroll: screenshot a pagina intera che scorre
const fitLive = sc => {
  const f = $('iframe', sc); if (!f) return;
  const [w, h] = sc.dataset.live.split('x').map(Number), k = sc.clientWidth / w;
  f.style.width = w + 'px'; f.style.height = (sc.clientHeight / k) + 'px'; f.style.transform = `scale(${k})`;
};
const fbImg = (src, cls) => { const i = new Image(); i.className = cls; i.alt = ''; i.decoding = 'async'; i.onerror = () => i.remove(); i.src = src; return i; };
const addPoster = sc => {
  if ($('.sc-fb', sc) || !sc.dataset.url) return;
  const d = document.createElement('div'); d.className = 'sc-fb'; d.setAttribute('aria-hidden', 'true');
  if (sc.dataset.logo) d.appendChild(fbImg(sc.dataset.logo, 'sc-fb-logo'));
  const n = document.createElement('span'); n.className = 'sc-fb-name'; n.textContent = sc.dataset.name || ''; d.appendChild(n);
  const h = document.createElement('span'); h.className = 'sc-fb-host'; h.textContent = new URL(sc.dataset.url).hostname.replace('www.', ''); d.appendChild(h);
  sc.dataset.shot && d.appendChild(fbImg(sc.dataset.shot, 'sc-fb-shot'));
  sc.appendChild(d);
};
const probes = {};
const probe = url => probes[url] || (probes[url] = Promise.race([
  fetch(url, { mode: 'no-cors', cache: 'no-store' }),
  new Promise((_, r) => setTimeout(r, 7000))
]).then(() => true, () => false));
const goOffline = sc => { $('iframe', sc)?.remove(); sc.classList.remove('loading', 'lv-ok'); sc.classList.add('is-off'); };
const mountIframe = (sc, size) => {
  if ($('iframe', sc) || sc.classList.contains('is-off')) return;
  if (!navigator.onLine) return goOffline(sc);
  sc.dataset.live = sc.dataset.live || size;
  sc.classList.add('loading');
  probe(sc.dataset.url).then(ok => ok ? attachIframe(sc) : goOffline(sc));
};
const attachIframe = sc => {
  if ($('iframe', sc)) return;
  const f = document.createElement('iframe');
  f.title = 'Anteprima live ' + sc.dataset.url;
  f.setAttribute('allow', 'fullscreen'); f.referrerPolicy = 'strict-origin-when-cross-origin';
  sc.classList.add('loading');
  const t = setTimeout(() => sc.classList.contains('loading') && goOffline(sc), 12000);
  f.addEventListener('load', () => { clearTimeout(t); sc.classList.remove('loading'); sc.classList.add('lv-ok'); });
  f.addEventListener('error', () => { clearTimeout(t); goOffline(sc); });
  f.src = sc.dataset.url;
  sc.prepend(f); fitLive(sc);
};
$$('.screen[data-mode="live"]').forEach(addPoster);
window.addEventListener('offline', () => $$('.screen[data-mode="live"]').forEach(goOffline));
const ro = new ResizeObserver(es => es.forEach(e => fitLive(e.target)));
const startLive = sc => { mountIframe(sc, sc.dataset.live); ro.observe(sc); };
const liveIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  liveIO.unobserve(e.target); startLive(e.target);
}), { rootMargin: '300px' }) : { observe: startLive };
$$('.screen[data-mode="live"]').forEach(sc => {
  liveIO.observe(sc);
  const ov = $('.screen-overlay', sc);
  ov && ov.addEventListener('click', () => sc.classList.add('is-live'));
  sc.addEventListener('mouseleave', () => sc.classList.remove('is-live'));
});
const toLiveButton = sc => {
  const isPhone = !!sc.closest('.phone');
  if (isPhone) return sc.closest('.phone').classList.add('is-missing');
  const ov = document.createElement('button');
  ov.className = 'screen-overlay always'; ov.type = 'button';
  ov.innerHTML = '<span>Carica anteprima live <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
  ov.addEventListener('click', () => { ov.remove(); $('.screen-hint', sc)?.remove(); $('.shot', sc)?.remove(); mountIframe(sc, '1440x900'); ro.observe(sc); sc.classList.add('is-live'); });
  sc.appendChild(ov);
};
$$('.screen[data-mode="scroll"]').forEach(sc => {
  const img = $('.shot', sc); if (!img) return;
  let tw = null;
  const dist = () => Math.max(0, img.offsetHeight - sc.clientHeight);
  const ready = () => {
    if (dist() < 20) { $('.screen-hint', sc)?.remove(); return; }
    if (matchMedia('(hover:hover)').matches) {
      sc.addEventListener('mouseenter', () => { tw && tw.kill(); tw = gsap.to(img, { y: -dist(), duration: dist() / 700, ease: 'none' }); });
      sc.addEventListener('mouseleave', () => { tw && tw.kill(); tw = gsap.to(img, { y: 0, duration: .9, ease: 'expo.out' }); });
    } else if (hasGsap) {
      gsap.to(img, { y: () => -dist(), ease: 'none', scrollTrigger: { trigger: sc, start: 'top 80%', end: 'bottom 10%', scrub: .6, invalidateOnRefresh: true } });
    }
  };
  const fail = () => {
    const p = img.dataset.poster, phone = sc.closest('.phone');
    if (p && !img.dataset.failed) { img.dataset.failed = 1; img.src = p; img.classList.add('poster'); img.dataset.posterClass && img.classList.add(img.dataset.posterClass); }
    else img.remove();
    $('.screen-hint', sc)?.remove();
    if (phone) { if (!p) phone.classList.add('is-missing'); return; }
    if ('embed' in sc.dataset && !$('.screen-overlay', sc)) toLiveButton(sc);
  };
  img.addEventListener('error', fail);
  if (img.complete && !img.naturalWidth && img.getAttribute('src')) queueMicrotask(() => img.isConnected && !img.naturalWidth && !img.dataset.failed && fail());
  if (!hasGsap) return;
  img.complete && img.naturalWidth ? ready() : img.addEventListener('load', () => !img.dataset.failed && ready(), { once: true });
});


// ─── MOBILE CTA ──────────────────────────
const mcta = $('.m-cta');
if (mcta) {
  let footVis = false;
  const upd = () => {
    const on = window.scrollY > 520 && !footVis && !root.classList.contains('menu-open');
    mcta.classList.toggle('show', on); mcta.setAttribute('aria-hidden', !on);
    $$('a', mcta).forEach(a => a.tabIndex = on ? 0 : -1);
  };
  const ft = $('.footer');
  ft && new IntersectionObserver(es => { footVis = es[0].isIntersecting; upd(); }).observe(ft);
  window.addEventListener('scroll', upd, { passive: true });
}


// ─── SITES CAROUSEL + LIVE PREVIEW ───────
$$('.sites-swiper').forEach(el => {
  if (!window.Swiper) return;
  const sec = el.closest('.sites-block');
  new Swiper(el, { slidesPerView: 'auto', spaceBetween: 14, grabCursor: true, speed: 700, navigation: { prevEl: $('.sw-prev', sec), nextEl: $('.sw-next', sec) }, keyboard: { enabled: true } });
});
const pv = $('.pv');
if (pv) {
  const frame = $('.pv-frame', pv);
  let back = null;
  const closePv = () => { pv.hidden = true; frame.innerHTML = ''; lenis && lenis.start(); document.body.style.overflow = ''; back && back.focus(); };
  $$('[data-preview]').forEach(b => b.addEventListener('click', () => {
    back = b;
    frame.innerHTML = ''; frame.classList.remove('lv-ok', 'is-off');
    const fb = document.createElement('div'); fb.className = 'pv-fb';
    fb.innerHTML = '<a target="_blank" rel="noopener">Apri ' + b.dataset.host + ' ↗</a>'; $('a', fb).href = b.dataset.preview;
    b.dataset.shot && fb.appendChild(fbImg(b.dataset.shot, 'pv-shot'));
    frame.appendChild(fb);
    if (!navigator.onLine) frame.classList.add('is-off');
    else probe(b.dataset.preview).then(ok => {
      if (pv.hidden || !fb.isConnected) return;
      if (!ok) return frame.classList.add('is-off');
      const f = document.createElement('iframe');
      f.src = b.dataset.preview; f.title = 'Anteprima ' + b.dataset.host; f.setAttribute('allow', 'fullscreen'); f.referrerPolicy = 'strict-origin-when-cross-origin';
      const t = setTimeout(() => { if (!frame.classList.contains('lv-ok')) { f.remove(); frame.classList.add('is-off'); } }, 12000);
      f.addEventListener('load', () => { clearTimeout(t); frame.classList.add('lv-ok'); });
      frame.appendChild(f);
    });
    $('.pv-url', pv).textContent = b.dataset.host; $('.pv-ext', pv).href = b.dataset.preview;
    pv.hidden = false; lenis && lenis.stop(); document.body.style.overflow = 'hidden'; $('.pv-close', pv).focus();
  }));
  $('.pv-close', pv).addEventListener('click', closePv);
  document.addEventListener('keydown', e => e.key === 'Escape' && !pv.hidden && closePv());
}


// ─── STEPPER ─────────────────────────────
const stp = $('#contact-form.stepper');
if (stp) {
  const steps = $$('.step', stp), n = steps.length;
  let cur = 0;
  const show = (i, back) => {
    steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-back', !!back && k === i); });
    cur = i;
    $('.st-count b', stp).textContent = String(i + 1).padStart(2, '0');
    $('.st-title', stp).textContent = steps[i].dataset.title;
    $('.st-bar i', stp).style.width = ((i + 1) / n * 100) + '%';
    stp.classList.toggle('at-first', i === 0); stp.classList.toggle('at-last', i === n - 1);
    const f = $('input:not([type=radio]),textarea', steps[i]); f && matchMedia('(hover:hover)').matches && f.focus({ preventScroll: true });
    hasGsap && ScrollTrigger.refresh();
  };
  const valid = i => {
    let ok = true;
    $$('input[required],textarea[required]', steps[i]).forEach(el => {
      const bad = !el.value.trim() || !el.checkValidity();
      el.closest('.field').classList.toggle('invalid', bad);
      if (bad && ok) { ok = false; el.focus(); }
    });
    return ok;
  };
  $('.st-next', stp).addEventListener('click', () => valid(cur) && show(cur + 1));
  $('.st-prev', stp).addEventListener('click', () => cur > 0 && show(cur - 1, true));
  stp.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));
  stp.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < n - 1) { e.preventDefault(); valid(cur) && show(cur + 1); } });
  stp.addEventListener('submit', e => { if (!steps.every((_, k) => valid(k))) { e.preventDefault(); e.stopImmediatePropagation(); const bad = steps.findIndex(s => $('.invalid', s)); show(bad < 0 ? 0 : bad); } }, true);
  stp.addEventListener('reset', () => setTimeout(() => show(0, true), 0));
  show(0);
}

// ─── FORM — Email o WhatsApp ─────────────
// "Web Design & Sviluppo" → Nicholas · altri servizi → Giuliano
const WA_GIULIANO = '393311471560', WA_NICHOLAS = '393509664712';
const EMAIL = 'selfmanagers.it@gmail.com';
const WEB_SERVICES = ['Web Design & Sviluppo', 'Branding Completo', 'Più servizi insieme', ''];
const form = $('#contact-form');
if (form) {
  const chBtns = $$('.channel-btn', form);
  chBtns.forEach(b => b.addEventListener('change', () => chBtns.forEach(x => x.classList.toggle('active', x === b))));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = id => $('#' + id).value.trim();
    const nome = `${v('f-nome')} ${v('f-cognome')}`, email = v('f-email'), tel = v('f-tel'), servizio = ($('input[name="servizio"]:checked', form) || {}).value || '', msg = v('f-messaggio');
    const canale = $('input[name="canale"]:checked', form).value;
    const isWeb = WEB_SERVICES.includes(servizio);
    if (canale === 'email') {
      const subject = encodeURIComponent(`Richiesta da ${nome}${servizio ? ' — ' + servizio : ''}`);
      const body = encodeURIComponent(
        `Ciao Selfmanagers,\n\nMi chiamo ${nome} e vi scrivo tramite il modulo di contatto del sito.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n• Email: ${email}\n` + (tel ? `• Telefono: ${tel}\n` : '') + (servizio ? `• Servizio di interesse: ${servizio}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n• Messaggio:\n${msg}\n\nIn attesa di una vostra risposta,\n${nome}`);
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    } else {
      const text = encodeURIComponent(
        `Ciao ${isWeb ? 'Nicholas' : 'Giuliano'}! 👋\n\nSono *${nome}* e vi contatto tramite il sito web.\n\n📧 Email: ${email}\n` +
        (tel ? `📞 Telefono: ${tel}\n` : '') + (servizio ? `🎯 Servizio: ${servizio}\n` : '') + `\n💬 ${msg}`);
      window.open(`https://wa.me/${isWeb ? WA_NICHOLAS : WA_GIULIANO}?text=${text}`, '_blank', 'noopener');
    }
    const btn = $('.btn-submit', form), lbl = $('.lbl', btn), orig = lbl.textContent;
    btn.classList.add('done'); lbl.textContent = canale === 'email' ? 'Email aperta!' : 'WhatsApp aperto!';
    setTimeout(() => { btn.classList.remove('done'); lbl.textContent = orig; form.reset(); chBtns.forEach((b, i) => b.classList.toggle('active', !i)); }, 3000);
  });
}
})();
