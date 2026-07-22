const views = ["all", "desktop", "tablet", "mobile"];
const stage = document.querySelector("#preview-stage");
const buttons = document.querySelectorAll(".switcher-button");
const projectName = document.querySelector("#project-name");
const siteViewports = document.querySelectorAll(".site-viewport");
const defaultClientName = "Bonneau Chapalain";

const viewportSizes = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
};

function getClientName() {
  const params = new URLSearchParams(window.location.search);
  const clientName = params.get("client")?.trim();

  return clientName || defaultClientName;
}

function slugifyClientName(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const clientName = getClientName();
const clientSlug = slugifyClientName(clientName) || slugifyClientName(defaultClientName);
const clientSitePath = `clients/${clientSlug}/index.html`;

function hydrateClientContext() {
  document.title = `Fluxperf® · Visionneuse site · ${clientName}`;

  if (projectName) {
    projectName.textContent = `DÉMO SITE · ${clientName}`;
  }

  siteViewports.forEach((iframe) => {
    const device = iframe.dataset.siteViewport;
    const deviceLabel = {
      desktop: "desktop",
      tablet: "tablette",
      mobile: "mobile",
    }[device] || device;

    iframe.src = clientSitePath;
    iframe.title = `Site ${clientName} en ${deviceLabel}`;
  });
}

function syncViewportScale(iframe) {
  const device = iframe.dataset.siteViewport;
  const screen = iframe.closest(".device-screen");
  const targetWidth = viewportSizes[device];

  if (!screen || !targetWidth || screen.clientWidth === 0 || screen.clientHeight === 0) {
    return;
  }

  const scale = screen.clientWidth / targetWidth;
  const targetHeight = Math.max(Math.ceil(screen.clientHeight / scale), screen.clientHeight);

  iframe.style.setProperty("--site-width", `${targetWidth}px`);
  iframe.style.setProperty("--site-height", `${targetHeight}px`);
  iframe.style.setProperty("--site-scale", String(scale));
}

function syncAllViewportScales() {
  siteViewports.forEach(syncViewportScale);
}

function hydrateSiteViewports() {
  siteViewports.forEach((iframe) => {
    const screen = iframe.closest(".device-screen");

    iframe.addEventListener("load", () => {
      screen.classList.add("has-site");
      screen.classList.remove("is-missing");
      syncViewportScale(iframe);
    });

    iframe.addEventListener("error", () => {
      screen.classList.remove("has-site");
      screen.classList.add("is-missing");
    });

    syncViewportScale(iframe);
  });
}

function resetDeviceScroll(view) {
  const devicesToReset = view === "all" ? ["desktop", "tablet", "mobile"] : [view];

  devicesToReset.forEach((device) => {
    const iframe = document.querySelector(`[data-site-viewport="${device}"]`);

    if (!iframe) {
      return;
    }

    try {
      iframe.contentWindow.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    } catch {
      iframe.contentWindow.location.reload();
    }
  });
}

function setActiveView(view) {
  if (!views.includes(view)) {
    return;
  }

  stage.className = `preview-stage view-${view}`;

  buttons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  window.requestAnimationFrame(syncAllViewportScales);
  resetDeviceScroll(view);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isEditable = target.matches("input, textarea, select, [contenteditable='true']");

  if (isEditable || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  const keyboardMap = {
    1: "all",
    2: "desktop",
    3: "tablet",
    4: "mobile",
  };

  if (keyboardMap[event.key]) {
    event.preventDefault();
    setActiveView(keyboardMap[event.key]);
  }
});

hydrateClientContext();
hydrateSiteViewports();

window.addEventListener("resize", syncAllViewportScales);

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(syncAllViewportScales);
  document.querySelectorAll(".device-screen").forEach((screen) => resizeObserver.observe(screen));
}
