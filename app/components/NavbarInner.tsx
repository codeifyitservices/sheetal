"use client";
import dynamic from "next/dynamic";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  isAuthenticated,
  logout,
  getUserDetails,
  AUTH_UPDATED_EVENT,
} from "../services/authService";
import toast from "react-hot-toast";
import type { Category } from "../services/categoryService";
import { NavbarNavItem } from "./navbarLayout";
import {
  fetchProducts,
  fetchWishlist,
  getProductImageUrl,
  Product,
} from "../services/productService";
import { fetchCart } from "../services/cartService";
import { buildProductHref } from "../utils/productRoutes";
import {
  CART_ITEM_ADDED_EVENT,
  CART_UPDATED_EVENT,
  CartItemAddedDetail,
  WISHLIST_UPDATED_EVENT,
} from "../hooks/shopEvents";
import { useSettings } from "../hooks/useSettings";
import { getLogoUrl } from "../services/settingsService";

const SearchModal = dynamic(() => import("./SearchModal"), {
  ssr: false,
});

const GUEST_CART_KEY = "guest_cart";

const readGuestCartCount = () => {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return 0;
    const items = JSON.parse(raw) as Array<{ quantity?: number }>;
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  } catch {
    return 0;
  }
};

const scheduleIdleTask = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const requestIdle = window.requestIdleCallback as (
      cb: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    const cancelIdle = window.cancelIdleCallback as (id: number) => void;
    const id = requestIdle(() => callback(), { timeout: 1000 });
    return () => cancelIdle(id);
  }

  const id = globalThis.setTimeout(callback, 250);
  return () => globalThis.clearTimeout(id);
};

const hasTags = (category: Partial<Category>) => {
  return (
    (category.subCategories && category.subCategories.length > 0) ||
    (category.occasion && category.occasion.length > 0) ||
    (category.fabric && category.fabric.length > 0) ||
    (category.style && category.style.length > 0) ||
    (category.work && category.work.length > 0) ||
    (category.wearType && category.wearType.length > 0) ||
    (category.productType && category.productType.length > 0)
  );
};

const megaMenuProductsCache = new Map<string, Product[]>();
const megaMenuProductsRequestCache = new Map<string, Promise<Product[]>>();

const preloadImage = (src: string) => {
  if (typeof window === "undefined" || !src) return;
  const image = new window.Image();
  image.src = src;
};

