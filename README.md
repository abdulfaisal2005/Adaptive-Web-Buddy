# Adaptive Web Buddy

Adaptive Web Buddy is a lightweight browser extension that helps make web pages more accessible for people with diverse needs. It provides quick, in-page accessibility tools such as Text-to-Speech, Zapper (remove distracting elements), High-Contrast mode, Dyslexic-friendly font, adjustable line-height and letter-spacing, and user profiles.

---

## Features

- Text-to-Speech (TTS): click selectable text to hear it read aloud.
- Zapper: click to temporarily hide/remove distracting elements on the page.
- High-Contrast Mode: invert or apply high contrast colors for better visibility.
- Dyslexic-Friendly Font: switch to an easier-to-read font family.
- Line Height & Letter Spacing: increase spacing for readability.
- Profiles: save and apply sets of accessibility settings.
- Persistent settings: settings persist across page reloads via chrome.storage.

---

## Install (Developer / Local testing)

1. Open Chrome (or Edge) and go to chrome://extensions
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and choose the project folder (the root folder that contains `manifest.json`).
4. Open any webpage and open the extension popup to enable features.

Note: This project is a Manifest V3 extension, so use a current Chromium-based browser.

---

## Usage

- Open the popup (`popup/popup.html`) and toggle features or apply a profile.
- Text-to-Speech: enable TTS in the popup, then click text on the page to hear it.
- Zapper: enable Zapper in the popup, hover to highlight elements, click to hide elements. Press Esc to exit zapper.
- Accessibility toggles: use the popup controls to enable High Contrast, Dyslexic Font, increase line height or letter spacing.

---

## Troubleshooting — Why some features may not work (and how to fix)

If features such as Text-to-Speech, Zapper, High Contrast, Dyslexic font, line-height or letter-spacing are not working, the most common causes and fixes are:

1. Duplicate or overwritten functions
   - Problem: `content/contentScript.js` defines `showZapperCursor` twice; the second definition overrides the first and the code that injected a stylesheet or added classes may never run. This results in missing cursor styles and mismatched cleanup.
   - Fix: Keep a single `showZapperCursor` implementation that (a) injects a single style element with a stable id (e.g. `zapper-cursor-style`) and (b) adds a class to `<body>` or `<html>` to toggle CSS for all elements.

2. Wrong reference to the HTML element
   - Problem: code checks `document.html` which is undefined. This breaks guards that prevent removing the `<html>` element and prevents proper zapper cleanup.
   - Fix: replace all `document.html` with `document.documentElement`.

3. Anonymous event listeners that cannot be removed
   - Problem: TTS and zapper listeners are attached with anonymous functions (e.g. `document.addEventListener('click', function(...) {...}, true);`) and later removal attempts fail because the exact function reference is not provided.
   - Fix: use named handler functions (store references like `ttsClickHandler`, `ttsKeyHandler`, `zapperClickHandler`) and call `removeEventListener` with the same reference when disabling the feature.

4. Removing or hiding elements incorrectly
   - Problem: zapper may hide elements that should not be removed (html/body, scripts, or essential interactive controls) because checks are incomplete or compare to `undefined` references.
   - Fix: ensure zapper click handler checks `if (!element || element === document.body || element === document.documentElement) return;` and also check `element.nodeType === 1` and tag names (uppercased) against a safe-list.

5. Inline-per-element styling vs. CSS class toggles
   - Problem: applying styles by writing to every element's inline style is expensive and brittle for dynamically loaded content.
   - Fix: toggle a CSS class on `document.documentElement` (e.g. `document.documentElement.classList.add('awb-high-contrast')`) and inject a single stylesheet that contains rules scoped under that class. This makes toggle and cleanup simple and robust.

6. Failing to validate saved profile data
   - Problem: applying saved settings that are `undefined` or missing can result in styles not applying.
   - Fix: validate each property before applying (e.g. `if (settings.fontFamily) document.body.style.fontFamily = settings.fontFamily;`).

7. Permissions and execution context
   - Problem: if the popup or background scripts expect messages that are never sent or listeners not registered, some features won't toggle the content script state.
   - Fix: verify the popup code calls `chrome.tabs.sendMessage(tabId, {...})` or `chrome.runtime.sendMessage` correctly and that `manifest.json` correctly injects the content script. Use `chrome.runtime.lastError` checks in message callbacks.

If you want, I can patch `content/contentScript.js` to apply the exact fixes above (replace `document.html`, remove duplicate function, convert anonymous listeners to named handlers, and switch to class-based CSS toggles). Tell me if you want me to make those changes and I will apply them.

---

## Development notes

- Content scripts run in page context but isolated world; DOM APIs such as SpeechSynthesis are available from content scripts.
- Prefer toggling CSS classes for global visual modes instead of writing inline styles to every element.
- Keep event listener references so they can be removed when a feature is toggled off.

---

## Contributing

1. Fork the repository.
2. Create a feature branch, implement fixes or features, and open a pull request.

---

## License

MIT

---

If you'd like, I can apply the recommended fixes directly to `content/contentScript.js` — say "Please patch content script" and I will update the file with the safer implementations described above.
