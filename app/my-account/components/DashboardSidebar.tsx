import React from "react";
import Link from "next/link";

interface LinkSectionItem {
  name: string;
  link: string;
  isDanger?: boolean;
}

interface HeaderSectionItem {
  name: string;
  type: "header";
}

type SectionItem = LinkSectionItem | HeaderSectionItem;

const isLinkItem = (item: SectionItem): item is LinkSectionItem => {
  return "link" in item;
};

interface DashboardSidebarProps {
  activeSection: string;
  onSelectSection?: (section: string) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const sections: SectionItem[] = [
    { name: "Overview", link: "overview" },

    { name: "Orders", type: "header" },
    { name: "Orders & Returns", link: "orders" },

    { name: "Account", type: "header" },
    { name: "Profile", link: "profile" },
    { name: "Edit Profile", link: "edit-profile" },
    { name: "Saved Cards", link: "cards" },
    { name: "Addresses", link: "addresses" },

    { name: "Legal", type: "header" },
    { name: "Terms Of Use", link: "terms-conditions" },
    { name: "Privacy Center", link: "privacy-center" },
  ];

  const getHref = (link: string) => {
    if (link === "overview") return "/my-account";
    if (link === "profile") return "/my-account/profile";
    if (link === "edit-profile") return "/my-account/profile/edit";
    return `/my-account/${link}`;
  };

  return (
    // Removed "hidden lg:block" — visibility is now controlled by the parent layout
    <div className="w-full lg:w-56 shrink-0">
      <ul className="space-y-1 text-sm text-gray-800">
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {"type" in section && section.type === "header" ? (
              <>
                <hr className="my-2 border-gray-200" />
                <li className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {section.name}
                </li>
              </>
            ) : isLinkItem(section) ? (
              <li>
                <Link
                  href={getHref(section.link)}
                  onClick={() => onSelectSection?.(section.link)}
                  className={`block py-2 transition-colors font-medium
                    ${
                      activeSection === section.link
                        ? "font-semibold text-[#a97f0f]"
                        : "text-black hover:text-[#a97f0f]"
                    }
                    ${section.isDanger ? "text-red-600 hover:text-red-700" : ""}
                  `}
                >
                  {section.name}
                </Link>
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default DashboardSidebar;