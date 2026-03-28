# Auto-Checkout (ACO) Bot - Requirements Document

**Date:** February 25, 2026
**Version:** 1.0
**Status:** Requirements Gathering Phase

---

## Executive Summary

### Business Objective
Build an automated checkout bot for acquiring limited-edition products (sneakers, collectibles, trading cards) to:
1. **Primary Goal:** Auto-checkout high-demand items for personal resale profit
2. **Secondary Goal:** Scale to offer ACO services to Discord community members

### Market Context
- **Existing Solutions:** Stellar AIO ($99-1499), rental services ($39/day, $350-760/month)
- **Purchase Cost:** Established bots sell for $5,000+
- **Opportunity:** Build custom solution to avoid recurring rental costs and enable service resale

---

## 1. Core Features & Capabilities

### 1.1 Site Support (MVP Phase)
**Priority Tier 1 - Easy Security:**
- [ ] Shopify-based stores (Supreme, Kith, Undefeated, etc.)
  - Rationale: "Shopify is known for having easy security" - Discord conversation

**Priority Tier 2 - Major Retailers:**
- [ ] Target
- [ ] Walmart
- [ ] Best Buy
- [ ] Pokémon Center (key product category mentioned)
- [ ] Amazon (stretch goal - complex security)

**Target:** Start with 5-10 sites, expand to 70+ sites like Stellar AIO

### 1.2 Product Categories
- Sneakers (Air Jordans, Yeezys, limited releases)
- Trading Cards (Pokémon, One Piece, sports cards)
- Collectibles (Funko Pops, limited edition merchandise)
- Electronics (GPU drops, console releases)

### 1.3 Automation Features

#### Task Management
- [ ] **Multi-task execution:** Run 10-100+ checkout tasks simultaneously
- [ ] **Task templates:** Save configurations for repeated use
- [ ] **Quick task creation:** "Setup in just a few clicks" (Stellar AIO benchmark)
- [ ] **Task scheduling:** Schedule tasks for known drop times
- [ ] **Task monitoring:** Real-time status updates for each task

#### Checkout Automation
- [ ] **Auto-fill forms:** Payment info, shipping addresses, contact details
- [ ] **Size/variant selection:** Auto-select available sizes/colors
- [ ] **Cart optimization:** Add to cart and checkout in milliseconds
- [ ] **Retry logic:** Intelligent retry on failures (avoid detection)
- [ ] **Captcha solving:** Integration with captcha solving services (2Captcha, Anti-Captcha)

#### Profile Management
- [ ] **Payment profiles:** Store multiple credit card details securely
- [ ] **Shipping profiles:** Multiple addresses for different tasks
- [ ] **Account profiles:** Store site login credentials
- [ ] **Profile encryption:** Secure storage of sensitive data

### 1.4 Monitoring & Analytics
- [ ] **Live monitor feeds:** Real-time product availability tracking
- [ ] **Restock alerts:** Notify when products come back in stock
- [ ] **Success rate tracking:** Analytics per site, product, proxy
- [ ] **Performance dashboard:** Success/fail rates, checkout speeds
- [ ] **Drop calendar:** Track upcoming releases

---

## 2. Infrastructure Requirements

### 2.1 Proxy Management (Critical Component)
**Key Insight:** "sometimes you have to invest more in good proxies, cheap proxies can fail and can fuck up ur whole drop" - Discord

- [ ] **Proxy integration:** Support for residential, datacenter, and ISP proxies
- [ ] **Proxy rotation:** Intelligent rotation to avoid IP bans
- [ ] **Proxy testing:** Built-in speed/health checks
- [ ] **Proxy grouping:** Assign proxy pools to specific sites
- [ ] **Provider support:** ISPCloudflare, Bright Data, Oxylabs, Smartproxy

**Recommended Architecture:**
- 1 proxy per task minimum
- Residential proxies for high-security sites (Amazon, Nike)
- Datacenter proxies for easier sites (Shopify stores)

### 2.2 Performance Requirements
- [ ] **Checkout speed:** Sub-2-second checkout from product page to order confirmation
- [ ] **Concurrent tasks:** Support 100+ simultaneous tasks
- [ ] **Low latency:** Minimize delay between availability and purchase
- [ ] **Resource efficiency:** Optimize CPU/memory usage for scaling

### 2.3 Hosting & Deployment
- [ ] **Desktop application:** Windows + macOS support (Electron or native)
- [ ] **Cloud hosting option:** AWS/GCP for 24/7 operation
- [ ] **Auto-updates:** Seamless updates for site changes

---

