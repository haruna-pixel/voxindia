# Cross-Tab Authentication Sync & User Isolation Test Guide

## Test the Authentication Synchronization & User Data Isolation

### Test Scenario 1: Same User - Multiple Tabs ✅ PRESERVED

1. **Login User A** (phone: 9876543210) in Tab 1:
   - Complete OTP verification
   - Add 3-5 items to cart
   - Save address information
   - **Verify**: Cart shows items, profile shows User A data

2. **Open Tab 2, Tab 3, Tab 4** with same website
3. **Expected Results**:
   - ✅ All tabs show User A logged in (9876543210)
   - ✅ All tabs show same cart items (3-5 items)
   - ✅ All tabs show same profile data
   - ✅ NO re-login required
   - ✅ Console shows: "SAME USER SESSION CONTINUING"
   - ✅ Console shows: "Action: Keeping existing data"

4. **Switch between tabs** - Should work seamlessly
5. **Add items in Tab 2** - Should appear in all tabs
6. **User A should NEVER need to login again across tabs**

### Test Scenario 2: User Data Isolation - Different Users 🔥 CRITICAL FIX

**STEP BY STEP TEST:**

1. **Login User A** (phone: 9876543210):
   - Complete OTP verification
   - Add 3-5 items to cart
   - Save address information
   - **Verify**: Cart shows items, profile shows User A data

2. **Open multiple tabs** - All should show User A logged in with cart items

3. **Login User B** (phone: 8765432109) in ANY tab:
   - **CRITICAL**: Use completely different phone number
   - Complete OTP verification

4. **EXPECTED RESULTS FOR DIFFERENT USERS** (🔥 MUST HAPPEN INSTANTLY):
   - ✅ Console shows: "DIFFERENT USER LOGIN DETECTED"
   - ✅ Console shows: "Old User: +919876543210, New User: +918765432109"
   - ✅ Console shows: "Action: Clearing old user's data"
   - ✅ ALL tabs immediately show User B (8765432109)
   - ✅ Cart is completely empty in ALL tabs
   - ✅ No User A profile data visible anywhere
   - ✅ User B gets fresh, empty forms
   - ✅ Toast shows: "Switched to user ending in 2109"

**EXPECTED RESULTS FOR SAME USER:**
   - ✅ Console shows: "SAME USER RE-AUTHENTICATING: +919876543210"
   - ✅ Console shows: "Action: Keeping existing data"
   - ✅ User A keeps all cart items and profile data
   - ✅ No data clearing happens

**IF OLD DATA STILL SHOWS:**
- Console will show: "⚠️ OLD DATA STILL EXISTS! Forcing page refresh..."
- Page will auto-refresh to ensure clean state

### Test Scenario 3: Cart Data Isolation 🔥 ENHANCED

1. **User A logs in** and adds multiple items to cart
2. **User A adds address and profile information**
3. **User B logs in different tab with different phone number**
4. **Expected Results**:
   - ✅ User A's cart is immediately cleared when User B logs in
   - ✅ User B sees completely empty cart initially  
   - ✅ User A's profile data (name, email, address) completely cleared
   - ✅ User B gets fresh profile form (no pre-filled data from User A)
   - ✅ No data leakage between users
   - ✅ Each user maintains completely isolated session
   - ✅ Console shows detailed user switching logs

### Test Scenario 4: Logout from One Tab, Check Other Tabs ✅

1. **With both tabs open and logged in**
2. **Logout from Tab A**: Click user menu → Logout
3. **Check Tab B**: Should automatically show logged out state
4. **Expected Result**: All tabs should sync to logged-out state

### Test Scenario 5: Switch Between Tabs ✅

1. **Login in Tab A**
2. **Open multiple new tabs** (Tab B, Tab C, etc.)
3. **Switch between tabs rapidly**
4. **Expected Result**: All tabs maintain consistent login state

### Test Scenario 7: Razorpay Phone Number Auto-Sync 🔥 NEW

1. **Login User A** (phone: 9876543210)
2. **Add items to cart and proceed to checkout**
3. **Click "Pay with Razorpay" button**
4. **Expected Results**:
   - ✅ Console shows: "User details for Razorpay prefill"
   - ✅ Console shows: "Opening Razorpay with prefilled data"
   - ✅ Razorpay popup opens with phone number: 9876543210 (auto-filled)
   - ✅ Razorpay popup shows user's name (auto-filled)
   - ✅ Razorpay popup shows user's email (auto-filled)
   - ✅ User doesn't need to manually enter phone number

5. **Different User Test**:
   - **Login User B** (phone: 8765432109)
   - **Proceed to payment**
   - ✅ Razorpay shows: 8765432109 (User B's phone)
   - ✅ No old user's phone number visible

## Technical Verification Points

### Real-time Sync Methods Used:
- ✅ **localStorage Events**: Cross-tab communication via `auth_sync` key with user ID
- ✅ **Custom Events**: Same-tab immediate updates
- ✅ **Focus Events**: Refresh state when switching tabs
- ✅ **Periodic Checks**: Backup sync every 2 seconds
- ✅ **Hydration Safety**: No SSR mismatches
- 🔥 **User ID Tracking**: Detects when different user logs in
- 🔥 **Data Isolation**: Automatic data clearing on user switch

### User Isolation Features:
- 🔥 **User ID Detection**: Uses phone number as unique identifier
- 🔥 **Automatic Data Clearing**: sessionStorage and localStorage cleared on user switch
- 🔥 **Cart Isolation**: Each user gets fresh cart data
- 🔥 **Cross-tab Notifications**: All tabs notified when different user logs in

### Debug Console Commands:
```javascript
// Check current auth status with user ID
AuthSync.getAuthStatus()

// Manually trigger auth sync with user ID
AuthSync.notifyAuthChange(true, '+919876543210')

// Check if user has changed
const syncData = { userId: '+918765432109', authenticated: true };
AuthSync.hasUserChanged(syncData)

// Check sessionStorage
console.log({
  verified: sessionStorage.getItem('otp_verified'),
  phone: sessionStorage.getItem('user_phone'),
  name: sessionStorage.getItem('user_name')
})

// Check cart data
console.log('Cart:', JSON.parse(localStorage.getItem('cart') || '{}'))
```

## What Should Work Now:

1. **✅ No Login Prompts**: Opening new tabs won't ask for re-authentication
2. **✅ Instant Logout Sync**: Logout in one tab immediately affects all tabs
3. **✅ Tab Switching**: Seamless experience when switching between tabs  
4. **✅ No Hydration Errors**: Clean page loads without React mismatch errors
5. **✅ Backup Mechanisms**: Multiple sync methods ensure reliability
6. **🔥 User Data Isolation**: Different users don't see each other's data
7. **🔥 Cart Data Clearing**: Previous user's cart is cleared when new user logs in
8. **🔥 Cross-tab User Detection**: All tabs detect when different user logs in
9. **🔥 Automatic Data Protection**: No manual clearing needed - handled automatically

## If Issues Persist:

- Check browser console for "Different user detected" messages
- Verify sessionStorage contains authentication data for correct user
- Test with browser dev tools network tab to see if API calls are working
- Try clearing localStorage/sessionStorage and testing fresh login with different users
- Check that phone numbers are different when testing user switching