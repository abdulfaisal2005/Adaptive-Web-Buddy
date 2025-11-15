## 📋 AI SUMMARIZATION FEATURE - SETUP GUIDE

### 🎯 Overview
The Adaptive Web Buddy extension now includes an AI-powered page summarization feature using Google's Gemini API. This feature allows users to get instant summaries of any webpage with one click.

---

### 📍 STEP-BY-STEP: HOW TO ADD YOUR API KEY

#### **Step 1: Get Your API Key**
1. Go to: https://aistudio.google.com/
2. Click the **"Get API Key"** button (top left corner)
3. Select **"Create API Key in new Google Cloud project"**
4. A new tab will open with your API key displayed
5. **Copy the entire API key** (it looks like a long string of characters)

#### **Step 2: Add API Key to Extension**
1. Click the **⚙️ Settings** button in the extension popup
2. A settings modal will appear
3. Paste your API key into the **"Gemini API Key"** input field
4. Click the **"Save API Key"** button
5. You'll see a confirmation: **"✅ API Key saved successfully!"**

#### **Step 3: Verify Installation**
1. Navigate to any webpage
2. Click the extension icon
3. Click the **"✨ AI Summarize Page"** button
4. The extension will:
   - Extract text from the page
   - Send it to Google's Gemini API
   - Generate a summary in 3-5 bullet points
   - Display it in the extension popup

---

### 📂 FILE LOCATIONS

#### **Configuration File**
- **File**: `config.js` (in root directory)
- **Purpose**: Stores API configuration
- **Note**: The API key is saved to Chrome's local storage when you enter it in Settings

#### **Popup Interface**
- **File**: `popup/popup.html`
- **Contains**: 
  - " AI Summarize Page" button
  - " Settings" button
  - Summary output display area

#### **Popup Styling**
- **File**: `popup/popup.css`
- **Contains**: Styles for summarize button, settings modal, and output display

#### **Popup Logic**
- **File**: `popup/popup.js`
- **Functions**:
  - `summarizePageContent()` - Initiates summarization
  - `callGeminiAPI()` - Calls Google Gemini API
  - `loadApiKey()` - Loads saved API key
  - `saveApiKey()` - Saves API key to storage

#### **Content Script**
- **File**: `content/contentScript.js`
- **Function**: `extractPageText()` - Extracts page content for summarization

#### **Manifest**
- **File**: `manifest.json`
- **Updated**: Added scripting permission and config.js to content scripts

---

###  API KEY INFORMATION

**API Provider**: Google Generative AI (Gemini API)

**Free Tier**:
- ✅ Up to 60 requests per minute
- ✅ Free for development
- ✅ No credit card required

**Getting Started**:
1. Visit: https://aistudio.google.com/
2. Click "Get API Key"
3. Select your project (or create new one)
4. Copy the key
5. Paste into Settings modal

**API Used**: `gemini-1.5-flash` (fast, efficient model)

---

### 💾 WHERE API KEY IS STORED

The API key is **NOT stored in files**. Instead, it's saved in:
- **Chrome's Local Storage** (extension-specific, secure)
- **Access Method**: `chrome.storage.local.get('geminiApiKey')`
- **Security**: Only accessible to your extension, not visible in code

---

### 🎬 HOW TO USE THE SUMMARIZE FEATURE

1. **Open any webpage** you want to summarize
2. **Click the extension icon** (Adaptive Web Buddy)
3. **Click "✨ AI Summarize Page"** button
4. **Wait for processing** (usually 2-5 seconds):
   - ⏳ "Extracting text from page..."
   - 🔄 "Sending to AI for summarization..."
   - ✅ "Summary generated successfully!"
5. **View the summary** in the output box (3-5 bullet points)

---

### ⚠️ TROUBLESHOOTING

**Issue**: "API Key not configured"
- **Solution**: Click Settings → Enter your API key → Save

**Issue**: "No text found on this page"
- **Solution**: The webpage might be using frames or dynamic content. Try on a different page.

**Issue**: "API request failed"
- **Solution**: 
  - Check your API key is correct
  - Ensure you have an active internet connection
  - Check your API quota at https://aistudio.google.com/

**Issue**: "Error: API key seems too short"
- **Solution**: Your API key was truncated. Get a fresh one from https://aistudio.google.com/

---

### 🔐 SECURITY NOTES

✅ **Safe**: API key is stored locally in Chrome storage
✅ **Secure**: Never sent to third-party servers except Google's official API
✅ **Private**: Each user's API key is separate
⚠️ **Note**: Don't share your API key with anyone

---

### 📊 FEATURE SPECS

| Aspect | Details |
|--------|---------|
| **AI Model** | Google Gemini 1.5 Flash |
| **Summary Format** | 3-5 bullet points |
| **Text Limit** | ~2000 words (prevents token overuse) |
| **Processing Time** | 2-5 seconds per page |
| **Cost** | Free (up to 60 requests/minute) |
| **Storage** | Chrome Local Storage (secure) |

---

### 🎯 INTEGRATION WITH OTHER FEATURES

The AI Summarization feature works perfectly with:
- ✅ **Dyslexia Mode** - Can read summary in dyslexic-friendly font
- ✅ **Focus Mode** - Works with reduced visual distractions
- ✅ **Text to Speech** - Can hear the summary read aloud
- ✅ **High Contrast** - Summary displays in high contrast if enabled
- ✅ **Font Size Slider** - Adjust summary text size

---

### 🚀 ADVANCED CUSTOMIZATION

**To modify the summary prompt**, edit in `popup/popup.js`:
```javascript
text: `Please provide a concise summary of the following webpage content in 3-5 bullet points:\n\n${truncatedText}`
```

**To change the character limit**, edit in `popup/popup.js`:
```javascript
const truncatedText = words.slice(0, 2000).join(' '); // Change 2000 to desired word count
```

**To change the API model**, edit in `popup/popup.js`:
```javascript
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
// Change gemini-1.5-flash to gemini-pro or other models
```

---

### 📞 SUPPORT

For issues with Google Gemini API:
- Visit: https://aistudio.google.com/
- Check API limits and status
- Read documentation: https://ai.google.dev/

For extension issues:
- Check console logs (F12 → Console tab)
- Verify all files are in correct locations
- Ensure manifest.json permissions are updated

---

**Created**: November 15, 2025  
**Extension**: Adaptive Web Buddy v1.0  
**Feature**: AI Summarization with Gemini API
