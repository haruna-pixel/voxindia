// /app/api/razorpay/order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Handle CORS preflight requests
export async function OPTIONS(request) {
  console.log('🔧 OPTIONS request received for CORS preflight');
  
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
  
  console.log('✅ CORS preflight response sent');
  return response;
}

export async function POST(req) {
  const startTime = Date.now();
  console.log('🚀 === RAZORPAY API ROUTE STARTED ===');
  console.log('📍 Request URL:', req.url);
  console.log('🌐 Request method:', req.method);
  console.log('📊 Headers received:', Object.fromEntries(req.headers.entries()));
  
  try {
    // Log environment status
    console.log('🔧 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasRazorpayKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasRazorpayKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
      keySecretLength: process.env.RAZORPAY_KEY_SECRET?.length || 0,
      keyIdStart: process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...' || 'missing'
    });
    
    // Check Content-Type and parse accordingly
    const contentType = req.headers.get('content-type') || '';
    console.log('📦 Content-Type:', contentType);
    
    let body;
    
    // Handle both JSON and form data
    if (contentType.includes('application/json')) {
      console.log('📦 Parsing JSON body...');
      try {
        body = await req.json();
        console.log('✅ JSON body parsed:', body);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON body:', parseError);
        const response = NextResponse.json({ 
          success: false, 
          message: 'Invalid JSON in request body'
        }, { status: 400 });
        
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return response;
      }
    } else {
      // Handle form data
      console.log('📦 Parsing form data...');
      try {
        const formData = await req.formData();
        body = {
          amount: parseInt(formData.get('amount')),
          token: formData.get('token')
        };
        console.log('✅ Form data parsed:', body);
      } catch (parseError) {
        console.error('❌ Failed to parse form data:', parseError);
        const response = NextResponse.json({ 
          success: false, 
          message: 'Invalid form data'
        }, { status: 400 });
        
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return response;
      }
    }
    
    // Extract authorization token
    let authToken = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    } else if (body.token) {
      authToken = body.token;
    }
    
    console.log('🔐 Auth token:', {
      hasAuthHeader: !!authHeader,
      hasTokenInBody: !!body.token,
      hasValidToken: !!authToken,
      tokenLength: authToken?.length || 0
    });
    
    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Missing Razorpay environment variables');
      const response = NextResponse.json({ 
        success: false, 
        message: 'Razorpay configuration error - missing environment variables'
      }, { status: 500 });
      
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    }
    
    // Validate request body
    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      console.error('❌ Invalid amount in request:', body.amount);
      const response = NextResponse.json({ 
        success: false, 
        message: `Invalid amount provided: ${body.amount}`
      }, { status: 400 });
      
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    }

    console.log('🔧 Initializing Razorpay instance...');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay instance created successfully');

    const options = {
      amount: body.amount, // amount in paisa
      currency: "INR",
      receipt: `receipt_order_${Math.random().toString().slice(2, 8)}`,
    };

    console.log('💰 Creating Razorpay order with options:', options);
    
    const orderStartTime = Date.now();
    const order = await instance.orders.create(options);
    const orderEndTime = Date.now();
    
    console.log('✅ Razorpay order created successfully in', (orderEndTime - orderStartTime), 'ms');
    console.log('📄 Order details:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt
    });
    
    const response = NextResponse.json({ success: true, order });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    const totalTime = Date.now() - startTime;
    console.log('🎉 === RAZORPAY API ROUTE COMPLETED SUCCESSFULLY ===');
    console.log('⏱️ Total processing time:', totalTime, 'ms');
    
    return response;
  } catch (err) {
    console.error('=== Razorpay Order Creation Error ===');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Check for specific Razorpay errors
    if (err.statusCode) {
      console.error('Razorpay API error status:', err.statusCode);
      console.error('Razorpay API error details:', err.error);
    }
    
    // Network-related errors
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('Network connectivity issue:', err.code);
      const response = NextResponse.json({ 
        success: false, 
        message: 'Network connectivity issue. Please check your internet connection.'
      }, { status: 503 });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    }
    
    // Timeout errors
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      console.error('Request timeout:', err.code);
      const response = NextResponse.json({ 
        success: false, 
        message: 'Request timeout. Please try again.'
      }, { status: 504 });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    }
    
    // Authentication errors
    if (err.statusCode === 401) {
      console.error('Razorpay authentication failed');
      const response = NextResponse.json({ 
        success: false, 
        message: 'Payment service authentication failed. Please contact support.'
      }, { status: 500 });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    }
    
    const response = NextResponse.json({ 
      success: false, 
      message: err.message || 'Failed to create payment order',
      errorType: err.constructor.name
    }, { status: 500 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }
}
