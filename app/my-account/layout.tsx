import Footer from "../components/Footer";
import MyAccountLayoutClient from "./MyAccountLayoutClient";

const MyAccountLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MyAccountLayoutClient>{children}</MyAccountLayoutClient>
      <Footer />
    </>
  );
};

export default MyAccountLayout;
