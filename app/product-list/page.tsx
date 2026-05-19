import Footer from "../components/Footer";
import ProductListClient from "./ProductListClient";

interface ProductListPageProps {
  categorySlug?: string;
}

const ProductListPage = ({ categorySlug }: ProductListPageProps) => {
  return (
    <>
      <ProductListClient categorySlug={categorySlug} />
      <Footer />
    </>
  );
};

export default ProductListPage;
