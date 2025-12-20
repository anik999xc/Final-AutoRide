// controllers/registerController.js
const supabase = require('../config/db');
const { otpStore } = require('./authController');

// Render register page
exports.getRegisterPage = (req, res) => {
  res.render('register', { title: 'Register', user: req.user || null });
};

// Register a new user
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
