// controllers/authController.js
const supabase = require('../config/db');
const crypto = require('crypto');

// Store OTPs temporarily (in a real app, use Redis or similar)
const otpStore = {
  // Structure: { phoneNumber: { otp: '123456', expires: Date, verified: false } }
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Common auth functions
exports.sendOTP = async (req, res) => {
  let { phoneNumber } = req.body;

  // Format phone number if it doesn't start with +
  if (phoneNumber && !phoneNumber.startsWith('+')) {
    phoneNumber = '+' + phoneNumber;
  }

  // More flexible validation - just check if it has + and 10-15 digits
  if (!phoneNumber || !/^\+?\d{10,15}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Valid phone number is required' });
  }

  try {
    // Generate a new OTP
    const otp = generateOTP();
    
    // Set expiration time (10 minutes)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    
    // Store OTP
    otpStore[phoneNumber] = {
      otp,
      expires,
      verified: false
    };
    
    // In a real application, send the OTP via SMS here
    console.log(`OTP for ${phoneNumber}: ${otp}`);
    
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // Only in development, remove in production:
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify OTP (generic function, can be used for different flows)
exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
  }

  try {
    // Check if OTP exists and is valid
    const otpData = otpStore[phoneNumber];

    if (!otpData || otpData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > otpData.expires) {
      delete otpStore[phoneNumber];
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Mark OTP as verified
    otpData.verified = true;

    return res.status(200).json({
      success: true,
      message: 'OTP verification successful'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// Logout function
exports.logout = async (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie('access_token');
    
    // Sign out from Supabase (if using Supabase sessions)
    await supabase.auth.signOut();
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout' });
  }
};

module.exports.otpStore = otpStore;
