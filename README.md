# ACO Bot

Auto-checkout bot for Shopify and Walmart. Desktop app for Windows.

---

## Download & Install

1. Go to [Releases](https://github.com/ogdoo22/aco-bot/releases)
2. Download **ACO Bot Setup x.x.x.exe**
3. Run the installer — choose your install location
4. Launch **ACO Bot** from your Start Menu or Desktop

**Requirements:**
- Windows 10 or 11
- Microsoft Edge or Google Chrome installed (the bot uses your system browser)

---

## First-Time Setup

When you first open the app, go to **Settings** and configure:

### 1. 2Captcha API Key (Required)
- Sign up at [2captcha.com](https://2captcha.com/)
- Copy your API key
- Paste it in Settings > 2Captcha API Key
- Click Save

### 2. Discord Webhook (Optional)
- In your Discord server, go to Channel Settings > Integrations > Webhooks
- Create a webhook and copy the URL
- Paste it in Settings > Discord Webhook URL
- Click Save
- The bot will send a message to your channel on every successful checkout

---

## How to Use

### Step 1: Create a Profile

Go to **Profiles** and click **+ New Profile**. Fill in:

- **Name** — label for this profile (e.g. "Main Account")
- **Email** — your account email for the store
- **Phone** — phone number for checkout
- **Shipping address** — where the order ships
- **Payment info** — card details (encrypted and stored locally)

### Step 2: Add Proxies to Your Profile

Each profile needs its own proxies. Click on your profile, then **+ Import Proxies**.

**Paste your proxies** in one of these formats (one per line):
```
user:pass@host:port
host:port:user:pass
```

**Select the proxy type:**
- **ISP** — best for Walmart (required)
- **Residential** — best for Shopify

Click **Import**, then **Test** each proxy to verify it works.

### Step 3: Create a Task

Go to **Dashboard** and fill in:

- **Product URL** — full URL of the product page
- **Product Name** — name for your reference
- **Size** — desired size
- **Quantity** — how many to attempt
- **Profile** — select the profile to use (with its proxies)
- **Site** — Shopify or Walmart

Click **Create Task**.

### Step 4: Run It

Click **Start** on your task. The bot will:
1. Open a browser using your profile's proxy
2. Navigate to the product
3. Add to cart
4. Fill in checkout details from your profile
5. Solve any captchas automatically
6. Complete the purchase
7. Send a Discord notification on success

---

## Proxy Guide

You need to bring your own proxies (BYOP). Each profile has its own proxy pool.

### Where to Get Proxies

| Provider | Type | Best For | Pricing |
|----------|------|----------|---------|
| SmartProxy | Rotating Residential | Shopify | ~$12-14/GB |
| SmartProxy | Static ISP | Walmart | ~$2-3/IP/month |
| Bright Data | Residential + ISP | Both | ~$15-20/GB |
| IPRoyal | Residential | Shopify (budget) | ~$7-8/GB |

### Tips
- **Shopify drops**: Residential proxies work well
- **Walmart drops**: ISP proxies required, residential will get blocked
- **Geographic diversity matters**: Get proxies from different cities, ideally matching your shipping addresses. Avoid proxies all from the same datacenter location.
- **Test before a drop**: Always test your proxies ahead of time

---

## Walmart Strategy

- Walmart restocks typically happen **Wednesdays around 9 AM EST**
- Use **ISP proxies only** (residential gets blocked)
- Use **aged Walmart accounts** (3+ months old) for better success
- Expect 40-60% cancellation rate — run multiple profiles

---

## Troubleshooting

### App won't start
- Make sure you have Edge or Chrome installed
- Try reinstalling the app

### Proxy test fails
- Double-check your proxy credentials
- Make sure the proxy format is correct: `user:pass@host:port`
- For Walmart, you must use ISP proxies

### Tasks failing at checkout
- Check that your profile has complete shipping and payment info
- Verify your 2Captcha account has balance
- Check your proxies are working (test them first)
- Review the error message on the failed task

### No Discord notifications
- Verify your webhook URL is correct in Settings
- Click the test button in Settings to confirm it works

---

## Data & Privacy

- All data is stored **locally on your machine** (SQLite database)
- Payment info is **encrypted** with a unique key generated per install
- No data is sent to any server — the bot only connects to the stores you target, your proxy provider, and 2Captcha
- Your database is stored at: `%APPDATA%/aco-bot/`

---

## Legal Disclaimer

This software is provided for educational and research purposes. Using automated checkout bots may violate website Terms of Service. You are solely responsible for how you use this software. Use at your own risk.

---

## Support

Having issues? [Open an issue](https://github.com/ogdoo22/aco-bot/issues) on GitHub.
