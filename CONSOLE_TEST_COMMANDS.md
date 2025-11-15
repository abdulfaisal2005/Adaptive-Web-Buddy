# ⚡ QUICK TEST COMMANDS

## For Console Testing (F12 → Console)

### Test 1: Check Content Script Load
```javascript
console.log('%c[TEST 1] Checking content script...', 'color: blue; font-weight: bold');
console.log('✓ If you saw message above, content script is working');
```

### Test 2: Verify API Key Storage
```javascript
chrome.storage.local.get('geminiApiKey', (result) => {
    if (result.geminiApiKey && result.geminiApiKey !== 'YOUR_API_KEY_HERE') {
        console.log('%c✓ API KEY FOUND', 'color: green; font-weight: bold');
        console.log('First 20 chars:', result.geminiApiKey.substring(0, 20) + '...');
    } else {
        console.error('%c✗ NO API KEY FOUND', 'color: red; font-weight: bold');
        console.log('Go to Settings (⚙️) and add your API key');
    }
});
```

### Test 3: Quick API Connection Test
```javascript
chrome.storage.local.get('geminiApiKey', (result) => {
    if (!result.geminiApiKey) {
        console.error('No API key found. Set it first.');
        return;
    }
    
    const key = result.geminiApiKey;
    console.log('%c[TEST 3] Testing API connection...', 'color: blue; font-weight: bold');
    
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "API works"' }] }]
        })
    })
    .then(r => {
        console.log('Response status:', r.status);
        return r.json();
    })
    .then(d => {
        if (d.candidates && d.candidates[0]) {
            console.log('%c✓ API IS WORKING!', 'color: green; font-weight: bold');
            console.log('Response:', d.candidates[0].content.parts[0].text);
        } else if (d.error) {
            console.error('%c✗ API ERROR', 'color: red; font-weight: bold');
            console.error(d.error.message);
        }
    })
    .catch(e => {
        console.error('%c✗ CONNECTION FAILED', 'color: red; font-weight: bold');
        console.error(e.message);
    });
});
```

### Test 4: Extract Current Page Text
```javascript
chrome.tabs.query({active: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'GET_PAGE_TEXT'}, (response) => {
        if (chrome.runtime.lastError) {
            console.error('%c✗ Cannot extract text:', 'color: red', chrome.runtime.lastError.message);
        } else if (response && response.text) {
            console.log('%c✓ TEXT EXTRACTED', 'color: green; font-weight: bold');
            console.log('Text length:', response.text.length, 'characters');
            console.log('First 100 chars:', response.text.substring(0, 100) + '...');
        } else {
            console.error('%c✗ No text response', 'color: red');
        }
    });
});
```

### Test 5: Check All Permissions
```javascript
console.log('%c[TEST 5] Extension Permissions:', 'color: blue; font-weight: bold');
chrome.permissions.getAll((perms) => {
    console.log('✓ Permissions:', perms);
});
```

### Test 6: Verify Extension Loaded
```javascript
console.log('%c[TEST 6] Extension Status:', 'color: blue; font-weight: bold');
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✓ Chrome Runtime API available');
    console.log('✓ Extension ID:', chrome.runtime.id);
} else {
    console.error('✗ Chrome Runtime not available');
}
```

---

## Step-by-Step Test Sequence

### Basic Test (2 minutes)
```
1. Open any Wikipedia article
2. Reload page (F5)
3. Open F12 (Developer Tools)
4. Go to Console tab
5. Run: Test 1 above
6. Should see success message
```

### Complete Test (5 minutes)
```
1. Run Test 1 (Content Script)
2. Run Test 2 (API Key Check)
3. Run Test 3 (API Connection)
4. Run Test 4 (Text Extraction)
5. Run Test 5 (Permissions)
6. Run Test 6 (Extension Status)
7. All should show ✓
```

### Full End-to-End Test (10 minutes)
```
1. Run Complete Test above
2. Click extension icon
3. Click "✨ AI Summarize Page"
4. Wait 2-5 seconds
5. Should see summary with bullets
6. No errors in console
7. Check Console shows [Adaptive Web Buddy] messages
```

---

## Expected Console Output

