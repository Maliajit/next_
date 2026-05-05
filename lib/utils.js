"use client";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/assets/')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
  
  let cleanPath = path;
  // Remove leading slash if present
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  
  // If it already has uploads/, remove it so we can add it back cleanly
  if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.slice(8);
  }
  
  return `${baseUrl}/uploads/${cleanPath}`;
}

/**
 * UNIFIED DISPLAY MODEL
 * One source of truth for price, image, and configuration across the entire app.
 * Use this in Homepage, Discover, Wishlist, Shop, and Admin.
 */
export function getDisplayData(product, variant = null) {
    if (!product) return { name: '', price: 0, image: '', isConfigurable: false };

    const isConfig = product.productType === 'configurable' || product.isConfigurable;
    
    // Default to the first active variant if none provided for configurable products
    const targetVariant = variant || (isConfig ? product.variants?.[0] : null);

    const priceValue = isConfig 
        ? (targetVariant?.sellingPrice || targetVariant?.price || product.sellingPrice || product.price)
        : (product.sellingPrice || product.price);

    return {
        id: product.id?.toString(),
        variantId: targetVariant?.id?.toString(),
        name: product.name || product.title,
        subtitle: (targetVariant?.variantAttributes || [])
            .map(va => va.attributeValue?.label)
            .filter(Boolean)
            .join(', ') || product.subtitle || targetVariant?.sku,
        isConfigurable: isConfig,
        variant: targetVariant,
        price: Number(priceValue || 0),
        formattedPrice: `₹${Number(priceValue || 0).toLocaleString('en-IN')}`,
        image: resolveProductImage(product, targetVariant),
        slug: product.slug,
        sku: targetVariant?.sku || product.sku
    };
}

export function resolveProductImage(product, variant = null) {
  const isConfig = product?.productType === 'configurable' || product?.isConfigurable;
  
  if (isConfig) {
    // If no variant provided (e.g. catalog view), try first variant
    const targetVariant = variant || product.variants?.[0];
    
    if (!targetVariant) {
        // Only log warning, don't fail-fast with error if in catalog view
        console.warn("No variant available for configurable product image resolution", product?.name);
        return '/assets/fylex-watch-v2/premium.png'; 
    }

    // Try to get image from variantImages
    if (targetVariant.variantImages && targetVariant.variantImages.length > 0) {
      const mainImg = targetVariant.variantImages.find(img => img.type === 'MAIN') || targetVariant.variantImages[0];
      const path = mainImg.media?.filePath || mainImg.media?.fileName || mainImg.url;
      if (path) return getFileUrl(path);
    }
  }

  // Fallback to product level images if variant image missing or for simple products
  if (product?.heroImage) return getFileUrl(product.heroImage);
  if (product?.images && product.images.length > 0) return getFileUrl(product.images[0]);

  return '/assets/fylex-watch-v2/premium.png';
}

export function serializeConfig(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'watch' && key !== 'mode') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}
