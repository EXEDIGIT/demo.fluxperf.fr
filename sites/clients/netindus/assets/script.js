const header = document.querySelector("[data-header]");
const nav = document.querySelector("#site-nav");
const navToggle = document.querySelector(".nav-toggle");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const counterElements = document.querySelectorAll("[data-counter]");
const referenceCoverflows = document.querySelectorAll("[data-reference-coverflow]");
const testimonialCarousels = document.querySelectorAll("[data-testimonial-carousel]");
const faqItems = document.querySelectorAll(".faq-list details");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navToggle.classList.toggle("is-open", !isOpen);
  nav?.classList.toggle("is-open", !isOpen);
});

nav?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLAnchorElement) {
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.classList.remove("is-open");
    nav.classList.remove("is-open");
  }
});

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.removeAttribute("open");
        }
      });
    }
  });
});

const revealElements = document.querySelectorAll(".reveal");

const initTestimonialCarousel = (carousel) => {
  const track = carousel.querySelector("[data-testimonial-track]");

  if (!track) {
    return;
  }

  const cards = Array.from(track.children);

  if (cards.length <= 3 || prefersReducedMotion) {
    return;
  }

  let visibleCount = 3;
  let currentIndex = 0;
  let intervalId;
  let resizeTimer;

  const getVisibleCount = () => {
    const value = Number.parseInt(
      getComputedStyle(carousel).getPropertyValue("--testimonial-columns"),
      10
    );

    return Number.isFinite(value) ? value : 3;
  };

  const getStepSize = () => {
    const firstCard = track.querySelector(".testimonial-card");
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;

    return firstCard ? firstCard.getBoundingClientRect().width + gap : 0;
  };

  const setPosition = (withTransition = true) => {
    track.classList.toggle("is-resetting", !withTransition);
    track.style.transform = `translateX(${-currentIndex * getStepSize()}px)`;

    if (!withTransition) {
      requestAnimationFrame(() => {
        track.classList.remove("is-resetting");
      });
    }
  };

  const stop = () => {
    window.clearInterval(intervalId);
    intervalId = undefined;
  };

  const start = () => {
    stop();

    if (cards.length <= visibleCount) {
      return;
    }

    intervalId = window.setInterval(() => {
      if (carousel.matches(":hover") || carousel.contains(document.activeElement)) {
        return;
      }

      currentIndex += 1;
      setPosition();
    }, 4000);
  };

  const removeClones = () => {
    track.querySelectorAll("[data-testimonial-clone]").forEach((clone) => clone.remove());
  };

  const rebuild = () => {
    stop();
    removeClones();
    visibleCount = getVisibleCount();
    currentIndex = 0;

    cards.slice(0, visibleCount).forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("data-testimonial-clone", "true");
      clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    });

    setPosition(false);
    start();
  };

  track.addEventListener("transitionend", () => {
    if (currentIndex < cards.length) {
      return;
    }

    currentIndex = 0;
    setPosition(false);
  });

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("pointerenter", stop);
  carousel.addEventListener("pointerleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      start();
    }
  });

  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 180);
    },
    { passive: true }
  );

  rebuild();
};

testimonialCarousels.forEach((carousel) => initTestimonialCarousel(carousel));

