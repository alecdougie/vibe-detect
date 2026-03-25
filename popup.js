// Popup script - terminal-style vibe code detection display

const categoryTags = {
  techstack: "TECH",
  source: "SRCE",
  content: "CNTN",
  design: "DSGN",
  security: "SECU",
  infra: "INFR",
  runtime: "RNTM",
};

// Static registry of all known signals for "Show All" feature
const ALL_KNOWN_SIGNALS = [
  { category: "techstack", name: "Next.js detected" },
  { category: "techstack", name: "React detected" },
  { category: "techstack", name: "Vite build" },
  { category: "techstack", name: "Astro detected" },
  { category: "techstack", name: "Svelte detected" },
  { category: "techstack", name: "Vue/Nuxt detected" },
  { category: "techstack", name: "shadcn/ui components" },
  { category: "techstack", name: "Radix UI primitives" },
  { category: "techstack", name: "Tailwind CSS" },
  { category: "techstack", name: "Framer Motion" },
  { category: "techstack", name: "Supabase client" },
  { category: "techstack", name: "Firebase client" },
  { category: "techstack", name: "Convex client" },
  { category: "techstack", name: "Clerk auth" },
  { category: "techstack", name: "Auth0 client" },
  { category: "techstack", name: "OpenAI API calls" },
  { category: "techstack", name: "Anthropic API calls" },
  { category: "techstack", name: "Stripe client" },
  { category: "source", name: "AI-generated comments" },
  { category: "source", name: "TODO/FIXME density" },
  { category: "source", name: "Console statements" },
  { category: "source", name: "Commented-out code" },
  { category: "source", name: "Missing lang attribute" },
  { category: "content", name: "Lorem ipsum" },
  { category: "content", name: "Placeholder references" },
  { category: "content", name: "AI marketing copy" },
  { category: "content", name: "AI buzzword density" },
  { category: "content", name: "Default page title" },
  { category: "content", name: "Missing meta description" },
  { category: "content", name: "Generic meta description" },
  { category: "content", name: "Cookie-cutter landing page" },
  { category: "content", name: "Copyright typo \"reversed\"" },
  { category: "content", name: "Built-with badge" },
  { category: "design", name: "Lucide icons" },
  { category: "design", name: "Default shadcn theme" },
  { category: "design", name: "Gradient hero section" },
  { category: "design", name: "3-column card grid" },
  { category: "design", name: "Dark mode toggle" },
  { category: "design", name: "Inconsistent border-radius" },
  { category: "design", name: "Default AI font" },
  { category: "design", name: "Glassmorphism header" },
  { category: "design", name: "3-tier pricing template" },
  { category: "security", name: "Missing alt text" },
  { category: "security", name: "Inaccessible buttons" },
  { category: "security", name: "Missing form labels" },
  { category: "security", name: "Error overlay in production" },
  { category: "infra", name: "Free-tier hosting" },
  { category: "infra", name: "Vercel hosting (custom domain)" },
  { category: "infra", name: "Vercel Analytics" },
  { category: "infra", name: "No OG image" },
  { category: "infra", name: "No Open Graph tags" },
  { category: "infra", name: "No favicon" },
  { category: "infra", name: "Default framework favicon" },
  { category: "runtime", name: "No lazy loading" },
  { category: "runtime", name: "Unoptimized images" },
  { category: "runtime", name: "Dead links" },
  { category: "runtime", name: "Broken social links" },
];

function getScoreColor(score) {
  if (score < 20) return "#33ff33";
  if (score < 45) return "#ff8800";
  if (score < 70) return "#ff6600";
  return "#ff3333";
}

function getWeightColor(weight) {
  if (weight <= 1) return "#33ff33";
  if (weight <= 2) return "#ffaa00";
  if (weight <= 3) return "#ff6600";
  return "#ff3333";
}

function getVerdict(score) {
  if (score < 20)
    return { text: "HUMAN CRAFTED", cssClass: "verdict-status-clean" };
  if (score < 45)
    return { text: "AI ASSISTED", cssClass: "verdict-status-suspicious" };
  if (score < 70)
    return { text: "MOSTLY VIBED", cssClass: "verdict-status-vibe" };
  return { text: "PURE VIBES", cssClass: "verdict-status-maximum" };
}

