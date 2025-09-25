'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AuthSync } from '@/utils/authSync';

export const usePhoneVerification = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Initialize state from sessionStorage
  useEffect(() => {
    const checkVerificationStatus = () => {
      const authStatus = AuthSync.getAuthStatus();
      
      setIsVerified(authStatus.isAuthenticated);
      setVerifiedPhone(authStatus.userPhone);
      setUserName(authStatus.userName);
      setUserEmail(authStatus.userEmail);
    };

    checkVerificationStatus();

    // Handle user switching - clear verification when different user logs in
    const handleUserSwitch = (syncData) => {
      console.log('🔄 User switch detected in phone verification hook, resetting...');
      setIsVerified(false);
      setVerifiedPhone('');
      setUserName('');
      setUserEmail('');
      // Force refresh with new user data
      setTimeout(checkVerificationStatus, 100);
    };

    // Setup auth sync with user switching detection
    const cleanup = AuthSync.setupSync(checkVerificationStatus, handleUserSwitch);
    
    return cleanup;
  }, []);

  // Check if current phone number matches verified phone
  const isPhoneNumberVerified = (phoneNumber) => {
    if (!isVerified || !verifiedPhone) return false;
    
    // Normalize phone numbers for comparison
    const normalizedVerified = verifiedPhone.replace(/\D/g, '');
    const normalizedCurrent = phoneNumber.replace(/\D/g, '');
    
    return normalizedVerified === normalizedCurrent;
  };

  // Check if phone number has changed from verified one
  const hasPhoneChanged = (phoneNumber) => {
    if (!verifiedPhone) return false;
    return !isPhoneNumberVerified(phoneNumber);
  };

  // Clear verification status (when phone changes)
  const clearVerification = () => {
    sessionStorage.removeItem('otp_verified');
    setIsVerified(false);
    toast.info('Phone verification cleared. Please verify your new number.');
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('phoneVerificationUpdate'));
  };

  // Set verification status (when OTP is verified)
  const setVerification = (phone, name = '', email = '') => {
    sessionStorage.setItem('otp_verified', 'true');
    sessionStorage.setItem('user_phone', phone);
    if (name) sessionStorage.setItem('user_name', name);
    if (email) sessionStorage.setItem('user_email', email);
    
    setIsVerified(true);
    setVerifiedPhone(phone);
    setUserName(name);
    setUserEmail(email);
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('phoneVerificationUpdate'));
  };

  // Get user data with defaults
  const getUserData = () => ({
    phone: verifiedPhone,
    phoneDigits: verifiedPhone.replace(/^\+91/, ''),
    name: userName,
    email: userEmail || `${verifiedPhone.replace(/^\+91/, '')}@voxindia.co`,
    isVerified,
  });

  // Validate if user can proceed with checkout
  const canProceedToCheckout = (currentPhone = null) => {
    if (!isVerified) {
      toast.error('Please verify your phone number first');
      return false;
    }

    if (currentPhone && hasPhoneChanged(currentPhone)) {
      toast.error('Phone number has changed. Please verify the new number.');
      return false;
    }

    return true;
  };

  return {
    isVerified,
    verifiedPhone,
    userName,
    userEmail,
    isPhoneNumberVerified,
    hasPhoneChanged,
    clearVerification,
    setVerification,
    getUserData,
    canProceedToCheckout,
  };
};

export default usePhoneVerification;