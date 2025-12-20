const supabase = require('../config/db');

exports.verifyAuth = async (req, res, next) => {
  // List of routes that don't require authentication
  const publicRoutes = [
    '/home',
    '/profile',
    '/payment',
    '/my-rides',
    '/safety',
    '/refer',
    '/get-50',
    '/rewards',
    '/power-pass',
    '/rapido-coins',
    '/become-captain',
    '/settings',
    '/chat',
    '/',
    '/login',
    '/register',
    '/about',
    '/careers',
    '/terms',
    '/privacy',
    '/admin',
    '/notification',
    '/developer',
    '/passenger_map',
    '/driver_home'
  ];

  // Check if the requested path is in the public routes
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    // If the route is public, add user data to request if available but don't require auth
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          req.user = user;
        }
      } catch (error) {
        console.log('Non-critical auth error:', error.message);
      }
    }
    return next();
  }

  // For protected routes, enforce authentication
  const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.redirect('/login');
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.redirect('/login');
    }

    // Add user data to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.redirect('/login');
  }
};
