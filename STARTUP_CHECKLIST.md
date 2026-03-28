# ACO Bot - Startup Checklist

**Use this checklist every time you start working with the bot**

---

## ✅ One-Time Setup (Already Done!)

- [x] Dependencies installed (`npm install`)
- [x] Playwright browser installed (`npx playwright install chromium`)
- [x] `.env` file created with template
- [x] Project structure set up
- [x] Documentation created

---

## 📋 Before First Run (Do Once)

### [ ] 1. Get Smartproxy Credentials

**Sign up:** https://smartproxy.com

**Get credentials:**
- Username: (from dashboard)
- Password: (from dashboard)
- Endpoint: `gate.smartproxy.com:7000` (residential)

**Budget:** $50-200/month minimum

---

### [ ] 2. Get 2Captcha API Key

**Sign up:** https://2captcha.com

**Get API key:**
- Dashboard → API Key
- Add funds: $10 minimum

**Budget:** $50-100/month

---

### [ ] 3. Configure .env File

```bash
cd /home/quint/aco-bot
nano .env
```

**Edit these lines:**
```env
SMARTPROXY_USER=your_actual_username
SMARTPROXY_PASSWORD=your_actual_password
TWOCAPTCHA_API_KEY=your_actual_api_key
ENCRYPTION_KEY=run_command_below_to_generate
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy output and paste into `ENCRYPTION_KEY`

**Save file:** `Ctrl+X`, then `Y`, then `Enter`

---

### [ ] 4. Test Proxy Connection

```bash
# Replace with YOUR credentials
curl -x http://USERNAME:PASSWORD@gate.smartproxy.com:7000 https://api.ipify.org
```

**Expected:** Should print an IP address (your proxy IP)

**If fails:** Check credentials in `.env`

---

### [ ] 5. Verify 2Captcha Balance

```bash
# Replace with YOUR API key
curl "https://2captcha.com/res.php?key=YOUR_API_KEY&action=getbalance"
```

**Expected:** Should print a number (your balance, e.g., "10.50")

**If fails:** Check API key in `.env`

---

### [ ] 6. Build the Application

```bash
cd /home/quint/aco-bot
npm run build
```

**Expected:** Compiles for 1-2 minutes, ends with "Build complete"

**If fails:** Check error messages, run `npm install` again

---

## 🚀 Every Time You Want to Run the Bot

### Quick Start (After Initial Setup):

```bash
cd /home/quint/aco-bot
npm start
```

**That's it!** Desktop app launches.

---

## 📝 Daily Checklist

### Before Running Tasks:

- [ ] **Check balances:**
  - Smartproxy has funds
  - 2Captcha has $5+ balance

- [ ] **Plan your drop:**
  - Know what product you're targeting
  - Have product URL ready
  - Know size/variant needed

- [ ] **Start the app:**
  ```bash
  cd /home/quint/aco-bot
  npm start
  ```

---

### During a Drop:

- [ ] **Create tasks:**
  - Product URL
  - Product name
  - Size
  - Create 5-10 tasks for testing

- [ ] **Start tasks:**
  - Click "Start All" or individual "Start" buttons
  - Watch real-time status updates

- [ ] **Monitor logs:**
  - Press F12 to open console
  - Watch for errors
  - Note success rate

---

### After a Drop:

- [ ] **Record results:**
  - Success: __ / __
  - Success rate: __%
  - Failures: (out of stock / bot detection / proxy / other)

- [ ] **If success rate <60%:**
  ```bash
  # Copy logs
  tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)
  ```

  - Share with Claude
  - Apply recommended fixes
  - Test again

- [ ] **If success rate ≥60%:**
  - You're optimized! ✅
  - Focus on scaling (more tasks, more proxies)

---

## 🔧 If Something Goes Wrong

### App Won't Start

```bash
# Rebuild
cd /home/quint/aco-bot
npm run build
npm start
```

---

### "Module not found" Error

```bash
# Reinstall dependencies
cd /home/quint/aco-bot
rm -rf node_modules package-lock.json
npm install
npm run build
npm start
```

---

### All Tasks Failing

1. **Check .env file:**
   ```bash
   cat /home/quint/aco-bot/.env
   ```
   - Verify credentials are filled in (not "your_xxx_here")

2. **Test proxy manually:**
   ```bash
   curl -x http://USER:PASS@gate.smartproxy.com:7000 https://api.ipify.org
   ```

3. **Check 2Captcha balance:**
   ```bash
   curl "https://2captcha.com/res.php?key=YOUR_KEY&action=getbalance"
   ```

4. **Check console logs:**
   - Press F12 in app
   - Look for error messages
   - Share with Claude if unclear

---

### Database Locked Error

```bash
# Close app completely, then:
rm ~/.config/aco-bot/aco-bot.db
cd /home/quint/aco-bot
npm start
```

---

## 📚 Documentation Quick Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `HOW_TO_RUN.md` | How to start the app | Every session |
| `STARTUP_CHECKLIST.md` | This file - step-by-step | Every session |
| `README.md` | Full documentation | First time, when confused |
| `QUICKSTART.md` | 10-minute setup guide | First time only |
| `TUNING_GUIDE.md` | How to optimize performance | When success <60% |
| `WORKING_WITH_CLAUDE.md` | How to work with Claude | When needing help |
| `LOG_ANALYSIS_GUIDE.md` | How to read logs | When debugging |

---

## 🎯 Success Criteria

### You're Ready to Go When:

- [x] `.env` file has real credentials (not "your_xxx_here")
- [x] Proxy test command returns an IP
- [x] 2Captcha balance command returns a number
- [x] `npm start` launches the desktop app
- [x] You can create a task in the UI
- [x] You understand how to share logs with Claude

---

## 💡 Pro Tips

### Save Time:

Create an alias in your shell:
```bash
# Add to ~/.bashrc or ~/.zshrc:
alias aco='cd /home/quint/aco-bot && npm start'