### If Everything Works ✓
```
[Adaptive Web Buddy] Content script loaded
[Adaptive Web Buddy] Message received: GET_PAGE_TEXT
[Adaptive Web Buddy] Extracted text length: 4523
[Adaptive Web Buddy] API call attempt 1/3
[Adaptive Web Buddy] Sending 2847 chars to API
[Adaptive Web Buddy] API response status: 200
[Adaptive Web Buddy] Summary generated successfully (247 chars)
```

### If API Key Missing ✗
```
✗ NO API KEY FOUND
Go to Settings (⚙️) and add your API key
```

### If Connection Failed ✗
```
✗ Cannot extract text: Could not establish connection
Try reloading the page
```

### If API Error ✗
```
✗ API ERROR
Invalid API Key provided
```

---

## Debugging Flow Chart

```
Something not working?

1. Check Console (F12 → Console)
   ↓
   See [Adaptive Web Buddy] messages? YES → Go to 2
   See red errors? → Note the error message
   Nothing? → Run Test 1
   
2. Run Test 1 (Content Script Load)
   ↓
   Success? YES → Go to 3
   Fails? → Try reloading page (F5)
   
3. Run Test 2 (API Key Check)
   ↓
   API Key found? YES → Go to 4
   Not found? → Click Settings (⚙️), add key
   
4. Run Test 3 (API Connection)
   ↓
   Connection works? YES → Go to 5
   Fails? → Check internet, check key validity
   
5. Try Summarize Button
   ↓
   Works? YES → ✅ ALL GOOD!
   Fails? → Check error message and match to issues below
```

---

## Common Error Messages & Quick Fixes

| Error | Fix |
|-------|-----|
| "Could not establish connection" | Reload page (F5), then reload extension |
| "API Key not configured" | Click ⚙️ Settings, add API key |
| "Extracting text..." (stuck) | Press ESC, reload page, try again |
| "API request failed" | Check API key validity, check internet |
| "No text found" | Try different page (must have text) |
| "Request timeout" | Check internet speed, try again |

---

## Visual Test Results

After running all tests, you should see:

```
✓ Content script loaded
✓ API KEY FOUND
✓ API IS WORKING!
✓ TEXT EXTRACTED (2000+ characters)
✓ Permissions: [array of permissions]
✓ Extension ID: [12-character ID]
```

All checks ✓ = Extension is working perfectly!

---

## Pro Tips

### Enable Maximum Logging
```javascript
// Set debug flag (in console)
window.DEBUG_ADAPTIVE = true;
// Then reload page - will log everything
```

### Clear All Extension Data
```javascript
// Clear all stored settings
chrome.storage.local.clear(() => {
    console.log('All data cleared');
});
// This removes API key too - you'll need to re-add it
```

### Test Summarize Without UI
```javascript
// Simulate the whole process
chrome.tabs.query({active: true}, (tabs) => {
    // Extract text
    chrome.tabs.sendMessage(tabs[0].id, {action: 'GET_PAGE_TEXT'}, (resp) => {
        // Get API key
        chrome.storage.local.get('geminiApiKey', (key_result) => {
            // Make API call
            fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key_result.geminiApiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Summarize in 3-5 bullets:\n\n${resp.text.substring(0, 1500)}`
                        }]
                    }]
                })
            })
            .then(r => r.json())
            .then(d => {
                console.log('%c✓ SUMMARY', 'color: green; font-weight: bold');
                console.log(d.candidates[0].content.parts[0].text);
            })
            .catch(e => console.error('Error:', e));
        });
    });
});
```

---

## Testing on Different Pages

| Page Type | Status | Why | Best For Testing |
|-----------|--------|-----|---|
| Wikipedia | ✅ Best | Long text, no videos | Content extraction |
| Medium.com | ✅ Great | Published articles | Real content |
| Dev.to | ✅ Great | Tech content | Technical summaries |
| BBC News | ✅ Great | News articles | News summaries |
| GitHub Readme | ⚠️ OK | Code + text | Mixed content |
| YouTube | ❌ No | Needs JavaScript | Not testable |
| Twitter | ❌ No | Infinite scroll | Not testable |
| PDFs | ❌ No | Blocked | Can't access |
| Blank page | ❌ No | No content | Returns "no text" |

---

**Created**: November 15, 2025  
**For**: Quick Testing & Debugging  
**Status**: ✅ Ready to Use
