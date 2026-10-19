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
