"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FilterOptions } from "../../hooks/useProductFilters";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { ChevronDown } from "lucide-react";

interface ProductFilterBarProps {
  filtersOpen: boolean;
  toggleFilters: () => void;
  sortByOpen: boolean;
  toggleSortBy: () => void;
  activeFilters: { label: string; type: string; value: string }[];
  removeFilter: (label: string) => void;
  clearFilters: () => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  filterOptions: FilterOptions;
  totalProducts: number;
  onFilterChange: (type: string, value: string) => void;
  onSortChange: (sortOption: string) => void;
  currentSort?: string;
}

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filtersOpen,
  toggleFilters,
  sortByOpen,
  toggleSortBy,
  activeFilters,
  removeFilter,
  clearFilters,
  viewMode,
  setViewMode,
  filterOptions,
  totalProducts,
  onFilterChange,
  onSortChange,
  currentSort = "newest",
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const sortByRef = useRef<HTMLDivElement>(null);

  const isFilterSelected = (type: string, value: string) =>
    activeFilters.some((filter) => filter.type === type && filter.value === value);

  const toggleSection = (id: string) => {
    if (openSections.includes(id)) {
      setOpenSections(openSections.filter((s) => s !== id));
    } else {
      setOpenSections([...openSections, id]);
    }
  };

  const handleSortClick = (option: string) => {
    onSortChange(option);
    toggleSortBy();
  };

  const closeSortByIfOpen = () => {
    if (sortByOpen) toggleSortBy();
  };

  const handleToggleFilters = () => {
    closeSortByIfOpen();
    toggleFilters();
  };

  const handleSetViewMode = (mode: "grid" | "list") => {
    closeSortByIfOpen();
    setViewMode(mode);
  };

  // Close Sort By dropdown when clicking anywhere outside of it
  useEffect(() => {
    if (!sortByOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sortByRef.current && !sortByRef.current.contains(event.target as Node)) {
        toggleSortBy();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortByOpen, toggleSortBy]);

  const showSubCategory =
    (filterOptions.categories?.length <= 1 ||
      activeFilters.some((f) => f.type === "category")) &&
    filterOptions.subCategories.length > 0;

  const AccordionChevron = ({ section }: { section: string }) => (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${openSections.includes(section) ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const CheckboxRow = ({
    id,
    checked,
    onChange,
    label,
    count,
    colorCode,
  }: {
    id: string;
    checked: boolean;
    onChange: () => void;
    label: string;
    count?: number;
    colorCode?: string;
  }) => (
    <div className="flex items-center gap-3 group cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[#bd9951] border-gray-300 rounded cursor-pointer"
      />
      <label
        htmlFor={id}
        className="text-sm cursor-pointer flex items-center gap-2 group-hover:text-black transition-colors font-[family-name:var(--font-montserrat)]"
      >
        {colorCode && (
          <span
            className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: colorCode }}
          />
        )}
        {label}
        {count !== undefined && <span className="text-gray-400">({count})</span>}
      </label>
    </div>
  );

  const FilterSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-300 pb-2 last:border-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full cursor-pointer flex justify-between items-center font-[family-name:var(--font-optima)] font-medium text-base transition-colors text-[15px]"
      >
        {title}
        <AccordionChevron section={id} />
      </button>
      <div
        className={`space-y-2 pt-2 transition-all duration-300 overflow-hidden ${
          openSections.includes(id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Top Filter Bar */}
      <div className="border-t border-b border-[#e7b96bb8] py-3 sm:py-4 md:py-5 mb-4 sm:mb-5 md:mb-6 hidden lg:block">
        <div className="flex items-center justify-between w-full">
          {/* Left: Filters button */}
          <button
            onClick={handleToggleFilters}
            className="flex items-center gap-2 text-md font-[family-name:var(--font-montserrat)] font-normal tracking-wider hover:text-[#bd9951] transition-colors cursor-pointer shrink-0"
          >
            <Image src="/assets/icons/filter.svg" alt="Filter" width={20} height={20} />
            Filters
          </button>

          {/* Center: Sort By */}
          <div className="relative" ref={sortByRef}>
            <button
              onClick={toggleSortBy}
              className="flex cursor-pointer font-[family-name:var(--font-montserrat)] items-center gap-2 text-md font-medium tracking-normal hover:text-[#bd9951] transition-colors"
            >
              <Image
                src="/assets/icons/sort.svg"
                alt="Sort"
                width={20}
                height={20}
                className="w-6 h-6"
              />
              Sort By
              <ChevronDown className="w-6 h-6" />
            </button>

            <div
              className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white shadow-xl border border-gray-100 z-50 py-2 transition-all duration-300 ${
                sortByOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <ul>
                {[
                  { key: "price_asc", label: "Price: Low to High" },
                  { key: "price_desc", label: "Price: High to Low" },
                  { key: "newest", label: "New Arrivals" },
                  { key: "popularity", label: "Popularity" },
                ].map(({ key, label }) => (
                  <li key={key}>
                    <button
                      onClick={() => handleSortClick(key)}
                      className={`block w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                        currentSort === key
                          ? "bg-[#bd9951]/10 text-[#bd9951] font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        {currentSort === key && <span className="text-[#bd9951]">✓</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: View Mode toggles */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-6 shrink-0">
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`transition-opacity cursor-pointer ${viewMode === "grid" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
            >
              <Image src="/assets/icons/grid.svg" alt="Grid" width={18} height={18} />
            </button>
            <button
              onClick={() => handleSetViewMode("list")}
              className={`transition-opacity cursor-pointer ${viewMode === "list" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
            >
              <Image src="/assets/icons/list.svg" alt="List" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${
          filtersOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleFilters}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-full md:w-[300px] bg-white z-[9999] shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          filtersOpen ? "translate-x-0" : "-translate-x-full"
        }
         [scrollbar-width:thin]
         [scrollbar-color:#bd9951_transparent]
         [&::-webkit-scrollbar]:w-1.5
         [&::-webkit-scrollbar-track]:bg-transparent
         [&::-webkit-scrollbar-thumb]:bg-[#bd9951]/30
         [&::-webkit-scrollbar-thumb]:rounded-full
         hover:[&::-webkit-scrollbar-thumb]:bg-[#bd9951]/60`}
      >
        <div className="p-4 sm:p-5 md:p-6">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center pb-3 sm:pb-4">
            <h4 className="text-xl font-medium uppercase tracking-wide">Filters</h4>
            <button
              onClick={toggleFilters}
              className="text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Clear Filters */}
          <div className="mb-3 sm:mb-4 flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-700">
            <span className="text-sm text-gray-500">
              {totalProducts} Product{totalProducts !== 1 ? "s" : ""}
            </span>
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[13px] text-[#d10e00] cursor-pointer underline tracking-wider"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Sections */}
          <div className="space-y-3 sm:space-y-4 font-[family-name:var(--font-montserrat)]">

            {/* Category */}
            {filterOptions.categories?.length > 1 && (
              <FilterSection id="category" title="Category">
                {filterOptions.categories.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-category-${idx}`}
                    checked={isFilterSelected("category", item.label)}
                    onChange={() => onFilterChange("category", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Sub Category — shown when ≥1 category selected; merges all their subcategories */}
            {showSubCategory && (
              <FilterSection id="subCategory" title="Sub Category">
                {filterOptions.subCategories.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-subCategory-${idx}`}
                    checked={isFilterSelected("subCategory", item.label)}
                    onChange={() => onFilterChange("subCategory", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Size */}
            {filterOptions.sizes.length > 0 && (
              <FilterSection id="size" title="Size">
                {filterOptions.sizes.map((size, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-size-${idx}`}
                    checked={isFilterSelected("size", size)}
                    onChange={() => onFilterChange("size", size)}
                    label={size}
                  />
                ))}
              </FilterSection>
            )}

            {/* Color */}
            {filterOptions.colors.length > 0 && (
              <FilterSection id="color" title="Color">
                {filterOptions.colors.map((color, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-color-${idx}`}
                    checked={isFilterSelected("color", color.name)}
                    onChange={() => onFilterChange("color", color.name)}
                    label={color.name}
                    count={color.count}
                    colorCode={color.code}
                  />
                ))}
              </FilterSection>
            )}

            {/* Price */}
            {filterOptions.priceRanges.length > 0 && (
              <div className="border-b border-gray-300 pb-2">
                <button
                  onClick={() => toggleSection("price")}
                  className="w-full cursor-pointer flex justify-between items-center font-[family-name:var(--font-optima)] font-medium text-base transition-colors text-[15px]"
                >
                  Price
                  <AccordionChevron section="price" />
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    openSections.includes("price")
                      ? "max-h-[200px] opacity-100 pt-4"
                      : "max-h-0 opacity-0 pt-2"
                  }`}
                >
                  <PriceRangeSlider
                    min={filterOptions.priceRanges[0]?.min ?? 0}
                    max={
                      filterOptions.priceRanges[filterOptions.priceRanges.length - 1]?.max === Infinity
                        ? (filterOptions.priceRanges[filterOptions.priceRanges.length - 1]?.min ?? 0) + 10000
                        : (filterOptions.priceRanges[filterOptions.priceRanges.length - 1]?.max ?? 10000)
                    }
                    onChange={(min: number, max: number) =>
                      onFilterChange("price", `${min}-${max}`)
                    }
                  />
                </div>
              </div>
            )}

            {/* Availability */}
            {filterOptions.availability.length > 0 && (
              <FilterSection id="availability" title="Availability">
                {filterOptions.availability.map((avail, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-availability-${idx}`}
                    checked={isFilterSelected("availability", avail.label)}
                    onChange={() => onFilterChange("availability", avail.label)}
                    label={avail.label}
                    count={avail.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Wear Type */}
            {filterOptions.wearTypes.length > 0 && (
              <FilterSection id="wearType" title="Wear Type">
                {filterOptions.wearTypes.map((wearType, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-wearType-${idx}`}
                    checked={isFilterSelected("wearType", wearType.label)}
                    onChange={() => onFilterChange("wearType", wearType.label)}
                    label={toSentenceCase(wearType.label)}
                    count={wearType.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Occasion */}
            {filterOptions.occasions.length > 0 && (
              <FilterSection id="occasion" title="Occasion">
                {filterOptions.occasions.map((occasion, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-occasion-${idx}`}
                    checked={isFilterSelected("occasion", occasion.label)}
                    onChange={() => onFilterChange("occasion", occasion.label)}
                    label={toSentenceCase(occasion.label)}
                    count={occasion.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Tags */}
            {filterOptions.tags.length > 0 && (
              <FilterSection id="tags" title="Tags">
                {filterOptions.tags.map((tag, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-tag-${idx}`}
                    checked={isFilterSelected("tags", tag.label)}
                    onChange={() => onFilterChange("tags", tag.label)}
                    label={toSentenceCase(tag.label)}
                    count={tag.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Style */}
            {filterOptions.styles.length > 0 && (
              <FilterSection id="style" title="Style">
                {filterOptions.styles.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-style-${idx}`}
                    checked={isFilterSelected("style", item.label)}
                    onChange={() => onFilterChange("style", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Work */}
            {filterOptions.works.length > 0 && (
              <FilterSection id="work" title="Work">
                {filterOptions.works.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-work-${idx}`}
                    checked={isFilterSelected("work", item.label)}
                    onChange={() => onFilterChange("work", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Fabric */}
            {filterOptions.fabrics.length > 0 && (
              <FilterSection id="fabric" title="Fabric">
                {filterOptions.fabrics.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-fabric-${idx}`}
                    checked={isFilterSelected("fabric", item.label)}
                    onChange={() => onFilterChange("fabric", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

            {/* Product Type */}
            {filterOptions.productTypes.length > 0 && (
              <FilterSection id="productType" title="Product Type">
                {filterOptions.productTypes.map((item, idx) => (
                  <CheckboxRow
                    key={idx}
                    id={`f-productType-${idx}`}
                    checked={isFilterSelected("productType", item.label)}
                    onChange={() => onFilterChange("productType", item.label)}
                    label={toSentenceCase(item.label)}
                    count={item.count}
                  />
                ))}
              </FilterSection>
            )}

          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 py-3">
          {activeFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => removeFilter(filter.label)}
              className="inline-flex items-center gap-2 px-2 py-0.5 bg-white border border-black rounded-full text-[13px] hover:bg-gray-50 hover:border-[#bd9951] transition-all group cursor-pointer"
            >
              <span className="font-normal capitalize">{filter.label}</span>
              <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[#bd9951] bg-[#bd9951]/10 group-hover:bg-[#bd9951]/20 transition-colors">
                <svg
                  className="w-2.5 h-2.5 text-[#bd9951] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-[13px] text-orange-600 cursor-pointer bg-gray-100 px-1 hover:text-orange-700 underline ml-2 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </>
  );
};

export default ProductFilterBar;