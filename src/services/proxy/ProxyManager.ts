import { ACODatabase } from '../../database/Database';
import { Proxy } from '../../shared/types';
import axios from 'axios';

/**
 * Manages proxy rotation and health checking
 */
export class ProxyManager {
  private database: ACODatabase;

  constructor(database: ACODatabase) {
    this.database = database;
  }

  /**
   * Get a random active proxy for a specific profile (BYOP)
   */
  async getProxyForProfile(profileId: string): Promise<Proxy | null> {
    const proxies = this.database.getActiveProxies(profileId);

    if (proxies.length === 0) {
      console.warn(`No active proxies found for profile ${profileId}`);
      return null;
    }

    // Weight selection by success rate
    const totalSuccessRate = proxies.reduce((sum, p) => sum + p.successRate, 0);

    if (totalSuccessRate === 0) {
      // No success rate data yet, pick random
      return proxies[Math.floor(Math.random() * proxies.length)];
    }

    // Weighted random selection
    let random = Math.random() * totalSuccessRate;

    for (const proxy of proxies) {
      random -= proxy.successRate;
      if (random <= 0) {
        return proxy;
      }
    }

    return proxies[0];
  }

  /**
   * Get a random active proxy (legacy - use getProxyForProfile instead)
   * @deprecated Use getProxyForProfile(profileId) for BYOP model
   */
  async getRandomProxy(): Promise<Proxy | null> {
    console.warn('getRandomProxy() is deprecated - use getProxyForProfile(profileId)');
    const proxies = this.database.getActiveProxies();

    if (proxies.length === 0) {
      return null;
    }

    return proxies[Math.floor(Math.random() * proxies.length)];
  }

  /**
   * Format proxy URL for browser
   */
  getProxyUrl(proxy: Proxy): string {
    const { username, password, host, port } = proxy;
    return `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  /**
   * Test a single proxy
   */
  async testProxy(proxyId: string): Promise<{ success: boolean; speedMs: number; error?: string }> {
    const proxy = this.database.getProxy(proxyId);

    if (!proxy) {
      return { success: false, speedMs: 0, error: 'Proxy not found' };
    }

    const startTime = Date.now();

    try {
      // Test proxy by making a request through it
      const proxyUrl = this.getProxyUrl(proxy);

      const response = await axios.get('http://api.ipify.org?format=json', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: {
            username: proxy.username,
            password: proxy.password,
          },
        },
        timeout: 10000, // 10 second timeout
      });

      const speedMs = Date.now() - startTime;

      // Update proxy stats
      this.database.updateProxyStats(proxyId, true, speedMs);

      console.log(`✅ Proxy ${proxy.host}:${proxy.port} OK (${speedMs}ms) - IP: ${response.data.ip}`);

      return { success: true, speedMs };
    } catch (error: any) {
      const speedMs = Date.now() - startTime;

      // Update proxy stats
      this.database.updateProxyStats(proxyId, false, speedMs);

      console.error(`❌ Proxy ${proxy.host}:${proxy.port} FAILED: ${error.message}`);

      // Deactivate proxy if it's consistently failing
      if (proxy.successRate < 0.3 && proxy.totalRequests > 10) {
        this.database.deactivateProxy(proxyId);
        console.warn(`⚠️  Proxy ${proxy.host}:${proxy.port} deactivated (success rate < 30%)`);
      }

      return {
        success: false,
        speedMs,
        error: error.message,
      };
    }
  }

  /**
   * Test all active proxies
   */
  async testAllProxies(): Promise<{ tested: number; passed: number; failed: number }> {
    const proxies = this.database.getActiveProxies();
    let passed = 0;
    let failed = 0;

    console.log(`🔍 Testing ${proxies.length} proxies...`);

    for (const proxy of proxies) {
      const result = await this.testProxy(proxy.id);

      if (result.success) {
        passed++;
      } else {
        failed++;
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`✅ Proxy test complete: ${passed} passed, ${failed} failed`);

    return {
      tested: proxies.length,
      passed,
      failed,
    };
  }

  /**
   * Import proxies for a specific profile (BYOP)
   */
  importProxiesForProfile(
    profileId: string,
    proxyList: string[],
    type: 'residential' | 'datacenter' | 'isp'
  ): number {
    let imported = 0;

    for (const proxyString of proxyList) {
      try {
        const proxy = this.parseProxyString(proxyString, type, profileId);
        this.database.createProxy(proxy);
        imported++;
      } catch (error) {
        console.error(`Failed to import proxy: ${proxyString}`, error);
      }
    }

    console.log(`✅ Imported ${imported} proxies for profile ${profileId}`);
    return imported;
  }

  /**
   * Parse proxy string in various formats
   * Formats supported:
   * - host:port:user:pass
   * - user:pass@host:port
   * - http://user:pass@host:port
   */
  private parseProxyString(
    proxyString: string,
    type: 'residential' | 'datacenter' | 'isp',
    profileId: string
  ): Proxy {
    let host: string;
    let port: number;
    let username: string;
    let password: string;

    // Remove http:// if present
    proxyString = proxyString.replace(/^https?:\/\//, '');

    if (proxyString.includes('@')) {
      // Format: user:pass@host:port
      const atIndex = proxyString.lastIndexOf('@');
      const auth = proxyString.substring(0, atIndex);
      const server = proxyString.substring(atIndex + 1);
      const colonIndex = auth.indexOf(':');
      username = auth.substring(0, colonIndex);
      password = auth.substring(colonIndex + 1);
      [host, port] = server.split(':').map((v, i) => (i === 1 ? parseInt(v) : v)) as [string, number];
    } else {
      // Format: host:port:user:pass
      const parts = proxyString.split(':');
      host = parts[0];
      port = parseInt(parts[1]);
      username = parts[2];
      // Join remaining parts in case password contains colons
      password = parts.slice(3).join(':');
    }

    if (!host || !port || !username || !password) {
      throw new Error('Invalid proxy format');
    }

    return {
      id: `proxy_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      profileId, // Associate proxy with profile (BYOP)
      host,
      port,
      username,
      password,
      type,
      speedMs: null,
      successRate: 0,
      totalRequests: 0,
      successfulRequests: 0,
      lastTested: null,
      isActive: true,
      createdAt: Date.now(),
    };
  }
}
