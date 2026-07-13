import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "../../components/Footer";
import BlogBanner from "../components/BlogBanner";
import BlogContent from "../components/BlogContent";
import BlogSidebar from "../components/BlogSidebar";
import {
  getBlogBySlug,
  getBlogs,
  getBlogImageUrl,
} from "@/app/services/blogService";
import { getSeoSettings } from "../../services/seoSettingsService";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const [blogData, seoSettings] = await Promise.all([
      getBlogBySlug(slug, { incrementView: false }),
      getSeoSettings(),
    ]);

    if (!blogData.success || !blogData.data) {
      return {
        title: `Blog Not Found | ${seoSettings?.websiteName || "Studio By Sheetal"}`,
        description: "The requested blog post could not be found.",
      };
    }

    const blog = blogData.data;
    const title =
      blog.metaTitle ||
      `${blog.title} | ${seoSettings?.websiteName || "Studio By Sheetal"}`;
    const description =
      blog.metaDescription ||
      blog.excerpt ||
      seoSettings?.organizationDescription ||
      "";
    const keywords = blog.metaKeywords || blog.tags?.join(", ") || "";
    const canonical =
      blog.canonicalUrl ||
      `${seoSettings?.websiteUrl || "https://studiobysheetal.com"}/blog/${blog.slug || slug}`;
    const imageUrl = blog.ogImage?.url || getBlogImageUrl(blog);

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: seoSettings?.websiteName || "Studio By Sheetal",
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: blog.title,
              },
            ]
          : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: blog.status === "Active" && blog.isPublished,
        follow: true,
      },
    };
  } catch (error) {
    console.error("Error generating blog metadata:", error);
    return {
      title: "Blog | Studio By Sheetal",
      description: "Read the latest stories from Studio By Sheetal.",
    };
  }
}

const BlogDetail = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const [blogData, recentPostsData] = await Promise.all([
    getBlogBySlug(slug),
    getBlogs({ limit: 4 }),
  ]);

  if (!blogData.success || !blogData.data) {
    notFound();
  }

  const blog = blogData.data;
  const recentPosts = recentPostsData.success ? recentPostsData.blogs : [];

   return (
     <div className="font-[family-name:var(--font-montserrat)] bg-white">
       <BlogBanner title={blog.title} image={getBlogImageUrl(blog)} />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <BlogContent blog={blog} />
          </div>

          <div className="lg:col-span-4">
            <BlogSidebar recentPosts={recentPosts} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogDetail;
