import { NextResponse } from 'next/server';
import twilio from 'twilio';
import connectDB from '@/config/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Handle CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req) {
  try {
    console.log('🔍 OTP Verification API called');
    
    // Validate environment variables
    const requiredEnvVars = {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_SERVICE_SID: process.env.TWILIO_SERVICE_SID,
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI: process.env.MONGODB_URI
    };
    
    console.log('🔧 Environment check:', {
      hasAccountSid: !!requiredEnvVars.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!requiredEnvVars.TWILIO_AUTH_TOKEN,
      hasServiceSid: !!requiredEnvVars.TWILIO_SERVICE_SID,
      hasJwtSecret: !!requiredEnvVars.JWT_SECRET,
      hasMongoUri: !!requiredEnvVars.MONGODB_URI,
      serviceSidValue: process.env.TWILIO_SERVICE_SID,
      NODE_ENV: process.env.NODE_ENV
    });
    
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return NextResponse.json(
        { 
          success: false, 
          message: `Server configuration error: Missing ${missingVars.join(', ')}` 
        }, 
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const { phone, otp, name } = await req.json();
    
    console.log('📞 OTP verification request:', {
      phone: phone ? `${phone.substring(0, 6)}****` : 'missing',
      otp: otp ? 'provided' : 'missing',
      name: name ? 'provided' : 'missing'
    });

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone and OTP required' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    // Initialize Twilio client
    console.log('📡 Initializing Twilio client...');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const serviceSid = process.env.TWILIO_SERVICE_SID;
    
    console.log('🔍 Attempting OTP verification with Twilio...');
    const verificationCheck = await client.verify
      .v2.services(serviceSid)
      .verificationChecks
      .create({ to: phone, code: otp });
    
    console.log('✅ Twilio verification response:', {
      status: verificationCheck.status,
      valid: verificationCheck.valid,
      sid: verificationCheck.sid
    });

    if (verificationCheck.status !== 'approved') {
      console.log('❌ OTP verification failed - invalid code');
      return NextResponse.json(
        { success: false, message: 'Invalid OTP' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    console.log('🗄️ Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    const digitsOnly = phone.replace(/^\+/, '');
    const email = `${digitsOnly}@voxindia.co`;
    
    console.log('👤 Creating/updating user:', {
      phoneId: phone,
      email: email,
      hasName: !!name
    });

    const user = await User.findOneAndUpdate(
      { _id: phone },
      { _id: phone, name: name || '', email },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    console.log('✅ User created/updated:', {
      userId: user._id,
      name: user.name,
      email: user.email
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🔑 JWT token generated successfully');

    return NextResponse.json(
      { success: true, user, token },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (error) {
    console.error('❌ [Twilio VERIFY OTP Error]', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      status: error?.status,
      moreInfo: error?.moreInfo,
      stack: error?.stack
    });
    
    // Handle specific Twilio errors
    let errorMessage = 'OTP verification failed';
    let statusCode = 500;
    
    if (error?.code === 20404) {
      errorMessage = 'Twilio Verify Service not found. Please check your Twilio Service SID configuration.';
      console.error('🚨 CRITICAL: Twilio service not found - TWILIO_SERVICE_SID is invalid');
      console.error('🔧 Service SID being used:', process.env.TWILIO_SERVICE_SID);
      console.error('📝 Action required:');
      console.error('   1. Log into Twilio Console');
      console.error('   2. Go to Verify → Services');
      console.error('   3. Create a new service or find existing one');
      console.error('   4. Update TWILIO_SERVICE_SID in production environment');
    } else if (error?.code === 20003) {
      errorMessage = 'Authentication failed. Please contact support.';
      console.error('🚨 Twilio authentication failed - check credentials in production');
    } else if (error?.message?.includes('uri')) {
      errorMessage = 'Database connection failed. Please try again.';
      console.error('🚨 Database URI issue - check MONGODB_URI in production');
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { 
        status: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
