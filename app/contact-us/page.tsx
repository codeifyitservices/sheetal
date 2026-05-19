import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import Footer from "../components/Footer";
import ContactUsForm from "./ContactUsForm";

const ContactUs = () => {
  return (
    <>
      <div className="container-fluid p-0 relative overflow-hidden md:mt-[75px] mb-5 text-center">
        <div className="relative">
          <div className="w-full">
            <Image
              src="/assets/841600157.jpg"
              alt="Contact Us Banner"
              width={1920}
              height={600}
              className="w-full h-[360px] object-cover"
              priority
            />
          </div>
          <div className="w-full border-b border-[#ffcf8c] bg-white/80 md:bg-transparent py-5">
            <h1 className="font-optima text-[35px] text-[#6a3f07] font-normal">
              Contact Us
            </h1>
            <div className="text-[#6a3f07]">
              <ul className="inline-block p-0 m-0">
                <li className="inline-block mx-3 relative">
                  <Link href="/" className="text-[#6a3f07] hover:text-[#9c6000]">
                    Home
                  </Link>
                  <span className="absolute -right-[19px] top-0">/</span>
                </li>
                <li className="inline-block mx-3 relative">Contact Us</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid bg-[url('/assets/bg.jpg')] bg-repeat bg-center pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-y-12">
            <div className="w-full text-center max-w-[880px] mx-auto mt-[85px]">
              <div className="relative">
                <div className="content">
                  <div className="relative">
                    <div className="w-full px-2 mb-8">
                      <div className="mb-4">
                        <h2 className="font-optima text-[#6a3f07] relative inline-block before:hidden after:hidden md:before:block md:after:block md:before:content-[''] md:before:w-[60px] md:before:h-[2px] md:before:bg-[#a2690f] md:before:absolute md:before:-left-[85px] md:before:top-1/2 md:after:content-[''] md:after:w-[60px] md:after:h-[2px] md:after:bg-[#a2690f] md:after:absolute md:after:-right-[85px] md:after:top-1/2">
                          Get In Touch
                        </h2>
                      </div>
                      <h5 className="font-[family-name:var(--font-montserrat)] text-[18px] tracking-wider text-[#252525] font-extralight">
                        Please contact us with any questions or concerns.
                      </h5>
                    </div>

                    <div className="flex flex-wrap -mx-4">
                      <div className="w-full lg:w-1/2 px-4 text-left mb-8 lg:mb-0">
                        <div className="border border-dashed border-black p-[33px_20px] mb-0 h-auto md:h-[160px] w-full text-center flex items-center justify-center">
                          <div className="info">
                            <div className="email">
                              <Mail className="mr-[9px] inline-block h-5 w-5" />
                              <h4 className="inline-block text-[#70480c] font-medium text-[24px] font-[family-name:var(--font-montserrat)]">
                                Email:
                              </h4>
                              <p className="font-[family-name:var(--font-montserrat)] text-[15px] text-black mt-2">
                                info@studiobysheetal.com
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-1/2 px-4 text-left">
                        <div className="border border-dashed border-black p-[33px_20px] mb-0 h-auto md:h-[160px] w-full text-center flex items-center justify-center">
                          <div className="info">
                            <div className="email">
                              <Phone className="mr-[9px] inline-block h-5 w-5" />
                              <h4 className="inline-block text-[#70480c] font-medium text-[24px] font-[family-name:var(--font-montserrat)]">
                                Mobile:
                              </h4>
                              <p className="font-[family-name:var(--font-montserrat)] text-[15px] text-black mt-2">
                                +91 99588 13913
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full text-center mt-12 px-4">
                        <h2 className="font-optima text-[#6a3f07] relative inline-block mb-4 before:hidden after:hidden md:before:block md:after:block md:before:content-[''] md:before:w-[60px] md:before:h-[2px] md:before:bg-[#a2690f] md:before:absolute md:before:-left-[85px] md:before:top-1/2 md:after:content-[''] md:after:w-[60px] md:after:h-[2px] md:after:bg-[#a2690f] md:after:absolute md:after:-right-[85px] md:after:top-1/2">
                          Write to us:
                        </h2>
                        <p className="font-[family-name:var(--font-montserrat)] text-black mb-4">
                          Thank you for visiting us. We&apos;d love to hear from you.
                          Please fill in the details below. Our team member will
                          contact you shortly.
                        </p>
                        <p>&nbsp;</p>

                        <ContactUsForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContactUs;
