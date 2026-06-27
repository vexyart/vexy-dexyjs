// this_file: extension/popup.js
// Inject the vexy-dexyjs global bundle into the active tab and run preprocess()
// in place. The page DOM is rewritten to the slide vocabulary so you can see the
// result immediately; the serialized HTML is logged to the page console.

const statusEl = document.getElementById("status");

document.getElementById("run").addEventListener("click", async () => {
  statusEl.textContent = "working…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("no active tab");

    // 1) Load the library into the page (sets window.VexyDexy).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["vexy-dexyjs.global.min.js"],
    });

    // 2) Run preprocess() with the chosen framework hint.
    const framework = document.getElementById("framework").value;
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (cfg) => {
        const out = window.VexyDexy.preprocess(cfg);
        console.log("[vexy-dexyjs] preprocessed HTML length:", out.html.length);
        return { length: out.html.length };
      },
      args: [{ framework }],
    });

    statusEl.textContent = `done — ${result.length} chars (see page console)`;
  } catch (e) {
    statusEl.textContent = `error: ${e.message}`;
  }
});
