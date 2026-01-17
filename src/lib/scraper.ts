import * as cheerio from "cheerio";
import type { ScrapedProduct } from "./types";

// Type alias for cheerio loaded document
type CheerioDoc = ReturnType<typeof cheerio.load>;

// Default fallback product when scraping fails
const FALLBACK_PRODUCT: ScrapedProduct = {
  title: "Product",
  price: "$0.00",
  image: "https://via.placeholder.com/800x800?text=Product",
  description: "Product description not available",
  images: [],
};

// Fetch HTML content from URL
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  return response.text();
}

// Extract Shopify product data from JSON-LD or product JSON
async function scrapeShopify(url: string): Promise<ScrapedProduct | null> {
  try {
    // Try to fetch the product JSON endpoint
    const productJsonUrl = url.replace(/\/?$/, ".json");
    const jsonResponse = await fetch(productJsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ViralClip/1.0)",
      },
    });

    if (jsonResponse.ok) {
      const data = await jsonResponse.json();
      const product = data.product;

      if (product) {
        const images = product.images?.map((img: { src: string }) => img.src) || [];
        const variant = product.variants?.[0];
        const price = variant?.price
          ? `$${parseFloat(variant.price).toFixed(2)}`
          : "$0.00";

        return {
          title: product.title || "Shopify Product",
          price,
          image: images[0] || FALLBACK_PRODUCT.image,
          description:
            product.body_html?.replace(/<[^>]*>/g, "").slice(0, 500) ||
            product.description ||
            "",
          images,
        };
      }
    }
  } catch {
    // Fall through to HTML scraping
  }

  return null;
}

// Extract product data from JSON-LD schema
function extractJsonLd($: CheerioDoc): Partial<ScrapedProduct> | null {
  const result: Partial<ScrapedProduct> = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes("Product")) {
          result.title = item.name || result.title;
          result.description = item.description || result.description;

          // Handle image
          if (item.image) {
            if (typeof item.image === "string") {
              result.image = item.image;
            } else if (Array.isArray(item.image)) {
              result.images = item.image;
              result.image = item.image[0];
            } else if (item.image.url) {
              result.image = item.image.url;
            }
          }

          // Handle price
          if (item.offers) {
            const offer = Array.isArray(item.offers)
              ? item.offers[0]
              : item.offers;
            if (offer.price) {
              const currency = offer.priceCurrency || "USD";
              const symbol = currency === "USD" ? "$" : currency + " ";
              result.price = `${symbol}${parseFloat(offer.price).toFixed(2)}`;
            }
          }
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

// Extract product data from Open Graph and meta tags
function extractMetaTags($: CheerioDoc): Partial<ScrapedProduct> {
  const result: Partial<ScrapedProduct> = {};
  const images: string[] = [];

  // Open Graph tags
  result.title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="og:title"]').attr("content");

  result.description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content");

  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content");
  if (ogImage) {
    images.push(ogImage);
    result.image = ogImage;
  }

  // Product-specific meta tags
  const productPrice =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content");
  const productCurrency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content") ||
    "USD";

  if (productPrice) {
    const symbol = productCurrency === "USD" ? "$" : productCurrency + " ";
    result.price = `${symbol}${parseFloat(productPrice).toFixed(2)}`;
  }

  // Collect all images
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr("content");
    if (src && !images.includes(src)) images.push(src);
  });

  if (images.length > 0) {
    result.images = images;
  }

  return result;
}

// Extract product data from page content
function extractFromContent($: CheerioDoc): Partial<ScrapedProduct> {
  const result: Partial<ScrapedProduct> = {};
  const images: string[] = [];

  // Title fallbacks
  if (!result.title) {
    result.title =
      $("h1").first().text().trim() ||
      $("title").text().trim().split("|")[0].trim() ||
      $('[class*="product-title"]').first().text().trim() ||
      $('[class*="product_title"]').first().text().trim();
  }

  // Price detection
  const priceSelectors = [
    '[class*="price"]:not([class*="compare"])',
    '[data-price]',
    '[itemprop="price"]',
    ".product-price",
    ".Price",
    "#price",
  ];

  for (const selector of priceSelectors) {
    const priceEl = $(selector).first();
    const priceText = priceEl.attr("content") || priceEl.text();
    const priceMatch = priceText?.match(/[\$£€]?\s*(\d+[.,]\d{2})/);
    if (priceMatch) {
      const hasSymbol = /[\$£€]/.test(priceText || "");
      result.price = hasSymbol ? priceMatch[0] : `$${priceMatch[1]}`;
      break;
    }
  }

  // Image extraction
  const imageSelectors = [
    '[class*="product"] img',
    '[class*="gallery"] img',
    '[data-zoom]',
    'img[itemprop="image"]',
    ".product-image img",
    "#product-image",
    "main img",
  ];

  for (const selector of imageSelectors) {
    $(selector).each((_, el) => {
      const src =
        $(el).attr("data-src") ||
        $(el).attr("data-lazy-src") ||
        $(el).attr("src");
      if (src && !src.includes("icon") && !src.includes("logo")) {
        const fullSrc = src.startsWith("//") ? `https:${src}` : src;
        if (!images.includes(fullSrc)) {
          images.push(fullSrc);
        }
      }
    });
  }

  if (images.length > 0) {
    result.images = images;
    result.image = images[0];
  }

  // Description fallback
  if (!result.description) {
    result.description =
      $('[class*="description"]').first().text().trim().slice(0, 500) ||
      $('[itemprop="description"]').text().trim().slice(0, 500) ||
      $("p").first().text().trim().slice(0, 500);
  }

  return result;
}

// Main scraping function
export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const isShopify =
      parsedUrl.hostname.includes("shopify") ||
      parsedUrl.hostname.includes("myshopify");

    // Try Shopify-specific scraping first
    if (isShopify || url.includes("/products/")) {
      const shopifyProduct = await scrapeShopify(url);
      if (shopifyProduct) {
        return shopifyProduct;
      }
    }

    // Fetch and parse HTML
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    // Combine data from multiple sources
    const jsonLdData = extractJsonLd($) || {};
    const metaData = extractMetaTags($);
    const contentData = extractFromContent($);

    // Merge with priority: JSON-LD > Meta > Content > Fallback
    const product: ScrapedProduct = {
      title:
        jsonLdData.title ||
        metaData.title ||
        contentData.title ||
        FALLBACK_PRODUCT.title,
      price:
        jsonLdData.price ||
        metaData.price ||
        contentData.price ||
        FALLBACK_PRODUCT.price,
      image:
        jsonLdData.image ||
        metaData.image ||
        contentData.image ||
        FALLBACK_PRODUCT.image,
      description:
        jsonLdData.description ||
        metaData.description ||
        contentData.description ||
        FALLBACK_PRODUCT.description,
      images: [
        ...new Set([
          ...(jsonLdData.images || []),
          ...(metaData.images || []),
          ...(contentData.images || []),
        ]),
      ],
    };

    // Ensure we have at least one image
    if (product.images.length === 0 && product.image) {
      product.images = [product.image];
    }

    return product;
  } catch (error) {
    console.error("Scraping error:", error);
    return {
      ...FALLBACK_PRODUCT,
      title: `Product from ${new URL(url).hostname}`,
    };
  }
}
