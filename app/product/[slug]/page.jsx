'use client';

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { ChevronDown, ChevronUp, Wrench, Truck, ShieldCheck } from "lucide-react";
import toast from 'react-hot-toast';
import cloudinaryLoader from "@/lib/cloudinaryLoader";

const COLOR_HEX = {
  White: "#ffffff",
  Grey: "#808080",
  Anthracite: "#293133",
  Black: "#000000",
  Mocca: "#837060",
  Natural: "#E1C699",
  "Natural Black": "#1D1D1B",
  Chocolate: "#7B3F00",
};

const WhyChooseUs = () => {
  const items = [
    { icon: <Wrench className="w-8 h-8 mb-2 text-black group-hover:scale-110 transition-transform" />, label: "Free Installation" },
    { icon: <Truck className="w-8 h-8 mb-2 text-black group-hover:scale-110 transition-transform" />, label: "Free Shipping PAN India" },
    { icon: <ShieldCheck className="w-8 h-8 mb-2 text-black group-hover:scale-110 transition-transform" />, label: "2 Years Warranty" },
  ];
  return (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Us</h2>
      <div className="flex flex-col md:flex-row items-center justify-around text-center gap-8">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center group">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const accordionData = [
  {
    id: 1,
    question: "What are VOX Linerio Slat Panels?",
    answer:
      "VOX Linerio Slat Panels are decorative wall panels designed to enhance interior spaces with depth, warmth, and sophistication. They come in three variants—S-Line, M-Line, and L-Line—each differing in the width and depth of the slats. These panels are made from polystyrene, a lightweight and durable material that is 100% recyclable."
  },
  {
    id: 2,
    question: "What are the differences between S-Line, M-Line, and L-Line panels?",
    answer:
      "S-Line: Features narrow slats, providing a subtle texture suitable for minimalist designs.\nM-Line: Offers medium-width slats, balancing subtlety and prominence.\nL-Line: Comprises wide slats, making a bold statement and adding significant depth to walls."
  },
  {
    id: 3,
    question: "In which colors are Linerio panels available?",
    answer:
      "Linerio panels are available in various shades, including Natural, Mocca, Chocolate, White, Grey, Black, and Anthracite."
  },
  {
    id: 4,
    question: "Can Linerio panels be installed in bathrooms or kitchens?",
    answer:
      "Yes, Linerio panels can be installed in damp areas like bathrooms and kitchens. However, they should not be exposed to direct contact with water or installed in areas with temperatures exceeding 60°C, such as saunas or near cookers."
  },
  {
    id: 5,
    question: "How are Linerio panels installed?",
    answer:
      "Linerio panels are designed for easy installation. They can be mounted using adhesive and cut to size using a saw or jigsaw. Installation can be done vertically, horizontally, or diagonally. Visit greatstack.voxindia.co for an installation guide or contact VOX technicians at +91 9528500500 for complex designs."
  },
  {
    id: 6,
    question: "Do Linerio panels improve room acoustics?",
    answer:
      "Yes, the spatial structure of Linerio panels helps to soundproof interiors by eliminating reverberation and echo, especially in larger rooms."
  },
  {
    id: 7,
    question: "Are Linerio panels environmentally friendly?",
    answer:
      "Absolutely. Linerio panels are made from polystyrene, which is 100% recyclable. This makes them an eco-friendly choice for interior wall cladding."
  },
  {
    id: 8,
    question: "What are the dimensions of a single Linerio panel?",
    answer:
      "Each Linerio panel measures 3050 mm in length. The width and thickness vary by type:\nS-Line: 122 mm wide, 12 mm thick\nM-Line: 122 mm wide, 12 mm thick\nL-Line: 122 mm wide, 21 mm thick"
  },
  {
    id: 9,
    question: "Can Linerio panels be used on ceilings?",
    answer:
      "Yes, Linerio panels are versatile and can be installed on both walls and ceilings, allowing for cohesive interior designs."
  },
  {
    id: 10,
    question: "How do I maintain and clean Linerio panels?",
    answer:
      "Linerio panels are easy to maintain. Use a mild detergent and a soft cloth for cleaning. Avoid strong detergents, bleaching agents, solvents, strong acids/bases, or abrasives."
  },
  {
    id: 11,
    question: "Are VOX Linerio Slat Panels suitable for Indian weather conditions?",
    answer:
      "Yes, the panels are made from high-quality polystyrene that is resistant to moisture, heat, and humidity—suitable for Indian climates. They can be used in interiors and semi-humid areas like covered balconies."
  },
  {
    id: 12,
    question: "What are the best rooms to install VOX Linerio Panels in a home?",
    answer:
      "Ideal for living rooms, bedrooms, hallways, offices, and feature walls. Their acoustic benefits suit home theaters and study areas, while moisture resistance makes them suitable for kitchens and covered balconies."
  },
  {
    id: 13,
    question: "Can I use VOX Linerio Panels for commercial interiors?",
    answer:
      "Absolutely. They're widely used in cafes, salons, office lobbies, and showrooms due to their modern look, durability, and easy maintenance."
  },
  {
    id: 14,
    question: "How do VOX Linerio Panels compare to traditional wooden wall panels?",
    answer:
      "VOX Linerio Panels are lightweight, moisture-resistant, and low-maintenance. Unlike wood, they don’t warp, crack, or fade, making them better for humid conditions."
  },
  {
    id: 15,
    question: "Are VOX Linerio Panels customizable in terms of color or finish?",
    answer:
      "VOX offers panels in finishes like Natural Oak, Mocca, Chocolate, White, Grey, and Anthracite. While slat sizes (S, M, L) are fixed, you can choose a finish to match your decor."
  },
  {
    id: 16,
    question: "What is the estimated delivery time for VOX Linerio Slat Panels?",
    answer:
      "Delivery typically takes 8 to 14 working days from order confirmation. Orders ship after 24 hours, and cancellation is not possible post that."
  },
  {
    id: 17,
    question: "What should I do if my VOX Linerio panels arrive damaged?",
    answer:
      "Contact us at +91 9528500500 within 48 hours of delivery. Email photos of the damage and packaging to customercare@voxindia.co with your order details."
  },
  {
    id: 18,
    question: "Is there a warranty on VOX Linerio Panels?",
    answer:
      "Yes, there is a 2-year manufacturer’s warranty against defects in material and workmanship."
  },
  {
    id: 19,
    question: "Are shipping charges included in the product price?",
    answer:
      "Yes, VOX India offers Free Shipping across India on all orders placed via voxindia.co."
  },
  {
    id: 20,
    question: "How will Installation of VOX Linerio Panels work after delivery? Are there extra Installation Charges?",
    answer:
      "VOX India provides Free Installation across India for all orders from voxindia.co. For complex installations, accessories like Linerio Trims (sold separately) may be required. Contact +91 9528500500 post-order for more info."
  }
];

const Accordion = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const toggleAccordion = (i) => {
    setActiveIndex(activeIndex === i ? null : i);
    if (i >= visibleCount - 3 && visibleCount < accordionData.length) {
      setVisibleCount(Math.min(visibleCount + 3, accordionData.length));
    }
  };

  return (
    <div className="max-w-full mt-10 space-y-4 px-4 md:px-8 lg:px-16">
      {accordionData.slice(0, visibleCount).map((item, i) => (
        <div key={item.id} className="border-b border-gray-200 w-full">
          <button
            onClick={() => toggleAccordion(i)}
            className="flex justify-between w-full p-4 bg-gray-100 hover:bg-gray-200 text-left text-lg font-medium text-gray-800 transition-all"
          >
            {item.question}
            {activeIndex === i ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {activeIndex === i && (
            <div className="p-4 text-gray-600 bg-white whitespace-pre-line transition-all duration-300">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function ProductPage() {
  const { slug } = useParams();
  const { addToCart, openSidebar } = useAppContext();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [buyMode, setBuyMode] = useState("panel");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const thumbnailsRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/product/list?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.product) {
          setProductData(data.product);
          const firstColor = data.product.variants?.[0]?.colors?.[0]?.image;
          setMainImage(firstColor || data.product.image?.[0] || "");
        } else {
          setError("Product not found");
        }
      })
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

  const variants = productData.variants || [];
  const currentVariant = variants[selectedVariantIndex] || {};
  const currentColors = currentVariant.colors || [];
  const currentColor = currentColors[selectedColorIndex] || {};
  const basePrice =
    Number(currentColor.price) ||
    Number(productData.offerPrice) ||
    Number(productData.price) ||
    0;
  const displayPrice = buyMode === "box" ? basePrice * 6 : basePrice;
  const discountPercent =
    productData.price &&
      productData.offerPrice &&
      productData.price > productData.offerPrice
      ? Math.round(
        ((productData.price - productData.offerPrice) / productData.price) * 100
      )
      : 0;
  const variantColorImages = variants.flatMap((v) => v.colors).map((c) => c.image);
  const combinedImages = Array.from(
    new Set([...(productData.image || []), ...variantColorImages])
  );

  const selectVariant = (i) => {
    setSelectedVariantIndex(i);
    setSelectedColorIndex(0);
    setQuantity(1);
    const img = variants[i].colors?.[0]?.image;
    setMainImage(img || productData.image[0]);
  };

  const selectColor = (i) => {
    setSelectedColorIndex(i);
    setQuantity(1);
    const img = currentColors[i]?.image;
    setMainImage(img || productData.image[0]);
  };

  const decrementQty = () => setQuantity((q) => Math.max(1, q - 1));
  const incrementQty = () => setQuantity((q) => q + 1);
  const toggleLightbox = () => setIsLightboxOpen((v) => !v);

  const perSqFt = Number(productData.perSqFtPrice);
  const perPanel = Number(productData.perPanelSqFt);
  const totalPanelSqFt = perPanel * quantity;

  const scrollThumbnails = (direction) => {
    if (!thumbnailsRef.current) return;
    const scrollAmount = 100;
    if (direction === "left") {
      thumbnailsRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleAddToCart = () => {
    addToCart(productData._id, quantity, currentVariant._id, currentColor.name);
    toast.success('Item added successfully');
    if (openSidebar) {
      openSidebar();
      return;
    }
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('openCartSidebar'));
    }
  };

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-2 pt-14 space-y-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <div
              onClick={toggleLightbox}
              className="overflow-hidden rounded-lg bg-gray-50 relative w-full h-[450px] group cursor-pointer"
            >
              {mainImage ? (
                <Image
                  loader={cloudinaryLoader}
                  src={mainImage}
                  alt={productData.name}
                  fill
                  priority
                  className="object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 450px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                  No Image
                </div>
              )}
            </div>

            {/* Thumbnails row with navigation buttons */}
            <div className="relative mt-4 flex items-center">
              {/* Left arrow */}
              <button
                onClick={() => scrollThumbnails("left")}
                aria-label="Scroll thumbnails left"
                className="z-20 absolute left-0 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Thumbnails container */}
              <div
                ref={thumbnailsRef}
                className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 scroll-smooth space-x-4 px-10"
                style={{ scrollBehavior: "smooth" }}
              >
                {combinedImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setMainImage(img);
                      const colorIndex = currentColors.findIndex(c => c.image === img);
                      if (colorIndex !== -1) {
                        setSelectedColorIndex(colorIndex);
                      } else {
                        setSelectedColorIndex(-1);
                      }
                      setQuantity(1);
                    }}
                    type="button"
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-transform hover:scale-105 ${mainImage === img ? "border-orange-500" : "border-transparent"
                      }`}
                  >
                    <Image
                      loader={cloudinaryLoader}
                      src={img}
                      alt={`Thumb ${i}`}
                      width={80}
                      height={80}
                      className="object-contain bg-white"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollThumbnails("right")}
                aria-label="Scroll thumbnails right"
                className="z-20 absolute right-0 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-4xl font-semibold">{productData.name}</h1>
            <p className="text-lg text-gray-500 mb-4">
              Color: {currentColor.name || "N/A"}
            </p>
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-3xl font-semibold">₹{displayPrice.toFixed(2)}</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold select-none">
                {discountPercent > 0 ? `${discountPercent}% OFF` : "5% OFF"}
              </span>
              {discountPercent > 0 && (
                <span className="line-through text-lg text-gray-500">
                  ₹{productData.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded shadow text-center">
                <div className="text-xs text-gray-600 mb-1">Per sq.ft</div>
                <div className="font-semibold text-lg">
                  ₹{!isNaN(perSqFt) ? perSqFt.toFixed(2) : "N/A"}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded shadow text-center">
                <div className="text-xs text-gray-600 mb-1">Per panel</div>
                <div className="font-semibold text-lg">
                  {!isNaN(perPanel) ? `${perPanel.toFixed(3)} sq.ft` : "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm font-medium">Select Mode:</span>
              <button
                onClick={() => setBuyMode("panel")}
                className={`px-3 py-1 rounded-full text-sm font-medium ${buyMode === "panel" ? "bg-black text-white" : "bg-gray-200 text-black"
                  }`}
              >
                By Panel
              </button>
            </div>

            <div className="flex space-x-4 mb-6">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => selectVariant(i)}
                  className={`py-2 px-4 border rounded-md font-semibold ${selectedVariantIndex === i
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {v.name}
                </button>
              ))}
            </div>

            <div className="flex space-x-4 mb-6 items-center">
              <span className="font-semibold mr-4">Color:</span>
              {currentColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => selectColor(i)}
                  title={c.name}
                  className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center cursor-pointer ${selectedColorIndex === i ? "ring-2 ring-blue-600" : ""
                    }`}
                  style={{ backgroundColor: COLOR_HEX[c.name] || "#ccc" }}
                >
                  <div className="w-6 h-6 rounded-full" />
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-6 mb-8">
              <div className="flex items-center space-x-4">
                <span className="font-semibold">Quantity:</span>
                <button
                  onClick={decrementQty}
                  className="w-8 h-8 border border-gray-400 rounded text-2xl flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-xl">{quantity}</span>
                <button
                  onClick={incrementQty}
                  className="w-8 h-8 border border-gray-400 rounded text-2xl flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <div className="bg-gray-50 rounded-md shadow px-4 py-2 w-36 text-center">
                <div className="font-semibold text-lg">{totalPanelSqFt.toFixed(3)} sq.ft</div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-black text-white rounded hover:bg-gray-900 transition"
            >
              <span className="inline-flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.97-1.58L23 6H6" />
                </svg>
                <span>Add to Cart</span>
              </span>
            </button>

            <WhyChooseUs />
          </div>
        </div>

        <Accordion />
      </div>

      {isLightboxOpen && (
        <div
          onClick={toggleLightbox}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-zoom-out"
        >
          <img
            src={mainImage}
            alt="Expanded product"
            className="max-w-full max-h-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={toggleLightbox}
            className="absolute top-5 right-5 text-white text-3xl font-bold"
          >
            &times;
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
