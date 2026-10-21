/* ═══════════════════════════════════════════════════════════
   MOTION — interaction layer
   No dependencies. Everything degrades to a readable static page.
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ── where the demo form posts ──────────────────────────────
   Drop a Formspree / HubSpot / Zapier catch URL in here and the
   form starts posting for real. Until then it opens a pre-filled
   email to FALLBACK_EMAIL so no lead is ever lost.            */
const FORM_ENDPOINT  = '';
const FALLBACK_EMAIL = 'hello@motiontechnologies.co';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══ 1. reveal on scroll ═══════════════════════════════════ */
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

$$('.reveal, .compare__col, .keyline, .panel--chart, .flowline, .model').forEach(el => io.observe(el));

/* ═══ 2. nav ════════════════════════════════════════════════ */
const nav = $('#nav'), burger = $('#burger'), sheet = $('#mobileMenu');
const navLinks = $$('.nav__links a'), ink = $('.nav__ink');

addEventListener('scroll', () => nav.classList.toggle('is-stuck', scrollY > 24), { passive: true });

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  sheet.hidden = !open;
});

/* offset smooth-scroll so the fixed header never covers a heading */
$$('a[data-nav]').forEach(a => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); sheet.hidden = true;
  const y = t.getBoundingClientRect().top + scrollY - (nav.offsetHeight + 14);
  scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
}));

/* sliding underline follows the section you're actually reading */
const moveInk = (el) => {
  if (!el) { ink.style.opacity = 0; return; }
  const p = el.parentElement.getBoundingClientRect(), r = el.getBoundingClientRect();
  ink.style.width = r.width + 'px';
  ink.style.transform = `translateX(${r.left - p.left}px)`;
  ink.style.opacity = 1;
};
const sections = ['problem', 'how', 'why', 'platform'].map(id => $('#' + id));
const spy = new IntersectionObserver((es) => {
  es.forEach(e => {
    const link = navLinks.find(a => a.getAttribute('href') === '#' + e.target.id);
    if (!link) return;
    if (e.isIntersecting) { navLinks.forEach(a => a.classList.remove('is-active')); link.classList.add('is-active'); moveInk(link); }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => s && spy.observe(s));
navLinks.forEach(a => a.addEventListener('mouseenter', () => moveInk(a)));
$('.nav__links').addEventListener('mouseleave', () => moveInk($('.nav__links a.is-active')));

/* ═══ 3. scroll progress rail ═══════════════════════════════ */
const bar = $('#scrollBar');
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
}, { passive: true });

/* ═══ 4. hero light-streak canvas ═══════════════════════════
   Echoes the blue swoosh in the logo: long, low-alpha arcs that
   sweep left→right and fade. Cheap: ~14 curves, trails made by
   painting a translucent black rect instead of clearing.       */
(function heroFx () {
  const cv = $('#heroFx'); if (!cv || REDUCED) return;
  const ctx = cv.getContext('2d', { alpha: true });
  let W, H, dpr, running = true, streaks = [];

  const make = (seed = false) => ({
    x: seed ? Math.random() * 1.2 - 0.2 : -0.25,
    y: 0.12 + Math.random() * 0.78,
    len: 0.16 + Math.random() * 0.34,
    bow: (Math.random() - 0.5) * 0.34,
    v: 0.0012 + Math.random() * 0.0034,
    w: 0.6 + Math.random() * 2.1,
    green: Math.random() < 0.24,
    a: 0.06 + Math.random() * 0.3
  });

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const frame = () => {
    if (!running) return requestAnimationFrame(frame);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5,6,7,.13)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const s of streaks) {
      s.x += s.v;
      if (s.x > 1.3) Object.assign(s, make());
      const x0 = s.x * W, x1 = (s.x + s.len) * W, y = s.y * H, cy = y + s.bow * H;
      const grad = ctx.createLinearGradient(x0, y, x1, y);
      const col = s.green ? '34,238,85' : '0,110,255';
      grad.addColorStop(0, `rgba(${col},0)`);
      grad.addColorStop(0.5, `rgba(${col},${s.a})`);
      grad.addColorStop(1, `rgba(${col},0)`);
      ctx.strokeStyle = grad; ctx.lineWidth = s.w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y);
      ctx.quadraticCurveTo((x0 + x1) / 2, cy, x1, y); ctx.stroke();
    }
    requestAnimationFrame(frame);
  };

  size(); streaks = Array.from({ length: 15 }, () => make(true));
  addEventListener('resize', size);
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(cv);
  requestAnimationFrame(frame);
})();

