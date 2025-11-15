// contentScript.js - Actually modifies the webpage DOM

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
