# Continuous Improvement Workflow

**How to use logs + Claude to continuously improve your bot's performance**

---

## 🔄 The Feedback Loop

```
1. Run bot on test drops
         ↓
2. Bot generates detailed logs
         ↓
3. Share logs with Claude
         ↓
4. Claude analyzes & suggests fixes
         ↓
5. Apply fixes to code
         ↓
6. Test again & measure improvement
         ↓
7. Repeat until optimized (60%+ success)
```

---

## 📊 Step 1: Run Test Session

### Before Testing:
```bash
# Ensure logs are enabled
cd /home/quint/aco-bot
npm start
```

### Run 5-10 Tasks:
1. Create 5-10 tasks for the same product
2. Click "Start All"
3. Wait for all tasks to complete (success or fail)
4. Note the results:
   - Success: ____ /10
   - Failed: ____ /10
   - Success rate: ____%

---

## 📁 Step 2: Get Logs

### Location:
```bash
~/.config/aco-bot/logs/session_XXXXX.jsonl
```

### Quick Access:
```bash
# List log files (newest first)
ls -lt ~/.config/aco-bot/logs/

# View latest log
tail -100 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# Copy to clipboard (Mac)
cat ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1) | pbcopy

# Copy to clipboard (Linux)
cat ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1) | xclip -selection clipboard
```

---

## 💬 Step 3: Share with Claude

### Message Template:

```markdown
Hey Claude, I need help tuning my ACO bot. Here are my results:

## Session Summary
- Date: 2026-02-25
- Tasks: 10
- Success: 3
- Failed: 7
- Success rate: 30%

## Configuration
- Site: Kith (Shopify)
- Product: Air Jordan 1 Chicago
- Proxy type: Smartproxy Residential
- Proxy count: 20
- 2Captcha balance: $15

## What I'm Seeing
- Most tasks fail at checkout page
- Error: "Navigation timeout"
- Some captchas detected but solved successfully
- 3 proxy timeouts

## Logs (last 50 lines)
[Paste logs here]

Can you analyze and tell me what to fix?
```

---

## 🔍 Step 4: Claude Analyzes

### What I'll Look For:

#### 1. **Failure Patterns**
```bash
# I'll mentally run these queries on your logs:

# Where do tasks fail most?
grep '"level":"error"' logs.jsonl | jq -r '.message' | sort | uniq -c

# Checkout funnel analysis
grep '"category":"checkout"' logs.jsonl | jq -r '.message'

# Timing analysis
grep '"duration"' logs.jsonl | jq '.data.duration'
```

#### 2. **Common Issues I'll Identify:**

**Issue A: Bot Detection (Most Common)**
```json
{"level":"error","message":"Navigation timeout","category":"checkout"}
{"level":"error","message":"Timeout 30000ms exceeded"}
```

**Diagnosis:** Site is blocking bot at checkout
**Fix:** Increase delays, improve stealth

---

**Issue B: Proxy Problems**
```json
{"level":"error","category":"proxy","message":"Proxy timeout"}
{"data":{"speedMs":5000}}
```

**Diagnosis:** Proxies too slow or failing
**Fix:** Test proxies, upgrade to residential

---

**Issue C: Captcha Issues**
```json
{"level":"error","category":"captcha","message":"Captcha solving timeout"}
```

**Diagnosis:** 2Captcha balance low or API issue
**Fix:** Add funds, verify API key

---

**Issue D: Out of Stock (Normal)**
```json
{"level":"error","message":"Product sold out"}
```

**Diagnosis:** Product sold out (not bot issue)
**Fix:** None - try more tasks or earlier timing

---

## 🔧 Step 5: Apply Fixes

### I'll Provide Exact Code Changes:

#### Example Fix 1: Increase Delays (Bot Detection)

**Your logs show:**
```
15 tasks failed with "Navigation timeout" at checkout page
```

**My recommendation:**
```typescript
// File: src/automation/shopify/ShopifyAutomation.ts
// Line ~85 (after filling shipping info)

// OLD:
await randomDelay(300, 500);

// NEW:
await randomDelay(800, 1200);  // Increased by 150%
```

**Reasoning:** Site is detecting bot behavior. Longer delays appear more human-like.

---

