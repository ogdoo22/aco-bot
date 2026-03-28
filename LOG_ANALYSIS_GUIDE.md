# Log Analysis Guide - How to Share Logs with Claude

**Goal:** Make it easy for you to share logs with me (Claude) so I can diagnose issues and tune your bot.

---

## 📁 Where Logs Are Stored

All bot sessions are logged to:
```
~/.config/aco-bot/logs/
```

Each session creates a new log file:
```
~/.config/aco-bot/logs/session_1234567890.jsonl
```

**Format:** JSONL (JSON Lines) - one JSON object per line, easy to parse.

---

## 📊 Log File Structure

Each log entry looks like this:

```json
{
  "timestamp": 1709567890123,
  "level": "info",
  "category": "checkout",
  "message": "Product page loaded",
  "taskId": "task_abc123",
  "data": {
    "url": "https://kith.com/products/air-jordan-1",
    "duration": 1234
  }
}
```

**Fields:**
- `timestamp`: Unix timestamp (milliseconds)
- `level`: `debug`, `info`, `warn`, `error`, `success`
- `category`: `system`, `task`, `checkout`, `proxy`, `captcha`, `discord`
- `message`: Human-readable description
- `taskId`: Which task this log relates to (if applicable)
- `data`: Additional structured data

---

## 🔍 How to Find Your Latest Log

### Option 1: From the App (Coming Soon)
```
Settings → Export Logs → Latest Session
```

### Option 2: Terminal
```bash
# List all log files (newest first)
ls -lt ~/.config/aco-bot/logs/

# View latest log
cat ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# Copy latest log to clipboard (for sharing)
cat ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1) | pbcopy  # Mac
cat ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1) | xclip   # Linux
```

---

## 📤 How to Share Logs with Claude

### Scenario: "My bot isn't working, help me fix it"

**Step 1: Run a test session**
```bash
# Run 5-10 tasks on a test product
# Let them complete (success or fail)
```

**Step 2: Get the log file**
```bash
# Copy path to latest log
ls -t ~/.config/aco-bot/logs/ | head -1
# Example output: session_1709567890.jsonl
```

**Step 3: Share with me**

**Option A: Copy entire log (if small <100 lines)**
```bash
cat ~/.config/aco-bot/logs/session_1709567890.jsonl
```

Paste the output into your message to Claude.

**Option B: Copy last 50 lines (if large)**
```bash
tail -50 ~/.config/aco-bot/logs/session_1709567890.jsonl
```

**Option C: Filter to errors only**
```bash
grep '"level":"error"' ~/.config/aco-bot/logs/session_1709567890.jsonl
```

**Option D: Filter to a specific task**
```bash
grep '"taskId":"task_abc123"' ~/.config/aco-bot/logs/session_1709567890.jsonl
```

---

## 🎯 What I'll Look For

When you share logs, I'll analyze:

### 1. **Success Rate**
```bash
# Count successful tasks
grep '"level":"success"' session_xxx.jsonl | grep "Order complete" | wc -l

# Count failed tasks
grep '"level":"error"' session_xxx.jsonl | grep "Task failed" | wc -l
```

### 2. **Failure Patterns**
- Where do tasks fail most often?
  - At product page? → URL or site issue
  - At cart? → Out of stock or variant issue
  - At checkout? → Bot detection or proxy issue
  - At payment? → Captcha or payment issue

### 3. **Timing Data**
```bash
# Check checkout durations
grep '"duration"' session_xxx.jsonl
```

**What's normal:**
- Product page load: 500-2000ms
- Add to cart: 100-500ms
- Checkout page: 1000-3000ms
- Payment page: 1000-3000ms
- Captcha solve: 15000-30000ms (if present)

**Red flags:**
- Any step >10 seconds = timeout/issue
- Captcha solve >60 seconds = 2Captcha issue

### 4. **Proxy Health**
```bash
# Check proxy failures
grep '"category":"proxy"' session_xxx.jsonl | grep '"level":"error"'
```

**Red flags:**
- >30% proxy failures = bad proxies
- "ETIMEDOUT" = proxy dead or wrong credentials
- "403 Forbidden" = proxy IP banned by site

### 5. **Error Messages**
```bash
# List all unique errors
grep '"level":"error"' session_xxx.jsonl | jq -r '.message' | sort | uniq -c
```

Common errors I'll look for:
- "Navigation timeout" = Bot detection
- "Product sold out" = Normal, can't fix
- "Proxy timeout" = Proxy issue
- "Captcha failed" = 2Captcha issue
- "Element not found" = Site structure changed

---

## 📋 Log Analysis Template

When sharing logs, please include this context:

```markdown
## Session Info
- Date: YYYY-MM-DD
- Tasks run: X
- Success: Y
- Failed: Z
- Success rate: Y/X = ___%

## Target
- Site: [Shopify store URL]
- Product: [Product name]
- Drop time: [If known]
- Competition level: [Low/Medium/High/Unknown]

## Configuration
- Proxy type: [Residential/ISP/Datacenter]
- Proxy count: [Number]
- 2Captcha balance: [$X]

## Symptoms
- [Describe what's happening]
- [Where tasks are failing]
- [Any error messages you see]

## Logs
[Paste log file or excerpt here]
```

---

## 🔧 What I'll Recommend

Based on logs, I'll provide specific tuning recommendations:

### Example Analysis:

**You share:**
```
Success rate: 20%
Most tasks fail at checkout page with "Navigation timeout"
Logs show: 80% of failures at "Checkout page loaded" step
```

