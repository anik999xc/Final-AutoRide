const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require("http");
const socketio = require("socket.io"); 

// ১. Load environment variables
dotenv.config();

// Routes import
const routes = require('./routes/index');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ২. PORT কনফিগারেশন
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Recommend: 'true' rakha bhalo nested object er jonne, tobe 'false' eo kaj korbe
app.use(cookieParser());

// Static files
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/cover', express.static(path.join(__dirname, 'uploads/cover')));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- গুরুত্বপূর্ণ: /config রাউটটি সবার উপরে রাখতে হবে যেন HTML এর বদলে JSON রিটার্ন করে ---
app.get('/config', (req, res) => {
    res.json({
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
    });
});

// ৩. EJS Locals Middleware (Security Optimized)
app.use((req, res, next) => {
    res.locals.env = {
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
        EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
        EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY,
    };
    next();
});

// ৪. Loading screen middleware
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
        options = options || {};
        if (!options.layout) {
            options.loadingCss = '<link rel="stylesheet" href="/css/loading.css">';
            options.loadingJs = '<script src="/js/loading.js"></script>';
            options.loadingScreen = `
                <div id="loading-overlay">
                    <div class="loading-content">
                        <img src="/img/logo.png" alt="Logo" class="loading-logo">
                        <div class="spinner-3d"></div>
                    </div>
                </div>
            `;
        }
        originalRender.call(this, view, options, callback);
    };
    next();
});

// --- NEW ROUTE START: Map Data Handling ---
// Home page theke POST request handle korar jonne
app.post('/passenger_map', (req, res) => {
    const { pickup_name, pickup_lat, pickup_lng, drop_name, drop_lat, drop_lng } = req.body;

    console.log("Received Booking Data:", req.body); // Debugging er jonne console log

    // Data gulo passenger_map.ejs e pathano hocche
    res.render('passenger_map', { 
        rideData: {
            pickup: { 
                name: pickup_name, 
                lat: parseFloat(pickup_lat), 
                lng: parseFloat(pickup_lng) 
            },
            drop: { 
                name: drop_name, 
                lat: parseFloat(drop_lat), 
                lng: parseFloat(drop_lng) 
            }
        }
    });
});
// --- NEW ROUTE END ---

// Existing Routes
app.use('/upload', uploadRoutes);
app.use('/', routes);

// Socket.io logic
io.on("connection", (socket) => {
    socket.on("userType", (type) => {
        socket.userType = type;
    });
    socket.on("send-location", (data) => {
        socket.broadcast.emit("location-update", {
            id: data.id,
            latitude: data.latitude,
            longitude: data.longitude,
            userType: socket.userType
        });
    });
    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconnected", socket.id);
    });
});

// Error handlers
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});