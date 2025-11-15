# ✅ COMPLETE TEST & TROUBLESHOOTING GUIDE

## 🚀 QUICK START (After Fixes)

### Step 1: Reload Extension
```
1. Go to chrome://extensions
2. Find "Adaptive Web Buddy"
3. Click the RELOAD button (circular arrow)
4. Wait 2 seconds for extension to reload
```

### Step 2: Reload Web Page
```
1. Go to any news article or Wikipedia page
2. Press F5 or Ctrl+R to reload
3. Wait for page to fully load
```

### Step 3: Try Summarize
```
1. Click the extension icon (puzzle piece)
2. Click "✨ AI Summarize Page"
3. Should complete in 2-5 seconds
4. See 3-5 bullet point summary
```

---

## 🧪 COMPREHENSIVE TEST CHECKLIST

### Test 1: Extension Load
- [ ] Open Chrome Developer Tools (F12)
- [ ] Click "Console" tab
- [ ] Reload any webpage
- [ ] Should see message: `[Adaptive Web Buddy] Content script loaded`
- [ ] No red errors in console

### Test 2: Button Clicks
- [ ] Click "Modes" dropdown → should show 5 options
- [ ] Click "Text to Speech" → should toggle on/off
- [ ] Click "High Contrast" → page should turn black/yellow
- [ ] Click "Font Size" slider → text should resize
- [ ] Click "Zapper" → click element to remove it

### Test 3: Settings Modal
- [ ] Click ⚙️ Settings button → modal should pop up
- [ ] Paste your API key
- [ ] Click "Save API Key"
- [ ] Should see: `✅ API Key saved successfully!`
- [ ] Modal closes after 2 seconds

### Test 4: Summarization (Basic)
- [ ] Go to Wikipedia article (e.g., Climate Change)
- [ ] Click extension icon
- [ ] Click "✨ AI Summarize Page"
- [ ] Should show: `⏳ Extracting text from page...`
- [ ] Then: `🔄 Sending to AI for summarization...`
- [ ] Finally: `✅ Summary generated successfully!`
- [ ] Should see 3-5 bullet points

### Test 5: Summarization (Different Pages)
Test on these pages:
- [ ] Wikipedia article (Long form content)
- [ ] Medium article (Published content)
- [ ] Dev.to blog post (Tech content)
- [ ] BBC News article (News content)
- [ ] Documentation site (Technical docs)

### Test 6: Error Handling
- [ ] Try summarizing with NO API key
  - Should see: `❌ API Key not configured. Please click Settings.`
  
- [ ] Try summarizing with WRONG API key
  - Should see timeout or invalid key error
  - Should mention checking the API key
  
- [ ] Try summarizing on blank page
  - Should see: `❌ No text found on this page. Try a different page.`
  
- [ ] Try on page with only images
  - Should still try to extract any text present

### Test 7: Console Logging
- [ ] Open F12 Console
- [ ] Try each feature
- [ ] Each action should log: `[Adaptive Web Buddy] ...`
- [ ] Look for any red errors
- [ ] Red errors = problems to fix

### Test 8: Performance
- [ ] Time how long summarization takes:
  - Text extraction: Should be instant
  - API call: Should be 2-5 seconds
  - Total: Should never exceed 10 seconds
  
- [ ] If over 10 seconds:
  - Check internet connection
  - Check if API key is valid
  - Try again (system might be slow)

---

## 🔴 COMMON ISSUES & SOLUTIONS

### Issue 1: "Could not establish connection"
**Cause**: Content script not loading  
**Solution**:
```
1. Reload extension (chrome://extensions → Reload)
2. Reload webpage (F5)
3. Check Console (F12) for script loaded message
4. Try on different page
```

### Issue 2: "API Key not configured"
**Cause**: No API key saved  
**Solution**:
```
1. Click ⚙️ Settings button
2. Get API key from https://aistudio.google.com/
3. Paste entire key (starts with "AIza")
4. Click "Save API Key"
5. Confirm: ✅ API Key saved successfully!
6. Try again
```

### Issue 3: "Extracting text..." but never finishes
**Cause**: Content script timeout or page issue  
**Solution**:
```
1. Press ESC to cancel
2. Reload webpage (F5)
3. Reload extension
4. Try on different page
5. Check internet connection
```

### Issue 4: API error messages
**Cause**: Usually API key or rate limiting  
**Solution**:
```
1. Check your API key at https://aistudio.google.com/
2. Verify it's the correct one (starts with "AIza")
3. Check you're within free tier limits (60 req/min)
4. Wait a minute if you got many errors
5. Try again
```

