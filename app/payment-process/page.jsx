"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function PaymentProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  // Validate critical environment variables on component mount
  useEffect(() => {
    console.log('🔍 Initial environment validation...');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Set' : 'Not set',
      env_keys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    });
  }, []);

  useEffect(() => {
    const processPayment = async () => {
      try {
        console.log('🔄 Payment processing page loaded');
        
        // Get payment data from sessionStorage
        const paymentDataStr = sessionStorage.getItem('payment_data');
        const token = sessionStorage.getItem('payment_token');
        const amount = searchParams.get('amount');
        
        if (!paymentDataStr || !token || !amount) {
          throw new Error('Missing payment data. Please try again.');
        }
        
        const paymentData = JSON.parse(paymentDataStr);
        console.log('💰 Payment data loaded:', paymentData);
        
        // Create Razorpay order using server action
        console.log('🚀 Creating payment order...');
        
        const response = await fetch('/api/razorpay/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseInt(amount),
            token: token
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const orderData = await response.json();
        console.log('✅ Order created:', orderData);
        
        if (!orderData.success) {
          throw new Error(orderData.message || 'Failed to create payment order');
        }
        
        // Check Razorpay public key with detailed validation
        console.log('🔍 Validating payment configuration...');
        console.log('🔑 Available environment variables:', {
          NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Present' : 'Missing',
          NODE_ENV: process.env.NODE_ENV,
          typeof_key: typeof process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_length: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.length || 0
        });
        
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
          console.error('❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is missing or undefined');
          console.error('📄 Please check:');
          console.error('1. .env file contains: NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key');
          console.error('2. Development server was restarted after adding the variable');
          console.error('3. Variable name is exactly: NEXT_PUBLIC_RAZORPAY_KEY_ID (case-sensitive)');
          throw new Error('Payment gateway configuration is missing. Please ensure NEXT_PUBLIC_RAZORPAY_KEY_ID is set in environment variables. Check console for details.');
        }
        
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith('rzp_')) {
          console.error('❌ Invalid Razorpay key format:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
          throw new Error('Invalid payment gateway key format. Razorpay keys should start with "rzp_".');
        }
        
        // Load Razorpay script
        console.log('📜 Loading Razorpay script...');
        const scriptLoaded = await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
        
        if (!scriptLoaded) {
          throw new Error('Failed to load Razorpay script. Please check your internet connection.');
        }
        
        console.log('🎛️ Opening Razorpay payment...');
        
        // Get authenticated user's details from sessionStorage
        const userName = sessionStorage.getItem('user_name') || 'Customer';
        const userEmail = sessionStorage.getItem('user_email') || '';
        const userPhone = sessionStorage.getItem('user_phone')?.replace('+91', '') || '';
        
        console.log('📄 User details for Razorpay prefill:', {
          name: userName,
          email: userEmail,
          phone: userPhone
        });
        
        // Configure Razorpay options
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: 'INR',
          name: 'Voxindia',
          description: 'Order Payment',
          order_id: orderData.order.id,
          handler: async function (response) {
            console.log('💳 Payment successful:', response);
            
            try {
              // Confirm order
              const confirmResponse = await fetch('/api/order/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  address: paymentData.address,
                  items: paymentData.items,
                  paymentMethod: 'razorpay',
                  totalAmount: paymentData.totalAmount,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              });
              
              const confirmData = await confirmResponse.json();
              
              if (confirmData.success) {
                console.log('✅ Order confirmed successfully');
                toast.success('Order placed successfully!');
                
                // Store the sequential order ID in localStorage
                if (confirmData.orderId) {
                  localStorage.setItem('last_order_id', confirmData.orderId.toString());
                }
                
                // Clear payment data
                sessionStorage.removeItem('payment_data');
                sessionStorage.removeItem('payment_token');
                
                // Clear cart (if using localStorage)
                localStorage.removeItem('cart');
                
                router.push('/order-placed');
              } else {
                throw new Error(confirmData.message || 'Order confirmation failed!');
              }
            } catch (confirmError) {
              console.error('❌ Order confirmation error:', confirmError);
              toast.error('Failed to confirm order. Please contact support.');
              router.push('/checkout');
            }
          },
          modal: {
            ondismiss: function() {
              console.log('🚫 Payment cancelled by user');
              toast.error('Payment cancelled');
              router.push('/checkout');
            }
          },
          theme: { color: '#f40000' },
          prefill: {
            name: userName,
            email: userEmail,
            contact: userPhone,
          }
        };
        
        console.log('🎛️ Opening Razorpay with prefilled data:', {
          name: options.prefill.name,
          email: options.prefill.email,
          contact: options.prefill.contact
        });
        
        setProcessing(false);
        
        const razorpayObject = new window.Razorpay(options);
        razorpayObject.open();
        
      } catch (err) {
        console.error('❌ Payment processing error:', err);
        setError(err.message);
        setProcessing(false);
        toast.error(err.message);
        
        // Redirect back to checkout after a delay
        setTimeout(() => {
          router.push('/checkout');
        }, 3000);
      }
    };
    
    processPayment();
  }, [router, searchParams]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="animate-spin text-blue-500 text-6xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Processing Payment</h1>
        <p className="text-gray-600 mb-6">
          {processing ? 'Initializing payment gateway...' : 'Opening Razorpay...'}
        </p>
        <div className="flex justify-center">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentProcessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="animate-spin text-blue-500 text-6xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Payment</h1>
        <p className="text-gray-600 mb-6">Preparing payment page...</p>
        <div className="flex justify-center">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={<PaymentProcessFallback />}>
      <PaymentProcessContent />
    </Suspense>
  );
}