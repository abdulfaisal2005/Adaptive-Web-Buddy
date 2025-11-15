// contentScript.js - Actually modifies the webpage DOM (SIMPLIFIED VERSION)

// Text-to-Speech state
let ttsEnabled = false;

// Zapper mode state
let zapperEnabled = false;
let removedElements = [];

// Accessibility features state
let accessibilityFeatures = {
    highContrast: false,
    dyslexicFont: false,
    lineHeight: false,
    letterSpacing: false
};

// Header visibility state
let headerVisible = true;

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received in content script:", request);
    
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
    
    return true; // Keep message channel open for async response
});

// Helper function to get all page content elements (excluding header and its children)
function getPageContentElements() {
    const allElements = document.querySelectorAll('body *');
    const header = document.getElementById('awb-accessibility-header');
    
    return Array.from(allElements).filter(el => {
        // Exclude the header itself
        if (el.id === 'awb-accessibility-header') return false;
        
        // Exclude any descendants of the header
        if (header && header.contains(el)) return false;
        
        // Exclude TTS notification
        if (el.id === 'tts-notification') return false;
        
        return true;
    });
}

// Apply all settings from a profile
function applyProfileSettings(settings) {
    console.log("Applying settings:", settings);
    const elements = getPageContentElements();
    
    elements.forEach(el => {
        if (settings.fontFamily) el.style.fontFamily = settings.fontFamily;
        if (settings.fontSize) el.style.fontSize = settings.fontSize;
        if (settings.lineHeight) el.style.lineHeight = settings.lineHeight;
        if (settings.letterSpacing) el.style.letterSpacing = settings.letterSpacing;
        if (settings.backgroundColor) el.style.backgroundColor = settings.backgroundColor;
        if (settings.textColor) el.style.color = settings.textColor;
    });
    
    // Apply content hiding
    if (settings.hideVideos) hideElements('video');
    if (settings.hideImages) hideElements('img');
    
    // Save applied settings for persistence
    saveCurrentSettings(settings);
}

// Update a single setting
function updateSingleSetting(setting, value) {
    const elements = getPageContentElements();
    elements.forEach(el => {
        el.style[setting] = value;
    });
}

// Reset everything to original state
function resetAllChanges() {
    const elements = getPageContentElements();
    elements.forEach(el => {
        el.style.fontFamily = '';
        el.style.fontSize = '';
        el.style.lineHeight = '';
        el.style.letterSpacing = '';
        el.style.backgroundColor = '';
        el.style.color = '';
    });
    showAllElements();
    clearSavedSettings();
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
            <button id="awb-highcontrast-btn" class="awb-feature-btn">⚫ Contrast</button>
            <button id="awb-dyslexicfont-btn" class="awb-feature-btn">🔤 Font</button>
            <button id="awb-lineheight-btn" class="awb-feature-btn">⬍ Height</button>
            <button id="awb-letterspacing-btn" class="awb-feature-btn">↔️ Space</button>
        </div>
    `;
    
    document.body.prepend(header);
    
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
                        backgroundColor: "#f0f0f0",
                        textColor: "#000000",
                        hideVideos: true
                    });
                    break;
                case 'autism':
                    applyProfileSettings({
                        fontFamily: "Arial, sans-serif",
                        fontSize: "16px",
                        lineHeight: "1.6",
                        letterSpacing: "0.08em",
                        backgroundColor: "#f5f5f5",
                        textColor: "#333333",
                        hideVideos: true,
                        hideFlashingElements: true,
                        reducedAnimations: true
                    });
                    break;
                case 'focus':
                    applyProfileSettings({
                        fontFamily: "Arial, sans-serif",
                        fontSize: "16px",
                        backgroundColor: "#1a1a1a",
                        textColor: "#00ff00",
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
                        backgroundColor: "#fffacd",
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

// Setup feature buttons
function setupFeatureButtons() {
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
    
    // High Contrast
    const highContrastBtn = document.getElementById('awb-highcontrast-btn');
    if (highContrastBtn) {
        highContrastBtn.onclick = function() {
            accessibilityFeatures.highContrast = !accessibilityFeatures.highContrast;
            toggleAccessibilityFeature('highContrast', accessibilityFeatures.highContrast);
            this.classList.toggle('active', accessibilityFeatures.highContrast);
        };
    }
    
    // Dyslexic Font
    const dyslexicFontBtn = document.getElementById('awb-dyslexicfont-btn');
    if (dyslexicFontBtn) {
        dyslexicFontBtn.onclick = function() {
            accessibilityFeatures.dyslexicFont = !accessibilityFeatures.dyslexicFont;
            toggleAccessibilityFeature('dyslexicFont', accessibilityFeatures.dyslexicFont);
            this.classList.toggle('active', accessibilityFeatures.dyslexicFont);
        };
    }
    
    // Line Height
    const lineHeightBtn = document.getElementById('awb-lineheight-btn');
    if (lineHeightBtn) {
        lineHeightBtn.onclick = function() {
            accessibilityFeatures.lineHeight = !accessibilityFeatures.lineHeight;
            toggleAccessibilityFeature('lineHeight', accessibilityFeatures.lineHeight);
            this.classList.toggle('active', accessibilityFeatures.lineHeight);
        };
    }
    
    // Letter Spacing
    const letterSpacingBtn = document.getElementById('awb-letterspacing-btn');
    if (letterSpacingBtn) {
        letterSpacingBtn.onclick = function() {
            accessibilityFeatures.letterSpacing = !accessibilityFeatures.letterSpacing;
            toggleAccessibilityFeature('letterSpacing', accessibilityFeatures.letterSpacing);
            this.classList.toggle('active', accessibilityFeatures.letterSpacing);
        };
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
    const elements = getPageContentElements();
    
    switch(feature) {
        case 'highContrast':
            elements.forEach(el => {
                el.style.backgroundColor = '#000000';
                el.style.color = '#FFFF00';
            });
            break;
        case 'dyslexicFont':
            elements.forEach(el => {
                el.style.fontFamily = 'Comic Sans MS, Arial, sans-serif';
            });
            break;
        case 'lineHeight':
            elements.forEach(el => {
                el.style.lineHeight = '2.5';
            });
            break;
        case 'letterSpacing':
            elements.forEach(el => {
                el.style.letterSpacing = '0.15em';
            });
            break;
    }
}

function removeAccessibilityFeature(feature) {
    const elements = getPageContentElements();
    
    switch(feature) {
        case 'highContrast':
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.color = '';
            });
            break;
        case 'dyslexicFont':
            elements.forEach(el => {
                el.style.fontFamily = '';
            });
            break;
        case 'lineHeight':
            elements.forEach(el => {
                el.style.lineHeight = '';
            });
            break;
        case 'letterSpacing':
            elements.forEach(el => {
                el.style.letterSpacing = '';
            });
            break;
    }
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