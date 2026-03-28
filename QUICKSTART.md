# ACO Bot - Quick Start Guide

Get your bot running in 10 minutes! ⚡

---

## Step 1: Install Dependencies (5 min)

```bash
cd /home/quint/aco-bot
npm install
npx playwright install chromium
```

---

## Step 2: Configure Environment (2 min)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   SMARTPROXY_USER=your_username
   SMARTPROXY_PASSWORD=your_password
   TWOCAPTCHA_API_KEY=your_api_key
   DISCORD_WEBHOOK_URL=your_webhook_url
   ENCRYPTION_KEY=random-32-char-string-here
   ```

---

## Step 3: Build and Start (3 min)

```bash
npm run build
npm start
```

The desktop app will launch!

---

## Step 4: Create Your First Task

1. Click **"+ Create Task"**
2. Fill in:
   - Product URL: `https://kith.com/products/example`
   - Product Name: `Test Product`
   - Size: `US 10`
3. Click **"Create Task"**
4. Click **"Start"** to run the task

---

## What to Expect

- **First run**: May fail (no profiles/proxies set up)
- **With proxies**: 30-50% success rate initially
- **After tuning**: 60%+ success rate

---

## Troubleshooting

### Tasks fail immediately?
- Check proxy credentials in `.env`
- Verify 2Captcha API key
- Ensure Smartproxy has balance

### "Profile not found" error?
- Default profile will be created automatically (coming soon)
- For now, bot uses hardcoded test profile

### Captcha timeout?
- Check 2Captcha balance: https://2captcha.com
- Add funds if low ($10 minimum)

---

## Next Steps

1. **Add real proxy credentials** (Smartproxy)
2. **Test on cheap products** first ($10-20 items)
3. **Measure success rate** (aim for 50%+)
4. **Fine-tune delays** in code if needed
5. **Scale up** once working reliably

---

## Important Notes

⚠️ **DO NOT:**
- Test on expensive items without validation
- Use real credit cards without Privacy.com virtual cards
- Run on production accounts (expect bans)
- Leave bot unattended on first runs

✅ **DO:**
- Start with test accounts
- Use cheap products for testing
- Monitor console logs
- Track success rates
- Iterate and improve

---

## Support

- Check `README.md` for full documentation
- Review console logs (`View > Toggle Developer Tools`)
- Test proxies manually: `curl -x http://user:pass@host:port https://api.ipify.org`

---

**Ready? Let's checkout! 🚀**
