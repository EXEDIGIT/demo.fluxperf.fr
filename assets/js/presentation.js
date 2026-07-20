(function () {
  const shell = document.querySelector("[data-deck-shell]");
  const stage = document.querySelector(".deck-stage");
  const slides = Array.from(document.querySelectorAll("[data-slide]"));
  const prevButtons = Array.from(document.querySelectorAll("[data-prev]"));
  const nextButtons = Array.from(document.querySelectorAll("[data-next]"));
  const fullscreenButtons = Array.from(document.querySelectorAll("[data-fullscreen]"));
  const progress = document.querySelector("[data-progress]");
  const count = document.querySelector("[data-slide-count]");
  const fullscreenMessage = document.querySelector("[data-fullscreen-message]");

  if (!shell || !stage || !slides.length) {
    return;
  }

  const getClientConfig = () => {
    const params = new URLSearchParams(window.location.search);
    const rawClientName = params.get("client")?.trim() || "";
    const clientName = rawClientName || "votre entreprise";
    const clientSlug = clientName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u0153]/g, "oe")
      .replace(/[\u00e6]/g, "ae")
      .replace(/['\u2019]/g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "votre-entreprise";

    return {
      clientName,
      clientSlug,
      hasCustomClient: Boolean(rawClientName),
    };
  };

  const replaceClientText = (clientName) => {
    const excludedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG"]);
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || parent.closest("script, style, noscript, svg")) {
            return NodeFilter.FILTER_REJECT;
          }

          if (excludedTags.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          return /votre entreprise/i.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      },
    );

    const matchingNodes = [];
    while (walker.nextNode()) {
      matchingNodes.push(walker.currentNode);
    }

    matchingNodes.forEach((node) => {
      node.nodeValue = node.nodeValue.replace(/votre entreprise/gi, clientName);
    });
  };

  const updateClientLogo = ({ clientName, clientSlug, hasCustomClient }) => {
    const logo = document.querySelector(".client-logo");
    const slideLogo = document.querySelector("[data-client-logo-replacement]");
    const slide4LogoSlots = Array.from(document.querySelectorAll("[data-slide4-client-logo]"));

    const fallbackLogo = "logos/votre-entreprise.png";
    const clientLogo = `logos/${clientSlug}.png`;
    const fluxperfLogo = "assets/img/logo-fluxperf.svg";

    const clearSlide4Logos = () => {
      slide4LogoSlots.forEach((slot) => {
        const image = slot.querySelector("img");
        slot.classList.remove("is-visible");
        if (image) {
          image.removeAttribute("src");
          image.alt = "";
        }
      });
    };

    const setSlide4Logos = (src, alt) => {
      slide4LogoSlots.forEach((slot) => {
        const image = slot.querySelector("img");
        if (image) {
          image.src = src;
          image.alt = alt;
          slot.classList.add("is-visible");
        }
      });
    };

    clearSlide4Logos();

    if (!logo) {
      return;
    }

    logo.alt = clientName;
    logo.onerror = () => {
      if (logo.getAttribute("src") !== fallbackLogo) {
        logo.src = fallbackLogo;
      }
      clearSlide4Logos();
    };
    logo.onload = () => {
      const isCustomClientLogo = hasCustomClient && logo.getAttribute("src") === clientLogo;
      if (hasCustomClient && logo.getAttribute("src") === clientLogo && slideLogo) {
        slideLogo.src = clientLogo;
        slideLogo.alt = clientName;
      }
      if (isCustomClientLogo) {
        setSlide4Logos(clientLogo, clientName);
      } else {
        clearSlide4Logos();
      }
    };
    if (slideLogo) {
      slideLogo.src = fluxperfLogo;
      slideLogo.alt = "Fluxperf";
    }
    logo.src = clientLogo;
  };

  const clientConfig = getClientConfig();
  if (clientConfig.hasCustomClient) {
    replaceClientText(clientConfig.clientName);
  }
  updateClientLogo(clientConfig);

  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let messageTimer = null;
  let parallaxFrame = null;
  let coverParallaxTargetX = 0;
  let coverParallaxTargetY = 0;
  let coverParallaxCurrentX = 0;
  let coverParallaxCurrentY = 0;
  let problemParallaxFrame = null;
  let problemParallaxTargetX = 0;
  let problemParallaxTargetY = 0;
  let problemParallaxCurrentX = 0;
  let problemParallaxCurrentY = 0;

  const pad = (value) => String(value).padStart(2, "0");

  const showMessage = (message) => {
    if (!fullscreenMessage) {
      return;
    }

    fullscreenMessage.textContent = message;
    fullscreenMessage.classList.add("is-visible");
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => {
      fullscreenMessage.classList.remove("is-visible");
    }, 3200);
  };

  const updateSlide = (nextIndex) => {
    const boundedIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));

    const isSameVisibleSlide = boundedIndex === currentIndex && slides[boundedIndex].classList.contains("is-active");

    if (isSameVisibleSlide && count?.textContent.trim() === `${pad(currentIndex + 1)} / ${pad(slides.length)}` && progress?.style.width) {
      return;
    }

    if (!isSameVisibleSlide) {
      slides[currentIndex]?.classList.add("is-exiting");
    }

    slides.forEach((slide, index) => {
      const isActive = index === boundedIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    if (!isSameVisibleSlide) {
      window.setTimeout(() => {
        slides.forEach((slide) => slide.classList.remove("is-exiting"));
      }, 430);
    }

    currentIndex = boundedIndex;

    const progressWidth = ((currentIndex + 1) / slides.length) * 100;
    if (progress) {
      progress.style.width = `${progressWidth}%`;
    }

    if (count) {
      count.textContent = `${pad(currentIndex + 1)} / ${pad(slides.length)}`;
    }

    prevButtons.forEach((button) => {
      button.disabled = currentIndex === 0;
    });

    nextButtons.forEach((button) => {
      button.disabled = currentIndex === slides.length - 1;
    });
  };

  const next = () => updateSlide(currentIndex + 1);
  const prev = () => updateSlide(currentIndex - 1);

  const requestFullscreen = async () => {
    if (!document.fullscreenEnabled || !shell.requestFullscreen) {
      showMessage("Le plein ecran n'est pas disponible ici. Vous pouvez utiliser le mode fenetre ou F11.");
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch (error) {
      showMessage("Le navigateur a refuse le plein ecran. Lancez-le depuis le bouton ou utilisez F11.");
    }
  };

  const syncFullscreenState = () => {
    const isFullscreen = document.fullscreenElement === shell;
    shell.classList.toggle("is-fullscreen", isFullscreen);
    fullscreenButtons.forEach((button) => {
      button.setAttribute("aria-label", isFullscreen ? "Quitter le mode plein ecran" : "Lancer le mode plein ecran");
    });
  };

  prevButtons.forEach((button) => button.addEventListener("click", prev));
  nextButtons.forEach((button) => button.addEventListener("click", next));
  fullscreenButtons.forEach((button) => button.addEventListener("click", requestFullscreen));

  document.addEventListener("fullscreenchange", syncFullscreenState);

  const coverVisual = document.querySelector(".cover-visual");
  const problemVisual = document.querySelector(".problem-visual");
  const allowMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animateCoverParallax = () => {
    coverParallaxCurrentX += (coverParallaxTargetX - coverParallaxCurrentX) * 0.12;
    coverParallaxCurrentY += (coverParallaxTargetY - coverParallaxCurrentY) * 0.12;

    coverVisual.style.setProperty("--cover-parallax-x", coverParallaxCurrentX.toFixed(3));
    coverVisual.style.setProperty("--cover-parallax-y", coverParallaxCurrentY.toFixed(3));

    if (Math.abs(coverParallaxTargetX - coverParallaxCurrentX) > 0.003 || Math.abs(coverParallaxTargetY - coverParallaxCurrentY) > 0.003) {
      parallaxFrame = window.requestAnimationFrame(animateCoverParallax);
    } else {
      parallaxFrame = null;
    }
  };

  const requestCoverParallaxFrame = () => {
    if (!parallaxFrame) {
      parallaxFrame = window.requestAnimationFrame(animateCoverParallax);
    }
  };

  if (coverVisual && allowMotion) {
    coverVisual.addEventListener("pointermove", (event) => {
      const rect = coverVisual.getBoundingClientRect();
      coverParallaxTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      coverParallaxTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      requestCoverParallaxFrame();
    });

    coverVisual.addEventListener("pointerleave", () => {
      coverParallaxTargetX = 0;
      coverParallaxTargetY = 0;
      requestCoverParallaxFrame();
    });
  }

  const animateProblemParallax = () => {
    problemParallaxCurrentX += (problemParallaxTargetX - problemParallaxCurrentX) * 0.1;
    problemParallaxCurrentY += (problemParallaxTargetY - problemParallaxCurrentY) * 0.1;

    problemVisual.style.setProperty("--problem-parallax-x", problemParallaxCurrentX.toFixed(3));
    problemVisual.style.setProperty("--problem-parallax-y", problemParallaxCurrentY.toFixed(3));

    if (Math.abs(problemParallaxTargetX - problemParallaxCurrentX) > 0.003 || Math.abs(problemParallaxTargetY - problemParallaxCurrentY) > 0.003) {
      problemParallaxFrame = window.requestAnimationFrame(animateProblemParallax);
    } else {
      problemParallaxFrame = null;
    }
  };

  const requestProblemParallaxFrame = () => {
    if (!problemParallaxFrame) {
      problemParallaxFrame = window.requestAnimationFrame(animateProblemParallax);
    }
  };

  if (problemVisual && allowMotion) {
    problemVisual.addEventListener("pointermove", (event) => {
      const rect = problemVisual.getBoundingClientRect();
      problemParallaxTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      problemParallaxTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      requestProblemParallaxFrame();
    });

    problemVisual.addEventListener("pointerleave", () => {
      problemParallaxTargetX = 0;
      problemParallaxTargetY = 0;
      requestProblemParallaxFrame();
    });
  }

  document.addEventListener("keydown", (event) => {
    const tagName = document.activeElement?.tagName;
    const isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || document.activeElement?.isContentEditable;

    if (isTyping) {
      return;
    }

    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        event.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        prev();
        break;
      case "Home":
        event.preventDefault();
        updateSlide(0);
        break;
      case "End":
        event.preventDefault();
        updateSlide(slides.length - 1);
        break;
      case "f":
      case "F":
        event.preventDefault();
        requestFullscreen();
        break;
      default:
        break;
    }
  });

  stage.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  stage.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      next();
    } else {
      prev();
    }
  }, { passive: true });

  updateSlide(0);
})();
