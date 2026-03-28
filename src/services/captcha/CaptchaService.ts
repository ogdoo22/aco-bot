import axios from 'axios';

export type CaptchaType = 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha';

/**
 * 2Captcha service for solving captchas
 * API Docs: https://2captcha.com/2captcha-api
 */
export class CaptchaService {
  private apiKey: string;
  private baseUrl = 'https://2captcha.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Solve reCAPTCHA v2
   */
  async solveRecaptchaV2(siteKey: string, pageUrl: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_2captcha_api_key') {
      console.warn('⚠️  2Captcha API key not configured - captcha solving disabled');
      throw new Error('2Captcha API key not configured');
    }

    try {
      // Submit captcha
      const submitResponse = await axios.post(
        `${this.baseUrl}/in.php`,
        new URLSearchParams({
          key: this.apiKey,
          method: 'userrecaptcha',
          googlekey: siteKey,
          pageurl: pageUrl,
          json: '1',
        })
      );

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha error: ${submitResponse.data.request}`);
      }

      const captchaId = submitResponse.data.request;

      // Poll for solution (max 120 seconds)
      const maxAttempts = 40;
      const pollInterval = 3000; // 3 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await this.delay(pollInterval);

        const resultResponse = await axios.get(`${this.baseUrl}/res.php`, {
          params: {
            key: this.apiKey,
            action: 'get',
            id: captchaId,
            json: 1,
          },
        });

        if (resultResponse.data.status === 1) {
          console.log('✅ Captcha solved successfully');
          return resultResponse.data.request;
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultResponse.data.request}`);
        }
      }

      throw new Error('Captcha solving timeout');
    } catch (error: any) {
      console.error('Failed to solve captcha:', error.message);
      throw error;
    }
  }

  /**
   * Solve hCaptcha
   */
  async solveHCaptcha(siteKey: string, pageUrl: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_2captcha_api_key') {
      console.warn('⚠️  2Captcha API key not configured - captcha solving disabled');
      throw new Error('2Captcha API key not configured');
    }

    try {
      // Submit captcha
      const submitResponse = await axios.post(
        `${this.baseUrl}/in.php`,
        new URLSearchParams({
          key: this.apiKey,
          method: 'hcaptcha',
          sitekey: siteKey,
          pageurl: pageUrl,
          json: '1',
        })
      );

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha error: ${submitResponse.data.request}`);
      }

      const captchaId = submitResponse.data.request;

      // Poll for solution
      const maxAttempts = 40;
      const pollInterval = 3000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await this.delay(pollInterval);

        const resultResponse = await axios.get(`${this.baseUrl}/res.php`, {
          params: {
            key: this.apiKey,
            action: 'get',
            id: captchaId,
            json: 1,
          },
        });

        if (resultResponse.data.status === 1) {
          console.log('✅ hCaptcha solved successfully');
          return resultResponse.data.request;
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultResponse.data.request}`);
        }
      }

      throw new Error('Captcha solving timeout');
    } catch (error: any) {
      console.error('Failed to solve hCaptcha:', error.message);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    if (!this.apiKey || this.apiKey === 'your_2captcha_api_key') {
      return 0;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/res.php`, {
        params: {
          key: this.apiKey,
          action: 'getbalance',
          json: 1,
        },
      });

      if (response.data.status === 1) {
        return parseFloat(response.data.request);
      }

      return 0;
    } catch (error) {
      console.error('Failed to get 2Captcha balance:', error);
      return 0;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
