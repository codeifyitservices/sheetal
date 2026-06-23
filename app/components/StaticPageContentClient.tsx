"use client";

import { useEffect, useState } from "react";
import { fetchStaticPageBySlug, type StaticPage } from "../services/staticPageService";
import TiptapJsonRenderer from "./TiptapJsonRenderer";

const hasRenderableContent = (content: unknown) => {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (typeof content === "object") return true;
  return false;
};

const StaticPageBody = ({ content }: { content: unknown }) => {
  if (typeof content === "string") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <TiptapJsonRenderer content={content} />;
};

export default function StaticPageContentClient({
  slug,
  initialPage,
}: {
  slug: string;
  initialPage: StaticPage;
}) {
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    if (hasRenderableContent(initialPage.content)) return;

    let isActive = true;
    const loadPage = async () => {
      const freshPage = await fetchStaticPageBySlug(slug);
      if (isActive && freshPage) setPage(freshPage);
    };

    void loadPage();

    return () => {
      isActive = false;
    };
  }, [initialPage, slug]);

  return <StaticPageBody content={page.content} />;
}
