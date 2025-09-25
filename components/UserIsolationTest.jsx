/**
 * User Isolation Test Component
 * Add this to any page to test user switching functionality
 */

import React from 'react';
import { AuthSync } from '@/utils/authSync';
import { ForceRefresh } from '@/utils/forceRefresh';
import toast from 'react-hot-toast';

export default function UserIsolationTest() {
  const testUserSwitch = () => {
    const testUsers = [
      { phone: '+919876543210', name: 'Test User A' },
      { phone: '+918765432109', name: 'Test User B' },
      { phone: '+917654321098', name: 'Test User C' }
    ];
    
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    console.log(`🧪 TESTING: Simulating login for ${randomUser.name} (${randomUser.phone})`);
    
    // Clear everything first
    console.log('🧹 Step 1: Clearing all old data...');
    sessionStorage.clear();
    localStorage.removeItem('cart');
    localStorage.removeItem('user_address');
    
    // Simulate new user login
    console.log('➕ Step 2: Setting new user data...');
    sessionStorage.setItem('otp_verified', 'true');
    sessionStorage.setItem('user_phone', randomUser.phone);
    sessionStorage.setItem('user_name', randomUser.name);
    sessionStorage.setItem('user_email', `test${randomUser.phone.slice(-4)}@example.com`);
    
    // Notify all tabs about user switch
    console.log('📢 Step 3: Notifying all tabs...');
    AuthSync.notifyAuthChange(true, randomUser.phone);
    
    // Verify data is clean
    setTimeout(() => {
      const isClean = ForceRefresh.verifyDataCleaned();
      if (isClean) {
        toast.success(`Successfully switched to ${randomUser.name}`);
      }
    }, 500);
  };
  
  const getCurrentUser = () => {
    const authStatus = AuthSync.getAuthStatus();
    console.log('Current user:', authStatus);
    toast.info(`Current: ${authStatus.userName || 'None'} (${authStatus.userPhone || 'No phone'})`);
  };
  
  const clearAllData = () => {
    console.log('🧹 MANUAL CLEAR: Clearing all user data...');
    AuthSync.clearUserData();
    AuthSync.notifyAuthChange(false);
    
    // Verify it's actually cleared
    setTimeout(() => {
      ForceRefresh.verifyDataCleaned();
    }, 200);
    
    toast.success('All user data cleared');
  };
  
  const addTestCart = () => {
    const testCart = {
      'product1|variant1|Red': { quantity: 2, perPanelSqFt: 10, totalPanelSqFt: 20 },
      'product2|variant2|Blue': { quantity: 1, perPanelSqFt: 5, totalPanelSqFt: 5 }
    };
    
    localStorage.setItem('cart', JSON.stringify(testCart));
    toast.success('Test cart items added');
    console.log('🛒 Test cart added:', testCart);
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="font-bold mb-2 text-sm">🧪 User Isolation Test</h3>
      <div className="flex flex-col gap-2">
        <button 
          onClick={testUserSwitch}
          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          Switch User
        </button>
        <button 
          onClick={getCurrentUser}
          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
        >
          Current User
        </button>
        <button 
          onClick={addTestCart}
          className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
        >
          Add Test Cart
        </button>
        <button 
          onClick={clearAllData}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}