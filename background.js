// Background service worker - relays results from content script to popup

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "VIBE_RESULT") {
    // Store result keyed by tab ID for reliable retrieval
    const tabId = sender.tab?.id;
    const storeData = { lastResult: msg.data };
    if (tabId) storeData["result_tab_" + tabId] = msg.data;

    chrome.storage.local.set(storeData);

    // Log to scan history
    logToHistory(msg.data);

    // Forward to popup if it's open
    chrome.runtime.sendMessage(msg).catch(() => {
      // Popup not open, that's fine
    });
  }

  if (msg.type === "DEEP_SCAN_START") {
    handleDeepScan(msg.urls, msg.hostname, sender);
    return true; // keep channel open for async response
  }
});

// ── Scan History ─────────────────────────────────────────

function getVerdict(score) {
  if (score < 20) return "HUMAN CRAFTED";
  if (score < 45) return "AI ASSISTED";
  if (score < 70) return "MOSTLY VIBED";
  return "PURE VIBES";
}

function logToHistory(data) {
  chrome.storage.local.get(["scanHistory"], (store) => {
    const history = store.scanHistory || [];

    // Dedup: if most recent entry has same URL and same score, just update timestamp
    if (history.length > 0) {
      const last = history[0];
      if (last.url === data.url && last.score === data.vibeScore) {
        last.timestamp = data.timestamp;
        chrome.storage.local.set({ scanHistory: history });
        return;
      }
    }

    // Extract detected tech names for fingerprint
    const techDetected = (data.signals || [])
      .filter((s) => s.category === "techstack")
      .map((s) => s.name);

    const entry = {
      id: data.timestamp + "_" + data.hostname,
      url: data.url,
      hostname: data.hostname,
      score: data.vibeScore,
      verdict: getVerdict(data.vibeScore),
      signalCount: data.totalSignals || 0,
      timestamp: data.timestamp,
      techDetected,
      categoryScores: data.categoryScores,
    };

    // Prepend (newest first), cap at 50
    history.unshift(entry);
    if (history.length > 50) history.length = 50;

    chrome.storage.local.set({ scanHistory: history });
  });
}

// ── Deep Scan ────────────────────────────────────────────

async function handleDeepScan(urls, hostname, originalSender) {
  const results = [];
  const maxPages = 5;
  const pagesToScan = urls.slice(0, maxPages);
  const deepScanTabs = new Set();

  // Safety timeout: force cleanup after 30s
  const cleanupTimeout = setTimeout(() => {
    for (const id of deepScanTabs) {
      chrome.tabs.remove(id).catch(() => {});
    }
    deepScanTabs.clear();
  }, 30000);

  for (let i = 0; i < pagesToScan.length; i++) {
    const url = pagesToScan[i];

    // Send progress update
    chrome.runtime.sendMessage({
      type: "DEEP_SCAN_PROGRESS",
      current: i + 1,
      total: pagesToScan.length,
      url,
    }).catch(() => {});

    try {
      const result = await scanPageInBackground(url, deepScanTabs);
      if (result) {
        results.push({ url, score: result.vibeScore, signalCount: result.totalSignals });
      }
    } catch (e) {
      // Skip failed pages
    }

    // 1s delay between pages to avoid hammering
    if (i < pagesToScan.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  clearTimeout(cleanupTimeout);

  // Clean up any remaining tabs
  for (const id of deepScanTabs) {
    chrome.tabs.remove(id).catch(() => {});
  }

  const aggregateScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const deepResult = {
    hostname,
    timestamp: Date.now(),
    pages: results,
    aggregateScore,
    totalPagesScanned: results.length,
    internalLinksFound: urls.length,
  };

  // Store deep scan result
  chrome.storage.local.set({ ["deepScan_" + hostname]: deepResult });

  // Send completion
  chrome.runtime.sendMessage({
    type: "DEEP_SCAN_COMPLETE",
    data: deepResult,
  }).catch(() => {});
}

function scanPageInBackground(url, tabTracker) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (!tab) { reject("Failed to create tab"); return; }
      tabTracker.add(tab.id);

      // Wait for page to load, then inject detector
      const onUpdated = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(onUpdated);

          // Small delay for page to settle
          setTimeout(() => {
            const storageKey = "result_tab_" + tab.id;
            chrome.storage.local.remove([storageKey]);

            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["detector.js"],
            }, () => {
              // Poll for result
              let attempts = 0;
              const poll = setInterval(() => {
                attempts++;
                chrome.storage.local.get([storageKey], (data) => {
                  if (data[storageKey]) {
                    clearInterval(poll);
                    const result = data[storageKey];
                    // Close tab and clean up
                    chrome.tabs.remove(tab.id).catch(() => {});
                    tabTracker.delete(tab.id);
                    chrome.storage.local.remove([storageKey]);
                    resolve(result);
                  } else if (attempts >= 20) {
                    clearInterval(poll);
                    chrome.tabs.remove(tab.id).catch(() => {});
                    tabTracker.delete(tab.id);
                    reject("Timeout");
                  }
                });
              }, 500);
            });
          }, 1000);
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Fallback timeout for tab loading
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.remove(tab.id).catch(() => {});
        tabTracker.delete(tab.id);
        reject("Tab load timeout");
      }, 15000);
    });
  });
}