/* ═══ 5. hero parallax tilt ═════════════════════════════════ */
(function tilt () {
  const el = $('#tilt'); if (!el || REDUCED || matchMedia('(hover:none)').matches) return;
  const hero = $('#hero');
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  function loop () {
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    el.style.transform = `rotateY(${cx * 4.2}deg) rotateX(${-cy * 3}deg) translateZ(0)`;
    raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(loop) : 0;
  }
})();

/* ═══ 6. count-up numbers ═══════════════════════════════════ */
const counted = new WeakSet();
const countIO = new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting || counted.has(e.target)) return;
  counted.add(e.target);
  const to = +e.target.dataset.to, t0 = performance.now(), dur = 1400;
  if (REDUCED) { e.target.textContent = to; return; }
  (function step (t) {
    const p = clamp((t - t0) / dur, 0, 1);
    e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}), { threshold: 0.5 });

/* ═══ 7. the live dashboard ═════════════════════════════════
   One function drives any number of dashboard instances, so the
   copy embedded in "See Motion in Action" is the same component
   as the hero — not a second mock to keep in sync.             */
const NAMES = ['John D.', 'Sarah M.', 'Devin H.', 'Alex R.', 'Priya N.', 'Marcus L.', 'Tara W.', 'Omar F.', 'Elena K.', 'Chris B.'];
const ITEMS = ['2 items · 1.4 mi', '5 items · 3.2 mi', '1 item · 0.8 mi', '3 items · 2.1 mi', '8 items · 4.6 mi', '4 items · 1.9 mi'];
const FLOW  = ['new', 'assigned', 'picked', 'delivered'];
const LABEL = { new: 'New', assigned: 'Assigned', picked: 'Picked up', delivered: 'Delivered' };

function makeRow (n) {
  const li = document.createElement('li');
  li.dataset.stage = '0';
  li.innerHTML =
    `<span class="av">${NAMES[n % NAMES.length].split(' ').map(w => w[0]).join('')}</span>` +
    `<span class="meta"><b>#${1000 + n}</b><em>${NAMES[n % NAMES.length]} · ${ITEMS[n % ITEMS.length]}</em></span>` +
    `<span class="pill" data-s="new">New</span>`;
  return li;
}

function initDashboard (root) {
  /* 7a — count-up tiles */
  $$('.num[data-to]', root).forEach(el => countIO.observe(el));

  /* 7b — order queue that actually advances through the pipeline */
  const list = $('.orders', root);
  const countEl = $('[data-tour="orders"] .panel__hd em', root);
  if (list) {
    let seq = 24;
    /* newest at the top (New) → oldest at the bottom (Delivered) */
    for (let i = 0; i < 4; i++) {
      const li = makeRow(seq--);
      li.dataset.stage = String(i);
      const p = $('.pill', li), s = FLOW[i];
      p.dataset.s = s; p.textContent = LABEL[s];
      li.style.animationDelay = (i * 90) + 'ms';
      list.appendChild(li);
    }
    seq = 25;
    if (!REDUCED) setInterval(() => {
      if (document.hidden) return;
      /* advance every order one stage; retire the finished one */
      [...list.children].forEach(li => {
        const st = +li.dataset.stage;
        if (st >= 3) { li.classList.add('is-out'); setTimeout(() => li.remove(), 450); return; }
        li.dataset.stage = String(st + 1);
        const p = $('.pill', li), s = FLOW[st + 1];
        p.dataset.s = s; p.textContent = LABEL[s];
      });
      list.insertBefore(makeRow(seq++), list.firstChild);
      if (countEl) countEl.textContent = `${Math.min(4, list.children.length)} active`;
    }, 3400);
  }

  /* 7c — driver travelling the route, drawing it as it goes */
  const route = $('.map__route', root), driver = $('.map__driver', root);
  if (route && driver && route.getTotalLength) {
    const L = route.getTotalLength();
    route.style.strokeDasharray = L;
    route.style.strokeDashoffset = REDUCED ? 0 : L;
    if (!REDUCED) {
      let t0 = null; const TRIP = 9200, HOLD = 1100;
      (function run (t) {
        if (t0 === null) t0 = t;
        const e = (t - t0) % (TRIP + HOLD);
        const p = clamp(e / TRIP, 0, 1);
        route.style.strokeDashoffset = L * (1 - p);
        const pt = route.getPointAtLength(L * p);
        driver.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        requestAnimationFrame(run);
      })(performance.now());
    } else {
      const pt = route.getPointAtLength(L * 0.62);
      driver.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    }
  }
}

