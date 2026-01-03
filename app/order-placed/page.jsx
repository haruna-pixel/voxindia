'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import cloudinaryLoader from "@/lib/cloudinaryLoader";

const OrderPlaced = () => {
  const { router, cartItems = [], getCartAmount } = useAppContext()
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    // Get the order ID from localStorage (set by the checkout page)
    const storedOrderId = localStorage.getItem('last_order_id')
    if (storedOrderId) {
      setOrderId(storedOrderId)
    }

    const timer = setTimeout(() => {
      router.push('/checkout')
    }, 9000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className='h-screen px-4 py-10 flex flex-col justify-center items-center gap-6 text-center'>
      {/* ✅ Spinner with checkmark */}
      <div className="flex justify-center items-center relative">
        <Image loader={cloudinaryLoader} className="absolute p-5" src={assets.checkmark} alt="Success" />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>

      {/* ✅ Confirmation text */}
      <h1 className="text-2xl font-semibold text-green-700">Order Placed Successfully</h1>

      {/* ✅ Order ID */}
      {orderId && (
        <div className="text-lg">
          <strong>Platform Order ID:</strong> #{orderId}
        </div>
      )}

      {/* ✅ Order Summary */}
      {cartItems.length > 0 && (
        <div className="w-full max-w-xl mt-4 border rounded-lg p-4 bg-white text-left">
          <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between border-b py-2 text-sm">
              <span>{item.name} (x{item.quantity})</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold mt-3 text-base">
            <span>Total Amount:</span>
            <span>₹{getCartAmount()}</span>
          </div>
        </div>
      )}

      {/* ✅ Final message */}
      <p className="mt-6 max-w-md text-gray-600 text-sm">
        📦 Our team will reach out to you within <strong>48 hours</strong> for confirmation of address prior to shipping.
      </p>
    </div>
  )
}

export default OrderPlaced