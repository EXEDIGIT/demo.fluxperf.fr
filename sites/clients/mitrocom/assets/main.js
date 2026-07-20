(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const navShell = document.querySelector('.nav-shell');
  const menuButton = document.querySelector('.menu-toggle');
  const navPanel = document.getElementById('primary-navigation');
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('js-ready');

  const setMenu = (open) => {
    if (!menuButton || !navShell) return;

    navShell.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    body.classList.toggle('menu-open', open);
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navPanel?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (
      menuButton?.getAttribute('aria-expanded') === 'true' &&
      !navPanel?.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  document.querySelectorAll('[data-reveal-delay]').forEach((element) => {
    element.style.setProperty('--reveal-delay', element.dataset.revealDelay);
  });

  const revealElements = document.querySelectorAll('[data-reveal]');

  if (!motionQuery.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-current', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    });

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  let frameRequested = false;

  const updateScrollEffects = () => {
    const scrollTop = window.scrollY;
    header?.classList.toggle('is-scrolled', scrollTop > 28);

    if (!motionQuery.matches && scrollTop < window.innerHeight * 1.2) {
      const offset = Math.min(scrollTop * 0.035, 20);
      root.style.setProperty('--hero-scroll', offset.toFixed(2));
    } else {
      root.style.setProperty('--hero-scroll', '0');
    }

    frameRequested = false;
  };

  const requestScrollUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  motionQuery.addEventListener?.('change', requestScrollUpdate);
  updateScrollEffects();

  const contactForm = document.querySelector('[data-contact-form]');
  const formStatus = contactForm?.querySelector('[data-form-status]');

  const setFieldError = (field, message = '') => {
    const fieldContainer = field.closest('.form-field');
    const errorElement = fieldContainer?.querySelector('.field-error');

    fieldContainer?.classList.toggle('is-invalid', Boolean(message));
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (errorElement) errorElement.textContent = message;
  };

  const getFieldError = (field) => {
    if (field.required && !field.value.trim()) {
      const missingMessages = {
        name: 'Indiquez votre nom et prénom.',
        email: 'Indiquez votre email professionnel.',
        company: 'Indiquez votre entreprise.',
        need: 'Sélectionnez votre besoin principal.',
        message: 'Décrivez brièvement votre projet.'
      };

      return missingMessages[field.name] || 'Ce champ est obligatoire.';
    }

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
      return 'Saisissez une adresse email valide.';
    }

    return '';
  };

  const setFormStatus = (message, state) => {
    if (!formStatus) return;

    formStatus.textContent = message;
    formStatus.classList.remove('is-error', 'is-success');
    formStatus.classList.add('is-visible', `is-${state}`);
  };

  contactForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';

    field.addEventListener(eventName, () => {
      if (field.hasAttribute('aria-invalid')) setFieldError(field, getFieldError(field));
    });
  });

  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const fields = [...contactForm.querySelectorAll('input, select, textarea')];
    let firstInvalidField = null;

    fields.forEach((field) => {
      const error = getFieldError(field);
      setFieldError(field, error);
      if (error && !firstInvalidField) firstInvalidField = field;
    });

    if (firstInvalidField) {
      setFormStatus('Vérifiez les champs indiqués avant de poursuivre. Aucune donnée n’a été transmise.', 'error');
      firstInvalidField.focus();
      return;
    }

    setFormStatus('Le formulaire est correctement rempli. Cette démo n’envoie, ne transmet ni ne conserve aucune donnée.', 'success');
  });

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
