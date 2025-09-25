/**
 * Cross-tab authentication synchronization utility
 * Ensures authentication state is consistent across all browser tabs
 * Handles user switching and data isolation
 */

export const AuthSync = {
  /**
   * Notify all tabs about authentication state change
   * @param {boolean} isAuthenticated - Current authentication status
   * @param {string} userId - Optional user ID for user switching detection
   */
  notifyAuthChange(isAuthenticated, userId = null) {
    const syncData = {
      timestamp: Date.now(),
      authenticated: isAuthenticated,
      userId: userId || sessionStorage.getItem('user_phone') || 'unknown'
    };
    
    // Use localStorage to trigger storage events in other tabs
    localStorage.setItem('auth_sync', JSON.stringify(syncData));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: syncData
    }));
  },

  /**
   * Get current authentication status from sessionStorage
   * @returns {object} Authentication data
   */
  getAuthStatus() {
    if (typeof window === 'undefined') return { isAuthenticated: false };
    
    const isAuthenticated = sessionStorage.getItem('otp_verified') === 'true';
    const userPhone = sessionStorage.getItem('user_phone') || '';
    const userName = sessionStorage.getItem('user_name') || '';
    const userEmail = sessionStorage.getItem('user_email') || '';
    const userId = userPhone || 'unknown';
    
    return {
      isAuthenticated,
      userPhone,
      userName,
      userEmail,
      userId
    };
  },

  /**
   * Clear all user data from storage - Complete cleanup
   */
  clearUserData() {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 Clearing all user data for fresh session...');
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Clear cart data from localStorage
    localStorage.removeItem('cart');
    
    // Clear any user-specific localStorage data
    localStorage.removeItem('user_address');
    localStorage.removeItem('user_preferences');
    
    // Clear any cached API responses
    localStorage.removeItem('cached_products');
    localStorage.removeItem('cached_user_data');
    
    console.log('✅ All user data cleared successfully');
  },

  /**
   * Check if current user is different from sync data
   * @param {object} syncData - Sync data from storage event
   * @returns {boolean} True if user has changed
   */
  hasUserChanged(syncData) {
    if (!syncData || !syncData.userId) return false;
    
    const currentAuth = this.getAuthStatus();
    const currentUserId = currentAuth.userId;
    const newUserId = syncData.userId;
    
    // IMPORTANT: Only consider it a user change if:
    // 1. New user is authenticating (syncData.authenticated = true)
    // 2. Current user is also authenticated (currentAuth.isAuthenticated = true)
    // 3. Phone numbers are actually different
    const isDifferentUser = currentUserId !== newUserId;
    const bothUsersAuthenticated = syncData.authenticated && currentAuth.isAuthenticated;
    const shouldClearData = isDifferentUser && bothUsersAuthenticated && currentUserId && newUserId;
    
    if (shouldClearData) {
      console.log(`🔄 DIFFERENT USER LOGIN DETECTED:`);
      console.log(`   Old User: ${currentUserId}`);
      console.log(`   New User: ${newUserId}`);
      console.log(`   Action: Clearing old user's data`);
    } else if (isDifferentUser && syncData.authenticated) {
      console.log(`✅ SAME USER SESSION CONTINUING:`);
      console.log(`   User: ${newUserId}`);
      console.log(`   Action: Keeping existing data`);
    }
    
    return shouldClearData;
  },

  /**
   * Setup authentication state synchronization for a component
   * @param {function} onAuthChange - Callback function when auth state changes
   * @param {function} onUserSwitch - Callback function when different user logs in
   * @returns {function} Cleanup function
   */
  setupSync(onAuthChange, onUserSwitch = null) {
    if (typeof window === 'undefined') return () => {};

    const handleStorageChange = (e) => {
      if (e.key === 'auth_sync') {
        try {
          const syncData = JSON.parse(e.newValue || '{}');
          
          // Check if a different user has logged in
          if (this.hasUserChanged(syncData)) {
            console.log('🔥 CRITICAL: Different user detected via storage event!');
            console.log('OLD USER DATA BEING CLEARED IMMEDIATELY...');
            
            // IMMEDIATE aggressive data clearing
            this.clearUserData();
            
            if (onUserSwitch) onUserSwitch(syncData);
          }
          
          onAuthChange();
        } catch (error) {
          console.error('Error parsing auth sync data:', error);
          onAuthChange(); // Fallback to regular sync
        }
      }
    };

    const handleCustomEvent = (event) => {
      const syncData = event.detail;
      
      // Check if a different user has logged in
      if (this.hasUserChanged(syncData)) {
        console.log('🔥 CRITICAL: Different user detected via custom event!');
        console.log('AGGRESSIVE DATA CLEARING IN PROGRESS...');
        
        // IMMEDIATE aggressive data clearing
        this.clearUserData();
        
        if (onUserSwitch) onUserSwitch(syncData);
      }
      
      onAuthChange();
    };

    const handleFocus = () => {
      onAuthChange();
    };

    // Periodic check as fallback
    const intervalCheck = setInterval(onAuthChange, 2000);

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleCustomEvent);
    window.addEventListener('focus', handleFocus);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalCheck);
    };
  }
};