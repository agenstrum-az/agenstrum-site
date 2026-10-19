// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// Theme toggle (light / dark), defaults to the OS preference
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}

// Language menu (EN / ES / PT / IT)
const langToggle = document.querySelector('.lang-toggle');
const langMenu = document.getElementById('lang-menu');
if (langToggle && langMenu && window.AgenstrumI18n) {
  const items = [...langMenu.querySelectorAll('[data-lang]')];

  const sync = lang => {
    langToggle.querySelector('.lang-code').textContent = lang.toUpperCase();
    items.forEach(b => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
    const field = document.getElementById('form-lang');
    if (field) field.value = lang;
  };

  const close = (focusToggle) => {
    langMenu.hidden = true;
    langToggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) langToggle.focus();
  };

  const open = () => {
    langMenu.hidden = false;
    langToggle.setAttribute('aria-expanded', 'true');
    (items.find(b => b.getAttribute('aria-checked') === 'true') || items[0]).focus();
  };

  langToggle.addEventListener('click', () => langMenu.hidden ? open() : close(false));
  items.forEach(b => b.addEventListener('click', () => {
    AgenstrumI18n.set(b.dataset.lang);
    close(true);
  }));
  langMenu.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Tab') close(false);
  });
  document.addEventListener('click', e => {
    if (!langMenu.hidden && !e.target.closest('.lang')) close(false);
  });

  document.addEventListener('langchange', e => sync(e.detail.lang));
  sync(AgenstrumI18n.current);
}

// Current year
document.getElementById('year').textContent = new Date().getFullYear();

// Confirmation after FormSubmit redirects back with ?sent
if (new URLSearchParams(location.search).has('sent')) {
  const status = document.getElementById('form-status');
  if (status) status.hidden = false;
}

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      observer.unobserve(entry.target);
    }
  })
}, { threshold: 0.14 });

document.querySelectorAll('.card, .pillar, .tech-card, .rpi .step, .about .badge').forEach(el => {
  el.classList.add('will-reveal');
  observer.observe(el);
});
