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

// ── Tech Fingerprint Map ──────────────────────────────────

const TECH_FINGERPRINT_MAP = {
  "Next.js detected": { group: "FRAMEWORK", icon: "{=}", display: "Next.js" },
  "React detected": { group: "FRAMEWORK", icon: "{=}", display: "React" },
  "Vite build": { group: "FRAMEWORK", icon: "{=}", display: "Vite" },
  "Astro detected": { group: "FRAMEWORK", icon: "{=}", display: "Astro" },
  "Svelte detected": { group: "FRAMEWORK", icon: "{=}", display: "Svelte" },
  "Vue/Nuxt detected": { group: "FRAMEWORK", icon: "{=}", display: "Vue / Nuxt" },
  "shadcn/ui components": { group: "UI / STYLING", icon: "[#]", display: "shadcn/ui" },
  "Radix UI primitives": { group: "UI / STYLING", icon: "[#]", display: "Radix UI" },
  "Tailwind CSS": { group: "UI / STYLING", icon: "[~]", display: "Tailwind CSS" },
  "Framer Motion": { group: "UI / STYLING", icon: "[~]", display: "Framer Motion" },
  "Lucide icons": { group: "UI / STYLING", icon: "[*]", display: "Lucide Icons" },
  "Default shadcn theme": { group: "UI / STYLING", icon: "[#]", display: "Default shadcn Theme" },
  "Supabase client": { group: "BACKEND", icon: "[db]", display: "Supabase" },
  "Firebase client": { group: "BACKEND", icon: "[db]", display: "Firebase" },
  "Convex client": { group: "BACKEND", icon: "[db]", display: "Convex" },
  "Clerk auth": { group: "BACKEND", icon: "[key]", display: "Clerk Auth" },
  "Auth0 client": { group: "BACKEND", icon: "[key]", display: "Auth0" },
  "Stripe client": { group: "BACKEND", icon: "[$]", display: "Stripe" },
  "OpenAI API calls": { group: "AI TOOLS", icon: "[!]", display: "OpenAI API" },
  "Anthropic API calls": { group: "AI TOOLS", icon: "[!]", display: "Anthropic API" },
  "Free-tier hosting": { group: "HOSTING", icon: "[^]", display: "Free-Tier Hosting" },
  "Vercel hosting (custom domain)": { group: "HOSTING", icon: "[^]", display: "Vercel" },
  "Vercel Analytics": { group: "HOSTING", icon: "[^]", display: "Vercel Analytics" },
};

const FINGERPRINT_GROUP_ORDER = ["FRAMEWORK", "UI / STYLING", "BACKEND", "AI TOOLS", "HOSTING"];

function renderTechFingerprint(signals) {
  const container = document.getElementById("tech-fingerprint");
  const content = document.getElementById("tech-fingerprint-content");
  if (!container || !content) return;

  const groups = {};

  for (const signal of signals) {
    const mapping = TECH_FINGERPRINT_MAP[signal.name];
    if (mapping) {
      if (!groups[mapping.group]) groups[mapping.group] = [];
      groups[mapping.group].push(mapping);
    }
  }

  if (Object.keys(groups).length === 0) {
    container.style.display = "none";
    return;
  }

  let html = "";
  for (const group of FINGERPRINT_GROUP_ORDER) {
    if (!groups[group]) continue;
    html += '<div class="tech-group-header">[' + group + ']</div>';
    for (const item of groups[group]) {
      html += '<div class="tech-item"><span class="tech-icon">' + escapeHtml(item.icon) + '</span> ' + escapeHtml(item.display) + '</div>';
    }
  }

  content.innerHTML = html;
  container.style.display = "block";
}

// ── Trend Detection ─────────────────────────────────────

function checkTrend(hostname, currentScore) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["scanHistory"], (store) => {
      const history = store.scanHistory || [];
      // Find previous scan of same hostname (skip the one we just logged)
      const previous = history.find(
        (e) => e.hostname === hostname && e.score !== currentScore
      );
      if (!previous) {
        // Check for same score too (means no change)
        const sameScore = history.filter((e) => e.hostname === hostname);
        if (sameScore.length > 1) {
          resolve({ previousScore: currentScore, delta: 0, direction: "same" });
        } else {
          resolve(null);
        }
        return;
      }
      const delta = currentScore - previous.score;
      resolve({
        previousScore: previous.score,
        delta,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "same",
      });
    });
  });
}

