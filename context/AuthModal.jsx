'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import usePhoneVerification from '@/hooks/usePhoneVerification';
import { AuthSync } from '@/utils/authSync';
import { ForceRefresh } from '@/utils/forceRefresh';
import cloudinaryLoader from "@/lib/cloudinaryLoader";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function AuthModal({ isOpen, onClose, onVerified }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [originalVerifiedPhone, setOriginalVerifiedPhone] = useState('');

  const {
    isVerified,
    verifiedPhone,
    userName,
    getUserData,
    isPhoneNumberVerified,
    hasPhoneChanged,
    setVerification,
  } = usePhoneVerification();

  const inputsRef = useRef([]);
  const phoneInputRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill with existing verified phone if available
      const userData = getUserData();

      if (userData.phone && userData.isVerified) {
        setPhone(userData.phoneDigits);
        setOriginalVerifiedPhone(userData.phoneDigits);
        setName(userData.name || '');
        setStep('phone'); // Still show phone step but with pre-filled data
      } else {
        setPhone('');
        setOriginalVerifiedPhone('');
        setName('');
      }

      setCode(Array(OTP_LENGTH).fill(''));
      setLoading(false);
      setStatusMsg('');
      setResendTimer(0);

      // Focus the phone input when modal opens
      setTimeout(() => {
        if (step === 'phone' && phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]); // Remove getUserData from dependencies to prevent re-renders

  // Focus management for OTP step
  useEffect(() => {
    if (step === 'otp' && inputsRef.current[0]) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const isPhoneValid = phone.length === 10;
  const otpValue = code.join('');

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Allow only digits and limit to 10 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleOtpChange = (index, value) => {
    // Only allow single digit input
    if (value.length > 1) return;
    if (value && /\D/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input if value is entered and not the last input
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newCode = Array(OTP_LENGTH).fill('');

    // Fill the pasted digits
    for (let i = 0; i < pasted.length && i < OTP_LENGTH; i++) {
      newCode[i] = pasted[i];
    }

    setCode(newCode);

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : OTP_LENGTH - 1;
    inputsRef.current[focusIndex]?.focus();
  };

  const sendOtp = async () => {
    // Check if phone number has changed from original verified number
    const phoneWithCountryCode = '+91' + phone;
    const phoneUnchanged = isPhoneNumberVerified(phoneWithCountryCode);

    // If phone hasn't changed and user is already verified, skip OTP
    if (phoneUnchanged && isVerified) {
      setStatusMsg('Phone number already verified!');
      toast.success('Phone already verified!');
      if (onVerified) onVerified();
      setTimeout(onClose, 700);
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/send-otp', { phone: phoneWithCountryCode });
      sessionStorage.setItem('user_phone', phoneWithCountryCode);
      setStatusMsg('OTP sent successfully!');
      setStep('otp');
      setResendTimer(RESEND_SECONDS);
      setCode(Array(OTP_LENGTH).fill(''));
      toast.success('OTP sent!');
    } catch {
      setStatusMsg('Failed to send OTP.');
      toast.error('Failed to send OTP');
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post('/api/auth/send-otp', { phone: '+91' + phone });
      setStatusMsg('OTP resent!');
      setResendTimer(RESEND_SECONDS);
      setCode(Array(OTP_LENGTH).fill(''));
      toast.success('OTP resent!');
    } catch {
      setStatusMsg('Failed to resend OTP.');
      toast.error('Failed to resend OTP');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (sessionStorage.getItem('otp_verified') === 'true') {
      setStatusMsg('Already verified!');
      toast.success('Already verified!');
      if (onVerified) onVerified();
      onClose();
      return;
    }
    if (otpValue.length < OTP_LENGTH) {
      setStatusMsg('Please enter the 6-digit OTP.');
      toast.error('Enter 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        phone: '+91' + phone,
        otp: otpValue,
        name: name.trim() || undefined,
      });
      if (res.data.success && res.data.user) {
        const { user, token } = res.data;
        const phoneWithCountryCode = '+91' + phone;

        // Check if this is the same user or a different user
        const currentUserPhone = sessionStorage.getItem('user_phone');
        const isSameUser = currentUserPhone === phoneWithCountryCode;

        if (isSameUser) {
          console.log('✅ SAME USER RE-AUTHENTICATING:', phoneWithCountryCode);
          console.log('   Action: Keeping existing data');
        } else {
          console.log('🧹 NEW/DIFFERENT USER LOGIN - Clearing old data for:', phoneWithCountryCode);
          console.log('   Previous user:', currentUserPhone || 'None');

          // Only clear data if it's a different user
          sessionStorage.clear();
          localStorage.removeItem('cart');
          localStorage.removeItem('user_address');
          localStorage.removeItem('user_preferences');
          localStorage.removeItem('cached_products');
          localStorage.removeItem('cached_user_data');

          console.log('✅ Old user data cleared. Setting fresh data for new user.');
        }

        // Set user data (fresh for new user, updated for same user)
        setVerification(
          phoneWithCountryCode,
          user.name || name.trim() || '',
          user.email || ''
        );

        // Also set in sessionStorage for backward compatibility
        sessionStorage.setItem('user_token', token);
        sessionStorage.setItem('user_image', user.imageUrl || '');

        // Notify all tabs about successful authentication with user ID
        const userId = '+91' + phone;
        AuthSync.notifyAuthChange(true, userId);

        // Only verify data clearing for different users
        if (!isSameUser) {
          setTimeout(() => {
            const isClean = ForceRefresh.verifyDataCleaned();
            if (!isClean) {
              console.log('⚠️ Force refresh triggered due to persistent old data');
            }
          }, 500);
        }

        setStatusMsg('OTP verified!');
        toast.success('Verified!');
        if (onVerified) onVerified();
        setTimeout(onClose, 700);
      } else {
        setStatusMsg(res.data.message || 'Invalid OTP.');
        toast.error(res.data.message || 'Invalid OTP');
      }
    } catch {
      setStatusMsg('Invalid OTP.');
      toast.error('Invalid OTP');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-xs sm:max-w-md md:w-96 rounded-xl px-3 sm:px-6 py-4 sm:py-8 relative shadow-2xl flex flex-col"
        style={{ zIndex: 100000 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-800"
        >✕</button>
        <div className="mb-6 flex justify-center">
          <Image loader={cloudinaryLoader} src={assets.logo} alt="Logo" width={64} height={64} />
        </div>
        <h2 className="text-center text-xl font-semibold text-gray-900 mb-1">
          {step === 'phone' ? 'Enter Phone Number' : 'Enter OTP'}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-4">
          {step === 'phone'
            ? originalVerifiedPhone && phone === originalVerifiedPhone
              ? "Phone number verified ✅ (Click continue to proceed)"
              : originalVerifiedPhone && phone !== originalVerifiedPhone
                ? "⚠️ Phone number changed - OTP verification required"
                : "We'll send a code to your number"
            : 'Type the 6-digit code we sent you'}
        </p>
        {statusMsg && (
          <div className="text-center mb-4 text-sm font-medium text-[#e80808] min-h-[22px]">
            {statusMsg}
          </div>
        )}
        {step === 'phone' && (
          <>
            {/* Beautified, never-edge-touching phone input */}
            <div className="w-full mb-4">
              <div className="flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg shadow-sm px-2 py-1 gap-2">
                <span className="text-gray-700 font-medium px-2 py-2 rounded select-none bg-gray-100 border border-gray-200">
                  +91
                </span>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="1234567890"
                  className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-2 text-base"
                  style={{ fontSize: '1rem' }}
                  autoComplete="tel"
                  maxLength="10"
                />
              </div>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-[#e80808] transition"
              autoComplete="name"
              maxLength="50"
            />
          </>
        )}
        {step === 'otp' && (
          <div>
            <div className="flex justify-center mb-4 gap-2" onPaste={handleOtpPaste}>
              {Array(OTP_LENGTH)
                .fill()
                .map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={code[i] || ''}
                    ref={el => (inputsRef.current[i] = el)}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    className="w-10 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e80808] transition"
                    autoComplete="one-time-code"
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !code[i] && i > 0) {
                        inputsRef.current[i - 1]?.focus();
                      }
                      // Allow arrow key navigation
                      if (e.key === 'ArrowLeft' && i > 0) {
                        inputsRef.current[i - 1]?.focus();
                      }
                      if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
                        inputsRef.current[i + 1]?.focus();
                      }
                    }}
                  />
                ))}
            </div>
            <div className="flex justify-center items-center mb-4">
              <button
                type="button"
                onClick={resendOtp}
                className={`text-xs font-semibold underline ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#e80808]'} transition`}
                disabled={resendTimer > 0}
              >
                Resend OTP
              </button>
              {resendTimer > 0 && <span className="ml-2 text-xs text-gray-400">({resendTimer}s)</span>}
            </div>
          </div>
        )}
        <button
          onClick={step === 'phone' ? sendOtp : verifyOtp}
          disabled={loading || (step === 'phone' ? !isPhoneValid : otpValue.length < OTP_LENGTH)}
          className={`w-full py-3 rounded-xl text-white font-medium transition
            ${loading ? 'bg-red-400 cursor-wait' :
              step === 'phone' && originalVerifiedPhone && phone === originalVerifiedPhone
                ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-1 focus:ring-green-600'
                : 'bg-[#e80808] hover:bg-[#cc0606] focus:ring-2 focus:ring-offset-1 focus:ring-[#e80808]'}`}
        >
          {loading
            ? step === 'phone'
              ? 'Sending...'
              : 'Verifying...'
            : step === 'phone'
              ? originalVerifiedPhone && phone === originalVerifiedPhone
                ? 'Continue ✅'
                : 'Send Code'
              : 'Verify OTP'}
        </button>
      </motion.div>
    </div>
  );
}
