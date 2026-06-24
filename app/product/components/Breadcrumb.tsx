import React from "react";
import Link from "next/link";

interface BreadcrumbProps {
  title: string;
  categoryName?: string;
  categorySlug?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  title,
  categoryName,
  categorySlug,
}) => {
  return (
    <div className="container mx-auto px-4 md:px-8 py-4 pt-20 md:pt-30">
      <ul className="flex items-center text-xs md:text-sm text-gray-500">
        <li>
          <Link href="/" className="text-[#6a3f07] text-[15px]">
            Home
          </Link>{" "}
          <span className="mx-2">/</span>
        </li>
        <li>
          <Link
            href={
              categorySlug
                ? `/product-list?category=${categorySlug}`
                : "/product-list"
            }
            className="text-[#6a3f07] text-[15px]"
          >
            {categoryName || "Products"}
          </Link>
          <span className="mx-2">/</span>
        </li>
        <li className="text-[#6a3f07] text-[15px] truncate max-w-[200px] md:max-w-none">
          {title}
        </li>
      </ul>
    </div>
  );
};

export default Breadcrumb;
