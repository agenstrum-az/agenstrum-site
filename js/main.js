
// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = menu.style.display === 'flex';
    menu.style.display = open ? 'none' : 'flex';
    toggle.setAttribute('aria-expanded', String(!open));
  });
}

// Current year
document.getElementById('year').textContent = new Date().getFullYear();

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      observer.unobserve(entry.target);
    }
  })
}, { threshold: 0.14 });

document.querySelectorAll('.card, .pillar, .tech-card, .about .badge').forEach(el => {
  el.classList.add('will-reveal');
  observer.observe(el);
});
