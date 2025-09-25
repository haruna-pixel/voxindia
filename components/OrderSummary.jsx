"use client";
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

export default function OrderSummary() {
  const {
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
  } = useAppContext();

  const [showModal, setShowModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gstin: "",
    pincode: "",
    area: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const [originalVerifiedPhone, setOriginalVerifiedPhone] = useState('');
  const [phoneChangeWarning, setPhoneChangeWarning] = useState(false);

  useEffect(() => {
    const initializeAddresses = async () => {
      const raw = localStorage.getItem("user_address");
      let last = null;
      if (raw) {
        last = JSON.parse(raw);
        setForm(last);
        setSelected(last);
      }
      
      // Get user data once to avoid infinite re-renders
      const userPhoneNumber = sessionStorage.getItem('user_phone');
      const isUserVerified = sessionStorage.getItem('otp_verified') === 'true';
      const userName = sessionStorage.getItem('user_name') || '';
      const userEmail = sessionStorage.getItem('user_email') || '';
      
      if (userPhoneNumber && isUserVerified) {
        // Extract phone digits from full phone number (remove +91)
        const phoneDigits = userPhoneNumber.replace('+91', '');
        setOriginalVerifiedPhone(phoneDigits);
        
        if (!last?.phoneNumber) {
          // Pre-fill form with authenticated user data (except email)
          const prefilledForm = {
            ...form,
            fullName: userName || form.fullName || '',
            phoneNumber: phoneDigits,
            email: '', // Don't prefill email - let user input manually
          };
          
          setForm(prefilledForm);
          if (!last) {
            setSelected(prefilledForm);
            localStorage.setItem('user_address', JSON.stringify(prefilledForm));
          }
        }
      }
      
      try {
        const token = await getToken();
        const phone = last?.phoneNumber || userPhoneNumber || "";
        const res = await fetch(
          `/api/user/address?phone=${encodeURIComponent(phone)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) setAddresses(data.addresses);
      } catch (e) {
        console.error("fetch addresses:", e);
      }
    };
    
    initializeAddresses();
  }, []); // Empty dependency array to run only once

  const handleChange = (key, value) => {
    const updatedForm = { ...form, [key]: value };
    
    // Only check phone changes if user is actively editing a NEW phone number
    if (key === 'phoneNumber' && originalVerifiedPhone) {
      const verifiedPhone = sessionStorage.getItem('user_phone');
      
      // Only show warning if phone actually differs from verified phone
      if (verifiedPhone) {
        const currentPhoneWithCountryCode = '+91' + value;
        const phoneChanged = currentPhoneWithCountryCode !== verifiedPhone;
        setPhoneChangeWarning(phoneChanged);
        
        // Only show toast if phone manually changed to a completely different number
        if (phoneChanged && value.length === 10 && value !== originalVerifiedPhone) {
          toast.info('Phone number changed. You\'ll need to verify the new number before checkout.');
        }
      }
    }
    
    setForm(updatedForm);
    localStorage.setItem("user_address", JSON.stringify(updatedForm));
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phoneNumber || !form.email) {
      return toast.error("Name, phone & email are required");
    }
    
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);
      const data = JSON.parse(text);
      setAddresses((prev) => {
        const idx = prev.findIndex((a) => a._id === data.address._id);
        if (idx > -1) {
          prev[idx] = data.address;
          return [...prev];
        }
        return [...prev, data.address];
      });
      setSelected(data.address);
      setForm(data.address);
      toast.success("Address saved");
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addr) => {
    if (!confirm(`Delete address for ${addr.fullName}?`)) return;
    try {
      const token = await getToken();
      const res = await fetch("/api/user/address", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ _id: addr._id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAddresses((prev) => prev.filter((a) => a._id !== addr._id));
      if (selected?._id === addr._id) setSelected(null);
      toast.success("Address deleted");
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const selectAddress = (a) => {
    setSelected(a);
    setForm(a);
    localStorage.setItem("user_address", JSON.stringify(a));
  };

  const createOrder = async () => {
    try {
      console.log('=== PAYMENT FLOW DEBUG START ===');
      
      if (!selected) {
        console.log('❌ No address selected');
        return toast.error("Please select an address");
      }
      
      // Direct sessionStorage check
      const isUserVerified = sessionStorage.getItem('otp_verified') === 'true';
      const userPhoneNumber = sessionStorage.getItem('user_phone');
      
      console.log('📱 Phone verification check:', {
        isUserVerified,
        userPhoneNumber,
        hasUserPhoneNumber: !!userPhoneNumber
      });
      
      if (!isUserVerified || !userPhoneNumber) {
        console.log('❌ Phone verification failed');
        toast.error('Please verify your phone number first');
        return;
      }

      // Prepare cart data
      let cartItemsArray = Object.keys(cartItems).map((key) => ({
        productId: cartItems[key]._id || key,
        variant: cartItems[key].variant || "",
        color: cartItems[key].color || "",
        quantity: cartItems[key]?.quantity || 0,
      }));

      cartItemsArray = cartItemsArray.filter((item) => item.quantity > 0);
      if (cartItemsArray.length === 0) {
        console.log('❌ Cart is empty');
        return toast.error("Cart is empty");
      }

      const token = await getToken();
      console.log('🔐 Token retrieved:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...' || 'none'
      });

      const totalAmount = getCartAmount() + Math.floor(getCartAmount() * 0.02);
      const totalAmountInPaise = Math.floor(totalAmount * 100);

      console.log('💰 Payment calculation:', {
        cartAmount: getCartAmount(),
        totalAmount,
        totalAmountInPaise,
        cartItems: cartItemsArray.length
      });

      // === STEP 1: Try the simplest possible request ===
      console.log('🚀 Making API request to:', window.location.origin + '/api/razorpay/order');
      
      let apiResponse;
      
      try {
        // Method 1: Native fetch (most reliable for CORS)
        console.log('📡 Attempting Method 1: Native fetch...');
        
        const fetchResponse = await fetch('/api/razorpay/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: totalAmountInPaise })
        });
        
        console.log('📡 Fetch response received:', {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          ok: fetchResponse.ok,
          headers: Object.fromEntries(fetchResponse.headers.entries())
        });
        
        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.error('❌ Fetch failed with status:', fetchResponse.status, errorText);
          throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
        }
        
        const responseData = await fetchResponse.json();
        console.log('✅ Fetch successful, response data:', responseData);
        
        apiResponse = { data: responseData };
        
      } catch (fetchError) {
        console.error('❌ Fetch method failed:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          cause: fetchError.cause
        });
        
        // Method 2: Axios fallback
        console.log('📡 Attempting Method 2: Axios fallback...');
        
        try {
          apiResponse = await axios({
            method: 'POST',
            url: '/api/razorpay/order',
            data: { amount: totalAmountInPaise },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 20000,
            withCredentials: false,
            validateStatus: function (status) {
              return status < 500; // Resolve even for 4xx errors
            }
          });
          
          console.log('✅ Axios successful, response:', apiResponse.data);
          
        } catch (axiosError) {
          console.error('❌ Axios method also failed:', {
            name: axiosError.name,
            message: axiosError.message,
            code: axiosError.code,
            response: axiosError.response?.data,
            status: axiosError.response?.status,
            config: {
              url: axiosError.config?.url,
              method: axiosError.config?.method,
              headers: axiosError.config?.headers
            }
          });
          
          // Method 3: XMLHttpRequest as last resort
          console.log('📡 Attempting Method 3: XMLHttpRequest...');
          
          try {
            apiResponse = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              
              xhr.open('POST', '/api/razorpay/order', true);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              
              xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                  console.log('📡 XHR Response:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.responseText,
                    readyState: xhr.readyState
                  });
                  
                  if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                      const data = JSON.parse(xhr.responseText);
                      resolve({ data });
                    } catch (e) {
                      reject(new Error('Failed to parse response: ' + xhr.responseText));
                    }
                  } else {
                    reject(new Error(`XHR failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`));
                  }
                }
              };
              
              xhr.onerror = function() {
                console.error('❌ XHR network error');
                reject(new Error('XHR network error'));
              };
              
              xhr.ontimeout = function() {
                console.error('❌ XHR timeout');
                reject(new Error('XHR timeout'));
              };
              
              xhr.timeout = 20000;
              
              xhr.send(JSON.stringify({ amount: totalAmountInPaise }));
            });
            
            console.log('✅ XHR successful, response:', apiResponse.data);
            
          } catch (xhrError) {
            console.error('❌ All methods failed. XHR error:', xhrError);
            
            // Check if this is a development environment issue
            console.log('🔍 Environment diagnosis:', {
              origin: window.location.origin,
              protocol: window.location.protocol,
              hostname: window.location.hostname,
              port: window.location.port,
              userAgent: navigator.userAgent,
              onLine: navigator.onLine
            });
            
            return toast.error('❌ Unable to connect to payment service. All connection methods failed. Please check your internet connection and try again.');
          }
        }
      }

      // Validate API response
      if (!apiResponse?.data?.success) {
        console.error('❌ API returned error:', apiResponse?.data);
        return toast.error(apiResponse?.data?.message || "Failed to create payment order");
      }

      console.log('✅ Payment order created successfully:', apiResponse.data.order);

      // Check Razorpay public key
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        console.error('❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is missing');
        return toast.error('Payment configuration error. Please contact support.');
      }
      
      console.log('🔑 Razorpay key configured:', {
        hasKey: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        keyLength: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.length
      });

      // Load Razorpay script
      console.log('📜 Loading Razorpay script...');
      const loaded = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          console.log('✅ Razorpay script loaded successfully');
          resolve(true);
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load Razorpay script:', error);
          resolve(false);
        };
        document.body.appendChild(script);
      });
      
      if (!loaded) {
        console.error('❌ Razorpay script loading failed');
        return toast.error("Failed to load Razorpay script. Please check your internet connection.");
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: apiResponse.data.order.amount,
        currency: "INR",
        name: "Voxindia",
        description: "Order Payment",
        order_id: apiResponse.data.order.id,
        handler: async function (response) {
          console.log('💳 Payment successful:', response);
          
          const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
          } = response;

          try {
            const confirm = await axios.post(
              "/api/order/create",
              {
                address: selected,
                items: cartItemsArray,
                paymentMethod: "razorpay",
                totalAmount,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (confirm.data.success) {
              console.log('✅ Order confirmed successfully');
              toast.success("Order placed successfully!");
              setCartItems({});
              router.push("/order-placed");
            } else {
              console.error('❌ Order confirmation failed:', confirm.data);
              toast.error(confirm.data.message || "Order placement failed!");
            }
          } catch (confirmError) {
            console.error('❌ Order confirmation error:', confirmError);
            toast.error("Failed to confirm order. Please contact support.");
          }
        },
        theme: { color: "#f40000" },
        prefill: {
          name: sessionStorage.getItem('user_name') || user?.fullName || "Customer",
          email: "", // Don't prefill email - let user input manually
          contact: sessionStorage.getItem('user_phone')?.replace('+91', '') || selected?.phoneNumber || '',
        },
      };

      console.log('🎛️ Opening Razorpay with options:', {
        key: options.key,
        amount: options.amount,
        orderId: options.order_id,
        name: options.name,
        prefill: options.prefill
      });

      const razorpayObject = new window.Razorpay(options);
      razorpayObject.open();
      
      console.log('=== PAYMENT FLOW DEBUG END ===');
      
    } catch (error) {
      console.error('=== CRITICAL ERROR ===');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      toast.error(`Payment initialization failed: ${error.message}`);
    }
  };

  // Use same format function here too
  function formatINRWithDecimal(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="w-full md:w-96 bg-gradient-to-br from-white/80 via-white/70 to-white/80 p-6 rounded-3xl shadow-xl font-sans">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center tracking-wide">
        Order Summary
      </h2>

      {/* Address Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 text-lg">Delivery Address</h3>
        </div>

        {/* Selected Address Box - Glossy */}
        {selected ? (
          <div className="relative bg-gradient-to-tr from-white/90 to-gray-100/80 border border-gray-300 rounded-2xl p-5 shadow-md select-none cursor-default">
            {/* Edit button top right */}
            <button
              onClick={() => setShowModal(true)}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full px-3 py-1 text-sm font-semibold shadow-md transition"
            >
              Edit
            </button>
            <p className="font-semibold text-gray-800 text-lg">{selected.fullName}</p>
            <p className="text-gray-600 mt-1">{selected.phoneNumber}</p>
            <p className="text-gray-600">{selected.email}</p>
            <p className="text-gray-600 mt-2">
              {selected.area}, {selected.city} — {selected.pincode}
            </p>
            <p className="text-gray-600">{selected.state}</p>
            {selected.gstin && (
              <p className="text-gray-600 mt-1 font-mono text-xs tracking-wider">
                GSTIN: {selected.gstin}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No address selected</p>
        )}
      </div>

      {/* Saved Addresses List */}
      {addresses.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-3">Saved Addresses</h4>
          <ul className="max-h-56 overflow-y-auto space-y-2 border border-gray-300 rounded-xl p-3 bg-white shadow-inner">
            {addresses.map((a) => (
              <li
                key={a._id}
                className={`flex justify-between items-start p-3 rounded-xl transition cursor-pointer select-none
                  ${selected?._id === a._id ? "bg-red-50 border border-red-400" : "hover:bg-gray-100"}`}
                onClick={() => selectAddress(a)}
              >
                <div>
                  <p className="font-semibold text-gray-800">{a.fullName}</p>
                  <p className="text-xs text-gray-600">{a.phoneNumber}</p>
                  <p className="text-xs text-gray-600">
                    {a.area}, {a.city}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(a);
                  }}
                  className="text-gray-400 hover:text-red-600 ml-4 text-xl font-bold"
                  aria-label="Remove address"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Address Button Below List */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold shadow-md transition"
        >
          + Add Address
        </button>
      </div>

      {/* Price Summary */}
      <div className="border-t border-gray-300 pt-5 mb-6 text-gray-700">
        <div className="flex justify-between text-base font-medium">
          <span>Items ({getCartCount()})</span>
          <span>{formatINRWithDecimal(getCartAmount())}</span>
        </div>
        <div className="flex justify-between font-semibold mt-1 text-lg">
          <span>Total</span>
          <span>{formatINRWithDecimal(getCartAmount())}</span>
        </div>
      </div>



      {/* Razorpay Payment Button */}
      <button
        onClick={async () => {
          try {
            console.log('🚀 === SIMPLIFIED PAYMENT FLOW START ===');
            
            if (!selected) {
              console.log('❌ No address selected');
              return toast.error("Please select an address");
            }
            
            // Direct sessionStorage check
            const isUserVerified = sessionStorage.getItem('otp_verified') === 'true';
            const userPhoneNumber = sessionStorage.getItem('user_phone');
            
            console.log('📱 Phone verification check:', {
              isUserVerified,
              userPhoneNumber,
              hasUserPhoneNumber: !!userPhoneNumber
            });
            
            if (!isUserVerified || !userPhoneNumber) {
              console.log('❌ Phone verification failed');
              toast.error('Please verify your phone number first');
              return;
            }

            // Prepare cart data
            let cartItemsArray = Object.keys(cartItems).map((key) => ({
              productId: cartItems[key]._id || key,
              variant: cartItems[key].variant || "",
              color: cartItems[key].color || "",
              quantity: cartItems[key]?.quantity || 0,
            }));

            cartItemsArray = cartItemsArray.filter((item) => item.quantity > 0);
            if (cartItemsArray.length === 0) {
              console.log('❌ Cart is empty');
              return toast.error("Cart is empty");
            }

            // Get user data from sessionStorage for prefill
            const userName = sessionStorage.getItem('user_name') || user?.fullName || 'Customer';
            const userEmail = sessionStorage.getItem('user_email') || user?.email || '';
            const userPhone = sessionStorage.getItem('user_phone')?.replace('+91', '') || selected?.phoneNumber || '';

            const token = await getToken();
            console.log('🔐 Token retrieved:', {
              hasToken: !!token,
              tokenLength: token?.length || 0
            });

            const totalAmount = getCartAmount() + Math.floor(getCartAmount() * 0.02);
            const totalAmountInPaise = Math.floor(totalAmount * 100);

            console.log('💰 Payment calculation:', {
              cartAmount: getCartAmount(),
              totalAmount,
              totalAmountInPaise,
              cartItems: cartItemsArray.length
            });

            // Store payment data and redirect to processing page
            const paymentData = {
              amount: totalAmountInPaise,
              address: selected,
              items: cartItemsArray,
              totalAmount
            };
            
            console.log('📏 Storing payment data...');
            sessionStorage.setItem('payment_data', JSON.stringify(paymentData));
            sessionStorage.setItem('payment_token', token);
            
            console.log('🔄 Redirecting to payment processing page...');
            window.location.href = `/payment-process?amount=${totalAmountInPaise}`;
            
            console.log('🚀 === SIMPLIFIED PAYMENT FLOW END ===');
            
          } catch (error) {
            console.error('=== CRITICAL ERROR ===');
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
            toast.error(`Payment initialization failed: ${error.message}`);
          }
        }}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-3xl font-semibold transition shadow-lg"
      >
        {loading ? "Processing…" : "Pay with Razorpay"}
      </button>

      {/* Add/Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-2xl shadow-2xl w-full max-w-sm relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Add / Edit Address
            </h3>
            <form onSubmit={saveAddress} className="space-y-3">
              {phoneChangeWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span className="text-sm text-yellow-800">
                      Phone number changed. Please verify the new number before proceeding.
                    </span>
                  </div>
                </div>
              )}
              {[
                { k: "fullName", label: "Full Name" },
                { k: "phoneNumber", label: "Phone Number" },
                { k: "email", label: "Email", type: "email" },
                { k: "gstin", label: "GSTIN (opt.)" },
                { k: "pincode", label: "Pin Code" },
                { k: "area", label: "Area & Street" },
                { k: "city", label: "City" },
                { k: "state", label: "State" },
              ].map(({ k, label, type = "text" }) => (
                <div key={k} className="relative">
                  <input
                    type={type}
                    placeholder={label}
                    value={form[k] || ""}
                    onChange={(e) => handleChange(k, e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-red-300 outline-none transition ${
                      k === 'phoneNumber' && phoneChangeWarning
                        ? 'border-yellow-400 bg-yellow-50'
                        : k === 'phoneNumber' && originalVerifiedPhone && form[k] === originalVerifiedPhone
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300'
                    }`}
                    required={k !== "gstin"}
                  />
                  {k === 'phoneNumber' && originalVerifiedPhone && form[k] === originalVerifiedPhone && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">✅</span>
                  )}
                  {k === 'phoneNumber' && phoneChangeWarning && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-600">⚠️</span>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={loading || phoneChangeWarning}
                className={`w-full py-2 rounded-xl font-semibold transition ${
                  loading || phoneChangeWarning
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {loading
                  ? "Saving…"
                  : phoneChangeWarning
                  ? "Phone Verification Required"
                  : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
