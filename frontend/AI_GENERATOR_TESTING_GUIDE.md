# AI Generator Frontend - Testing Guide

## 🎯 Testing Checklist

### Prerequisites

- [ ] Backend server running on port 4000
- [ ] User logged in with valid JWT token
- [ ] OpenAI API key configured in backend
- [ ] Anthropic API key configured (optional - for Claude models)

---

## 1️⃣ Text Generation Tab Tests

### Test 1.1: Basic Text Generation

**Steps:**

1. Navigate to `/ai-generator`
2. Select "Text Generation" tab
3. Choose model: `gpt-4`
4. Enter prompt: "Explain blockchain technology in 3 sentences"
5. Click "Generate Text"

**Expected Results:**

- ✅ Loading spinner appears
- ✅ Progress message: "Generation in progress..."
- ✅ Socket.IO event `ai-generation:started` received
- ✅ Result appears with generated text
- ✅ Socket.IO event `ai-generation:completed` received
- ✅ Character count updates as you type
- ✅ Copy button works
- ✅ "New Generation" button clears form

**API Call:**

```
POST /api/ai-generator/text
{
  "prompt": "Explain blockchain technology in 3 sentences",
  "model": "gpt-4",
  "captchaToken": "bypass"
}
```

### Test 1.2: Model Switching

**Steps:**

1. Try each model:
   - GPT-4 (Most Capable)
   - GPT-3.5 Turbo (Fast & Affordable)
   - Claude 3 Sonnet (Balanced)
   - Claude 3 Opus (Most Powerful)
2. Generate text with each

**Expected Results:**

- ✅ Model selection changes
- ✅ Cost shown in dropdown
- ✅ API receives correct model parameter
- ✅ Different models produce different outputs

### Test 1.3: Error Handling

**Steps:**

1. Stop backend server
2. Try to generate text

**Expected Results:**

- ✅ Error message appears
- ✅ User-friendly error description
- ✅ No application crash

---

## 2️⃣ Code Generation Tab Tests

### Test 2.1: Basic Code Generation

**Steps:**

1. Select "Code Generation" tab
2. Choose model: `gpt-4`
3. Select language: `TypeScript`
4. Select framework: `React`
5. Enter prompt: "Create a todo list component with add/delete functionality"
6. Click "Generate Code"

**Expected Results:**

- ✅ Code appears in syntax-highlighted box
- ✅ Code includes TypeScript syntax
- ✅ Code includes React patterns
- ✅ Code is properly formatted
- ✅ Copy button copies code to clipboard
- ✅ Language and framework shown in header

**API Call:**

```
POST /api/ai-generator/code
{
  "prompt": "Create a todo list component with add/delete functionality",
  "model": "gpt-4",
  "language": "TypeScript",
  "framework": "React",
  "captchaToken": "bypass"
}
```

### Test 2.2: Language/Framework Combinations

**Test Cases:**
| Language | Framework | Prompt Example |
|------------|----------------|----------------------------------------|
| Python | Django | "Create a REST API endpoint for users" |
| Java | Spring Boot | "Build a service class for orders" |
| Go | Gin | "Create HTTP handler for auth" |
| JavaScript | Express | "Build middleware for logging" |

**Expected Results:**

- ✅ Framework dropdown updates when language changes
- ✅ Code uses correct language syntax
- ✅ Code uses framework-specific patterns

### Test 2.3: No Framework Selected

**Steps:**

1. Select language: `Python`
2. Leave framework: `None`
3. Generate code

**Expected Results:**

- ✅ Code generates without framework-specific patterns
- ✅ Pure Python code returned

---

## 3️⃣ Image Generation Tab Tests

### Test 3.1: Basic Image Generation

**Steps:**

1. Select "Image Generation" tab
2. Choose size: `Square (1024×1024)`
3. Enter prompt: "A futuristic AI robot analyzing data on holographic screens"
4. Click "Generate Image ($0.04)"

**Expected Results:**

- ✅ Loading state shows "Creating Image..."
- ✅ Progress message appears
- ✅ Image loads and displays
- ✅ Download button works
- ✅ Image saves as PNG
- ✅ Original prompt shown below image
- ✅ Warning about temporary URLs displayed

