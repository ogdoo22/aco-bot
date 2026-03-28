# ACO Bot - Performance Tuning Guide

**How to measure, analyze, and improve your bot's success rate**

---

## 📊 Table of Contents

1. [Understanding the Metrics](#understanding-the-metrics)
2. [Reading Console Logs](#reading-console-logs)
3. [Common Failure Modes](#common-failure-modes)
4. [What to Tune](#what-to-tune)
5. [Testing Framework](#testing-framework)
6. [Optimization Playbook](#optimization-playbook)
7. [Success Rate Targets](#success-rate-targets)

---

## 📊 Understanding the Metrics

### Key Performance Indicators (KPIs)

#### 1. **Success Rate** (Most Important)
```
Success Rate = (Successful Checkouts / Total Tasks) × 100
```

**What it means:**
- **60%+** = Excellent (competitive with paid bots)
- **40-60%** = Good (profitable, needs minor tuning)
- **20-40%** = Needs improvement (major issues)
- **<20%** = Critical issues (not usable)

**How to measure:**
```javascript
// Check your dashboard or run this in console
const tasks = await window.electron.getAllTasks();
const completed = tasks.filter(t => t.status === 'success' || t.status === 'failed');
const successful = tasks.filter(t => t.status === 'success');
const successRate = (successful.length / completed.length) * 100;
console.log(`Success Rate: ${successRate.toFixed(1)}%`);
```

#### 2. **Checkout Time** (Speed)
```
Average Checkout Time = Sum of all successful checkout times / Number of successes
```

**What it means:**
- **<2s** = Lightning fast (ideal)
- **2-5s** = Good (competitive)
- **5-10s** = Acceptable (slower proxies or retries)
- **>10s** = Too slow (likely proxy issues)

**Why it matters:** On limited drops, speed determines who gets the item first.

#### 3. **Failure Breakdown** (Diagnostic)

Track **why** tasks are failing:
- **Out of Stock** = Can't improve (product sold out)
- **Proxy Timeout** = Bad proxies or overloaded
- **Captcha Failed** = 2Captcha issues or balance low
- **Bot Detection** = Anti-detection needs tuning
- **Payment Declined** = Card issue (not bot-related)
- **Unknown Error** = Need to investigate logs

**How to calculate:**
```javascript
const failed = tasks.filter(t => t.status === 'failed');
const failureReasons = {};
failed.forEach(t => {
  const reason = t.errorMessage || 'Unknown';
  failureReasons[reason] = (failureReasons[reason] || 0) + 1;
});
console.table(failureReasons);
```

**What to look for:**
- **>50% "Out of Stock"** = Normal, can't fix (product is competitive)
- **>30% "Proxy Timeout"** = Proxy issue (upgrade proxies)
- **>20% "Bot Detection"** = Anti-detection needs work
- **>10% "Captcha Failed"** = Check 2Captcha balance/config

---

## 🔍 Reading Console Logs

### How to Open Console

**In the app:**
1. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. Click "Console" tab
3. Watch logs in real-time as tasks run

### What to Look For

#### ✅ Good Logs (Successful Checkout)
```
🚀 Starting Shopify checkout: https://kith.com/products/air-jordan-1
✅ Product page loaded: Air Jordan 1 Chicago
✅ Selected variant: US 10
✅ Added to cart
✅ Checkout page loaded
✅ Shipping info filled
✅ Payment page loaded
✅ Payment info filled
✅ Order complete: KTH-4782
✅ Stealth patches applied
✅ Proxy gate.smartproxy.com:7000 OK (45ms) - IP: 45.23.67.89
```

**What this means:** Everything worked perfectly. Checkout took ~2 seconds.

---

#### ❌ Bad Logs (Bot Detection)
```
🚀 Starting Shopify checkout: https://kith.com/products/air-jordan-1
✅ Product page loaded: Air Jordan 1 Chicago
✅ Added to cart
❌ Navigation timeout: 30000ms exceeded
Error: Timeout 30000ms exceeded during checkout
```

**What this means:** Bot was detected at checkout page. Shopify blocked the request.

**What to tune:**
- Increase delays (see [Timing Adjustments](#1-timing-adjustments))
- Improve fingerprinting (see [Stealth Improvements](#2-stealth-improvements))
- Try different proxy type

---

#### ⚠️ Proxy Issues
```
🚀 Starting Shopify checkout: https://kith.com/products/air-jordan-1
❌ Proxy gate.smartproxy.com:7000 FAILED: connect ETIMEDOUT
❌ Proxy test complete: 0 passed, 10 failed
```

**What this means:** Proxies are dead, wrong credentials, or overloaded.

**What to tune:**
- Verify Smartproxy credentials in `.env`
- Check Smartproxy dashboard for balance
- Test proxy manually: `curl -x http://user:pass@host:port https://api.ipify.org`
- Try different proxy type (residential vs ISP)

---

#### 🔄 Captcha Issues
```
✅ Payment page loaded
⚠️  Captcha detected, solving...
❌ Failed to solve captcha: Insufficient balance
```

**What this means:** 2Captcha ran out of money or API key is wrong.

**What to tune:**
- Check 2Captcha balance: https://2captcha.com
- Verify API key in `.env`
- Add funds ($10 minimum)

---

#### 🏪 Out of Stock (Not Your Fault)
```
✅ Product page loaded: Air Jordan 1 Chicago
✅ Selected variant: US 10
❌ POST /cart/add.js → 422 {"error": "Product sold out"}
```

**What this means:** Product sold out before your bot clicked. This is **normal** on competitive drops.

**What to tune:**
- Nothing - this isn't a bot issue
- Try starting tasks 2-5 seconds before drop time (if you know exact time)
- Increase number of tasks (more attempts = higher chance)

---

## 🔧 Common Failure Modes

### Mode 1: "All tasks fail immediately"

**Symptoms:**
- 0% success rate
- Tasks go from RUNNING → FAILED in <5 seconds
- Error: "Proxy timeout" or "Navigation timeout"

**Diagnosis:**
```bash
# Test proxy manually
curl -x http://USERNAME:PASSWORD@gate.smartproxy.com:7000 https://api.ipify.org

# Should return your proxy IP
# If fails → proxy config wrong
```

**Fix:**
1. Verify `.env` has correct Smartproxy credentials
2. Check Smartproxy dashboard for balance
3. Test with different proxy type (residential vs datacenter)

---

### Mode 2: "Bot gets to checkout but then fails"

**Symptoms:**
- Tasks fail at checkout page or payment page
- Error: "Navigation timeout" or "Element not found"
- Success rate: 10-30%

**Diagnosis:**
- Bot is being detected at checkout
- Shopify Bot Manager is blocking

**Fix:**
1. **Increase delays** (see [Timing Adjustments](#1-timing-adjustments))
2. **Improve stealth** (see [Stealth Improvements](#2-stealth-improvements))
3. **Upgrade proxies** (residential > ISP > datacenter)

---

### Mode 3: "Captcha never solves"

**Symptoms:**
- Tasks hang for 30+ seconds
- Error: "Captcha solving timeout"
- Success rate: 0% when captcha present

**Diagnosis:**
- 2Captcha balance too low
- API key wrong
- Captcha type not supported

**Fix:**
1. Check 2Captcha balance
2. Add funds ($10 minimum)
3. Verify API key in `.env`

---

### Mode 4: "Random 50% success rate"

**Symptoms:**
- Some tasks succeed, some fail randomly
- No clear pattern
- Success rate: 40-60%

**Diagnosis:**
- **This is actually good!** It means the bot works.
- Randomness is due to competition (other bots) and proxy quality variance

**Optimization:**
1. **Improve proxy quality** (better proxies = more consistent)
2. **Fine-tune timing** (reduce delays slightly)
3. **Scale up tasks** (10 tasks with 50% success = 5 checkouts)

---

## 🎛️ What to Tune

### 1. Timing Adjustments

**Location:** `src/automation/shopify/ShopifyAutomation.ts`

#### Current Delays:
```typescript
// After selecting variant
await randomDelay(100, 300);  // 100-300ms

// After add to cart
await randomDelay(200, 400);  // 200-400ms

// After filling shipping
await randomDelay(300, 500);  // 300-500ms

// After filling payment
await randomDelay(300, 500);  // 300-500ms

// Before submitting order
await humanDelay(500, 800);   // 500-800ms
```

#### When to Increase (Better Stealth, Slower):
```typescript
// If getting detected at checkout
await randomDelay(300, 600);  // Was 100-300
await randomDelay(500, 800);  // Was 200-400
await randomDelay(800, 1200); // Was 300-500
```

**Tradeoff:** More human-like but slower checkout (3-7 seconds vs 2-3 seconds)

#### When to Decrease (Faster, Riskier):
```typescript
// If success rate is >60% and want to be faster
await randomDelay(50, 150);   // Was 100-300
await randomDelay(100, 200);  // Was 200-400
await randomDelay(200, 300);  // Was 300-500
```

**Tradeoff:** Faster checkout (1-2 seconds) but higher detection risk

---

### 2. Stealth Improvements

**Location:** `src/automation/stealth/StealthPatches.ts`

#### Test Fingerprint Randomization:

If getting detected frequently, add more randomization:

```typescript
// Add to StealthPatches.ts

// Randomize screen resolution
await page.addInitScript(() => {
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ];
  const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];

  Object.defineProperty(screen, 'width', { get: () => resolution.width });
  Object.defineProperty(screen, 'height', { get: () => resolution.height });
});

// Randomize timezone
await page.addInitScript(() => {
  const timezones = ['America/New_York', 'America/Chicago', 'America/Los_Angeles'];
  const tz = timezones[Math.floor(Math.random() * timezones.length)];

  // Note: This is tricky, may need more sophisticated approach
});
```

---

### 3. Proxy Quality

**Current:** Single proxy type (Smartproxy)

**Optimization:**

#### Test Different Proxy Types:
```bash
# In .env, try different Smartproxy endpoints:

# Residential (Best stealth, slower)
SMARTPROXY_ENDPOINT=gate.smartproxy.com:7000

# Datacenter (Faster, easier to detect)
SMARTPROXY_ENDPOINT=gate.smartproxy.com:10000

# ISP (Good balance)
SMARTPROXY_ENDPOINT=gate.smartproxy.com:20000
```

**Rule of thumb:**
- **High-security sites** (Nike, Footlocker) → Residential
- **Medium sites** (Target, Walmart) → ISP
- **Easy sites** (Most Shopify stores) → ISP or Datacenter

---

### 4. Retry Logic

**Location:** `src/main/TaskManager.ts`

**Current:** 3 retries with 500ms delay

```typescript
maxRetries: 3,
delay: 500,
```

#### Aggressive Retries (More chances):
```typescript
maxRetries: 5,        // Was 3
delay: 300,          // Was 500 (retry faster)
```

**Use when:** Product has low competition, want more attempts

#### Conservative Retries (Less spam):
```typescript
maxRetries: 1,        // Was 3
delay: 1000,         // Was 500
```

**Use when:** Getting rate-limited or IP banned

---

### 5. Task Start Timing

**Location:** `src/main/TaskManager.ts`

**Current:** Small random delay between tasks (100-300ms)

```typescript
// In startMultipleTasks
await this.delay(100 + Math.random() * 200);
```

#### Spread Out Tasks (Less detection):
```typescript
await this.delay(500 + Math.random() * 1000); // 500-1500ms between starts
```

#### Start Simultaneously (Faster):
```typescript
// Remove delay entirely
// All tasks start at same instant
```

---

### 6. User-Agent Rotation

**Location:** `src/automation/shopify/ShopifyAutomation.ts`

**Current:** Single User-Agent

```typescript
userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
```

#### Rotate User-Agents:
```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

this.context = await this.browser.newContext({
  userAgent,
  // ... rest of config
});
```

---

## 🧪 Testing Framework

### Methodology: A/B Testing

**Goal:** Test one change at a time to measure impact.

### Example Test:

#### Hypothesis: "Increasing delays improves success rate"

**Control Group (Baseline):**
- Run 20 tasks with current settings
- Measure: Success rate, avg checkout time

**Test Group:**
- Change delays (increase by 50%)
- Run 20 tasks with new settings
- Measure: Success rate, avg checkout time

**Compare:**
```
Control: 45% success, 2.3s avg
Test:    60% success, 3.8s avg

Result: +15% success rate, +1.5s slower
Decision: Accept change (worth the tradeoff)
```

---

### Testing Template

#### Before Test:
1. **Document current state:**
   ```
   Current success rate: ____%
   Current avg time: _____s
   Failure breakdown:
   - Out of stock: ___%
   - Proxy timeout: ___%
   - Bot detection: ___%
   - Other: ___%
   ```

2. **Make ONE change:**
   - Example: Increase delays by 50%

3. **Test on same product:**
   - Run 10-20 tasks on same drop
   - Ensure consistent conditions (same proxy count, same time of day)

4. **Measure results:**
   ```
   New success rate: ____%
   New avg time: _____s
   Change: +/- ____%
   ```

5. **Decision:**
   - Keep change if success rate improved by 10%+
   - Revert if success rate dropped or no meaningful change

---

## 📋 Optimization Playbook

### Week 1: Baseline Testing

**Goal:** Establish baseline metrics

1. **Run 50 tasks total** across 3-5 different Shopify drops
2. **Record:**
   - Success rate: ____%
   - Avg checkout time: _____s
   - Failure breakdown (out of stock vs proxy vs detection)
3. **Identify #1 failure mode** (proxy timeout? bot detection? out of stock?)

---

### Week 2: Fix Critical Issues

**If success rate <20%:**
- **Check proxies first** (90% of issues)
  - Test manually: `curl -x ...`
  - Verify balance on Smartproxy
  - Try residential proxies instead of datacenter

**If 20-40% success:**
- **Focus on anti-detection**
  - Increase delays by 50%
  - Test different proxy types
  - Add more stealth patches

**If 40-60% success:**
- **You're doing well!** Move to fine-tuning (Week 3)

---

### Week 3: Fine-Tuning

**Goal:** Optimize for speed while maintaining success rate

1. **Reduce delays by 20%**
   - Test on 20 tasks
   - If success rate drops <5%, keep change
   - If drops >5%, revert

2. **Test proxy types**
   - Run 10 tasks with ISP proxies
   - Run 10 tasks with residential proxies
   - Compare success rates
   - Use winner

3. **Optimize task timing**
   - Test starting tasks 2s before drop time
   - Test starting 5s before drop time
   - Measure which gets more checkouts

---

### Week 4: Scaling

**Goal:** Scale up to 50-100 tasks per drop

1. **Add more proxies** (50-100 IPs)
2. **Test concurrency limits**
   - Run 50 tasks simultaneously
   - Monitor for rate limiting or bans
   - Adjust task start delays if needed
3. **Measure ROI**
   - Calculate profit per drop
   - Ensure costs (proxies + captcha) < profit

---

## 🎯 Success Rate Targets

### By Site Difficulty:

| Site Type | Target Success Rate | Notes |
|-----------|---------------------|-------|
| **Easy Shopify** (Supreme, Kith) | 60-70% | Most drops aren't super competitive |
| **Medium Shopify** (Hyped drops) | 40-60% | Limited stock, high competition |
| **Target** (Phase 2) | 40-50% | PerimeterX security |
| **Walmart** (Phase 2) | 30-40% | Akamai security |
| **Nike, Footlocker** (Phase 3) | 20-40% | Extremely hard |

### By Drop Competition:

| Competition Level | Expected Success | Example |
|-------------------|------------------|---------|
| **Low** | 70-90% | GR (General Release) shoes |
| **Medium** | 40-60% | Limited edition merch |
| **High** | 20-40% | Travis Scott collabs |
| **Extreme** | 5-20% | Yeezy 2016 (back in the day) |

### Reality Check:

- **Your first drop: 10-30% success** is normal
- **After tuning: 40-60% success** is realistic
- **With perfect setup: 60-80% success** is achievable (for non-hyped items)
- **On hyped drops: 20-40% success** even with perfect bot

**Remember:** Even a 30% success rate can be profitable if you run 20+ tasks.

---

## 📊 Metrics Dashboard (Coming Soon)

### What We'll Add in Phase 2:

```javascript
// Analytics view showing:
{
  "totalDrops": 12,
  "totalTasks": 145,
  "successRate": 62.5,
  "avgCheckoutTime": 2.8,
  "fastestCheckout": 1.2,
  "slowestCheckout": 8.3,
  "failureReasons": {
    "Out of Stock": 38,
    "Proxy Timeout": 12,
    "Bot Detection": 5,
    "Captcha Failed": 3
  },
  "byProxy": {
    "residential": { success: 68, total: 100 },
    "isp": { success: 55, total: 45 }
  },
  "bySite": {
    "kith.com": { success: 18, total: 25 },
    "supremenewyork.com": { success: 12, total: 20 }
  }
}
```

For now, use console logs and manual tracking.

---

## 🔍 Advanced: Reading Playwright Traces

If you need deep debugging:

### Enable Trace Recording:

**In `ShopifyAutomation.ts`:**
```typescript
// Before starting automation
await this.context.tracing.start({ screenshots: true, snapshots: true });

// After checkout (success or fail)
await this.context.tracing.stop({ path: `traces/${taskId}.zip` });
```

### View Trace:
```bash
npx playwright show-trace traces/task_12345.zip
```

This shows every action the bot took, with screenshots and timing.

---

## ✅ Quick Checklist: "Is My Bot Optimized?"

- [ ] **Success rate >50%** on non-hyped drops
- [ ] **Avg checkout time <5s** (without captcha)
- [ ] **Proxy success rate >80%** (test with `testAllProxies()`)
- [ ] **<20% bot detection failures** (most failures should be "out of stock")
- [ ] **Console shows no errors** during successful checkouts
- [ ] **2Captcha solves in <30s** when captcha appears
- [ ] **Can run 20+ tasks simultaneously** without crashing

If all checked → **You're optimized!** 🎉

If any unchecked → Focus on that area first.

---

## 🆘 Still Stuck?

### Debugging Steps:

1. **Open console** (`Ctrl+Shift+I`)
2. **Run 5 tasks** on a test product
3. **Read all error messages**
4. **Post in Discord** (or wherever you discuss) with:
   - Error messages
   - Success rate
   - Proxy type
   - Site tested

90% of issues are proxy configuration. Check that first!

---

**Ready to optimize? Start with Week 1 baseline testing!** 📈
