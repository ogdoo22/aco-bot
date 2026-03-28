import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { Task, Profile, Proxy } from '../../shared/types';
import { applyStealthPatches } from '../stealth/StealthPatches';
import { humanDelay, randomDelay } from '../utils/delays';
import { CaptchaService } from '../../services/captcha/CaptchaService';
import { getLogger } from '../../shared/Logger';

/**
 * Walmart checkout automation
 *
 * Key differences from Shopify:
 * - Queue system (waiting room)
 * - Requires aged accounts
 * - ISP proxies for fast queue entry
 * - Higher cancellation rate (need multiple orders)
 * - Akamai bot protection
 */
export class WalmartAutomation {
  private proxy: Proxy | null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private captchaService: CaptchaService;
  private logger = getLogger();
  private taskId: string = '';
  private startTime: number = 0;

  constructor(proxy: Proxy | null, captchaApiKey: string = '') {
    this.proxy = proxy;
    this.captchaService = new CaptchaService(captchaApiKey || process.env.TWOCAPTCHA_API_KEY || '');
  }

  /**
   * Main checkout flow for Walmart
   */
  async checkout(task: Task, profile: Profile, signal: AbortSignal): Promise<string> {
    this.taskId = task.id;
    this.startTime = Date.now();

    this.logger.info('checkout', 'Starting Walmart checkout', task.id, {
      productUrl: task.productUrl,
      productName: task.productName,
      proxyId: this.proxy?.id,
      proxyType: this.proxy?.type,
    });

    try {
      // Initialize browser
      const browserStart = Date.now();
      await this.initializeBrowser();
      this.logger.checkoutStep('Browser initialized', task.id, Date.now() - browserStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Navigate to product page
      const pageStart = Date.now();
      const page = await this.createPage();

      // Check for queue system first
      await page.goto(task.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const inQueue = await this.checkForQueue(page);

      if (inQueue) {
        this.logger.warn('checkout', 'Entered queue system', task.id);
        await this.handleQueue(page, signal);
      }

      this.logger.checkoutStep('Product page loaded', task.id, Date.now() - pageStart, {
        url: task.productUrl,
        queueEncountered: inQueue,
      });

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Add to cart
      const cartStart = Date.now();
      await this.addToCart(page, task.quantity);
      await randomDelay(300, 600);
      this.logger.checkoutStep('Added to cart', task.id, Date.now() - cartStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Go to checkout
      const checkoutStart = Date.now();
      await this.goToCheckout(page);
      await page.waitForLoadState('domcontentloaded');
      this.logger.checkoutStep('Checkout page loaded', task.id, Date.now() - checkoutStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Sign in (required for Walmart)
      const signInStart = Date.now();
      await this.signIn(page, profile);
      await page.waitForLoadState('domcontentloaded');
      this.logger.checkoutStep('Signed in', task.id, Date.now() - signInStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Fill shipping info
      const shippingStart = Date.now();
      await this.fillShippingInfo(page, profile);
      await randomDelay(400, 700);
      this.logger.checkoutStep('Shipping info filled', task.id, Date.now() - shippingStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Continue to payment
      await this.continueToPayment(page);
      await page.waitForLoadState('domcontentloaded');

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Check for captcha
      const hasCaptcha = await this.detectCaptcha(page);
      if (hasCaptcha) {
        this.logger.captchaEvent('detected', task.id);
        const captchaStart = Date.now();
        await this.solveCaptcha(page);
        this.logger.captchaEvent('solved', task.id, {
          solveTime: Date.now() - captchaStart,
        });
      }

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Fill payment info
      const paymentStart = Date.now();
      await this.fillPaymentInfo(page, profile);
      await randomDelay(400, 700);
      this.logger.checkoutStep('Payment info filled', task.id, Date.now() - paymentStart);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Place order
      const orderStart = Date.now();
      const orderNumber = await this.placeOrder(page);
      const totalTime = Date.now() - this.startTime;

      this.logger.success('checkout', 'Order complete', task.id, {
        orderNumber,
        totalTime,
        checkoutSpeed: `${(totalTime / 1000).toFixed(2)}s`,
      });

      return orderNumber;
    } catch (error: any) {
      const totalTime = Date.now() - this.startTime;
      this.logger.error('checkout', 'Checkout failed', task.id, {
        error: error.message,
        totalTime,
        stack: error.stack,
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize browser with ISP proxy (required for Walmart)
   */
  private async initializeBrowser(): Promise<void> {
    // Validate proxy type
    if (this.proxy && this.proxy.type === 'datacenter') {
      this.logger.warn('checkout', 'Datacenter proxy detected - ISP recommended for Walmart', this.taskId);
    }

    const launchOptions: any = {
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    };

    // Add proxy
    if (this.proxy) {
      launchOptions.proxy = {
        server: `http://${this.proxy.host}:${this.proxy.port}`,
        username: this.proxy.username,
        password: this.proxy.password,
      };
    }

    // Use system Edge or Chrome instead of bundled Chromium
    launchOptions.channel = 'msedge';
    try {
      this.browser = await chromium.launch(launchOptions);
    } catch {
      // Fall back to Chrome if Edge is not available
      launchOptions.channel = 'chrome';
      this.browser = await chromium.launch(launchOptions);
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });
  }

  /**
   * Create new page with stealth patches
   */
  private async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();

    // Apply stealth patches
    await applyStealthPatches(page);

    return page;
  }

  /**
   * Check if page has queue/waiting room
   */
  private async checkForQueue(page: Page): Promise<boolean> {
    try {
      // Check for common queue indicators
      const queueSelectors = [
        'text="You are in line"',
        'text="Waiting Room"',
        '[data-automation="queue-page"]',
        '.queue-container',
      ];

      for (const selector of queueSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle Walmart queue system
   * ISP proxies help enter faster
   */
  private async handleQueue(page: Page, signal: AbortSignal): Promise<void> {
    this.logger.info('checkout', 'Handling queue system', this.taskId);

    const maxWaitTime = 5 * 60 * 1000; // 5 minutes max
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (signal.aborted) {
        throw new Error('Task aborted while in queue');
      }

      // Check if still in queue
      const stillInQueue = await this.checkForQueue(page);

      if (!stillInQueue) {
        this.logger.success('checkout', 'Exited queue', this.taskId, {
          waitTime: Date.now() - startTime,
        });
        return;
      }

      // Wait and check again
      await randomDelay(2000, 4000);
    }

    throw new Error('Queue timeout - waited 5 minutes');
  }

  /**
   * Add product to cart (Walmart specific)
   */
  private async addToCart(page: Page, quantity: number): Promise<void> {
    // Walmart add to cart button
    const addToCartSelectors = [
      'button[data-automation-id="add-to-cart"]',
      'button:has-text("Add to cart")',
      '.prod-product-cta-add-to-cart button',
    ];

    for (const selector of addToCartSelectors) {
      const button = await page.$(selector);
      if (button) {
        await humanDelay(200, 400);
        await button.click();

        // Wait for add to cart confirmation
        await randomDelay(1000, 2000);
        return;
      }
    }

    throw new Error('Could not find add to cart button');
  }

  /**
   * Navigate to checkout
   */
  private async goToCheckout(page: Page): Promise<void> {
    // Click cart icon or go directly to checkout
    const checkoutUrl = 'https://www.walmart.com/checkout';
    await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  /**
   * Sign in with account (REQUIRED for Walmart)
   */
  private async signIn(page: Page, profile: Profile): Promise<void> {
    this.logger.info('checkout', 'Signing in', this.taskId);

    // Check if already signed in
    const alreadySignedIn = await page.$('text="Sign out"');
    if (alreadySignedIn) {
      this.logger.info('checkout', 'Already signed in', this.taskId);
      return;
    }

    // Find sign in fields
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');

    if (!emailField || !passwordField) {
      throw new Error('Sign in fields not found - account login required');
    }

    // Fill credentials
    await emailField.fill(profile.email);
    await humanDelay(100, 200);
    await passwordField.fill('walmart_account_password'); // TODO: Add to profile
    await humanDelay(100, 200);

    // Click sign in button
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await signInButton.click();
      await randomDelay(2000, 3000);
    }
  }

  /**
   * Fill shipping information
   */
  private async fillShippingInfo(page: Page, profile: Profile): Promise<void> {
    const { shipping } = profile;

    // Walmart uses different field names
    await this.fillFieldSafely(page, 'input[name="firstName"]', shipping.firstName);
    await humanDelay(50, 100);

    await this.fillFieldSafely(page, 'input[name="lastName"]', shipping.lastName);
    await humanDelay(50, 100);

    await this.fillFieldSafely(page, 'input[name="addressLineOne"]', shipping.address1);
    await humanDelay(50, 100);

    if (shipping.address2) {
      await this.fillFieldSafely(page, 'input[name="addressLineTwo"]', shipping.address2);
      await humanDelay(50, 100);
    }

    await this.fillFieldSafely(page, 'input[name="city"]', shipping.city);
    await humanDelay(50, 100);

    // State dropdown
    const stateSelect = await page.$('select[name="state"]');
    if (stateSelect) {
      await stateSelect.selectOption({ label: shipping.state });
    }
    await humanDelay(50, 100);

    await this.fillFieldSafely(page, 'input[name="postalCode"]', shipping.zip);
    await humanDelay(50, 100);

    await this.fillFieldSafely(page, 'input[name="phone"]', profile.phone);
  }

  /**
   * Continue to payment page
   */
  private async continueToPayment(page: Page): Promise<void> {
    const continueButton = await page.$('button:has-text("Continue to payment")');
    if (continueButton) {
      await humanDelay(300, 500);
      await continueButton.click();
    } else {
      throw new Error('Could not find continue button');
    }
  }

  /**
   * Fill payment information
   */
  private async fillPaymentInfo(page: Page, profile: Profile): Promise<void> {
    const { payment } = profile;

    // Wait for payment frame
    await randomDelay(1000, 1500);

    // Walmart payment fields
    await this.fillFieldSafely(page, 'input[name="cardNumber"]', payment.cardNumber);
    await humanDelay(80, 150);

    await this.fillFieldSafely(page, 'input[name="cardholderName"]', payment.cardholderName);
    await humanDelay(80, 150);

    await this.fillFieldSafely(page, 'input[name="expirationMonth"]', payment.expiryMonth);
    await humanDelay(80, 150);

    await this.fillFieldSafely(page, 'input[name="expirationYear"]', payment.expiryYear);
    await humanDelay(80, 150);

    await this.fillFieldSafely(page, 'input[name="cvv"]', payment.cvv);
    await humanDelay(80, 150);
  }

  /**
   * Place order
   */
  private async placeOrder(page: Page): Promise<string> {
    // Click place order button
    const placeOrderButton = await page.$('button[data-automation-id="place-order-button"]');
    if (!placeOrderButton) {
      throw new Error('Could not find place order button');
    }

    await humanDelay(500, 1000);
    await placeOrderButton.click();

    // Wait for confirmation page
    await page.waitForURL(/\/confirmation/, { timeout: 60000 });

    // Extract order number
    const orderNumberElement = await page.$('[data-automation-id="order-number"]');
    if (orderNumberElement) {
      const orderText = await orderNumberElement.textContent();
      return orderText?.trim() || 'unknown';
    }

    // Try alternative selector
    const altOrderElement = await page.$('text=/Order #[0-9]+/');
    if (altOrderElement) {
      const orderText = await altOrderElement.textContent();
      const match = orderText?.match(/Order #([0-9]+)/);
      return match ? match[1] : 'unknown';
    }

    return 'unknown';
  }

  /**
   * Detect captcha
   */
  private async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.g-recaptcha',
      '.h-captcha',
    ];

    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    }

    return false;
  }

  /**
   * Solve captcha
   */
  private async solveCaptcha(page: Page): Promise<void> {
    // Similar to Shopify implementation
    const recaptchaFrame = await page.$('iframe[src*="recaptcha"]');
    if (recaptchaFrame) {
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('[data-sitekey]');
        return element?.getAttribute('data-sitekey') || '';
      });

      if (siteKey) {
        const solution = await this.captchaService.solveRecaptchaV2(siteKey, page.url());
        await page.evaluate((token) => {
          (window as any).grecaptcha.getResponse = () => token;
        }, solution);
        return;
      }
    }

    throw new Error('Could not solve captcha');
  }

  /**
   * Fill field safely with typing simulation
   */
  private async fillFieldSafely(page: Page, selector: string, value: string): Promise<void> {
    const field = await page.$(selector);
    if (field) {
      await field.click();
      await humanDelay(50, 100);
      await field.fill('');
      await humanDelay(30, 60);
      await field.type(value, { delay: this.getTypingDelay() });
    }
  }

  /**
   * Get random typing delay (human-like)
   */
  private getTypingDelay(): number {
    return 30 + Math.random() * 70; // 30-100ms between keystrokes
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
