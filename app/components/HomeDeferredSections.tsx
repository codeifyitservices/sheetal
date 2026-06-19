"use client";

import dynamic from "next/dynamic";
import DeferredSection from "./DeferredSection";
import type { HomepageSettings } from "../services/homepageService";

const sectionShell = (className: string) => () => (
  <div className={className}>
    <div className="container mx-auto animate-pulse px-4">
      <div className="mx-auto mb-6 h-10 w-64 rounded bg-gray-200" />
      <div className="h-72 rounded-3xl bg-gray-100" />
    </div>
  </div>
);

const TrendingThisWeek = dynamic(() => import("./TrendingThisWeek"), {
  ssr: false,
  loading: sectionShell("px-4 py-12 lg:px-20"),
});
const NewArrivals = dynamic(() => import("./NewArrivals"), {
  ssr: false,
  loading: sectionShell("px-4 py-12 lg:px-20"),
});
const Collections = dynamic(() => import("./Collections"), {
  ssr: false,
  loading: sectionShell("px-4 py-12 lg:px-20"),
});
const TimelessWomenCollection = dynamic(
  () => import("./TimelessWomenCollection"),
  {
    ssr: false,
    loading: sectionShell("px-4 py-12"),
  },
);
const InstagramDiaries = dynamic(() => import("./InstagramDiaries"), {
  ssr: false,
  loading: sectionShell("px-4 py-12 lg:px-20"),
});
const Testimonials = dynamic(() => import("./Testimonials"), {
  ssr: false,
  loading: sectionShell("px-4 py-12"),
});
const Blogs = dynamic(() => import("./Blogs"), {
  ssr: false,
  loading: sectionShell("px-4 py-12"),
});

const HomeDeferredSections = ({ settings }: { settings: HomepageSettings }) => {
  const { sections } = settings;
  return (
    <>
      {sections?.trendingThisWeek && (
        <DeferredSection fallback={sectionShell("px-4 py-12 lg:px-20")()}>
          <TrendingThisWeek content={settings.trendingThisWeek} />
        </DeferredSection>
      )}
      {sections?.newArrivals && (
        <DeferredSection fallback={sectionShell("px-4 py-12 lg:px-20")()}>
          <NewArrivals content={settings.newArrivals} />
        </DeferredSection>
      )}
      {sections?.collections && (
        <DeferredSection fallback={sectionShell("px-4 py-12 lg:px-20")()}>
          <Collections content={settings.collections} />
        </DeferredSection>
      )}
      {sections?.timelessWomenCollection && (
        <DeferredSection fallback={sectionShell("px-4 py-12")()}>
          <TimelessWomenCollection />
        </DeferredSection>
      )}
      {sections?.instagramDiaries && (
        <DeferredSection fallback={sectionShell("px-4 py-12 lg:px-20")()}>
          <InstagramDiaries content={settings.instagramDiaries} />
        </DeferredSection>
      )}
      {sections?.testimonials && (
        <DeferredSection fallback={sectionShell("px-4 py-12")()}>
          <Testimonials content={settings.testimonials} />
        </DeferredSection>
      )}
      {sections?.blogs && (
        <DeferredSection fallback={sectionShell("px-4 py-12")()}>
          <Blogs content={settings.blogs} />
        </DeferredSection>
      )}
    </>
  );
};

export default HomeDeferredSections;
