"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBlogs, getBlogImageUrl, Blog } from "../services/blogService";
import type { BlogsContent } from "../services/homepageService";

const DEFAULT_HEADING = "Latest Articles & Blogs";

const Blogs = ({ content }: { content?: BlogsContent }) => {
  const heading = content?.heading?.trim() || DEFAULT_HEADING;
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await getBlogs({ limit: 3, page: 1 });
        if (response.success && response.blogs) {
          setBlogs(response.blogs);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const SectionHeader = () => (
    <div className="text-center mb-10 md:mb-12">
      <div className="flex items-center justify-center gap-4">
        <span className="md:block hidden w-12 h-px bg-[#6a3f07]" />
        <h2 className="font-normal text-[#6a3f07] font-[family-name:var(--font-optima)]">
          {heading}
        </h2>
        <span className="md:block hidden w-12 h-px bg-[#6a3f07]" />
      </div>
    </div>
  );

  // Shared card content (date, title, explore more)
  const BlogCardContent = ({
    href,
    date,
    title,
  }: {
    href: string;
    date: string;
    title: string;
  }) => (
    <div>
      <div className="text-[13px] md:text-[15px] font-[family-name:var(--font-montserrat)] mb-3 font-medium">
        {date}
      </div>
      <h3 className="text-[20px] text-black mb-8 font-[family-name:var(--font-optima)] leading-snug">
        <Link href={href} className="hover:text-[#d18702] transition-colors">
          {title}
        </Link>
      </h3>
      <div className="flex items-center gap-4 mt-4">
        <div className="w-16 h-px bg-black" />
        <Link
          href={href}
          className="inline-block text-[16px] font-[family-name:var(--font-montserrat)] uppercase text-gray-700 pb-0.5 hover:text-[#d18702] hover:border-[#d18702] transition-colors"
        >
          Explore More
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full pb-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader />
          <div className="flex justify-center items-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#d18702] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Static fallback blogs ──────────────────────────────────────────
  const staticBlogs = [
    {
      href: "/blog/banarasi-saree-guide",
      src: "/assets/484942625.jpg",
      alt: "Banarasi Saree",
      date: "December 31, 2024",
      title: "What to Look for When Buying a Banarasi Saree Online",
    },
    {
      href: "/blog/wedding-wardrobe-magic",
      src: "/assets/823107476.jpg",
      alt: "Wedding Wardrobe",
      date: "December 31, 2024",
      title: "How SBS Brings Banarasi Magic to Your Wedding Wardrobe",
    },
    {
      href: "/blog/colour-trends-2025",
      src: "/assets/410718746.jpg",
      alt: "Colour Trends",
      date: "December 31, 2024",
      title:
        "Colour Trends in Sarees for 2025: Jewel Tones from Studio by Sheetal's Festive Collection",
    },
  ];

  if (blogs.length === 0) {
    return (
      <div className="w-full py-16 md:py-24 relative border-t border-[#6a3f07]">
        <div className="container mx-auto px-4">
          <SectionHeader />

          {/* ── MOBILE: vertical stack ── */}
          <div className="flex flex-col gap-8 lg:hidden">
            {staticBlogs.map((blog, i) => (
              <div key={i}>
                <div className="relative w-full h-[240px] overflow-hidden rounded-xl mb-4">
                  <Link href={blog.href} className="block w-full h-full">
                    <Image
                      src={blog.src}
                      alt={blog.alt}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </Link>
                </div>
                <BlogCardContent href={blog.href} date={blog.date} title={blog.title} />
              </div>
            ))}
          </div>

          {/* ── DESKTOP: original overlapping layout ── */}
          <div className="hidden lg:grid grid-cols-2 gap-8 mt-4">
            {/* Left: Featured */}
            <div className="relative w-full group pb-24">
              <div className="relative w-full h-[540px] overflow-hidden rounded-lg">
                <Link href={staticBlogs[0].href} className="block w-full h-full">
                  <Image
                    src={staticBlogs[0].src}
                    alt={staticBlogs[0].alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              </div>
              <div className="absolute bottom-4 left-8 right-8 bg-white/90 shadow-lg rounded-4xl p-5 z-10 translate-y-1/3">
                <BlogCardContent
                  href={staticBlogs[0].href}
                  date={staticBlogs[0].date}
                  title={staticBlogs[0].title}
                />
              </div>
            </div>

            {/* Right: Blog list */}
            <div className="flex flex-col gap-20 mt-0">
              {staticBlogs.slice(1).map((blog, i) => (
                <div key={i} className="relative flex items-stretch min-h-[200px]">
                  <div className="relative w-[62%] shrink-0 overflow-hidden rounded-lg">
                    <Link href={blog.href} className="block w-full h-full">
                      <Image
                        src={blog.src}
                        alt={blog.alt}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </Link>
                  </div>
                  <div className="absolute bottom-5 -right-4 w-80 bg-white/90 shadow-lg rounded-4xl p-5 z-10 translate-y-1/3">
                    <BlogCardContent href={blog.href} date={blog.date} title={blog.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dynamic blogs from API ─────────────────────────────────────────
  const [featuredBlog, ...otherBlogs] = blogs;

  return (
    <div className="w-full pb-16 pt-8 md:py-24 relative border-t border-[#6a3f07]">
      <div className="container mx-auto px-4 md:px-6 lg:px-10">
        <SectionHeader />

        {/* ── MOBILE: vertical stack ── */}
        <div className="flex flex-col gap-8 lg:hidden">
          {blogs.map((blog) => (
            <div key={blog._id}>
              <div className="relative w-full h-[240px] overflow-hidden rounded-xl mb-4">
                <Link href={`/blog/${blog.slug}`} className="block w-full h-full">
                  <Image
                    src={getBlogImageUrl(blog)}
                    alt={blog.imageAlt || blog.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </Link>
              </div>
              <BlogCardContent
                href={`/blog/${blog.slug}`}
                date={formatDate(blog.createdAt)}
                title={blog.title}
              />
            </div>
          ))}
        </div>

        {/* ── DESKTOP: original overlapping layout ── */}
        <div className="hidden lg:grid grid-cols-2 gap-8 mt-4">

          {/* Left: Featured blog */}
          {featuredBlog && (
            <div className="relative w-full group pb-24">
              <div className="relative w-full h-[540px] overflow-hidden rounded-lg">
                <Link href={`/blog/${featuredBlog.slug}`} className="block w-full h-full">
                  <Image
                    src={getBlogImageUrl(featuredBlog)}
                    alt={featuredBlog.imageAlt || featuredBlog.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              </div>
              <div className="absolute bottom-10 left-8 w-[456px] h-[250px] text-[22px] font-optima right-8 bg-white/75 shadow-lg rounded-4xl px-9.5 py-7.5 z-10 translate-y-1/3">
                <BlogCardContent
                  href={`/blog/${featuredBlog.slug}`}
                  date={formatDate(featuredBlog.createdAt)}
                  title={featuredBlog.title}
                />
              </div>
            </div>
          )}

          {/* Right: Blog list */}
          <div className="flex flex-col gap-20 mt-0">
            {otherBlogs.map((blog) => (
              <div key={blog._id} className="relative flex items-stretch min-h-[200px]">
                <div className="relative w-[62%] shrink-0 overflow-hidden rounded-lg">
                  <Link href={`/blog/${blog.slug}`} className="block w-full h-full">
                    <Image
                      src={getBlogImageUrl(blog)}
                      alt={blog.imageAlt || blog.title}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </Link>
                </div>
                <div className="absolute bottom-5 -right-4 w-80 bg-white/90 shadow-lg rounded-4xl p-5 z-10 translate-y-1/3">
                  <BlogCardContent
                    href={`/blog/${blog.slug}`}
                    date={formatDate(blog.createdAt)}
                    title={blog.title}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Blogs;
