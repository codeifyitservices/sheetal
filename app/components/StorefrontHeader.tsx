import { Suspense } from "react";
import TopInfo from "./TopInfo";
import Navbar from "./Navbar";

const TopInfoSkeleton = () => null;
const NavbarSkeleton = () => (
  <div className="fixed left-0 right-0 top-0 z-[1003] h-20 bg-[#082722]/95 backdrop-blur-sm" />
);

const StorefrontHeader = () => {
  return (
    <>
      <Suspense fallback={<TopInfoSkeleton />}>
        <TopInfo />
      </Suspense>
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar />
      </Suspense>
    </>
  );
};

export default StorefrontHeader;
