# BYOP (Bring Your Own Proxies) Guide

**Your bot now uses the BYOP model!** Each profile uses its own proxy credentials.

---

## 🎯 What is BYOP?

**BYOP = Bring Your Own Proxies**

Instead of having one shared proxy pool for all users, **each profile manages its own proxy credentials**. This model is perfect for:

- ✅ Reselling the bot to multiple users
- ✅ Each user controlling their own proxy quality
- ✅ Scaling without your proxy costs increasing
- ✅ Users paying for their own infrastructure

---

## 🏗️ How It Works

```
Profile 1 (User A)
├─ Personal Info
├─ Payment Info
└─ Proxies:
    ├─ ISP Proxy 1 (User A's Smartproxy)
    ├─ ISP Proxy 2 (User A's Smartproxy)
    └─ ISP Proxy 3 (User A's Smartproxy)

Profile 2 (User B)
├─ Personal Info
├─ Payment Info
└─ Proxies:
    ├─ Residential Proxy 1 (User B's Oxylabs)
    ├─ Residential Proxy 2 (User B's Oxylabs)
    └─ ISP Proxy 1 (User B's IPRoyal)

Profile 3 (User C)
├─ Personal Info
├─ Payment Info
└─ Proxies:
    ├─ ISP Proxy 1 (User C's BrightData)
    └─ ISP Proxy 2 (User C's BrightData)
```

**Each profile uses ONLY its own proxies!**

---

## 📝 Setup Instructions

### Step 1: Create a Profile

1. Open the app
2. Go to **Profiles** page
3. Click **+ New Profile**
4. Fill in:
   - Profile name (e.g., "John - Walmart Account 1")
   - Email (for aged Walmart account)
   - Phone
   - Shipping address
   - Payment info

### Step 2: Add Proxies to Profile

1. Click on the profile you just created
2. Click **+ Import Proxies** button
3. Select proxy type:
   - **ISP** (recommended for Walmart)
   - **Residential** (for Shopify)
   - **Datacenter** (not recommended)

4. Paste your proxy list in one of these formats:
   ```
   user:pass@host:port
   host:port:user:pass
   ```

   Example:
   ```
   spu1234:pass1234@gate.smartproxy.com:20000
   spu1234:pass1234@gate.smartproxy.com:20001
   spu1234:pass1234@gate.smartproxy.com:20002
   ```

5. Click **Import**

### Step 3: Test Proxies

1. Your proxies will appear in the table
2. Click **Test** button on each proxy
3. Green ✅ = Working
4. Red ❌ = Failed (delete and try another)

### Step 4: Create Tasks

1. Go to **Dashboard**
2. Create task
3. Select the profile (with proxies)
4. The task will automatically use that profile's proxies!

---

## 🌐 Proxy Providers

### Recommended for Walmart (ISP)

**Smartproxy ISP:**
- Endpoint: `gate.smartproxy.com:20000` (ISP endpoint)
- Cost: $40-80 per 10 IPs
- Fast queue entry

**IPRoyal ISP:**
- Cost: $3-5 per IP
- Good quality

**BrightData ISP:**
- Premium quality
- Cost: $5-10 per IP

### Recommended for Shopify (Residential)

**Smartproxy Residential:**
- Endpoint: `gate.smartproxy.com:7000`
- Cost: $50-100 per month

**Oxylabs Residential:**
- Premium quality
- Cost: $100+ per month

---

## 💰 Economics

### BYOP Model Benefits:

**For You (Bot Owner):**
```
Costs:
- 2Captcha: $50/month
- Hosting: $0-20/month
────────────────────
Total: $50-70/month

Revenue (10 users):
- $50/user/month = $500/month

Profit: $500 - $70 = $430/month ✅
```

**Each additional user = pure profit!** Your costs don't scale.

**For Users:**
```
Costs:
- Bot subscription: $50/month
- Their own proxies: $80-200/month
- 2Captcha balance shared (included in your service)
────────────────────
Total: $130-250/month

Revenue (Walmart drops):
- 30 successful orders/month × $50 profit = $1,500/month

Net profit: $1,250-1,370/month ✅
```

---

## 🎯 Multi-User Scenarios

### Scenario 1: Personal Use (Just You)
```
1. Create 1 profile with your info
2. Add your Smartproxy ISP credentials
3. Run tasks on Walmart drops
4. Profit!
```

### Scenario 2: Reselling (10 Users)
```
Each user:
1. Creates their own profile
2. Adds their own proxy credentials
3. Runs their own tasks
4. You charge $50-150/month for bot access
```

### Scenario 3: Cook Group (50 Members)
```
1. Charge $100-300/month per member
2. Each member adds own proxies
3. You provide the bot + support
4. Members profit from drops
```

---

## 🔧 Technical Details

### Database Schema

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  ...
);

CREATE TABLE proxies (
  id TEXT PRIMARY KEY,
  profile_id TEXT, -- Links proxy to profile
  host TEXT,
  port INTEGER,
  username TEXT,
  password TEXT,
  type TEXT, -- 'isp', 'residential', 'datacenter'
  ...
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
```

### How Tasks Get Proxies

```typescript
// When task runs:
1. Get task's profileId
2. Fetch proxies WHERE profile_id = task.profileId
3. Select best proxy (by success rate)
4. Use that proxy for checkout
```

**Tasks ONLY use their profile's proxies!**

---

## ⚠️ Important Notes

### For Profile Owners

1. **Use ISP proxies for Walmart** (queue priority)
2. **Use residential for Shopify**
3. **Test proxies before drops** (Test button)
4. **Add 20-50 proxies per profile** (rotation)
5. **Don't share proxy credentials** (ban risk)

### For Bot Operators

1. **No global .env proxy config needed** (removed)
2. **Each profile is isolated** (own proxies)
3. **Users can't see other users' proxies** (secure)
4. **Support users with proxy setup** (test button helps)

---

## 🆘 Troubleshooting

### "No active proxies configured for this profile"

**Solution:**
1. Go to Profiles page
2. Select the profile
3. Click "Import Proxies"
4. Add at least 1 proxy

### "All proxies failed"

**Solution:**
1. Check proxy credentials are correct
2. Test each proxy individually
3. Try different proxy provider
4. For Walmart: Use ISP proxies (not residential!)

### "Tasks not starting"

**Solution:**
1. Ensure profile has proxies added
2. Check at least 1 proxy is active (green ✅)
3. Test proxy before running task

---

## 📚 Related Docs

- **WALMART_STRATEGY.md** - Walmart-specific proxy strategy
- **TUNING_GUIDE.md** - Optimize proxy performance
- **HOW_TO_RUN.md** - Daily usage guide

---

## 🎉 Benefits Summary

### BYOP Model Wins:

✅ **Scalable:** Add unlimited users without cost increase
✅ **Fair:** Each user controls their own quality
✅ **Isolated:** Profile proxies never mix
✅ **Flexible:** Users choose their own providers
✅ **Profitable:** High margins for bot operators
✅ **Low Risk:** No shared proxy pool abuse

---

**You're now running BYOP! Each user brings their own proxies, and you focus on delivering a great bot. 🚀**