#### Example Fix 2: Add Session Warmup (Bot Detection)

**Your logs show:**
```
Tasks go straight to product → checkout → timeout
```

**My recommendation:**
```typescript
// File: src/automation/shopify/ShopifyAutomation.ts
// Add BEFORE navigating to product page (line ~55)

// NEW CODE:
// Warm up session - visit homepage first
const homepage = new URL(task.productUrl).origin;
await page.goto(homepage, { waitUntil: 'domcontentloaded' });
this.logger.checkoutStep('Homepage visited (warmup)', task.id, 0);
await randomDelay(2000, 4000);  // Browse homepage for 2-4 seconds

// Then proceed to product page
await page.goto(task.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
```

**Reasoning:** Bots that go straight to checkout look suspicious. Real users browse first.

---

#### Example Fix 3: Upgrade Proxy Type (Proxy Issues)

**Your logs show:**
```
40% proxy timeouts
Average proxy speed: 4500ms (too slow)
```

**My recommendation:**
```bash
# Change in .env file:

# OLD:
SMARTPROXY_ENDPOINT=gate.smartproxy.com:10000  # Datacenter

# NEW:
SMARTPROXY_ENDPOINT=gate.smartproxy.com:7000   # Residential
```

**Reasoning:** Datacenter proxies are being detected. Residential proxies are harder to block.

---

#### Example Fix 4: Add Retry with New Proxy (Proxy Issues)

**Your logs show:**
```
Same proxy failing repeatedly
```

**My recommendation:**
```typescript
// File: src/main/TaskManager.ts
// In executeTask() method, around line 80

// AFTER: proxy assignment
if (task.retryCount > 0) {
  // On retry, always get a NEW proxy
  proxy = await this.proxyManager.getRandomProxy();
  this.logger.info('task', 'Retry with new proxy', task.id, {
    newProxyId: proxy?.id,
    retryAttempt: task.retryCount,
  });
}
```

**Reasoning:** Don't retry with the same burned proxy. Get a fresh one.

---

## 📈 Step 6: Test & Measure

### After Applying Fixes:

1. **Restart the app** (if code changes)
   ```bash
   npm run build
   npm start
   ```

2. **Run same test** (10 tasks on same product)

3. **Compare results:**
   ```
   Before: 30% success (3/10)
   After:  60% success (6/10)

   Improvement: +30 percentage points ✅
   ```

4. **Check logs again:**
   ```bash
   tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)
   ```

5. **Share results with me:**
   ```markdown
   Update: Applied your fixes!

   Before: 30% success
   After:  60% success

   Remaining issues:
   - Still 4 "out of stock" failures (expected)
   - No more bot detection errors ✅
   - Avg checkout time: 4.2s (was 2.1s)

   Should I try to speed it up or keep it safe?
   ```

---

## 🔄 Step 7: Iterate

### Typical Improvement Curve:

```
Week 1: 20% → 40%  (Fix critical issues)
Week 2: 40% → 55%  (Fine-tune delays)
Week 3: 55% → 65%  (Optimize proxies)
Week 4: 65% → 70%  (Perfect timing)
```

### When to Stop:

- ✅ **60%+ success rate** = Excellent, bot is competitive
- ✅ **Most failures = "out of stock"** = Can't improve further (product issue)
- ✅ **<5% bot detection** = Stealth is good
- ✅ **Checkout time <5s** = Fast enough

**At this point, you're optimized!** Focus on scaling (more tasks, more proxies).

---

## 🎯 Real Example: Week-by-Week Improvement

### Week 1: Baseline (Day 1)

**Results:** 20% success (2/10)

**Logs showed:**
- 6 "Navigation timeout" errors
- 2 "Proxy timeout" errors
- 2 "Out of stock"

**My analysis:**
```markdown
Critical: 60% bot detection rate

Fixes:
1. Increase delays by 100%
2. Add session warmup
3. Test different proxy type
```

---

### Week 1: After Fixes (Day 3)

**Results:** 45% success (9/20)

**Logs showed:**
- 3 "Navigation timeout" (down from 60%)
- 1 "Proxy timeout"
- 7 "Out of stock"

