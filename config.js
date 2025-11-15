/**
 * Configuration file for Adaptive Web Buddy
 * 
 * IMPORTANT: Add your Google Generative AI API key here
 * Steps to get your API key:
 * 1. Go to https://aistudio.google.com/
 * 2. Click "Get API Key" button
 * 3. Select "Create API Key in new Google Cloud project" or existing project
 * 4. Copy the API key
 * 5. Paste it below between the quotes
 * 6. Save the file
 */

const CONFIG = {
    // Add your Google Generative AI API key here
    // Get it from: https://aistudio.google.com/
    GEMINI_API_KEY: 'YOUR_API_KEY_HERE',
    
    // API endpoint (no need to change)
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    
    // Model configuration
    SUMMARIZATION_MODEL: 'gemini-2.0-flash-exp',
    MAX_SUMMARY_LENGTH: 500 // characters
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
