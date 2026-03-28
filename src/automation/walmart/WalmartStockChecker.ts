import axios from 'axios';
import { Proxy, StockCheckResult, VariantStock } from '../../shared/types';
import { getLogger } from '../../shared/Logger';

export class WalmartStockChecker {
  private logger = getLogger();

  async checkStock(
    productUrl: string,
    targetSizes: string[],
    proxy: Proxy | null
  ): Promise<StockCheckResult> {
    const axiosConfig: any = {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    };

    if (proxy) {
      axiosConfig.proxy = {
        host: proxy.host,
        port: proxy.port,
        auth: { username: proxy.username, password: proxy.password },
      };
    }

    const response = await axios.get(productUrl, axiosConfig);
    const html: string = response.data;

    // Extract __NEXT_DATA__ JSON from page
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (!nextDataMatch) {
      throw new Error('Could not find __NEXT_DATA__ on Walmart page');
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const allVariants: VariantStock[] = [];

    // Navigate Walmart's data structure to find product variants
    try {
      const initialData = nextData.props?.pageProps?.initialData?.data;
      const product = initialData?.product || initialData?.idml;

      if (product?.variantCriteria) {
        for (const criteria of product.variantCriteria) {
          for (const variant of criteria.variantList || []) {
            allVariants.push({
              id: parseInt(variant.id || '0'),
              title: variant.name || variant.value || '',
              available: variant.availabilityStatus === 'IN_STOCK',
              price: variant.priceInfo?.currentPrice?.price?.toString() || '0',
            });
          }
        }
      }

      // Fallback: check main product availability
      if (allVariants.length === 0) {
        const availStatus = product?.availabilityStatus || initialData?.product?.availabilityStatus;
        allVariants.push({
          id: 0,
          title: 'Default',
          available: availStatus === 'IN_STOCK',
          price: '0',
        });
      }
    } catch {
      throw new Error('Failed to parse Walmart product data');
    }

    const availableVariants = allVariants.filter(
      (v) =>
        v.available &&
        (targetSizes.length === 0 ||
          targetSizes.some((size) => v.title.toLowerCase().includes(size.toLowerCase())))
    );

    return {
      inStock: availableVariants.length > 0,
      availableVariants,
      allVariants,
      timestamp: Date.now(),
    };
  }
}
