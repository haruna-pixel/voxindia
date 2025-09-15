"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", altPhone: "", message: "" });
  const [popup, setPopup] = useState({ visible: false, message: "" });
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closePopup = () => {
    setPopup({ visible: false, message: "" });
  };

  // Prevent background scroll when popup is visible
  useEffect(() => {
    if (popup.visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [popup.visible]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect immediately on success
        setForm({ name: "", email: "", phone: "", altPhone: "", message: "" });
        router.push("/thank-you");
      } else {
        // Show popup on failure
        setPopup({ visible: true, message: "Failed to send message: " + data.message });
      }
    } catch (err) {
      setPopup({ visible: true, message: "Error sending message: " + err.message });
    }
  };

  return (
    <>
      <style>{`
        body, button, input, select, textarea {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
      `}</style>

      <Navbar />

      <section className="min-h-screen px-6 py-16 bg-gray-50 text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-12">Contact Us</h1>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 bg-white p-8 shadow-md rounded-lg"
            >
              <div>
                <label className="block text-sm font-semibold mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Your Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  required
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                  placeholder="Write your message here..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#e80808] text-white py-3 rounded-md hover:bg-[#c10606] transition font-semibold text-lg"
              >
                Send Message
              </button>
            </form>

            {/* Contact Info */}
            <div className="bg-white p-8 shadow-md rounded-lg space-y-6 text-gray-900">
              <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Address</h4>
                <address className="not-italic leading-relaxed">
                  1202, 100-ft Rd, Indiranagar, Bengaluru, KA-560008
                </address>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Phone</h4>
                <a
                  href="tel:+919528500500"
                  className="text-[#e80808] hover:underline font-medium"
                >
                  +91 9528-500-500
                </a>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Email</h4>
                <a
                  href="mailto:customercare@voxindia.co"
                  className="text-[#e80808] hover:underline font-medium"
                >
                  customercare@voxindia.co
                </a>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Hours</h4>
                <p>Monday - Saturday: 10 AM – 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Failure Popup Modal */}
      {popup.visible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={closePopup}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4 text-center shadow-lg border-4 border-[#e80808]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold mb-4 text-[#e80808]">{popup.message}</p>
            <button
              onClick={closePopup}
              className="px-4 py-2 bg-[#e80808] text-white rounded hover:bg-[#c10606] transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactPage;
