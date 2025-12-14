const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const cookieParser = require('cookie-parser');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

const app = express();

// Setup Socket.io with HTTP server
const http = require("http");
const socketio = require("socket.io"); 
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/cover', express.static(path.join(__dirname, 'uploads/cover')));

app.use('/upload', uploadRoutes);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Create a middleware for appending loading screen to every response
app.use((req, res, next) => {
    // Original render function
    const originalRender = res.render;
    
    // Override the render function
    res.render = function(view, options, callback) {
        // Default options object if none provided
        options = options || {};
        
        // Add loading screen resources to all responses
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
        
        // Call the original render function
        originalRender.call(this, view, options, callback);
    };
    
    next();
});

// Routes
app.use('/', routes);

// Socket.io connection
io.on("connection", (socket) => {
    console.log("New WebSocket connection");

    socket.on("userType", (type) => {
        console.log(`User connected as: ${type}`);
        socket.userType = type;
    });

    socket.on("send-location", (data) => {
        console.log("Received location:", data);
        
        // Broadcast to all clients except sender
        socket.broadcast.emit("location-update", {
            id: data.id,
            latitude: data.latitude,
            longitude: data.longitude,
            userType: socket.userType
        });
    });

    socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        // Notify others that this user has disconnected
        socket.broadcast.emit("user-disconnected", socket.id);
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