initDashboard($('#dash'));

/* phone: its own route + an ETA that ticks down with the trip */
(function phone () {
  const route = $('#route2'), driver = $('#driver2'), eta = $('#eta');
  if (!route || !route.getTotalLength) return;
  const L = route.getTotalLength();
  route.style.strokeDasharray = L;
  if (REDUCED) {
    route.style.strokeDashoffset = 0;
    const pt = route.getPointAtLength(L * 0.62);
    driver.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    return;
  }
  route.style.strokeDashoffset = L;
  let t0 = null; const TRIP = 9200, HOLD = 1100;
  (function run (t) {
    if (t0 === null) t0 = t;
    const p = clamp(((t - t0) % (TRIP + HOLD)) / TRIP, 0, 1);
    route.style.strokeDashoffset = L * (1 - p);
    const pt = route.getPointAtLength(L * p);
    driver.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    if (eta) eta.textContent = Math.max(1, Math.round(12 * (1 - p)));
    requestAnimationFrame(run);
  })(performance.now());
})();

/* ═══ 8. "without Motion" tangle ════════════════════════════
   Draws messy wires between the floating chaos cards. It's the
   argument of section 2 made literal — many threads, no system. */
(function chaosWires () {
  const cv = $('#chaosWires'), host = $('#chaos');
  if (!cv || !host || REDUCED) return;
  const ctx = cv.getContext('2d');
  let pts = [], pairs = [], dpr = 1, live = false, t = 0;

  const measure = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = $$('.chaos__item', host).map(el => {
      const b = el.getBoundingClientRect();
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
    });
    pairs = [];
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        if ((i * 7 + j * 3) % 3 !== 0) pairs.push([i, j, ((i * 13 + j * 5) % 9) - 4]);
  };

  const frame = () => {
    requestAnimationFrame(frame);
    if (!live || !pts.length) return;
    t += 0.012;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineWidth = 1;
    pairs.forEach(([i, j, bow], k) => {
      const a = pts[i], b = pts[j];
      const mx = (a.x + b.x) / 2 + Math.sin(t + k) * (8 + bow * 4);
      const my = (a.y + b.y) / 2 + Math.cos(t * 0.8 + k) * (10 + bow * 3);
      ctx.strokeStyle = `rgba(255,${90 + ((k * 37) % 60)},${90 + ((k * 17) % 40)},${0.09 + 0.05 * Math.sin(t * 1.4 + k)})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    });
  };

  new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live) measure(); })
    .observe(host);
  addEventListener('resize', measure);
  setTimeout(measure, 700);          /* after the cards finish flying in */
  requestAnimationFrame(frame);
})();

/* ═══ 9. process rail — scroll scrubs the packet ════════════ */
(function flow () {
  const wrap = $('#flow'); if (!wrap) return;
  const rail = $('.flow__rail'), fill = $('#railFill'), pkt = $('#packet');
  const steps = $$('.step', wrap), rings = $$('.step__ring', wrap);

  /* the rail must start and end at the ring centres, not the edges */
  const place = () => {
    if (!rings.length || getComputedStyle(rail).display === 'none') return;
    const w = wrap.getBoundingClientRect();
    const a = rings[0].getBoundingClientRect(), b = rings[rings.length - 1].getBoundingClientRect();
    rail.style.left = (a.left - w.left + a.width / 2) + 'px';
    rail.style.right = 'auto';
    rail.style.width = (b.left - a.left) + 'px';
    rail.style.top = (a.top - w.top + a.height / 2) + 'px';
  };

  const tick = () => {
    place();
    const r = wrap.getBoundingClientRect();
    const p = clamp((innerHeight * 0.78 - r.top) / (r.height * 0.72), 0, 1);
    wrap.classList.toggle('is-live', p > 0.01 && p < 0.995);
    fill.style.width = (p * 100) + '%';
    pkt.style.left = (p * 100) + '%';
    steps.forEach((s, i) => s.classList.toggle('is-on', p >= i / (steps.length - 0.35)));
  };

  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  tick();
})();

/* ═══ 10. marketplace ⇄ motion switch (small screens) ═══════ */
(function vsSwitch () {
  const sw = $('.vs-switch'); if (!sw) return;
  const btns = $$('button', sw), swInk = $('.vs-switch__ink', sw), models = $$('.model');
  const select = (key) => {
    btns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.model === key)));
    models.forEach(m => m.classList.toggle('is-shown', m.dataset.model === key));
    const on = btns.find(b => b.dataset.model === key);
    const p = sw.getBoundingClientRect(), r = on.getBoundingClientRect();
    swInk.style.width = r.width + 'px';
    swInk.style.transform = `translateX(${r.left - p.left}px)`;
  };
  btns.forEach(b => b.addEventListener('click', () => select(b.dataset.model)));
  const sync = () => select(btns.find(b => b.getAttribute('aria-selected') === 'true').dataset.model);
  addEventListener('resize', sync);
  requestAnimationFrame(sync);
})();

/* ═══ 11. cursor spotlight on feature cards ═════════════════ */
$$('.feat').forEach(card => card.addEventListener('pointermove', (e) => {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  card.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));

/* ═══ 12. magnetic buttons ══════════════════════════════════ */
if (!REDUCED && !matchMedia('(hover:none)').matches) {
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 9}px,${((e.clientY - r.top) / r.height - .5) * 7}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ═══ 13. "See Motion in Action" — live product tour ════════
   Clones the hero dashboard into the video slot and walks a
   highlight ring around it. When the real film exists, delete
   the <div class="videoslot"> and drop the iframe in.          */
(function tour () {
  const slot = $('#videoSlot'), src = $('#dash'), ring = $('#tourRing');
  if (!slot || !src) return;

  const copy = src.cloneNode(true);
  copy.removeAttribute('id');
  $$('[id]', copy).forEach(el => el.id = el.id + '-t');          /* keep ids unique */
  const g = $('#sparkG-t', copy);
  if (g) $$('[fill^="url(#sparkG)"]', copy).forEach(p => p.setAttribute('fill', 'url(#sparkG-t)'));
  slot.appendChild(copy);
  copy.classList.add('is-in');
  initDashboard(copy);

  const btns = $$('#tourNav button');
  const stops = ['orders', 'map', 'chart', 'drivers'];
  let i = 0, timer = null;

  const go = (n, manual) => {
    i = (n + stops.length) % stops.length;
    const target = $(`[data-tour="${stops[i]}"]`, copy);
    btns.forEach((b, k) => b.classList.toggle('is-on', k === i));
    if (!target) return;
    const s = slot.getBoundingClientRect(), r = target.getBoundingClientRect();
    ring.style.width = (r.width + 10) + 'px';
    ring.style.height = (r.height + 10) + 'px';
    ring.style.transform = `translate(${r.left - s.left - 5}px, ${r.top - s.top - 5}px)`;
    ring.classList.add('is-on');
    if (manual) restart();
  };
  const restart = () => { clearInterval(timer); if (!REDUCED) timer = setInterval(() => go(i + 1), 4200); };

  btns.forEach((b, k) => b.addEventListener('click', () => go(k, true)));
  addEventListener('resize', () => go(i));

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { go(0); restart(); }
    else { clearInterval(timer); timer = null; ring.classList.remove('is-on'); }
  }, { threshold: 0.35 }).observe(slot);
})();

/* ═══ 14. demo modal ════════════════════════════════════════ */
(function demo () {
  const modal = $('#modal'), card = $('.modal__card', modal), body = $('#modalBody');
  const form = $('#demoForm'), submit = $('#submitBtn');
  const pristine = body.innerHTML;
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add('is-locked');
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      const first = $('#demoForm input, #demoForm select', card) || $('.modal__x', card);
      first.focus({ preventScroll: true });
    });
  };
  const close = () => {
    modal.classList.remove('is-open'); document.body.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; body.innerHTML = pristine; bind(); lastFocus && lastFocus.focus(); }, 340);
  };

  $$('[data-demo]').forEach(b => b.addEventListener('click', open));
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button,input,select,textarea', card).filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const MSG = {
    name:    'Tell us who we’re meeting.',
    email:   'We need a valid email to send the invite.',
    company: 'Which business are we setting this up for?',
    type:    'Pick the closest match.'
  };
  const bad = (el, on, msg) => {
    const f = el.closest('.fld');
    f.classList.toggle('is-bad', on);
    if (on) $('em', f).textContent = msg;
  };
  const valid = (el) => {
    if (el.name === 'email') return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(el.value.trim());
    return !el.required || el.value.trim().length > 1;
  };

  function bind () {
    const f = $('#demoForm'); if (!f) return;
    $$('input,select,textarea', f).forEach(el => {
      el.addEventListener('blur', () => { if (el.value) bad(el, !valid(el), MSG[el.name] || 'Required'); });
      el.addEventListener('input', () => bad(el, false));
    });
    f.addEventListener('submit', send);
  }

  async function send (e) {
    e.preventDefault();
    const f = e.currentTarget;
    const fields = $$('input,select,textarea', f);
    let ok = true, firstBad = null;
    fields.forEach(el => {
      const good = valid(el);
      bad(el, !good, MSG[el.name] || 'Required');
      if (!good) { ok = false; firstBad = firstBad || el; }
    });
    if (!ok) return firstBad.focus();

    const data = Object.fromEntries(new FormData(f).entries());
    const btn = $('#submitBtn', f);
    btn.disabled = true; btn.textContent = 'Sending…';

    let delivered = false;
    if (FORM_ENDPOINT) {
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        delivered = res.ok;
      } catch (_) { delivered = false; }
    }

    if (!delivered) {
      /* no endpoint (or it failed) → hand the lead to email rather than lose it */
      const lines = [
        `Name: ${data.name}`, `Email: ${data.email}`, `Business: ${data.company}`,
        `Phone: ${data.phone || '—'}`, `Type: ${data.type}`, '', `Notes: ${data.notes || '—'}`
      ].join('\n');
      location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('Motion demo request — ' + data.company)}&body=${encodeURIComponent(lines)}`;
    }

    /* built as DOM, not innerHTML — data.name is user input and must
       never be parsed as markup */
    const done = document.createElement('div');
    done.className = 'done';
    done.innerHTML =
      '<div class="done__ring"><svg class="ic"><use href="#i-check"/></svg></div>' +
      '<h3></h3><p></p><button class="btn btn--ghost" data-close>Close</button>';
    $('h3', done).textContent = `You're on the list, ${String(data.name).trim().split(/\s+/)[0]}.`;
    $('p', done).textContent = delivered
      ? 'We’ll be in touch within one business day to book your 20-minute walkthrough.'
      : 'Your email app is opening with the details — hit send and we’ll be in touch within one business day.';
    body.replaceChildren(done);
    $('button', done).focus({ preventScroll: true });
  }

  bind();
})();

/* ═══ 15. misc ══════════════════════════════════════════════ */
$('#yr').textContent = new Date().getFullYear();
requestAnimationFrame(() => $('#hero').classList.add('is-in'));

})();
