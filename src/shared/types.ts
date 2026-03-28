/**
 * Core type definitions for ACO Bot
 */

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed' | 'retrying';
export type ProxyType = 'residential' | 'datacenter' | 'isp';
export type CheckoutMode = 'safe' | 'fast' | 'aggressive';
export type MonitorStatus = 'idle' | 'monitoring' | 'stock_found' | 'paused' | 'error';

/**
 * Task configuration for a single checkout attempt
 */
export interface Task {
  id: string;
  site: string;
  productUrl: string;
  productName: string;
  size: string;
  quantity: number;
  profileId: string;
  proxyId: string | null;
  mode: CheckoutMode;
  status: TaskStatus;
  retryCount: number;
  maxRetries: number;
  delay: number;
  orderNumber: string | null;
  errorMessage: string | null;
  checkoutTime: number | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

/**
 * Shipping and payment profile
 */
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  shipping: ShippingAddress;
  billing: BillingAddress;
  payment: PaymentInfo;
  createdAt: number;
  updatedAt: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentInfo {
  cardNumber: string; // Encrypted
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string; // Encrypted
}

/**
 * Proxy configuration (BYOP - belongs to specific profile)
 */
export interface Proxy {
  id: string;
  profileId: string; // Each proxy belongs to a profile (BYOP model)
  host: string;
  port: number;
  username: string;
  password: string;
  type: ProxyType;
  speedMs: number | null;
  successRate: number;
  totalRequests: number;
  successfulRequests: number;
  lastTested: number | null;
  isActive: boolean;
  createdAt: number;
}

/**
 * Monitor configuration for watching product stock
 */
export interface Monitor {
  id: string;
  site: string;
  productUrl: string;
  productName: string;
  sizes: string[];
  profileId: string;
  mode: CheckoutMode;
  pollInterval: number;
  status: MonitorStatus;
  lastChecked: number | null;
  lastStockState: string | null;
  tasksCreated: number;
  errorMessage: string | null;
  createdAt: number;
  startedAt: number | null;
}

/**
 * Stock check result from a monitor poll
 */
export interface VariantStock {
  id: number;
  title: string;
  available: boolean;
  price: string;
}

export interface StockCheckResult {
  inStock: boolean;
  availableVariants: VariantStock[];
  allVariants: VariantStock[];
  timestamp: number;
}

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  orderNumber: string | null;
  checkoutTime: number;
  errorMessage: string | null;
  timestamp: number;
}

/**
 * Discord notification payload
 */
export interface DiscordNotification {
  type: 'success' | 'failure' | 'warning' | 'info';
  title: string;
  description: string;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: number;
}

/**
 * Analytics data
 */
export interface Analytics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  successRate: number;
  averageCheckoutTime: number;
  totalSpent: number;
  estimatedRevenue: number;
  estimatedProfit: number;
}

/**
 * App configuration
 */
export interface AppConfig {
  smartproxyUser: string;
  smartproxyPassword: string;
  smartproxyEndpoint: string;
  twoCaptchaApiKey: string;
  discordWebhookUrl: string;
  logLevel: string;
}

/**
 * Shopify checkout session
 */
export interface ShopifySession {
  taskId: string;
  productUrl: string;
  size: string;
  quantity: number;
  profile: Profile;
  proxy: Proxy | null;
  mode: CheckoutMode;
  checkoutToken: string | null;
  cartToken: string | null;
}

/**
 * Browser fingerprint configuration
 */
export interface BrowserFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  language: string;
  webgl: {
    vendor: string;
    renderer: string;
  };
  canvas: string | null;
}
