import { useMemo } from "react";
import { Product } from "../services/productService";
import { ActiveFilter, applyFilters } from "../utils/productFiltering";

export interface FilterOptions {
  sizes: string[];
  colors: Array<{ name: string; code: string; count: number }>;
  priceRanges: Array<{
    label: string;
    min: number;
    max: number;
    count: number;
  }>;
  availability: Array<{ label: string; count: number }>;
  wearTypes: Array<{ label: string; count: number }>;
  occasions: Array<{ label: string; count: number }>;
  tags: Array<{ label: string; count: number }>;
  styles: Array<{ label: string; count: number }>;
  works: Array<{ label: string; count: number }>;
  fabrics: Array<{ label: string; count: number }>;
  productTypes: Array<{ label: string; count: number }>;
  subCategories: Array<{ label: string; count: number }>;
  categories: Array<{
    label: string;
    count: number;
    slug: string;
    subCategories: string[];
  }>;
}

/**
 * Helper to normalize color names to Title Case for consistent grouping
 */
export const normalizeColorName = (name: string) => {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Helper to normalize size names for consistent grouping
 */
export const normalizeSizeName = (name: string) => {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === "free size") return "Free Size";
  return trimmed.toUpperCase();
};

/**
 * Extract filter options from a set of products
 */