## 3. Security & Anti-Detection (Highest Priority)

**Key Challenge:** "knowing how to make a good bot that can pass securities, thats why people pay thousands for keys" - Discord

### 3.1 Anti-Bot Bypass Techniques
- [ ] **Browser fingerprinting:** Mimic real browser behavior
  - User-Agent rotation
  - Canvas/WebGL fingerprinting randomization
  - Font fingerprinting variation

- [ ] **Request timing:** Human-like delays between actions
  - Random mouse movements
  - Variable keystroke timing
  - Realistic page scroll simulation

- [ ] **Session management:** Maintain cookies, headers, session tokens
- [ ] **TLS fingerprinting:** Match legitimate browser TLS handshakes
- [ ] **Headless detection bypass:** Avoid headless browser detection

### 3.2 Security Platforms to Bypass
- [ ] **Shopify Bot Protection**
- [ ] **PerimeterX (PX)**
- [ ] **DataDome**
- [ ] **Akamai Bot Manager**
- [ ] **Queue-it** (virtual waiting rooms)
- [ ] **Google reCAPTCHA v2/v3**
- [ ] **hCaptcha**
- [ ] **Cloudflare Challenge Pages**

### 3.3 Account Management
- [ ] **Account generation:** Create/import site accounts in bulk
- [ ] **Account warmup:** Simulate browsing history before checkout
- [ ] **Account rotation:** Use different accounts per task
- [ ] **IMAP integration:** Auto-verify email confirmations

---

## 4. User Experience & Interface

### 4.1 Desktop UI (Benchmark: Stellar AIO 3.0)
- [ ] **Dark mode:** Default dark theme for long sessions
- [ ] **Dashboard view:** Overview of active tasks, success rates
- [ ] **Quick actions:** Keyboard shortcuts for common operations
- [ ] **Command palette:** "Shortcuts + Command Search" (Stellar feature)
- [ ] **Drag-and-drop:** Easy task/profile management
- [ ] **Multi-language support:** English initially, expand to 25+ languages

### 4.2 Workflow (3-Step Process)
1. **Create:** Select products, configure tasks
2. **Automate:** Start bot, monitor real-time progress
3. **Dominate:** Receive order confirmations, export results

### 4.3 Discord Integration (Key Requirement)
- [ ] **Discord bot commands:** Start/stop tasks via Discord
- [ ] **Success webhooks:** Send success notifications to Discord channel
- [ ] **Drop alerts:** Post restock/release notifications
- [ ] **Server dashboard:** Stats visible to community members

---

## 5. Business Model & Monetization

### 5.1 Phase 1: Personal Use (Months 1-3)
**Goal:** Prove bot reliability, generate resale profit

- Use bot to checkout 10-50 items per drop
- Target products with $50+ profit margins
- Test across multiple sites (Shopify, Target, etc.)
- Validate proxy infrastructure

**Success Metrics:**
- 60%+ checkout success rate
- ROI on development + proxy costs within 3 months

### 5.2 Phase 2: Service Offering (Months 4-6)
**Goal:** Scale to offer ACO services to Discord community

**Pricing Models to Consider:**
- **Per-cop pricing:** $5-20 per successful checkout (recommended by Discord: "small per cop")
- **Monthly subscription:** $100-300/month for unlimited access
- **Daily rental:** $30-50/day (undercut $39 Stellar rental)
- **Task slots:** Tiered pricing by number of concurrent tasks

**Revenue Projections:**
- 10 users × $150/month = $1,500/month
- 50 users × $150/month = $7,500/month
- Alternative: 100 successful cops/month × $10/cop = $1,000/month

### 5.3 Competitive Positioning
**vs. Stellar AIO:**
- Lower cost ($100-300 vs. $99-1499)
- Community-focused (Discord-native)
- Specialized for group's preferred products

**vs. Rental Services:**
- No per-day fees after initial development
- Customizable for specific needs
- Ownership vs. rental dependency

---

## 6. Technical Architecture

### 6.1 Technology Stack (Recommendations)

**Desktop Application:**
- **Option A:** Electron (React/TypeScript)
  - Pros: Cross-platform, web tech familiarity, fast development
  - Cons: Higher memory usage

- **Option B:** Tauri (Rust + React)
  - Pros: Lower memory, faster, more secure
  - Cons: Steeper learning curve

**Backend/Automation Engine:**
- **Playwright/Puppeteer:** Browser automation
- **Requests/httpx:** Fast HTTP requests (Python)
- **Node.js + Axios:** Asynchronous request handling
- **Selenium (avoid):** Easier to detect, slower

