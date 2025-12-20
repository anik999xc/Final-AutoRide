const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(authMiddleware.verifyAuth);

// Public landing and authentication routes
router.get('/', mainController.getSelectOnePage);
router.get('/login', mainController.getLoginPage);
router.get('/register', mainController.getRegisterPage);
router.get('/about', mainController.getAboutPage);
router.get('/careers', mainController.getCareersPage);
router.get('/terms', mainController.getTermsPage);
router.get('/privacy', mainController.getPrivacyPage);
router.get('/passenger_map', mainController.getPassenger_mapPage);

// Pages that should be accessible without login (but will show user data if logged in)
router.get('/home', mainController.getHomePage);
router.get('/profile', mainController.getProfilePage);
router.get('/payment', mainController.getPaymentPage);
router.get('/my-rides', mainController.getMyRidesPage);
router.get('/safety', mainController.getSafetyPage);
router.get('/refer', mainController.getReferPage);
router.get('/get-50', mainController.getGet50Page);
router.get('/rewards', mainController.getRewardsPage);
router.get('/power-pass', mainController.getPowerPassPage);
router.get('/rapido-coins', mainController.getRapidoCoinsPage);
router.get('/become-captain', mainController.getBecomeCaptainPage);
router.get('/driver_home', mainController.getDriver_homePage);
router.get('/settings', mainController.getSettingsPage);
router.get('/chat', mainController.getChatPage);
router.get('/admin', mainController.getAdminPage); // Changed 'route' to 'router'
router.get('/notification', mainController.getNotificationPage);
router.get('/developer', mainController.getDeveloperPage);// Changed 'route' to 'router'

// Authentication API routes
router.post('/auth/send-otp', mainController.sendOTP);
router.post('/login/verify', mainController.verifyLoginOTP);
router.post('/register/create', mainController.registerUser);

// Google Auth via Supabase
router.get('/auth/google', (req, res) => {
  const redirectUrl = 'https://mvqrscpeiwqowgfsqgji.supabase.co/auth/v1/authorize?provider=google';
  res.redirect(redirectUrl);
});

router.get('/auth/callback', (req, res) => {
  // Handle token
  res.redirect('/home'); // Corrected 'res.re' to 'res.redirect'
});

module.exports = router;