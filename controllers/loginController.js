// controllers/loginController.js
const supabase = require('../config/db');
const { otpStore } = require('./authController');

// Render login page
exports.getLoginPage = (req, res) => {
  res.render('login', { title: 'Login', user: req.user || null });
};

// Verify OTP for login
exports.verifyLoginOTP = async (req, res) => {
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

    // Check if user exists in Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !users) {
      return res.status(404).json({ success: false, message: 'User not found, please register' });
    }

    // Mark OTP as verified
    otpData.verified = true;

    // Create a session
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: users.email || `${phoneNumber.replace('+', '')}@example.com`,
      password: process.env.DEFAULT_USER_PASSWORD || 'defaultpassword123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(500).json({ success: false, message: 'Authentication failed' });
    }

    // Set token in cookies (in a real app, use secure and httpOnly cookies)
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      redirect: '/home'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