**My analysis:**
```markdown
Great improvement! Bot detection down to 15%.

Remaining issue: Slightly slow (avg 4.8s).

Optional optimization:
- Reduce delays by 20% for speed
- Add more proxies to reduce timeouts
```

---

### Week 2: Fine-Tuned (Day 7)

**Results:** 62% success (31/50)

**Logs showed:**
- 2 "Navigation timeout" (4%)
- 0 "Proxy timeout" (added more proxies)
- 17 "Out of stock" (34%)

**My analysis:**
```markdown
Excellent! You've hit the ceiling.

62% success is competitive.
34% out of stock is expected on hyped drops.
4% detection is acceptable.

You're optimized! Focus on scaling.
```

---

## 📊 Tracking Progress

### Create a Spreadsheet:

| Date | Tasks | Success | Rate | Avg Time | Top Failure | Notes |
|------|-------|---------|------|----------|-------------|-------|
| 2/25 | 10 | 2 | 20% | 2.1s | Bot Detection (60%) | Baseline |
| 2/27 | 20 | 9 | 45% | 4.8s | Out of Stock (35%) | After delays fix |
| 3/01 | 50 | 31 | 62% | 3.9s | Out of Stock (34%) | Optimized ✅ |

### Or Use Console:

```javascript
// In browser console (F12)
const sessions = [
  { date: '2/25', tasks: 10, success: 2, rate: 20 },
  { date: '2/27', tasks: 20, success: 9, rate: 45 },
  { date: '3/01', tasks: 50, success: 31, rate: 62 },
];

console.table(sessions);
```

---

## 🚀 Advanced: Automated Tuning (Future)

### Vision for Phase 3:

```bash
# Bot automatically tunes itself based on logs
npm run auto-tune

# Output:
Analyzing last 100 tasks...
Success rate: 45%
Top issue: Bot detection (30%)

Automatically adjusting:
✅ Delays increased by 50%
✅ Added session warmup
✅ Switched to residential proxies

Re-testing...
New success rate: 68% (+23%)

Tuning complete! ✅
```

**For now:** We do this manually together (you share logs, I provide fixes).

---

## ✅ Quick Checklist

**After Each Test Session:**

- [ ] Run 5-10 tasks
- [ ] Note success rate
- [ ] Find latest log file
- [ ] Copy last 50-100 lines
- [ ] Share with Claude with context
- [ ] Apply recommended fixes
- [ ] Test again
- [ ] Measure improvement

**Goal:** Iterate until 60%+ success rate.

---

## 💡 Pro Tips

### 1. **Test Consistently**
- Same site, same product type
- Same time of day (morning vs evening)
- Same proxy count
- Only change ONE variable at a time

### 2. **Don't Over-Optimize**
- 60-70% is excellent
- 40-60% is profitable
- Diminishing returns after 70%
- Focus on scaling, not perfecting

### 3. **Track Costs**
- Log captcha solves (each costs $0.03)
- Monitor proxy usage
- Calculate ROI per drop

### 4. **Share Context**
- Always include success rate, site, configuration
- Paste logs with errors
- Describe symptoms in your own words

---

## 🎓 Learning Curve

**You'll learn:**
- Which sites are easier/harder
- How different proxies perform
- When to use residential vs ISP
- Optimal delays for different sites
- How to read logs quickly

**After 10-20 drops:**
- You'll recognize patterns immediately
- You'll know which fixes to apply
- You might not need me anymore! 😊

---

## 🆘 Emergency Fixes

### "Success rate suddenly dropped from 60% to 20%"

**Possible causes:**
1. **Site updated security** → Check logs for new errors
2. **Proxies burned** → Test proxies, rotate IPs
3. **2Captcha down** → Check their status page
4. **Competition increased** → More bots on this drop

**Quick diagnosis:**
```bash
# Compare latest logs to successful session
diff good_session.jsonl bad_session.jsonl
```

Share both logs with me!

---

## 🎯 Summary

**The Process:**
1. Test → Logs → Share → Fix → Test → Measure → Repeat
2. Track progress in spreadsheet
3. Aim for 60%+ success rate
4. Most failures should be "out of stock" (not fixable)
5. Optimize until bot detection <10%

**With this workflow, we'll get your bot to 60-70% success in 2-4 weeks.** 🚀

---

**Ready to start? Run your first test session and share the logs!**
