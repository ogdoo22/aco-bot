import { Page } from 'playwright';

/**
 * Apply stealth patches to bypass bot detection
 */
export async function applyStealthPatches(page: Page): Promise<void> {
  // Override navigator.webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // Override Chrome detection
  await page.addInitScript(() => {
    (window as any).chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };
  });

  // Override permissions
  await page.addInitScript(() => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: 'denied' } as PermissionStatus);
      }
      return originalQuery(parameters);
    };
  });

  // Override plugins
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin',
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          name: 'Chrome PDF Viewer',
        },
        {
          0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          name: 'Native Client',
        },
      ],
    });
  });

  // Override languages
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Override platform
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });
  });

  // Add realistic screen properties
  await page.addInitScript(() => {
    Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(screen, 'availHeight', { get: () => 1080 });
    Object.defineProperty(screen, 'width', { get: () => 1920 });
    Object.defineProperty(screen, 'height', { get: () => 1080 });
    Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
  });

  // Override iframe detection
  await page.addInitScript(() => {
    const originalGetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
    if (originalGetter) {
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function () {
          const win = originalGetter.get?.call(this);
          if (win) {
            try {
              (win as any).navigator.webdriver = undefined;
            } catch (e) {}
          }
          return win;
        },
      });
    }
  });

  // Hide automation
  await page.addInitScript(() => {
    const newProto = Object.assign({}, Object.getPrototypeOf(window.navigator));
    delete (newProto as any).webdriver;
    Object.setPrototypeOf(window.navigator, newProto);
  });

  // Randomize canvas fingerprint
  await page.addInitScript(() => {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type?: string) {
      const context = this.getContext('2d');
      if (context) {
        // Add tiny noise to make canvas fingerprint unique
        const noise = Math.random() * 0.000001;
        context.fillStyle = `rgba(${noise}, ${noise}, ${noise}, 0.01)`;
        context.fillRect(0, 0, 1, 1);
      }
      return originalToDataURL.call(this, type);
    };
  });

  // Randomize WebGL fingerprint
  await page.addInitScript(() => {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
      // Randomize UNMASKED_VENDOR_WEBGL and UNMASKED_RENDERER_WEBGL
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.call(this, parameter);
    };
  });

  console.log('✅ Stealth patches applied');
}