**API Call:**

```
POST /api/ai-generator/image
{
  "prompt": "A futuristic AI robot analyzing data on holographic screens",
  "size": "1024x1024",
  "captchaToken": "bypass"
}
```

### Test 3.2: Different Image Sizes

**Test Each:**

- [ ] Square (1024×1024)
- [ ] Landscape (1792×1024)
- [ ] Portrait (1024×1792)

**Expected Results:**

- ✅ Each size generates correctly
- ✅ Image dimensions match selected size
- ✅ Size shown in metadata

### Test 3.3: Creative Prompts

**Test Various Styles:**

```
1. "A serene mountain landscape at golden hour, photorealistic"
2. "Abstract digital art with flowing colors and geometric shapes"
3. "A cute cartoon robot in a minimalist style"
4. "A professional product photo of a smartphone on white background"
```

**Expected Results:**

- ✅ Each style produces appropriate imagery
- ✅ Prompts are descriptive enough for good results

---

## 4️⃣ Generation History Tab Tests

### Test 4.1: View All Generations

**Steps:**

1. Generate multiple items (text, code, images)
2. Click "History" tab

**Expected Results:**

- ✅ All generations listed
- ✅ Most recent first
- ✅ Type icons shown (text, code, image)
- ✅ Status badges (Completed, Pending, Failed)
- ✅ Timestamps correct
- ✅ Click to expand/collapse details

### Test 4.2: Filter by Type

**Steps:**

1. Click "All", "Text", "Code", "Images" filters
2. Verify filtering works

**Expected Results:**

- ✅ Only selected type shown
- ✅ Count updates
- ✅ "All" shows everything
- ✅ Empty state if no items

### Test 4.3: Pagination

**Steps:**

1. Generate 25+ items
2. Check pagination controls

**Expected Results:**

- ✅ 20 items per page
- ✅ "Next" button works
- ✅ "Previous" button works
- ✅ Page counter accurate
- ✅ Total count shown

### Test 4.4: Expanded View

**Steps:**

1. Click on a generation to expand

**Expected Results:**

- ✅ **Text:** Full output shown
- ✅ **Code:** Syntax-highlighted code
- ✅ **Image:** Full-size image displayed
- ✅ **Failed:** Error message shown

---

## 5️⃣ Socket.IO Real-Time Tests

### Test 5.1: Connection Status

**Steps:**

1. Open browser DevTools > Console
2. Navigate to AI Generator
3. Watch for socket messages

**Expected Console Logs:**

```
✅ Socket connected for AI Generator
🚀 Generation started: { generationId: "...", type: "text" }
✅ Generation completed: { id: "...", output: "..." }
```

### Test 5.2: Real-Time Progress

**Steps:**

1. Generate text/code/image
2. Watch progress updates

**Expected Results:**

- ✅ "started" status immediately
- ✅ "completed" status with result
- ✅ OR "failed" status with error
- ✅ UI updates automatically (no refresh needed)

### Test 5.3: Multiple Tabs

**Steps:**

1. Open AI Generator in two browser tabs
2. Generate in tab 1
3. Watch tab 2

**Expected Results:**

- ✅ Tab 2 receives Socket.IO events
- ✅ History auto-updates in tab 2
- ✅ No conflicts or errors

---

## 6️⃣ Rate Limiting Tests

### Test 6.1: Free Tier Limits

**Steps (as non-admin user):**

1. Generate 10 items rapidly
2. Try an 11th generation

**Expected Results:**

- ✅ First 10 succeed
- ✅ 11th returns 429 error
- ✅ Error message: "Rate limit exceeded (10/hour)"
- ✅ User-friendly error displayed

### Test 6.2: Admin Unlimited

**Steps (as admin):**

1. Generate 15+ items

**Expected Results:**

- ✅ All succeed
- ✅ No rate limit errors

---

## 7️⃣ Error Handling Tests

### Test 7.1: Network Errors

**Steps:**

1. Disconnect internet
2. Try to generate

**Expected Results:**

- ✅ Error message: "Network error"
- ✅ Retry button appears
- ✅ No crash

