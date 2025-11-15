// popup.js - Handles button clicks and communicates with content script

// When the popup loads
document.addEventListener('DOMContentLoaded', function() {
    
    // Modes dropdown functionality
    const modesBtn = document.getElementById('modesBtn');
    const modesDropdown = document.getElementById('modesDropdown');
    const modeOptions = document.querySelectorAll('.mode-option');
    
    // Toggle dropdown when modes button is clicked
    modesBtn.addEventListener('click', function() {
        modesDropdown.classList.toggle('show');
        modesBtn.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.modes-section')) {
            modesDropdown.classList.remove('show');
            modesBtn.classList.remove('active');
        }
    });
    
    // Handle mode option clicks
    modeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const profileName = this.getAttribute('data-profile');
            applyProfile(profileName);
            
            // Close dropdown after selection
            modesDropdown.classList.remove('show');
            modesBtn.classList.remove('active');
        });
    });
    
    // Text to Speech button functionality
    const ttsBtn = document.getElementById('ttsBtn');
    ttsBtn.addEventListener('click', function() {
        ttsBtn.classList.toggle('active');
        
        // Send message to content script to toggle text-to-speech
        sendMessageToContentScript({
            action: 'toggleTextToSpeech',
            enabled: ttsBtn.classList.contains('active')
        });
    });
    
    // Font size slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            document.getElementById('fontSizeValue').textContent = this.value;
            // Apply font size change immediately
            sendMessageToContentScript({
                action: 'updateSetting',
                setting: 'fontSize',
                value: this.value + 'px'
            });
        });
    }
    
    // Accessibility Feature Buttons
    const highContrastBtn = document.getElementById('highContrastBtn');
    const dyslexicFontBtn = document.getElementById('dyslexicFontBtn');
    const lineHeightBtn = document.getElementById('lineHeightBtn');
    const letterSpacingBtn = document.getElementById('letterSpacingBtn');
    
    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sendMessageToContentScript({
                action: 'toggleFeature',
                feature: 'highContrast',
                enabled: this.classList.contains('active')
            });
        });
    }
    
    if (dyslexicFontBtn) {
        dyslexicFontBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sendMessageToContentScript({
                action: 'toggleFeature',
                feature: 'dyslexicFont',
                enabled: this.classList.contains('active')
            });
        });
    }
    
    if (lineHeightBtn) {
        lineHeightBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sendMessageToContentScript({
                action: 'toggleFeature',
                feature: 'lineHeight',
                enabled: this.classList.contains('active')
            });
        });
    }
    
    if (letterSpacingBtn) {
        letterSpacingBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sendMessageToContentScript({
                action: 'toggleFeature',
                feature: 'letterSpacing',
                enabled: this.classList.contains('active')
            });
        });
    }
    
    // Zapper Button functionality
    const zapperBtn = document.getElementById('zapperBtn');
    const zapperInfo = document.getElementById('zapperInfo');
    
    if (zapperBtn) {
        zapperBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            zapperInfo.classList.toggle('show');
            
            // Send message to content script to toggle zapper mode
            sendMessageToContentScript({
                action: 'toggleZapper',
                enabled: this.classList.contains('active')
            });
        });
    }
});

// Function to apply a profile
function applyProfile(profileName) {
    if (profileName === 'reset') {
        // Reset to default
        sendMessageToContentScript({
            action: 'resetAll'
        });
    } else {
        // Apply the selected profile
        const profile = profiles[profileName];
        if (profile) {
            sendMessageToContentScript({
                action: 'applyProfile',
                profile: profile
            });
        }
    }
}

// Function to send messages to content script
function sendMessageToContentScript(message) {
    // Get the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Send message to content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
            console.log('Message sent successfully!', response);
        });
    });
}
