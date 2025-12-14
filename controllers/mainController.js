// mainController.js
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

// Basic home page
exports.getHomePage = (req, res) => {
  res.render('home', { title: 'Home', user: req.user || null });
};

exports.getDriver_homePage = (req, res) => {
  res.render('driver_home', { title: 'Driver_home', user: req.user || null });
};
// Admin page
exports.getAdminPage = (req, res) => {
  res.render('admin', { title: 'admin', user: req.user || null });
};

// notification page
exports.getNotificationPage = (req, res) => {
  res.render('notification', { title: 'notification', user: req.user || null });
};
// Admin page
exports.getDeveloperPage = (req, res) => {
  res.render('developer', { title: 'developer', user: req.user || null });
};

// About page
exports.getAboutPage = (req, res) => {
  res.render('about', { title: 'About Us', user: req.user || null });
};

exports.getPassenger_mapPage = (req, res) => {
  res.render('passenger_map', { title: 'Passenger_map', user: req.user || null });
};

// Careers page
exports.getCareersPage = (req, res) => {
  res.render('careers', { title: 'Careers', user: req.user || null });
};

// Terms page
exports.getTermsPage = (req, res) => {
  res.render('terms', { title: 'Terms of Service', user: req.user || null });
};

// Privacy page
exports.getPrivacyPage = (req, res) => {
  res.render('privacy', { title: 'Privacy Policy', user: req.user || null });
};

// Login page
exports.getLoginPage = (req, res) => {
  res.render('login', { title: 'Login', user: req.user || null });
};

// Register page
exports.getRegisterPage = (req, res) => {
  res.render('register', { title: 'Register', user: req.user || null });
};

// Select One page (passenger or captain)
exports.getSelectOnePage = (req, res) => {
  res.render('select_one', { title: 'Choose User Type', user: req.user || null });
};

// Profile page
exports.getProfilePage = (req, res) => {
  res.render('profile', { title: 'My Profile', user: req.user || null });
};

// Payment page
exports.getPaymentPage = (req, res) => {
  res.render('payment', { title: 'Payment', user: req.user || null });
};

// My Rides page
exports.getMyRidesPage = (req, res) => {
  res.render('my_rides', { title: 'My Rides', user: req.user || null });
};

// Safety page
exports.getSafetyPage = (req, res) => {
  res.render('safety', { title: 'Safety', user: req.user || null });
};

// Refer and Earn page
exports.getReferPage = (req, res) => {
  res.render('refer', { title: 'Refer and Earn', user: req.user || null });
};

// Get ₹50 page
exports.getGet50Page = (req, res) => {
  res.render('get_50', { title: 'Get ₹50', user: req.user || null });
};

// My Rewards page
exports.getRewardsPage = (req, res) => {
  res.render('rewards', { title: 'My Rewards', user: req.user || null });
};

// Power Pass page
exports.getPowerPassPage = (req, res) => {
  res.render('power_pass', { title: 'Power Pass', user: req.user || null });
};

// Rapido Coins page
exports.getRapidoCoinsPage = (req, res) => {
  res.render('rapido_coins', { title: 'Rapido Coins', user: req.user || null });
};

// Become a Captain page
exports.getBecomeCaptainPage = (req, res) => {
  res.render('become_captain', { title: 'Become a Captain!', user: req.user || null });
};

// Settings page
exports.getSettingsPage = (req, res) => {
  res.render('settings', { title: 'Settings', user: req.user || null });
};

// Chat With Us page
exports.getChatPage = (req, res) => {
  res.render('chat', { title: 'Chat With Us', user: req.user || null });
};

// Send OTP function
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

// Verify Login OTP function
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

// Register a new user function
exports.registerUser = async (req, res) => {
  let { phoneNumber, fullName, address, age, emergencyContact } = req.body;

  // Format phone number if it doesn't start with +
  if (phoneNumber && !phoneNumber.startsWith('+')) {
    phoneNumber = '+' + phoneNumber;
  }

  // Validate required fields
  if (!phoneNumber || !fullName || !address || !age || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if OTP was verified
    const otpData = otpStore[phoneNumber];
    if (!otpData || !otpData.verified) {
      return res.status(400).json({ success: false, message: 'Phone number not verified' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create a new user with Supabase Auth
    const email = `${phoneNumber.replace('+', '')}@example.com`;
    const password = process.env.DEFAULT_USER_PASSWORD || 'defaultpassword123';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      phone: phoneNumber
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(500).json({ success: false, message: 'Failed to create user account' });
    }

    // Store user data in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          phone_number: phoneNumber,
          full_name: fullName,
          address: address,
          age: parseInt(age),
          emergency_contact: emergencyContact,
          created_at: new Date().toISOString()
        }
      ]);

    if (userError) {
      console.error('Database error:', userError);
      return res.status(500).json({ success: false, message: 'Failed to store user data' });
    }

    // Set token in cookies
    res.cookie('access_token', authData.session.access_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      redirect: '/home'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ success: false, message: 'Failed to register user' });
  }
};

module.exports.otpStore = otpStore;
