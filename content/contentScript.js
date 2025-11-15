// contentScript.js - Actually modifies the webpage DOM

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

// Apply all settings from a profile
function applyProfileSettings(settings) {
    console.log("Applying settings:", settings);
    
    // Apply visual settings
    document.body.style.fontFamily = settings.fontFamily;
    document.body.style.fontSize = settings.fontSize;
    document.body.style.lineHeight = settings.lineHeight;
    document.body.style.letterSpacing = settings.letterSpacing;
    document.body.style.backgroundColor = settings.backgroundColor;
    document.body.style.color = settings.textColor;
    
    // Apply content hiding
    if (settings.hideVideos) {
        hideElements('video');
    }
    if (settings.hideImages) {
        hideElements('img');
    }
    
    // Save applied settings for persistence
    saveCurrentSettings(settings);
}

// Update a single setting
function updateSingleSetting(setting, value) {
    document.body.style[setting] = value;
}

// Reset everything to original state
function resetAllChanges() {
    document.body.style.fontFamily = '';
    document.body.style.fontSize = '';
    document.body.style.lineHeight = '';
    document.body.style.letterSpacing = '';
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
    
    // Show all hidden elements
    showAllElements();
    
    // Clear saved settings
    clearSavedSettings();
}

// Helper functions
function hideElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.style.display = 'none';
    });
}

function showAllElements() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        el.style.display = '';
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
    // Add click listeners to selectable text
    document.addEventListener('click', function(event) {
        if (ttsEnabled && event.target.innerText) {
            const selectedText = getSelectedText() || event.target.innerText;
            if (selectedText.trim().length > 0) {
                speakText(selectedText);
            }
        }
    }, true);
    
    // Add tooltip to show text-to-speech is enabled
    showTTSNotification();
}

function removeTextToSpeechControls() {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    removeTTSNotification();
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
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
}

function showTTSNotification() {
    // Check if notification already exists
    if (document.getElementById('tts-notification')) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.id = 'tts-notification';
    notification.innerHTML = '🔊 Text-to-Speech Enabled - Click any text to listen';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function removeTTSNotification() {
    const notification = document.getElementById('tts-notification');
    if (notification) {
        notification.remove();
    }
}

// Add animation styles
if (!document.getElementById('tts-styles')) {
    const style = document.createElement('style');
    style.id = 'tts-styles';
    style.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
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
    const body = document.body;
    const allElements = document.querySelectorAll('*');
    
    switch(feature) {
        case 'highContrast':
            // Apply high contrast mode
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#FFFF00';
            allElements.forEach(el => {
                const currentBg = window.getComputedStyle(el).backgroundColor;
                const currentColor = window.getComputedStyle(el).color;
                
                if (currentBg !== 'rgba(0, 0, 0, 0)' && currentBg !== 'transparent') {
                    el.style.backgroundColor = '#000000';
                }
                if (currentColor !== 'rgba(255, 255, 0, 1)') {
                    el.style.color = '#FFFF00';
                }
            });
            break;
            
        case 'dyslexicFont':
            // Apply dyslexic-friendly font (Comic Sans as fallback)
            body.style.fontFamily = 'Comic Sans MS, Arial, sans-serif';
            allElements.forEach(el => {
                el.style.fontFamily = 'Comic Sans MS, Arial, sans-serif';
            });
            break;
            
        case 'lineHeight':
            // Increase line height for better readability
            body.style.lineHeight = '2.5';
            allElements.forEach(el => {
                el.style.lineHeight = '2.5';
            });
            break;
            
        case 'letterSpacing':
            // Increase letter spacing
            body.style.letterSpacing = '0.15em';
            allElements.forEach(el => {
                el.style.letterSpacing = '0.15em';
            });
            break;
    }
}

function removeAccessibilityFeature(feature) {
    const body = document.body;
    const allElements = document.querySelectorAll('*');
    
    switch(feature) {
        case 'highContrast':
            body.style.backgroundColor = '';
            body.style.color = '';
            allElements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.color = '';
            });
            break;
            
        case 'dyslexicFont':
            body.style.fontFamily = '';
            allElements.forEach(el => {
                el.style.fontFamily = '';
            });
            break;
            
        case 'lineHeight':
            body.style.lineHeight = '';
            allElements.forEach(el => {
                el.style.lineHeight = '';
            });
            break;
            
        case 'letterSpacing':
            body.style.letterSpacing = '';
            allElements.forEach(el => {
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
    // Show cursor indicator
    showZapperCursor();
    
    // Add click handler to remove elements
    document.addEventListener('click', zapperClickHandler, true);
    
    // Add keyboard handler to exit zapper mode
    document.addEventListener('keydown', zapperKeyHandler, true);
    
    // Add hover effect to show which elements can be removed
    document.addEventListener('mouseover', zapperHoverHandler, true);
    document.addEventListener('mouseout', zapperUnhoverHandler, true);
}

function disableZapperMode() {
    // Remove event listeners
    document.removeEventListener('click', zapperClickHandler, true);
    document.removeEventListener('keydown', zapperKeyHandler, true);
    document.removeEventListener('mouseover', zapperHoverHandler, true);
    document.removeEventListener('mouseout', zapperUnhoverHandler, true);
    
    // Reset cursor
    document.body.style.cursor = 'auto';
    
    // Remove hover highlights
    const highlighted = document.querySelectorAll('[data-zapper-hover]');
    highlighted.forEach(el => {
        el.style.outline = '';
        el.removeAttribute('data-zapper-hover');
    });
    
    // Remove cursor indicator
    removeZapperCursor();
}

function zapperClickHandler(e) {
    if (zapperEnabled) {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        
        // Don't remove certain elements
        if (element === document.body || element === document.html || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
            return;
        }
        
        // Store original element before removing
        removedElements.push({
            element: element,
            parent: element.parentNode,
            nextSibling: element.nextSibling
        });
        
        // Show removal feedback
        showRemovalFeedback(element);
        
        // Remove element
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    }
}

function zapperKeyHandler(e) {
    // Press ESC to exit zapper mode
    if (e.key === 'Escape') {
        zapperEnabled = false;
        disableZapperMode();
        
        // Send message to popup to deactivate button
        chrome.runtime.sendMessage({
            action: 'zapperDisabled'
        });
    }
}

function zapperHoverHandler(e) {
    if (zapperEnabled && e.target !== document.body && e.target !== document.html) {
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
    // Create a custom cursor style
    const style = document.createElement('style');
    style.id = 'zapper-cursor-style';
    style.innerHTML = `
        body.zapper-mode * {
            cursor: crosshair !important;
        }
    `;
    document.head.appendChild(style);
    document.body.classList.add('zapper-mode');
}

function removeZapperCursor() {
    const style = document.getElementById('zapper-cursor-style');
    if (style) {
        style.remove();
    }
    document.body.classList.remove('zapper-mode');
}

function showRemovalFeedback(element) {
    // Add a visual feedback animation
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.95)';
}

function showZapperCursor() {
    document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="%23f5576c" stroke-width="2"/><line x1="16" y1="5" x2="16" y2="10" stroke="%23f5576c" stroke-width="2"/><line x1="16" y1="22" x2="16" y2="27" stroke="%23f5576c" stroke-width="2"/><line x1="5" y1="16" x2="10" y2="16" stroke="%23f5576c" stroke-width="2"/><line x1="22" y1="16" x2="27" y2="16" stroke="%23f5576c" stroke-width="2"/></svg>') 16 16, crosshair`;
}