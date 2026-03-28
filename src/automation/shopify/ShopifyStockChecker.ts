import axios from 'axios';
import { Proxy, StockCheckResult, VariantStock } from '../../shared/types';
import { getLogger } from '../../shared/Logger';

export class ShopifyStockChecker {
  private logger = getLogger();

  async checkStock(
    productUrl: string,
    targetSizes: string[],
    proxy: Proxy | null
  ): Promise<StockCheckResult> {
    const jsonUrl = productUrl.replace(/\/?$/, '.json');

    const axiosConfig: any = { timeout: 10000 };
    if (proxy) {
      axiosConfig.proxy = {
        host: proxy.host,
        port: proxy.port,
        auth: { username: proxy.username, password: proxy.password },
      };
    }

    const response = await axios.get(jsonUrl, axiosConfig);
    const product = response.data.product;

    const allVariants: VariantStock[] = product.variants.map((v: any) => ({
      id: v.id,
      title: v.title,
      available: v.available,
      price: v.price,
    }));

    const availableVariants = allVariants.filter(
      (v) =>
        v.available &&
        targetSizes.some((size) => v.title.toLowerCase().includes(size.toLowerCase()))
    );

    return {
      inStock: availableVariants.length > 0,
      availableVariants,
      allVariants,
      timestamp: Date.now(),
    };
  }
}
