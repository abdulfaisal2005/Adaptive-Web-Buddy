# API Key Setup Guide - Adaptive Web Buddy

## Step-by-Step Instructions to Add Your Gemini API Key

### Step 1: Get Your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click on **"Create API key"** button
3. Choose **"Create API key in new project"**
4. Copy your API key (it will look like: `AIzaSyD...`)

### Step 2: Store the API Key in Extension Storage

**Option A: Using Browser Console (Easiest)**
1. Go to any website with Adaptive Web Buddy loaded
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Paste this command and press Enter:
```javascript
chrome.storage.local.set({geminiApiKey: 'YOUR_API_KEY_HERE'})
```
Replace `YOUR_API_KEY_HERE` with your actual API key

**Example:**
```javascript
chrome.storage.local.set({geminiApiKey: 'AIzaSyD1234567890abcdefghijklmnopqr'})
```

5. If successful, you'll see: `undefined` (this is normal)
6. Verify it was saved by running:
```javascript
chrome.storage.local.get('geminiApiKey', console.log)
```

**Option B: Using Extension Popup**
1. Click the Adaptive Web Buddy extension icon
2. A popup should appear with Settings
3. Enter your API key in the Settings modal
4. Click "Save"

---

## Where the API Key is Used

The AI Summarization feature uses your API key to:
- Generate summaries of web pages
- Process up to 2000 words of text
- Return summaries in 3-5 bullet points

---

## Security Notes

⚠️ **Important:**
- Your API key is stored **locally** in your browser
- It is **NOT** sent to any server except Google's API
- It is **NOT** synced to cloud
- Clearing browser data will delete it

---

## Verification Steps

### Check if API Key is Saved:
```javascript
chrome.storage.local.get('geminiApiKey', (result) => {
    if (result.geminiApiKey) {
        console.log('✓ API Key is saved (first 20 chars): ' + result.geminiApiKey.substring(0, 20) + '...');
    } else {
        console.log('✗ API Key is NOT saved');
    }
})
```

### Test the Summarization Feature:
1. Open any webpage with text content
2. Click the **✨ Summarize** button in the Adaptive Web Buddy header
3. If API key is stored, it will start extracting text
4. Wait for 10-30 seconds for AI response

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API Key not configured" error | Run the `chrome.storage.local.set()` command above |
| "All models failed" error | Check API key is correct, verify Google API is accessible |
| Summarize button does nothing | Check if API key is stored using verification command |
| Very slow response | Normal - first request may take 10-30 seconds |

---

## API Key Limit

Google provides:
- **60 requests per minute** (free tier)
- **2 million free tokens per month**

This is more than enough for personal use!

---

## Delete API Key (if needed)

Run this command to delete your API key:
```javascript
chrome.storage.local.remove('geminiApiKey')
```

---

**That's it! Your Adaptive Web Buddy is now ready to summarize web pages! 🎉**