**Proxy Management:**
- **Proxy-chain library**
- **Custom proxy validator service**

**Database:**
- **SQLite:** Local storage (profiles, tasks, history)
- **PostgreSQL:** If scaling to cloud/multi-user

**Discord Integration:**
- **discord.js** or **discord.py** for bot
- **Webhooks** for notifications

### 6.2 System Architecture

```
┌─────────────────────────────────────────┐
│         Desktop UI (Electron)           │
│  ┌─────────────────────────────────┐   │
│  │  Dashboard │ Tasks │ Profiles   │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Automation Engine (Node.js)       │
│  ┌───────────────────────────────────┐  │
│  │ Task Manager │ Monitor │ Retry    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Site Modules (Shopify, Target)  │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Infrastructure Layer             │
│  ┌────────────┐  ┌──────────────────┐  │
│  │Proxy Pool  │  │ Captcha Solver   │  │
│  └────────────┘  └──────────────────┘  │
│  ┌────────────┐  ┌──────────────────┐  │
│  │ Headless   │  │  Anti-Detection  │  │
│  │ Browsers   │  │     Engine       │  │
│  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      External Integrations              │
│   Discord Bot │ Proxy APIs │ Sites      │
└─────────────────────────────────────────┘
```

### 6.3 Data Models

**Task:**
```typescript
{
  id: string
  site: string // 'shopify', 'target', etc.
  product_url: string
  product_name: string
  size: string
  quantity: number
  profile_id: string // payment/shipping
  proxy_id: string
  status: 'idle' | 'running' | 'success' | 'failed'
  retry_count: number
  created_at: timestamp
  completed_at: timestamp
}
```