function buildBar(score, totalChars) {
  const filled = Math.round((score / 100) * totalChars);
  const empty = totalChars - filled;
  return {
    filledStr: "\u2588".repeat(filled),
    emptyStr: "\u2591".repeat(empty),
  };
}

function animateScore(target) {
  const el = document.getElementById("score-number");
  const barEl = document.getElementById("score-bar");
  const color = getScoreColor(target);

  el.style.color = color;
  barEl.innerHTML = '<div class="score-bar-fill" style="background:' + color + ';width:0%"></div>';
  const fillEl = barEl.querySelector(".score-bar-fill");

  let current = 0;
  const step = () => {
    if (current <= target) {
      el.textContent = String(current).padStart(3, " ") + "/100";
      fillEl.style.width = current + "%";
      current++;
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function padDots() {
  return " " + ".".repeat(80) + " ";
}

function renderCategoryBar(capped, cap) {
  const pct = Math.round((capped / cap) * 100);
  const color = pct < 30 ? "#33ff33" : pct < 60 ? "#ffaa00" : pct < 85 ? "#ff6600" : "#ff3333";
  return '<div class="cat-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>';
}

let hasRendered = false;
let currentResult = null;

function renderResults(data) {
  if (hasRendered) return;
  hasRendered = true;
  currentResult = data;

  document.getElementById("ready").style.display = "none";
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("empty").style.display = "none";

  if (data.vibeScore >= 20) {
    SoundEngine.alert();
  } else {
    SoundEngine.results();
  }

  const {
    vibeScore, signals, negativeSignals, totalSignals, hostname,
    categoryScores, multiplierApplied, totalReduction, rawScore,
  } = data;

  // Score
  animateScore(vibeScore);
  document.getElementById("score-host").textContent = hostname;
  document.getElementById("score-signals").textContent = totalSignals;

  // Verdict
  const verdict = getVerdict(vibeScore);
  const verdictEl = document.getElementById("verdict-status");
  const verdictColor = getScoreColor(vibeScore);
  verdictEl.innerHTML =
    '<span class="verdict-indicator" style="background:' + verdictColor + '"></span>' +
    verdict.text;
  verdictEl.className = verdict.cssClass;

  // Category breakdown
  const breakdownEl = document.getElementById("category-breakdown");
  if (breakdownEl && categoryScores) {
    const catNames = {
      techstack: "TECH", source: "SRCE", content: "CNTN",
      design: "DSGN", security: "SECU", infra: "INFR", runtime: "RNTM",
    };
    let html = "";
    for (const [cat, info] of Object.entries(categoryScores)) {
      const tag = catNames[cat] || cat;
      const label = (tag + " " + String(info.capped).padStart(2, " ") + "/" + String(info.cap).padStart(2, " "));
      html +=
        '<div class="cat-row">' +
        '<span class="cat-label">[' + tag + '] ' + String(info.capped).padStart(2, " ") + "/" + info.cap + "</span>" +
        '<div class="cat-bar">' + renderCategoryBar(info.capped, info.cap) + "</div>" +
        "</div>";
    }
    if (multiplierApplied) {
      html += '<div class="cat-modifier"><span style="color:#ff6600">x1.15 STACK MULTIPLIER (React+shadcn+Vercel)</span></div>';
    }
    if (totalReduction > 0) {
      html += '<div class="cat-modifier"><span style="color:#33ff33">-' + totalReduction + ' CLEAN SIGNALS</span></div>';
    }
    breakdownEl.innerHTML = html;
  }

  // Signals
  const list = document.getElementById("signals-list");
  list.innerHTML = "";

  if (signals.length === 0 && (!negativeSignals || negativeSignals.length === 0)) {
    list.innerHTML =
      '<div class="signal-empty">> No anomalies detected.<br>> Target appears hand-crafted.</div>';
    return;
  }

  // Sort by weight descending
  signals.sort((a, b) => b.weight - a.weight);

  signals.forEach((signal) => {
    const tag = categoryTags[signal.category] || "UNKN";
    const dots = padDots();

    const lineEl = document.createElement("div");
    lineEl.className = "signal-line";
    lineEl.innerHTML =
      '<span class="signal-prompt">&gt; </span>' +
      '<span class="signal-tag">[' + tag + "]</span> " +
      '<span class="signal-name">' + escapeHtml(signal.name) + "</span>" +
      '<span class="signal-dots">' + dots + "</span>" +
      '<span class="signal-weight" style="color:' +
      getWeightColor(signal.weight) + '">+' + signal.weight + "</span>";

    const descEl = document.createElement("div");
    descEl.className = "signal-desc";
    descEl.textContent = signal.description;

    list.appendChild(lineEl);
    list.appendChild(descEl);
  });

  // Render negative signals
  if (negativeSignals && negativeSignals.length > 0) {
    const divider = document.createElement("div");
    divider.className = "signal-line";
    divider.style.color = "#333";
    divider.style.margin = "6px 0 2px";
    divider.textContent = "── Clean Signals ──";
    list.appendChild(divider);

    negativeSignals.forEach((ns) => {
      const lineEl = document.createElement("div");
      lineEl.className = "signal-line";
      lineEl.innerHTML =
        '<span class="signal-prompt">&gt; </span>' +
        '<span style="color:#33ff33;font-weight:700;margin-right:6px">[PASS]</span>' +
        '<span class="signal-name">' + escapeHtml(ns.name) + "</span>" +
        '<span class="signal-dots">' + padDots() + "</span>" +
        '<span style="color:#33ff33;font-weight:700">-' + ns.points + "</span>";

      const descEl = document.createElement("div");
      descEl.className = "signal-desc";
      descEl.textContent = ns.description;

      list.appendChild(lineEl);
      list.appendChild(descEl);
    });
  }

  // "Show All" — not-detected signals
  const triggeredNames = new Set(signals.map((s) => s.name));
  const notDetected = ALL_KNOWN_SIGNALS.filter((s) => !triggeredNames.has(s.name));

  if (notDetected.length > 0) {
    const notDetectedContainer = document.createElement("div");
    notDetectedContainer.className = "not-detected-list";
    notDetectedContainer.id = "not-detected-list";

    notDetected.forEach((s) => {
      const tag = categoryTags[s.category] || "UNKN";
      const el = document.createElement("div");
      el.className = "signal-not-detected";
      el.innerHTML =
        '<span class="signal-prompt">&gt; </span>' +
        '<span class="signal-tag">[' + tag + "]</span> " +
        '<span class="signal-name">' + escapeHtml(s.name) + "</span>" +
        '<span class="signal-dots">' + padDots() + '</span>' +
        '<span style="color:#333">--</span>';
      notDetectedContainer.appendChild(el);
    });

    const showAllBtn = document.createElement("button");
    showAllBtn.className = "show-all-btn";
    showAllBtn.textContent = "[ SHOW ALL " + notDetected.length + " UNDETECTED ]";
    showAllBtn.addEventListener("click", () => {
      SoundEngine.click();
      const container = document.getElementById("not-detected-list");
      const isOpen = container.classList.toggle("open");
      showAllBtn.textContent = isOpen
        ? "[ HIDE UNDETECTED ]"
        : "[ SHOW ALL " + notDetected.length + " UNDETECTED ]";
    });

    list.appendChild(showAllBtn);
    list.appendChild(notDetectedContainer);
  }
}

// ── Loading bar animation ────────────────────────────────

let loadingInterval = null;
let pendingResult = null;

function startLoadingBar() {
  const fillEl = document.getElementById("loading-bar-fill");
  if (!fillEl) return;

  const totalSteps = 30;
  let pos = 0;
  pendingResult = null;
  fillEl.style.width = "0%";

  // Fill the bar over ~2.5 seconds, then show results
  loadingInterval = setInterval(() => {
    pos++;
    fillEl.style.width = ((pos / totalSteps) * 100) + "%";

    if (pos >= totalSteps) {
      stopLoadingBar();
      if (pendingResult) {
        renderResults(pendingResult);
        pendingResult = null;
      }
    }
  }, 80);
}

function stopLoadingBar() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

function queueResult(result) {
  // If loading bar is still running, hold the result until it finishes
  if (loadingInterval) {
    pendingResult = result;
  } else {
    renderResults(result);
  }
}

// ── Scan logic ───────────────────────────────────────────

function triggerScan() {
  hasRendered = false;
  document.getElementById("ready").style.display = "none";
  document.getElementById("loading").style.display = "block";
  document.getElementById("results").style.display = "none";
  document.getElementById("empty").style.display = "none";
  startLoadingBar();
  SoundEngine.scanning();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      stopLoadingBar();
      showEmpty();
      return;
    }

    const tab = tabs[0];

    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      stopLoadingBar();
      showEmpty();
      return;
    }

    const tabId = tab.id;
    const storageKey = "result_tab_" + tabId;

    // Clear previous result for this tab before scanning
    chrome.storage.local.remove([storageKey, "lastResult"]);

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ["detector.js"],
      },
      () => {
        // Poll storage until result arrives (every 500ms, up to 15s)
        let attempts = 0;
        const maxAttempts = 30;
        const pollInterval = setInterval(() => {
          attempts++;
          chrome.storage.local.get([storageKey, "lastResult"], (data) => {
            const result = data[storageKey] || data.lastResult;
            if (result && result.timestamp) {
              clearInterval(pollInterval);
              queueResult(result);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              stopLoadingBar();
            }
          });
        }, 500);
      }
    );
  });
}

