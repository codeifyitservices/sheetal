import { Suspense } from "react";
import Footer from "../components/Footer";
import LoginForm from "./components/LoginForm";

const LoginPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
};

export default LoginPage;
