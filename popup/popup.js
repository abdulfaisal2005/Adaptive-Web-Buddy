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
    
    // AI Summarization functionality
    const summarizeBtn = document.getElementById('summarizeBtn');
    if (summarizeBtn) {
        summarizeBtn.addEventListener('click', summarizePageContent);
    }
    
    // Settings functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            settingsModal.classList.add('show');
            loadApiKey();
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            settingsModal.classList.remove('show');
        });
    }
    
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveApiKey);
    }
    
    // Close modal when clicking outside
    if (settingsModal) {
        window.addEventListener('click', function(event) {
            if (event.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
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
        if (!tabs || tabs.length === 0) {
            console.error('[Adaptive Web Buddy] No active tab found');
            return;
        }
        
        // Send message to content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
            if (chrome.runtime.lastError) {
                console.error('[Adaptive Web Buddy] Message error:', chrome.runtime.lastError);
                return;
            }
            console.log('[Adaptive Web Buddy] Message sent successfully!', response);
        });
    });
}

// AI Summarization Functions
async function summarizePageContent() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const statusDiv = document.getElementById('summaryStatus');
    const outputDiv = document.getElementById('summaryOutput');
    
    // Check if API key is configured
    const apiKey = await chrome.storage.local.get('geminiApiKey');
    if (!apiKey.geminiApiKey || apiKey.geminiApiKey === 'YOUR_API_KEY_HERE') {
        statusDiv.textContent = '❌ API Key not configured. Please click Settings.';
        statusDiv.className = 'summary-status show error';
        return;
    }
    
    summarizeBtn.disabled = true;
    summarizeBtn.classList.add('loading');
    statusDiv.textContent = '⏳ Extracting text from page...';
    statusDiv.className = 'summary-status show loading';
    outputDiv.classList.remove('show');
    outputDiv.textContent = '';
    
    try {
        // Step 1: Get page text from content script (with timeout)
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        const extractPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Text extraction timeout - content script may not be loaded'));
            }, 8000);
            
            try {
                chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_TEXT' }, (response) => {
                    clearTimeout(timeoutId);
                    
                    if (!response) {
                        reject(new Error('No response from content script - page may not support this'));
                        return;
                    }
                    
                    if (chrome.runtime.lastError) {
                        console.error('Chrome error:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            } catch (err) {
                clearTimeout(timeoutId);
                reject(err);
            }
        });
        
        const response = await extractPromise;
        const pageText = response?.text || '';
        
        console.log('Extracted text length:', pageText.length);
        
        if (!pageText || pageText.trim().length < 30) {
            statusDiv.textContent = '❌ No text found on this page. Try a different page.';
            statusDiv.className = 'summary-status show error';
            summarizeBtn.disabled = false;
            summarizeBtn.classList.remove('loading');
            return;
        }
        
        statusDiv.textContent = '🔄 Sending to AI for summarization... (may take 10-30 seconds)';
        
        // Step 2: Send to Gemini API
        const summary = await callGeminiAPI(pageText, apiKey.geminiApiKey);
        
        if (summary && summary.trim().length > 0) {
            statusDiv.textContent = '✅ Summary generated successfully!';
            statusDiv.className = 'summary-status show success';
            outputDiv.textContent = summary;
            outputDiv.classList.add('show');
        } else {
            statusDiv.textContent = '❌ Failed to generate summary. Try again.';
            statusDiv.className = 'summary-status show error';
        }
        
    } catch (error) {
        console.error('Summarization error:', error);
        
        let errorMsg = error.message || 'Unknown error occurred';
        
        // Better error messages
        if (errorMsg.includes('Could not establish connection') || errorMsg.includes('does not exist')) {
            errorMsg = 'Extension not loaded on this page. Try reloading the page.';
        } else if (errorMsg.includes('timeout')) {
            errorMsg = 'Request took too long. Check your internet connection.';
        } else if (errorMsg.includes('No response')) {
            errorMsg = 'Content script not responding. Reload the page and try again.';
        }
        
        statusDiv.textContent = `❌ ${errorMsg}`;
        statusDiv.className = 'summary-status show error';
    } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.classList.remove('loading');
    }
}

// Call Gemini API for summarization with multiple model fallbacks
async function callGeminiAPI(text, apiKey) {
    const TIMEOUT = 60000; // 60 second timeout - more time for processing
    const MAX_RETRIES = 1; // Reduce retries since we're waiting longer
    
    // Try models in order of availability
    const modelsToTry = [
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b'
    ];
    
    let lastError;
    
    // Try each model
    for (const model of modelsToTry) {
        console.log(`[Adaptive Web Buddy] Trying model: ${model}`);
        
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[Adaptive Web Buddy] API call with ${model} - attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
                
                // Truncate text to avoid token limits
                const words = text.split(/\s+/);
                const truncatedText = words.slice(0, 2000).join(' ');
                
                console.log(`[Adaptive Web Buddy] Sending ${truncatedText.length} chars to ${model}`);
                
                // Create abort controller for timeout
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
                                    text: `Summarize this webpage content in 3-5 bullet points. Be concise and clear:\n\n${truncatedText}`
                                }]
                            }],
                            generationConfig: {
                                maxOutputTokens: 500,
                                temperature: 0.7
                            }
                        }),
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
                
                console.log(`[Adaptive Web Buddy] ${model} response status: ${response.status}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                    
                    // If 404 or "not found", try next model
                    if (response.status === 404 || errorMsg.includes('not found')) {
                        console.warn(`[Adaptive Web Buddy] ${model} not found, trying next model...`);
                        lastError = new Error(`${model} not available`);
                        break; // Break inner loop, try next model
                    }
                    
                    throw new Error(errorMsg);
                }
                
                const data = await response.json();
                const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!summary) {
                    throw new Error('No summary received from API');
                }
                
                console.log(`[Adaptive Web Buddy] ✓ Summary generated with ${model}`);
                return summary;
                
            } catch (error) {
                lastError = error;
                console.error(`[Adaptive Web Buddy] ${model} attempt ${attempt + 1} error:`, error.message);
                
                // Don't retry on abort (timeout)
                if (error.name === 'AbortError') {
                    break;
                }
                
                // Wait before retry
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    }
    
    // If we get here, all models failed
    if (lastError?.name === 'AbortError') {
        throw new Error('Request timeout after 60 seconds. Try again with shorter content.');
    }
    
    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

// API Key Management Functions
function loadApiKey() {
    chrome.storage.local.get('geminiApiKey', function(result) {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        apiKeyStatus.textContent = '❌ Please enter an API key.';
        apiKeyStatus.className = 'error show';
        return;
    }
    
    if (apiKey.length < 20) {
        apiKeyStatus.textContent = '❌ API key seems too short. Please check and try again.';
        apiKeyStatus.className = 'error show';
        return;
    }
    
    // Save to storage
    chrome.storage.local.set({geminiApiKey: apiKey}, function() {
        apiKeyStatus.textContent = '✅ API Key saved successfully!';
        apiKeyStatus.className = 'success show';
        
        setTimeout(() => {
            document.getElementById('settingsModal').classList.remove('show');
            apiKeyStatus.classList.remove('show');
        }, 2000);
    });
}
