'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {
  const { currency, getToken, user } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/order/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setOrders(data.orders.reverse());
      } else {
        toast.error(data.message || "Could not fetch orders");
      }
    } catch (error) {
      toast.error(error.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-6 md:px-16 lg:px-2 py-6 min-h-screen">
        <div className="space-y-5">
          <h2 className="text-lg font-medium mt-6">My Orders</h2>
          {loading ? (
            <Loading />
          ) : (
            <div className="max-w-5xl border-t border-gray-300 text-sm">
              {orders.length === 0 ? (
                <p className="p-5 text-gray-500">No orders found.</p>
              ) : (
                orders.map((order, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300">
                    <div className="flex-1 flex gap-5 max-w-80">
                      <Image
                        className="max-w-16 max-h-16 object-cover"
                        src="/box_icon.png"
                        alt="box_icon"
                        width={64}
                        height={64}
                      />
                      <p className="flex flex-col gap-3">
                        <span className="font-medium text-base">
                          {order.items.map((item) => (item?.product?.name || "Unnamed") + ` x ${item.quantity}`).join(", ")}
                        </span>
                        {/* Display sequential order ID if available */}
                        {order.sequentialId && (
                          <span className="text-gray-600">Order ID: #{order.sequentialId}</span>
                        )}
                        <span>Items: {order.items.length}</span>
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">{order.address.fullName}</span>
                        <br />
                        <span>{order.address.area}</span>
                        <br />
                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                        <br />
                        <span>{order.address.phoneNumber}</span>
                      </p>
                    </div>
                    <p className="font-medium my-auto">{currency}{order.amount}</p>
                    <div>
                      <p className="flex flex-col">
                        <span>Method: {order.paymentMethod === 'cod' ? 'COD' : 'Online'}</span>
                        <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>Status: {order.status}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;