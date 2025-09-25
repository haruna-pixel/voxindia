/**
 * Force refresh utility to ensure clean state after user switch
 */

export const ForceRefresh = {
  /**
   * Force a hard refresh of the page to ensure clean state
   * Use this as last resort when user switching isn't working
   */
  forcePageRefresh() {
    console.log('\ud83d\udd04 FORCE REFRESH: Reloading page for clean state...');
    window.location.reload();
  },

  /**
   * Clear all possible storage and force refresh
   */
  completeReset() {
    console.log('\ud83e\uddf9 COMPLETE RESET: Clearing everything and refreshing...');
    
    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Force page reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  },

  /**
   * Verify data is actually cleared
   */
  verifyDataCleaned() {
    const cart = localStorage.getItem('cart');
    const userPhone = sessionStorage.getItem('user_phone');
    const userAddress = localStorage.getItem('user_address');
    
    console.log('Data verification:', {
      cart: cart ? 'STILL EXISTS' : 'CLEARED',
      userPhone: userPhone ? 'STILL EXISTS' : 'CLEARED', 
      userAddress: userAddress ? 'STILL EXISTS' : 'CLEARED'
    });
    
    // If data still exists, force refresh
    if (cart || userPhone || userAddress) {
      console.log('\u26a0\ufe0f OLD DATA STILL EXISTS! Forcing page refresh...');
      this.forcePageRefresh();
      return false;
    }
    
    console.log('\u2705 All data successfully cleared');
    return true;
  }
};