function renderTrendLine(hostname, currentScore) {
  // Insert trend line after verdict row in score section
  const verdictRow = document.querySelector(".verdict-row");
  if (!verdictRow) return;

  // Remove existing trend line if any
  const existing = document.querySelector(".trend-line");
  if (existing) existing.remove();

  checkTrend(hostname, currentScore).then((trend) => {
    if (!trend) return;

    const arrow = trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "◆";
    const cssClass = trend.direction === "up" ? "trend-up" : trend.direction === "down" ? "trend-down" : "trend-same";
    const deltaStr = trend.delta > 0 ? "+" + trend.delta : String(trend.delta);

    const trendEl = document.createElement("div");
    trendEl.className = "trend-line";
    trendEl.innerHTML =
      '<span class="trend-label">TREND: </span>' +
      '<span class="' + cssClass + '">' +
      'Previous: ' + trend.previousScore + ' → Now: ' + currentScore + '  ' +
      arrow + ' ' + deltaStr +
      '</span>';

    verdictRow.after(trendEl);
  });
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

  // Tech fingerprint
  renderTechFingerprint(signals);

  // Trend detection (async — renders when ready)
  renderTrendLine(hostname, vibeScore);

  // Deep scan button
  const deepScanBtn = document.getElementById("deep-scan-btn");
  if (deepScanBtn && data.internalLinks && data.internalLinks.length > 0) {
    deepScanBtn.style.display = "block";
    deepScanBtn.textContent = "[ DEEP SCAN (" + Math.min(5, data.internalLinks.length) + " PAGES) ]";
    deepScanBtn.disabled = false;
  } else if (deepScanBtn) {
    deepScanBtn.style.display = "none";
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

document.getElementById("menu-howitworks")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  showOverlay("howitworks-page");
});

document.getElementById("menu-about")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  showOverlay("about-page");
});

// ── Overlay pages (About, How It Works) ─────────────────

let previousState = null;

function showOverlay(pageId) {
  // Remember what was visible so we can go back
  previousState = {
    ready: document.getElementById("ready").style.display,
    loading: document.getElementById("loading").style.display,
    results: document.getElementById("results").style.display,
    empty: document.getElementById("empty").style.display,
  };

  // Hide all main views
  document.getElementById("ready").style.display = "none";
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "none";
  document.getElementById("empty").style.display = "none";

  // Hide any other overlay that might be open
  document.querySelectorAll(".overlay-page").forEach((p) => p.classList.remove("active"));

  // Show requested overlay
  document.getElementById(pageId).classList.add("active");
}

function hideOverlay() {
  document.querySelectorAll(".overlay-page").forEach((p) => p.classList.remove("active"));

  if (previousState) {
    document.getElementById("ready").style.display = previousState.ready;
    document.getElementById("loading").style.display = previousState.loading;
    document.getElementById("results").style.display = previousState.results;
    document.getElementById("empty").style.display = previousState.empty;
    previousState = null;
  } else {
    // Fallback: show ready state
    document.getElementById("ready").style.display = "block";
  }
}

document.getElementById("about-back")?.addEventListener("click", () => {
  SoundEngine.click();
  hideOverlay();
});

document.getElementById("howitworks-back")?.addEventListener("click", () => {
  SoundEngine.click();
  hideOverlay();
});

document.getElementById("history-back")?.addEventListener("click", () => {
  SoundEngine.click();
  hideOverlay();
});

document.getElementById("deepscan-back")?.addEventListener("click", () => {
  SoundEngine.click();
  hideOverlay();
});

// ── Scan History ─────────────────────────────────────────

document.getElementById("menu-history")?.addEventListener("click", () => {
  SoundEngine.click();
  menuDropdown.classList.remove("open");
  showHistory();
});

document.getElementById("history-clear")?.addEventListener("click", () => {
  SoundEngine.click();
  chrome.storage.local.remove(["scanHistory"], () => {
    showHistory(); // Re-render (will show empty state)
    showToast("History cleared");
  });
});

function formatRelativeDate(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  if (days < 7) return days + "d ago";
  return new Date(timestamp).toLocaleDateString();
}

