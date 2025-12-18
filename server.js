const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const cookieParser = require('cookie-parser');
const uploadRoutes = require('./routes/upload');

// ১. Load environment variables (সবার উপরে রাখাই ভালো)
dotenv.config();

const app = express();

// Setup Socket.io with HTTP server
const http = require("http");
const socketio = require("socket.io"); 
const server = http.createServer(app);
const io = socketio(server);

// ২. PORT কনফিগারেশন
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static files
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/cover', express.static(path.join(__dirname, 'uploads/cover')));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ৩. নতুন মিডলওয়্যার: .env ভ্যালুগুলো EJS-এ পাঠানোর জন্য (এটি গুরুত্বপূর্ণ)
app.use((req, res, next) => {
    res.locals.env = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY,
        EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
        EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
        EMAILJS_WELCOME_TEMPLATE_ID: process.env.EMAILJS_WELCOME_TEMPLATE_ID
    };
    next();
});

// ৪. Loading screen middleware (আপনার আগের লজিক অপরিবর্তিত রাখা হয়েছে)
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

// Routes
app.use('/upload', uploadRoutes);
app.use('/', routes);

// Socket.io logic (অপরিবর্তিত)
io.on("connection", (socket) => {
    console.log("New WebSocket connection");
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
