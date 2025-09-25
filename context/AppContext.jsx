"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "INR";
  const router = useRouter();

  const { user } = useUser();
  const { getToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [lastUserId, setLastUserId] = useState(''); // Track current user ID

  // Load cartItems from localStorage first if available
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : {};
    }
    return {};
  });

  // Debounce backend cart sync to avoid too many requests
  const syncTimeout = useRef(null);

  // Clear cart data (used when user switches)
  const clearCart = () => {
    const emptyCart = {};
    setCartItems(emptyCart);
    setUserData(null); // Clear user data as well
    
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(emptyCart));
      // Clear any cached user data
      localStorage.removeItem('user_address');
    }
    
    console.log('🧹 Cart and user data cleared for new user session');
  };

  // Save cartItems to localStorage and schedule backend sync if logged in
  const updateCart = (newCart) => {
    setCartItems(newCart);

    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(newCart));
    }

    if (user) {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(async () => {
        try {
          const token = await getToken();
          await axios.post(
            "/api/cart/update",
            { cartData: newCart },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Cart updated");
        } catch (error) {
          toast.error("Failed to sync cart");
        }
      }, 800); // 800ms debounce
    }
  };

  // Fetch product list
  const fetchProductData = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch user and cart data from backend
  const fetchUserData = async () => {
    try {
      if (user?.publicMetadata?.role === "seller") setIsSeller(true);

      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        if (data.user.cartItems) {
          setCartItems(data.user.cartItems);
          localStorage.setItem("cart", JSON.stringify(data.user.cartItems));
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Helper to create cart key
  const makeCartKey = (productId, variantId, colorName) =>
    [productId, variantId, colorName].filter(Boolean).join("|");

  // Add item to cart (store object with quantity, perPanelSqFt, totalPanelSqFt)
  const addToCart = async (
    productId,
    quantity = 1,
    variantId = null,
    colorName = null,
    perPanelSqFt = 0
  ) => {
    let newCart = { ...cartItems };
    const key = makeCartKey(productId, variantId, colorName);

    if (newCart[key]) {
      // Update existing item quantity and totalPanelSqFt
      const existing = newCart[key];
      const newQty = existing.quantity + quantity;
      newCart[key] = {
        ...existing,
        quantity: newQty,
        totalPanelSqFt: perPanelSqFt * newQty,
        perPanelSqFt,
      };
    } else {
      newCart[key] = {
        quantity,
        perPanelSqFt,
        totalPanelSqFt: perPanelSqFt * quantity,
      };
    }

    updateCart(newCart);
  };

  // Update quantity or remove if quantity <= 0 (update totalPanelSqFt accordingly)
  const updateCartItemQuantity = async (key, quantity) => {
    let newCart = { ...cartItems };

    if (!newCart[key]) return; // item doesn't exist

    if (quantity <= 0) {
      delete newCart[key];
    } else {
      const perPanelSqFt = newCart[key].perPanelSqFt || 0;
      newCart[key] = {
        ...newCart[key],
        quantity,
        totalPanelSqFt: perPanelSqFt * quantity,
      };
    }

    updateCart(newCart);
  };

  // Remove item from cart
  const removeFromCart = async (key) => {
    let newCart = { ...cartItems };
    if (newCart[key]) {
      delete newCart[key];
      updateCart(newCart);
    }
  };

  // Get total count of all cart items (sum quantities)
  const getCartCount = () => {
    return Object.values(cartItems).reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );
  };

  // Get total price considering variants and colors
  const getCartAmount = () => {
    if (!products || products.length === 0) return 0;

    let total = 0;
    for (const key in cartItems) {
      const item = cartItems[key];
      const qty = item.quantity || 0;
      if (qty <= 0) continue;

      const [productId, variantId, colorName] = key.split("|");
      const product = products.find((p) => p._id === productId);
      if (!product) continue;

      const variant =
        product.variants?.find((v) => v._id === variantId) || product.variants?.[0];
      const color =
        variant?.colors?.find((c) => c.name === colorName) || variant?.colors?.[0];

      const price = color?.price ?? product?.offerPrice ?? product?.price ?? 0;

      total += price * qty;
    }

    return Math.round(total * 100) / 100; // rounded to 2 decimals
  };

  // Monitor for user changes and clear data automatically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkUserChange = () => {
      const currentUserId = sessionStorage.getItem('user_phone') || '';
      
      // If we have a previous user and current user is different (not empty)
      if (lastUserId && currentUserId && lastUserId !== currentUserId) {
        console.log(`🔄 DIFFERENT USER DETECTED IN APPCONTEXT:`);
        console.log(`   Previous: ${lastUserId}`);
        console.log(`   Current: ${currentUserId}`);
        console.log(`🧹 Clearing cart data for new user...`);
        
        // Immediately clear cart for new user
        const emptyCart = {};
        setCartItems(emptyCart);
        localStorage.setItem('cart', JSON.stringify(emptyCart));
        setUserData(null);
        
        console.log('✅ Cart cleared for new user');
      } else if (lastUserId && currentUserId && lastUserId === currentUserId) {
        console.log(`✅ SAME USER CONTINUING SESSION: ${currentUserId}`);
        console.log(`   Action: Keeping existing cart data`);
      }
      
      // Update last user ID
      setLastUserId(currentUserId);
    };
    
    // Check on mount
    checkUserChange();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      setTimeout(checkUserChange, 100); // Small delay to ensure sessionStorage is updated
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    
    // Periodic check as backup
    const interval = setInterval(checkUserChange, 1000);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      clearInterval(interval);
    };
  }, [lastUserId]);

  // Initial data fetches
  useEffect(() => {
    fetchProductData();
  }, []);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const value = {
    user,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    cartItems,
    setCartItems: updateCart, // use updateCart to sync localStorage and backend
    clearCart, // Add clearCart function
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    getCartCount,
    getCartAmount,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
