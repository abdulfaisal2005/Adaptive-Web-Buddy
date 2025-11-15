// popup.js - Handles button clicks and communicates with content script

// When the popup loads
document.addEventListener('DOMContentLoaded', function() {
    
    // Get all profile buttons
    const profileButtons = document.querySelectorAll('.profile-btn');
    
    // Add click listeners to each button
    profileButtons.forEach(button => {
        button.addEventListener('click', function() {
            const profileName = this.getAttribute('data-profile');
            applyProfile(profileName);
        });
    });
    
    // Font size slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    fontSizeSlider.addEventListener('input', function() {
        document.getElementById('fontSizeValue').textContent = this.value;
        // Apply font size change immediately
        sendMessageToContentScript({
            action: 'updateSetting',
            setting: 'fontSize',
            value: this.value + 'px'
        });
    });
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
            console.log('Profile applied successfully!', response);
});
});
}
