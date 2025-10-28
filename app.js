const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isPointerFine = window.matchMedia('(pointer: fine)');

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const setYear = () => {
    const yearEl = qs('#year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
};

const initScrollProgress = () => {
    const progressContainer = qs('[data-scroll-progress] span');
    if (!progressContainer) return;

    const update = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const progress = scrollHeight > clientHeight
            ? (scrollTop / (scrollHeight - clientHeight))
            : 0;
        progressContainer.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
};

const initRevealAnimations = () => {
    const animatedElements = qsa('[data-animate]');
    if (!animatedElements.length) return;

    const reveal = entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const animation = el.dataset.animate;
            const delay = el.dataset.delay || 0;
            el.style.setProperty('--delay', `${delay}ms`);
            el.classList.add(`animate-${animation}`);
            observer.unobserve(el);
        });
    };

    const observer = new IntersectionObserver(reveal, {
        root: null,
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
};

const initCounters = () => {
    const counters = qsa('[data-counter]');
    if (!counters.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 4);

    const animateCounter = el => {
        const targetValue = parseFloat(el.dataset.counter || '0');
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : (el.dataset.counter?.split('.')[1]?.length || 0);
        const locale = el.dataset.locale || 'sr-RS';
        const duration = 1200 + Math.random() * 600;
        let startTime = null;

        const step = timestamp => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const value = targetValue * easeOut(progress);
            const formatted = Number.isFinite(value)
                ? value.toLocaleString(locale, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                })
                : targetValue;
            el.textContent = `${prefix}${formatted}${suffix}`;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.35,
        rootMargin: '0px 0px -10% 0px'
    });

    counters.forEach(counter => {
        counter.textContent = `${counter.dataset.prefix || ''}0${counter.dataset.suffix || ''}`;
        observer.observe(counter);
    });
};

const initProgressBars = () => {
    const bars = qsa('[data-progress]');
    if (!bars.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseFloat(el.dataset.progress || '0');
            el.style.setProperty('--progress', `${target}%`);
            observer.unobserve(el);
        });
    }, {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px'
    });

    bars.forEach(bar => {
        bar.style.setProperty('--progress', '0%');
        observer.observe(bar);
    });
};

const initParallax = () => {
    if (!isPointerFine.matches) return;
    const parallaxItems = qsa('[data-parallax]');
    if (!parallaxItems.length) return;

    const dampen = 14;
    const update = event => {
        const { innerWidth, innerHeight } = window;
        const offsetX = (event.clientX / innerWidth - 0.5) * dampen;
        const offsetY = (event.clientY / innerHeight - 0.5) * dampen;

        parallaxItems.forEach(item => {
            item.style.setProperty('--parallax-x', `${offsetX}px`);
            item.style.setProperty('--parallax-y', `${offsetY}px`);
        });
    };

    window.addEventListener('pointermove', update);
};

const initTiltCards = () => {
    if (!isPointerFine.matches) return;
    const tiltCards = qsa('[data-hover-tilt]');
    if (!tiltCards.length) return;

    const boundsMap = new WeakMap();

    const handleMove = event => {
        const target = event.currentTarget;
        const bounds = boundsMap.get(target);
        if (!bounds) return;
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const rotateX = (0.5 - y) * 12;
        const rotateY = (x - 0.5) * 16;
        target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const reset = event => {
        const target = event.currentTarget;
        target.style.transform = '';
        target.style.transition = '';
    };

    tiltCards.forEach(card => {
        card.style.transformStyle = 'preserve-3d';
        card.addEventListener('pointerenter', () => {
            boundsMap.set(card, card.getBoundingClientRect());
            card.style.transition = 'transform 0.2s ease-out';
        });
        card.addEventListener('pointermove', handleMove);
        card.addEventListener('pointerleave', reset);
    });
};

const initCursor = () => {
    if (!isPointerFine.matches) return;
    const cursor = qs('[data-cursor]');
    if (!cursor) return;

    const activate = () => cursor.classList.add('is-visible');
    const deactivate = () => cursor.classList.remove('is-visible');

    window.addEventListener('pointermove', event => {
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        activate();
    }, { passive: true });

    window.addEventListener('pointerout', ({ relatedTarget }) => {
        if (!relatedTarget) {
            deactivate();
        }
    });

    const interactiveSelectors = 'a, button, .btn, [data-hover-tilt]';
    const interactives = qsa(interactiveSelectors);

    interactives.forEach(el => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
};

const initReducedMotionListeners = () => {
    if (!prefersReducedMotion.matches) return;
    document.documentElement.classList.add('is-reduced-motion');
    qsa('[data-counter]').forEach(counter => {
        const prefix = counter.dataset.prefix || '';
        const suffix = counter.dataset.suffix || '';
        const locale = counter.dataset.locale || 'sr-RS';
        const decimals = counter.dataset.decimals ? parseInt(counter.dataset.decimals, 10) : (counter.dataset.counter?.split('.')[1]?.length || 0);
        const targetValue = parseFloat(counter.dataset.counter || '0');
        counter.textContent = `${prefix}${targetValue.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })}${suffix}`;
    });

    qsa('[data-progress]').forEach(bar => {
        const target = parseFloat(bar.dataset.progress || '0');
        bar.style.setProperty('--progress', `${target}%`);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setYear();
    initScrollProgress();
    initRevealAnimations();
    if (!prefersReducedMotion.matches) {
        initCounters();
        initProgressBars();
        initParallax();
        initTiltCards();
        initCursor();
    } else {
        initReducedMotionListeners();
    }
});