### Issue 5: Summary doesn't show
**Cause**: Page structure or API issue  
**Solution**:
```
1. Check Console (F12) for errors
2. Try a different page with more text
3. Make sure it's not a PDF or special page
4. Check internet connection
5. Try another time
```

### Issue 6: Buttons don't work
**Cause**: Extension not loaded properly  
**Solution**:
```
1. Go to chrome://extensions
2. Turn extension OFF, wait 2 sec
3. Turn extension ON, wait 2 sec
4. Reload the webpage
5. Try again
```

---

## 🐛 DETAILED DEBUG STEPS

### If Still Having Issues - Full Debug Protocol

#### Step 1: Check Content Script Load
```javascript
// In Console (F12), run:
console.log('Checking content script...');
chrome.tabs.query({active: true}, (tabs) => {
    console.log('Current tab:', tabs[0].url);
});
```

#### Step 2: Check API Key Storage
```javascript
// In Console, run:
chrome.storage.local.get('geminiApiKey', (result) => {
    if (result.geminiApiKey) {
        console.log('API Key found (first 20 chars):', result.geminiApiKey.substring(0, 20) + '...');
    } else {
        console.log('NO API Key saved!');
    }
});
```

#### Step 3: Manually Test API Connection
```javascript
// In Console, run this to test API (replace with your key):
const testKey = 'YOUR_API_KEY_HERE';
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + testKey, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        contents: [{
            parts: [{ text: 'Hello, are you working?' }]
        }]
    })
}).then(r => r.json()).then(d => console.log('API Response:', d));
```

#### Step 4: Check Extension Permissions
```javascript
// In Console, run:
console.log('Checking permissions...');
chrome.permissions.getAll((perms) => {
    console.log('Extension permissions:', perms);
});
```

---

## ✅ SUCCESS INDICATORS

You know everything is working when:

- ✅ `[Adaptive Web Buddy] Content script loaded` appears in console
- ✅ All buttons respond to clicks (colors change)
- ✅ Settings modal opens and closes smoothly
- ✅ API key saves with success message
- ✅ Summarization shows progress (Extracting... → Sending... → Done!)
- ✅ Summary appears in 2-5 seconds
- ✅ Summary is 3-5 bullet points
- ✅ No red errors in console
- ✅ Works on multiple different pages

---

## 📊 EXPECTED PERFORMANCE

| Action | Expected Time | If Slower = Issue |
|--------|---|---|
| Button click | Instant | Extension not loading |
| Settings open | Instant | CSS issue |
| Text extraction | <1 second | Page too complex |
| API call | 2-5 seconds | Network or API key |
| Total summarization | 3-7 seconds | Normal variation |
| Complete failure | Should fail with message | Debug using console |

---

## 🆘 IF NOTHING WORKS - Nuclear Reset

1. **Go to chrome://extensions**
2. **Find "Adaptive Web Buddy"**
3. **Click the REMOVE button** (trash icon)
4. **Close Chrome completely**
5. **Wait 10 seconds**
6. **Reopen Chrome**
7. **Reload the extension** (drag extension folder)
8. **Reload webpage**
9. **Test again**

---

## 📞 FINAL DEBUGGING CHECKLIST

Before giving up, verify:

- [ ] You're using **Chrome** (not Edge, Firefox, Safari)
- [ ] API key is from https://aistudio.google.com/ (not Google Cloud)
- [ ] API key starts with "AIza" (not other format)
- [ ] You have stable internet connection
- [ ] You're not on a restricted network (work, school)
- [ ] Extension is in **enabled** state
- [ ] You waited for page to fully load before clicking summarize
- [ ] You're testing on a page with actual text (not PDF, not blank, not image-only)
- [ ] Console shows no red errors (F12 → Console)
- [ ] You reloaded the extension after any code changes

---

## 🎉 ONCE IT WORKS

**Congratulations!** Your Adaptive Web Buddy extension is now working perfectly!

Features you can use:
- ✅ Summarize any webpage instantly
- ✅ 4 accessibility modes (Dyslexia, Focus, Reading, Autism)
- ✅ Text-to-Speech for content
- ✅ High contrast mode
- ✅ Dyslexic font (Comic Sans)
- ✅ Line height adjustment
- ✅ Letter spacing
- ✅ Zapper to remove unwanted elements
- ✅ Customizable font sizes

---

**Last Updated**: November 15, 2025  
**Test Version**: 2.0  
**Status**: ✅ All Fixes Applied
