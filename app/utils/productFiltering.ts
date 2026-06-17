import { Product } from "../services/productService";

export interface ActiveFilter {
  label: string;
  type: string;
  value: string;
}

export const applyFilters = (
  products: Product[],
  activeFilters: ActiveFilter[],
  excludeType?: string
): Product[] => {
  if (activeFilters.length === 0) return products;

  const filtersByType = activeFilters.reduce(
    (acc, filter) => {
      if (filter.type === excludeType) return acc;
      if (!acc[filter.type]) acc[filter.type] = [];
      acc[filter.type].push(filter.value);
      return acc;
    },
    {} as Record<string, string[]>
  );

  let filtered = [...products];

  (Object.entries(filtersByType) as [string, string[]][]).forEach(
    ([type, values]) => {
      if (type === "size") {
        filtered = filtered.filter((p) =>
          p.variants?.some((v) =>
            v.sizes?.some((s) => values.includes(s.name))
          )
        );
      } else if (type === "color") {
        filtered = filtered.filter((p) =>
          p.variants?.some((v) => values.includes(v.color?.name ?? ""))
        );
      } else if (type === "price") {
        filtered = filtered.filter((p) =>
          values.some((val) => {
            const [min, max] = val.split("-").map(Number);
            // We need to calculate the lowest price for the product to filter by price
            let lowestPrice = Infinity;
            p.variants?.forEach((variant) => {
              variant.sizes?.forEach((size) => {
                const currentPrice =
                  size.discountPrice && size.discountPrice > 0
                    ? size.discountPrice
                    : size.price;
                if (currentPrice < lowestPrice) {
                  lowestPrice = currentPrice;
                }
              });
            });
            return lowestPrice >= min && (isNaN(max) || lowestPrice <= max);
          })
        );
      } else if (type === "availability") {
        filtered = filtered.filter((p) => {
          return values.some((val) => {
            if (val === "In Stock") return p.stock > 10;
            if (val === "Low Stock (≤10)")
              return p.stock > 0 && p.stock <= 10;
            return false;
          });
        });
      } else if (type === "category") {
        filtered = filtered.filter((p) => {
          return values.includes(p.category?.name ?? "");
        });
      } else if (type === "subCategory") {
        filtered = filtered.filter((p) => {
            return values.includes(p.subCategory ?? "");
        });
      } else {
        filtered = filtered.filter((p) => {
          const productFields = p as Record<string, any>;
          const fieldValue = productFields[type];
          if (typeof fieldValue === "string") {
            return values.includes(fieldValue);
          }
          return (
            Array.isArray(fieldValue) &&
            values.some((val) => fieldValue.includes(val))
          );
        });
      }
    }
  );

  return filtered;
};
