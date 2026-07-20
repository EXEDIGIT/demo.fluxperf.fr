(function () {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const navDesktop = document.getElementById("nav-main");
  const overlay = document.getElementById("nav-overlay");
  const siteHeader = document.querySelector(".site-header");

  function updateHeaderState() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  function setNavOpen(open) {
    body.classList.toggle("nav-open", open);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute(
        "aria-label",
        open ? "Fermer le menu" : "Ouvrir le menu"
      );
    }
  }

  if (menuToggle && navDesktop) {
    menuToggle.addEventListener("click", () => {
      setNavOpen(!body.classList.contains("nav-open"));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => setNavOpen(false));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  const mqMobile = window.matchMedia("(max-width: 900px)");

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-item.is-open").forEach((el) => {
      el.classList.remove("is-open");
      const t = el.querySelector(".nav-trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll(".nav-item.has-dropdown").forEach((item) => {
    const trigger = item.querySelector(".nav-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", (e) => {
      if (!mqMobile.matches) return;
      e.preventDefault();
      const open = item.classList.contains("is-open");
      closeAllDropdowns();
      if (!open) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  mqMobile.addEventListener("change", () => {
    if (!mqMobile.matches) closeAllDropdowns();
  });

  document.querySelectorAll("#nav-main a").forEach((a) => {
    a.addEventListener("click", () => {
      if (mqMobile.matches) setNavOpen(false);
    });
  });

  /* Pagination démo */
  const pag = document.querySelector(".pagination");
  if (pag) {
    pag.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-page]");
      if (!btn) return;
      const page = btn.getAttribute("data-page");
      if (!page || page === "ellipsis" || page === "prev" || page === "next")
        return;
      pag.querySelectorAll("button[data-page]").forEach((b) => {
        const p = b.getAttribute("data-page");
        if (p === "prev" || p === "next" || p === "ellipsis") return;
        b.classList.toggle("is-active", p === page);
      });
    });
  }

  /* Formulaire démo (pas d’envoi réel) */
  const form = document.getElementById("devis-form");
  const formOk = document.getElementById("form-success");
  const formErr = document.getElementById("form-error");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (formErr) formErr.classList.remove("is-visible");
      if (formOk) formOk.classList.add("is-visible");
      form.reset();
    });
  }

  /* Compteurs animés dans le hero */
  const heroCounters = document.querySelectorAll("[data-counter]");
  const heroStatsGroup = document.querySelector(".hero-stats-group");

  function animateCounter(el) {
    const target = Number(el.getAttribute("data-target") || "0");
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    const durationMs = 1300;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if (heroCounters.length) {
    const runHeroCounters = () => heroCounters.forEach((el) => animateCounter(el));
    if ("IntersectionObserver" in window && heroStatsGroup) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runHeroCounters();
            counterObserver.disconnect();
          });
        },
        { threshold: 0.35 }
      );
      counterObserver.observe(heroStatsGroup);
    } else {
      runHeroCounters();
    }
  }

  /* Effet fondu au scroll sur chaque section */
  const revealTargets = document.querySelectorAll("section, footer.site-footer");
  if (revealTargets.length) {
    revealTargets.forEach((el) => el.classList.add("reveal-on-scroll"));

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        {
          threshold: 0.14,
          rootMargin: "0px 0px -8% 0px",
        }
      );

      revealTargets.forEach((el) => revealObserver.observe(el));
    } else {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    }
  }
})();
