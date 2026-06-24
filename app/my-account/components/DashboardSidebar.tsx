import React, { useState } from "react";
import Link from "next/link";
import DeleteAccountModal from "./DeleteAccountModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logout } from "../../services/authService";
import { deleteAccount } from "../../services/userService";

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
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sections: SectionItem[] = [
    { name: "Overview", link: "overview" },

    { name: "Orders", type: "header" },
    { name: "Orders & Returns", link: "orders" },

    { name: "Account", type: "header" },
    { name: "Profile", link: "profile" },
    { name: "Edit Profile", link: "edit-profile" },
    { name: "Saved Cards", link: "cards" },
    { name: "Addresses", link: "addresses" },
    { name: "Delete Account", link: "delete-account", isDanger: true },

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteAccount();
      if (res.success) {
        toast.success("Account deleted successfully");
        logout();
        router.push("/");
      } else {
        toast.error(res.message || "Failed to delete account");
      }
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
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
                {section.link === "delete-account" ? (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="block w-full text-left py-2 transition-colors font-medium text-red-600 hover:text-red-700"
                  >
                    {section.name}
                  </button>
                ) : (
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
                )}
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ul>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DashboardSidebar;