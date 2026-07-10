"use client";

import dynamic from "next/dynamic";
import BuyNowTracker from "./BuyNowTracker";

const BookAppointmentWidget = dynamic(() => import("./BookAppointmentWidget"), {
  ssr: false,
});

export default function GlobalWidgets() {
  return (
    <>
      <BuyNowTracker />
      <BookAppointmentWidget />
    </>
  );
}