function showEmpty() {
  document.getElementById("ready").style.display = "none";
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "none";
  document.getElementById("empty").style.display = "block";
}

// ── Event listeners ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "VIBE_RESULT") {
    queueResult(msg.data);
  }
});

// Show ready state — wait for user to initiate scan
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0] || !tabs[0].url || tabs[0].url.startsWith("chrome://")) {
    showEmpty();
    return;
  }

  const storageKey = "result_tab_" + tabs[0].id;
  chrome.storage.local.get([storageKey], (data) => {
    if (data[storageKey] && data[storageKey].url === tabs[0].url) {
      renderResults(data[storageKey]);
    } else {
      // Show ready state, wait for user input
      document.getElementById("ready").style.display = "block";
      document.getElementById("loading").style.display = "none";
      document.getElementById("results").style.display = "none";
      document.getElementById("empty").style.display = "none";
    }
  });
});

document.getElementById("rescan")?.addEventListener("click", () => {
  SoundEngine.click();
  triggerScan();
});
document.getElementById("scan-btn")?.addEventListener("click", () => {
  SoundEngine.click();
  triggerScan();
});
document.getElementById("ready-scan-btn")?.addEventListener("click", () => {
  SoundEngine.click();
  triggerScan();
});

// ── Mute button ──────────────────────────────────────────

