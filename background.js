// Background service worker - relays results from content script to popup

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "VIBE_RESULT") {
    // Store result keyed by tab ID for reliable retrieval
    const tabId = sender.tab?.id;
    const storeData = { lastResult: msg.data };
    if (tabId) storeData["result_tab_" + tabId] = msg.data;

    chrome.storage.local.set(storeData);

    // Forward to popup if it's open
    chrome.runtime.sendMessage(msg).catch(() => {
      // Popup not open, that's fine
    });
  }
});
