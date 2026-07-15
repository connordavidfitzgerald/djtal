import { gsap } from 'gsap';

/**
 * Entrance animations.
 * Staggers the nav links and fades the page content in on load.
 */
function intro() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const navItems = gsap.utils.toArray<HTMLElement>('[data-nav] .nav-item');

    gsap.from(navItems, {
        opacity: 0,
        x: -10,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1
    });

    gsap.from('main', {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    });
}

if (document.readyState !== 'loading') {
    intro();
} else {
    document.addEventListener('DOMContentLoaded', intro);
}
