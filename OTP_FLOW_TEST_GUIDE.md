# Phone OTP Flow Test Guide

## Testing the Multiple OTP Issue Fix

This guide will help you test that the phone OTP verification system now works correctly and only triggers OTP when necessary.

## Test Scenarios

### Scenario 1: First-time User Login ✅
**Expected:** Single OTP verification required
1. Visit the website as a new user
2. Try to add items to cart and checkout
3. Should be prompted for phone verification (AuthModal opens)
4. Enter phone number and verify OTP
5. Should be able to proceed to checkout without additional OTP

### Scenario 2: Returning User with Same Phone ✅
**Expected:** No additional OTP required
1. Login with previously verified phone number
2. Add items to cart
3. Go to checkout
4. Phone number should be pre-filled
5. Should proceed directly to payment without OTP

### Scenario 3: User Changes Phone Number ⚠️
**Expected:** OTP required only for new number
1. Login with verified phone
2. Go to checkout
3. Edit address and change phone number
4. Should show warning that verification is needed
5. Should require OTP verification for new number
6. After verification, should proceed normally

### Scenario 4: Payment Gateway ✅
**Expected:** Pre-filled phone, no additional verification
1. Complete checkout flow
2. Razorpay popup should show pre-filled phone number
3. No additional OTP prompts should appear

## Visual Indicators to Check

### AuthModal
- ✅ Green checkmark when phone is already verified
- ⚠️ Warning when phone number is changed
- \"Continue\" button instead of \"Send OTP\" for verified phones

### Address Forms
- ✅ Green border for verified phone numbers
- ⚠️ Yellow border for changed phone numbers
- Warning message when phone is changed
- Disabled save button until phone is verified

### Cart Sidebar
- Shows logged-in status with verified phone
- \"Verify Now\" button only when needed

## Technical Implementation Details

### New Hook: usePhoneVerification
- Centralizes phone verification state
- Tracks original verified phone
- Detects phone number changes
- Provides unified verification status

### Updated Components
1. **AuthModal**: Smart OTP sending logic
2. **OrderSummary**: Pre-filled forms, change detection
3. **CartSidebar**: Improved verification checks
4. **Payment**: Pre-filled contact info

### SessionStorage Keys
- `otp_verified`: Boolean verification status
- `user_phone`: Verified phone number with +91 prefix
- `user_name`: User name
- `user_email`: User email

## Expected User Experience

### Good Flow (No Extra OTPs)
1. User logs in once → Phone verified ✅
2. Browses and adds to cart → No verification needed
3. Goes to checkout → Phone pre-filled ✅
4. Proceeds to payment → Phone pre-filled in Razorpay ✅
5. **Total OTPs: 1** (only initial login)

### Phone Change Flow (OTP Only When Needed)
1. User logged in with verified phone ✅
2. Changes phone in address form → Warning shown ⚠️
3. Verification required for new number → OTP sent 📱
4. After verification → Normal flow resumes ✅
5. **Total OTPs: 2** (initial + phone change)

## Error Cases to Test

1. **Network failure during OTP** - Should show retry option
2. **Invalid OTP** - Should allow retry without resending
3. **Phone format variations** - Should normalize correctly
4. **Multiple browser tabs** - Should sync verification status
5. **Page refresh** - Should maintain verification state

## Success Criteria

✅ **Primary Goal Achieved**: User only needs to verify phone once per session
✅ **Secondary Goal**: Phone number pre-filled throughout journey  
✅ **Tertiary Goal**: OTP only triggered when phone actually changes
✅ **UX Goal**: Clear visual indicators for verification status
✅ **Technical Goal**: Centralized verification state management

## Files Modified

1. `/hooks/usePhoneVerification.js` - New centralized hook
2. `/context/AuthModal.jsx` - Smart OTP logic
3. `/components/OrderSummary.jsx` - Pre-fill and change detection
4. `/components/CartSidebar.jsx` - Updated verification checks

## Notes for Developers

- The system uses sessionStorage for persistence across page loads
- Phone numbers are normalized for comparison (removes +91, spaces, etc.)
- Visual feedback helps users understand verification status
- Razorpay integration includes pre-filled contact information
- Error handling provides clear user feedback
- State management prevents race conditions between components