**Profile:**
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  shipping_address: {
    line1: string
    line2: string
    city: string
    state: string
    zip: string
    country: string
  }
  payment: {
    card_number: string // encrypted
    cvv: string // encrypted
    exp_month: string
    exp_year: string
    billing_address: {...}
  }
}
```

**Proxy:**
```typescript
{
  id: string
  host: string
  port: number
  username: string
  password: string
  type: 'residential' | 'datacenter' | 'isp'
  speed_ms: number
  success_rate: number
  last_tested: timestamp
}
```

---

## 7. Development Phases & Roadmap

### Phase 1: MVP (6-8 weeks)
**Goal:** Working bot for Shopify stores only

- [ ] Week 1-2: Architecture setup, UI scaffolding
- [ ] Week 3-4: Shopify checkout automation
- [ ] Week 5: Proxy integration, anti-detection basics
- [ ] Week 6: Profile management, task system
- [ ] Week 7: Testing, bug fixes
- [ ] Week 8: Discord integration, deployment

**Deliverables:**
- Desktop app (Windows + macOS)
- Shopify auto-checkout
- Basic proxy support
- Discord notifications
- 5 test drops with 40%+ success rate

### Phase 2: Multi-Site Support (4-6 weeks)
- [ ] Target integration
- [ ] Walmart integration
- [ ] Best Buy integration
- [ ] Pokémon Center integration
- [ ] Enhanced anti-bot bypass

### Phase 3: Service Platform (4-6 weeks)
- [ ] Multi-user support
- [ ] License key system
- [ ] Payment processing (Stripe)
- [ ] Customer dashboard
- [ ] Admin panel for managing users

### Phase 4: Advanced Features (Ongoing)
- [ ] Auto-restocking monitors
- [ ] Machine learning for optimal timing
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

---

## 8. Risks & Challenges

### 8.1 Technical Risks

**1. Security Bypassing (HIGH RISK)**
- **Challenge:** "knowing how to make a good bot that can pass securities" - Discord
- **Mitigation:**
  - Start with Shopify (easier security)
  - Invest in advanced fingerprinting techniques
  - Monitor anti-bot detection forums/Discord groups
  - Budget for captcha solving services ($50-200/month)

**2. Site Changes Breaking Bot (MEDIUM RISK)**
- **Challenge:** Websites update checkout flows, change DOM structures
- **Mitigation:**
  - Modular site modules (easy to update)
  - Auto-update system for quick patches
  - Monitor site changes via changelog tracking

**3. Proxy Costs (MEDIUM RISK)**
- **Challenge:** "cheap proxies can fail and fuck up ur whole drop"
- **Mitigation:**
  - Budget $200-500/month for quality proxies initially
  - Built-in proxy health monitoring
  - Multiple proxy provider support

**4. Competition (LOW-MEDIUM RISK)**
- **Challenge:** "you are still competing with other people"
- **Mitigation:**
  - Speed optimization (sub-2-second checkout)
  - Better proxies = better success
  - Niche targeting (less competitive products)

### 8.2 Business Risks

**1. Legal/Terms of Service**
- **Risk:** Violates most site ToS, account bans possible
- **Mitigation:**
  - Use multiple accounts
  - Accept account ban risk
  - Focus on personal use initially

**2. Market Saturation**
- **Risk:** Discord community too small, not enough buyers
- **Mitigation:**
  - Validate demand before Phase 3
  - Start with personal use (Phase 1)
  - Partner with other reseller groups

**3. Profitability Timeline**
- **Risk:** "its not worth it for my small scale" - Discord
- **Mitigation:**
  - Set realistic ROI timeline (6-12 months)
  - Focus on high-margin products ($50+ profit)
  - Consider service model earlier if product margins low

### 8.3 Resource Requirements

**Development Time:**
- Solo developer: 16-24 weeks to Phase 3
- Small team (2-3 devs): 10-14 weeks to Phase 3

**Financial Investment:**
- Development: $0 (your time) or $10K-30K (outsourced)
- Proxies: $200-500/month
- Captcha solving: $50-200/month
- Hosting: $20-100/month
- **Total first year:** $3,000-10,000 + development time

**Expected Returns:**
- Personal resale: $500-2,000/month (assuming 10-40 successful cops × $50 profit)
- Service offering: $1,500-7,500/month (10-50 users × $150)
- **Break-even:** 6-12 months

---

## 9. Success Metrics

### Phase 1 KPIs (Personal Use)
- [ ] **Checkout success rate:** 40%+ (Target: 60%+)
- [ ] **Average checkout time:** <5 seconds (Target: <2 seconds)
- [ ] **Uptime:** 95%+ during drops
- [ ] **Site coverage:** 5+ sites working reliably
- [ ] **ROI:** Positive within 3 months

### Phase 2 KPIs (Service Offering)
- [ ] **User growth:** 10 users in Month 1, 50 users by Month 6
- [ ] **User retention:** 70%+ monthly retention
- [ ] **Revenue:** $1,500+/month by Month 6
- [ ] **Customer satisfaction:** 4.5+ star reviews
- [ ] **Support tickets:** <5 hours average response time

### Phase 3 KPIs (Scaling)
- [ ] **Total checkouts:** 1,000+ successful cops/month
- [ ] **Revenue:** $10,000+/month
- [ ] **User base:** 100+ active users
- [ ] **Site coverage:** 20+ sites

---

## 10. Open Questions & Next Steps

### Questions to Answer:
1. **Discord community size:** How many potential users in your server?
2. **Capital available:** Budget for proxies, captcha solving, hosting?
3. **Development resources:** Solo build or team? Timeline expectations?
4. **Target products:** Which drops to focus on first? (Sneakers, cards, etc.)
5. **Risk tolerance:** Comfortable with account bans, legal grey area?

### Recommended Next Steps:
1. **Validate demand:** Poll Discord community on interest, price sensitivity
2. **Test rental bot:** Rent Stellar AIO for $39/day to understand user experience
3. **Proxy research:** Test 3-5 proxy providers, compare success rates
4. **Competitor analysis:** Join other reseller Discords, see what they use
5. **MVP decision:** Confirm Phase 1 scope, set timeline

### Decision Points:
- [ ] **Build vs. Buy:** Still confident in building vs. renting/purchasing?
- [ ] **Timeline:** Acceptable to wait 2-3 months for MVP?
- [ ] **Profitability:** Comfortable with 6-12 month ROI timeline?
- [ ] **Scaling:** Personal use first, or go straight to service model?

---

## 11. References & Resources

### Competitor Analysis:
- **Stellar AIO:** $99-1,499, 70+ sites, 1M+ checkouts
- **Refract Bot:** $350/month
- **Rental services:** $39/day, $760/month
- **Purchase price:** $5,000+ for established bots

### Technical Resources:
- Anti-bot bypass: BotBroker forums, ReduceCaptcha guides
- Proxy providers: ISPCloudflare, Bright Data, Oxylabs
- Captcha solving: 2Captcha, Anti-Captcha
- Discord bots: discord.js, discord.py

### Community:
- Reddit: r/shoebots, r/botting
- Discord: Botting servers, cook groups
- Twitter: Sneaker monitors, restock accounts

---

**Document Status:** Ready for review and refinement based on answers to Open Questions.

**Next Action:** Schedule call to discuss open questions, validate assumptions, and confirm Phase 1 scope.