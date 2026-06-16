"use client";

import dynamic from "next/dynamic";

const BookAppointmentWidget = dynamic(() => import("./BookAppointmentWidget"), {
  ssr: false,
});

export default function GlobalWidgets() {
  return <BookAppointmentWidget />;
}
