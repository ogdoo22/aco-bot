import { chromium, Browser, BrowserContext, Page } from 'playwright-core';
import { Task, Profile, Proxy } from '../../shared/types';
import { applyStealthPatches } from '../stealth/StealthPatches';
import { humanDelay, randomDelay } from '../utils/delays';
import { CaptchaService } from '../../services/captcha/CaptchaService';
import { getLogger } from '../../shared/Logger';

/**
 * Shopify checkout automation
 */
export class ShopifyAutomation {
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
   * Main checkout flow
   */
  async checkout(task: Task, profile: Profile, signal: AbortSignal): Promise<string> {
    this.taskId = task.id;
    this.startTime = Date.now();

    this.logger.info('checkout', 'Starting Shopify checkout', task.id, {
      productUrl: task.productUrl,
      productName: task.productName,
      size: task.size,
      proxyId: this.proxy?.id,
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
      await page.goto(task.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      this.logger.checkoutStep('Product page loaded', task.id, Date.now() - pageStart, {
        url: task.productUrl,
      });

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Select size/variant
      const variantStart = Date.now();
      await this.selectVariant(page, task.size);
      await randomDelay(100, 300);
      this.logger.checkoutStep('Variant selected', task.id, Date.now() - variantStart, { size: task.size });

      // Add to cart
      const cartStart = Date.now();
      await this.addToCart(page, task.quantity);
      await randomDelay(200, 400);
      this.logger.checkoutStep('Added to cart', task.id, Date.now() - cartStart, { quantity: task.quantity });

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Go to checkout
      await this.goToCheckout(page);
      await page.waitForLoadState('domcontentloaded');

      console.log(`✅ Checkout page loaded`);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Fill shipping information
      await this.fillShippingInfo(page, profile);
      await randomDelay(300, 500);

      console.log(`✅ Shipping info filled`);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Continue to payment
      await this.continueToPayment(page);
      await page.waitForLoadState('domcontentloaded');

      console.log(`✅ Payment page loaded`);

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

      // Fill payment information
      await this.fillPaymentInfo(page, profile);
      await randomDelay(300, 500);

      console.log(`✅ Payment info filled`);

      if (signal.aborted) {
        throw new Error('Task aborted');
      }

      // Submit order
      const submitStart = Date.now();
      const orderNumber = await this.submitOrder(page);
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
   * Initialize browser with stealth patches
   */
  private async initializeBrowser(): Promise<void> {
    const launchOptions: any = {
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    };

    // Add proxy if available
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
   * Select product variant (size)
   */
  private async selectVariant(page: Page, size: string): Promise<void> {
    try {
      // Common Shopify selectors for size/variant selection
      const selectors = [
        'select[name="id"]',
        'select#product-select',
        `button[data-variant-title*="${size}"]`,
        `input[value*="${size}"]`,
      ];

      for (const selector of selectors) {
        const element = await page.$(selector);

        if (element) {
          const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

          if (tagName === 'select') {
            await element.selectOption({ label: size });
          } else if (tagName === 'button') {
            await element.click();
          } else if (tagName === 'input') {
            await element.click();
          }

          console.log(`✅ Selected variant: ${size}`);
          return;
        }
      }

      console.warn(`⚠️  Could not find size selector for: ${size}`);
    } catch (error) {
      console.error('Error selecting variant:', error);
      // Continue anyway - size might not be required or already selected
    }
  }

  /**
   * Add product to cart
   */
  private async addToCart(page: Page, quantity: number): Promise<void> {
    // Set quantity if needed
    const quantityInput = await page.$('input[name="quantity"]');
    if (quantityInput) {
      await humanDelay(50, 150);
      await quantityInput.fill(quantity.toString());
    }

    // Click add to cart button
    const addToCartSelectors = [
      'button[name="add"]',
      'button[type="submit"][name="add"]',
      'input[type="submit"][name="add"]',
      'button.add-to-cart',
      'button#AddToCart',
    ];

    for (const selector of addToCartSelectors) {
      const button = await page.$(selector);
      if (button) {
        await humanDelay(100, 200);
        await button.click();
        return;
      }
    }

    throw new Error('Could not find add to cart button');
  }

  /**
   * Navigate to checkout
   */
  private async goToCheckout(page: Page): Promise<void> {
    // Wait for cart to update
    await randomDelay(500, 1000);

    // Try direct checkout URL first (fastest)
    const currentUrl = page.url();
    const checkoutUrl = new URL(currentUrl).origin + '/checkout';

    await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  /**
   * Fill shipping information
   */
  private async fillShippingInfo(page: Page, profile: Profile): Promise<void> {
    const { email, shipping } = profile;

    // Email
    await this.fillFieldSafely(page, 'input[name="checkout[email]"]', email);
    await humanDelay(50, 100);

    // First name
    await this.fillFieldSafely(
      page,
      'input[name="checkout[shipping_address][first_name]"]',
      shipping.firstName
    );
    await humanDelay(50, 100);

    // Last name
    await this.fillFieldSafely(
      page,
      'input[name="checkout[shipping_address][last_name]"]',
      shipping.lastName
    );
    await humanDelay(50, 100);

    // Address
    await this.fillFieldSafely(
      page,
      'input[name="checkout[shipping_address][address1]"]',
      shipping.address1
    );
    await humanDelay(50, 100);

    // Address 2 (optional)
    if (shipping.address2) {
      await this.fillFieldSafely(
        page,
        'input[name="checkout[shipping_address][address2]"]',
        shipping.address2
      );
      await humanDelay(50, 100);
    }

    // City
    await this.fillFieldSafely(
      page,
      'input[name="checkout[shipping_address][city]"]',
      shipping.city
    );
    await humanDelay(50, 100);

    // State/Province
    const stateSelect = await page.$('select[name="checkout[shipping_address][province]"]');
    if (stateSelect) {
      await stateSelect.selectOption({ label: shipping.state });
    } else {
      await this.fillFieldSafely(
        page,
        'input[name="checkout[shipping_address][province]"]',
        shipping.state
      );
    }
    await humanDelay(50, 100);

    // ZIP
    await this.fillFieldSafely(
      page,
      'input[name="checkout[shipping_address][zip]"]',
      shipping.zip
    );
    await humanDelay(50, 100);

    // Phone
    await this.fillFieldSafely(page, 'input[name="checkout[shipping_address][phone]"]', profile.phone);
  }

  /**
   * Continue to payment page
   */
  private async continueToPayment(page: Page): Promise<void> {
    const continueButton = await page.$('button[type="submit"]');
    if (continueButton) {
      await humanDelay(200, 400);
      await continueButton.click();
    } else {
      throw new Error('Could not find continue button');
    }
  }

  /**
   * Fill payment information
   */
  private async fillPaymentInfo(page: Page, profile: Profile): Promise<void> {
    const { payment, billing } = profile;

    // Wait for payment iframe to load
    await randomDelay(1000, 1500);

    // Shopify uses iframe for payment - need to switch context
    const paymentFrame = page.frameLocator('iframe[name*="card"]').first();

    // Card number
    await this.fillFieldInFrame(paymentFrame, 'input[name="number"]', payment.cardNumber);
    await humanDelay(80, 150);

    // Cardholder name
    await this.fillFieldSafely(page, 'input[name="checkout[credit_card][name]"]', payment.cardholderName);
    await humanDelay(80, 150);

    // Expiry
    await this.fillFieldInFrame(
      paymentFrame,
      'input[name="expiry"]',
      `${payment.expiryMonth}${payment.expiryYear}`
    );
    await humanDelay(80, 150);

    // CVV
    await this.fillFieldInFrame(paymentFrame, 'input[name="verification_value"]', payment.cvv);
    await humanDelay(80, 150);

    // Billing address (if different from shipping)
    const sameAsShipping = await page.$('input[name="checkout[different_billing_address]"]');
    if (sameAsShipping && billing.address1 !== profile.shipping.address1) {
      await sameAsShipping.click();
      await randomDelay(300, 500);

      // Fill billing address
      await this.fillFieldSafely(
        page,
        'input[name="checkout[billing_address][first_name]"]',
        billing.firstName
      );
      await this.fillFieldSafely(
        page,
        'input[name="checkout[billing_address][last_name]"]',
        billing.lastName
      );
      await this.fillFieldSafely(
        page,
        'input[name="checkout[billing_address][address1]"]',
        billing.address1
      );
      await this.fillFieldSafely(page, 'input[name="checkout[billing_address][city]"]', billing.city);
      await this.fillFieldSafely(page, 'input[name="checkout[billing_address][zip]"]', billing.zip);
    }
  }

  /**
   * Submit order
   */
  private async submitOrder(page: Page): Promise<string> {
    // Click complete order button
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }

    await humanDelay(500, 800);
    await submitButton.click();

    // Wait for order confirmation page
    await page.waitForURL(/\/orders\//, { timeout: 60000 });

    // Extract order number from URL or page
    const url = page.url();
    const orderMatch = url.match(/\/orders\/([^\/\?]+)/);
    if (orderMatch) {
      return orderMatch[1];
    }

    // Try to extract from page
    const orderElement = await page.$('.os-order-number');
    if (orderElement) {
      const orderText = await orderElement.textContent();
      return orderText?.trim() || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Detect captcha on page
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
   * Solve captcha if present
   */
  private async solveCaptcha(page: Page): Promise<void> {
    // Check for reCAPTCHA
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

    // Check for hCaptcha
    const hcaptchaFrame = await page.$('iframe[src*="hcaptcha"]');
    if (hcaptchaFrame) {
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('[data-sitekey]');
        return element?.getAttribute('data-sitekey') || '';
      });

      if (siteKey) {
        const solution = await this.captchaService.solveHCaptcha(siteKey, page.url());
        await page.evaluate((token) => {
          (window as any).hcaptcha.getResponse = () => token;
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
   * Fill field in iframe
   */
  private async fillFieldInFrame(frameLocator: any, selector: string, value: string): Promise<void> {
    const field = frameLocator.locator(selector);
    await field.click();
    await humanDelay(50, 100);
    await field.fill(value);
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