function showHistory() {
  chrome.storage.local.get(["scanHistory"], (store) => {
    const history = store.scanHistory || [];
    const listEl = document.getElementById("history-list");
    if (!listEl) return;

    if (history.length === 0) {
      listEl.innerHTML = '<div class="history-empty">> No scans recorded yet.<br>> Scan a website to begin.</div>';
      showOverlay("history-page");
      return;
    }

    // Build trend map: for each hostname, track score changes
    const hostnameScores = {};
    // Iterate in reverse (oldest first) to build chronological order
    for (let i = history.length - 1; i >= 0; i--) {
      const e = history[i];
      if (!hostnameScores[e.hostname]) hostnameScores[e.hostname] = [];
      hostnameScores[e.hostname].push(e.score);
    }

    let html = '<div class="overlay-line"><span class="dim">' + history.length + ' scan(s) recorded</span></div><hr class="overlay-divider">';

    history.forEach((entry) => {
      const scoreColor = getScoreColor(entry.score);
      const scores = hostnameScores[entry.hostname];

      html += '<div class="history-entry">';
      html += '<div class="history-entry-top">';
      html += '<span class="history-hostname">' + escapeHtml(entry.hostname) + '</span>';
      html += '<span class="history-dots">' + ".".repeat(80) + '</span>';
      html += '<span class="history-score" style="color:' + scoreColor + '">' + entry.score + '/100</span>';
      html += '</div>';
      html += '<div class="history-meta">' + entry.verdict + ' | ' + entry.signalCount + ' signals | ' + formatRelativeDate(entry.timestamp) + '</div>';

      // Show trend if multiple scans exist for this hostname
      if (scores.length > 1) {
        const idx = scores.indexOf(entry.score);
        if (idx > 0) {
          const prev = scores[idx - 1];
          const delta = entry.score - prev;
          if (delta !== 0) {
            const arrow = delta > 0 ? "▲" : "▼";
            const cls = delta > 0 ? "trend-up" : "trend-down";
            const sign = delta > 0 ? "+" : "";
            html += '<div class="history-trend ' + cls + '">' + arrow + ' ' + sign + delta + ' from previous scan</div>';
          }
        }
      }

      html += '</div>';
    });

    listEl.innerHTML = html;
    showOverlay("history-page");
  });
}

// ── Deep Scan ────────────────────────────────────────────

let deepScanRunning = false;

document.getElementById("deep-scan-btn")?.addEventListener("click", () => {
  if (deepScanRunning || !currentResult || !currentResult.internalLinks) return;
  SoundEngine.click();
  startDeepScan();
});

function startDeepScan() {
  if (!currentResult || !currentResult.internalLinks || currentResult.internalLinks.length === 0) {
    showToast("No internal links found");
    return;
  }

  deepScanRunning = true;
  const btn = document.getElementById("deep-scan-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "[ SCANNING... ]";
  }

  SoundEngine.scanning();

  chrome.runtime.sendMessage({
    type: "DEEP_SCAN_START",
    urls: currentResult.internalLinks,
    hostname: currentResult.hostname,
  });
}

// Listen for deep scan progress and completion
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "DEEP_SCAN_PROGRESS") {
    const btn = document.getElementById("deep-scan-btn");
    if (btn) {
      btn.textContent = "[ SCANNING " + msg.current + "/" + msg.total + "... ]";
    }
  }

  if (msg.type === "DEEP_SCAN_COMPLETE") {
    deepScanRunning = false;
    SoundEngine.deepComplete();
    renderDeepScanResults(msg.data);
  }
});

function renderDeepScanResults(data) {
  const container = document.getElementById("deepscan-results");
  if (!container) return;

  const scoreColor = getScoreColor(data.aggregateScore);

  let html = '';
  html += '<div class="deepscan-aggregate" style="color:' + scoreColor + '">' + data.aggregateScore + '/100</div>';
  html += '<div class="deepscan-meta">Aggregate score across ' + data.totalPagesScanned + ' page(s) of ' + data.internalLinksFound + ' found</div>';
  html += '<hr class="overlay-divider">';

  for (const page of data.pages) {
    const path = new URL(page.url).pathname;
    const pColor = getScoreColor(page.score);
    html += '<div class="deepscan-page-row">';
    html += '<span class="deepscan-path">' + escapeHtml(path) + '</span>';
    html += '<span class="deepscan-dots">' + ".".repeat(80) + '</span>';
    html += '<span class="deepscan-score" style="color:' + pColor + '">' + page.score + '</span>';
    html += '</div>';
  }

  container.innerHTML = html;

  // Reset deep scan button
  const btn = document.getElementById("deep-scan-btn");
  if (btn) {
    btn.disabled = false;
    btn.textContent = "[ DEEP SCAN COMPLETE ]";
  }

  showOverlay("deepscan-page");
}

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
      version: "1.1.0",
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
  ctx.fillText("+-----[ VIBE-DETECT v1.1.0 ]-----+", W / 2, y);

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
  ctx.fillText("Generated by VIBE-DETECT v1.1.0", W / 2, y);
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
