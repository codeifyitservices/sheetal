import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import { getBlogs, type Blog } from "@/app/services/blogService";
import { getApiImageUrl } from "@/app/services/api";

export const metadata: Metadata = {
  title: "Blogs | Studio By Sheetal",
  description: "Read our latest blogs about ethnic wear, styling tips, saree trends, and the stories behind our collections.",
  keywords: "saree blogs, ethnic wear trends, styling tips, Studio By Sheetal blog",
};

type BlogsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const getPageNumber = (rawPage: string | string[] | undefined) => {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const BlogsPage = async ({ searchParams }: BlogsPageProps) => {
  const resolvedSearchParams = (await searchParams) || {};
  const page = getPageNumber(resolvedSearchParams.page);
  const response = await getBlogs({ page, limit: 50 });
  const blogs: Blog[] = response.success ? response.blogs : [];
  const totalPages = response.success ? response.pages : 1;

  return (
    <div className="font-[family-name:var(--font-montserrat)] bg-white">
      <div className="relative w-full h-[300px] md:h-[400px] mt-[40px] md:mt-[75px] overflow-hidden">
        <Image
          src="/assets/690995222.jpg"
          alt="Blogs Banner"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col border-b border-[#ffcf8c] mb-10 justify-center items-center text-center">
        <h1 className="text-4xl md:text-[35px] text-[#6a3f07] mb-2 mt-2 font-[family-name:var(--font-optima)]">
          Blogs
        </h1>
        <nav className="text-gray-600 text-[12px] md:text-[15px] mb-6">
          <Link href="/" className="text-[#6a3f07] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#6a3f07]">Blogs</span>
        </nav>
      </div>

      <div className="container mx-auto px-20 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div
              key={blog._id}
              className="group flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <Link
                href={`/blog/${blog.slug}`}
                className="relative w-full h-75 rounded-2xl aspect-video overflow-hidden"
              >
                <Image
                  src={getApiImageUrl(
                    blog.contentImage || blog.bannerImage,
                    "/assets/default-image.png",
                  )}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              <div className="p-6 flex flex-col flex-grow">
                <div className="text-[15px] font-[family-name:var(--font-montserrat)] text-gray-500 mb-3">
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <h3 className="text-[20px] mb-3 leading-snug font-[family-name:var(--font-montserrat)] line-clamp-2 hover:text-[#bd9951] transition-colors">
                  <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h3>

                <p className="text-[16px] font-[family-name:var(--font-montserrat)] mb-6 line-clamp-3 leading-relaxed flex-grow">
                  {blog.excerpt}
                </p>

                <div>
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="inline-block text-[16px] font-[family-name:var(--font-montserrat)] uppercase text-black border rounded-full py-1.5 px-6 border-black hover:bg-black hover:text-white duration-300 transition-all"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center items-center gap-4">
          <Link
            href={page > 1 ? `/blog?page=${page - 1}` : "/blog"}
            aria-disabled={page === 1}
            className={`px-4 py-2 bg-gray-100 rounded-md text-sm font-semibold ${
              page === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Previous
          </Link>
          <span className="text-sm font-semibold">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/blog?page=${Math.min(page + 1, totalPages)}`}
            aria-disabled={page === totalPages}
            className={`px-4 py-2 bg-gray-100 rounded-md text-sm font-semibold ${
              page === totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Next
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogsPage;
