import { Suspense } from "react";
import Footer from "../components/Footer";
import OtpForm from "./components/OtpForm";

const OtpPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <OtpForm />
      </Suspense>
      <Footer />
    </>
  );
};

export default OtpPage;
