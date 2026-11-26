(() => {
    const section = document.querySelector('.landing-bento');
    if (!section || !('IntersectionObserver' in window)) return;
    const items = section.querySelectorAll('.bento-reveal');
    const reveal = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            reveal.unobserve(entry.target);
        }
    }, { threshold: 0.12 });
    section.classList.add('bento-ready');
    items.forEach(item => reveal.observe(item));
    let visible = false;
    const sync = () => section.classList.toggle('bento-paused', !visible || document.hidden);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(section);
    document.addEventListener('visibilitychange', sync);
    sync();
})();
