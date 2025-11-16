// contentScript.js - Actually modifies the webpage DOM

// Text-to-Speech state
let ttsEnabled = false;

// Zapper mode state
let zapperEnabled = false;
let removedElements = [];

// Accessibility features state
let accessibilityFeatures = {
    dyslexicFont: false,
    lineHeight: false,
    letterSpacing: false,
    fontSize: 100 // percentage, default 100%
};

// Header visibility state
let headerVisible = true;

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("[Adaptive Web Buddy] Message received:", request.action);
    
    try {
        if (request.action === 'applyProfile') {
            applyProfileSettings(request.profile.settings);
            sendResponse({status: 'Profile applied: ' + request.profile.name});
        }
        else if (request.action === 'updateSetting') {
            updateSingleSetting(request.setting, request.value);
            sendResponse({status: 'Setting updated'});
        }
        else if (request.action === 'resetAll') {
            resetAllChanges();
            sendResponse({status: 'All changes reset'});
        }
        else if (request.action === 'toggleTextToSpeech') {
            toggleTextToSpeech(request.enabled);
            sendResponse({status: 'Text-to-Speech ' + (request.enabled ? 'enabled' : 'disabled')});
        }
        else if (request.action === 'toggleFeature') {
            toggleAccessibilityFeature(request.feature, request.enabled);
            sendResponse({status: 'Feature ' + request.feature + ' ' + (request.enabled ? 'enabled' : 'disabled')});
        }
        else if (request.action === 'toggleZapper') {
            toggleZapper(request.enabled);
            sendResponse({status: 'Zapper ' + (request.enabled ? 'enabled' : 'disabled')});
        }
        else if (request.action === 'GET_PAGE_TEXT') {
            const pageText = extractPageText();
            console.log("[Adaptive Web Buddy] Extracted text length:", pageText.length);
            sendResponse({text: pageText});
        }
    } catch (error) {
        console.error("[Adaptive Web Buddy] Error handling message:", error);
        sendResponse({error: error.message});
    }
    
    return true; // Keep message channel open for async response
});

// Helper function to get all page content elements (excluding header and its children)
function getPageContentElements() {
    // Only select text-containing elements to avoid performance issues
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, div, li, a, button, label, td, th, article, section, main, nav, aside, blockquote, pre, code, strong, em, b, i';
    return document.querySelectorAll(selector);
}

// Apply all settings from a profile
function applyProfileSettings(settings) {
    console.log("Applying settings:", settings);
    
    // Remove existing profile styles
    let profileStyle = document.getElementById('awb-profile-style');
    if (profileStyle) profileStyle.remove();
    
    // Create new style element for profile
    profileStyle = document.createElement('style');
    profileStyle.id = 'awb-profile-style';
    
    // Build CSS rules with maximum specificity (excluding header)
    let cssRules = `
        body,
        html {
            background-color: ${settings.backgroundColor} !important;
            color: ${settings.textColor} !important;
        }
        
        /* Apply to all elements except header */
        body *:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-floating-btn):not(#awb-floating-btn *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *) {
            background-color: ${settings.backgroundColor} !important;
            color: ${settings.textColor} !important;
            font-family: ${settings.fontFamily} !important;
            font-size: ${settings.fontSize} !important;
            line-height: ${settings.lineHeight} !important;
            letter-spacing: ${settings.letterSpacing} !important;
        }
        
        /* Ensure divs and containers inherit background */
        body div:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-floating-btn):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body section:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body article:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body main:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body header:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body footer:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body nav:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *),
        body aside:not(#awb-accessibility-header):not(#awb-accessibility-header *):not(#awb-summary-panel):not(#awb-summary-panel *):not(#awb-settings-modal):not(#awb-settings-modal *) {
            background-color: ${settings.backgroundColor} !important;
        }
        
        /* Text elements should inherit text color */
        body p:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h1:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h2:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h3:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h4:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h5:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body h6:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body span:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body a:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body li:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body td:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body th:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *),
        body label:not(#awb-accessibility-header *):not(#awb-summary-panel *):not(#awb-settings-modal *) {
            color: ${settings.textColor} !important;
        }
    `;
    
    profileStyle.innerHTML = cssRules;
    document.head.appendChild(profileStyle);
    
    // Apply content hiding
    if (settings.hideVideos) hideElements('video');
    else showElements('video');
    
    if (settings.hideImages) hideElements('img');
    else showElements('img');
    
    // Save applied settings for persistence
    saveCurrentSettings(settings);
    
    console.log('[Adaptive Web Buddy] Profile applied with background:', settings.backgroundColor);
}

// Update a single setting
function updateSingleSetting(setting, value) {
    document.body.style[setting] = value;
}

