/*
  GWANOX SITE INTERACTIONS
  Edit map:
  - [DOM] element hooks
  - [CONFIG] interaction tuning values
  - [DEPTH] tilt, shadows, accelerometer
  - [THEME] color inversion toggle
  - [LAB] hidden image-filter lab
  - [AIM] background aim trainer
  - [TRACE] cursor grid trail
  - [POINTER] mouse, touch, card hover, link ping
*/
(() => {
  /* [DOM] Every required element is cached here. If markup IDs change, update this block. */
  const root = document.documentElement;
  const body = document.body;
  const card = document.querySelector(".micrographic");
  const motionLayer = document.getElementById("motionLayer");
  const themeToggle = document.getElementById("themeToggle");
  const readout = document.getElementById("readout");
  const links = Array.from(document.querySelectorAll(".channel"));
  const aimLayer = document.getElementById("aimLayer");
  const aimHud = document.getElementById("aimHud");
  const aimTime = document.getElementById("aimTime");
  const aimAccuracy = document.getElementById("aimAccuracy");
  const aimLives = document.getElementById("aimLives");
  const aimHits = document.getElementById("aimHits");
  const aimResult = document.getElementById("aimResult");
  const aimSummary = document.getElementById("aimSummary");
  const aimShare = document.getElementById("aimShare");
  const aimClose = document.getElementById("aimClose");
  const filterGamma = document.getElementById("filterGamma");
  const filterLift = document.getElementById("filterLift");
  const filterCutoff = document.getElementById("filterCutoff");
  const filterGammaValue = document.getElementById("filterGammaValue");
  const filterLiftValue = document.getElementById("filterLiftValue");
  const filterCutoffValue = document.getElementById("filterCutoffValue");
  const filterReadout = document.getElementById("filterReadout");
  const filterLab = document.getElementById("filterLab");
  const labGate = document.getElementById("labGate");
  const labCode = document.getElementById("labCode");
  const labEntry = labCode.closest(".access-entry");
  const labGateStatus = document.getElementById("labGateStatus");
  const labClose = document.getElementById("labClose");
  let lastTrace = 0;
  let lastTraceSample = null;
  let idleTimer = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  /* [CONFIG] Tune interaction feel here before touching behavior code. */
  const SITE_CONFIG = {
    trace: {
      lifeMs: 1800,
      sampleMs: 55,
      grid: { hGap: 14, hOffset: 13, vGap: 42, vOffset: 41 }
    },
    tilt: {
      maxXDeg: 1.6,
      maxYDeg: 1.8,
      deviceGammaRange: 18,
      deviceBetaRange: 24,
      deviceSmoothing: .18,
      devicePower: .82
    },
    lab: {
      code: "LAB",
      tableSteps: 12,
      errorMs: 520
    },
    aim: {
      lives: 3,
      idleSize: 46,
      minSize: 28,
      maxSize: 58,
      idleDurationMs: 3200,
      targetDurationMs: 3300,
      spawnPad: 6,
      blockedPad: 18,
      overlayPad: 12,
      pointAttempts: 80,
      hudIntervalMs: 250,
      idleRespawnMs: 900,
      lifeFlashMs: 420,
      shareUrl: "https://gwanox.com",
      shareProgram: "easter_egg.exe",
      shareExit: "DECEASED",
      spawnRamp: {
        earlySeconds: 45,
        earlyStartMs: 1500,
        earlyEndMs: 840,
        midSeconds: 60,
        midEndMs: 790,
        lateMinMs: 560,
        lateDropPerSecond: 4.5
      }
    },
    readout: {
      idleMs: 1600,
      pingMs: 280
    }
  };
  /* [TRACE CONFIG] Cursor grid trail timing and cell spacing. */
  const grid = SITE_CONFIG.trace.grid;
  /* [DEPTH CONFIG] Add selectors here to give new elements parallax/shadow height. */
  const depthSpecs = [
    { selector: ".ticker", depth: -0.18 },
    { selector: ".factory-blip", depth: -0.24 },
    { selector: ".databar", depth: 0.34, text: true },
    { selector: ".theme-toggle", depth: 0.82, surface: true, text: true },
    { selector: ".identity", depth: 0.16, text: true },
    { selector: ".eyebrow span, .eyebrow a", depth: 0.62, surface: true, text: true },
    { selector: "h1", depth: 0.92, text: true },
    { selector: ".lead", depth: 0.36, text: true },
    { selector: ".stat-strip", depth: 0.82 },
    { selector: ".stat-strip span", depth: 0.98, surface: true, text: true },
    { selector: ".image-array", depth: 0.18 },
    { selector: ".portrait", depth: 0.64, surface: true },
    { selector: ".sigil-box", depth: 0.52, surface: true },
    { selector: ".links", depth: 0.1 },
    { selector: ".channel", depth: 0.9, surface: true, text: true },
    { selector: ".link-mail", depth: 0.72, surface: true, text: true },
    { selector: ".scope-line", depth: 0.38, surface: true },
    { selector: ".footerbar", depth: 0.32, text: true },
    { selector: ".access-port", depth: 0.78, surface: true, text: true },
    { selector: ".readout", depth: 0.66, surface: true, text: true },
    { selector: ".aim-hud, .aim-result, .filter-lab", depth: 1.05, surface: true, text: true }
  ];
  const depthNodes = [];
  const seenDepthNodes = new Set();
  depthSpecs.forEach((spec) => {
    document.querySelectorAll(spec.selector).forEach((element) => {
      if (seenDepthNodes.has(element)) return;
      seenDepthNodes.add(element);
      element.classList.add("depth-node");
      if (spec.surface) element.classList.add("depth-surface");
      if (spec.text) element.classList.add("depth-text");
      depthNodes.push({ element, depth: spec.depth });
    });
  });

  const setPixelVar = (element, name, value) => {
    element.style.setProperty(name, `${value.toFixed(2)}px`);
  };

  const updateDepth = (dx = 0, dy = 0) => {
    const panelX = clamp(1.1 + dx * 1.05, -0.45, 2.2);
    const panelY = clamp(1.6 + dy * 1.05, -0.3, 2.7);
    setPixelVar(root, "--panel-shadow-x", panelX);
    setPixelVar(root, "--panel-shadow-y", panelY);
    setPixelVar(root, "--panel-shadow-soft-x", panelX * 1.85);
    setPixelVar(root, "--panel-shadow-soft-y", panelY * 1.85);

    depthNodes.forEach(({ element, depth }) => {
      const lift = Math.max(0.22, Math.abs(depth));
      const x = dx * depth * 5.2;
      const y = dy * depth * 4.2;
      const shadowX = clamp((0.54 + dx * 0.58) * lift, -0.7, 2.1);
      const shadowY = clamp((0.74 + dy * 0.64) * lift, -0.55, 2.3);
      setPixelVar(element, "--depth-x", x);
      setPixelVar(element, "--depth-y", y);
      setPixelVar(element, "--shadow-x", shadowX);
      setPixelVar(element, "--shadow-y", shadowY);
      setPixelVar(element, "--shadow-soft-x", shadowX * 1.9);
      setPixelVar(element, "--shadow-soft-y", shadowY * 1.9);
      setPixelVar(element, "--text-shadow-x", shadowX * 0.38);
      setPixelVar(element, "--text-shadow-y", shadowY * 0.38);
    });
  };

  const applyTilt = (dx = 0, dy = 0, power = 1) => {
    const tiltX = clamp(dx * power, -1, 1);
    const tiltY = clamp(dy * power, -1, 1);
    root.style.setProperty("--tilt-x", `${-tiltY * SITE_CONFIG.tilt.maxXDeg}deg`);
    root.style.setProperty("--tilt-y", `${tiltX * SITE_CONFIG.tilt.maxYDeg}deg`);
    updateDepth(tiltX, tiltY);
  };

  updateDepth();

  const deviceTilt = {
    active: false,
    base: null,
    dx: 0,
    dy: 0,
    frame: 0
  };

  const handleDeviceOrientation = (event) => {
    if (typeof event.beta !== "number" || typeof event.gamma !== "number") return;
    if (!deviceTilt.base) {
      deviceTilt.base = { beta: event.beta, gamma: event.gamma };
    }

    const rawX = clamp((event.gamma - deviceTilt.base.gamma) / SITE_CONFIG.tilt.deviceGammaRange, -1, 1);
    const rawY = clamp((event.beta - deviceTilt.base.beta) / SITE_CONFIG.tilt.deviceBetaRange, -1, 1);
    deviceTilt.dx += (rawX - deviceTilt.dx) * SITE_CONFIG.tilt.deviceSmoothing;
    deviceTilt.dy += (rawY - deviceTilt.dy) * SITE_CONFIG.tilt.deviceSmoothing;

    if (deviceTilt.frame) return;
    deviceTilt.frame = window.requestAnimationFrame(() => {
      deviceTilt.frame = 0;
      applyTilt(deviceTilt.dx, deviceTilt.dy, SITE_CONFIG.tilt.devicePower);
    });
  };

  const installDeviceTilt = () => {
    if (deviceTilt.active || !("DeviceOrientationEvent" in window)) return;
    deviceTilt.active = true;
    window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
  };

  const requestDeviceTilt = () => {
    if (!("DeviceOrientationEvent" in window)) return;
    const orientationApi = window.DeviceOrientationEvent;
    if (orientationApi && typeof orientationApi.requestPermission === "function") {
      orientationApi.requestPermission().then((state) => {
        if (state === "granted") installDeviceTilt();
      }).catch(() => {});
      return;
    }
    installDeviceTilt();
  };

  const primeDeviceTilt = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target && target.closest("a, button, input, textarea, select, label")) return;
    requestDeviceTilt();
    window.removeEventListener("pointerdown", primeDeviceTilt);
    window.removeEventListener("touchstart", primeDeviceTilt);
  };

  requestDeviceTilt();
  window.addEventListener("pointerdown", primeDeviceTilt, { passive: true });
  window.addEventListener("touchstart", primeDeviceTilt, { passive: true });
  window.addEventListener("orientationchange", () => {
    deviceTilt.base = null;
  }, { passive: true });

  const aim = {
    active: false,
    hits: 0,
    shots: 0,
    lives: 3,
    startTime: 0,
    spawnTimer: 0,
    hudTimer: 0,
    lifeFlashTimer: 0,
    id: 0,
    idleBubble: null,
    lastResult: "",
    bubbles: new Map()
  };

  /* [THEME] Two-color inversion and local persistence. */
  const setTheme = (theme) => {
    body.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "paper"));
    try {
      localStorage.setItem("gwanox-theme", theme);
    } catch (error) {
      return;
    }
  };

  try {
    const saved = localStorage.getItem("gwanox-theme");
    if (saved === "paper") setTheme("paper");
  } catch (error) {
    setTheme("dark");
  }

  themeToggle.addEventListener("click", () => {
    const next = body.dataset.theme === "paper" ? "dark" : "paper";
    setTheme(next);
    readout.textContent = next === "paper" ? "INVERT / C4CABD" : "INVERT / 141513";
  });

  const setPhotoFilterValue = (selector, attribute, value) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.setAttribute(attribute, value);
    });
  };

  const imageFilterIds = ["duo-photo-dark", "duo-photo-paper", "duo-logo-dark", "duo-logo-paper"];
  const imageGammaSelector = imageFilterIds
    .map((id) => `#${id} feFuncR[type='gamma'], #${id} feFuncG[type='gamma'], #${id} feFuncB[type='gamma']`)
    .join(", ");
  const imageTableSelector = imageFilterIds
    .map((id) => `#${id} feComponentTransfer[in='lifted'] feFuncR, #${id} feComponentTransfer[in='lifted'] feFuncG, #${id} feComponentTransfer[in='lifted'] feFuncB`)
    .join(", ");

  const getCutoffTable = (cutoff) => {
    const steps = SITE_CONFIG.lab.tableSteps;
    const activeFrom = clamp(Math.round((cutoff / 100) * (steps - 1)), 1, steps - 1);
    return Array.from({ length: steps }, (_, index) => index < activeFrom ? "0" : "1").join(" ");
  };

  const triggerLabGateError = () => {
    labGate.classList.remove("is-error");
    void labGate.offsetWidth;
    labGate.classList.add("is-error");
    labGateStatus.textContent = "ERR";
    readout.textContent = "ACCESS / DENIED";
    window.setTimeout(() => {
      labGate.classList.remove("is-error");
      labGateStatus.textContent = "SYS";
      labCode.value = "";
      labEntry.style.setProperty("--chars", "0");
    }, SITE_CONFIG.lab.errorMs);
  };

  /* [LAB] Hidden image-filter tuning. Code LAB opens this panel. */
  const openFilterLab = () => {
    filterLab.hidden = false;
    labGate.classList.add("is-open");
    labGateStatus.textContent = "LAB";
    labClose.hidden = false;
    labCode.value = "";
    labEntry.style.setProperty("--chars", "0");
    readout.textContent = "FILTER LAB / OPEN";
  };

  const closeFilterLab = () => {
    filterLab.hidden = true;
    labGate.classList.remove("is-open", "is-error");
    labGateStatus.textContent = "SYS";
    labClose.hidden = true;
    labCode.value = "";
    labEntry.style.setProperty("--chars", "0");
    readout.textContent = "FILTER LAB / CLOSED";
  };

  const evaluateLabCode = () => {
    const code = labCode.value.trim().toUpperCase();
    if (!code) return;
    if (code === SITE_CONFIG.lab.code) {
      openFilterLab();
      return;
    }
    triggerLabGateError();
  };

  const applyFilterLab = () => {
    const gamma = Number(filterGamma.value);
    const lift = Number(filterLift.value);
    const cutoff = Number(filterCutoff.value);
    const table = getCutoffTable(cutoff);

    setPhotoFilterValue(imageGammaSelector, "exponent", gamma.toFixed(2));
    setPhotoFilterValue(imageGammaSelector, "offset", lift.toFixed(2));
    setPhotoFilterValue(imageTableSelector, "tableValues", table);

    filterGammaValue.textContent = gamma.toFixed(2);
    filterLiftValue.textContent = lift.toFixed(2);
    filterCutoffValue.textContent = cutoff.toString();
    filterReadout.textContent = `gamma=${gamma.toFixed(2)} lift=${lift.toFixed(2)} cutoff=${cutoff} table=${table}`;
  };

  [filterGamma, filterLift, filterCutoff].forEach((control) => {
    control.addEventListener("input", applyFilterLab);
  });
  applyFilterLab();

  labGate.addEventListener("submit", (event) => {
    event.preventDefault();
    evaluateLabCode();
  });

  labCode.addEventListener("input", () => {
    labCode.value = labCode.value.toUpperCase().replace(/[^A-Z]/g, "");
    labEntry.style.setProperty("--chars", labCode.value.length.toString());
    if (labCode.value.length === 3) evaluateLabCode();
  });

  labClose.addEventListener("click", closeFilterLab);

  /* [AIM] Background aim trainer. Spawn rules avoid the content block and overlays. */
  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const formatAimTime = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getAimAccuracy = () => {
    if (!aim.shots) return 100;
    return Math.round((aim.hits / aim.shots) * 100);
  };

  const updateAimHud = () => {
    const elapsed = aim.active ? performance.now() - aim.startTime : 0;
    aimTime.textContent = formatAimTime(elapsed);
    aimAccuracy.textContent = `${getAimAccuracy()}%`;
    aimLives.textContent = aim.lives;
    aimHits.textContent = aim.hits;
  };

  const flashAimLifeLoss = () => {
    window.clearTimeout(aim.lifeFlashTimer);
    body.classList.remove("is-aim-life-lost");
    void body.offsetWidth;
    body.classList.add("is-aim-life-lost");
    aim.lifeFlashTimer = window.setTimeout(() => {
      body.classList.remove("is-aim-life-lost");
    }, SITE_CONFIG.aim.lifeFlashMs);
  };

  const getElementBlockedRect = (element, radius, extra = SITE_CONFIG.aim.blockedPad) => {
    const rect = element.getBoundingClientRect();
    const pad = radius + extra;
    return {
      left: clamp(rect.left - pad, 0, window.innerWidth),
      right: clamp(rect.right + pad, 0, window.innerWidth),
      top: clamp(rect.top - pad, 0, window.innerHeight),
      bottom: clamp(rect.bottom + pad, 0, window.innerHeight)
    };
  };

  const getBlockedRects = (radius) => {
    const blocked = [getElementBlockedRect(card, radius)];
    [aimHud, aimResult].forEach((element) => {
      if (!element.hidden) blocked.push(getElementBlockedRect(element, radius, SITE_CONFIG.aim.overlayPad));
    });
    return blocked;
  };

  const pointClearsRect = (x, y, radius, blocked) => (
    x + radius < blocked.left ||
    x - radius > blocked.right ||
    y + radius < blocked.top ||
    y - radius > blocked.bottom
  );

  const pointIsClear = (x, y, radius) => {
    return x - radius >= 0 &&
      y - radius >= 0 &&
      x + radius <= window.innerWidth &&
      y + radius <= window.innerHeight &&
      getBlockedRects(radius).every((blocked) => pointClearsRect(x, y, radius, blocked));
  };

  const getBubblePoint = (radius) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (viewportWidth < radius * 2 || viewportHeight < radius * 2) return null;

    for (let attempt = 0; attempt < SITE_CONFIG.aim.pointAttempts; attempt += 1) {
      const x = randomBetween(radius, viewportWidth - radius);
      const y = randomBetween(radius, viewportHeight - radius);
      if (pointIsClear(x, y, radius)) return { x, y };
    }

    const blocked = getElementBlockedRect(card, radius);
    const regions = [
      { left: radius, right: viewportWidth - radius, top: radius, bottom: blocked.top - radius },
      { left: radius, right: viewportWidth - radius, top: blocked.bottom + radius, bottom: viewportHeight - radius },
      { left: radius, right: blocked.left - radius, top: radius, bottom: viewportHeight - radius },
      { left: blocked.right + radius, right: viewportWidth - radius, top: radius, bottom: viewportHeight - radius }
    ].map((region) => ({
      ...region,
      area: Math.max(0, region.right - region.left) * Math.max(0, region.bottom - region.top)
    })).filter((region) => region.area > 0);

    if (!regions.length) return null;

    for (let attempt = 0; attempt < SITE_CONFIG.aim.pointAttempts; attempt += 1) {
      let pick = Math.random() * regions.reduce((sum, region) => sum + region.area, 0);
      const region = regions.find((candidate) => {
        pick -= candidate.area;
        return pick <= 0;
      }) || regions[0];

      const point = {
        x: randomBetween(region.left, region.right),
        y: randomBetween(region.top, region.bottom)
      };
      if (pointIsClear(point.x, point.y, radius)) return point;
    }

    return null;
  };

  const removeAimBubble = (id) => {
    const bubble = aim.bubbles.get(id);
    if (!bubble) return;
    window.clearTimeout(bubble.timeout);
    bubble.el.remove();
    aim.bubbles.delete(id);
  };

  const clearAimBubbles = () => {
    aim.bubbles.forEach((bubble) => {
      window.clearTimeout(bubble.timeout);
      bubble.el.remove();
    });
    aim.bubbles.clear();
  };

  const clearIdleBubble = () => {
    if (!aim.idleBubble) return;
    aim.idleBubble.remove();
    aim.idleBubble = null;
  };

  const buildAimResult = () => {
    const elapsed = performance.now() - aim.startTime;
    return `${SITE_CONFIG.aim.shareUrl} | ${SITE_CONFIG.aim.shareProgram} :: HITS=${aim.hits} ACC=${getAimAccuracy()}% TIME=${formatAimTime(elapsed)} EXIT=${SITE_CONFIG.aim.shareExit}`;
  };

  const endAimGame = () => {
    if (!aim.active) return;
    aim.active = false;
    window.clearTimeout(aim.spawnTimer);
    window.clearInterval(aim.hudTimer);
    aim.lastResult = buildAimResult();
    clearAimBubbles();
    aimHud.hidden = true;
    aimSummary.textContent = aim.lastResult;
    aimShare.textContent = "Copy Score";
    aimResult.hidden = false;
    window.setTimeout(spawnIdleBubble, SITE_CONFIG.aim.idleRespawnMs);
  };

  const expireAimBubble = (id) => {
    if (!aim.active || !aim.bubbles.has(id)) return;
    removeAimBubble(id);
    aim.lives -= 1;
    flashAimLifeLoss();
    updateAimHud();
    if (aim.lives <= 0) endAimGame();
  };

  const hitAimBubble = (id) => {
    if (!aim.active || !aim.bubbles.has(id)) return;
    removeAimBubble(id);
    aim.hits += 1;
    aim.shots += 1;
    updateAimHud();
  };

  const createAimBubble = (idle = false) => {
    const size = idle ? SITE_CONFIG.aim.idleSize : Math.round(randomBetween(SITE_CONFIG.aim.minSize, SITE_CONFIG.aim.maxSize));
    const duration = idle ? SITE_CONFIG.aim.idleDurationMs : SITE_CONFIG.aim.targetDurationMs;
    const point = getBubblePoint(size / 2 + SITE_CONFIG.aim.spawnPad);
    if (!point) return null;

    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = `aim-bubble${idle ? " is-idle" : ""}`;
    bubble.setAttribute("aria-label", idle ? "Start background aim trainer" : "Aim target");
    bubble.style.setProperty("--x", `${point.x}px`);
    bubble.style.setProperty("--y", `${point.y}px`);
    bubble.style.setProperty("--size", `${size}px`);
    bubble.style.setProperty("--duration", `${duration}ms`);
    aimLayer.appendChild(bubble);

    if (idle) {
      bubble.addEventListener("click", (event) => {
        event.stopPropagation();
        startAimGame();
      });
      aim.idleBubble = bubble;
      return bubble;
    }

    const id = aim.id + 1;
    aim.id = id;
    const timeout = window.setTimeout(() => expireAimBubble(id), duration);
    aim.bubbles.set(id, { el: bubble, timeout });
    bubble.addEventListener("click", (event) => {
      event.stopPropagation();
      hitAimBubble(id);
    });
    return bubble;
  };

  const spawnIdleBubble = () => {
    if (aim.active || aim.idleBubble) return;
    createAimBubble(true);
  };

  const spawnGameBubble = () => {
    if (!aim.active) return;
    createAimBubble(false);
  };

  /* Difficulty ramp: faster early, slower after 1 minute. */
  const getSpawnDelay = () => {
    const elapsedSeconds = (performance.now() - aim.startTime) / 1000;
    const ramp = SITE_CONFIG.aim.spawnRamp;

    if (elapsedSeconds <= ramp.earlySeconds) {
      return ramp.earlyStartMs - elapsedSeconds * ((ramp.earlyStartMs - ramp.earlyEndMs) / ramp.earlySeconds);
    }

    if (elapsedSeconds <= ramp.midSeconds) {
      return ramp.earlyEndMs - (elapsedSeconds - ramp.earlySeconds) * ((ramp.earlyEndMs - ramp.midEndMs) / (ramp.midSeconds - ramp.earlySeconds));
    }

    return Math.max(ramp.lateMinMs, ramp.midEndMs - (elapsedSeconds - ramp.midSeconds) * ramp.lateDropPerSecond);
  };

  const scheduleAimSpawn = () => {
    if (!aim.active) return;
    aim.spawnTimer = window.setTimeout(() => {
      spawnGameBubble();
      scheduleAimSpawn();
    }, getSpawnDelay());
  };

  const startAimGame = () => {
    clearIdleBubble();
    clearAimBubbles();
    window.clearTimeout(aim.spawnTimer);
    window.clearInterval(aim.hudTimer);
    window.clearTimeout(aim.lifeFlashTimer);
    body.classList.remove("is-aim-life-lost");
    aim.active = true;
    aim.hits = 0;
    aim.shots = 0;
    aim.lives = SITE_CONFIG.aim.lives;
    aim.startTime = performance.now();
    aimResult.hidden = true;
    aimHud.hidden = false;
    updateAimHud();
    spawnGameBubble();
    scheduleAimSpawn();
    aim.hudTimer = window.setInterval(updateAimHud, SITE_CONFIG.aim.hudIntervalMs);
  };

  const copyAimResult = () => {
    const text = aim.lastResult || buildAimResult();
    const fallbackCopy = () => {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    };

    const copied = navigator.clipboard && window.isSecureContext
      ? navigator.clipboard.writeText(text)
      : Promise.resolve().then(fallbackCopy);

    copied.then(() => {
      aimShare.textContent = "Copied";
    }).catch(() => {
      fallbackCopy();
      aimShare.textContent = "Copied";
    });
  };

  aimLayer.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!aim.active || (target && target.closest(".aim-bubble"))) return;
    aim.shots += 1;
    updateAimHud();
  });

  aimShare.addEventListener("click", copyAimResult);
  aimClose.addEventListener("click", () => {
    aimResult.hidden = true;
  });
  window.addEventListener("resize", () => {
    if (!aim.active) {
      clearIdleBubble();
      spawnIdleBubble();
    }
  });
  spawnIdleBubble();

  /* [TRACE] Cursor trail draws only closest grid-cell segments, then routes gaps. */
  const drawTraceSegment = (kind, x1, y1, x2, y2) => {
    const trace = document.createElement("span");
    trace.className = `grid-trace is-${kind}`;

    if (kind === "h") {
      const left = clamp(Math.min(x1, x2), 0, card.clientWidth);
      const right = clamp(Math.max(x1, x2), 0, card.clientWidth);
      if (right - left < 1) return;
      trace.style.left = `${left}px`;
      trace.style.top = `${clamp(y1, 0, card.clientHeight)}px`;
      trace.style.width = `${right - left}px`;
    } else {
      const top = clamp(Math.min(y1, y2), 0, card.clientHeight);
      const bottom = clamp(Math.max(y1, y2), 0, card.clientHeight);
      if (bottom - top < 1) return;
      trace.style.left = `${clamp(x1, 0, card.clientWidth)}px`;
      trace.style.top = `${top}px`;
      trace.style.height = `${bottom - top}px`;
    }

    motionLayer.appendChild(trace);
    window.setTimeout(() => trace.remove(), SITE_CONFIG.trace.lifeMs);
  };

  const drawHorizontalRoute = (y, x1, x2) => {
    if (x1 === x2) return;
    const direction = x2 > x1 ? 1 : -1;
    let cursor = x1;
    let guard = 0;

    while (((direction > 0 && cursor < x2) || (direction < 0 && cursor > x2)) && guard < 120) {
      const next = direction > 0 ? Math.min(cursor + grid.vGap, x2) : Math.max(cursor - grid.vGap, x2);
      drawTraceSegment("h", cursor, y, next, y);
      cursor = next;
      guard += 1;
    }
  };

  const drawVerticalRoute = (x, y1, y2) => {
    if (y1 === y2) return;
    const direction = y2 > y1 ? 1 : -1;
    let cursor = y1;
    let guard = 0;

    while (((direction > 0 && cursor < y2) || (direction < 0 && cursor > y2)) && guard < 160) {
      const next = direction > 0 ? Math.min(cursor + grid.hGap, y2) : Math.max(cursor - grid.hGap, y2);
      drawTraceSegment("v", x, cursor, x, next);
      cursor = next;
      guard += 1;
    }
  };

  const connectTraceSamples = (from, to) => {
    if (!from) return;
    let start = from.points[0];
    let end = to.points[0];
    let bestDistance = Infinity;

    from.points.forEach((fromPoint) => {
      to.points.forEach((toPoint) => {
        const distance = Math.abs(fromPoint.x - toPoint.x) + Math.abs(fromPoint.y - toPoint.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          start = fromPoint;
          end = toPoint;
        }
      });
    });

    if (to.kind === "h") {
      drawVerticalRoute(start.x, start.y, end.y);
      drawHorizontalRoute(end.y, start.x, end.x);
    } else {
      drawHorizontalRoute(start.y, start.x, end.x);
      drawVerticalRoute(end.x, start.y, end.y);
    }
  };

  const spawnGridTrace = (x, y) => {
    const now = performance.now();
    const horizontal = Math.round((y - grid.hOffset) / grid.hGap) * grid.hGap + grid.hOffset;
    const vertical = Math.round((x - grid.vOffset) / grid.vGap) * grid.vGap + grid.vOffset;
    const useVertical = Math.abs(x - vertical) < Math.abs(y - horizontal);
    let sample;

    if (useVertical) {
      const segmentTop = Math.floor((y - grid.hOffset) / grid.hGap) * grid.hGap + grid.hOffset;
      const segmentBottom = segmentTop + grid.hGap;
      drawTraceSegment("v", vertical, segmentTop, vertical, segmentBottom);
      sample = {
        kind: "v",
        points: [
          { x: vertical, y: segmentTop },
          { x: vertical, y: segmentBottom }
        ],
        time: now
      };
    } else {
      const segmentLeft = Math.floor((x - grid.vOffset) / grid.vGap) * grid.vGap + grid.vOffset;
      const segmentRight = segmentLeft + grid.vGap;
      drawTraceSegment("h", segmentLeft, horizontal, segmentRight, horizontal);
      sample = {
        kind: "h",
        points: [
          { x: segmentLeft, y: horizontal },
          { x: segmentRight, y: horizontal }
        ],
        time: now
      };
    }

    if (lastTraceSample && now - lastTraceSample.time < SITE_CONFIG.trace.lifeMs) {
      connectTraceSamples(lastTraceSample, sample);
    }

    lastTraceSample = sample;
  };

  /* [POINTER] Mouse/accelerometer tilt, readout, card hover and link ping. */
  const setIdle = () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      readout.textContent = "READY / GWAN-00";
    }, SITE_CONFIG.readout.idleMs);
  };

  window.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const dx = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
    const dy = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);
    if (event.pointerType !== "touch") {
      applyTilt(dx, dy);
    }

    const insideCard = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!insideCard) return;

    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    root.style.setProperty("--mx", `${x}px`);
    root.style.setProperty("--my", `${y}px`);

    if (performance.now() - lastTrace > SITE_CONFIG.trace.sampleMs) {
      spawnGridTrace(x, y);
      lastTrace = performance.now();
    }

    const target = event.target instanceof Element ? event.target : null;
    const channel = target ? target.closest(".channel") : null;
    readout.textContent = channel ? (channel.dataset.status || "LINK / ACTIVE") : `TRACE / X${Math.round(x).toString().padStart(3, "0")} Y${Math.round(y).toString().padStart(3, "0")}`;
    setIdle();
  }, { passive: true });

  card.addEventListener("pointerleave", () => {
    lastTraceSample = null;
    readout.textContent = "READY / GWAN-00";
  });

  links.forEach((link, index) => {
    link.addEventListener("pointermove", (event) => {
      const rect = link.getBoundingClientRect();
      link.style.setProperty("--link-x", `${event.clientX - rect.left}px`);
      link.style.setProperty("--link-y", `${event.clientY - rect.top}px`);
    });

    link.addEventListener("pointerenter", () => {
      readout.textContent = link.dataset.status || `LINK / ${index + 1}`;
      card.dataset.hot = link.dataset.id || "";
    });

    link.addEventListener("pointerleave", () => {
      card.dataset.hot = "";
    });

    link.addEventListener("click", () => {
      link.classList.add("is-ping");
      window.setTimeout(() => link.classList.remove("is-ping"), SITE_CONFIG.readout.pingMs);
    });
  });
})();

