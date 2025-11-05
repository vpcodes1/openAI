document.documentElement.classList.add('has-js');

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
            const delay = parseInt(el.dataset.delay || '0', 10);
            if (delay) {
                el.style.transitionDelay = `${delay}ms`;
            }
            el.classList.add('is-visible');
            setTimeout(() => {
                el.style.willChange = 'auto';
            }, 1000 + delay);
            observer.unobserve(el);
        });
    };

    const observer = new IntersectionObserver(reveal, {
        root: null,
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
    });

    animatedElements.forEach(el => {
        el.style.willChange = 'opacity, transform';
        observer.observe(el);
    });
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

const initServiceLab = () => {
    const lab = qs('[data-service-lab]');
    if (!lab) return;

    const nav = qs('[data-service-nav]', lab);
    const navItems = qsa('.service-nav-item', nav);
    const indicator = qs('[data-service-indicator]', nav);
    const panels = qsa('[data-service-panel]', lab);
    const meter = qs('[data-service-meter]');
    if (!navItems.length || !panels.length) return;

    let activeButton = navItems[0];
    let autoCycle;

    const stopCycle = () => {
        clearInterval(autoCycle);
    };

    const cycle = () => {
        if (!activeButton) return;
        const currentIndex = navItems.indexOf(activeButton);
        const nextIndex = (currentIndex + 1) % navItems.length;
        activate(navItems[nextIndex]);
    };

    const startCycle = () => {
        if (prefersReducedMotion.matches) return;
        clearInterval(autoCycle);
        autoCycle = setInterval(cycle, 7000);
    };

    const activate = target => {
        const button = typeof target === 'string'
            ? navItems.find(item => item.dataset.serviceTarget === target)
            : target;
        if (!button) return;
        const panelId = button.dataset.serviceTarget;
        navItems.forEach(item => item.classList.toggle('is-active', item === button));
        panels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.servicePanel === panelId));
        const offset = button.offsetTop - nav.offsetTop;
        if (indicator) {
            indicator.style.height = `${button.offsetHeight}px`;
            indicator.style.setProperty('--indicator-offset', `${offset}px`);
        }
        if (meter) {
            const value = parseInt(button.dataset.meter || '80', 10);
            meter.style.width = `${value}%`;
        }
        activeButton = button;
        if (prefersReducedMotion.matches) {
            stopCycle();
        }
    };

    const handleResize = () => {
        if (!activeButton) return;
        const offset = activeButton.offsetTop - nav.offsetTop;
        if (indicator) {
            indicator.style.height = `${activeButton.offsetHeight}px`;
            indicator.style.setProperty('--indicator-offset', `${offset}px`);
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            activate(item);
            stopCycle();
        });
    });

    activate(navItems[0]);
    window.addEventListener('resize', handleResize);
    startCycle();
    nav.addEventListener('pointerenter', stopCycle);
    nav.addEventListener('pointerleave', startCycle);
};

const initExperienceSlider = () => {
    const viewport = qs('[data-experience-viewport]');
    if (!viewport) return;
    const track = qs('.experience-track', viewport);
    const dots = qsa('.experience-dot');
    if (!track || !dots.length) return;

    let current = 0;
    let autoTimer;

    const goTo = index => {
        current = (index + dots.length) % dots.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
    };

    const play = () => {
        if (prefersReducedMotion.matches) return;
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            goTo(current + 1);
        }, 4200);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goTo(index);
            play();
        });
    });

    viewport.addEventListener('pointerenter', () => clearInterval(autoTimer));
    viewport.addEventListener('pointerleave', play);

    goTo(0);
    play();
};

