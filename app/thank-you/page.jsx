"use client";

import React from "react";
import { useRouter } from "next/navigation";

const ThankYouPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1
        className="text-4xl font-bold mb-6 text-center"
        style={{ color: "#e80808" }}
      >
        Thank you for contacting us!
      </h1>
      <p className="text-lg mb-10 text-center" style={{ color: "#e80808" }}>
        We have received your message and will get back to you shortly.
      </p>
      <button
        onClick={() => router.push("/contact")}
        className="px-6 py-3 rounded-lg hover:brightness-90 transition"
        style={{ backgroundColor: "#e80808", color: "white" }}
      >
        Back to Contact Page
      </button>
    </div>
  );
};

export default ThankYouPage;
