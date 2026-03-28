# How to Run ACO Bot - Quick Reference

**Use this guide every time you want to start the bot**

---

## 🚀 Quick Start (After Initial Setup)

```bash
cd /home/quint/aco-bot
npm start
```

That's it! The desktop app will launch. ✨

---

## 📋 First-Time Setup (Do Once)

### 1. Install Dependencies (✅ Already Done!)

```bash
cd /home/quint/aco-bot
npm install
npx playwright install chromium
```

### 2. Configure Credentials

Edit `.env` file with your credentials:

```bash
nano .env
# or
code .env
# or
vi .env
```

**Required changes:**
- `SMARTPROXY_USER` → Your Smartproxy username
- `SMARTPROXY_PASSWORD` → Your Smartproxy password
- `TWOCAPTCHA_API_KEY` → Your 2Captcha API key
- `ENCRYPTION_KEY` → Random 32-char string

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy output and paste into `ENCRYPTION_KEY` in `.env`

### 3. Build the App

```bash
npm run build
```

Wait 1-2 minutes for compilation to complete.

### 4. Start the App

```bash
npm start
```

Desktop app will launch! 🎉

---

## 📝 Common Commands

### Start the Bot
```bash
cd /home/quint/aco-bot
npm start
```

### Rebuild After Code Changes
```bash
npm run build
npm start
```

### View Logs
```bash
# Latest log file
tail -f ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# Last 50 lines of latest log
tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# List all log files
ls -lt ~/.config/aco-bot/logs/
```

### Test Proxies Manually
```bash
# Replace with your actual credentials
curl -x http://USERNAME:PASSWORD@gate.smartproxy.com:7000 https://api.ipify.org
```

Should return your proxy IP if working correctly.

### Check 2Captcha Balance
```bash
curl "https://2captcha.com/res.php?key=YOUR_API_KEY&action=getbalance"
```

---

## 🔧 Troubleshooting

### "Cannot find module" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Playwright browser not found"
```bash
npx playwright install chromium
```

### "Database locked" error
```bash
# Close all instances of the app, then:
rm ~/.config/aco-bot/aco-bot.db
npm start
```

### App won't start
```bash
# Check Node.js version (need 18+)
node --version

# Rebuild
npm run build

# Check for errors in build output
```

### Tasks failing immediately
1. Check `.env` has correct credentials
2. Test proxy connection (see above)
3. Verify 2Captcha balance
4. Check console logs (F12 in app)

---

## 📂 Project Structure

```
/home/quint/aco-bot/
├── src/              # Source code
├── dist/             # Compiled code (generated)
├── node_modules/     # Dependencies (generated)
├── .env              # Your credentials (EDIT THIS)
├── package.json      # Dependencies list
├── README.md         # Full documentation
├── HOW_TO_RUN.md     # This file
└── logs/             # Will be created at ~/.config/aco-bot/logs/
```

---

## 🎯 Daily Usage Workflow

### 1. Start the App
```bash
cd /home/quint/aco-bot
npm start
```

### 2. Create Tasks
- Click "Create Task" button
- Fill in product URL, name, size
- Click "Create Task"
- Repeat for multiple tasks (5-10 recommended)

### 3. Run Tasks
- Click "Start All" to run all tasks
- OR click "Start" on individual tasks
- Watch the dashboard for real-time updates

### 4. View Results
- ✅ Green = Success (order placed!)
- ❌ Red = Failed (check error message)
- Check Discord for success notifications

### 5. Share Logs with Claude (For Tuning)
```bash
# Copy last 50 lines
tail -50 ~/.config/aco-bot/logs/$(ls -t ~/.config/aco-bot/logs/ | head -1)

# Paste in message to Claude:
"Hey Claude, here are my results:
Success rate: X/Y
[paste logs]
What should I tune?"
```

---

## 💡 Tips

### Get Help from Claude
When you need help optimizing:
1. Run 5-10 test tasks
2. Copy latest logs (command above)
3. Share with Claude with context (success rate, site, issue)
4. Claude will analyze and provide specific fixes
5. Apply fixes, test again, repeat

### Monitor Performance
- Track success rate per session
- Aim for 60%+ success
- Most failures should be "out of stock" (not bot issues)
- If seeing lots of "bot detection" → increase delays

### Save Money
- Start with 10-20 proxies, scale up
- Use datacenter proxies for easy sites (cheaper)
- Use residential proxies for hard sites (more expensive)
- Only run tasks on profitable drops

---

## 🆘 Getting Support

### Documentation Files:
- `README.md` - Full documentation
- `QUICKSTART.md` - 10-minute setup
- `TUNING_GUIDE.md` - Performance optimization
- `LOG_ANALYSIS_GUIDE.md` - How to read logs
- `WORKING_WITH_CLAUDE.md` - How to work with Claude

### Need Help?
Share your situation with Claude:
```
"Hey Claude, [describe issue]

Configuration:
- Proxies: Smartproxy residential, 20 IPs
- 2Captcha balance: $X
- Site: [Shopify store]

Logs:
[paste last 50 lines]

What should I do?"
```

---

## ✅ Checklist for Each Session

**Before starting:**
- [ ] `.env` file has valid credentials
- [ ] Smartproxy account has balance
- [ ] 2Captcha account has balance ($5+ minimum)
- [ ] Know what product you're targeting

**When running:**
- [ ] App is built (`npm run build` if code changed)
- [ ] Create 5-10 tasks for testing
- [ ] Monitor console logs (F12) for errors
- [ ] Note success rate

**After session:**
- [ ] Copy logs if success rate <60%
- [ ] Share with Claude for tuning
- [ ] Apply any recommended fixes
- [ ] Test again next session

---

## 🎉 You're Ready!

To start the bot right now:

```bash
cd /home/quint/aco-bot
npm start
```

Or if you changed code:

```bash
cd /home/quint/aco-bot
npm run build
npm start
```

**The desktop app will launch and you can start creating tasks!**

---

## 📝 Quick Reference Card

```
┌─────────────────────────────────────────┐
│        ACO BOT QUICK REFERENCE          │
├─────────────────────────────────────────┤
│                                         │
│  Start:      npm start                  │
│  Build:      npm run build              │
│  Logs:       tail -50 ~/.config/...    │
│  Test Proxy: curl -x http://...        │
│                                         │
│  Edit .env to configure credentials     │
│  Share logs with Claude for tuning      │
│  Aim for 60%+ success rate              │
│                                         │
└─────────────────────────────────────────┘
```

Save this file for future reference! 📌