const fetchLatestMegaMenuProducts = async (categoryId: string) => {
  if (!categoryId) return [];

  const cachedProducts = megaMenuProductsCache.get(categoryId);
  if (cachedProducts) {
    return cachedProducts;
  }

  const pendingRequest = megaMenuProductsRequestCache.get(categoryId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetchProducts({
    category: categoryId,
    limit: 2,
    sort: "-createdAt",
    status: "Active",
  })
    .then((res) => {
      const products = res.success && res.products ? res.products : [];
      megaMenuProductsCache.set(categoryId, products);
      products.forEach((product) => preloadImage(getProductImageUrl(product)));
      return products;
    })
    .catch(() => [])
    .finally(() => {
      megaMenuProductsRequestCache.delete(categoryId);
    });

  megaMenuProductsRequestCache.set(categoryId, request);
  return request;
};

const DynamicMegaMenu = ({
  category,
  handleCloseMegaMenu,
}: {
  category: Partial<Category>;
  handleCloseMegaMenu: () => void;
}) => {
  const { settings } = useSettings();
  const logoUrl = getLogoUrl(settings);

  const tagGroups = [
    {
      title: "Sub Categories",
      items: category.subCategories,
      type: "subCategory",
    },
    { title: "By Occasion", items: category.occasion, type: "occasion" },
    { title: "By Fabric", items: category.fabric, type: "fabric" },
    { title: "By Style", items: category.style, type: "style" },
    { title: "By Work", items: category.work, type: "work" },
    { title: "By Wear Type", items: category.wearType, type: "wearType" },
    {
      title: "By Product Type",
      items: category.productType,
      type: "productType",
    },
  ].filter((g) => g.items && g.items.length > 0);

  const isGrid = tagGroups.length > 3;

  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(() =>
    category._id ? !megaMenuProductsCache.has(category._id) : false,
  );

  useEffect(() => {
    const loadLatestProducts = async () => {
      if (!category._id) {
        setLatestProducts([]);
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingProducts(true);
        const products = await fetchLatestMegaMenuProducts(category._id);
        setLatestProducts(products);
      } catch {
        setLatestProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadLatestProducts();
  }, [category._id]);

  if (!category._id) return null;

  return (
    <div className="bg-white/98 backdrop-blur-md border-t border-gray-200 shadow-2xl">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div
            className={`col-span-8 ${isGrid ? "grid grid-cols-3 gap-y-8" : "grid grid-cols-4 gap-4"}`}
          >
            {tagGroups.map((group, idx) => (
              <div key={idx} className="col-span-1">
                <h3 className="font-semibold text-sm mb-3 text-[#f4be40] uppercase tracking-wide">
                  {group.title}
                </h3>
                <ul className="space-y-2 text-sm">
                  {group.items?.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/${category.slug}?type=${group.type}&value=${encodeURIComponent(tag)}`}
                        className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors capitalize"
                        onClick={handleCloseMegaMenu}
                      >
                        <span className="text-gray-900 text-[20px] leading-none">
                          •
                        </span>
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="col-span-4 grid grid-cols-2 gap-4">
            {loadingProducts ? (
              <>
                <div className="animate-pulse bg-gray-200 h-[250px] rounded-lg"></div>
                <div className="animate-pulse bg-gray-200 h-[250px] rounded-lg"></div>
              </>
            ) : latestProducts.length > 0 ? (
              latestProducts.map((product) => (
                <div key={product._id} className="text-center group/product">
                  <div className="mb-2 overflow-hidden rounded-lg relative">
                    <Link
                      href={buildProductHref(product)}
                      onClick={handleCloseMegaMenu}
                    >
                      <Image
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        width={250}
                        height={300}
                        priority
                        sizes="(min-width: 768px) 250px, 50vw"
                        className="w-full h-[250px] object-cover group-hover/product:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                  <Link
                    href={buildProductHref(product)}
                    onClick={handleCloseMegaMenu}
                  >
                    <p className="font-semibold text-sm text-gray-800 mb-1 hover:text-[#b3a660] transition-colors line-clamp-1">
                      {product.name}
                    </p>
                  </Link>
                  <Link
                    href={buildProductHref(product)}
                    onClick={handleCloseMegaMenu}
                    className="text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Shop Now
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center h-[250px] bg-white rounded-lg border border-gray-100">
                <Image
                  src={logoUrl}
                  alt="Sheetal"
                  width={180}
                  height={120}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface NavbarUserIconProps {
  isClientMounted: boolean;
  isAuthenticatedUser: boolean;
  isUserDropdownOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLogout: () => void;
  getDisplayName: () => string;
}

const NavbarUserIcon: React.FC<NavbarUserIconProps> = ({
  isClientMounted,
  isAuthenticatedUser,
  isUserDropdownOpen,
  onMouseEnter,
  onMouseLeave,
  onLogout,
  getDisplayName,
}) => {
  if (!isClientMounted) {
    return (
      <Link href="/login" className="hover:opacity-80 transition-opacity">
        <Image
          src="/assets/icons/user.svg"
          alt="User"
          width={24}
          height={24}
          className="w-6 h-6"
        />
      </Link>
    );
  }

  if (isAuthenticatedUser) {
    return (
      <div
        className="relative group"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link
          href="/my-account"
          className="hover:opacity-80 transition-opacity"
        >
          <Image
            src="/assets/icons/user.svg"
            alt="User"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </Link>
        {isUserDropdownOpen && (
          <div className="absolute right-0 top-full pt-2 w-48 z-50">
            <div className="bg-[#153427]/95 backdrop-blur-md p-3 border border-[#f5de7e] text-[#b3a660] text-sm shadow-lg">
              <p className="px-3 py-2 border-b border-white/20 truncate">
                Hello, {getDisplayName()}
              </p>
              <Link
                href="/my-account"
                className="block px-3 py-2 hover:text-white transition-colors cursor-pointer"
              >
                My Account
              </Link>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 hover:text-white transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href="/login" className="hover:opacity-80 transition-opacity">
      <Image
        src="/assets/icons/user.svg"
        alt="User"
        width={24}
        height={24}
        className="w-6 h-6"
      />
    </Link>
  );
};

const DesktopMeasureNavItem = ({ item }: { item: NavbarNavItem }) => {
  const hasChildren = item.children && item.children.length > 0;
  const hasDropdownIndicator =
    hasChildren || (item.isCategory && hasTags(item));

  return (
    <span className="h-full px-[19px] !text-[#b3a660] tracking-[1px] text-[16px] inline-flex items-center gap-2 whitespace-nowrap">
      {item.label}
      {hasDropdownIndicator && (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </span>
  );
};

const DesktopMenuItem = ({
  item,
  isMegaOpen,
  onMegaOpen,
  onMegaClose,
}: {
  item: NavbarNavItem;
  isMegaOpen: boolean;
  onMegaOpen: (item: NavbarNavItem) => void;
  onMegaClose: () => void;
}) => {
  if (item.hidden) return null;

  const hasChildren = item.children && item.children.length > 0;
  const isMegaMenu = item.isCategory && hasTags(item);

  return (
    <li
      className="relative group h-full self-stretch flex"
      onMouseEnter={() => {
        if (!isMegaMenu) return;
        if (item._id) {
          void fetchLatestMegaMenuProducts(item._id);
        }
        onMegaOpen(item);
      }}
      onMouseLeave={() => isMegaMenu && onMegaClose()}
    >
      <Link
        href={item.href || "#"}
        className="h-full px-[19px] !text-[#b3a660] tracking-[1px] text-[16px] hover:text-white transition-colors inline-flex items-center gap-2"
      >
        {item.label}
        {(hasChildren || isMegaMenu) && (
          <svg
            className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </Link>

      {/* ✅ Invisible bridge: fills the gap between nav item and mega menu */}
      {isMegaMenu && isMegaOpen && (
        <div className="absolute left-0 right-0 top-full h-[28px]" />
      )}

      {hasChildren && !isMegaMenu && (
        <div className="absolute left-0 top-full pt-4 w-[280px] text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[1005]">
          <ul className="bg-[#153427]/95 backdrop-blur-md p-5 border !border-[#f5de7e] list-none m-0">
            {item.children?.map((child, idx: number) => (
              <DesktopSubMenuItem key={`${child.id}-${idx}`} item={child} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const DesktopSubMenuItem = ({ item }: { item: NavbarNavItem }) => {
  if (item.hidden) return null;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className="relative group/sub border-b border-white/20 last:border-none">
      <Link
        href={item.href || "#"}
        className="block py-2 !text-[#b3a660] hover:text-[#aa8c6a] transition-colors flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-white text-[20px] leading-none">•</span>
          {item.label}
        </span>
        {hasChildren && <span className="-rotate-90 text-[8px]">▼</span>}
      </Link>

      {hasChildren && (
        <div className="absolute right-full top-0 w-full hidden group-hover/sub:block z-[999] pr-1">
          <ul className="bg-[#153427]/95 backdrop-blur-md p-5 border !border-[#f5de7e]">
            {item.children?.map((child, idx: number) => (
              <DesktopSubMenuItem key={`${child.id}-${idx}`} item={child} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const DesktopMoreMenu = ({
  items,
  isOpen,
  onOpen,
  onClose,
}: {
  items: NavbarNavItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  if (!items.length) return null;

  return (
    <li
      className="relative group h-full self-stretch flex"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        className="h-full px-[19px] !text-[#b3a660] tracking-[1px] text-[16px] hover:text-white transition-colors inline-flex items-center gap-2"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        More
        <svg
          className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && <div className="absolute left-0 right-0 top-full h-[28px]" />}

      {isOpen && (
        <div className="absolute right-0 top-full pt-4 w-[280px] text-left z-[1005]">
          <ul className="bg-[#153427]/95 backdrop-blur-md p-5 border !border-[#f5de7e] list-none m-0 max-h-[60vh] overflow-y-auto">
            {items.map((item, idx) => (
              <DesktopSubMenuItem key={`${item.id}-${idx}`} item={item} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const MobileSubMenuView = ({
  item,
  onBack,
  onClose,
}: {
  item: NavbarNavItem;
  onBack: () => void;
  onClose: () => void;
}) => {
  const tagGroups = [
    { title: "Sub Categories", items: item.subCategories, type: "subCategory" },
    { title: "By Occasion", items: item.occasion, type: "occasion" },
    { title: "By Fabric", items: item.fabric, type: "fabric" },
    { title: "By Style", items: item.style, type: "style" },
    { title: "By Work", items: item.work, type: "work" },
    { title: "By Wear Type", items: item.wearType, type: "wearType" },
    { title: "By Product Type", items: item.productType, type: "productType" },
  ].filter((g) => g.items && g.items.length > 0);

  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(() =>
    item._id ? !megaMenuProductsCache.has(item._id) : false,
  );

  useEffect(() => {
    const loadLatestProducts = async () => {
      if (!item.isCategory && !item._id) {
        setLatestProducts([]);
        setLoadingProducts(false);
        return;
      }
      try {
        setLoadingProducts(true);
        const products = await fetchLatestMegaMenuProducts(item._id || "");
        setLatestProducts(products);
      } catch {
        setLatestProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadLatestProducts();
  }, [item._id, item.isCategory]);

  return (
    <div className="flex flex-col h-full w-full bg-[#f9f9f9]">
      <div className="bg-[#082722] p-4 flex items-center justify-between shadow-md shrink-0">
        <button
          onClick={onBack}
          className="text-[#f2bf42] flex items-center gap-2 text-sm font-medium"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h2 className="text-[#f2bf42] font-montserrat tracking-wide capitalize">
          {item.label}
        </h2>
        <button onClick={onClose} className="text-[#f2bf42] text-xl">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f5f5f5]">
        {tagGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="text-[#b3a660] font-montserrat font-medium text-lg mb-3 capitalize">
              {group.title}
            </h3>
            <ul className="space-y-2 pl-1">
              {group.items?.map((tag: string) => (
                <li key={tag}>
                  <Link
                    href={`/${item.slug}?type=${group.type}&value=${encodeURIComponent(tag)}`}
                    className="text-gray-700 font-montserrat hover:text-[#082722] text-base capitalize transition-colors block py-1"
                    onClick={onClose}
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {tagGroups.length === 0 && (
          <div className="text-center py-4">
            <Link
              href={item.href || "#"}
              className="inline-block px-6 py-3 bg-[#082722] text-[#f2bf42] rounded-md"
              onClick={onClose}
            >
              View All {item.label}
            </Link>
          </div>
        )}

        {(loadingProducts || latestProducts.length > 0) && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-[#082722] font-montserrat text-xl mb-4 tracking-wide">
              New Arrivals
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {loadingProducts ? (
                <>
                  <div className="bg-gray-200 h-48 rounded-lg animate-pulse"></div>
                  <div className="bg-gray-200 h-48 rounded-lg animate-pulse"></div>
                </>
              ) : (
                latestProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={buildProductHref(product)}
                    onClick={onClose}
                    className="block group"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-2 bg-gray-100">
                      <Image
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#b3a660] transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                      Shop Now
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileMenuOverlay = ({
  isOpen,
  onClose,
  navItems,
}: {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavbarNavItem[];
}) => {
  const [activeItem, setActiveItem] = useState<NavbarNavItem | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setActiveItem(null), 300);
    }
  }, [isOpen]);

  const handleItemClick = (item: NavbarNavItem) => {
    const hasSubMenu =
      (item.isCategory && hasTags(item)) ||
      (item.children && item.children.length > 0);
    if (hasSubMenu) {
      setActiveItem(item);
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[10000] bg-black/60 transition-opacity duration-300 md:hidden ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <nav
        className={`
          absolute right-0 top-0 h-full w-[85%] max-w-[320px]
          bg-[#082722] shadow-2xl
          transition-transform duration-300 transform
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          overflow-hidden
        `}
      >
        {activeItem ? (
          <MobileSubMenuView
            item={activeItem}
            onBack={() => setActiveItem(null)}
            onClose={onClose}
          />
        ) : (
          <div className="flex flex-col h-full font-montserrat">
            <div className="flex justify-end p-4 shrink-0">
              <button onClick={onClose} className="text-[#f2bf42] text-2xl">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
              {navItems.map((item, idx) => {
                const hasSubMenu =
                  (item.isCategory && hasTags(item)) ||
                  (item.children && item.children.length > 0);
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="border-b border-[#f2bf42]/20 pb-4 last:border-0"
                  >
                    {hasSubMenu ? (
                      <button
                        onClick={() => handleItemClick(item)}
                        className="w-full flex font-montserrat justify-between items-center text-[#f2bf42] text-lg font-medium tracking-wide"
                      >
                        {item.label}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ) : (
                      <Link
                        href={item.href || "#"}
                        className="block text-[#f2bf42] text-lg font-medium font-montserrat tracking-wide"
                        onClick={onClose}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                );
              })}

              <div className="border-b border-[#f2bf42]/20 pb-4">
                <Link
                  href="/blog"
                  onClick={onClose}
                  className="block text-[#f2bf42] text-lg font-medium tracking-wide"
                >
                  Blog
                </Link>
              </div>
              <div className="border-b border-[#f2bf42]/20 pb-4">
                <Link
                  href="/contact-us"
                  onClick={onClose}
                  className="block text-[#f2bf42] text-lg font-medium tracking-wide"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

const NavbarInner = ({
  initialNavItems,
  topInfoEnabled,
}: {
  initialNavItems: NavbarNavItem[];
  topInfoEnabled: boolean;
}) => {
  const { settings } = useSettings();
  const logoUrl = getLogoUrl(settings);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    phoneNumber?: string;
    email?: string;
  } | null>(null);
  const [activeMegaMenuItem, setActiveMegaMenuItem] =
    useState<NavbarNavItem | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartPopupProductName, setCartPopupProductName] = useState("");
  const [isCartPopupHovered, setIsCartPopupHovered] = useState(false);
  const [navbarBottom, setNavbarBottom] = useState(0);
  const [desktopVisibleItems, setDesktopVisibleItems] = useState<
    NavbarNavItem[]
  >(() => initialNavItems);
  const [desktopOverflowItems, setDesktopOverflowItems] = useState<
    NavbarNavItem[]
  >([]);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const cartPopupTimeoutRef = useRef<number | null>(null);
  const cartPopupExpireAtRef = useRef<number | null>(null);
  const cartPopupRemainingMsRef = useRef(5000);
  const itemMeasureRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const moreMeasureRef = useRef<HTMLLIElement | null>(null);
  const navItems = useMemo(() => initialNavItems, [initialNavItems]);
  const pathname = usePathname();
  const wishlistHref = isAuthenticatedUser
    ? "/wishlist"
    : "/login?redirect=/wishlist";

  const syncNavCounts = useCallback(async () => {
    const authenticated = isAuthenticated();
    setIsAuthenticatedUser(authenticated);

    if (!authenticated) {
      setWishlistCount(0);
      setCartItemCount(readGuestCartCount());
      return;
    }

    try {
      const [wishlistResponse, cartResponse] = await Promise.all([
        fetchWishlist(),
        fetchCart(),
      ]);

      setWishlistCount(
        wishlistResponse.success && Array.isArray(wishlistResponse.data)
          ? wishlistResponse.data.length
          : 0,
      );

      setCartItemCount(
        cartResponse.success && Array.isArray(cartResponse.data?.items)
          ? cartResponse.data.items.reduce(
              (total, item) => total + item.quantity,
              0,
            )
          : 0,
      );
    } catch {
      setWishlistCount(0);
      setCartItemCount(readGuestCartCount());
    }
  }, []);

  useEffect(() => {
    setIsClientMounted(true);
    setIsAuthenticatedUser(isAuthenticated());
    const cancelIdle = scheduleIdleTask(() => {
      void syncNavCounts();
    });

    const syncAuthState = () => {
      const authenticated = isAuthenticated();
      setIsAuthenticatedUser(authenticated);
      if (authenticated) {
        setCurrentUser(getUserDetails());
      } else {
        setCurrentUser(null);
        setWishlistCount(0);
        setCartItemCount(readGuestCartCount());
      }

      void syncNavCounts();
    };

    window.addEventListener(AUTH_UPDATED_EVENT, syncAuthState);
    syncAuthState();

    return () => {
      cancelIdle();
      window.removeEventListener(AUTH_UPDATED_EVENT, syncAuthState);
    };
  }, [pathname, syncNavCounts]);

  useEffect(() => {
    const scheduleCartPopupClose = (delay: number) => {
      if (cartPopupTimeoutRef.current) {
        window.clearTimeout(cartPopupTimeoutRef.current);
      }

      cartPopupRemainingMsRef.current = delay;
      cartPopupExpireAtRef.current = Date.now() + delay;
      cartPopupTimeoutRef.current = window.setTimeout(() => {
        setShowCartPopup(false);
        cartPopupTimeoutRef.current = null;
        cartPopupExpireAtRef.current = null;
      }, delay);
    };

    const handleShopStateUpdate = () => {
      void syncNavCounts();
    };

    const handleCartItemAdded = (event: Event) => {
      const customEvent = event as CustomEvent<CartItemAddedDetail>;
      setCartPopupProductName(customEvent.detail?.productName || "");
      setIsCartPopupHovered(false);
      setShowCartPopup(true);
      scheduleCartPopupClose(5000);
    };

    window.addEventListener(CART_UPDATED_EVENT, handleShopStateUpdate);
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleShopStateUpdate);
    window.addEventListener(CART_ITEM_ADDED_EVENT, handleCartItemAdded);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleShopStateUpdate);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleShopStateUpdate);
      window.removeEventListener(CART_ITEM_ADDED_EVENT, handleCartItemAdded);
      if (cartPopupTimeoutRef.current) {
        window.clearTimeout(cartPopupTimeoutRef.current);
      }
      cartPopupExpireAtRef.current = null;
    };
  }, [syncNavCounts]);

  const recalculateDesktopOverflow = useCallback(() => {
    const navContainerWidth = desktopNavRef.current?.clientWidth || 0;

    if (!navContainerWidth || navItems.length === 0) {
      setDesktopVisibleItems(navItems);
      setDesktopOverflowItems([]);
      return;
    }

    const itemWidths = navItems.map(
      (item) => itemMeasureRefs.current[item.id]?.offsetWidth || 0,
    );
    const allItemsWidth = itemWidths.reduce((sum, width) => sum + width, 0);

    if (allItemsWidth <= navContainerWidth) {
      setDesktopVisibleItems(navItems);
      setDesktopOverflowItems([]);
      return;
    }

    const moreWidth = moreMeasureRef.current?.offsetWidth || 0;
    const availableWidth = Math.max(navContainerWidth - moreWidth, 0);
    let consumedWidth = 0;
    let lastVisibleIndex = -1;

    for (let index = 0; index < navItems.length; index += 1) {
      const nextWidth = itemWidths[index];
      if (consumedWidth + nextWidth > availableWidth) {
        break;
      }

      consumedWidth += nextWidth;
      lastVisibleIndex = index;
    }

    if (lastVisibleIndex < 0) {
      setDesktopVisibleItems([]);
      setDesktopOverflowItems(navItems);
      setActiveMegaMenuItem(null);
      return;
    }

    const visibleItems = navItems.slice(0, lastVisibleIndex + 1);
    const overflowItems = navItems.slice(lastVisibleIndex + 1);

    setDesktopVisibleItems(visibleItems);
    setDesktopOverflowItems(overflowItems);
    setActiveMegaMenuItem((currentItem) => {
      if (!currentItem) return null;
      return visibleItems.some((item) => item.id === currentItem.id)
        ? currentItem
        : null;
    });
  }, [navItems]);

  useEffect(() => {
    let ticking = false;

    const updateLayoutState = () => {
      const header = headerRef.current;
      setScrolled(window.scrollY > 50);
      setActiveMegaMenuItem(null);
      if (header) {
        setNavbarBottom(Math.round(header.getBoundingClientRect().bottom));
      }
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateLayoutState);
    };

    requestUpdate();
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("scroll", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("scroll", requestUpdate);
    };
  }, []);

  useEffect(() => {
    recalculateDesktopOverflow();
    window.addEventListener("resize", recalculateDesktopOverflow);

    return () => {
      window.removeEventListener("resize", recalculateDesktopOverflow);
    };
  }, [recalculateDesktopOverflow]);

  useEffect(() => {
    if (desktopOverflowItems.length === 0) {
      setIsMoreMenuOpen(false);
    }
  }, [desktopOverflowItems]);

  const handleMouseEnterUser = () => setIsUserDropdownOpen(true);
  const handleMouseLeaveUser = () => setIsUserDropdownOpen(false);
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    toast.success("You have been logged out.");
    router.push("/login");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);
  const closeSearch = () => setSearchOpen(false);
  const handleCartPopupMouseEnter = () => {
    setIsCartPopupHovered(true);
    if (cartPopupTimeoutRef.current) {
      window.clearTimeout(cartPopupTimeoutRef.current);
      cartPopupTimeoutRef.current = null;
    }

    if (cartPopupExpireAtRef.current) {
      cartPopupRemainingMsRef.current = Math.max(
        0,
        cartPopupExpireAtRef.current - Date.now(),
      );
      cartPopupExpireAtRef.current = null;
    }
  };
  const handleCartPopupMouseLeave = () => {
    setIsCartPopupHovered(false);

    const nextDelay = Math.max(cartPopupRemainingMsRef.current, 250);
    cartPopupRemainingMsRef.current = nextDelay;
    cartPopupExpireAtRef.current = Date.now() + nextDelay;
    cartPopupTimeoutRef.current = window.setTimeout(() => {
      setShowCartPopup(false);
      cartPopupTimeoutRef.current = null;
      cartPopupExpireAtRef.current = null;
    }, nextDelay);
  };
  const closeCartPopup = () => {
    setShowCartPopup(false);
    setIsCartPopupHovered(false);
    if (cartPopupTimeoutRef.current) {
      window.clearTimeout(cartPopupTimeoutRef.current);
      cartPopupTimeoutRef.current = null;
    }
    cartPopupExpireAtRef.current = null;
    cartPopupRemainingMsRef.current = 5000;
  };

  const getDisplayName = () => {
    if (!currentUser) return "Guest";
    if (currentUser.name && currentUser.name.trim() !== "") {
      return currentUser.name.trim().split(" ")[0];
    }
    if (currentUser.phoneNumber) return currentUser.phoneNumber;
    if (currentUser.email)
      return currentUser.email.split("@")[0] || currentUser.email;
    return "User";
  };

  return (
    <>
      <div
        ref={headerRef}
        className={`hidden md:flex md:items-center fixed w-full z-[1003] transition-all duration-300 bg-[#082722]/95 backdrop-blur-sm h-20 font-[family-name:var(--font-montserrat)] ${
          scrolled || !topInfoEnabled ? "top-0 shadow-lg" : "top-[27px]"
        }`}
      >
        <div className="w-full px-6 lg:px-8 xl:px-10">
          <div className="flex justify-between items-center w-full h-full gap-6">
            <Link href="/" className="inline-block shrink-0">
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt="Studio By Sheetal"
                  width={150}
                  height={55}
                  className="h-[55px] w-[150px] object-contain"
                />
              )}
            </Link>

            <div
              ref={desktopNavRef}
              className="flex justify-center items-stretch self-stretch flex-1 min-w-0 mx-4 lg:mx-8 overflow-visible"
            >
              <ul className="m-0 p-0 list-none inline-flex items-stretch self-stretch gap-0 min-w-0">
                {desktopVisibleItems.map((item, idx) => (
                  <DesktopMenuItem
                    key={`${item.id}-${idx}`}
                    item={item}
                    isMegaOpen={activeMegaMenuItem?.id === item.id}
                    onMegaOpen={setActiveMegaMenuItem}
                    onMegaClose={() => setActiveMegaMenuItem(null)}
                  />
                ))}
                <DesktopMoreMenu
                  items={desktopOverflowItems}
                  isOpen={isMoreMenuOpen}
                  onOpen={() => setIsMoreMenuOpen(true)}
                  onClose={() => setIsMoreMenuOpen(false)}
                />
              </ul>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-stretch">
              <button
                onClick={toggleSearch}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Image
                  src="/assets/icons/search.svg"
                  alt="Search"
                  width={24}
                  height={24}
                  className="w-7 h-7"
                />
              </button>
              <NavbarUserIcon
                isClientMounted={isClientMounted}
                isAuthenticatedUser={isAuthenticatedUser}
                isUserDropdownOpen={isUserDropdownOpen}
                onMouseEnter={handleMouseEnterUser}
                onMouseLeave={handleMouseLeaveUser}
                onLogout={handleLogout}
                getDisplayName={getDisplayName}
              />
              <Link
                href={wishlistHref}
                className="relative hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/assets/icons/heart.svg"
                  alt="Wishlist"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1f3c38] border border-[#f1bf42] text-[#f1bf42] text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <Link
                  href="/cart"
                  className="relative hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/assets/icons/shopping-bag.png"
                    alt="Cart"
                    width={24}
                    height={24}
                    className="w-7 h-7"
                  />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#1f3c38] border border-[#f1bf42] text-[#f1bf42] text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                {showCartPopup ? (
                  <div
                    className="absolute right-0 top-[calc(100%+12px)] z-[1100] w-[290px]"
                    onMouseEnter={handleCartPopupMouseEnter}
                    onMouseLeave={handleCartPopupMouseLeave}
                  >
                    <div className="absolute right-4 -top-2 h-4 w-4 rotate-45 border-l border-t border-[#e7d9a7] bg-[#153427]" />
                    <div className="relative rounded-xl border border-[#e7d9a7] bg-[#153427] p-4 pr-10 text-[#f5de7e] shadow-2xl">
                      <button
                        type="button"
                        onClick={closeCartPopup}
                        className="absolute right-3 top-3 text-sm text-[#f5de7e] hover:text-white transition-colors cursor-pointer"
                        aria-label="Close cart popup"
                      >
                        x
                      </button>
                      <p className="text-sm font-medium leading-5">
                        Product added to cart
                      </p>
                      {cartPopupProductName ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[#f3e8be]">
                          {cartPopupProductName}
                        </p>
                      ) : null}
                      <Link
                        href="/cart"
                        onClick={closeCartPopup}
                        className="mt-3 inline-flex items-center rounded-md bg-[#f1bf42] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#082722] transition-colors hover:bg-[#f7cf68]"
                      >
                        View Cart
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-0 -z-10 opacity-0 pointer-events-none">
          <ul className="m-0 p-0 list-none inline-flex items-stretch gap-0">
            {navItems.map((item) => (
              <li
                key={`measure-${item.id}`}
                ref={(node) => {
                  itemMeasureRefs.current[item.id] = node;
                }}
              >
                <DesktopMeasureNavItem item={item} />
              </li>
            ))}
            <li ref={moreMeasureRef}>
              <DesktopMeasureNavItem
                item={{
                  id: "more",
                  label: "More",
                  children: [{ id: "child", label: "child" }],
                }}
              />
            </li>
          </ul>
        </div>

        {activeMegaMenuItem && hasTags(activeMegaMenuItem) && (
          <div
            className="absolute left-0 right-0 top-[calc(100%-1px)] z-[1004] w-full"
            onMouseEnter={() => setActiveMegaMenuItem(activeMegaMenuItem)}
            onMouseLeave={() => setActiveMegaMenuItem(null)}
          >
            <DynamicMegaMenu
              category={activeMegaMenuItem}
              handleCloseMegaMenu={() => setActiveMegaMenuItem(null)}
            />
          </div>
        )}
      </div>

      <header
  className={`md:hidden fixed w-full z-40 bg-[#112f23] backdrop-blur-sm shadow-sm transition-all duration-300 ${
    scrolled || !topInfoEnabled ? "top-0" : "top-[27px]"
  }`}
>
  <div className="px-4 flex justify-between items-center h-[56px]">
    
    {/* Logo */}
    <Link href="/" className="inline-block">
      <Image
        src={logoUrl}
        alt="Studio By Sheetal"
        width={140}
        height={44}
        className="h-[44px] w-[140px] object-contain"
      />
    </Link>

    {/* Icons */}
    <div className="flex items-center gap-1">
      
      {/* Search */}
      <button
        onClick={toggleSearch}
        className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label="Search"
      >
        <Image
          src="/assets/icons/search.svg"
          alt=""
          width={24}
          height={24}
          className="w-8 h-8"
        />
      </button>

      {/* User */}
      <NavbarUserIcon
        isClientMounted={isClientMounted}
        isAuthenticatedUser={isAuthenticatedUser}
        isUserDropdownOpen={isUserDropdownOpen}
        onMouseEnter={handleMouseEnterUser}
        onMouseLeave={handleMouseLeaveUser}
        onLogout={handleLogout}
        getDisplayName={getDisplayName}
      />

      {/* Wishlist */}
      <Link
        href={wishlistHref}
        className="w-10 h-10 flex items-center justify-center relative hover:opacity-80 transition-opacity"
        aria-label="Wishlist"
      >
        <Image
          src="/assets/icons/heart.svg"
          alt=""
          width={24}
          height={24}
          className="w-6 h-6"
        />
        {wishlistCount > 0 && (
          <span className="absolute top-1 right-1 bg-[#1f3c38] border border-[#f1bf42] text-[#f1bf42] text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5 leading-none">
            {wishlistCount}
          </span>
        )}
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className="w-10 h-10 flex items-center justify-center relative hover:opacity-80 transition-opacity"
        aria-label="Cart"
      >
        <Image
          src="/assets/icons/shopping-bag.svg"
          alt=""
          width={2}
          height={24}
          className="w-9 h-9 mb-2"
        />
        {cartItemCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#1f3c38] border border-[#f1bf42] text-[#f1bf42] text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5 leading-none">
            {cartItemCount}
          </span>
        )}
      </Link>

      {/* Hamburger */}
      <button
        onClick={toggleMobileMenu}
        className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label="Open menu"
      >
        <Image
          src="/assets/icons/hambuger.svg"
          width={24}
          height={24}
          alt=""
          className="w-6 h-6"
        />
      </button>

    </div>
  </div>
</header>

      {searchOpen && (
        <SearchModal
          isOpen={searchOpen}
          onClose={closeSearch}
          navbarBottom={navbarBottom}
        />
      )}
      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        navItems={navItems}
      />
    </>
  );
};

export default NavbarInner;
