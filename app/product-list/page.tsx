import { Metadata } from "next";
import Footer from "../components/Footer";
import ProductListClient from "./ProductListClient";

export const metadata: Metadata = {
  title: "All Products | Studio By Sheetal",
  description: "Browse our complete collection of exquisite sarees, ethnic wear, and designer ensembles at Studio By Sheetal.",
  keywords: "saree collection, designer ethnic wear, luxury sarees, bridal collection, Studio By Sheetal products",
};

const ProductListPage = () => {
  return (
    <>
      <ProductListClient />
      <Footer />
    </>
  );
};

export default ProductListPage;