// Reset everything to original state
function resetAllChanges() {
    // Reset body styles
    document.body.style.fontFamily = '';
    document.body.style.fontSize = '';
    document.body.style.lineHeight = '';
    document.body.style.letterSpacing = '';
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
    
    // Remove all custom style elements
    const customStyles = [
        'awb-font-size-style',
        'awb-dyslexicFont-style',
        'awb-lineHeight-style',
        'awb-letterSpacing-style',
        'awb-profile-style'  // Remove profile styles
    ];
    
    customStyles.forEach(styleId => {
        const style = document.getElementById(styleId);
        if (style) style.remove();
    });
    
    // Reset font size slider to default
    const fontSizeSlider = document.getElementById('awb-font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.value = 16;
    }
    
    // Reset accessibility features state
    accessibilityFeatures = {
        dyslexicFont: false,
        lineHeight: false,
        letterSpacing: false,
        fontSize: 100
    };
    
    // Remove active class from accessibility items
    const accessibilityItems = document.querySelectorAll('.awb-accessibility-item');
    accessibilityItems.forEach(item => item.classList.remove('active'));
    
    // Show all hidden elements
    showAllElements();
    showElements('video');
    showElements('img');
    
    clearSavedSettings();
    
    console.log('[Adaptive Web Buddy] All settings reset to default');
}

// Helper functions
function hideElements(selector) {
    const header = document.getElementById('awb-accessibility-header');
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        // Don't hide elements inside the header
        if (!header || !header.contains(el)) {
            el.style.display = 'none';
        }
    });
}

function showAllElements() {
    const elements = getPageContentElements();
    elements.forEach(el => {
        if (el.style.display === 'none') {
            el.style.display = '';
        }
    });
}

function showElements(selector) {
    const header = document.getElementById('awb-accessibility-header');
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        // Don't show/hide elements inside the header
        if (!header || !header.contains(el)) {
            el.style.display = '';
        }
    });
}

// Save settings to storage (for persistence across page loads)
function saveCurrentSettings(settings) {
    chrome.storage.local.set({currentProfile: settings});
}

function clearSavedSettings() {
    chrome.storage.local.remove('currentProfile');
}

// Apply saved settings when page loads
window.addEventListener('load', function() {
    chrome.storage.local.get(['currentProfile'], function(result) {
        if (result.currentProfile) {
            applyProfileSettings(result.currentProfile);
        }
    });
});