const initReferenceCoverflow = (root) => {
  const slides = [...root.querySelectorAll(".reference-coverflow__slide")];
  const dotsWrap = root.querySelector("[data-reference-coverflow-dots]");
  const prevBtn = root.querySelector(".reference-coverflow__nav--prev");
  const nextBtn = root.querySelector(".reference-coverflow__nav--next");

  if (!dotsWrap || slides.length === 0) {
    return;
  }

  let activeIndex = 0;
  let timer = null;

  dotsWrap.textContent = "";

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "reference-coverflow__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Afficher la photo ${index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dotsWrap.appendChild(dot);
    return dot;
  });

  const getShortestOffset = (index) => {
    const total = slides.length;
    let offset = index - activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

  const render = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const spacing = isMobile ? 155 : 245;
    const visibleSideCount = isMobile ? 1 : 2;
    const rotateIntensity = isMobile ? 24 : 32;

    slides.forEach((slide, index) => {
      const offset = getShortestOffset(index);
      const abs = Math.abs(offset);
      const isVisible = abs <= visibleSideCount;
      const x = offset * spacing;
      const rotateY = offset === 0 ? 0 : -offset * rotateIntensity;
      const scale = Math.max(0.74, 1 - abs * 0.12);
      const z = 110 - abs * 78;
      const opacity = isVisible ? Math.max(0.2, 1 - abs * 0.26) : 0;
      const brightness = Math.max(0.58, 1 - abs * 0.14);
      const saturation = Math.max(0.82, 1 - abs * 0.045);

      slide.style.zIndex = String(100 - abs);
      slide.style.opacity = String(opacity);
      slide.style.filter = `brightness(${brightness}) saturate(${saturation})`;
      slide.style.transform = `
        translate3d(calc(-50% + ${x}px), -50%, ${z}px)
        rotateY(${rotateY}deg)
        scale(${scale})
      `;
      slide.setAttribute("aria-hidden", abs === 0 ? "false" : "true");
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const stopAutoplay = () => {
    if (timer) {
      window.clearInterval(timer);
    }

    timer = null;
  };

  const startAutoplay = () => {
    if (prefersReducedMotion || slides.length < 2) {
      return;
    }

    stopAutoplay();
    timer = window.setInterval(() => goTo(activeIndex + 1), 2800);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  function goTo(index) {
    activeIndex = (index + slides.length) % slides.length;
    render();
    restartAutoplay();
  }

  prevBtn?.addEventListener("click", () => goTo(activeIndex - 1));
  nextBtn?.addEventListener("click", () => goTo(activeIndex + 1));
  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", startAutoplay);
  window.addEventListener("resize", render);

  render();
  startAutoplay();
};

referenceCoverflows.forEach((coverflow) => initReferenceCoverflow(coverflow));

const formatCounterValue = (element, value) => {
  const suffix = element.dataset.counterSuffix ?? "";
  return `${Math.round(value)}${suffix}`;
};

const setCounterValue = (element, value) => {
  element.textContent = formatCounterValue(element, value);
};

const wait = (duration) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const completeCounter = (element) => {
  const endValue = Number(element.dataset.counterEnd);

  if (Number.isFinite(endValue)) {
    setCounterValue(element, endValue);
  }
};

let countersSequenceStarted = false;

const animateCounter = (element) =>
  new Promise((resolve) => {
    if (element.dataset.counterAnimated === "true") {
      resolve();
      return;
    }

    element.dataset.counterAnimated = "true";

    const startValue = Number(element.dataset.counterStart) || 0;
    const endValue = Number(element.dataset.counterEnd);
    const duration = Number(element.dataset.counterDuration) || 1700;

    if (!Number.isFinite(endValue) || prefersReducedMotion) {
      completeCounter(element);
      resolve();
      return;
    }

    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setCounterValue(element, currentValue);

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      completeCounter(element);
      resolve();
    };

    setCounterValue(element, startValue);
    requestAnimationFrame(tick);
  });

const animateCountersSequence = async () => {
  if (countersSequenceStarted) {
    return;
  }

  countersSequenceStarted = true;

  for (const element of counterElements) {
    await animateCounter(element);

    if (!prefersReducedMotion) {
      await wait(160);
    }
  }
};

if (prefersReducedMotion) {
  counterElements.forEach((element) => completeCounter(element));
} else {
  counterElements.forEach((element) => {
    setCounterValue(element, Number(element.dataset.counterStart) || 0);
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));

  const counterObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        counterElements.forEach((element) => counterObserver.unobserve(element));
        animateCountersSequence();
      }
    },
    { threshold: 0.35 }
  );

  counterElements.forEach((element) => counterObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
  counterElements.forEach((element) => completeCounter(element));
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  formStatus.textContent =
    "Merci, votre demande a bien été prise en compte. L'équipe Netindus vous recontactera rapidement.";
  contactForm.reset();
});