### Test 7.2: Invalid Token

**Steps:**

1. Clear localStorage token
2. Try to generate

**Expected Results:**

- ✅ 401 Unauthorized
- ✅ Redirect to login (if auth guard active)

### Test 7.3: Empty Prompt

**Steps:**

1. Leave prompt blank
2. Click generate

**Expected Results:**

- ✅ Button disabled OR
- ✅ Alert: "Please enter a prompt"

---

## 8️⃣ UI/UX Tests

### Test 8.1: Responsive Design

**Test Viewports:**

- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1440px)

**Expected Results:**

- ✅ Layout adapts properly
- ✅ Buttons stack on mobile
- ✅ Text readable at all sizes
- ✅ No horizontal scroll

### Test 8.2: Dark Mode

**Steps:**

1. Toggle system dark mode
2. Check all components

**Expected Results:**

- ✅ All text readable
- ✅ Proper contrast
- ✅ Colors consistent

### Test 8.3: Loading States

**Check:**

- [ ] Spinner animations smooth
- [ ] Buttons disabled during loading
- [ ] Progress messages clear
- [ ] No UI jumps or flickers

### Test 8.4: Copy Functionality

**Steps:**

1. Generate text or code
2. Click copy button
3. Paste in text editor

**Expected Results:**

- ✅ Full content copied
- ✅ Formatting preserved (code)
- ✅ "Copied!" feedback shown
- ✅ Button reverts after 2s

---

## 9️⃣ Performance Tests

### Test 9.1: Large Text Output

**Steps:**

1. Prompt: "Write a 2000-word essay on artificial intelligence"
2. Generate

**Expected Results:**

- ✅ Loads without lag
- ✅ Scroll smooth
- ✅ No memory leaks

### Test 9.2: Multiple Images

**Steps:**

1. Generate 5 images
2. View in history

**Expected Results:**

- ✅ Images lazy load
- ✅ Page doesn't freeze
- ✅ Thumbnails display properly

---

## 🔟 Integration Tests

### Test 10.1: End-to-End Flow

**Steps:**

1. Login to dashboard
2. Click "AI Generator" quick action
3. Generate text
4. Generate code
5. Generate image
6. View history
7. Copy and download results

**Expected Results:**

- ✅ Seamless navigation
- ✅ All features work together
- ✅ No errors in console
- ✅ Data persists across tabs

---

## ✅ Test Results Summary

| Category         | Tests  | Passed | Failed | Notes |
| ---------------- | ------ | ------ | ------ | ----- |
| Text Generation  | 3      | -      | -      |       |
| Code Generation  | 3      | -      | -      |       |
| Image Generation | 3      | -      | -      |       |
| History          | 4      | -      | -      |       |
| Socket.IO        | 3      | -      | -      |       |
| Rate Limiting    | 2      | -      | -      |       |
| Error Handling   | 3      | -      | -      |       |
| UI/UX            | 4      | -      | -      |       |
| Performance      | 2      | -      | -      |       |
| Integration      | 1      | -      | -      |       |
| **TOTAL**        | **28** | **-**  | **-**  |       |

---

## 🐛 Known Issues

1. **CAPTCHA Bypass**: Currently using `"bypass"` token - needs real CAPTCHA integration
2. **Image URL Expiry**: DALL-E URLs expire after ~1 hour - need permanent storage
3. **MFA Placeholder**: MFA verification not fully implemented for admin features

---

## 🚀 Next Steps

1. Implement Google reCAPTCHA v3 or Cloudflare Turnstile
2. Add image upload to S3/R2 for permanent storage
3. Complete MFA integration for admin endpoints
4. Add usage metrics dashboard for admins
5. Implement AI Builder Agent UI (project scaffolding)
6. Add export functionality (PDF, Markdown)
7. Add favorites/bookmarking for generations

---

**Test Execution Date:** **\*\*\*\***\_**\*\*\*\***  
**Tester Name:** **\*\*\*\***\_**\*\*\*\***  
**Build Version:** **\*\*\*\***\_**\*\*\*\***  
**Test Environment:** Development / Staging / Production