const initProcessNavigator = () => {
    const process = qs('[data-process]');
    if (!process) return;
    const steps = qsa('[data-process-step]', process);
    const panels = qsa('[data-process-panel]', process);
    const progress = qs('[data-process-progress]', process);
    if (!steps.length || !panels.length || !progress) return;

    let activeStep = steps[0];

    const isCompact = window.matchMedia('(max-width: 960px)');

    const sync = target => {
        if (isCompact.matches) return;
        const button = typeof target === 'string'
            ? steps.find(step => step.dataset.processStep === target)
            : target;
        if (!button) return;
        const panelId = button.dataset.processStep;
        steps.forEach(step => step.classList.toggle('is-active', step === button));
        panels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.processPanel === panelId));
        const offset = button.offsetTop - steps[0].offsetTop;
        progress.style.height = `${button.offsetHeight}px`;
        progress.style.setProperty('--process-offset', `${offset}px`);
        activeStep = button;
    };

    const handleResize = () => {
        if (isCompact.matches) {
            panels.forEach(panel => panel.classList.add('is-active'));
            return;
        }
        panels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.processPanel === activeStep.dataset.processStep));
        sync(activeStep);
    };

    steps.forEach(step => step.addEventListener('click', () => sync(step)));

    sync(steps[0]);
    handleResize();
    window.addEventListener('resize', handleResize);
};

const initCaseCarousel = () => {
    const carousel = qs('[data-case-carousel]');
    if (!carousel) return;
    const track = qs('.case-track', carousel);
    const cases = qsa('[data-case]', track);
    const prev = qs('.case-control.prev', carousel);
    const next = qs('.case-control.next', carousel);
    const progress = qs('[data-case-progress]', carousel);
    if (!track || !cases.length) return;

    let index = 0;
    let autoplay;

    const update = () => {
        const active = cases[index];
        const offset = active.offsetLeft;
        track.style.transform = `translateX(-${offset}px)`;
        if (progress) {
            const value = ((index + 1) / cases.length) * 100;
            progress.style.width = `${value}%`;
        }
    };

    const goTo = newIndex => {
        index = (newIndex + cases.length) % cases.length;
        update();
    };

    const play = () => {
        if (prefersReducedMotion.matches) return;
        clearInterval(autoplay);
        autoplay = setInterval(() => goTo(index + 1), 5000);
    };

    const pause = () => clearInterval(autoplay);

    if (prev) prev.addEventListener('click', () => { goTo(index - 1); play(); });
    if (next) next.addEventListener('click', () => { goTo(index + 1); play(); });

    carousel.addEventListener('pointerenter', pause);
    carousel.addEventListener('pointerleave', play);

    window.addEventListener('resize', update);

    goTo(0);
    play();
};

const initTestimonialCarousel = () => {
    const container = qs('[data-testimonial-carousel]');
    if (!container) return;
    const track = qs('.testimonials-track', container);
    const testimonials = qsa('[data-testimonial]', track);
    const prev = qs('.testimonial-control.prev', container);
    const next = qs('.testimonial-control.next', container);
    if (!track || !testimonials.length) return;

    let index = 0;
    let autoplay;

    const update = () => {
        const active = testimonials[index];
        const offset = active.offsetLeft;
        track.style.transform = `translateX(-${offset}px)`;
    };

    const goTo = newIndex => {
        index = (newIndex + testimonials.length) % testimonials.length;
        update();
    };

    const play = () => {
        if (prefersReducedMotion.matches) return;
        clearInterval(autoplay);
        autoplay = setInterval(() => goTo(index + 1), 5800);
    };

    const pause = () => clearInterval(autoplay);

    if (prev) prev.addEventListener('click', () => { goTo(index - 1); play(); });
    if (next) next.addEventListener('click', () => { goTo(index + 1); play(); });

    container.addEventListener('pointerenter', pause);
    container.addEventListener('pointerleave', play);
    window.addEventListener('resize', update);

    goTo(0);
    play();
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

    const interactiveSelectors = 'a, button, .btn, [data-hover-tilt], .service-nav-item, .process-step, .case-control, .testimonial-control, .experience-dot';
    const interactives = qsa(interactiveSelectors);

    interactives.forEach(el => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
};

const initReducedMotionListeners = () => {
    if (!prefersReducedMotion.matches) return;
    document.documentElement.classList.add('is-reduced-motion');
    qsa('[data-animate]').forEach(el => {
        el.classList.add('is-visible');
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
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
    initServiceLab();
    initExperienceSlider();
    initProcessNavigator();
    initCaseCarousel();
    initTestimonialCarousel();
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