const muteBtn = document.getElementById("btn-mute");
chrome.storage.local.get(["soundMuted"], (data) => {
  if (data.soundMuted) {
    muteBtn.classList.add("muted");
    SoundEngine.setMuted(true);
  }
});

muteBtn?.addEventListener("click", () => {
  const isMuted = muteBtn.classList.toggle("muted");
  SoundEngine.setMuted(isMuted);
  chrome.storage.local.set({ soundMuted: isMuted });
  // Play a click sound to confirm unmute (only audible when unmuting)
  if (!isMuted) SoundEngine.click();
});

// ── Menu dropdown ────────────────────────────────────────

const menuBtn = document.getElementById("btn-menu");
const menuDropdown = document.getElementById("menu-dropdown");

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  SoundEngine.click();
  menuDropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
  menuDropdown?.classList.remove("open");
});

menuDropdown?.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.getElementById("menu-export")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  exportJSON();
});

document.getElementById("menu-share")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  exportImage();
});

document.getElementById("menu-about")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  // TODO: about page functionality
});

// ── Toast notification ───────────────────────────────────

function showToast(message) {
  const toast = document.getElementById("export-toast");
  toast.textContent = "> " + message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2000);
}

// ── Export Report (JSON) ─────────────────────────────────

function buildExportJSON(data) {
  const triggeredNames = new Set(data.signals.map((s) => s.name));
  const undetected = ALL_KNOWN_SIGNALS.filter(
    (s) => !triggeredNames.has(s.name)
  );

  return {
    meta: {
      tool: "VIBE-DETECT",
      version: "1.0.3",
      exportedAt: new Date().toISOString(),
    },
    target: {
      url: data.url,
      hostname: data.hostname,
      scannedAt: new Date(data.timestamp).toISOString(),
    },
    score: {
      vibeScore: data.vibeScore,
      rawScore: data.rawScore,
      verdict: getVerdict(data.vibeScore).text,
      multiplierApplied: data.multiplierApplied,
      totalReduction: data.totalReduction || 0,
    },
    categoryBreakdown: Object.fromEntries(
      Object.entries(data.categoryScores).map(([cat, info]) => [
        cat,
        { scored: info.capped, cap: info.cap, raw: info.raw },
      ])
    ),
    detectedSignals: data.signals.map((s) => ({
      category: s.category,
      name: s.name,
      description: s.description,
      weight: s.weight,
    })),
    cleanSignals: (data.negativeSignals || []).map((s) => ({
      name: s.name,
      description: s.description,
      points: s.points,
    })),
    undetectedSignals: undetected.map((s) => ({
      category: s.category,
      name: s.name,
    })),
    totalSignals: data.totalSignals,
    totalPossibleSignals: ALL_KNOWN_SIGNALS.length,
  };
}

