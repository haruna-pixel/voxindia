// Test endpoint to check CORS functionality
import { NextResponse } from "next/server";

export async function OPTIONS(request) {
  console.log('🔧 TEST CORS OPTIONS request received');
  
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
  
  console.log('✅ TEST CORS preflight response sent');
  return response;
}

export async function GET(request) {
  console.log('🔍 TEST GET request received');
  
  const response = NextResponse.json({ 
    success: true, 
    message: 'GET request successful',
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries())
  });
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  console.log('✅ TEST GET response sent');
  return response;
}

export async function POST(request) {
  console.log('🔍 TEST POST request received');
  
  try {
    const body = await request.json();
    console.log('📦 TEST POST body:', body);
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'POST request successful',
      timestamp: new Date().toISOString(),
      receivedData: body,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    console.log('✅ TEST POST response sent');
    return response;
    
  } catch (error) {
    console.error('❌ TEST POST error:', error);
    
    const response = NextResponse.json({ 
      success: false, 
      message: 'POST request failed',
      error: error.message
    }, { status: 400 });
    
    // Add CORS headers even for errors
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }
}