export const getFilterOptions = (products: Product[]): FilterOptions => {
  const sizeSet = new Set<string>();
  const colorMap = new Map<string, { code: string; count: number }>();
  const wearTypeMap = new Map<string, number>();
  const occasionMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  const styleMap = new Map<string, number>();
  const workMap = new Map<string, number>();
  const fabricMap = new Map<string, number>();
  const productTypeMap = new Map<string, number>();
  const subCategoryMap = new Map<string, number>();
  const categoryMap = new Map<
    string,
    { count: number; slug: string; subCategories: Set<string> }
  >();
  const prices: number[] = [];
  let inStockCount = 0;
  let lowStockCount = 0;

  // Extract data from products
  products.forEach((product) => {
    let productLowestPrice = Infinity;

    product.variants?.forEach((variant) => {
      // Collect colors
      if (variant.color?.name && variant.color?.code) {
        const colorName = normalizeColorName(variant.color.name);
        const existing = colorMap.get(colorName);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(colorName, {
            code: variant.color.code,
            count: 1,
          });
        }
      }

      // Collect sizes and calculate prices
      variant.sizes?.forEach((size) => {
        if (size.name) {
          sizeSet.add(normalizeSizeName(size.name));
        }

        // Calculate effective price
        const effectivePrice =
          size.discountPrice && size.discountPrice > 0
            ? size.discountPrice
            : size.price;

        if (effectivePrice > 0 && effectivePrice < productLowestPrice) {
          productLowestPrice = effectivePrice;
        }
      });
    });

    // Add product's lowest price to prices array
    if (productLowestPrice !== Infinity) {
      prices.push(productLowestPrice);
    }

    // Check availability
    if (product.stock > 10) {
      inStockCount++;
    } else if (product.stock > 0 && product.stock <= 10) {
      lowStockCount++;
    }

    // Collect wear types
    product.wearType?.forEach((wearType) => {
      const count = wearTypeMap.get(wearType) || 0;
      wearTypeMap.set(wearType, count + 1);
    });

    // Collect occasions
    product.occasion?.forEach((occasion) => {
      const count = occasionMap.get(occasion) || 0;
      occasionMap.set(occasion, count + 1);
    });

    // Collect tags
    product.tags?.forEach((tag) => {
      const count = tagMap.get(tag) || 0;
      tagMap.set(tag, count + 1);
    });

    // Collect styles
    product.style?.forEach((item) => {
      const count = styleMap.get(item) || 0;
      styleMap.set(item, count + 1);
    });

    // Collect works
    product.work?.forEach((item) => {
      const count = workMap.get(item) || 0;
      workMap.set(item, count + 1);
    });

    // Collect fabrics
    product.fabric?.forEach((item) => {
      const count = fabricMap.get(item) || 0;
      fabricMap.set(item, count + 1);
    });

    // Collect productTypes
    product.productType?.forEach((item) => {
      const count = productTypeMap.get(item) || 0;
      productTypeMap.set(item, count + 1);
    });

    // Collect subCategory
    if (product.subCategory) {
      const count = subCategoryMap.get(product.subCategory) || 0;
      subCategoryMap.set(product.subCategory, count + 1);
    }

    // Collect category
    if (product.category) {
      const catKey = product.category.name;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          count: 0,
          slug: product.category.slug,
          subCategories: new Set(),
        });
      }
      const catInfo = categoryMap.get(catKey)!;
      catInfo.count++;
      if (product.subCategory) {
        catInfo.subCategories.add(product.subCategory);
      }
    }
  });

  // Sort sizes intelligently (numeric first, then alphabetic, then Free Size)
  const sizes = Array.from(sizeSet).sort((a, b) => {
    if (a === "Free Size") return 1;
    if (b === "Free Size") return -1;

    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    const sizeOrder = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
    ];
    const aIndex = sizeOrder.indexOf(a.toUpperCase());
    const bIndex = sizeOrder.indexOf(b.toUpperCase());
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    return a.localeCompare(b);
  });

  const colors = Array.from(colorMap.entries())
    .map(([name, data]) => ({
      name,
      code: data.code,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  const wearTypes = Array.from(wearTypeMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const occasions = Array.from(occasionMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const tags = Array.from(tagMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const styles = Array.from(styleMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const works = Array.from(workMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const fabrics = Array.from(fabricMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const productTypes = Array.from(productTypeMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const subCategories = Array.from(subCategoryMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const categories = Array.from(categoryMap.entries())
    .map(([label, data]) => ({
      label,
      count: data.count,
      slug: data.slug,
      subCategories: Array.from(data.subCategories),
    }))
    .sort((a, b) => b.count - a.count);

  const priceRanges = generatePriceRanges(prices);

  const availability = [
    { label: "In Stock", count: inStockCount },
    { label: "Low Stock (≤10)", count: lowStockCount },
  ].filter((item) => item.count > 0);

  return {
    sizes,
    colors,
    priceRanges,
    availability,
    wearTypes,
    occasions,
    tags,
    styles,
    works,
    fabrics,
    productTypes,
    subCategories,
    categories,
  };
};

/**
 * Generate intelligent price ranges based on actual product prices
 */
function generatePriceRanges(
  prices: number[]
): Array<{ label: string; min: number; max: number; count: number }> {
  if (prices.length === 0) return [];

  const sortedPrices = [...prices].sort((a, b) => a - b);

  const ranges = [
    { min: 0, max: 5000 },
    { min: 5000, max: 10000 },
    { min: 10000, max: 15000 },
    { min: 15000, max: 20000 },
    { min: 20000, max: 30000 },
    { min: 30000, max: 50000 },
    { min: 50000, max: Infinity },
  ];

  return ranges
    .map((range) => {
      const count = prices.filter(
        (p) => p >= range.min && p <= range.max
      ).length;

      let label: string;
      if (range.max === Infinity) {
        label = `₹${(range.min / 1000).toFixed(0)}k+`;
      } else if (range.min === 0) {
        label = `Under ₹${(range.max / 1000).toFixed(0)}k`;
      } else {
        label = `₹${(range.min / 1000).toFixed(0)}k - ₹${(range.max / 1000).toFixed(0)}k`;
      }

      return {
        label,
        min: range.min,
        max: range.max,
        count,
      };
    })
    .filter((range) => range.count > 0);
}

/**
 * Hook to extract intelligent filter options from products
 * Dynamically generates filters based on actual product data
 * Support for dependent filtering: filters are narrowed based on other active selections
 */
export const useProductFilters = (
  products: Product[],
  activeFilters: ActiveFilter[] = []
): FilterOptions => {
  return useMemo(() => {
    if (activeFilters.length === 0) {
      return getFilterOptions(products);
    }

    // For dependent filters, each category's options are derived from
    // products filtered by ALL OTHER active filters.
    const getOptionsForType = (type: string) => {
      const filtered = applyFilters(products, activeFilters, type);
      return getFilterOptions(filtered);
    };

    const allOptions = getFilterOptions(products); // Used for types with no active filters to avoid redundant work
    const activeTypes = new Set(activeFilters.map((f) => f.type));

    const result: Partial<FilterOptions> = {};

    // For each filter type, if it's active, we MUST recalculate it based on other filters.
    // If it's NOT active, we should still recalculate it based on ALL active filters to show only relevant options.
    // Actually, the logic is simpler: for EVERY category, the available options are those
    // that remain after applying all filters EXCEPT those in that category.

    result.sizes = getOptionsForType("size").sizes;
    result.colors = getOptionsForType("color").colors;
    result.categories = getOptionsForType("category").categories;
    result.subCategories = getOptionsForType("subCategory").subCategories;
    result.priceRanges = getOptionsForType("price").priceRanges;
    result.availability = getOptionsForType("availability").availability;
    result.wearTypes = getOptionsForType("wearType").wearTypes;
    result.occasions = getOptionsForType("occasion").occasions;
    result.tags = getOptionsForType("tags").tags;
    result.styles = getOptionsForType("style").styles;
    result.works = getOptionsForType("work").works;
    result.fabrics = getOptionsForType("fabric").fabrics;
    result.productTypes = getOptionsForType("productType").productTypes;

    return result as FilterOptions;
  }, [products, activeFilters]);
};