async function exportJSON() {
  if (!currentResult) {
    showToast("Run a scan first");
    return;
  }
  const json = JSON.stringify(buildExportJSON(currentResult), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    showToast("JSON copied to clipboard");
  } catch (e) {
    showToast("Copy failed");
  }
}

// ── Share Report (Image) ─────────────────────────────────

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (ctx.measureText(text + "...").width > maxWidth && text.length > 0) {
    text = text.slice(0, -1);
  }
  return text + "...";
}

function drawDivider(ctx, y, W, pad) {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();
}

function calculateCanvasHeight(data) {
  const negCount = (data.negativeSignals || []).length;

  let h = 0;
  h += 90; // header
  h += 50; // URL + date
  h += 110; // score + bar + verdict
  h += 30; // category header
  h += Object.keys(data.categoryScores).length * 24; // category rows
  h += 20; // spacing
  h += 30; // signals header
  h += data.signals.length * 22; // detected signals
  if (negCount > 0) {
    h += 30; // clean signals header
    h += negCount * 22;
  }
  h += 60; // footer
  return Math.max(500, h);
}

async function exportImage() {
  if (!currentResult) {
    showToast("Run a scan first");
    return;
  }

  await document.fonts.ready;

  const data = currentResult;
  const W = 600;
  const H = calculateCanvasHeight(data);
  const canvas = document.createElement("canvas");
  const SCALE = 2;
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  const FONT =
    '"IBM Plex Mono", "SF Mono", "Cascadia Code", "Consolas", monospace';
  const BG = "#1a1a1a";
  const TEXT = "#e0e0e0";
  const DIM = "#666";
  const PAD = 30;

  let y = 0;

  // -- Background --
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // -- Subtle CRT scanlines --
  for (let i = 0; i < H; i += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, i, W, 1);
  }

  // -- Header --
  y = 30;
  ctx.fillStyle = "#555";
  ctx.font = "10px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText("+-----[ VIBE-DETECT v1.0.3 ]-----+", W / 2, y);

  y += 24;
  ctx.fillStyle = TEXT;
  ctx.font = "bold 16px " + FONT;
  ctx.fillText("VIBE CODE DETECTOR", W / 2, y);

  y += 18;
  ctx.fillStyle = DIM;
  ctx.font = "10px " + FONT;
  ctx.fillText("INTERNET SLOP ENGINE ACTIVE", W / 2, y);

  // -- Divider --
  y += 16;
  drawDivider(ctx, y, W, PAD);

  // -- Target --
  y += 20;
  ctx.textAlign = "left";
  ctx.fillStyle = DIM;
  ctx.font = "10px " + FONT;
  ctx.fillText("TARGET:", PAD, y);
  ctx.fillStyle = TEXT;
  ctx.fillText(
    truncateText(ctx, data.hostname, W - PAD * 2 - 60),
    PAD + 65,
    y
  );

  y += 16;
  ctx.fillStyle = DIM;
  ctx.fillText(
    "SCANNED: " + new Date(data.timestamp).toLocaleString(),
    PAD,
    y
  );

  // -- Divider --
  y += 16;
  drawDivider(ctx, y, W, PAD);

  // -- Score --
  y += 10;
  const scoreColor = getScoreColor(data.vibeScore);
  ctx.fillStyle = scoreColor;
  ctx.font = "bold 48px " + FONT;
  ctx.fillText(data.vibeScore + "/100", PAD, y + 42);

  // Score bar
  const barX = PAD;
  const barY = y + 52;
  const barW = W - PAD * 2;
  const barH = 14;
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = scoreColor;
  ctx.fillRect(barX, barY, barW * (data.vibeScore / 100), barH);

  // Verdict
  y = barY + 30;
  const verdict = getVerdict(data.vibeScore);
  ctx.fillStyle = DIM;
  ctx.font = "bold 12px " + FONT;
  ctx.fillText("STATUS: ", PAD, y);
  ctx.fillStyle = scoreColor;
  ctx.fillText(verdict.text, PAD + 75, y);

  // -- Divider --
  y += 16;
  drawDivider(ctx, y, W, PAD);

  // -- Category Breakdown --
  y += 20;
  ctx.fillStyle = DIM;
  ctx.font = "10px " + FONT;
  ctx.fillText("// CATEGORY BREAKDOWN", PAD, y);

  const catTags = {
    techstack: "TECH",
    source: "SRCE",
    content: "CNTN",
    design: "DSGN",
    security: "SECU",
    infra: "INFR",
    runtime: "RNTM",
  };

  y += 8;
  for (const [cat, info] of Object.entries(data.categoryScores)) {
    y += 24;
    const tag = catTags[cat] || cat.toUpperCase();
    const label = `[${tag}] ${info.capped}/${info.cap}`;
    ctx.fillStyle = TEXT;
    ctx.font = "11px " + FONT;
    ctx.fillText(label, PAD, y);

    // Bar
    const catBarX = PAD + 140;
    const catBarW = W - PAD - catBarX - 10;
    const catBarH = 10;
    const catBarY = y - 8;
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(catBarX, catBarY, catBarW, catBarH);
    const pct = info.cap > 0 ? info.capped / info.cap : 0;
    ctx.fillStyle = pct > 0.6 ? "#ff6600" : pct > 0.3 ? "#ffaa00" : "#33ff33";
    ctx.fillRect(catBarX, catBarY, catBarW * pct, catBarH);
  }

  // -- Divider --
  y += 16;
  drawDivider(ctx, y, W, PAD);

  // -- Detected Signals --
  y += 20;
  ctx.fillStyle = DIM;
  ctx.font = "10px " + FONT;
  ctx.fillText("// INTERCEPTED SIGNALS", PAD, y);

  const sortedSignals = [...data.signals].sort((a, b) => b.weight - a.weight);
  for (const sig of sortedSignals) {
    y += 22;
    const tag = catTags[sig.category] || sig.category.toUpperCase();
    ctx.fillStyle = "#555";
    ctx.font = "11px " + FONT;
    ctx.fillText(`[${tag}]`, PAD, y);
    ctx.fillStyle = TEXT;
    ctx.fillText(
      truncateText(ctx, sig.name, W - PAD * 2 - 160),
      PAD + 55,
      y
    );
    ctx.fillStyle = getWeightColor(sig.weight);
    ctx.textAlign = "right";
    ctx.fillText("+" + sig.weight, W - PAD, y);
    ctx.textAlign = "left";
  }

  // -- Clean Signals --
  if (data.negativeSignals && data.negativeSignals.length > 0) {
    y += 16;
    drawDivider(ctx, y, W, PAD);
    y += 20;
    ctx.fillStyle = DIM;
    ctx.font = "10px " + FONT;
    ctx.fillText("// CLEAN SIGNALS", PAD, y);

    for (const sig of data.negativeSignals) {
      y += 22;
      ctx.fillStyle = "#33ff33";
      ctx.font = "11px " + FONT;
      ctx.fillText("[PASS]", PAD, y);
      ctx.fillStyle = TEXT;
      ctx.fillText(
        truncateText(ctx, sig.name, W - PAD * 2 - 160),
        PAD + 60,
        y
      );
      ctx.fillStyle = "#33ff33";
      ctx.textAlign = "right";
      ctx.fillText("-" + sig.points, W - PAD, y);
      ctx.textAlign = "left";
    }
  }

  // -- Footer --
  y += 30;
  drawDivider(ctx, y, W, PAD);
  y += 20;
  ctx.fillStyle = "#555";
  ctx.font = "10px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText("Generated by VIBE-DETECT v1.0.3", W / 2, y);
  y += 16;
  ctx.fillText("Download on Chrome today :]", W / 2, y);
  ctx.textAlign = "left";

  // -- Download --
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibe-detect-" + data.hostname + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");

  showToast("Image downloaded");
}