**I'll recommend:**
```typescript
// In ShopifyAutomation.ts, increase delays:

// Before checkout (line 123)
await randomDelay(500, 1000);  // Was: 200, 400

// Add session warmup (new code):
await page.goto(productUrl.replace(/\/products\/.*/, ''));
await randomDelay(2000, 3000);
await page.goto(productUrl);

// Try residential proxies instead of datacenter
```

---

## 📊 Log Queries I'll Run

When you share logs, I'll run these analyses:

### Query 1: Failure Breakdown
```bash
# Extract failure reasons
jq -s 'map(select(.level=="error")) | group_by(.message) | map({reason: .[0].message, count: length})' session_xxx.jsonl
```

**Output:**
```json
[
  {"reason": "Navigation timeout", "count": 15},
  {"reason": "Product sold out", "count": 8},
  {"reason": "Proxy timeout", "count": 3}
]
```

**Interpretation:**
- 15 bot detection failures → Need stealth tuning
- 8 out of stock → Normal
- 3 proxy issues → Check proxies

---

### Query 2: Checkout Funnel
```bash
# See where tasks drop off
jq -s 'map(select(.category=="checkout")) | group_by(.message) | map({step: .[0].message, count: length})' session_xxx.jsonl
```

**Output:**
```json
[
  {"step": "Product page loaded", "count": 25},
  {"step": "Added to cart", "count": 22},
  {"step": "Checkout page loaded", "count": 18},
  {"step": "Payment page loaded", "count": 12},
  {"step": "Order complete", "count": 10}
]
```

**Interpretation:**
- 25 → 22 (88% success rate at add-to-cart) = Good
- 22 → 18 (82% success at checkout) = Acceptable
- 18 → 12 (67% at payment) = Issue here
- 12 → 10 (83% complete) = Good

**Diagnosis:** Problem at payment page (67% drop-off)
- Likely: Captcha issues or payment form errors
- Fix: Check captcha logs, verify payment info format

---

### Query 3: Average Checkout Time
```bash
# Calculate average successful checkout time
jq -s 'map(select(.message=="Order complete" and .data.checkoutTime)) | map(.data.checkoutTime) | add / length' session_xxx.jsonl
```

**Output:** `2847` (2.847 seconds average)

**Interpretation:**
- <2s = Excellent
- 2-5s = Good
- 5-10s = Acceptable
- >10s = Too slow (proxy or detection issues)

---

### Query 4: Proxy Performance
```bash
# Compare proxy success rates
jq -s 'map(select(.category=="proxy")) | group_by(.data.proxyId) | map({proxy: .[0].data.proxyId, successes: map(select(.level=="success")) | length, failures: map(select(.level=="error")) | length})' session_xxx.jsonl
```

**Output:**
```json
[
  {"proxy": "proxy_abc", "successes": 8, "failures": 2},
  {"proxy": "proxy_xyz", "successes": 2, "failures": 8}
]
```

**Interpretation:**
- proxy_abc: 80% success → Keep
- proxy_xyz: 20% success → Deactivate

**Action:** Remove bad proxy from pool.

---

## 🚀 Automated Log Analysis (Future Feature)

### Coming in Phase 2:

```bash
# Run analysis tool
npm run analyze-logs session_1709567890.jsonl
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ACO Bot - Log Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: session_1709567890
Duration: 15m 32s
Tasks: 25 total

✅ Success Rate: 40% (10/25)
⏱️  Avg Checkout: 3.2s
📈 Fastest: 1.4s
📉 Slowest: 8.7s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Failure Breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Bot Detection (8 tasks, 53%)
   → Recommendation: Increase delays by 50%

2. Out of Stock (5 tasks, 33%)
   → Normal - product sold out

3. Proxy Timeout (2 tasks, 13%)
   → Check Smartproxy balance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Recommended Fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CRITICAL: High bot detection rate
   File: src/automation/shopify/ShopifyAutomation.ts
   Change: await randomDelay(100, 300)
   To:     await randomDelay(300, 600)

2. WARNING: 2 proxies underperforming
   Proxies: proxy_xyz, proxy_789
   Action: Test or remove

3. INFO: Captcha detected in 60% of tasks
   Cost: ~$0.15 (5 solves × $0.03)
   Balance: $8.45 remaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Quick Checklist: "Are My Logs Useful?"

Logs should show:
- [ ] Task start/complete events
- [ ] Each checkout step (product, cart, checkout, payment)
- [ ] Timing data for each step
- [ ] Proxy usage and health
- [ ] Captcha detection and solving
- [ ] Clear error messages with context
- [ ] Success/failure reasons

If you see all of these → Logs are ready for analysis!

---

## 💬 Example Conversation with Claude

**You:**
```
Hey Claude, my bot is only getting 20% success rate. Here's my latest log:

[Paste 50 lines of log]

Can you help me tune it?
```

**Me (Claude):**
```
I analyzed your logs. Here's what I found:

1. **Problem:** 80% of failures at "Checkout page loaded" with "Navigation timeout"
   **Diagnosis:** Bot detection - site is blocking at checkout step
   **Fix:** Increase delays to appear more human-like

2. **Problem:** 3 proxy timeouts
   **Diagnosis:** Proxies slow or dead
   **Fix:** Test proxies, remove slow ones

Here's the exact code change:

[Provides specific code fixes]

Try this and run 10 more tasks. Share logs again and I'll see if it improved!
```

---

## 🎯 Summary

**To get help from me:**
1. Run 5-10 test tasks
2. Find log file: `ls -t ~/.config/aco-bot/logs/ | head -1`
3. Share log with context (success rate, symptoms, configuration)
4. I'll analyze and provide specific code fixes
5. You apply fixes and test again
6. Iterate until optimized!

**The more logs you share, the better I can tune your bot.** 📈