// Inject accessibility header on every page load
(function injectAccessibilityHeader() {
    // Prevent duplicate injection
    if (document.getElementById('awb-accessibility-header')) return;
    
    // Wait for body to be available
    if (!document.body) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectAccessibilityHeader);
        } else {
            setTimeout(injectAccessibilityHeader, 10);
        }
        return;
    }
    
    const header = document.createElement('div');
    header.id = 'awb-accessibility-header';
    
    header.innerHTML = `
        <div class="awb-branding">
            <button id="awb-toggle-header-btn" class="awb-logo-btn" title="Hide header">
                <img src="${chrome.runtime.getURL('icons/logo.png')}" alt="Adaptive Web Buddy" class="awb-logo">
            </button>
            <span class="awb-title">Adaptive Web Buddy</span>
        </div>
        <div class="awb-controls">
            <div class="awb-font-size-container">
                <label for="awb-font-size-slider" class="awb-font-label">A</label>
                <input type="range" id="awb-font-size-slider" class="awb-font-slider" min="12" max="32" value="16" step="1" title="Adjust font size (12px - 32px)">
                <label for="awb-font-size-slider" class="awb-font-label awb-font-label-large">A</label>
            </div>
            <span class="awb-spacer"></span>
            <div class="awb-modes-container">
                <button id="awb-modes-btn" class="awb-mode-btn">📋 Modes</button>
                <div id="awb-modes-dropdown" class="awb-modes-dropdown">
                    <button class="awb-dropdown-item" data-mode="dyslexia">📖 Dyslexia</button>
                    <button class="awb-dropdown-item" data-mode="autism">🧩 Autism</button>
                    <button class="awb-dropdown-item" data-mode="focus">🎯 Focus</button>
                    <button class="awb-dropdown-item" data-mode="reading">📚 Reading</button>
                    <div class="awb-dropdown-divider"></div>
                    <button class="awb-dropdown-item" data-mode="reset">🔄 Reset</button>
                </div>
            </div>
            <span class="awb-spacer"></span>
            <button id="awb-tts-btn" class="awb-feature-btn">🔊 TTS</button>
            <button id="awb-zapper-btn" class="awb-feature-btn">⚡ Zapper</button>
            
            <!-- Accessibility Settings Dropdown -->
            <div class="awb-accessibility-container">
                <button id="awb-accessibility-btn" class="awb-feature-btn" title="Accessibility Settings">⚙️ Accessibility</button>
                <div id="awb-accessibility-dropdown" class="awb-accessibility-dropdown">
                    <button class="awb-accessibility-item" data-feature="dyslexicFont" id="awb-dyslexicfont-item">
                        <span class="awb-checkbox"></span>
                        🔤 Dyslexic Font
                    </button>
                    <button class="awb-accessibility-item" data-feature="lineHeight" id="awb-lineheight-item">
                        <span class="awb-checkbox"></span>
                        ⬆ Line Height
                    </button>
                    <button class="awb-accessibility-item" data-feature="letterSpacing" id="awb-letterspacing-item">
                        <span class="awb-checkbox"></span>
                        ↔️ Letter Spacing
                    </button>
                </div>
            </div>
            
            <button id="awb-ai-summarize-btn" class="awb-feature-btn">✨ Summarize</button>
            <button id="awb-settings-btn" class="awb-feature-btn" title="Settings">⚙️ Settings</button>
        </div>
        <div id="awb-summary-panel" class="awb-summary-panel">
            <div class="awb-summary-header">
                <h3 class="awb-summary-title">✨ AI Summary</h3>
                <button id="awb-close-summary-btn" class="awb-summary-close-btn" title="Close">✕</button>
            </div>
            <div id="awb-summary-status" class="awb-summary-status"></div>
            <div id="awb-summary-output" class="awb-summary-output"></div>
        </div>
        
        <!-- API Key Settings Modal -->
        <div id="awb-settings-modal" class="awb-settings-modal">
            <div class="awb-settings-modal-content">
                <div class="awb-settings-header">
                    <h2>⚙️ Adaptive Web Buddy Settings</h2>
                    <button id="awb-close-settings" class="awb-close-btn" title="Close">✕</button>
                </div>
                <div class="awb-settings-body">
                    <div class="awb-settings-section">
                        <h3>🔑 Google Gemini API Key</h3>
                        <p class="awb-help-text">Required for AI Summarization feature. Get it free from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></p>
                        <input type="password" id="awb-api-key-input" class="awb-settings-input" placeholder="Paste your API key here..." />
                        <div class="awb-settings-buttons">
                            <button id="awb-save-api-key" class="awb-settings-save-btn">💾 Save API Key</button>
                            <button id="awb-clear-api-key" class="awb-settings-clear-btn">🗑️ Clear API Key</button>
                        </div>
                        <div id="awb-api-status" class="awb-settings-status"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.prepend(header);
    
    // Add margin to body to account for fixed header (80px)
    document.body.style.marginTop = '80px';
    
    // Create floating button (initially hidden)
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'awb-floating-btn';
    floatingBtn.className = 'awb-floating-btn';
    floatingBtn.title = 'Show Adaptive Web Buddy';
    floatingBtn.style.display = 'none';
    floatingBtn.innerHTML = `
        <img src="${chrome.runtime.getURL('icons/logo.png')}" alt="Adaptive Web Buddy">
    `;
    document.body.appendChild(floatingBtn);
    
    // Setup header toggle functionality
    setupHeaderToggle();
    
    // Setup modes dropdown functionality
    setupModesDropdown();
    
    // Setup mode buttons
    setupModeButtons();
    
    // Setup feature buttons
    setupFeatureButtons();
    
    // Restore saved preferences
    restoreSavedPreferences();
})();

// Setup header toggle functionality
function setupHeaderToggle() {
    const toggleBtn = document.getElementById('awb-toggle-header-btn');
    const header = document.getElementById('awb-accessibility-header');
    const floatingBtn = document.getElementById('awb-floating-btn');
    
    if (!toggleBtn || !header || !floatingBtn) {
        console.log('Header toggle elements not found:', { toggleBtn, header, floatingBtn });
        return;
    }
    
    console.log('Setting up header toggle');
    
    // Toggle header visibility when logo is clicked
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle button clicked, current visibility:', headerVisible);
        
        headerVisible = false;
        header.style.setProperty('display', 'none', 'important');
        floatingBtn.style.setProperty('display', 'flex', 'important');
        
        // Remove the margin-top from body when header is hidden
        document.body.style.marginTop = '0px';
        
        console.log('Header hidden, floating button shown');
    });
    
    // Show header when floating button is clicked
    floatingBtn.addEventListener('click', (e) => {
        // Check if this was a drag operation
        const wasDragging = floatingBtn.dataset.wasDragging === 'true';
        
        if (!wasDragging) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Floating button clicked - showing header');
            headerVisible = true;
            header.style.setProperty('display', 'flex', 'important');
            floatingBtn.style.setProperty('display', 'none', 'important');
            
            // Restore the margin-top to body when header is shown
            document.body.style.marginTop = '80px';
        }
        
        // Reset the dragging flag
        floatingBtn.dataset.wasDragging = 'false';
    });
    
    // Make floating button draggable
    makeFloatingButtonDraggable(floatingBtn);
}

// Make the floating button draggable
function makeFloatingButtonDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    element.onmousedown = dragMouseDown;
    element.ontouchstart = dragTouchStart;
    
    function dragMouseDown(e) {
        e.preventDefault();
        isDragging = false;
        element.dataset.wasDragging = 'false';
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function dragTouchStart(e) {
        isDragging = false;
        element.dataset.wasDragging = 'false';
        
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDragTouch;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        isDragging = true;
        element.dataset.wasDragging = 'true';
        
        // Calculate new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set new position
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.bottom = "auto";
        element.style.right = "auto";
    }
    
    function elementDragTouch(e) {
        isDragging = true;
        element.dataset.wasDragging = 'true';
        
        const touch = e.touches[0];
        
        // Calculate new cursor position
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        // Set new position
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.bottom = "auto";
        element.style.right = "auto";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
        
        // Small delay to ensure click handler sees the dragging flag
        setTimeout(() => {
            if (!isDragging) {
                element.dataset.wasDragging = 'false';
            }
        }, 50);
    }
}

// Setup modes dropdown
function setupModesDropdown() {
    const modesBtn = document.getElementById('awb-modes-btn');
    const dropdown = document.getElementById('awb-modes-dropdown');
    
    if (!modesBtn || !dropdown) return;
    
    // Toggle dropdown
    modesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        modesBtn.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const modesContainer = document.querySelector('.awb-modes-container');
        if (modesContainer && !modesContainer.contains(e.target)) {
            dropdown.classList.remove('show');
            modesBtn.classList.remove('active');
        }
    });
}

// Setup mode buttons in dropdown
function setupModeButtons() {
    const modeButtons = document.querySelectorAll('.awb-dropdown-item[data-mode]');
    
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = btn.getAttribute('data-mode');
            
            // Close dropdown
            const dropdown = document.getElementById('awb-modes-dropdown');
            const modesBtn = document.getElementById('awb-modes-btn');
            if (dropdown) dropdown.classList.remove('show');
            if (modesBtn) modesBtn.classList.remove('active');
            
            // Apply mode
            switch(mode) {
                case 'dyslexia':
                    applyProfileSettings({
                        fontFamily: "Comic Sans MS, Arial",
                        fontSize: "18px",
                        lineHeight: "1.8",
                        letterSpacing: "0.1em",
                        backgroundColor: "#f5f5f0",
                        textColor: "#000000",
                        hideVideos: false,
                        hideImages: false
                    });
                    break;
                case 'autism':
                    applyProfileSettings({
                        fontFamily: "Arial, sans-serif",
                        fontSize: "16px",
                        lineHeight: "1.6",
                        letterSpacing: "0.08em",
                        backgroundColor: "#f0f4f8",
                        textColor: "#333333",
                        hideVideos: false,
                        hideImages: false,
                        hideFlashingElements: true,
                        reducedAnimations: true
                    });
                    break;
                case 'focus':
                    applyProfileSettings({
                        fontFamily: "Arial, sans-serif",
                        fontSize: "16px",
                        lineHeight: "1.5",
                        letterSpacing: "0.05em",
                        backgroundColor: "#2d2d2d",
                        textColor: "#e0e0e0",
                        hideImages: true,
                        hideVideos: true
                    });
                    break;
                case 'reading':
                    applyProfileSettings({
                        fontFamily: "Georgia, serif",
                        fontSize: "17px",
                        lineHeight: "2.0",
                        letterSpacing: "0.05em",
                        backgroundColor: "#fffef0",
                        textColor: "#2c3e50",
                        hideImages: false,
                        hideVideos: false
                    });
                    break;
                case 'reset':
                    resetAllChanges();
                    break;
            }
        });
    });
}

// Restore saved preferences from storage
function restoreSavedPreferences() {
    chrome.storage.local.get([
        'fontSizePx',
        'dyslexicFont',
        'lineHeight',
        'letterSpacing'
    ], function(result) {
        console.log('[Adaptive Web Buddy] Restoring saved preferences:', result);
        
        // Restore font size
        if (result.fontSizePx) {
            const slider = document.getElementById('awb-font-size-slider');
            if (slider) {
                slider.value = result.fontSizePx;
                applyFontSize(result.fontSizePx);
            }
        }
        
        // Restore accessibility features
        if (result.dyslexicFont) {
            accessibilityFeatures.dyslexicFont = true;
            applyDyslexicFont(true);
            const item = document.getElementById('awb-dyslexicfont-item');
            if (item) item.classList.add('active');
        }
        
        if (result.lineHeight) {
            accessibilityFeatures.lineHeight = true;
            applyLineHeight(true);
            const item = document.getElementById('awb-lineheight-item');
            if (item) item.classList.add('active');
        }
        
        if (result.letterSpacing) {
            accessibilityFeatures.letterSpacing = true;
            applyLetterSpacing(true);
            const item = document.getElementById('awb-letterspacing-item');
            if (item) item.classList.add('active');
        }
    });
}

// Setup feature buttons
function setupFeatureButtons() {
    // Font Size Slider with throttling for responsiveness
    const fontSizeSlider = document.getElementById('awb-font-size-slider');
    if (fontSizeSlider) {
        let fontSizeTimeout;
        
        fontSizeSlider.addEventListener('input', function() {
            const fontSize = parseInt(this.value);
            accessibilityFeatures.fontSize = fontSize;
            
            // Apply immediately for visual feedback
            applyFontSize(fontSize);
            
            // Throttle storage update (50ms)
            clearTimeout(fontSizeTimeout);
            fontSizeTimeout = setTimeout(() => {
                chrome.storage.local.set({fontSizePx: fontSize});
            }, 50);
        });
        
        // Load saved font size
        chrome.storage.local.get('fontSizePx', function(result) {
            if (result.fontSizePx) {
                fontSizeSlider.value = result.fontSizePx;
                applyFontSize(result.fontSizePx);
            }
        });
    }
    
    // Text-to-Speech
    const ttsBtn = document.getElementById('awb-tts-btn');
    if (ttsBtn) {
        ttsBtn.onclick = function() {
            ttsEnabled = !ttsEnabled;
            toggleTextToSpeech(ttsEnabled);
            this.classList.toggle('active', ttsEnabled);
        };
    }
    
    // Zapper
    const zapperBtn = document.getElementById('awb-zapper-btn');
    if (zapperBtn) {
        zapperBtn.onclick = function() {
            zapperEnabled = !zapperEnabled;
            toggleZapper(zapperEnabled);
            this.classList.toggle('active', zapperEnabled);
        };
    }
    
    // Accessibility Settings Dropdown
    const accessibilityBtn = document.getElementById('awb-accessibility-btn');
    const accessibilityDropdown = document.getElementById('awb-accessibility-dropdown');
    const accessibilityItems = document.querySelectorAll('.awb-accessibility-item');
    
    if (accessibilityBtn && accessibilityDropdown) {
        accessibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accessibilityDropdown.classList.toggle('show');
        });
        
        accessibilityItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const feature = item.getAttribute('data-feature');
                accessibilityFeatures[feature] = !accessibilityFeatures[feature];
                
                if (accessibilityFeatures[feature]) {
                    applyAccessibilityFeature(feature);
                    item.classList.add('active');
                } else {
                    removeAccessibilityFeature(feature);
                    item.classList.remove('active');
                }
                
                // Save state
                chrome.storage.local.set({accessibilityFeatures: accessibilityFeatures});
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            const container = document.querySelector('.awb-accessibility-container');
            if (container && !container.contains(e.target)) {
                accessibilityDropdown.classList.remove('show');
            }
        });
    }
    
    // AI Summarize Button
    const aiSummarizeBtn = document.getElementById('awb-ai-summarize-btn');
    if (aiSummarizeBtn) {
        console.log('[Adaptive Web Buddy] Summarize button found, attaching handler');
        aiSummarizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Adaptive Web Buddy] Summarize button clicked');
            summarizePageContent();
            this.classList.toggle('active');
        });
    } else {
        console.error('[Adaptive Web Buddy] Summarize button NOT found');
    }
    
    // Settings Button and Modal
    const settingsBtn = document.getElementById('awb-settings-btn');
    const settingsModal = document.getElementById('awb-settings-modal');
    const closeSettingsBtn = document.getElementById('awb-close-settings');
    const saveApiKeyBtn = document.getElementById('awb-save-api-key');
    const clearApiKeyBtn = document.getElementById('awb-clear-api-key');
    const apiKeyInput = document.getElementById('awb-api-key-input');
    const apiStatus = document.getElementById('awb-api-status');
    
    if (settingsBtn && settingsModal) {
        // Open settings modal
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsModal.classList.add('show');
            // Load existing API key
            chrome.storage.local.get('geminiApiKey', (result) => {
                if (result.geminiApiKey) {
                    apiKeyInput.value = result.geminiApiKey;
                }
            });
        });
        
        // Close settings modal
        closeSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsModal.classList.remove('show');
            apiStatus.textContent = '';
            apiStatus.className = 'awb-settings-status';
        });
        
        // Close on outside click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
                apiStatus.textContent = '';
                apiStatus.className = 'awb-settings-status';
            }
        });
        
        // Save API Key
        saveApiKeyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const apiKey = apiKeyInput.value.trim();
            
            if (!apiKey) {
                apiStatus.textContent = '❌ Please enter an API key';
                apiStatus.className = 'awb-settings-status error';
                return;
            }
            
            if (apiKey.length < 20) {
                apiStatus.textContent = '❌ API key seems too short. Please check and try again.';
                apiStatus.className = 'awb-settings-status error';
                return;
            }
            
            // Save to storage
            chrome.storage.local.set({geminiApiKey: apiKey}, () => {
                apiStatus.textContent = '✅ API Key saved successfully! You can now use Summarize.';
                apiStatus.className = 'awb-settings-status success';
                
                setTimeout(() => {
                    settingsModal.classList.remove('show');
                    apiStatus.textContent = '';
                    apiStatus.className = 'awb-settings-status';
                }, 2000);
            });
        });
        
        // Clear API Key
        clearApiKeyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.storage.local.remove('geminiApiKey', () => {
                apiKeyInput.value = '';
                apiStatus.textContent = '🗑️ API Key cleared';
                apiStatus.className = 'awb-settings-status info';
                
                setTimeout(() => {
                    apiStatus.textContent = '';
                    apiStatus.className = 'awb-settings-status';
                }, 1500);
            });
        });
    }
    
    // Summary Panel Close Button
    const closeSummaryBtn = document.getElementById('awb-close-summary-btn');
    const summaryPanel = document.getElementById('awb-summary-panel');
    
    if (closeSummaryBtn && summaryPanel) {
        console.log('[Adaptive Web Buddy] Summary close button found, attaching handler');
        
        // Close summary panel when close button is clicked
        closeSummaryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            summaryPanel.classList.remove('show');
            console.log('[Adaptive Web Buddy] Summary panel closed by user');
        });
        
        // Close on outside click
        summaryPanel.addEventListener('click', (e) => {
            if (e.target === summaryPanel) {
                summaryPanel.classList.remove('show');
                console.log('[Adaptive Web Buddy] Summary panel closed by clicking outside');
            }
        });
    } else {
        if (!closeSummaryBtn) console.warn('[Adaptive Web Buddy] Summary close button NOT found');
        if (!summaryPanel) console.warn('[Adaptive Web Buddy] Summary panel NOT found');
    }
}

// Text-to-Speech Functions
function toggleTextToSpeech(enabled) {
    ttsEnabled = enabled;
    
    if (enabled) {
        addTextToSpeechControls();
    } else {
        removeTextToSpeechControls();
        window.speechSynthesis.cancel();
    }
}

function addTextToSpeechControls() {
    document.addEventListener('click', handleTTSClick, true);
    showTTSNotification();
}

function removeTextToSpeechControls() {
    document.removeEventListener('click', handleTTSClick, true);
    window.speechSynthesis.cancel();
    removeTTSNotification();
}

function handleTTSClick(event) {
    if (!ttsEnabled) return;
    
    // Don't trigger TTS for clicks on the header
    const header = document.getElementById('awb-accessibility-header');
    if (header && header.contains(event.target)) return;
    
    if (event.target.innerText) {
        const selectedText = getSelectedText() || event.target.innerText;
        if (selectedText.trim().length > 0) {
            speakText(selectedText);
        }
    }
}

function getSelectedText() {
    if (window.getSelection) {
        return window.getSelection().toString();
    } else if (document.selection) {
        return document.selection.createRange().text;
    }
    return '';
}

function speakText(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
}

function showTTSNotification() {
    if (document.getElementById('tts-notification')) return;
    
    const notification = document.createElement('div');
    notification.id = 'tts-notification';
    notification.innerHTML = '🔊 Text-to-Speech Enabled - Click any text to listen';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function removeTTSNotification() {
    const notification = document.getElementById('tts-notification');
    if (notification) notification.remove();
}

// Accessibility Features Functions
function toggleAccessibilityFeature(feature, enabled) {
    accessibilityFeatures[feature] = enabled;
    
    if (enabled) {
        applyAccessibilityFeature(feature);
    } else {
        removeAccessibilityFeature(feature);
    }
}

function applyAccessibilityFeature(feature) {
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, div, li, a, button, label, td, th, article, section, main, nav, aside, blockquote, pre, code, strong, em, b, i';
    
    let styleId = `awb-${feature}-style`;
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = styleId;
    
    switch(feature) {
        case 'dyslexicFont':
            style.innerHTML = `${selector} { font-family: 'Comic Sans MS', Arial, sans-serif !important; }`;
            break;
        case 'lineHeight':
            style.innerHTML = `${selector} { line-height: 2.5 !important; }`;
            break;
        case 'letterSpacing':
            style.innerHTML = `${selector} { letter-spacing: 0.15em !important; }`;
            break;
    }
    
    document.head.appendChild(style);
}

function removeAccessibilityFeature(feature) {
    let styleId = `awb-${feature}-style`;
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
}

// Font Size Control - Uses CSS for instant response
function applyFontSize(fontSizePx) {
    const targetSize = parseInt(fontSizePx);
    
    // Remove existing font size style
    let fontSizeStyle = document.getElementById('awb-font-size-style');
    if (fontSizeStyle) fontSizeStyle.remove();
    
    // Create new CSS rule for instant application (excludes header)
    fontSizeStyle = document.createElement('style');
    fontSizeStyle.id = 'awb-font-size-style';
    fontSizeStyle.innerHTML = `
        body *:not(#awb-accessibility-header):not(#awb-accessibility-header *) {
            font-size: ${targetSize}px !important;
        }
    `;
    document.head.appendChild(fontSizeStyle);
}

// Zapper Functions
function toggleZapper(enabled) {
    zapperEnabled = enabled;
    
    if (enabled) {
        enableZapperMode();
    } else {
        disableZapperMode();
    }
}

function enableZapperMode() {
    showZapperCursor();
    document.addEventListener('click', zapperClickHandler, true);
    document.addEventListener('keydown', zapperKeyHandler, true);
    document.addEventListener('mouseover', zapperHoverHandler, true);
    document.addEventListener('mouseout', zapperUnhoverHandler, true);
}

function disableZapperMode() {
    document.removeEventListener('click', zapperClickHandler, true);
    document.removeEventListener('keydown', zapperKeyHandler, true);
    document.removeEventListener('mouseover', zapperHoverHandler, true);
    document.removeEventListener('mouseout', zapperUnhoverHandler, true);
    
    document.body.style.cursor = '';
    
    const highlighted = document.querySelectorAll('[data-zapper-hover]');
    highlighted.forEach(el => {
        el.style.outline = '';
        el.removeAttribute('data-zapper-hover');
    });
    
    removeZapperCursor();
}

function zapperClickHandler(e) {
    if (!zapperEnabled) return;
    
    const header = document.getElementById('awb-accessibility-header');
    if (header && header.contains(e.target)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    
    if (element === document.body || element === document.documentElement || 
        element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        return;
    }
    
    removedElements.push({
        element: element,
        parent: element.parentNode,
        nextSibling: element.nextSibling
    });
    
    showRemovalFeedback(element);
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 300);
}

function zapperKeyHandler(e) {
    if (e.key === 'Escape') {
        zapperEnabled = false;
        disableZapperMode();
        
        const zapperBtn = document.getElementById('awb-zapper-btn');
        if (zapperBtn) zapperBtn.classList.remove('active');
        
        chrome.runtime.sendMessage({
            action: 'zapperDisabled'
        });
    }
}

function zapperHoverHandler(e) {
    if (!zapperEnabled) return;
    
    const header = document.getElementById('awb-accessibility-header');
    if (header && header.contains(e.target)) return;
    
    if (e.target !== document.body && e.target !== document.documentElement) {
        e.target.setAttribute('data-zapper-hover', 'true');
        e.target.style.outline = '3px solid #f5576c';
        e.target.style.outlineOffset = '-3px';
    }
}

function zapperUnhoverHandler(e) {
    if (e.target.hasAttribute('data-zapper-hover')) {
        e.target.style.outline = '';
        e.target.removeAttribute('data-zapper-hover');
    }
}

// Extract page text for summarization
function extractPageText() {
    try {
        const header = document.getElementById('awb-accessibility-header');
        
        // Get all text content from the page
        let textContent = '';
        
        // Method 1: Try using innerText (works better for most pages)
        if (document.body.innerText) {
            textContent = document.body.innerText;
        }
        
        // Method 2: If innerText fails, try textContent
        if (!textContent && document.body.textContent) {
            textContent = document.body.textContent;
        }
        
        // Method 3: Manual extraction from content elements
        if (!textContent || textContent.trim().length < 100) {
            const contentElements = document.querySelectorAll(
                'p, h1, h2, h3, h4, h5, h6, article, main, section, div[class*="content"], div[class*="article"], div[class*="post"], span'
            );
            
            const texts = Array.from(contentElements)
                .map(el => el.innerText || el.textContent)
                .filter(text => text && text.trim().length > 10)
                .slice(0, 100); // Limit to prevent too much extraction
            
            textContent = texts.join('\n');
        }
        
        // Remove header text if present
        if (header) {
            const headerText = header.innerText || header.textContent;
            if (headerText) {
                textContent = textContent.replace(headerText, '');
            }
        }
        
        // Clean up text
        textContent = textContent
            .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
            .replace(/\s{2,}/g, ' ')    // Remove excessive spaces
            .trim();
        
        console.log('[Adaptive Web Buddy] Extracted text length:', textContent.length, 'characters');
        
        return textContent;
    } catch (error) {
        console.error('[Adaptive Web Buddy] Error extracting text:', error);
        return '';
    }
}

// AI Summarization Functions
async function summarizePageContent() {
    console.log('[Adaptive Web Buddy] Summarize started');
    
    const statusDiv = document.getElementById('awb-summary-status');
    const outputDiv = document.getElementById('awb-summary-output');
    const panelDiv = document.getElementById('awb-summary-panel');
    const aiBtn = document.getElementById('awb-ai-summarize-btn');
    
    console.log('[Adaptive Web Buddy] Elements found:', {
        statusDiv: !!statusDiv,
        outputDiv: !!outputDiv,
        panelDiv: !!panelDiv,
        aiBtn: !!aiBtn
    });
    
    if (!panelDiv || !statusDiv || !outputDiv) {
        console.error('[Adaptive Web Buddy] Summary panel elements not found');
        alert('Error: Summary panel not loaded. Please refresh the page.');
        return;
    }
    
    // Check if API key is configured
    const apiKeyData = await chrome.storage.local.get('geminiApiKey');
    console.log('[Adaptive Web Buddy] API Key check:', { hasKey: !!apiKeyData.geminiApiKey });
    
    if (!apiKeyData.geminiApiKey || apiKeyData.geminiApiKey === 'YOUR_API_KEY_HERE') {
        statusDiv.textContent = '❌ API Key not configured. Click Settings to add your API key.';
        statusDiv.className = 'awb-summary-status error show';
        panelDiv.classList.add('show');
        console.log('[Adaptive Web Buddy] No API key, showing panel with error');
        return;
    }
    
    statusDiv.textContent = '⏳ Extracting text from page...';
    statusDiv.className = 'awb-summary-status loading show';
    outputDiv.classList.remove('show');
    outputDiv.textContent = '';
    panelDiv.classList.add('show');
    console.log('[Adaptive Web Buddy] Panel shown with loading state');
    
    try {
        const pageText = extractPageText();
        console.log('[Adaptive Web Buddy] Extracted text length:', pageText.length);
        
        if (!pageText || pageText.trim().length < 100) {
            statusDiv.textContent = '❌ Not enough text on this page. Try a news article, blog post, or Wikipedia article.';
            statusDiv.className = 'awb-summary-status error show';
            console.log('[Adaptive Web Buddy] Insufficient text on page (minimum 100 chars required)');
            return;
        }
        
        statusDiv.textContent = '📄 Generating summary... Please wait 10-30 seconds...';
        statusDiv.className = 'awb-summary-status loading show';
        console.log('[Adaptive Web Buddy] Sending to API...');
        
        // Call Gemini API
        const summary = await callGeminiAPI(pageText, apiKeyData.geminiApiKey);
        
        if (summary && summary.trim().length > 0) {
            statusDiv.textContent = '✅ Summary generated successfully!';
            statusDiv.className = 'awb-summary-status success show';
            outputDiv.textContent = summary;
            outputDiv.classList.add('show');
            console.log('[Adaptive Web Buddy] Summary displayed successfully');
        } else {
            statusDiv.textContent = '❌ Failed to generate summary. Try again.';
            statusDiv.className = 'awb-summary-status error show';
            console.log('[Adaptive Web Buddy] Empty summary received');
        }
        
    } catch (error) {
        console.error('[Adaptive Web Buddy] Summarization error:', error);
        
        let errorMsg = error.message || 'Unknown error occurred';
        if (errorMsg.includes('timeout')) {
            errorMsg = 'Request took too long. Try with shorter content.';
        }
        if (errorMsg.includes('API')) {
            errorMsg = 'API error: Check your API key in Settings.';
        }
        
        statusDiv.textContent = `❌ ${errorMsg}`;
        statusDiv.className = 'awb-summary-status error show';
        console.log('[Adaptive Web Buddy] Error shown:', errorMsg);
    }
}

// Call Gemini API with multiple model fallbacks
async function callGeminiAPI(text, apiKey) {
    const TIMEOUT = 60000;
    const MAX_RETRIES = 1;
    
    const modelsToTry = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b'
    ];
    
    let lastError;
    
    for (const model of modelsToTry) {
        console.log(`[Adaptive Web Buddy] Trying model: ${model}`);
        
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const words = text.split(/\s+/);
                const truncatedText = words.slice(0, 2000).join(' ');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
                
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `Create a clear, concise summary of this webpage in exactly 5-6 lines or bullet points. Each line should be short and easy to read (15-30 words max). Focus on the main ideas only:\n\n${truncatedText}`
                                }]
                            }],
                            generationConfig: {
                                maxOutputTokens: 300,
                                temperature: 0.5
                            }
                        }),
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                    
                    console.log(`[Adaptive Web Buddy] Response status: ${response.status}, message: ${errorMsg}`);
                    
                    if (response.status === 404 || errorMsg.includes('not found')) {
                        console.warn(`[Adaptive Web Buddy] ${model} not found, trying next model...`);
                        lastError = new Error(`${model} not available`);
                        break;
                    }
                    
                    if (response.status === 401 || errorMsg.includes('API key')) {
                        throw new Error('Invalid API key. Please check your API key in Settings.');
                    }
                    
                    if (response.status === 429) {
                        throw new Error('API rate limit exceeded. Try again in a few moments.');
                    }
                    
                    throw new Error(errorMsg);
                }
                
                const data = await response.json();
                console.log(`[Adaptive Web Buddy] API response received from ${model}`);
                
                const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!summary) {
                    console.warn('[Adaptive Web Buddy] No summary text in response');
                    throw new Error('No summary received from API');
                }
                
                console.log(`[Adaptive Web Buddy] ✓ Summary generated with ${model} (${summary.length} chars)`);
                return summary;
                
            } catch (error) {
                lastError = error;
                console.error(`[Adaptive Web Buddy] ${model} error:`, error.message);
                
                if (error.name === 'AbortError') {
                    break;
                }
                
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    }
    
    if (lastError?.name === 'AbortError') {
        throw new Error('Request timeout after 60 seconds. Try with shorter content.');
    }
    
    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

function showZapperCursor() {
    if (!document.getElementById('zapper-cursor-style')) {
        const style = document.createElement('style');
        style.id = 'zapper-cursor-style';
        style.innerHTML = `
            body.zapper-mode * {
                cursor: crosshair !important;
            }
        `;
        document.head.appendChild(style);
    }
    document.body.classList.add('zapper-mode');
}

function removeZapperCursor() {
    const style = document.getElementById('zapper-cursor-style');
    if (style) style.remove();
    document.body.classList.remove('zapper-mode');
}

function showRemovalFeedback(element) {
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.95)';
}

// Listener to receive messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Message handler for future extensibility
});