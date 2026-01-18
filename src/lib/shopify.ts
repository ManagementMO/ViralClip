import { createStorefrontApiClient } from "@shopify/storefront-api-client";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

// Initialize Shopify Storefront API client (for server-side use)
export function getShopifyClient() {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    return null;
  }

  // Ensure domain format is correct (with protocol)
  const domain = SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const storeDomain = domain.includes("http") ? domain : `https://${domain}`;

  return createStorefrontApiClient({
    storeDomain,
    apiVersion: "2024-10",
    publicAccessToken: SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  });
}

// Extract product handle from Shopify URL
export function extractProductHandle(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/products\/([^/?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Check if URL is a Shopify product URL
export function isShopifyProductUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("shopify") ||
      urlObj.hostname.includes("myshopify.com") ||
      urlObj.pathname.includes("/products/")
    );
  } catch {
    return false;
  }
}