# Then just run:
aco
```

---

### Quick Log Check:
```bash
# Add alias:
alias acolog='tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)'

# Then:
acolog
```

---

### Quick Status Check:
```bash
# Before running, verify:
cd /home/quint/aco-bot
echo "Proxy test:"
curl -x http://USER:PASS@gate.smartproxy.com:7000 https://api.ipify.org
echo -e "\n2Captcha balance:"
curl "https://2captcha.com/res.php?key=YOUR_KEY&action=getbalance"
echo -e "\nReady to go!"
```

---

## 🆘 Getting Help from Claude

### When to Reach Out:

- ✅ Success rate <60% (share logs)
- ✅ Don't know how to fix an issue
- ✅ Want to add a feature
- ✅ Code isn't working as expected
- ✅ Need guidance on next steps

### How to Ask:

```markdown
Hey Claude,

**Issue:** [Describe what's happening]

**Configuration:**
- Proxies: Smartproxy residential, 20 IPs
- 2Captcha balance: $X
- Site: [Shopify store URL]

**What I tried:**
- [List what you attempted]

**Logs:**
[Paste last 50 lines]

**Question:**
[What you want to know]
```

---

## ✅ Final Checklist

**Before closing this Claude session:**

- [ ] I have `.env` file configured (or know I need to do this first)
- [ ] I know how to start the app (`npm start`)
- [ ] I know how to get logs (command saved)
- [ ] I know how to reach Claude for help (share logs + context)
- [ ] I have bookmarked this folder: `/home/quint/aco-bot/`

**You're all set!** 🎉

---

## 📞 Quick Commands Summary

```bash
# Start the bot
cd /home/quint/aco-bot && npm start

# Get latest logs
tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# Test proxy
curl -x http://USER:PASS@gate.smartproxy.com:7000 https://api.ipify.org

# Check 2Captcha balance
curl "https://2captcha.com/res.php?key=YOUR_KEY&action=getbalance"

# Rebuild after changes
cd /home/quint/aco-bot && npm run build && npm start
```

---

**Save this file!** Open it every time you want to run the bot. 📌
